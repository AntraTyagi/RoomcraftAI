import type { Express } from "express";
import { createServer, type Server } from "http";
import { generateDesign } from "./lib/replicate";

export function registerRoutes(app: Express): Server {
  app.post("/api/generate", async (req, res) => {
    try {
      const { image, style, prompt } = req.body;

      if (!image || !style) {
        return res.status(400).json({
          message: "Image and style are required",
        });
      }

      const designs = await generateDesign(image, style, prompt);
      res.json({ designs });
    } catch (error) {
      console.error("Generate error:", error);
      res.status(500).json({
        message: "Failed to generate designs",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}