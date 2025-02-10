import type { Express } from "express";
import { createServer, type Server } from "http";
import { generateDesign } from "./lib/replicate";
import { setupAuth } from "./auth";
import { detectObjectsInImage } from "./lib/replicate-detectors";
import { inpaintFurniture } from "./lib/replicate-inpainting";
import { generateFurnitureImage } from "./lib/replicate-furniture";

export function registerRoutes(app: Express): Server {
  // Set up authentication routes
  setupAuth(app);

  // Ensure REPLICATE_API_KEY is set
  if (!process.env.REPLICATE_API_KEY) {
    console.error("Warning: REPLICATE_API_KEY environment variable is not set");
  }

  app.post("/api/detect-objects", async (req, res) => {
    try {
      const { image, query } = req.body;

      if (!image) {
        return res.status(400).json({
          message: "Image is required",
        });
      }

      const detectionResult = await detectObjectsInImage(image, query);
      res.json(detectionResult);
    } catch (error: any) {
      console.error("Object detection error:", error);
      res.status(500).json({
        message: error.message || "Failed to detect objects in image",
      });
    }
  });

  app.post("/api/inpaint", async (req, res) => {
    try {
      const { image, mask, prompt } = req.body;

      if (!image || !mask || !prompt) {
        return res.status(400).json({
          message: "Image, mask, and prompt are required",
        });
      }

      const inpaintedImage = await inpaintFurniture(image, mask, prompt);
      res.json({ inpaintedImage });
    } catch (error: any) {
      console.error("Inpainting error:", error);
      res.status(500).json({
        message: error.message || "Failed to inpaint image",
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

  app.post("/api/generate-furniture", async (req, res) => {
    try {
      const { type, index } = req.body;

      if (!type || typeof index !== "number") {
        return res.status(400).json({
          message: "Furniture type and index are required",
        });
      }

      const imageUrl = await generateFurnitureImage(type, index);
      res.json({ imageUrl });
    } catch (error) {
      console.error("Furniture generation error:", error);
      res.status(500).json({
        message: "Failed to generate furniture image",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}