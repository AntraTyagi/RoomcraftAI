import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { User } from "./models/User";
import { body, validationResult } from "express-validator";

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID || "porygon-supremacy",
    resave: true, // Changed to true to ensure session is saved
    saveUninitialized: true, // Changed to true to ensure session is saved
    name: 'roomcraft.sid',
    cookie: {
      secure: false, // Must be false for HTTP
      httpOnly: true,
      sameSite: 'lax', // Added sameSite option
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    store: new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    }),
  };

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
          username: user.email,
          credits: user.credits
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
        username: user.email,
        credits: user.credits
      });
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    console.log("Login successful, user:", req.user); // Added logging
    res.json(req.user);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).send("Logout failed");
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/user", (req, res) => {
    console.log("User check, session:", req.session); // Added logging
    console.log("User check, authenticated:", req.isAuthenticated()); // Added logging
    if (!req.user) {
      return res.status(401).send("Not logged in");
    }
    res.json(req.user);
  });
}