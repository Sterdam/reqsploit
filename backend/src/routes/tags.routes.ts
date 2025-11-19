import { Router, Request, Response } from 'express';
import { authenticateToken } from '../api/middlewares/auth.middleware.js';
import { asyncHandler } from '../utils/errors.js';
import { prisma } from '../lib/prisma.js';
import { PREDEFINED_TAGS, TagType } from '../types/tag.types.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /tags/predefined
 * Get list of predefined tags with colors
 */
router.get(
  '/predefined',
  asyncHandler(async (req: Request, res: Response) => {
    res.json({
      success: true,
      tags: PREDEFINED_TAGS,
    });
  })
);

/**
 * GET /tags/stats
 * Get tag usage statistics for current user
 */
router.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    // Get all requests with tags for this user
    const requests = await prisma.requestLog.findMany({
      where: {
        userId,
        tags: { isEmpty: false },
      },
      select: {
        tags: true,
      },
    });

    // Count occurrences of each tag
    const tagCounts: Record<string, number> = {};
    requests.forEach((request) => {
      request.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    // Convert to array with tag definitions
    const stats = Object.entries(tagCounts).map(([tag, count]) => {
      const tagDef = PREDEFINED_TAGS.find((t) => t.id === tag);
      return {
        tag,
        count,
        color: tagDef?.color || '#6B7280', // gray-500 for custom tags
      };
    });

    // Sort by count descending
    stats.sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      stats,
    });
  })
);

/**
 * POST /tags/add
 * Add tag(s) to request(s)
 */
router.post(
  '/add',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { requestIds, tag } = req.body;

    // Validation
    if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
      throw new ValidationError('requestIds array is required');
    }

    if (!tag || typeof tag !== 'string') {
      throw new ValidationError('tag is required and must be a string');
    }

    // Verify all requests belong to user
    const requests = await prisma.requestLog.findMany({
      where: {
        id: { in: requestIds },
        userId,
      },
      select: {
        id: true,
        tags: true,
      },
    });

    if (requests.length !== requestIds.length) {
      throw new NotFoundError('One or more requests not found or unauthorized');
    }

    // Add tag to each request (avoid duplicates)
    const updatePromises = requests.map((request) => {
      const existingTags = request.tags;
      if (existingTags.includes(tag)) {
        // Tag already exists, skip
        return Promise.resolve();
      }

      return prisma.requestLog.update({
        where: { id: request.id },
        data: {
          tags: [...existingTags, tag],
        },
      });
    });

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: `Tag "${tag}" added to ${requestIds.length} request(s)`,
      requestIds,
      tag,
    });
  })
);

/**
 * POST /tags/remove
 * Remove tag(s) from request(s)
 */
router.post(
  '/remove',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { requestIds, tag } = req.body;

    // Validation
    if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
      throw new ValidationError('requestIds array is required');
    }

    if (!tag || typeof tag !== 'string') {
      throw new ValidationError('tag is required and must be a string');
    }

    // Verify all requests belong to user
    const requests = await prisma.requestLog.findMany({
      where: {
        id: { in: requestIds },
        userId,
      },
      select: {
        id: true,
        tags: true,
      },
    });

    if (requests.length !== requestIds.length) {
      throw new NotFoundError('One or more requests not found or unauthorized');
    }

    // Remove tag from each request
    const updatePromises = requests.map((request) => {
      const existingTags = request.tags;
      const updatedTags = existingTags.filter((t) => t !== tag);

      if (existingTags.length === updatedTags.length) {
        // Tag not present, skip
        return Promise.resolve();
      }

      return prisma.requestLog.update({
        where: { id: request.id },
        data: {
          tags: updatedTags,
        },
      });
    });

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: `Tag "${tag}" removed from ${requestIds.length} request(s)`,
      requestIds,
      tag,
    });
  })
);

/**
 * POST /tags/filter
 * Get requests filtered by tags
 */
router.post(
  '/filter',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { tags, matchAll = false, limit = 100, offset = 0 } = req.body;

    // Validation
    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      throw new ValidationError('tags array is required');
    }

    // Build where clause
    const where: any = { userId };

    if (matchAll) {
      // AND logic: request must have ALL specified tags
      where.AND = tags.map((tag: string) => ({
        tags: { has: tag },
      }));
    } else {
      // OR logic: request must have AT LEAST ONE of the specified tags
      where.OR = tags.map((tag: string) => ({
        tags: { has: tag },
      }));
    }

    // Get matching requests
    const [requests, total] = await Promise.all([
      prisma.requestLog.findMany({
        where,
        select: {
          id: true,
          method: true,
          url: true,
          statusCode: true,
          timestamp: true,
          tags: true,
          starred: true,
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.requestLog.count({ where }),
    ]);

    res.json({
      success: true,
      requests,
      total,
      limit,
      offset,
      tags,
      matchAll,
    });
  })
);

/**
 * DELETE /tags/clear/:requestId
 * Clear all tags from a specific request
 */
router.delete(
  '/clear/:requestId',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { requestId } = req.params;

    // Verify request belongs to user
    const request = await prisma.requestLog.findFirst({
      where: {
        id: requestId,
        userId,
      },
    });

    if (!request) {
      throw new NotFoundError('Request not found or unauthorized');
    }

    // Clear all tags
    await prisma.requestLog.update({
      where: { id: requestId },
      data: { tags: [] },
    });

    res.json({
      success: true,
      message: 'All tags cleared from request',
      requestId,
    });
  })
);

export default router;
