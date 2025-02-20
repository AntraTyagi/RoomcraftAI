import type { Express } from "express";
import { createServer, type Server } from "http";
import { generateDesign } from "./lib/replicate";
import { setupAuth } from "./auth";
import { inpaintFurniture } from "./lib/replicate-inpainting";
import { User } from "./models/User";
import { CreditHistory } from "./models/CreditHistory";
import { authMiddleware, type AuthRequest } from "./middleware/auth";
import { connectDB } from "./lib/mongodb";
import { generateToken } from "./lib/jwt"; // Import generateToken function

export function registerRoutes(app: Express): Server {
  // Connect to MongoDB
  connectDB();

  // Set up authentication routes
  setupAuth(app);

  // Ensure REPLICATE_API_KEY is set
  if (!process.env.REPLICATE_API_KEY) {
    console.error("Warning: REPLICATE_API_KEY environment variable is not set");
  }

  // Login endpoint
  app.post("/api/login", async (req: AuthRequest, res) => {
    try {
      const { username, password } = req.body;

      // Find user
      const user = await User.findOne({ email: username });
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate token
      const token = generateToken({
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
      });

      // Return user data and token
      res.json({
        user: {
          id: user._id.toString(),
          email: user.email,
          username: user.email,
          name: user.name,
          credits: user.credits,
        },
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Error logging in" });
    }
  });

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

  // Get credit history
  app.get("/api/credits/history", authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

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
  app.get("/api/credits/balance", authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

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

  // Protected route with credit check for inpainting
  app.post("/api/inpaint", authMiddleware, checkCredits, async (req: AuthRequest, res) => {
    try {
      const { image, mask, prompt } = req.body;

      if (!image || !mask || !prompt) {
        return res.status(400).json({
          message: "Image, mask, and prompt are required",
        });
      }

      const inpaintedImage = await inpaintFurniture(image, mask, prompt);

      // Record credit usage
      if (req.user) {
        await CreditHistory.create({
          userId: req.user.id,
          operationType: 'inpaint',
          description: 'Inpainting operation',
          creditsUsed: 1
        });

        // Deduct credit after successful operation
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

  // Protected route with credit check for generation
  app.post("/api/generate", authMiddleware, checkCredits, async (req: AuthRequest, res) => {
    try {
      const { image, style, roomType, colorTheme, prompt } = req.body;

      if (!image || !style) {
        return res.status(400).json({
          message: "Image and style are required",
        });
      }

      const designs = await generateDesign(image, style, roomType, colorTheme, prompt);

      // Record credit usage
      if (req.user) {
        await CreditHistory.create({
          userId: req.user.id,
          operationType: 'generate',
          description: 'Design generation',
          creditsUsed: 1
        });

        // Deduct credit after successful operation
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
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user._id.toString(),
        email: user.email,
        username: user.email,
        name: user.name,
        credits: user.credits,
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Error fetching user profile" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}