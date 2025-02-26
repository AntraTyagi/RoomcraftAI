import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface UserPayload {
  id: string;
  email: string;
  username: string;
  credits: number;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  console.log("Auth middleware - isAuthenticated:", req.isAuthenticated()); // Added logging
  console.log("Auth middleware - session:", req.session); // Added logging
  console.log("Auth middleware - user:", req.user); // Added logging

  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

export const generateToken = (user: { _id: string; email: string; name?: string }) => {
  return jwt.sign(
    { id: user._id.toString(), email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};