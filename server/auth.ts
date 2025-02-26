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

      // Temporarily disable email verification check
      // if (!user.isEmailVerified) {
      //   return done(null, false, { message: "Please verify your email before logging in" });
      // }

      const userForToken = {
        id: user._id.toString(),
        email: user.email,
        username: user.email,
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

      // Temporarily skip email verification
      res.status(201).json({ 
        message: "Registration successful. You can now log in." 
      });

      // Comment out email sending temporarily
      // try {
      //   console.log("Attempting to send verification email");
      //   await sendVerificationEmail(email, name, token);
      //   console.log("Verification email sent successfully");
      // } catch (emailError) {
      //   console.error("Failed to send verification email:", emailError);
      //   await User.findByIdAndDelete(user._id);
      //   res.status(500).json({ 
      //     message: "Failed to send verification email. Please try again later." 
      //   });
      // }
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        message: error.message || "Registration failed" 
      });
    }
  });

  app.get("/api/verify-email", async (req, res) => {
    try {
      const { token } = req.query;
      console.log("Email verification attempt with token:", token);

      const user = await User.findOne({
        verificationToken: token,
        verificationTokenExpires: { $gt: new Date() }
      });

      if (!user) {
        console.log("Invalid or expired token");
        return res.status(400).json({ 
          message: "Invalid or expired verification token" 
        });
      }

      user.isEmailVerified = true;
      user.verificationToken = undefined;
      user.verificationTokenExpires = undefined;
      await user.save();
      console.log("Email verified successfully for user:", user.email);

      res.json({ message: "Email verified successfully. You can now log in." });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ message: "Email verification failed" });
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