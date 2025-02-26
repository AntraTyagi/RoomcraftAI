import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import { User } from "./models/User";
import MongoStore from 'connect-mongo';

export function setupAuth(app: Express) {
  // Setup session middleware
  app.use(session({
    secret: process.env.REPL_ID || 'roomcraft-secret',
    name: 'roomcraft.sid',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/roomcraft',
      collectionName: 'sessions',
      ttl: 24 * 60 * 60, // 1 day
      autoRemove: 'native'
    }),
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

      const userForSession = {
        id: user._id.toString(),
        email: user.email,
        username: user.email,
        credits: user.credits
      };

      return done(null, userForSession);
    } catch (err) {
      return done(err);
    }
  }));

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
        // Set a custom header to help debug session creation
        res.setHeader('X-Session-Created', 'true');
        res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", (req, res) => {
    // Set a custom header to help debug session persistence
    res.setHeader('X-Session-Present', req.isAuthenticated() ? 'true' : 'false');

    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });
}