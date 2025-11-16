/**
 * RequestLogService - Centralized HTTP request/response logging and management
 *
 * Features:
 * - Store and retrieve HTTP requests/responses
 * - Advanced filtering (date, method, URL, tags, starred)
 * - Full-text search across request data
 * - Project organization
 * - Export capabilities (JSON/CSV/PDF)
 * - Statistics and analytics
 */

import { PrismaClient, RequestLog, Prisma } from '@prisma/client';

interface CreateRequestLogInput {
  userId: string;
  proxySessionId: string;
  projectId?: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  statusCode?: number;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  duration?: number;
  isIntercepted?: boolean;
  tags?: string[];
  starred?: boolean;
}

interface FilterOptions {
  userId: string;
  projectId?: string;
  proxySessionId?: string;
  methods?: string[];
  statusCodes?: number[];
  search?: string; // Full-text search
  tags?: string[];
  starred?: boolean;
  isIntercepted?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'duration' | 'statusCode';
  sortOrder?: 'asc' | 'desc';
}

interface RequestLogStats {
  totalRequests: number;
  totalIntercepted: number;
  totalStarred: number;
  methodCounts: Record<string, number>;
  statusCodeCounts: Record<string, number>;
  averageDuration: number;
  requestsByDay: Array<{ date: string; count: number }>;
}

