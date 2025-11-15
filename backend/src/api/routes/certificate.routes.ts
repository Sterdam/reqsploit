import { Router, Request, Response } from 'express';
import { certificateManager } from '../../core/proxy/certificate-manager.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/errors.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /certificates/root/download
 * Download Root CA certificate for installation
 */
router.get(
  '/root/download',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    // Ensure Root CA exists (generate if not)
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
 * GET /certificates/root/status
 * Check if Root CA exists for user
 */
router.get(
  '/root/status',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const rootCA = await certificateManager.getRootCAForUser(userId);

    res.json({
      success: true,
      data: {
        hasRootCA: !!rootCA,
        message: rootCA
          ? 'Root CA certificate exists'
          : 'Root CA not generated yet. Start a proxy session to generate one.',
      },
    });
  })
);

/**
 * POST /certificates/root/regenerate
 * Regenerate Root CA certificate (WARNING: will invalidate all existing domain certs)
 */
router.post(
  '/root/regenerate',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    // Note: This will be implemented with proper cleanup later
    // For now, just generate a new one
    await certificateManager.generateRootCA(userId);

    res.json({
      success: true,
      message: 'Root CA regenerated successfully. Please re-download and reinstall.',
    });
  })
);

export default router;
