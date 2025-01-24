import type { Express } from "express";
import { createServer, type Server } from "http";
import { generateDesign } from "./lib/replicate";
import { setupAuth } from "./auth";

export function registerRoutes(app: Express): Server {
  // Set up authentication routes
  setupAuth(app);

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