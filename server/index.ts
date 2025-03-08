import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import { connectDB } from "./lib/mongodb";

const app = express();

// 1. Body parser middleware must come first
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Set trust proxy for secure cookies in Replit environment
app.set('trust proxy', 1);

// Connect to MongoDB first
connectDB();

// Setup session middleware
const sessionMiddleware = session({
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/roomcraft',
    collectionName: 'sessions',
    ttl: 24 * 60 * 60, // 1 day
    autoRemove: 'native',
    touchAfter: 24 * 3600, // Disable automatic updates for sessions that haven't changed
    mongoOptions: {
      useUnifiedTopology: true
    },
    stringify: false, // Store session data as MongoDB native types
    crypto: {
      secret: process.env.REPL_ID || 'roomcraft-secret'
    }
  }),
  secret: process.env.REPL_ID || 'roomcraft-secret',
  resave: true, // Changed to true to ensure session persistence
  saveUninitialized: true, // Changed to true to ensure new sessions are saved
  cookie: {
    secure: false, // Must be false for non-HTTPS Replit environment
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax',
    path: '/'
  },
  name: 'roomcraft.sid'
});

// Initialize session first
app.use(sessionMiddleware);

// Initialize passport after session
app.use(passport.initialize());
app.use(passport.session());

// Debug middleware to track session state
app.use((req, res, next) => {
  console.log('\n=== Session Debug ===');
  console.log('Session ID:', req.sessionID);
  console.log('Session Data:', {
    ...req.session,
    cookie: {
      ...req.session.cookie,
      expires: req.session.cookie.expires,
      maxAge: req.session.cookie.maxAge
    }
  });
  console.log('Is Authenticated:', req.isAuthenticated());
  console.log('User:', req.user ? {
    id: req.user._id,
    email: req.user.email,
    name: req.user.name
  } : 'None');
  console.log('Cookies:', req.cookies);
  console.log('Auth Headers:', {
    authorization: req.headers.authorization,
    cookie: req.headers.cookie
  });
  console.log('===================\n');
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  // Register routes which will set up auth middleware
  const server = registerRoutes(app);

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Error:", err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  // Setup Vite or static serving
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const PORT = 5000;
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();