import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import MongoStore from 'connect-mongo';
import { User } from "./models/User";

export function setupAuth(app: Express) {
  // MongoDB store for session persistence
  const sessionStore = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/roomcraft',
    collectionName: 'sessions',
    ttl: 24 * 60 * 60, // 1 day
    autoRemove: 'native'
  });

  // Session configuration
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

  // Passport local strategy
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ email: username });
      if (!user) {
        return done(null, false);
      }

      const isValid = await user.comparePassword(password);
      if (!isValid) {
        return done(null, false);
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
  }));

  // Session serialization
  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  // Session deserialization
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

  // Auth routes
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Session destruction failed" });
        }
        res.clearCookie('roomcraft.sid');
        res.json({ message: "Logged out successfully" });
      });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });
}