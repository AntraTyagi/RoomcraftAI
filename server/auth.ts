import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import jwt from 'jsonwebtoken';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { User } from "./models/User";
import { sendVerificationEmail, generateVerificationToken } from './lib/email';

const JWT_SECRET = process.env.REPL_ID || 'roomcraft-secret';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/roomcraft';

export function setupAuth(app: Express) {
  // Setup session store with MongoDB
  const sessionStore = MongoStore.create({
    mongoUrl: MONGODB_URI,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60, // 1 day
    autoRemove: 'native'
  });

  // Setup session middleware with secure settings
  app.use(session({
    secret: JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    name: 'roomcraft.sid', // Custom session ID name
    cookie: {
      secure: 'auto', // Will be secure in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: 'lax'
    }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // Serialize the entire user object for the session
  passport.serializeUser((user: any, done) => {
    console.log('Serializing user:', user._id);
    done(null, user._id);
  });

  // Deserialize user from session
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

  // Local strategy setup
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
      console.log('Password validation:', isValid);

      if (!isValid) {
        return done(null, false, { message: "Invalid credentials" });
      }

      if (!user.isEmailVerified) {
        console.log('User not verified:', email);
        return done(null, false, { message: "Please verify your email before logging in" });
      }

      console.log('Authentication successful for user:', user.email);
      return done(null, user);
    } catch (err) {
      console.error('Authentication error:', err);
      return done(err);
    }
  }));

  // Login endpoint with session and JWT
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", { session: true }, (err, user, info) => {
      if (err) {
        console.error('Login error:', err);
        return next(err);
      }

      if (!user) {
        console.log('Login failed:', info?.message);
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }

      // Log the user in and create session
      req.logIn(user, (err) => {
        if (err) {
          console.error('Session creation error:', err);
          return next(err);
        }

        // Generate JWT token
        const token = jwt.sign({
          id: user._id,
          email: user.email
        }, JWT_SECRET, { expiresIn: '24h' });

        console.log('Login successful - Session created and token generated');

        // Set both session cookie and JWT token
        res.cookie('auth_token', token, {
          httpOnly: true,
          secure: 'auto',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        // Send response
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

  // Logout endpoint - clear both session and tokens
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

  // Debug middleware
  app.use((req, res, next) => {
    console.log('\n=== Request Debug ===');
    console.log('Session ID:', req.sessionID);
    console.log('Session:', req.session);
    console.log('Is Authenticated:', req.isAuthenticated());
    console.log('User:', req.user);
    next();
  });
}