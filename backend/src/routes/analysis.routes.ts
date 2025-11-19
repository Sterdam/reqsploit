/**
 * AI Analysis API Routes
 */

import { Router, Request, Response } from 'express';
import { PrismaClient, AIMode } from '@prisma/client';
import { AnalysisService } from '../services/analysis.service.js';
import { authenticateToken } from '../api/middlewares/auth.middleware.js';

const router = Router();
import { prisma } from '../lib/prisma.js';

const analysisService = new AnalysisService(prisma);

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/analysis
 * Create a new AI analysis
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { requestLogId, mode, userContext } = req.body;

    if (!requestLogId) {
      return res.status(400).json({
        success: false,
        error: 'requestLogId is required',
      });
    }

    // Validate AI mode
    const validModes: AIMode[] = ['EDUCATIONAL', 'DEFAULT', 'ADVANCED'];
    const aiMode: AIMode = mode && validModes.includes(mode) ? mode : 'DEFAULT';

    // Check token availability
    const tokenStatus = await analysisService.checkTokenAvailability(userId);
    if (!tokenStatus.available) {
      return res.status(403).json({
        success: false,
        error: 'Token limit exceeded',
        data: {
          used: tokenStatus.used,
          limit: tokenStatus.limit,
          remaining: 0,
        },
      });
    }

    // Create analysis
    const result = await analysisService.createAnalysis({
      userId,
      requestLogId,
      mode: aiMode,
      userContext,
    });

    res.status(201).json({
      success: true,
      data: {
        analysis: result.analysis,
        vulnerabilities: result.vulnerabilities,
        tokensRemaining: tokenStatus.remaining - result.analysis.tokensUsed,
      },
    });
  } catch (error: any) {
    console.error('Error creating analysis:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/analysis/:id
 * Get analysis by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const analysis = await analysisService.getAnalysis(id, userId);

    if (!analysis) {
      return res.status(404).json({ success: false, error: 'Analysis not found' });
    }

    res.json({ success: true, data: analysis });
  } catch (error: any) {
    console.error('Error fetching analysis:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/analysis/request/:requestLogId
 * List all analyses for a request
 */
router.get('/request/:requestLogId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { requestLogId } = req.params;

    const analyses = await analysisService.listAnalysesForRequest(requestLogId, userId);

    res.json({ success: true, data: analyses });
  } catch (error: any) {
    console.error('Error fetching analyses:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/analysis/attack-surface/:requestLogId
 * Analyze attack surface for a request
 */
router.get('/attack-surface/:requestLogId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { requestLogId } = req.params;

    const attackSurface = await analysisService.analyzeAttackSurface(requestLogId, userId);

    res.json({ success: true, data: attackSurface });
  } catch (error: any) {
    console.error('Error analyzing attack surface:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/analysis/tokens/status
 * Check token usage status
 */
router.get('/tokens/status', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const tokenStatus = await analysisService.checkTokenAvailability(userId);

    res.json({ success: true, data: tokenStatus });
  } catch (error: any) {
    console.error('Error checking token status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
