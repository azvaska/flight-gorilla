import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '../../generated/prisma';
import { verifyAccessToken, verifyRefreshToken } from './jwt';

const prisma = new PrismaClient();

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        active: boolean;
        roles: string[];
        airline_id?: string;
      };
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const decoded = verifyAccessToken(token);
    
    // Get user from database with roles
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        roles_users: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    if (!user.active && !user.airline_id) {
      res.status(403).json({ error: 'User is not active' });
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      active: user.active,
      roles: user.roles_users.map(ru => ru.role.name),
      airline_id: user.airline_id || undefined
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const authenticateRefreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      res.status(401).json({ error: 'Refresh token required' });
      return;
    }

    const decoded = verifyRefreshToken(refreshToken);
    
    // Get user from database with roles
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        roles_users: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    if (!user.active && !user.airline_id) {
      res.status(403).json({ error: 'User is not active' });
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      active: user.active,
      roles: user.roles_users.map(ru => ru.role.name),
      airline_id: user.airline_id || undefined
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

export const requireRoles = (requiredRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const hasRequiredRole = requiredRoles.some(role => req.user!.roles.includes(role));
    
    if (!hasRequiredRole) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

// Cleanup on app termination
process.on('beforeExit', async () => {
  await prisma.$disconnect();
}); 
