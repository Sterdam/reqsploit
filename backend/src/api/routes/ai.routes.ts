import { Router, Request, Response } from 'express';
import { aiAnalyzer } from '../../core/ai/analyzer.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/errors.js';
import { prisma } from '../../server.js';
import { NotFoundError } from '../../utils/errors.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /ai/analyze/request/:requestId
 * Analyze a specific HTTP request
 */
router.post(
  '/analyze/request/:requestId',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { requestId } = req.params;

    // Get request from database
    const requestLog = await prisma.requestLog.findFirst({
      where: {
        id: requestId,
        userId,
      },
    });

    if (!requestLog) {
      throw new NotFoundError('Request not found');
    }

    // Analyze request
    const analysis = await aiAnalyzer.analyzeRequest(userId, requestId, {
      id: requestLog.id,
      method: requestLog.method,
      url: requestLog.url,
      headers: requestLog.headers as Record<string, string>,
      body: requestLog.body || undefined,
      timestamp: requestLog.timestamp,
    });

    res.json({
      success: true,
      data: analysis,
      message: 'Request analysis completed',
    });
  })
);

/**
 * POST /ai/analyze/response/:requestId
 * Analyze a specific HTTP response
 */
router.post(
  '/analyze/response/:requestId',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { requestId } = req.params;

    // Get request from database
    const requestLog = await prisma.requestLog.findFirst({
      where: {
        id: requestId,
        userId,
      },
    });

    if (!requestLog || !requestLog.statusCode) {
      throw new NotFoundError('Request or response not found');
    }

    // Analyze response
    const analysis = await aiAnalyzer.analyzeResponse(
      userId,
      requestId,
      {
        id: requestLog.id,
        method: requestLog.method,
        url: requestLog.url,
        headers: requestLog.headers as Record<string, string>,
        body: requestLog.body || undefined,
        timestamp: requestLog.timestamp,
      },
      {
        statusCode: requestLog.statusCode,
        statusMessage: 'OK',
        headers: (requestLog.responseHeaders as Record<string, string>) || {},
        duration: requestLog.duration || 0,
      }
    );

    res.json({
      success: true,
      data: analysis,
      message: 'Response analysis completed',
    });
  })
);

/**
 * POST /ai/analyze/transaction/:requestId
 * Analyze complete HTTP transaction (request + response)
 */
router.post(
  '/analyze/transaction/:requestId',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { requestId } = req.params;

    // Get request from database
    const requestLog = await prisma.requestLog.findFirst({
      where: {
        id: requestId,
        userId,
      },
    });

    if (!requestLog || !requestLog.statusCode) {
      throw new NotFoundError('Complete transaction not found');
    }

    // Analyze transaction
    const analysis = await aiAnalyzer.analyzeTransaction(
      userId,
      requestId,
      {
        id: requestLog.id,
        method: requestLog.method,
        url: requestLog.url,
        headers: requestLog.headers as Record<string, string>,
        body: requestLog.body || undefined,
        timestamp: requestLog.timestamp,
      },
      {
        statusCode: requestLog.statusCode,
        statusMessage: 'OK',
        headers: (requestLog.responseHeaders as Record<string, string>) || {},
        duration: requestLog.duration || 0,
      }
    );

    res.json({
      success: true,
      data: analysis,
      message: 'Transaction analysis completed',
    });
  })
);

/**
 * GET /ai/analysis/:analysisId
 * Get a specific AI analysis by ID
 */
router.get(
  '/analysis/:analysisId',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { analysisId } = req.params;

    const analysis = await prisma.aIAnalysis.findFirst({
      where: {
        id: analysisId,
        userId,
      },
    });

    if (!analysis) {
      throw new NotFoundError('Analysis not found');
    }

    res.json({
      success: true,
      data: {
        analysisId: analysis.id,
        requestId: analysis.requestId,
        analysisType: analysis.analysisType,
        vulnerabilities: analysis.vulnerabilities,
        suggestions: analysis.suggestions,
        tokensUsed: analysis.tokensUsed,
        model: analysis.model,
        timestamp: analysis.createdAt,
      },
    });
  })
);

/**
 * GET /ai/history
 * Get AI analysis history for the user
 */
router.get(
  '/history',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string, 10) || 50;

    const analyses = await aiAnalyzer.getAnalysisHistory(userId, limit);

    res.json({
      success: true,
      data: {
        analyses,
        count: analyses.length,
      },
    });
  })
);

/**
 * GET /ai/tokens
 * Get token usage for the user
 */
router.get(
  '/tokens',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const usage = await aiAnalyzer.getTokenUsage(userId);

    res.json({
      success: true,
      data: usage,
    });
  })
);

/**
 * POST /ai/exploits/generate
 * Generate exploit payloads for a vulnerability
 */
router.post(
  '/exploits/generate',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { vulnerability } = req.body;

    if (!vulnerability) {
      throw new NotFoundError('Vulnerability data required');
    }

    const exploits = await aiAnalyzer.generateExploits(userId, vulnerability);

    res.json({
      success: true,
      data: {
        exploits,
        count: exploits.length,
      },
      message: 'Exploit payloads generated',
    });
  })
);

export default router;
