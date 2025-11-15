/**
 * Request Logs API Routes
 */

import { Router, Request, Response } from 'express';

import { RequestLogService } from '../services/request-log.service';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
import { prisma } from '../lib/prisma.js';

const requestLogService = new RequestLogService(prisma);

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/requests
 * List and filter request logs
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const options = {
      userId,
      projectId: req.query.projectId as string | undefined,
      proxySessionId: req.query.proxySessionId as string | undefined,
      methods: req.query.methods ? (req.query.methods as string).split(',') : undefined,
      statusCodes: req.query.statusCodes
        ? (req.query.statusCodes as string).split(',').map(Number)
        : undefined,
      search: req.query.search as string | undefined,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      starred: req.query.starred === 'true' ? true : req.query.starred === 'false' ? false : undefined,
      isIntercepted: req.query.isIntercepted === 'true' ? true : req.query.isIntercepted === 'false' ? false : undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      sortBy: req.query.sortBy as 'timestamp' | 'duration' | 'statusCode' | undefined,
      sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
    };

    const result = await requestLogService.filterRequestLogs(options);

    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        offset: options.offset || 0,
        limit: options.limit || 50,
        hasMore: result.hasMore,
      },
    });
  } catch (error: any) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/requests/:id
 * Get single request log by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const requestLog = await requestLogService.getRequestLog(id, userId);

    if (!requestLog) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    res.json({ success: true, data: requestLog });
  } catch (error: any) {
    console.error('Error fetching request:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/requests/:id/tags
 * Update request tags
 */
router.patch('/:id/tags', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { tags } = req.body;

    if (!Array.isArray(tags)) {
      return res.status(400).json({ success: false, error: 'Tags must be an array' });
    }

    const requestLog = await requestLogService.updateTags(id, userId, tags);

    res.json({ success: true, data: requestLog });
  } catch (error: any) {
    console.error('Error updating tags:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/requests/:id/tags
 * Add tag to request
 */
router.post('/:id/tags', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { tag } = req.body;

    if (!tag || typeof tag !== 'string') {
      return res.status(400).json({ success: false, error: 'Tag must be a string' });
    }

    const requestLog = await requestLogService.addTag(id, userId, tag);

    res.json({ success: true, data: requestLog });
  } catch (error: any) {
    console.error('Error adding tag:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/requests/:id/tags/:tag
 * Remove tag from request
 */
router.delete('/:id/tags/:tag', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id, tag } = req.params;

    const requestLog = await requestLogService.removeTag(id, userId, tag);

    res.json({ success: true, data: requestLog });
  } catch (error: any) {
    console.error('Error removing tag:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/requests/:id/starred
 * Toggle starred status
 */
router.patch('/:id/starred', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const requestLog = await requestLogService.toggleStarred(id, userId);

    res.json({ success: true, data: requestLog });
  } catch (error: any) {
    console.error('Error toggling starred:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/requests/:id/project
 * Assign request to project
 */
router.patch('/:id/project', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { projectId } = req.body;

    const requestLog = await requestLogService.assignToProject(
      id,
      userId,
      projectId || null
    );

    res.json({ success: true, data: requestLog });
  } catch (error: any) {
    console.error('Error assigning to project:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/requests/stats
 * Get request statistics
 */
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const options = {
      projectId: req.query.projectId as string | undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    };

    const stats = await requestLogService.getStatistics(userId, options);

    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/requests/:id/related
 * Get related requests
 */
router.get('/:id/related', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const relatedRequests = await requestLogService.getRelatedRequests(id, userId, limit);

    res.json({ success: true, data: relatedRequests });
  } catch (error: any) {
    console.error('Error fetching related requests:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/requests/export/json
 * Export requests as JSON
 */
router.get('/export/json', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const options = {
      userId,
      projectId: req.query.projectId as string | undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    };

    const jsonData = await requestLogService.exportAsJSON(options);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=requests-${Date.now()}.json`);
    res.send(jsonData);
  } catch (error: any) {
    console.error('Error exporting JSON:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/requests/export/csv
 * Export requests as CSV
 */
router.get('/export/csv', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const options = {
      userId,
      projectId: req.query.projectId as string | undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    };

    const csvData = await requestLogService.exportAsCSV(options);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=requests-${Date.now()}.csv`);
    res.send(csvData);
  } catch (error: any) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/requests/cleanup
 * Delete old requests (retention policy)
 */
router.delete('/cleanup', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { olderThanDays } = req.body;

    if (!olderThanDays || typeof olderThanDays !== 'number') {
      return res.status(400).json({ success: false, error: 'olderThanDays must be a number' });
    }

    const deletedCount = await requestLogService.deleteOldLogs(userId, olderThanDays);

    res.json({ success: true, data: { deletedCount } });
  } catch (error: any) {
    console.error('Error cleaning up requests:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
