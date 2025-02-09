import type { Express } from "express";
import { createServer, type Server } from "http";
import { generateDesign } from "./lib/replicate";
import { setupAuth } from "./auth";
import { detectObjectsInImage } from "./lib/replicate-detectors";

export function registerRoutes(app: Express): Server {
  // Set up authentication routes
  setupAuth(app);

  // Ensure REPLICATE_API_TOKEN is set
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error("Warning: REPLICATE_API_TOKEN environment variable is not set");
  }

  app.post("/api/detect-objects", async (req, res) => {
    try {
      const { image } = req.body;

      if (!image) {
        return res.status(400).json({
          message: "Image is required",
        });
      }

      const detectionResult = await detectObjectsInImage(image);
      res.json(detectionResult);
    } catch (error: any) {
      console.error("Object detection error:", error);
      res.status(500).json({
        message: error.message || "Failed to detect objects in image",
      });
    }
  });

  app.post("/api/generate", async (req, res) => {
    try {
      const { image, style, roomType, colorTheme, prompt } = req.body;

      if (!image || !style) {
        return res.status(400).json({
          message: "Image and style are required",
        });
      }

      const designs = await generateDesign(image, style, roomType, colorTheme, prompt);
      res.json({ designs });
    } catch (error) {
      console.error("Generate error:", error);
      res.status(500).json({
        message: "Failed to generate designs",
      });
    }
  });

  app.post("/api/virtual-staging", async (req, res) => {
    try {
      const { image, areas, furnitureId } = req.body;

      if (!image || !areas || !furnitureId) {
        return res.status(400).json({
          message: "Image, selected areas, and furniture are required",
        });
      }

      // For now, return the original image along with the staging information
      // The actual overlay will be handled on the client side
      res.json({
        originalImage: image,
        areas,
        furnitureId,
      });
    } catch (error) {
      console.error("Virtual staging error:", error);
      res.status(500).json({
        message: "Failed to generate staged design",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}