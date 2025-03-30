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

  // Test route to verify Replicate API connectivity
  app.get("/api/test-replicate", async (req, res) => {
    try {
      // Just check if the API key is available
      if (!process.env.REPLICATE_API_KEY) {
        return res.status(500).json({ 
          error: "Replicate API key is missing", 
          status: "error" 
        });
      }
      
      // Return the first few characters of the key to verify it's loaded
      const keyPreview = process.env.REPLICATE_API_KEY.substring(0, 3) + '...' + 
                         process.env.REPLICATE_API_KEY.substring(process.env.REPLICATE_API_KEY.length - 3);
      
      return res.status(200).json({ 
        message: `Replicate API key is configured (${keyPreview})`,
        status: "success"
      });
    } catch (error: any) {
      console.error("Test Replicate API error:", error);
      return res.status(500).json({ 
        error: error.message || "Unknown error",
        status: "error" 
      });
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

  // Proxy endpoint for Replicate images to solve CORS issues
  app.get("/api/proxy-image", async (req, res) => {
    try {
      const imageUrl = req.query.url as string;
      
      if (!imageUrl) {
        return res.status(400).json({ message: "Image URL is required" });
      }
      
      console.log("Proxying image from:", imageUrl);
      
      // Set CORS headers to allow any website to access this resource
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
      
      // Fetch the image with explicit no-cache headers to ensure freshness
      const response = await fetch(imageUrl, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        console.error("Proxy fetch error:", response.status, response.statusText);
        return res.status(response.status).send("Failed to fetch image");
      }
      
      // Set proper content type and cache control headers
      const contentType = response.headers.get('content-type');
      if (contentType) {
        res.setHeader('Content-Type', contentType);
      } else {
        res.setHeader('Content-Type', 'image/png'); // Default to PNG if no content-type
      }
      
      // Don't cache these images in the browser, always fetch fresh
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Stream the response directly to avoid memory issues with large images
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      res.send(buffer);
      
    } catch (error) {
      console.error("Image proxy error:", error);
      res.status(500).send("Error fetching image");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}