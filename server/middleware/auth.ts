import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { Session } from 'express-session';

const JWT_SECRET = process.env.REPL_ID || 'roomcraft-secret';

declare global {
  namespace Express {
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
  }
};