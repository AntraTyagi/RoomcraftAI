import type { Express } from "express";
import { createServer, type Server } from "http";

export function registerRoutes(app: Express): Server {
  app.post("/api/generate", async (req, res) => {
    try {
      const { image, style, prompt } = req.body;

      if (!image || !style) {
        return res.status(400).json({
          message: "Image and style are required",
        });
      }

      // Here you would call the Replicate API
      // This is a mock response for now
      const mockDesigns = [
        "https://images.unsplash.com/photo-1600210491369-e753d80a41f3",
        "https://images.unsplash.com/photo-1669653862523-904e92ee90b4",
        "https://images.unsplash.com/photo-1534349762230-e0cadf78f5da",
        "https://images.unsplash.com/photo-1523575708161-ad0fc2a9b951",
      ];

      res.json({ designs: mockDesigns });
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
