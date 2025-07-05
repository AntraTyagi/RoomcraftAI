<<<<<<< HEAD
import express, { Express, Request, Response, NextFunction } from "express";
=======
import type { Express } from "express";
>>>>>>> 67d56753a5fe62bb581f258b91f41dbd00a3feff
import { createServer, type Server } from "http";
import { generateDesign } from "./lib/replicate";
import { setupAuth } from "./auth";
import { inpaintFurniture } from "./lib/replicate-inpainting";
<<<<<<< HEAD
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
=======
import { User } from "./models/User";
import { CreditHistory } from "./models/CreditHistory";
import { authMiddleware } from "./middleware/auth";
import { connectDB } from "./lib/mongodb";
import axios from 'axios';

export function registerRoutes(app: Express): Server {
  // 1. Connect to MongoDB first
  connectDB();

  // 2. Set up authentication
>>>>>>> 67d56753a5fe62bb581f258b91f41dbd00a3feff
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

<<<<<<< HEAD
      // Update user credits using a more reliable method
      console.log(`Updating user credits from ${user.credits} to ${user.credits - 1}`);
      user.credits -= 1;
      await user.save();
      console.log(`Updated user credits: ${user.credits}`);
=======
      // Update user credits atomically
      console.log(`Updating user credits from ${user.credits} to ${user.credits - 1}`);
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $inc: { credits: -1 } },
        { new: true }
      );
      console.log(`Updated user credits: ${updatedUser?.credits}`);
>>>>>>> 67d56753a5fe62bb581f258b91f41dbd00a3feff

      return true;
    } catch (error) {
      console.error(`Error in credit deduction for user ${userId}:`, error);
      throw error;
    }
  };

<<<<<<< HEAD
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
=======
  app.get("/api/credits/balance", authMiddleware, async (req: any, res) => {
    try {
      console.log("Fetching credit balance for user:", req.user.id);
      const user = await User.findById(req.user.id);
>>>>>>> 67d56753a5fe62bb581f258b91f41dbd00a3feff
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
<<<<<<< HEAD
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
=======
  app.post("/api/generate", authMiddleware, async (req: any, res) => {
    try {
      console.log("Generate request received from user:", req.user.id);
      const { image, style, roomType, colorTheme, prompt } = req.body;

      if (!image || !style) {
        return res.status(400).json({
          message: "Image and style are required",
        });
      }

      // Generate designs first
      console.log("Generating designs with params:", { style, roomType, colorTheme });
      const result = await generateDesign(image, style, roomType, colorTheme, prompt);

      if (!result.designs || !result.designs.length) {
        throw new Error("No designs were generated");
      }

      // Only deduct credits if generation was successful
      try {
        await deductUserCredits(req.user.id, 'generate');
        console.log("Credits successfully deducted for generation");

        // Refresh credit balance
        const protocol = req.protocol;
        const host = req.get('host');
        const baseUrl = `${protocol}://${host}`;
        console.log("Making request to refresh credits at:", `${baseUrl}/api/credits/balance`);
        await axios.get(`${baseUrl}/api/credits/balance`, { 
          headers: { 
            Authorization: req.headers.authorization 
          }
        });

      } catch (error: any) {
        console.error("Credit deduction failed:", error);
        // Even if credit deduction fails, we still return the generated designs
        // but log the error for investigation
        console.error("Credit deduction failed but designs were generated:", error);
      }

      console.log("Designs generated successfully:", result.designs.length);
      res.json({ 
        designs: result.designs,
        unstagedRoom: result.unstagedRoom
      });
    } catch (error: any) {
      console.error("Generate error:", error);
      if (error.message === "Insufficient credits") {
        return res.status(403).json({ message: "Insufficient credits" });
      }
      res.status(500).json({
        message: error.message || "Failed to generate designs",
>>>>>>> 67d56753a5fe62bb581f258b91f41dbd00a3feff
      });
    }
  });

<<<<<<< HEAD
  // Protected route for inpainting
  app.post("/api/inpaint", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = authenticatedReq.user._id;
      console.log("Inpaint request received from user:", userId.toString());
      const { image, mask, prompt } = authenticatedReq.body;
=======
  // Protected route for inpainting - same logic applied here
  app.post("/api/inpaint", authMiddleware, async (req: any, res) => {
    try {
      console.log("Inpaint request received from user:", req.user.id);
      const { image, mask, prompt } = req.body;
>>>>>>> 67d56753a5fe62bb581f258b91f41dbd00a3feff

      if (!image || !mask || !prompt) {
        return res.status(400).json({
          message: "Image, mask, and prompt are required",
        });
      }

      // Do inpainting first
      const inpaintedImage = await inpaintFurniture(image, mask, prompt);

      // Only deduct credits if inpainting was successful
      try {
<<<<<<< HEAD
        await deductUserCredits(userId.toString(), 'inpaint');
        console.log("Credits successfully deducted for inpainting");

        // Refresh credit balance
        const protocol = authenticatedReq.protocol;
        const host = authenticatedReq.get('host');
        const baseUrl = `${protocol}://${host}`;
        await axios.get(`${baseUrl}/api/credits/balance`, { 
          headers: { 
            Authorization: authenticatedReq.headers.authorization 
=======
        await deductUserCredits(req.user.id, 'inpaint');
        console.log("Credits successfully deducted for inpainting");

        // Refresh credit balance
        const protocol = req.protocol;
        const host = req.get('host');
        const baseUrl = `${protocol}://${host}`;
        await axios.get(`${baseUrl}/api/credits/balance`, { 
          headers: { 
            Authorization: req.headers.authorization 
>>>>>>> 67d56753a5fe62bb581f258b91f41dbd00a3feff
          }
        });
      } catch (error: any) {
        console.error("Credit deduction failed:", error);
<<<<<<< HEAD
=======
        // Even if credit deduction fails, we still return the inpainted image
        // but log the error for investigation
>>>>>>> 67d56753a5fe62bb581f258b91f41dbd00a3feff
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

<<<<<<< HEAD
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
=======
  // Admin endpoints would go here if needed in the future

  const httpServer = createServer(app);
  return httpServer;
}
>>>>>>> 67d56753a5fe62bb581f258b91f41dbd00a3feff
