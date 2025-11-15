import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/errors.js';
import { prisma } from '../../lib/prisma.js';
import { campaignManager, type CampaignConfig } from '../../services/campaign-manager.service.js';
import { PayloadEngine, type AttackType, type PayloadSet } from '../../services/payload-engine.service.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /intruder/campaigns
 * Create a new fuzzing campaign
 */
router.post(
  '/campaigns',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { name, requestTemplate, payloadPositions, payloadSets, attackType, concurrency, delayMs } = req.body;

    // Validate required fields
    if (!name || !requestTemplate || !payloadPositions || !payloadSets || !attackType) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Missing required fields',
          code: 'VALIDATION_ERROR',
        },
      });
    }

    // Calculate total requests
    const totalRequests = PayloadEngine.calculateTotalRequests(attackType, payloadSets);

    // Create campaign
    const campaign = await prisma.fuzzingCampaign.create({
      data: {
        userId,
        name,
        requestTemplate,
        payloadPositions,
        payloadSets,
        attackType,
        concurrency: concurrency || 5,
        delayMs: delayMs || 0,
        totalRequests,
        status: 'pending',
      },
    });

    res.json({
      success: true,
      data: campaign,
    });
  })
);

/**
 * GET /intruder/campaigns
 * List all campaigns for user
 */
router.get(
  '/campaigns',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const campaigns = await prisma.fuzzingCampaign.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: campaigns,
    });
  })
);

/**
 * GET /intruder/campaigns/:id
 * Get campaign details
 */
router.get(
  '/campaigns/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;

    const campaign = await prisma.fuzzingCampaign.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        results: {
          orderBy: { timestamp: 'desc' },
          take: 100, // Limit to last 100 results
        },
      },
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Campaign not found',
          code: 'NOT_FOUND',
        },
      });
    }

    res.json({
      success: true,
      data: campaign,
    });
  })
);

/**
 * POST /intruder/campaigns/:id/start
 * Start a campaign
 */
router.post(
  '/campaigns/:id/start',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;

    const campaign = await prisma.fuzzingCampaign.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Campaign not found',
          code: 'NOT_FOUND',
        },
      });
    }

    // Start campaign (non-blocking)
    const config: CampaignConfig = {
      id: campaign.id,
      userId: campaign.userId,
      name: campaign.name,
      requestTemplate: campaign.requestTemplate as any,
      payloadPositions: campaign.payloadPositions as any,
      payloadSets: campaign.payloadSets as any,
      attackType: campaign.attackType as AttackType,
      concurrency: campaign.concurrency,
      delayMs: campaign.delayMs,
    };

    // Start campaign in background
    campaignManager.startCampaign(config).catch((error) => {
      console.error('Campaign execution failed:', error);
    });

    res.json({
      success: true,
      data: {
        message: 'Campaign started',
        campaignId: id,
      },
    });
  })
);

/**
 * POST /intruder/campaigns/:id/pause
 * Pause a running campaign
 */
router.post(
  '/campaigns/:id/pause',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await campaignManager.pauseCampaign(id);

    res.json({
      success: true,
      data: {
        message: 'Campaign paused',
      },
    });
  })
);

/**
 * POST /intruder/campaigns/:id/resume
 * Resume a paused campaign
 */
router.post(
  '/campaigns/:id/resume',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await campaignManager.resumeCampaign(id);

    res.json({
      success: true,
      data: {
        message: 'Campaign resumed',
      },
    });
  })
);

/**
 * POST /intruder/campaigns/:id/stop
 * Stop a campaign
 */
router.post(
  '/campaigns/:id/stop',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await campaignManager.stopCampaign(id);

    res.json({
      success: true,
      data: {
        message: 'Campaign stopped',
      },
    });
  })
);

/**
 * GET /intruder/campaigns/:id/progress
 * Get campaign progress
 */
router.get(
  '/campaigns/:id/progress',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const progress = await campaignManager.getProgress(id);

    res.json({
      success: true,
      data: progress,
    });
  })
);

/**
 * GET /intruder/campaigns/:id/results
 * Get campaign results with filtering
 */
router.get(
  '/campaigns/:id/results',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const { statusCode, minLength, maxLength, limit = 100 } = req.query;

    // Verify campaign ownership
    const campaign = await prisma.fuzzingCampaign.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Campaign not found',
          code: 'NOT_FOUND',
        },
      });
    }

    // Build where clause for filtering
    const where: any = {
      campaignId: id,
    };

    if (statusCode) {
      where.statusCode = parseInt(statusCode as string);
    }

    if (minLength) {
      where.responseLength = { ...where.responseLength, gte: parseInt(minLength as string) };
    }

    if (maxLength) {
      where.responseLength = { ...where.responseLength, lte: parseInt(maxLength as string) };
    }

    const results = await prisma.fuzzingResult.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: results,
    });
  })
);

/**
 * DELETE /intruder/campaigns/:id
 * Delete a campaign and all its results
 */
router.delete(
  '/campaigns/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;

    // Verify campaign ownership
    const campaign = await prisma.fuzzingCampaign.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Campaign not found',
          code: 'NOT_FOUND',
        },
      });
    }

    // Stop if running
    if (campaign.status === 'running') {
      await campaignManager.stopCampaign(id);
    }

    // Delete campaign (cascade deletes results)
    await prisma.fuzzingCampaign.delete({
      where: { id },
    });

    res.json({
      success: true,
      data: {
        message: 'Campaign deleted',
      },
    });
  })
);

/**
 * GET /intruder/payloads/builtin
 * Get list of built-in payload types
 */
router.get(
  '/payloads/builtin',
  asyncHandler(async (req: Request, res: Response) => {
    const builtinTypes = [
      { id: 'sqli', name: 'SQL Injection', count: PayloadEngine.getBuiltinPayloads('sqli').length },
      { id: 'xss', name: 'XSS', count: PayloadEngine.getBuiltinPayloads('xss').length },
      { id: 'lfi', name: 'LFI/RFI', count: PayloadEngine.getBuiltinPayloads('lfi').length },
      {
        id: 'command_injection',
        name: 'Command Injection',
        count: PayloadEngine.getBuiltinPayloads('command_injection').length,
      },
    ];

    res.json({
      success: true,
      data: builtinTypes,
    });
  })
);

/**
 * POST /intruder/payloads/generate
 * Generate payloads (number range, etc.)
 */
router.post(
  '/payloads/generate',
  asyncHandler(async (req: Request, res: Response) => {
    const { type, config } = req.body;

    let payloads: string[] = [];

    if (type === 'numbers' && config) {
      payloads = PayloadEngine.generateNumberRange(config);
    } else if (type === 'simple_list' && config?.items) {
      payloads = PayloadEngine.generateSimpleList(config.items);
    }

    res.json({
      success: true,
      data: { payloads },
    });
  })
);

export default router;
