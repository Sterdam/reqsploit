import { Router, Request, Response } from 'express';
import { certificateManager } from '../../core/proxy/certificate-manager.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/errors.js';
import { prisma } from '../../lib/prisma.js';

const router = Router();

/**
 * GET /certificates/default/download
 * Download default Root CA certificate (NO AUTH REQUIRED for extension)
 * This is the certificate used by the extension when not logged in
 */
router.get(
  '/default/download',
  asyncHandler(async (req: Request, res: Response) => {
    // Get the default extension user
    const defaultUser = await prisma.user.findUnique({
      where: { email: 'extension@reqsploit.local' },
    });

    if (!defaultUser) {
      return res.status(404).json({
        success: false,
        error: 'Default certificate not available. Please restart the backend.',
      });
    }

    // Get or generate Root CA for default user
    let rootCA = await certificateManager.getRootCAForUser(defaultUser.id);
    if (!rootCA) {
      await certificateManager.generateRootCA(defaultUser.id);
    }

    // Export certificate for download
    const certBuffer = await certificateManager.exportRootCAForDownload(defaultUser.id);

    res.setHeader('Content-Type', 'application/x-x509-ca-cert');
    res.setHeader('Content-Disposition', 'attachment; filename="reqsploit-ca.crt"');
    res.send(certBuffer);
  })
);

// All routes below require authentication
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
 * GET /certificates/default/status
 * Check if default Root CA exists (NO AUTH REQUIRED)
 */
router.get(
  '/default/status',
  asyncHandler(async (req: Request, res: Response) => {
    const defaultUser = await prisma.user.findUnique({
      where: { email: 'extension@reqsploit.local' },
    });

    if (!defaultUser) {
      return res.json({
        success: true,
        data: {
          hasRootCA: false,
          message: 'Default certificate not available. Please restart the backend.',
        },
      });
    }

    const rootCA = await certificateManager.getRootCAForUser(defaultUser.id);

    res.json({
      success: true,
      data: {
        hasRootCA: !!rootCA,
        message: rootCA
          ? 'Default Root CA certificate exists'
          : 'Default Root CA not generated yet.',
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

/**
 * POST /certificates/mark-installed
 * Mark certificate as installed for the user (NO AUTH REQUIRED for extension)
 */
router.post(
  '/mark-installed',
  asyncHandler(async (req: Request, res: Response) => {
    // This is just a client-side flag, no server state needed
    res.json({
      success: true,
      message: 'Certificate marked as installed',
    });
  })
);

export default router;
