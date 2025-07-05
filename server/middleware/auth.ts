import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
<<<<<<< HEAD
import { User, IUser } from '../models/User';
import { Session } from 'express-session';
=======
>>>>>>> 67d56753a5fe62bb581f258b91f41dbd00a3feff

const JWT_SECRET = process.env.REPL_ID || 'roomcraft-secret';

declare global {
  namespace Express {
<<<<<<< HEAD
    interface User extends IUser {}
  }
}

interface SessionWithPassport extends Session {
  passport?: {
    user: string;
  };
}

// Custom type for authenticated requests
export interface AuthenticatedRequest extends Request {
  user: IUser;
  session: SessionWithPassport;
}

export const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check session authentication first
    if ((req.session as SessionWithPassport)?.passport?.user) {
      const user = await User.findById((req.session as SessionWithPassport).passport?.user);
      if (user) {
        (req as AuthenticatedRequest).user = user;
        return next();
      }
    }

    // Check JWT token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: string };
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    (req as AuthenticatedRequest).user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid token' });
=======
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
    // Check for session authentication first
    if (req.session && req.isAuthenticated() && req.user) {
      console.log('User authenticated via session:', req.user);
      return next();
    }

    // If no session, check JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No auth token found');
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as Express.User;
      req.user = decoded;

      // Re-establish session if token is valid
      if (req.session && !req.session.passport) {
        req.session.passport = { user: decoded.id };
      }

      console.log('User authenticated via JWT:', decoded);
      next();
    } catch (jwtError) {
      console.error('Token verification failed:', jwtError);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Internal server error' });
>>>>>>> 67d56753a5fe62bb581f258b91f41dbd00a3feff
  }
};