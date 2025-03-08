import type { Express } from "express";
import { createServer, type Server } from "http";
import { generateDesign } from "./lib/replicate";
import { setupAuth } from "./auth";
import { inpaintFurniture } from "./lib/replicate-inpainting";
import { removeExistingFurniture } from "./lib/replicate";
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

  // Add credit balance endpoint
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

  // Helper function to handle credit deduction
  const deductUserCredits = async (userId: string, operationType: 'generate' | 'inpaint' | 'unstage') => {
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
        description: `${operationType === 'generate' ? 'Design generation' : operationType === 'inpaint' ? 'Inpainting operation' : 'Furniture removal'}`,
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

  // Helper function to refresh credit balance
  const refreshCreditBalance = async (req: any) => {
    try {
      const protocol = req.protocol;
      const host = req.get('host');
      const baseUrl = `${protocol}://${host}`;
      console.log(`Refreshing credit balance at: ${baseUrl}/api/credits/balance`);

      const response = await axios.get(`${baseUrl}/api/credits/balance`, { 
        headers: { 
          Authorization: req.headers.authorization 
        }
      });

      console.log('Credit balance refreshed successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to refresh credit balance:', error);
      throw new Error('Failed to refresh credit balance');
    }
  };

  // New endpoint for unstaging (furniture removal)
  app.post("/api/unstage", authMiddleware, async (req: any, res) => {
    try {
      console.log("Unstage request received from user:", req.user.id);
      const { image } = req.body;

      if (!image) {
        return res.status(400).json({
          message: "Image is required",
        });
      }

      // Remove furniture first
      console.log("Removing furniture from image");
      const emptyRoomUrl = await removeExistingFurniture(image);

      // Only deduct credits if removal was successful
      try {
        await deductUserCredits(req.user.id, 'unstage');
        console.log("Credits successfully deducted for unstaging");
        await refreshCreditBalance(req);
      } catch (error: any) {
        console.error("Credit deduction failed:", error);
        // Don't throw here, we still want to return the result
      }

      res.json({ emptyRoomUrl });
    } catch (error: any) {
      console.error("Unstage error:", error);
      if (error.message === "Insufficient credits") {
        return res.status(403).json({ message: "Insufficient credits" });
      }
      res.status(500).json({
        message: error.message || "Failed to remove furniture",
      });
    }
  });

  // Modified generate endpoint to use the unstaging result
  app.post("/api/generate", authMiddleware, async (req: any, res) => {
    try {
      console.log("Generate request received from user:", req.user.id);
      const { image, style, roomType, colorTheme, prompt } = req.body;

      if (!image || !style) {
        return res.status(400).json({
          message: "Image and style are required",
        });
      }

      // First, call the unstaging endpoint to get an empty room
      const unstageResponse = await axios.post(
        `${req.protocol}://${req.get('host')}/api/unstage`,
        { image },
        { headers: { Authorization: req.headers.authorization } }
      );

      const emptyRoomUrl = unstageResponse.data.emptyRoomUrl;

      // Generate designs using the empty room
      console.log("Generating designs with params:", { style, roomType, colorTheme });
      const designs = await generateDesign(emptyRoomUrl, style, roomType, colorTheme, prompt);

      if (!designs || !designs.length) {
        throw new Error("No designs were generated");
      }

      // Only deduct credits if generation was successful
      try {
        await deductUserCredits(req.user.id, 'generate');
        console.log("Credits successfully deducted for generation");
        await refreshCreditBalance(req);
      } catch (error: any) {
        console.error("Credit deduction failed:", error);
        // Don't throw here, we still want to return the designs
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

      // Do inpainting first
      const inpaintedImage = await inpaintFurniture(image, mask, prompt);

      // Only deduct credits if inpainting was successful
      try {
        await deductUserCredits(req.user.id, 'inpaint');
        console.log("Credits successfully deducted for inpainting");
        await refreshCreditBalance(req);
      } catch (error: any) {
        console.error("Credit deduction failed:", error);
        // Don't throw here, we still want to return the result
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

  // Add a temporary endpoint for admin operations (we'll remove this later)
  app.post("/api/admin/add-credits", authMiddleware, async (req: any, res) => {
    try {
      console.log("Add credits request received. User data:", req.user);
      if (!req.user || !req.user.id) {
        console.error("No user data in request");
        return res.status(401).json({ message: "Authentication required" });
      }

      console.log("Adding credits for user:", req.user.id);
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { $inc: { credits: 10 } }, 
        { new: true }
      );
      if (!user) {
        console.log("User not found when adding credits");
        return res.status(404).json({ message: "User not found" });
      }
      console.log("Updated credit balance:", user.credits);

      // Create credit history entry
      await CreditHistory.create({
        userId: req.user.id,
        operationType: 'generate', 
        description: 'Admin credit addition',
        creditsUsed: -10 
      });

      res.json({ credits: user.credits });
    } catch (error) {
      console.error("Error adding credits:", error);
      res.status(500).json({ message: "Error adding credits" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}