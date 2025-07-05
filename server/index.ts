import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import passport from "passport";
import cors from "cors";
import { CONFIG } from "./config";
import { registerRoutes } from "./routes";
import { verifyEmailTransporter } from "./lib/email";
import { connectDB } from "./lib/mongodb";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../.env');
console.log('Loading environment variables from:', envPath);
dotenv.config({ path: envPath });

// Verify required environment variables
const requiredEnvVars = ['MONGODB_URI', 'GMAIL_USER', 'GMAIL_APP_PASSWORD', 'REPLICATE_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

const app = express();
const PORT = CONFIG.server.port;

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(
  cors({
    origin: CONFIG.server.domains,
    credentials: true,
  })
);

// Session configuration
app.use(
  session({
    secret: CONFIG.server.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: CONFIG.server.isProduction,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Setup email transporter
verifyEmailTransporter();

// Connect to MongoDB
connectDB();

// Register routes
const server = registerRoutes(app);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});