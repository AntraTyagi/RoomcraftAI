import type { Express } from "express";
import { createServer, type Server } from "http";
import { generateDesign } from "./lib/replicate";
import { setupAuth } from "./auth";
import { inpaintFurniture } from "./lib/replicate-inpainting";
import { User } from "./models/User";
import { authMiddleware, type AuthRequest } from "./middleware/auth";
import { connectDB } from "./lib/mongodb";

export function registerRoutes(app: Express): Server {
  // Connect to MongoDB
  connectDB();

  // Set up authentication routes
  setupAuth(app);

  // Ensure REPLICATE_API_KEY is set
  if (!process.env.REPLICATE_API_KEY) {
    console.error("Warning: REPLICATE_API_KEY environment variable is not set");
  }

  // Middleware to check user credits
  const checkCredits = async (req: AuthRequest, res: any, next: any) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.credits <= 0) {
        return res.status(403).json({ message: "Insufficient credits" });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: "Error checking credits" });
    }
  };

  // Protected route with credit check
  app.post("/api/inpaint", authMiddleware, checkCredits, async (req: AuthRequest, res) => {
    try {
      const { image, mask, prompt } = req.body;

      if (!image || !mask || !prompt) {
        return res.status(400).json({
          message: "Image, mask, and prompt are required",
        });
      }

      const inpaintedImage = await inpaintFurniture(image, mask, prompt);

      // Deduct credit after successful operation
      if (req.user) {
        await User.findByIdAndUpdate(req.user.id, { $inc: { credits: -1 } });
      }

      res.json({ inpaintedImage });
    } catch (error: any) {
      console.error("Inpainting error:", error);
      res.status(500).json({
        message: error.message || "Failed to inpaint image",
      });
    }
  });

  // Protected route with credit check
  app.post("/api/generate", authMiddleware, checkCredits, async (req: AuthRequest, res) => {
    try {
      const { image, style, roomType, colorTheme, prompt } = req.body;

      if (!image || !style) {
        return res.status(400).json({
          message: "Image and style are required",
        });
      }

      const designs = await generateDesign(image, style, roomType, colorTheme, prompt);

      // Deduct credit after successful operation
      if (req.user) {
        await User.findByIdAndUpdate(req.user.id, { $inc: { credits: -1 } });
      }

      res.json({ designs });
    } catch (error) {
      console.error("Generate error:", error);
      res.status(500).json({
        message: "Failed to generate designs",
      });
    }
  });

  // Get user profile and credits
  app.get("/api/user", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await User.findById(req.user?.id).select('-password');
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user profile" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}