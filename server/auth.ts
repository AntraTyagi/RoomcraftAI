import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import jwt from 'jsonwebtoken';
import { User } from "./models/User";
import { sendVerificationEmail, generateVerificationToken } from './lib/email';

const JWT_SECRET = process.env.REPL_ID || 'roomcraft-secret';

export function setupAuth(app: Express) {
  // Initialize passport and session support
  app.use(passport.initialize());
  app.use(passport.session());

  // Passport serialization
  passport.serializeUser((user: any, done) => {
    console.log('Serializing user:', user);
    try {
      // Handle both MongoDB _id and regular id
      const userId = user._id ? user._id.toString() : user.id.toString();
      console.log('Serialized user ID:', userId);
      done(null, userId);
    } catch (err) {
      console.error('Serialization error:', err);
      done(err);
    }
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      console.log('Deserializing user:', id);
      const user = await User.findById(id);
      if (!user) {
        console.log('User not found during deserialization:', id);
        return done(null, false);
      }
      console.log('Deserialized user:', user);
      done(null, user);
    } catch (err) {
      console.error('Deserialization error:', err);
      done(err);
    }
  });

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

      // Create a plain object for session storage
      const userForSession = {
        _id: user._id,
        id: user._id.toString(),
        email: user.email,
        username: user.email,
        name: user.name,
        credits: user.credits
      };

      console.log('Authentication successful for user:', userForSession);
      return done(null, userForSession);
    } catch (err) {
      console.error('Authentication error:', err);
      return done(err);
    }
  }));

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
          id: user.id,
          email: user.email,
          username: user.email,
          name: user.name,
          credits: user.credits
        }, JWT_SECRET, { expiresIn: '24h' });

        console.log('Login successful - Token generated');

        // Save session before sending response
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            return next(err);
          }

          res.json({
            token,
            user: {
              id: user.id,
              email: user.email,
              username: user.email,
              name: user.name,
              credits: user.credits
            }
          });
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    const sessionId = req.sessionID;
    console.log('Logging out session:', sessionId);

    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return next(err);
      }

      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
          return next(err);
        }
        res.json({ message: "Logged out successfully" });
      });
    });
  });

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

  app.post("/api/register", async (req, res) => {
    try {
      console.log("Registration attempt with data:", { 
        email: req.body.email, 
        name: req.body.name,
        username: req.body.username 
      });

      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        console.log("Missing required fields");
        return res.status(400).json({ message: "All fields are required" });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ 
        $or: [{ email }] 
      });

      if (existingUser) {
        console.log("User already exists:", existingUser.email);
        return res.status(400).json({ 
          message: "Email already registered" 
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
        username: email,
        verificationToken: token,
        verificationTokenExpires: expires,
        isEmailVerified: false 
      });

      console.log("Attempting to save new user");
      await user.save();
      console.log("User saved successfully:", user._id);

      try {
        // Send verification email
        console.log("Attempting to send verification email");
        await sendVerificationEmail(email, name, token);
        console.log("Verification email sent successfully");

        // Create response object
        const userResponse = {
          token: jwt.sign({
            id: user._id.toString(),
            email: user.email,
            username: user.email,
            name: user.name,
            credits: user.credits
          }, JWT_SECRET, { expiresIn: '24h' }),
          user: {
            id: user._id.toString(),
            email: user.email,
            username: user.email,
            name: user.name,
            credits: user.credits
          }
        };

        res.status(201).json(userResponse);
      } catch (emailError) {
        // If email sending fails, delete the user and return error
        console.error("Failed to send verification email:", emailError);
        await User.findByIdAndDelete(user._id);

        res.status(500).json({ 
          message: "Failed to send verification email. Please try again later." 
        });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        message: error.message || "Registration failed" 
      });
    }
  });

  // Email verification endpoint
  app.get("/api/verify-email", async (req, res) => {
    try {
      const { token } = req.query;
      console.log("Email verification attempt with token:", token);

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Invalid verification token" });
      }

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

      // Update user verification status and add initial credits
      user.isEmailVerified = true;
      user.verificationToken = undefined;
      user.verificationTokenExpires = undefined;
      user.credits = 10; // Allocate free credits upon verification
      await user.save();

      console.log("Email verified successfully for user:", user.email);

      // Return success message and user data
      const userResponse = {
        message: "Email verified successfully. Your account has been credited with 10 free credits. You can now log in.",
        user: {
          email: user.email,
          name: user.name,
          credits: user.credits
        }
      };

      res.json(userResponse);
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ message: "Email verification failed" });
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