/**
 * Work Session Routes
 * API endpoints for managing work sessions
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { asyncHandler, ValidationError } from '../../utils/errors.js';
import { workSessionService } from '../../services/work-session.service.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /work-sessions
 * Get all work sessions for the current user
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string, 10) || 50;

    const sessions = await workSessionService.getUserSessions(userId, limit);

    res.json({
      success: true,
      data: sessions,
      message: 'Work sessions retrieved successfully',
    });
  })
);

/**
 * GET /work-sessions/active
 * Get the active work session for the current user
 */
router.get(
  '/active',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const session = await workSessionService.getActiveSession(userId);

    res.json({
      success: true,
      data: session,
      message: session ? 'Active session found' : 'No active session',
    });
  })
);

/**
 * GET /work-sessions/:sessionId
 * Get details for a specific work session
 */
router.get(
  '/:sessionId',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { sessionId } = req.params;

    const session = await workSessionService.getSessionDetails(userId, sessionId);

    res.json({
      success: true,
      data: session,
      message: 'Session details retrieved successfully',
    });
  })
);

/**
 * POST /work-sessions
 * Create a new work session
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { name, description, projectId } = req.body;

    if (!name || name.trim().length === 0) {
      throw new ValidationError('Session name is required');
    }

    const session = await workSessionService.createSession(userId, {
      name,
      description,
      projectId,
    });

    res.json({
      success: true,
      data: session,
      message: 'Work session created successfully',
    });
  })
);

/**
 * PUT /work-sessions/:sessionId
 * Update a work session
 */
router.put(
  '/:sessionId',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { sessionId } = req.params;
    const { name, description } = req.body;

    const session = await workSessionService.updateSession(userId, sessionId, {
      name,
      description,
    });

    res.json({
      success: true,
      data: session,
      message: 'Work session updated successfully',
    });
  })
);

/**
 * POST /work-sessions/:sessionId/end
 * End a work session
 */
router.post(
  '/:sessionId/end',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { sessionId } = req.params;

    const session = await workSessionService.endSession(userId, sessionId);

    res.json({
      success: true,
      data: session,
      message: 'Work session ended successfully',
    });
  })
);

/**
 * DELETE /work-sessions/:sessionId
 * Delete a work session
 */
router.delete(
  '/:sessionId',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { sessionId } = req.params;

    await workSessionService.deleteSession(userId, sessionId);

    res.json({
      success: true,
      message: 'Work session deleted successfully',
    });
  })
);

export default router;
