import { PrismaClient } from '@prisma/client';
import { prisma } from '../server.js';

/**
 * Request Grouper Service (Module 3.3)
 * Smart batching suggestions based on request patterns
 */

export interface RequestGroup {
  id: string;
  name: string;
  pattern: string;
  requests: string[]; // Request IDs
  confidence: number;
  reason: string;
}

export interface BatchSuggestion {
  groups: RequestGroup[];
  totalRequests: number;
  suggestedBatches: number;
  estimatedTimeSaving: number;
}

class RequestGrouperService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  /**
   * Analyze requests and suggest intelligent groupings
   */
  async suggestBatches(userId: string, requestIds: string[]): Promise<BatchSuggestion> {
    if (requestIds.length < 5) {
      return {
        groups: [],
        totalRequests: requestIds.length,
        suggestedBatches: 0,
        estimatedTimeSaving: 0,
      };
    }

    // Fetch requests
    const requests = await this.prisma.requestLog.findMany({
      where: {
        id: { in: requestIds },
        userId,
      },
      select: {
        id: true,
        method: true,
        url: true,
        headers: true,
      },
    });

    // Group by patterns
    const groups: RequestGroup[] = [];

    // Group 1: By domain
    const domainGroups = this.groupByDomain(requests);
    groups.push(...domainGroups);

    // Group 2: By URL pattern
    const pathGroups = this.groupByPathPattern(requests);
    groups.push(...pathGroups);

    // Group 3: By HTTP method
    const methodGroups = this.groupByMethod(requests);
    groups.push(...methodGroups);

    // Filter groups with minimum 3 requests and confidence >70%
    const significantGroups = groups.filter(
      (g) => g.requests.length >= 3 && g.confidence >= 70
    );

    // Sort by number of requests (descending)
    significantGroups.sort((a, b) => b.requests.length - a.requests.length);

    // Take top 5 groups max
    const topGroups = significantGroups.slice(0, 5);

    // Calculate time saving (assuming 4s per request, 5 concurrent)
    const totalRequests = requestIds.length;
    const sequentialTime = totalRequests * 4;
    const batchTime = topGroups.reduce((acc, g) => {
      return acc + Math.ceil(g.requests.length / 5) * 4;
    }, 0);
    const timeSaving = Math.max(0, sequentialTime - batchTime);

    return {
      groups: topGroups,
      totalRequests,
      suggestedBatches: topGroups.length,
      estimatedTimeSaving: timeSaving,
    };
  }

  /**
   * Group requests by domain
   */
  private groupByDomain(requests: any[]): RequestGroup[] {
    const domainMap = new Map<string, string[]>();

    requests.forEach((req) => {
      try {
        const url = new URL(req.url);
        const domain = url.host;
        if (!domainMap.has(domain)) {
          domainMap.set(domain, []);
        }
        domainMap.get(domain)!.push(req.id);
      } catch {
        // Invalid URL, skip
      }
    });

    const groups: RequestGroup[] = [];
    domainMap.forEach((reqIds, domain) => {
      if (reqIds.length >= 3) {
        groups.push({
          id: `domain-${domain}`,
          name: `Domain: ${domain}`,
          pattern: `All requests to ${domain}`,
          requests: reqIds,
          confidence: 85,
          reason: `${reqIds.length} requests targeting the same domain`,
        });
      }
    });

    return groups;
  }

  /**
   * Group requests by URL path pattern
   */
  private groupByPathPattern(requests: any[]): RequestGroup[] {
    const pathMap = new Map<string, string[]>();

    requests.forEach((req) => {
      try {
        const url = new URL(req.url);
        // Extract base path (first 2 segments)
        const pathSegments = url.pathname.split('/').filter((s) => s.length > 0);
        const basePath = '/' + pathSegments.slice(0, 2).join('/');

        if (!pathMap.has(basePath)) {
          pathMap.set(basePath, []);
        }
        pathMap.get(basePath)!.push(req.id);
      } catch {
        // Invalid URL, skip
      }
    });

    const groups: RequestGroup[] = [];
    pathMap.forEach((reqIds, path) => {
      if (reqIds.length >= 3) {
        groups.push({
          id: `path-${path}`,
          name: `Path: ${path}/*`,
          pattern: `All requests matching ${path}/*`,
          requests: reqIds,
          confidence: 75,
          reason: `${reqIds.length} requests with similar URL path`,
        });
      }
    });

    return groups;
  }

  /**
   * Group requests by HTTP method
   */
  private groupByMethod(requests: any[]): RequestGroup[] {
    const methodMap = new Map<string, string[]>();

    requests.forEach((req) => {
      const method = req.method.toUpperCase();
      if (!methodMap.has(method)) {
        methodMap.set(method, []);
      }
      methodMap.get(method)!.push(req.id);
    });

    const groups: RequestGroup[] = [];
    methodMap.forEach((reqIds, method) => {
      if (reqIds.length >= 5) {
        // Only suggest if significant number
        groups.push({
          id: `method-${method}`,
          name: `Method: ${method}`,
          pattern: `All ${method} requests`,
          requests: reqIds,
          confidence: 70,
          reason: `${reqIds.length} ${method} requests`,
        });
      }
    });

    return groups;
  }

  /**
   * Get group details
   */
  async getGroupDetails(userId: string, requestIds: string[]) {
    return this.prisma.requestLog.findMany({
      where: {
        id: { in: requestIds },
        userId,
      },
      select: {
        id: true,
        method: true,
        url: true,
        statusCode: true,
        timestamp: true,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });
  }
}

// Export singleton instance
export const requestGrouperService = new RequestGrouperService(prisma);
