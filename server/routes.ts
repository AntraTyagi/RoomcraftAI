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
  // Connect to MongoDB and set up auth - do this first
  connectDB();
  setupAuth(app);

  // Middleware to check user credits
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

  // Get credit history
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

  // Get current credit balance
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
  app.post("/api/generate", authMiddleware, checkCredits, async (req: any, res) => {
    try {
      const { image, style, roomType, colorTheme, prompt } = req.body;

      if (!image || !style) {
        return res.status(400).json({
          message: "Image and style are required",
        });
      }

      const designs = await generateDesign(image, style, roomType, colorTheme, prompt);

      // Record credit usage and update user credits
      await Promise.all([
        CreditHistory.create({
          userId: req.user.id,
          operationType: 'generate',
          description: 'Design generation',
          creditsUsed: 1
        }),
        User.findByIdAndUpdate(req.user.id, { $inc: { credits: -1 } })
      ]);

      res.json({ designs });
    } catch (error) {
      console.error("Generate error:", error);
      res.status(500).json({
        message: "Failed to generate designs",
      });
    }
  });

  // Protected route for inpainting
  app.post("/api/inpaint", authMiddleware, checkCredits, async (req: any, res) => {
    try {
      const { image, mask, prompt } = req.body;

      if (!image || !mask || !prompt) {
        return res.status(400).json({
          message: "Image, mask, and prompt are required",
        });
      }

      const inpaintedImage = await inpaintFurniture(image, mask, prompt);

      // Record credit usage and update user credits
      await Promise.all([
        CreditHistory.create({
          userId: req.user.id,
          operationType: 'inpaint',
          description: 'Inpainting operation',
          creditsUsed: 1
        }),
        User.findByIdAndUpdate(req.user.id, { $inc: { credits: -1 } })
      ]);

      res.json({ inpaintedImage });
    } catch (error: any) {
      console.error("Inpainting error:", error);
      res.status(500).json({
        message: error.message || "Failed to inpaint image",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}