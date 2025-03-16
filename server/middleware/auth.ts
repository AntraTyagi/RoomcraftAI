import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.REPL_ID || "roomcraft-secret";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      username: string;
      credits: number;
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // ✅ First, check if the session exists and user is authenticated
    if (req.session && req.session.passport && req.session.passport.user) {
      console.log("User authenticated via session:", req.session.passport.user);
      req.user = req.session.passport.user; // Attach user from session
      return next();
    }

    // ✅ If no session, then check for JWT token authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("No auth token found");
      return res.status(401).json({ message: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as Express.User;
      req.user = decoded;

      // ✅ If session is missing, restore it
      if (req.session && !req.session.passport) {
        req.session.passport = { user: decoded.id };
      }

      console.log("User authenticated via JWT:", decoded);
      next();
    } catch (jwtError) {
      console.error("Token verification failed:", jwtError);
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
