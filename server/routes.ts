import type { Express } from "express";
import { createServer, type Server } from "http";
import { generateDesign } from "./lib/replicate";
import { setupAuth } from "./auth";
import { inpaintFurniture } from "./lib/replicate-inpainting";
import { User } from "./models/User";
import { CreditHistory } from "./models/CreditHistory";
import { authMiddleware } from "./middleware/auth";
import { connectDB } from "./lib/mongodb";

export function registerRoutes(app: Express): Server {
  // 1. Connect to MongoDB first
  connectDB();

  // 2. Set up authentication - this adds JWT auth setup
  setupAuth(app);

  // 3. Protected routes middleware
  const checkCredits = async (req: any, res: any, next: any) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.credits <= 0) {
        return res.status(403).json({ message: "Insufficient credits" });
      }
      next();
    } catch (error) {
      console.error("Credits check error:", error);
      res.status(500).json({ message: "Error checking credits" });
    }
  };

  // Helper function to handle credit deduction
  const deductUserCredits = async (userId: string, operationType: 'generate' | 'inpaint') => {
    try {
      // Check user credits first
      const user = await User.findById(userId).select('credits');
      if (!user) {
        throw new Error("User not found");
      }
      if (user.credits <= 0) {
        throw new Error("Insufficient credits");
      }

      // Record credit usage and update user credits atomically
      await Promise.all([
        CreditHistory.create({
          userId,
          operationType,
          description: `${operationType === 'generate' ? 'Design generation' : 'Inpainting operation'}`,
          creditsUsed: 1
        }),
        User.findByIdAndUpdate(userId, { $inc: { credits: -1 } })
      ]);

      return true;
    } catch (error) {
      console.error(`Error in credit deduction:`, error);
      throw error;
    }
  };

  // 4. Protected API routes - ensure authMiddleware is used for all protected routes
  app.get("/api/credits/history", authMiddleware, async (req: any, res) => {
    try {
      const history = await CreditHistory.find({ userId: req.user.id })
        .sort({ timestamp: -1 })
        .limit(50);
      res.json({ history });
    } catch (error) {
      console.error("Error fetching credit history:", error);
      res.status(500).json({ message: "Error fetching credit history" });
    }
  });

  app.get("/api/credits/balance", authMiddleware, async (req: any, res) => {
    try {
      const user = await User.findById(req.user.id).select('credits');
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
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

      // Check and deduct credits
      try {
        console.log("Checking credits for user:", req.user.id);
        await deductUserCredits(req.user.id, 'generate');
        console.log("Credits deducted successfully");
      } catch (error: any) {
        console.error("Credit deduction failed:", error);
        return res.status(403).json({ message: error.message || "Credit deduction failed" });
      }

      // Generate designs
      console.log("Generating designs with params:", { style, roomType, colorTheme });
      const designs = await generateDesign(image, style, roomType, colorTheme, prompt);

      if (!designs || !designs.length) {
        throw new Error("No designs were generated");
      }

      console.log("Designs generated successfully:", designs.length);
      res.json({ designs });
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

  // Protected route for inpainting
  app.post("/api/inpaint", authMiddleware, async (req: any, res) => {
    try {
      console.log("Inpaint request received from user:", req.user.id);
      const { image, mask, prompt } = req.body;

      if (!image || !mask || !prompt) {
        return res.status(400).json({
          message: "Image, mask, and prompt are required",
        });
      }

      // Deduct credits before inpainting
      await deductUserCredits(req.user.id, 'inpaint');

      const inpaintedImage = await inpaintFurniture(image, mask, prompt);
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

  const httpServer = createServer(app);
  return httpServer;
}