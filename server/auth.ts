import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import MongoStore from 'connect-mongo';
import { User } from "./models/User";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      username: string;
      credits: number;
    }
  }
}

export function setupAuth(app: Express) {
  // 1. Configure session middleware first
  app.use(session({
    secret: process.env.REPL_ID || 'roomcraft-secret',
    name: 'roomcraft.sid',
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/roomcraft',
      collectionName: 'sessions'
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      secure: false, // Must be false for HTTP
      path: '/',
      sameSite: 'lax'
    }
  }));

  // 2. Initialize passport and session AFTER session middleware
  app.use(passport.initialize());
  app.use(passport.session());

  // 3. Debug middleware after all auth setup
  app.use((req, res, next) => {
    console.log('\n=== Request Debug ===');
    console.log('Session ID:', req.sessionID);
    console.log('Session:', req.session);
    console.log('Is Authenticated:', req.isAuthenticated());
    console.log('User:', req.user);
    next();
  });

  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      console.log('Login attempt for:', username);
      const user = await User.findOne({ email: username });

      if (!user) {
        console.log('User not found:', username);
        return done(null, false);
      }

      const isValid = await user.comparePassword(password);
      console.log('Password validation:', isValid);

      if (!isValid) {
        return done(null, false);
      }

      const userForSession = {
        id: user._id.toString(),
        email: user.email,
        username: user.email,
        credits: user.credits
      };

      console.log('Authentication successful for user:', userForSession);
      return done(null, userForSession);
    } catch (err) {
      console.error('Authentication error:', err);
      return done(err);
    }
  }));

  passport.serializeUser((user, done) => {
    console.log('Serializing user:', user);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      console.log('Deserializing user:', id);
      const user = await User.findById(id);

      if (!user) {
        console.log('User not found during deserialization');
        return done(null, false);
      }

      const userForSession = {
        id: user._id.toString(),
        email: user.email,
        username: user.email,
        credits: user.credits
      };

      console.log('User deserialized:', userForSession);
      done(null, userForSession);
    } catch (err) {
      console.error('Deserialization error:', err);
      done(err);
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log('Login request received');
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error('Login error:', err);
        return next(err);
      }

      if (!user) {
        console.log('Login failed: Invalid credentials');
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.logIn(user, (err) => {
        if (err) {
          console.error('Login error:', err);
          return next(err);
        }
        console.log('Login successful - Session:', req.session);
        res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
          return res.status(500).json({ message: "Logout failed" });
        }
        res.clearCookie('roomcraft.sid', { path: '/' });
        res.json({ message: "Logged out successfully" });
      });
    } else {
      res.json({ message: "Already logged out" });
    }
  });

  app.get("/api/user", (req, res) => {
    console.log('\n=== User Check ===');
    console.log('Session:', req.session);
    console.log('Is Authenticated:', req.isAuthenticated());
    console.log('User:', req.user);

    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    res.json(req.user);
  });
}