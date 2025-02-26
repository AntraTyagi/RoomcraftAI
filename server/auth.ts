import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { User } from "./models/User";

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID || "porygon-supremacy",
    resave: true,
    saveUninitialized: true,
    name: 'roomcraft.sid',
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
    },
    store: new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    }),
  };

  // Session must be set up before passport
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await User.findOne({ email: username });
        if (!user) {
          console.log("User not found:", username);
          return done(null, false, { message: "Incorrect username." });
        }

        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
          console.log("Invalid password for user:", username);
          return done(null, false, { message: "Incorrect password." });
        }

        const userForSession = {
          id: user._id.toString(),
          email: user.email,
          username: user.email,
          credits: user.credits
        };
        console.log("Authentication successful, user:", userForSession);
        return done(null, userForSession);
      } catch (err) {
        console.error("Authentication error:", err);
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    console.log('Serializing user:', user);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    console.log('Deserializing user id:', id);
    try {
      const user = await User.findById(id);
      if (!user) {
        console.log('User not found during deserialization');
        return done(null, false);
      }
      const userData = {
        id: user._id.toString(),
        email: user.email,
        username: user.email,
        credits: user.credits
      };
      console.log('Deserialized user:', userData);
      done(null, userData);
    } catch (err) {
      console.error('Deserialization error:', err);
      done(err);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    console.log("Login successful, user:", req.user);
    res.json(req.user);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).send("Logout failed");
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/user", (req, res) => {
    console.log("User check - session:", req.session);
    console.log("User check - isAuthenticated:", req.isAuthenticated());
    console.log("User check - user:", req.user);

    if (!req.isAuthenticated()) {
      return res.status(401).send("Not logged in");
    }
    res.json(req.user);
  });
}