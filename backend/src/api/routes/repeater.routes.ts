import { Router, Request, Response } from 'express';
import { repeaterService, RepeaterRequest } from '../../services/repeater.service.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/errors.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /repeater/send
 * Send a modified request and get response
 */
router.post(
  '/send',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { method, url, headers, body, name, originalRequestId } = req.body;

    if (!method || !url) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Missing required fields: method, url',
          code: 'VALIDATION_ERROR',
        },
      });
    }

    const request: RepeaterRequest = {
      userId,
      method,
      url,
      headers: headers || {},
      body,
      name,
      originalRequestId,
    };

    const response = await repeaterService.sendRequest(request);

    res.json({
      success: true,
      data: {
        request: {
          method: request.method,
          url: request.url,
          headers: request.headers,
          body: request.body,
        },
        response: {
          statusCode: response.statusCode,
          statusMessage: response.statusMessage,
          headers: response.headers,
          body: response.body,
          responseTime: response.responseTime,
          timestamp: response.timestamp,
        },
      },
    });
  })
);

/**
 * POST /repeater/templates
 * Save a request as a template
 */
router.post(
  '/templates',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { name, method, url, headers, body } = req.body;

    if (!name || !method || !url) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Missing required fields: name, method, url',
          code: 'VALIDATION_ERROR',
        },
      });
    }

    const request: RepeaterRequest = {
      userId,
      method,
      url,
      headers: headers || {},
      body,
    };

    const template = await repeaterService.saveTemplate(userId, name, request);

    res.json({
      success: true,
      data: template,
      message: 'Template saved successfully',
    });
  })
);

/**
 * GET /repeater/templates
 * Get all saved templates for user
 */
router.get(
  '/templates',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const templates = await repeaterService.getTemplates(userId);

    res.json({
      success: true,
      data: templates,
    });
  })
);

/**
 * DELETE /repeater/templates/:id
 * Delete a template
 */
router.delete(
  '/templates/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const templateId = req.params.id;

    await repeaterService.deleteTemplate(userId, templateId);

    res.json({
      success: true,
      message: 'Template deleted successfully',
    });
  })
);

/**
 * GET /repeater/load/:requestId
 * Load a request from history into Repeater
 */
router.get(
  '/load/:requestId',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const requestId = req.params.requestId;

    const request = await repeaterService.loadFromHistory(userId, requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Request not found',
          code: 'NOT_FOUND',
        },
      });
    }

    res.json({
      success: true,
      data: request,
    });
  })
);

export default router;
