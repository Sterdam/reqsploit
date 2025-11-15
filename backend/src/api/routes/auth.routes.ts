import { Router, Request, Response } from 'express';
import * as authService from '../../services/auth.service.js';
import { validate } from '../../utils/validators.js';
import { registerSchema, loginSchema, refreshTokenSchema } from '../../utils/validators.js';
import { asyncHandler } from '../../utils/errors.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/rate-limit.middleware.js';

const router = Router();

/**
 * POST /auth/register
 * Register a new user
 */
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { user, tokens } = await authService.register(req.body);

    res.status(201).json({
      success: true,
      data: {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      message: 'Registration successful',
    });
  })
);

/**
 * POST /auth/login
 * Login user and get tokens
 */
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { user, tokens } = await authService.login(req.body);

    res.json({
      success: true,
      data: {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      message: 'Login successful',
    });
  })
);

/**
 * POST /auth/refresh
 * Refresh access token
 */
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const tokens = await authService.refreshAccessToken(req.body.refreshToken);

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      message: 'Token refreshed successfully',
    });
  })
);

/**
 * POST /auth/logout
 * Logout user (invalidate refresh token)
 */
router.post(
  '/logout',
  validate(refreshTokenSchema),
  asyncHandler(async (req: Request, res: Response) => {
    await authService.logout(req.body.refreshToken);

    res.json({
      success: true,
      message: 'Logout successful',
    });
  })
);

/**
 * GET /auth/me
 * Get current authenticated user
 */
router.get(
  '/me',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error('User not found in request');
    }

    res.json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          name: req.user.name,
          plan: req.user.plan,
          isActive: req.user.isActive,
          emailVerified: req.user.emailVerified,
          createdAt: req.user.createdAt,
        },
      },
    });
  })
);

export default router;
