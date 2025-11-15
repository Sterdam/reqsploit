/**
 * Authentication Middleware
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface JWTPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

/**
 * Middleware to authenticate JWT access tokens
 */
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required',
      });
      return;
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // Verify token type
    if (decoded.type !== 'access') {
      res.status(401).json({
        success: false,
        error: 'Invalid token type',
      });
      return;
    }

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        isActive: true,
        emailVerified: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        error: 'Account is inactive',
      });
      return;
    }

    // Attach user to request
    (req as any).user = user;

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: 'Access token expired',
      });
      return;
    }

    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        error: 'Invalid access token',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
}

/**
 * Middleware to check if user has a specific plan
 */
export function requirePlan(allowedPlans: ('FREE' | 'PRO' | 'ENTERPRISE')[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!allowedPlans.includes(user.plan)) {
      res.status(403).json({
        success: false,
        error: `This feature requires ${allowedPlans.join(' or ')} plan`,
        data: {
          currentPlan: user.plan,
          requiredPlans: allowedPlans,
        },
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to check if user's email is verified
 */
export function requireEmailVerified(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const user = (req as any).user;

  if (!user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  if (!user.emailVerified) {
    res.status(403).json({
      success: false,
      error: 'Email verification required',
      data: {
        email: user.email,
      },
    });
    return;
  }

  next();
}
