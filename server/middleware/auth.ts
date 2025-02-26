import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';

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

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  console.log("Auth middleware - session ID:", req.sessionID);
  console.log("Auth middleware - isAuthenticated:", req.isAuthenticated());
  console.log("Auth middleware - user:", req.user);
  console.log("Auth middleware - cookies:", req.headers.cookie);

  if (!req.isAuthenticated()) {
    console.log("Not authenticated - sending 401");
    return res.status(401).json({ message: 'Authentication required' });
  }

  // If we get here, user is authenticated
  console.log("User is authenticated, proceeding to next middleware");
  next();
};

export const generateToken = (user: { _id: string; email: string; name?: string }) => {
  return jwt.sign(
    { id: user._id.toString(), email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};