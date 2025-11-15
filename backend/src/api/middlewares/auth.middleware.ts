import { Request, Response, NextFunction } from 'express';
import { Plan, User } from '@prisma/client';
import { verifyAccessToken } from '../../services/auth.service.js';
import { UnauthorizedError, ForbiddenError } from '../../utils/errors.js';
import { authLogger } from '../../utils/logger.js';

/**
 * Extend Express Request type to include user
 */
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * Authenticate JWT token middleware
 */
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token and get user
    const user = await verifyAccessToken(token);

    // Attach user to request
    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Require specific plan(s) middleware
 */
export function requirePlan(...allowedPlans: Plan[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedPlans.includes(req.user.plan)) {
      authLogger.warn('Plan requirement not met', {
        userId: req.user.id,
        userPlan: req.user.plan,
        requiredPlans: allowedPlans,
      });
      return next(
        new ForbiddenError(
          `This feature requires ${allowedPlans.join(' or ')} plan`
        )
      );
    }

    next();
  };
}

/**
 * Optional authentication (doesn't throw if no token)
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await verifyAccessToken(token);
      req.user = user;
    }

    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
}
