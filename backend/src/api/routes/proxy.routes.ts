import { Router, Request, Response } from 'express';
import { proxySessionManager } from '../../core/proxy/session-manager.js';
import { certificateManager } from '../../core/proxy/certificate-manager.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/errors.js';
import { validate } from '../../utils/validators.js';
import { proxySessionSettingsSchema } from '../../utils/validators.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /proxy/certificate
 * Download user's Root CA certificate (authenticated)
 */
router.get(
  '/certificate',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    // Ensure Root CA exists
    let rootCA = await certificateManager.getRootCAForUser(userId);

    if (!rootCA) {
      await certificateManager.generateRootCA(userId);
      rootCA = await certificateManager.getRootCAForUser(userId);
    }

    // Export certificate for download
    const certBuffer = await certificateManager.exportRootCAForDownload(userId);

    res.setHeader('Content-Type', 'application/x-x509-ca-cert');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="reqsploit-ca-${userId.slice(0, 8)}.crt"`
    );
    res.send(certBuffer);
  })
);

/**
 * POST /proxy/session/start
 * Start a new proxy session for the authenticated user
 */
router.post(
  '/session/start',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { interceptMode, filters } = req.body;

    const session = await proxySessionManager.createSession(
      userId,
      interceptMode || false,
      filters
    );

    // Check if Root CA exists
    const rootCA = await certificateManager.getRootCAForUser(userId);

    res.json({
      success: true,
      data: {
        session: {
          sessionId: session.sessionId,
          proxyPort: session.proxyPort,
          interceptMode: session.interceptMode,
          isActive: session.isActive,
          createdAt: session.createdAt,
        },
        certificateStatus: {
          hasRootCA: !!rootCA,
          needsInstallation: !rootCA,
        },
      },
      message: 'Proxy session started successfully',
    });
  })
);

/**
 * DELETE /proxy/session/stop
 * Stop the active proxy session
 */
router.delete(
  '/session/stop',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    await proxySessionManager.destroySession(userId);

    res.json({
      success: true,
      message: 'Proxy session stopped successfully',
    });
  })
);

/**
 * GET /proxy/session/status
 * Get current proxy session status
 */
router.get(
  '/session/status',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const session = await proxySessionManager.getSessionInfo(userId);
    const activeSession = proxySessionManager.getSessionByUserId(userId);

    if (!session) {
      return res.json({
        success: true,
        data: {
          hasActiveSession: false,
        },
      });
    }

    const stats = activeSession?.proxy.getStats();

    res.json({
      success: true,
      data: {
        hasActiveSession: true,
        session: {
          sessionId: session.sessionId,
          proxyPort: session.proxyPort,
          interceptMode: session.interceptMode,
          isActive: session.isActive,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
        },
        stats: stats || null,
      },
    });
  })
);

/**
 * PATCH /proxy/session/settings
 * Update proxy session settings
 */
router.patch(
  '/session/settings',
  validate(proxySessionSettingsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { interceptMode, filters } = req.body;

    await proxySessionManager.updateSessionSettings(userId, {
      interceptMode,
      filters,
    });

    res.json({
      success: true,
      message: 'Proxy settings updated successfully',
    });
  })
);

/**
 * GET /proxy/sessions/active
 * Get count of active sessions (admin only - future)
 */
router.get(
  '/sessions/active',
  asyncHandler(async (req: Request, res: Response) => {
    const count = proxySessionManager.getActiveSessionCount();

    res.json({
      success: true,
      data: {
        activeSessionsCount: count,
      },
    });
  })
);

export default router;
