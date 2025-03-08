import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import jwt from 'jsonwebtoken';
import session from 'express-session';
import { User } from "./models/User";
import { sendVerificationEmail, generateVerificationToken, verifyEmailTransporter } from './lib/email';

const JWT_SECRET = process.env.REPL_ID || 'roomcraft-secret';

export function setupAuth(app: Express) {
  // Setup session middleware
  app.use(session({
    secret: JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true if using HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // Serialize user for the session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from the session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
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

      const userForToken = {
        id: user._id,
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

      // Log the user in
      req.logIn(user, (err) => {
        if (err) {
          console.error('Session creation error:', err);
          return next(err);
        }

        const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
        console.log('Login successful - Token generated');

        // Set cookie for session persistence
        res.cookie('auth_token', token, {
          httpOnly: true,
          secure: false, // Set to true if using HTTPS
          maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

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
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: "Error during logout" });
      }
      res.clearCookie('auth_token');
      res.json({ message: "Logged out successfully" });
    });
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