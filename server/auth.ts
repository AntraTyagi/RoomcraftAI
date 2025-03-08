import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import jwt from 'jsonwebtoken';
import { User } from "./models/User";
import { sendVerificationEmail, generateVerificationToken, verifyEmailTransporter } from './lib/email';

const JWT_SECRET = process.env.REPL_ID || 'roomcraft-secret';

export function setupAuth(app: Express) {
  app.use(passport.initialize());

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
        name: req.body.name
      });

      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        console.log("Missing required fields");
        return res.status(400).json({ message: "All fields are required" });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        console.log("User already exists:", existingUser.email);
        return res.status(400).json({ message: "Email already registered" });
      }

      const { token, expires } = generateVerificationToken();
      console.log("Generated verification token:", { token, expires });

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
        await sendVerificationEmail(email, name, token);
        console.log("Verification email sent successfully");

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
        console.error("Failed to send verification email:", emailError);
        await User.findByIdAndDelete(user._id);
        res.status(500).json({ message: "Failed to send verification email. Please try again later." });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({ message: error.message || "Registration failed" });
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
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.email,
          name: user.name,
          credits: user.credits
        }
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    res.json({ message: "Logged out successfully" });
  });

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
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }

      user.isEmailVerified = true;
      user.verificationToken = undefined;
      user.verificationTokenExpires = undefined;
      user.credits = 10;
      await user.save();

      console.log("Email verified successfully for user:", user.email);

      res.json({
        message: "Email verified successfully. Your account has been credited with 10 free credits. You can now log in.",
        user: {
          email: user.email,
          name: user.name,
          credits: user.credits
        }
      });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ message: "Email verification failed" });
    }
  });
}