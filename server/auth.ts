import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import jwt from 'jsonwebtoken';
import { User } from "./models/User";

const JWT_SECRET = process.env.REPL_ID || 'roomcraft-secret';

export function setupAuth(app: Express) {
  // Initialize passport for the initial authentication
  app.use(passport.initialize());

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

      // Create user object without sensitive data
      const userForToken = {
        id: user._id.toString(),
        email: user.email,
        username: user.email,
        credits: user.credits
      };

      console.log('Authentication successful for user:', userForToken);
      return done(null, userForToken);
    } catch (err) {
      console.error('Authentication error:', err);
      return done(err);
    }
  }));

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", { session: false }, (err, user, info) => {
      if (err) {
        console.error('Login error:', err);
        return next(err);
      }

      if (!user) {
        console.log('Login failed: Invalid credentials');
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate JWT token
      const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
      console.log('Login successful - Token generated');

      res.json({ token, user });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    res.json({ message: "Logged out successfully" });
  });

  app.get("/api/user", (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(' ')[1];

    try {
      const user = jwt.verify(token, JWT_SECRET);
      res.json(user);
    } catch (err) {
      console.error('Token verification failed:', err);
      res.status(401).json({ message: "Invalid token" });
    }
  });

  // Debug middleware remains (though session data will be empty)
  app.use((req, res, next) => {
    console.log('\n=== Request Debug ===');
    console.log('Session ID:', req.sessionID);
    console.log('Session:', req.session);
    console.log('Is Authenticated:', req.isAuthenticated());
    console.log('User:', req.user);
    next();
  });
}