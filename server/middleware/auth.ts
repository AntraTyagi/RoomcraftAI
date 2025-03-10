import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.REPL_ID || 'roomcraft-secret';

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

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const user = jwt.verify(token, JWT_SECRET) as Express.User;
      req.user = user;
      next();
    } catch (jwtError) {
      console.error('Token verification failed:', jwtError);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};