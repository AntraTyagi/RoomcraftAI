import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import MongoStore from 'connect-mongo';
import { User } from "./models/User";

export function setupAuth(app: Express) {
  // MongoDB store for session persistence
  console.log('Initializing MongoDB session store...');
  const sessionStore = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/roomcraft',
    collectionName: 'sessions',
    ttl: 24 * 60 * 60, // 1 day
    autoRemove: 'native',
    debug: true, // Enable debug mode for session store
  });

  sessionStore.on('create', (sessionId) => {
    console.log('New session created:', sessionId);
  });

  sessionStore.on('touch', (sessionId) => {
    console.log('Session touched:', sessionId);
  });

  sessionStore.on('destroy', (sessionId) => {
    console.log('Session destroyed:', sessionId);
  });

  // Session configuration
  console.log('Setting up session middleware...');
  app.use(session({
    secret: process.env.REPL_ID || 'roomcraft-secret',
    name: 'roomcraft.sid',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
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

  // Debug middleware to log session and user state
  app.use((req, res, next) => {
    console.log('\n=== Session Debug ===');
    console.log('Session ID:', req.sessionID);
    console.log('Session:', req.session);
    console.log('Is Authenticated:', req.isAuthenticated());
    console.log('User:', req.user);
    console.log('Cookies:', req.headers.cookie);
    console.log('===================\n');
    next();
  });

  // Passport local strategy
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      console.log('Attempting authentication for user:', username);
      const user = await User.findOne({ email: username });

      if (!user) {
        console.log('Authentication failed: User not found');
        return done(null, false);
      }

      const isValid = await user.comparePassword(password);
      console.log('Password validation result:', isValid);

      if (!isValid) {
        console.log('Authentication failed: Invalid password');
        return done(null, false);
      }

      const userForSession = {
        id: user._id.toString(),
        email: user.email,
        username: user.email,
        credits: user.credits
      };

      console.log('Authentication successful. User data:', userForSession);
      return done(null, userForSession);
    } catch (err) {
      console.error('Authentication error:', err);
      return done(err);
    }
  }));

  // Session serialization
  passport.serializeUser((user: Express.User, done) => {
    console.log('Serializing user:', user);
    done(null, user.id);
  });

  // Session deserialization
  passport.deserializeUser(async (id: string, done) => {
    try {
      console.log('Deserializing user ID:', id);
      const user = await User.findById(id);

      if (!user) {
        console.log('Deserialization failed: User not found');
        return done(null, false);
      }

      const userForSession = {
        id: user._id.toString(),
        email: user.email,
        username: user.email,
        credits: user.credits
      };

      console.log('Deserialization successful. User data:', userForSession);
      done(null, userForSession);
    } catch (err) {
      console.error('Deserialization error:', err);
      done(err);
    }
  });

  // Auth routes
  app.post("/api/login", (req, res, next) => {
    console.log('Login attempt - Request headers:', req.headers);

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
        console.log('Login successful - Set-Cookie header:', res.getHeader('set-cookie'));

        res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    console.log('Logout attempt - Session before:', req.session);

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

        console.log('Logout successful - Session destroyed');
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