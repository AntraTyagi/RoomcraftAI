import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import jwt from 'jsonwebtoken';
import { User } from "./models/User";
import { sendVerificationEmail, generateVerificationToken, verifyEmailTransporter } from './lib/email';

const JWT_SECRET = process.env.REPL_ID || 'roomcraft-secret';

export function setupAuth(app: Express) {
  app.use(passport.initialize());

  // Test route for email configuration
  app.get("/api/test-email-config", async (req, res) => {
    try {
      const result = await verifyEmailTransporter();
      res.json({ 
        status: 'success',
        message: 'Email configuration is working',
        details: result
      });
    } catch (error: any) {
      console.error('Email configuration test failed:', error);
      res.status(500).json({ 
        status: 'error',
        message: 'Email configuration test failed',
        error: error.message
      });
    }
  });

  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      console.log('Login attempt for:', username);
      const user = await User.findOne({ email: username });

      if (!user) {
        console.log('User not found:', username);
        return done(null, false, { message: "Invalid credentials" });
      }

      const isValid = await user.comparePassword(password);
      console.log('Password validation:', isValid);

      if (!isValid) {
        return done(null, false, { message: "Invalid credentials" });
      }

      const userForToken = {
        id: user._id.toString(),
        email: user.email,
        username: user.username, // Corrected to use user.username
        name: user.name,
        credits: user.credits
      };

      console.log('Authentication successful for user:', userForToken);
      return done(null, userForToken);
    } catch (err) {
      console.error('Authentication error:', err);
      return done(err);
    }
  }));

  app.post("/api/register", async (req, res) => {
    try {
      console.log("Registration attempt with data:", { 
        email: req.body.email, 
        name: req.body.name,
        username: req.body.username 
      });

      const { email, password, name, username } = req.body;

      if (!email || !password || !name || !username) {
        console.log("Missing required fields");
        return res.status(400).json({ message: "All fields are required" });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ 
        $or: [{ email }, { username }] 
      });

      if (existingUser) {
        console.log("User already exists:", existingUser.email);
        return res.status(400).json({ 
          message: existingUser.email === email 
            ? "Email already registered" 
            : "Username already taken" 
        });
      }

      // Generate verification token
      const { token, expires } = generateVerificationToken();
      console.log("Generated verification token:", { token, expires });

      // Create new user
      const user = new User({
        email,
        password,
        name,
        username,
        verificationToken: token,
        verificationTokenExpires: expires,
        isEmailVerified: true // Temporarily set to true for testing
      });

      console.log("Attempting to save new user");
      await user.save();
      console.log("User saved successfully:", user._id);

      // Create response object with same structure as login
      const userResponse = {
        token: jwt.sign({
          id: user._id.toString(),
          email: user.email,
          username: user.username, //Corrected to use user.username
          name: user.name,
          credits: user.credits
        }, JWT_SECRET, { expiresIn: '24h' }),
        user: {
          id: user._id.toString(),
          email: user.email,
          username: user.username,  //Corrected to use user.username
          name: user.name,
          credits: user.credits
        }
      };

      res.status(201).json(userResponse);
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        message: error.message || "Registration failed" 
      });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", { session: false }, (err, user, info) => {
      if (err) {
        console.error('Login error:', err);
        return next(err);
      }

      if (!user) {
        console.log('Login failed:', info?.message);
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }

      const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
      console.log('Login successful - Token generated');

      res.json({
        token: token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          credits: user.credits
        }
      });
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