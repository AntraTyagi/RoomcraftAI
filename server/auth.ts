import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import MongoStore from 'connect-mongo';
import { User } from "./models/User";

export function setupAuth(app: Express) {
  // Ensure MongoDB connection string is correct
  const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/roomcraft';
  console.log('MongoDB URL for session store:', mongoUrl);

  // MongoDB store for session persistence with detailed logging
  const sessionStore = MongoStore.create({
    mongoUrl,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60, // 1 day
    touchAfter: 24 * 3600, // time period in seconds between session updates
    crypto: {
      secret: false
    },
    stringify: false,
    autoRemove: 'native'
  });

  // Session store event logging
  sessionStore.on('create', (sessionId) => {
    console.log('Session created:', sessionId);
  });

  sessionStore.on('set', (sessionId) => {
    console.log('Session updated:', sessionId);
  });

  sessionStore.on('destroy', (sessionId) => {
    console.log('Session destroyed:', sessionId);
  });

  // Session middleware configuration
  app.use(session({
    secret: process.env.REPL_ID || 'roomcraft-secret',
    name: 'roomcraft.sid',
    store: sessionStore,
    resave: false,
    rolling: true,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      secure: false, // Must be false for HTTP
      sameSite: 'lax',
      path: '/'
    }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // Debug middleware to log every request's session state
  app.use((req, res, next) => {
    console.log('\n=== Request Debug ===');
    console.log('URL:', req.url);
    console.log('Method:', req.method);
    console.log('Session ID:', req.sessionID);
    console.log('Cookie Header:', req.headers.cookie);
    console.log('Is Authenticated:', req.isAuthenticated());
    console.log('Session:', req.session);
    console.log('User:', req.user);
    console.log('===================\n');
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

  passport.serializeUser((user: Express.User, done) => {
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
    console.log('Headers:', req.headers);

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

        console.log('Login successful:');
        console.log('- Session:', req.session);
        console.log('- User:', req.user);
        console.log('- Cookies:', res.getHeader('set-cookie'));

        res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    console.log('Logout request');
    console.log('Session before logout:', req.session);

    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: "Logout failed" });
      }

      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
          return res.status(500).json({ message: "Session destruction failed" });
        }

        console.log('Session destroyed successfully');
        res.clearCookie('roomcraft.sid');
        res.json({ message: "Logged out successfully" });
      });
    });
  });

  app.get("/api/user", (req, res) => {
    console.log('\n=== User Check ===');
    console.log('Session:', req.session);
    console.log('Is Authenticated:', req.isAuthenticated());
    console.log('User:', req.user);
    console.log('================\n');

    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    res.json(req.user);
  });
}