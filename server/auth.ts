import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import jwt from 'jsonwebtoken';
import session from 'express-session';
import MemoryStore from 'memorystore';
import { User } from "./models/User";

const JWT_SECRET = process.env.REPL_ID || 'roomcraft-secret';

export function setupAuth(app: Express) {
  // Setup MemoryStore for Replit environment
  const MemoryStoreSession = MemoryStore(session);
  const sessionStore = new MemoryStoreSession({
    checkPeriod: 86400000 // prune expired entries every 24h
  });

  // Setup session middleware
  app.use(session({
    store: sessionStore,
    secret: JWT_SECRET,
    resave: true, // Changed to true to ensure session persistence
    saveUninitialized: true, // Changed to true to ensure new sessions are saved
    cookie: {
      secure: false, // Must be false for Replit
      httpOnly: true,
      maxAge: 86400000, // 24 hours
      path: '/',
      sameSite: 'lax'
    },
    name: 'roomcraft.sid' // Custom session name
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // Debug middleware to track session state
  app.use((req, res, next) => {
    console.log('Session Debug:', {
      sessionID: req.sessionID,
      isAuthenticated: req.isAuthenticated(),
      user: req.user ? 'exists' : 'none',
      session: req.session
    });
    next();
  });

  passport.serializeUser((user: any, done) => {
    console.log('Serializing user:', user._id);
    done(null, user._id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      console.log('Deserializing user:', id);
      const user = await User.findById(id);
      if (!user) {
        console.log('User not found during deserialization');
        return done(null, false);
      }
      done(null, user);
    } catch (err) {
      console.error('Deserialization error:', err);
      done(err);
    }
  });

  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, done) => {
    try {
      console.log('Login attempt for:', email);
      const user = await User.findOne({ email });

      if (!user) {
        console.log('User not found:', email);
        return done(null, false, { message: "Invalid credentials" });
      }

      const isValid = await user.comparePassword(password);
      if (!isValid) {
        console.log('Invalid password for user:', email);
        return done(null, false, { message: "Invalid credentials" });
      }

      if (!user.isEmailVerified) {
        console.log('Unverified email for user:', email);
        return done(null, false, { message: "Please verify your email before logging in" });
      }

      console.log('Authentication successful for:', email);
      return done(null, user);
    } catch (err) {
      console.error('Authentication error:', err);
      return done(err);
    }
  }));

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error('Login error:', err);
        return next(err);
      }
      if (!user) {
        console.log('Login failed:', info?.message);
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }

      req.logIn(user, (err) => {
        if (err) {
          console.error('Session creation error:', err);
          return next(err);
        }

        // Generate token
        const token = jwt.sign({
          id: user._id,
          email: user.email
        }, JWT_SECRET, { expiresIn: '24h' });

        console.log('Login successful - Token and session created for:', user.email);

        // Set both session cookie and JWT token cookie
        res.cookie('auth_token', token, {
          httpOnly: true,
          secure: false, // Must be false for Replit
          maxAge: 86400000,
          path: '/',
          sameSite: 'lax'
        });

        res.json({
          token,
          user: {
            id: user._id,
            email: user.email,
            username: user.email,
            name: user.name,
            credits: user.credits
          }
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    console.log('Logout requested for user:', req.user);
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: "Error during logout" });
      }
      res.clearCookie('auth_token');
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
          return res.status(500).json({ message: "Error during logout" });
        }
        console.log('Logout successful - Session and cookies cleared');
        res.json({ message: "Logged out successfully" });
      });
    });
  });

  app.get("/api/user", (req, res) => {
    console.log('User data request:', {
      isAuthenticated: req.isAuthenticated(),
      sessionID: req.sessionID,
      user: req.user ? 'exists' : 'none'
    });

    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });
}