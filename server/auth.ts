import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import { User } from "./models/User";
import MongoStore from 'connect-mongo';

export function setupAuth(app: Express) {
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
      console.log('Login attempt:', { username, userFound: !!user });

      if (!user) {
        return done(null, false);
      }

      const isValid = await user.comparePassword(password);
      console.log('Password validation:', { username, isValid });

      if (!isValid) {
        return done(null, false);
      }

      const userForSession = {
        id: user._id.toString(),
        email: user.email,
        username: user.email,
        credits: user.credits
      };

      console.log('User authenticated:', userForSession);
      return done(null, userForSession);
    } catch (err) {
      console.error('Authentication error:', err);
      return done(err);
    }
  }));

  passport.serializeUser((user: any, done) => {
    console.log('Serializing user:', user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      console.log('Deserializing user:', id);
      const user = await User.findById(id);

      if (!user) {
        console.log('User not found during deserialization:', id);
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
        console.log('Login successful, session:', req.session);
        res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    console.log('Logout request, session before:', req.session);
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: "Logout failed" });
      }
      console.log('Logout successful, session after:', req.session);
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", (req, res) => {
    console.log('User check - session:', req.session);
    console.log('User check - isAuthenticated:', req.isAuthenticated());
    console.log('User check - user:', req.user);

    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });
}