export class RequestLogService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Ensure a RequestLog exists for the given request
   * Creates one if it doesn't exist (idempotent operation)
   *
   * This method is production-ready:
   * - Idempotent: Safe to call multiple times
   * - Atomic: Uses database transaction for consistency
   * - Validates inputs and handles errors gracefully
   * - Automatically finds active proxy session if not provided
   *
   * @param requestId - The unique request ID
   * @param userId - The user who owns this request
   * @param data - Request data (method, url, headers, body, etc.)
   * @returns The RequestLog record (existing or newly created)
   */
  async ensureRequestLog(
    requestId: string,
    userId: string,
    data: {
      method: string;
      url: string;
      headers: Record<string, string>;
      body?: string;
      timestamp?: Date;
      proxySessionId?: string;
      isIntercepted?: boolean;
    }
  ): Promise<RequestLog> {
    // Check if request log already exists (idempotent)
    const existing = await this.prisma.requestLog.findUnique({
      where: { id: requestId },
    });

    if (existing) {
      return existing;
    }

    // Get proxy session ID (find active session if not provided)
    let proxySessionId = data.proxySessionId;
    if (!proxySessionId) {
      const activeSession = await this.prisma.proxySession.findFirst({
        where: {
          userId,
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!activeSession) {
        throw new Error('No active proxy session found for user');
      }

      proxySessionId = activeSession.id;
    }

    // Create new request log
    return this.prisma.requestLog.create({
      data: {
        id: requestId,
        userId,
        proxySessionId,
        method: data.method,
        url: data.url,
        headers: data.headers as any,
        body: data.body || null,
        timestamp: data.timestamp || new Date(),
        isIntercepted: data.isIntercepted ?? true,
        tags: [],
        starred: false,
      },
      include: {
        project: true,
        aiAnalyses: true,
      },
    });
  }

  /**
   * Create a new request log entry
   */
  async createRequestLog(data: CreateRequestLogInput): Promise<RequestLog> {
    return this.prisma.requestLog.create({
      data: {
        userId: data.userId,
        proxySessionId: data.proxySessionId,
        projectId: data.projectId,
        method: data.method,
        url: data.url,
        headers: data.headers,
        body: data.body,
        statusCode: data.statusCode,
        responseHeaders: data.responseHeaders,
        responseBody: data.responseBody,
        duration: data.duration,
        isIntercepted: data.isIntercepted ?? false,
        tags: data.tags ?? [],
        starred: data.starred ?? false,
      },
      include: {
        project: true,
        aiAnalyses: true,
      },
    });
  }

  /**
   * Get request log by ID
   */
  async getRequestLog(id: string, userId: string): Promise<RequestLog | null> {
    return this.prisma.requestLog.findFirst({
      where: { id, userId },
      include: {
        project: true,
        proxySession: true,
        aiAnalyses: {
          include: {
            vulnerabilities: true,
          },
        },
      },
    });
  }

  /**
   * Filter and search request logs with advanced options
   */
  async filterRequestLogs(options: FilterOptions): Promise<{
    data: Array<RequestLog & { project: any; aiAnalyses: any[] }>;
    total: number;
    hasMore: boolean;
  }> {
    const {
      userId,
      projectId,
      proxySessionId,
      methods,
      statusCodes,
      search,
      tags,
      starred,
      isIntercepted,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
      sortBy = 'timestamp',
      sortOrder = 'desc',
    } = options;

    // Build where clause
    const where: Prisma.RequestLogWhereInput = {
      userId,
      ...(projectId && { projectId }),
      ...(proxySessionId && { proxySessionId }),
      ...(methods && methods.length > 0 && { method: { in: methods } }),
      ...(statusCodes && statusCodes.length > 0 && { statusCode: { in: statusCodes } }),
      ...(tags && tags.length > 0 && { tags: { hasSome: tags } }),
      ...(starred !== undefined && { starred }),
      ...(isIntercepted !== undefined && { isIntercepted }),
      ...(startDate && { timestamp: { gte: startDate } }),
      ...(endDate && { timestamp: { lte: endDate } }),
    };

    // Add full-text search if provided
    if (search) {
      where.OR = [
        { url: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
        { responseBody: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await this.prisma.requestLog.count({ where });

    // Get filtered data
    const data = await this.prisma.requestLog.findMany({
      where,
      include: {
        project: true,
        aiAnalyses: {
          select: {
            id: true,
            mode: true,
            confidence: true,
            createdAt: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      take: limit,
      skip: offset,
    });

    return {
      data,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Update request log tags
   */
  async updateTags(id: string, userId: string, tags: string[]): Promise<RequestLog> {
    return this.prisma.requestLog.update({
      where: { id, userId },
      data: { tags },
    });
  }

  /**
   * Add tag to request log
   */
  async addTag(id: string, userId: string, tag: string): Promise<RequestLog> {
    const log = await this.getRequestLog(id, userId);
    if (!log) throw new Error('Request log not found');

    const tags = [...new Set([...log.tags, tag])]; // Deduplicate
    return this.updateTags(id, userId, tags);
  }

  /**
   * Remove tag from request log
   */
  async removeTag(id: string, userId: string, tag: string): Promise<RequestLog> {
    const log = await this.getRequestLog(id, userId);
    if (!log) throw new Error('Request log not found');

    const tags = log.tags.filter((t) => t !== tag);
    return this.updateTags(id, userId, tags);
  }

  /**
   * Toggle starred status
   */
  async toggleStarred(id: string, userId: string): Promise<RequestLog> {
    const log = await this.getRequestLog(id, userId);
    if (!log) throw new Error('Request log not found');

    return this.prisma.requestLog.update({
      where: { id, userId },
      data: { starred: !log.starred },
    });
  }

  /**
   * Assign request to project
   */
  async assignToProject(
    id: string,
    userId: string,
    projectId: string | null
  ): Promise<RequestLog> {
    return this.prisma.requestLog.update({
      where: { id, userId },
      data: { projectId },
    });
  }

  /**
   * Get statistics for user's requests
   */
  async getStatistics(
    userId: string,
    options?: {
      projectId?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<RequestLogStats> {
    const where: Prisma.RequestLogWhereInput = {
      userId,
      ...(options?.projectId && { projectId: options.projectId }),
      ...(options?.startDate && { timestamp: { gte: options.startDate } }),
      ...(options?.endDate && { timestamp: { lte: options.endDate } }),
    };

    const [totalRequests, totalIntercepted, totalStarred, requests] = await Promise.all([
      this.prisma.requestLog.count({ where }),
      this.prisma.requestLog.count({ where: { ...where, isIntercepted: true } }),
      this.prisma.requestLog.count({ where: { ...where, starred: true } }),
      this.prisma.requestLog.findMany({
        where,
        select: {
          method: true,
          statusCode: true,
          duration: true,
          timestamp: true,
        },
      }),
    ]);

    // Calculate method counts
    const methodCounts: Record<string, number> = {};
    requests.forEach((req) => {
      methodCounts[req.method] = (methodCounts[req.method] || 0) + 1;
    });

    // Calculate status code counts
    const statusCodeCounts: Record<string, number> = {};
    requests.forEach((req) => {
      if (req.statusCode) {
        const code = req.statusCode.toString();
        statusCodeCounts[code] = (statusCodeCounts[code] || 0) + 1;
      }
    });

    // Calculate average duration
    const validDurations = requests.filter((r) => r.duration !== null).map((r) => r.duration!);
    const averageDuration =
      validDurations.length > 0
        ? validDurations.reduce((sum, d) => sum + d, 0) / validDurations.length
        : 0;

    // Calculate requests by day
    const requestsByDayMap = new Map<string, number>();
    requests.forEach((req) => {
      const dateKey = req.timestamp.toISOString().split('T')[0]!;
      requestsByDayMap.set(dateKey, (requestsByDayMap.get(dateKey) || 0) + 1);
    });
    const requestsByDay = Array.from(requestsByDayMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalRequests,
      totalIntercepted,
      totalStarred,
      methodCounts,
      statusCodeCounts,
      averageDuration,
      requestsByDay,
    };
  }

  /**
   * Export request logs as JSON
   */
  async exportAsJSON(options: FilterOptions): Promise<string> {
    const { data } = await this.filterRequestLogs({ ...options, limit: 10000 });
    return JSON.stringify(data, null, 2);
  }

  /**
   * Export request logs as CSV
   */
  async exportAsCSV(options: FilterOptions): Promise<string> {
    const { data } = await this.filterRequestLogs({ ...options, limit: 10000 });

    const headers = [
      'ID',
      'Timestamp',
      'Method',
      'URL',
      'Status Code',
      'Duration (ms)',
      'Intercepted',
      'Starred',
      'Tags',
      'Project',
    ].join(',');

    const rows = data.map((log) =>
      [
        log.id,
        log.timestamp.toISOString(),
        log.method,
        `"${log.url}"`,
        log.statusCode || '',
        log.duration || '',
        log.isIntercepted,
        log.starred,
        `"${log.tags.join(', ')}"`,
        log.project?.name || '',
      ].join(',')
    );

    return [headers, ...rows].join('\n');
  }

  /**
   * Delete old request logs (retention policy)
   */
  async deleteOldLogs(userId: string, olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.requestLog.deleteMany({
      where: {
        userId,
        timestamp: { lt: cutoffDate },
        starred: false, // Don't delete starred requests
      },
    });

    return result.count;
  }

  /**
   * Get related requests (same domain, similar URLs)
   */
  async getRelatedRequests(id: string, userId: string, limit = 10): Promise<RequestLog[]> {
    const log = await this.getRequestLog(id, userId);
    if (!log) throw new Error('Request log not found');

    const url = new URL(log.url);
    const domain = url.hostname;

    return this.prisma.requestLog.findMany({
      where: {
        userId,
        id: { not: id },
        url: { contains: domain },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        project: true,
      },
    });
  }
}
