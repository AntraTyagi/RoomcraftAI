import express, { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { generateDesign } from "./lib/replicate";
import { setupAuth } from "./auth";
import { inpaintFurniture } from "./lib/replicate-inpainting";
import { User, IUser } from "./models/User";
import { CreditHistory } from "./models/CreditHistory";
import { isAuthenticated, AuthenticatedRequest } from "./middleware/auth";
import axios from 'axios';
import Replicate from "replicate";
import mongoose from 'mongoose';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const router = express.Router();

export function registerRoutes(app: Express): Server {
  // Set up authentication
  setupAuth(app);

  // Helper function to handle credit deduction
  const deductUserCredits = async (userId: string, operationType: 'generate' | 'inpaint') => {
    try {
      // Check user credits first
      console.log(`Checking credits for user ${userId}`);
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }
      console.log(`Current credits: ${user.credits}`);

      if (user.credits <= 0) {
        throw new Error("Insufficient credits");
      }

      // Record credit usage
      console.log(`Creating credit history record for ${operationType}`);
      const creditHistory = await CreditHistory.create({
        userId,
        operationType,
        description: `${operationType === 'generate' ? 'Design generation' : 'Inpainting operation'}`,
        creditsUsed: 1
      });
      console.log(`Credit history created: ${creditHistory._id}`);

      // Update user credits using a more reliable method
      console.log(`Updating user credits from ${user.credits} to ${user.credits - 1}`);
      user.credits -= 1;
      await user.save();
      console.log(`Updated user credits: ${user.credits}`);

      return true;
    } catch (error) {
      console.error(`Error in credit deduction for user ${userId}:`, error);
      throw error;
    }
  };

  // Add the missing /api/user endpoint
  app.get("/api/user", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = authenticatedReq.user._id;
      
      // Return the user data without sensitive information
      res.json({
        id: userId.toString(),
        email: authenticatedReq.user.email,
        username: authenticatedReq.user.username,
        name: authenticatedReq.user.name,
        credits: authenticatedReq.user.credits
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      res.status(500).json({ message: "Error fetching user data" });
    }
  });

  app.get("/api/credits/balance", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = authenticatedReq.user._id;
      console.log("Fetching credit balance for user:", userId.toString());
      const user = await User.findById(userId);
      if (!user) {
        console.log("User not found when fetching credits");
        return res.status(404).json({ message: "User not found" });
      }
      console.log("Current credit balance:", user.credits);
      res.json({ credits: user.credits });
    } catch (error) {
      console.error("Error fetching credit balance:", error);
      res.status(500).json({ message: "Error fetching credit balance" });
    }
  });

  // Protected route for generation
  app.post('/api/generate', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = authenticatedReq.user._id;
      const { image, style, roomType, colorTheme, prompt } = authenticatedReq.body;

      if (!image || !style || !roomType || !colorTheme) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check user credits
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.credits < 1) {
        return res.status(403).json({ error: 'Insufficient credits' });
      }

      // Generate designs
      const result = await generateDesign(image, roomType, style, colorTheme, prompt || '');

      // Update user credits using findByIdAndUpdate to preserve all fields
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { 
          $inc: { credits: -1 },
          $set: {
            username: user.username,
            email: user.email,
            name: user.name
          }
        },
        { new: true }
      );

      if (!updatedUser) {
        throw new Error('Failed to update user credits');
      }

      // Record credit usage
      await CreditHistory.create({
        userId: userId.toString(),
        creditsUsed: 1,
        operationType: 'generate',
        description: 'Design generation'
      });

      res.json(result);
    } catch (error: any) {
      console.error('Generate error:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to generate designs',
        details: error.stack
      });
    }
  });

  // Protected route for inpainting
  app.post("/api/inpaint", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = authenticatedReq.user._id;
      console.log("Inpaint request received from user:", userId.toString());
      const { image, mask, prompt } = authenticatedReq.body;

      if (!image || !mask || !prompt) {
        return res.status(400).json({
          message: "Image, mask, and prompt are required",
        });
      }

      // Do inpainting first
      const inpaintedImage = await inpaintFurniture(image, mask, prompt);

      // Only deduct credits if inpainting was successful
      try {
        await deductUserCredits(userId.toString(), 'inpaint');
        console.log("Credits successfully deducted for inpainting");

        // Refresh credit balance
        const protocol = authenticatedReq.protocol;
        const host = authenticatedReq.get('host');
        const baseUrl = `${protocol}://${host}`;
        await axios.get(`${baseUrl}/api/credits/balance`, { 
          headers: { 
            Authorization: authenticatedReq.headers.authorization 
          }
        });
      } catch (error: any) {
        console.error("Credit deduction failed:", error);
        console.error("Credit deduction failed but inpainting was successful:", error);
      }

      res.json({ inpaintedImage });
    } catch (error: any) {
      console.error("Inpainting error:", error);
      if (error.message === "Insufficient credits") {
        return res.status(403).json({ message: "Insufficient credits" });
      }
      res.status(500).json({
        message: error.message || "Failed to inpaint image",
      });
    }
  });

  app.post("/api/credits/use", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = authenticatedReq.user._id;
      const { credits } = authenticatedReq.body;
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.credits < credits) {
        return res.status(400).json({ message: "Insufficient credits" });
      }

      // Update credits while preserving all required fields
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { 
          $inc: { credits: -credits },
          $set: {
            username: user.username, // Preserve username
            email: user.email,      // Preserve email
            name: user.name         // Preserve name
          }
        },
        { new: true }
      );

      // Record credit usage
      await CreditHistory.create({
        userId: userId.toString(),
        operationType: 'use',
        description: 'Credits used for design generation',
        creditsUsed: credits
      });

      res.json({ 
        message: "Credits used successfully",
        remainingCredits: updatedUser?.credits 
      });
    } catch (error: any) {
      console.error("Error using credits:", error);
      res.status(500).json({ 
        message: "Failed to use credits",
        error: error.message 
      });
    }
  });

  // Add test credits
  router.post('/credits/add-test', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = authenticatedReq.user._id;
      console.log('Adding test credits for user:', userId.toString());
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Add 10 test credits
      user.credits += 10;
      await user.save();

      // Record credit addition
      await CreditHistory.create({
        userId: userId.toString(),
        creditsUsed: -10, // Negative to indicate addition
        operation: 'add',
        timestamp: new Date()
      });

      res.json({ message: 'Test credits added successfully', credits: user.credits });
    } catch (error: any) {
      console.error('Error adding test credits:', error);
      res.status(500).json({ message: 'Error adding test credits' });
    }
  });

  // Admin endpoints would go here if needed in the future

  // Error handling middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);
    return res.status(err.status || 500).json({
      message: err.message || 'Internal Server Error'
    });
  });

  // 404 handler
  app.use((req: Request, res: Response) => {
    return res.status(404).json({ message: 'Not Found' });
  });

  const httpServer = createServer(app);
  return httpServer;
}

export default router;