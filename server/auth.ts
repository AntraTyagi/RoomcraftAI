import passport from "passport";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users, insertUserSchema, type SelectUser } from "@db/schema";
import { db } from "@db";
import { eq } from "drizzle-orm";
import type { Express } from "express";
import { User } from "./models/User";
import { generateToken } from "./middleware/auth";
import { body, validationResult } from "express-validator";

const scryptAsync = promisify(scrypt);
const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
  compare: async (suppliedPassword: string, storedPassword: string) => {
    const [hashedPassword, salt] = storedPassword.split(".");
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = (await scryptAsync(
      suppliedPassword,
      salt,
      64
    )) as Buffer;
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  },
};

// extend express user object with our schema
declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID || "porygon-supremacy",
    resave: false,
    saveUninitialized: false,
    cookie: {},
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
    sessionSettings.cookie = {
      secure: true,
    };
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);

        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }
        const isMatch = await crypto.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Incorrect password." });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Register new user
  app.post(
    "/api/register",
    [
      body("email").isEmail().withMessage("Please provide a valid email address"),
      body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
      body("name").trim().notEmpty().withMessage("Name is required"),
    ],
    async (req, res) => {
      try {
        console.log("Registration request body:", req.body); // Debug log

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ 
            message: "Validation failed",
            errors: errors.array(),
            expectedFormat: {
              email: "user@example.com",
              password: "minimum 6 characters",
              name: "Your full name"
            }
          });
        }

        const { email, password, name } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ message: "User already exists" });
        }

        // Create new user
        const user = new User({
          email,
          password, // Will be hashed by the pre-save hook
          name,
          credits: 10, // Initial free credits
        });

        await user.save();
        console.log("New user created:", user._id);

        // Generate token
        const token = generateToken(user);

        res.status(201).json({
          message: "User created successfully",
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            credits: user.credits,
          },
          token,
        });
      } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Error creating user" });
      }
    }
  );

  // Login user
  app.post(
    "/api/login",
    [body("email").isEmail(), body("password").exists()],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        // Check password
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate token
        const token = generateToken(user);

        res.json({
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            credits: user.credits,
          },
          token,
        });
      } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Error logging in" });
      }
    }
  );

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).send("Logout failed");
      }

      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      return res.json(req.user);
    }

    res.status(401).send("Not logged in");
  });
}