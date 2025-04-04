import type { Express } from "express";
import { createServer, type Server } from "http";
import { generateDesign } from "./lib/replicate";
import { setupAuth } from "./auth";
import { inpaintFurniture } from "./lib/replicate-inpainting";
import { User } from "./models/User";
import { CreditHistory } from "./models/CreditHistory";
import { authMiddleware } from "./middleware/auth";
import { connectDB } from "./lib/mongodb";
import axios from 'axios';

export function registerRoutes(app: Express): Server {
  // 1. Connect to MongoDB first
  connectDB();

  // 2. Set up authentication
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

      // Update user credits atomically
      console.log(`Updating user credits from ${user.credits} to ${user.credits - 1}`);
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $inc: { credits: -1 } },
        { new: true }
      );
      console.log(`Updated user credits: ${updatedUser?.credits}`);

      return true;
    } catch (error) {
      console.error(`Error in credit deduction for user ${userId}:`, error);
      throw error;
    }
  };

  app.get("/api/credits/balance", authMiddleware, async (req: any, res) => {
    try {
      console.log("Fetching credit balance for user:", req.user.id);
      const user = await User.findById(req.user.id);
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
      });
    }
  });

  // Protected route for inpainting - same logic applied here
  app.post("/api/inpaint", authMiddleware, async (req: any, res) => {
    try {
      console.log("Inpaint request received from user:", req.user.id);
      const { image, mask, prompt } = req.body;

      if (!image || !mask || !prompt) {
        return res.status(400).json({
          message: "Image, mask, and prompt are required",
        });
      }

      // Do inpainting first
      const inpaintedImage = await inpaintFurniture(image, mask, prompt);

      // Only deduct credits if inpainting was successful
      try {
        await deductUserCredits(req.user.id, 'inpaint');
        console.log("Credits successfully deducted for inpainting");

        // Refresh credit balance
        const protocol = req.protocol;
        const host = req.get('host');
        const baseUrl = `${protocol}://${host}`;
        await axios.get(`${baseUrl}/api/credits/balance`, { 
          headers: { 
            Authorization: req.headers.authorization 
          }
        });
      } catch (error: any) {
        console.error("Credit deduction failed:", error);
        // Even if credit deduction fails, we still return the inpainted image
        // but log the error for investigation
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

  // Admin endpoints would go here if needed in the future

  const httpServer = createServer(app);
  return httpServer;
}