import { Router, Request, Response } from 'express';
import { proxySessionManager } from '../../core/proxy/session-manager.js';
import { certificateManager } from '../../core/proxy/certificate-manager.js';
import { extensionManager } from '../../core/websocket/extension-manager.js';
import { cdpRequestQueue } from '../../core/proxy/cdp-request-queue.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/errors.js';
import { validate } from '../../utils/validators.js';
import { proxySessionSettingsSchema } from '../../utils/validators.js';
import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../utils/errors.js';

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
 * CDP mode: lightweight session, no port allocation
 * Legacy mode: full MITM proxy (fallback)
 */
router.post(
  '/session/start',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { interceptMode, filters, mode } = req.body;

    const session = await proxySessionManager.createSession(
      userId,
      interceptMode || false,
      filters,
      mode || 'cdp'
    );

    const extConnection = extensionManager.getConnection(userId);

    res.json({
      success: true,
      data: {
        session: {
          sessionId: session.sessionId,
          mode: (session as any).mode || 'cdp',
          interceptMode: session.interceptMode,
          isActive: session.isActive,
          createdAt: session.createdAt,
        },
        extension: {
          isConnected: !!extConnection,
          version: extConnection?.version || null,
          attachedTabs: extConnection?.attachedTabs || [],
        },
      },
      message: 'Session started successfully',
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
 * Get current proxy session status + extension connection info
 */
router.get(
  '/session/status',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const session = await proxySessionManager.getSessionInfo(userId);
    const activeSession = proxySessionManager.getSessionByUserId(userId);
    const extConnection = extensionManager.getConnection(userId);

    if (!session) {
      return res.json({
        success: true,
        data: {
          hasActiveSession: false,
          extension: {
            isConnected: !!extConnection,
            version: extConnection?.version || null,
            attachedTabs: extConnection?.attachedTabs || [],
          },
        },
      });
    }

    // CDP mode: get queue stats; Legacy mode: get proxy stats
    const isCDP = !activeSession?.proxy;
    const stats = isCDP
      ? cdpRequestQueue.getStats()
      : activeSession?.proxy?.getStats?.() || null;

    res.json({
      success: true,
      data: {
        hasActiveSession: true,
        session: {
          sessionId: session.sessionId,
          mode: (session as any).mode || 'cdp',
          interceptMode: session.interceptMode,
          isActive: session.isActive,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
        },
        extension: {
          isConnected: !!extConnection,
          version: extConnection?.version || null,
          attachedTabs: extConnection?.attachedTabs || [],
        },
        stats,
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

/**
 * DELETE /proxy/request/:requestId
 * Delete a single request log
 */
router.delete(
  '/request/:requestId',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { requestId } = req.params;

    // Verify ownership before deletion
    const request = await prisma.requestLog.findFirst({
      where: {
        id: requestId,
        userId, // User-scoped security
      },
    });

    if (!request) {
      throw new NotFoundError('Request not found or unauthorized');
    }

    // Delete request (cascade will delete related AI analyses & vulnerabilities)
    await prisma.requestLog.delete({
      where: { id: requestId },
    });

    res.json({
      success: true,
      message: 'Request deleted successfully',
    });
  })
);

/**
 * POST /proxy/intercept/undo
 * Undo drop for one or more requests (within grace period)
 * Supports both CDP queue and legacy proxy queue
 */
router.post(
  '/intercept/undo',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { requestId, requestIds } = req.body;

    // Try CDP queue first (extension connected)
    if (extensionManager.isConnected(userId)) {
      // Single undo
      if (requestId) {
        const success = cdpRequestQueue.undoDrop(requestId);
        return res.json({
          success,
          requestId,
          message: success
            ? 'Request restored to queue'
            : 'Cannot undo: grace period expired or request not found',
        });
      }

      // Bulk undo
      if (requestIds && Array.isArray(requestIds)) {
        const results = { success: [] as string[], failed: [] as string[] };
        for (const id of requestIds) {
          if (cdpRequestQueue.undoDrop(id)) {
            results.success.push(id);
          } else {
            results.failed.push(id);
          }
        }
        return res.json({
          success: results.success.length > 0,
          restored: results.success,
          failed: results.failed,
          message: `Restored ${results.success.length}/${requestIds.length} requests`,
        });
      }
    }

    // Fallback: legacy proxy queue
    const session = proxySessionManager.getSessionByUserId(userId);
    if (!session || !session.proxy) {
      return res.status(404).json({
        success: false,
        message: 'No active proxy session found',
      });
    }

    const queue = session.proxy.getRequestQueue();

    if (requestId) {
      const success = queue.undoDrop(requestId);
      return res.json({
        success,
        requestId,
        message: success
          ? 'Request restored to queue'
          : 'Cannot undo: grace period expired or request not found',
      });
    }

    if (requestIds && Array.isArray(requestIds)) {
      const results = queue.bulkUndoDrop(requestIds);
      return res.json({
        success: results.success.length > 0,
        restored: results.success,
        failed: results.failed,
        message: `Restored ${results.success.length}/${requestIds.length} requests`,
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Either requestId or requestIds array is required',
    });
  })
);

export default router;
