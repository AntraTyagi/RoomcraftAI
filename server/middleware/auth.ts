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

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Check if user exists in session
    if (!req.session?.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Get user from database to ensure they still exist and get latest data
    const user = await User.findById(req.session.user.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Set user data in request
    req.user = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      credits: user.credits
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

export const generateToken = (user: { _id: string; email: string; name?: string }) => {
  return jwt.sign(
    { id: user._id.toString(), email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};