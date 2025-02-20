import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';
import { User } from '../models/User';

export interface UserPayload {
  id: string;
  email: string;
  name?: string;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = verifyToken(token);

    // Verify user exists in database
    const user = await User.findById(decoded._id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const generateToken = (user: { _id: string; email: string; name?: string }) => {
  return jwt.sign(
    { id: user._id.toString(), email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};