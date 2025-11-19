import { Router, Request, Response } from 'express';
import { auth } from '../middleware/auth.js';
import { scannerService } from '../core/scanner/scanner.service.js';
import { Severity, AssetCategory } from '@prisma/client';
import { scanLogger } from '../utils/logger.js';

const router = Router();

/**
 * GET /api/scan/results
 * Get scan results with pagination and filtering
 */
router.get('/results', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const {
      limit = '50',
      offset = '0',
      severity,
      category,
      requestId,
      includeSafe = 'false',
    } = req.query;

    const results = await scannerService.getResults(userId, {
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
      severity: severity as Severity | undefined,
      category: category as AssetCategory | undefined,
      requestId: requestId as string | undefined,
      includeSafe: includeSafe === 'true',
    });

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    scanLogger.error('Failed to fetch scan results', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scan results',
    });
  }
});

/**
 * GET /api/scan/stats
 * Get scan statistics
 */
router.get('/stats', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const stats = await scannerService.getStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    scanLogger.error('Failed to fetch scan stats', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scan statistics',
    });
  }
});

/**
 * POST /api/scan/mark-safe/:id
 * Mark a finding as safe
 */
router.post('/mark-safe/:id', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    await scannerService.markAsSafe(userId, id);

    res.json({
      success: true,
      message: 'Finding marked as safe',
    });
  } catch (error) {
    scanLogger.error('Failed to mark finding as safe', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to mark finding as safe',
    });
  }
});

/**
 * POST /api/scan/mark-false-positive/:id
 * Mark a finding as false positive
 */
router.post('/mark-false-positive/:id', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    await scannerService.markAsFalsePositive(userId, id);

    res.json({
      success: true,
      message: 'Finding marked as false positive',
    });
  } catch (error) {
    scanLogger.error('Failed to mark finding as false positive', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to mark finding as false positive',
    });
  }
});

/**
 * DELETE /api/scan/result/:id
 * Delete a finding
 */
router.delete('/result/:id', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    await scannerService.deleteResult(userId, id);

    res.json({
      success: true,
      message: 'Finding deleted',
    });
  } catch (error) {
    scanLogger.error('Failed to delete finding', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to delete finding',
    });
  }
});

/**
 * POST /api/scan/rescan/:requestId
 * Rescan a specific request
 */
router.post('/rescan/:requestId', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { requestId } = req.params;

    const matches = await scannerService.rescanRequest(userId, requestId);

    res.json({
      success: true,
      data: {
        requestId,
        findingsCount: matches.length,
        findings: matches.map(m => ({
          type: m.pattern.type,
          severity: m.pattern.severity,
          category: m.pattern.category,
          value: m.maskedValue,
          confidence: m.confidence,
          location: m.location,
        })),
      },
    });
  } catch (error) {
    scanLogger.error('Failed to rescan request', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to rescan request',
    });
  }
});

/**
 * GET /api/scan/patterns
 * Get available scan patterns
 */
router.get('/patterns', auth, async (req: Request, res: Response) => {
  try {
    const { SCAN_PATTERNS } = await import('../core/scanner/scan-patterns.js');

    const patterns = SCAN_PATTERNS.map(p => ({
      id: p.id,
      category: p.category,
      type: p.type,
      severity: p.severity,
      description: p.description,
      enabled: p.enabled,
    }));

    res.json({
      success: true,
      data: patterns,
    });
  } catch (error) {
    scanLogger.error('Failed to fetch patterns', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scan patterns',
    });
  }
});

export default router;
