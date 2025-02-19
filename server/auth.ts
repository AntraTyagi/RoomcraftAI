import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { User } from "./models/User";
import { generateToken } from "./middleware/auth";
import { body, validationResult } from "express-validator";

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
        const user = await User.findOne({ email: username });
        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          return done(null, false, { message: "Incorrect password." });
        }

        return done(null, {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        });
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await User.findById(id);
      if (!user) {
        return done(null, false);
      }
      done(null, {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      });
    } catch (err) {
      done(err);
    }
  });

  // Register new user
  app.post(
    "/api/register",
    [
      body("username").isEmail().withMessage("Please provide a valid email address"),
      body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ 
            message: "Validation failed",
            errors: errors.array(),
            expectedFormat: {
              username: "user@example.com",
              password: "minimum 6 characters"
            }
          });
        }

        const { username, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email: username });
        if (existingUser) {
          return res.status(400).json({ message: "User already exists" });
        }

        // Create new user
        const user = new User({
          email: username,
          password,
          name: username.split('@')[0],
          credits: 10,
        });

        await user.save();
        console.log("New user created:", user._id);

        const token = generateToken({
          _id: user._id.toString(),
          email: user.email,
          name: user.name,
        });

        res.status(201).json({
          message: "User created successfully",
          user: {
            id: user._id.toString(),
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
    [
      body("username").isEmail().withMessage("Please provide a valid email address"),
      body("password").exists().withMessage("Password is required"),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

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

        res.json({
          user: {
            id: user._id.toString(),
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
    if (!req.user) {
      return res.status(401).send("Not logged in");
    }
    res.json(req.user);
  });
}