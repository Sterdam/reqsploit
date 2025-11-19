import { PrismaClient, Severity, AssetCategory } from '@prisma/client';
import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import {
  SCAN_PATTERNS,
  ScanPattern,
  getEnabledPatterns,
  maskValue,
} from './scan-patterns.js';
import { scanLogger } from '../../utils/logger.js';

/**
 * Magic Scan - Ultra-Intelligent Sensitive Data Scanner
 *
 * Features:
 * - 30+ critical regex patterns
 * - Smart context extraction
 * - Hash-based deduplication
 * - Confidence scoring
 * - Async background processing
 * - Performance optimized
 */

export interface ScanTarget {
  source: 'request' | 'response';
  part: 'url' | 'headers' | 'body' | 'cookies';
  content: string;
  path?: string; // JSON path or header name
}

export interface ScanLocation {
  source: 'request' | 'response';
  part: 'url' | 'headers' | 'body' | 'cookies';
  path: string;
}

export interface ScanMatch {
  pattern: ScanPattern;
  value: string;
  maskedValue: string;
  location: ScanLocation;
  context: string;
  confidence: number;
  startIndex: number;
  endIndex: number;
}

export interface ScanOptions {
  skipLargeContent?: boolean; // Skip content >10MB
  maxContentSize?: number; // Default 10MB
  skipBinary?: boolean; // Skip binary files
  confidenceThreshold?: number; // Minimum confidence (0-100)
  enabledCategories?: AssetCategory[]; // Filter by category
  enabledSeverities?: Severity[]; // Filter by severity
}

const DEFAULT_OPTIONS: ScanOptions = {
  skipLargeContent: true,
  maxContentSize: 10 * 1024 * 1024, // 10MB
  skipBinary: true,
  confidenceThreshold: 50,
  enabledCategories: undefined, // All enabled
  enabledSeverities: undefined, // All enabled
};

// Encryption key for storing sensitive values
const ENCRYPTION_KEY = process.env.SCAN_ENCRYPTION_KEY || randomBytes(32).toString('hex');
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

export class ScannerService {
  private prisma: PrismaClient;
  private compiledPatterns: Map<string, RegExp[]> = new Map();

  constructor() {
    this.prisma = new PrismaClient();
    this.precompilePatterns();
  }

  /**
   * Pre-compile all regex patterns for performance
   */
  private precompilePatterns(): void {
    for (const pattern of SCAN_PATTERNS) {
      if (pattern.enabled) {
        this.compiledPatterns.set(pattern.id, pattern.patterns);
      }
    }
    scanLogger.info(`Compiled ${this.compiledPatterns.size} scan patterns`);
  }

  /**
   * Hash a value for deduplication
   */
  private hashValue(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  /**
   * Encrypt sensitive value
   */
  private encryptValue(value: string): string {
    const iv = randomBytes(16);
    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
    const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
  }

  /**
   * Decrypt sensitive value
   */
  private decryptValue(encrypted: string): string {
    const [ivHex, encryptedData, authTagHex] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Check if content is binary
   */
  private isBinaryContent(content: string): boolean {
    // Check for null bytes or high ratio of non-printable characters
    const nullBytes = (content.match(/\0/g) || []).length;
    if (nullBytes > 0) return true;

    const nonPrintable = (content.match(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g) || []).length;
    return (nonPrintable / content.length) > 0.3;
  }

  /**
   * Extract context around a match (50 chars before and after)
   */
  private extractContext(content: string, startIndex: number, endIndex: number): string {
    const contextBefore = Math.max(0, startIndex - 50);
    const contextAfter = Math.min(content.length, endIndex + 50);

    const before = content.slice(contextBefore, startIndex);
    const match = content.slice(startIndex, endIndex);
    const after = content.slice(endIndex, contextAfter);

    return `${before}[${match}]${after}`;
  }

  /**
   * Calculate confidence score for a match
   */
  private calculateConfidence(pattern: ScanPattern, value: string, context: string): number {
    let confidence = 70; // Base confidence

    // Boost if validator passes
    if (pattern.validator) {
      try {
        if (pattern.validator(value, context)) {
          confidence += 20;
        } else {
          confidence -= 30;
        }
      } catch (error) {
        confidence -= 10;
      }
    }

    // Boost for certain contexts
    if (context.toLowerCase().includes('password')) confidence += 10;
    if (context.toLowerCase().includes('secret')) confidence += 10;
    if (context.toLowerCase().includes('api_key')) confidence += 10;
    if (context.toLowerCase().includes('token')) confidence += 5;

    // Reduce for test/demo values
    if (/test|demo|example|sample|placeholder/i.test(value)) confidence -= 30;
    if (/12345|abcde|qwerty|asdfg/i.test(value)) confidence -= 20;

    // Reduce if too short for pattern type
    if (pattern.category === AssetCategory.API_KEYS && value.length < 20) confidence -= 20;

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Scan a single target for matches
   */
  private async scanTarget(
    target: ScanTarget,
    patterns: ScanPattern[],
    options: ScanOptions
  ): Promise<ScanMatch[]> {
    const matches: ScanMatch[] = [];
    const { content, source, part, path } = target;

    // Skip if content too large
    if (options.skipLargeContent && content.length > (options.maxContentSize || 10485760)) {
      scanLogger.debug(`Skipping large content: ${content.length} bytes`);
      return matches;
    }

    // Skip if binary
    if (options.skipBinary && this.isBinaryContent(content)) {
      scanLogger.debug(`Skipping binary content`);
      return matches;
    }

    // Scan with each pattern
    for (const pattern of patterns) {
      // Filter by category/severity if specified
      if (options.enabledCategories && !options.enabledCategories.includes(pattern.category)) {
        continue;
      }
      if (options.enabledSeverities && !options.enabledSeverities.includes(pattern.severity)) {
        continue;
      }

      const compiledPatterns = this.compiledPatterns.get(pattern.id);
      if (!compiledPatterns) continue;

      for (const regex of compiledPatterns) {
        let match;
        // Reset regex state
        regex.lastIndex = 0;

        while ((match = regex.exec(content)) !== null) {
          const matchValue = match[1] || match[0]; // Use capture group if exists
          const startIndex = match.index;
          const endIndex = regex.lastIndex;

          const context = this.extractContext(content, startIndex, endIndex);
          const confidence = this.calculateConfidence(pattern, matchValue, context);

          // Skip low confidence matches
          if (confidence < (options.confidenceThreshold || 50)) {
            continue;
          }

          const maskedValue = maskValue(pattern, matchValue);

          matches.push({
            pattern,
            value: matchValue,
            maskedValue,
            location: {
              source,
              part,
              path: path || `${source}.${part}`,
            },
            context,
            confidence,
            startIndex,
            endIndex,
          });

          // Prevent infinite loop on zero-length matches
          if (regex.lastIndex === startIndex) {
            regex.lastIndex++;
          }
        }
      }
    }

    return matches;
  }

  /**
   * Scan HTTP request for sensitive data
   */
  public async scanRequest(
    userId: string,
    requestId: string,
    method: string,
    url: string,
    headers: Record<string, string>,
    body: string | undefined,
    options: ScanOptions = DEFAULT_OPTIONS
  ): Promise<ScanMatch[]> {
    const patterns = getEnabledPatterns();
    const allMatches: ScanMatch[] = [];

    // Scan URL
    const urlMatches = await this.scanTarget(
      {
        source: 'request',
        part: 'url',
        content: url,
        path: 'request.url',
      },
      patterns,
      options
    );
    allMatches.push(...urlMatches);

    // Scan headers
    for (const [headerName, headerValue] of Object.entries(headers)) {
      const headerMatches = await this.scanTarget(
        {
          source: 'request',
          part: 'headers',
          content: headerValue,
          path: `request.headers.${headerName}`,
        },
        patterns,
        options
      );
      allMatches.push(...headerMatches);
    }

    // Scan cookies (from Cookie header)
    if (headers['cookie'] || headers['Cookie']) {
      const cookieHeader = headers['cookie'] || headers['Cookie'];
      const cookieMatches = await this.scanTarget(
        {
          source: 'request',
          part: 'cookies',
          content: cookieHeader,
          path: 'request.cookies',
        },
        patterns,
        options
      );
      allMatches.push(...cookieMatches);
    }

    // Scan body
    if (body) {
      const bodyMatches = await this.scanTarget(
        {
          source: 'request',
          part: 'body',
          content: body,
          path: 'request.body',
        },
        patterns,
        options
      );
      allMatches.push(...bodyMatches);
    }

    // Store results in database
    await this.storeResults(userId, requestId, allMatches);

    scanLogger.info(`Scanned request ${requestId}: ${allMatches.length} findings`);

    return allMatches;
  }

  /**
   * Scan HTTP response for sensitive data
   */
  public async scanResponse(
    userId: string,
    requestId: string,
    statusCode: number,
    headers: Record<string, string>,
    body: string | undefined,
    options: ScanOptions = DEFAULT_OPTIONS
  ): Promise<ScanMatch[]> {
    const patterns = getEnabledPatterns();
    const allMatches: ScanMatch[] = [];

    // Scan response headers
    for (const [headerName, headerValue] of Object.entries(headers)) {
      const headerMatches = await this.scanTarget(
        {
          source: 'response',
          part: 'headers',
          content: headerValue,
          path: `response.headers.${headerName}`,
        },
        patterns,
        options
      );
      allMatches.push(...headerMatches);
    }

    // Scan cookies (from Set-Cookie header)
    if (headers['set-cookie'] || headers['Set-Cookie']) {
      const setCookie = headers['set-cookie'] || headers['Set-Cookie'];
      const cookieMatches = await this.scanTarget(
        {
          source: 'response',
          part: 'cookies',
          content: Array.isArray(setCookie) ? setCookie.join('; ') : setCookie,
          path: 'response.cookies',
        },
        patterns,
        options
      );
      allMatches.push(...cookieMatches);
    }

    // Scan response body
    if (body) {
      const bodyMatches = await this.scanTarget(
        {
          source: 'response',
          part: 'body',
          content: body,
          path: 'response.body',
        },
        patterns,
        options
      );
      allMatches.push(...bodyMatches);
    }

    // Store results in database
    await this.storeResults(userId, requestId, allMatches);

    scanLogger.info(`Scanned response for ${requestId}: ${allMatches.length} findings`);

    return allMatches;
  }

  /**
   * Store scan results in database (with deduplication)
   */
  private async storeResults(
    userId: string,
    requestId: string,
    matches: ScanMatch[]
  ): Promise<void> {
    for (const match of matches) {
      const valueHash = this.hashValue(match.value);

      // Check for duplicates
      const existing = await this.prisma.scanResult.findFirst({
        where: {
          userId,
          valueHash,
          isMarkedSafe: false,
        },
      });

      if (existing) {
        scanLogger.debug(`Duplicate finding skipped: ${match.pattern.type}`);
        continue;
      }

      // Encrypt sensitive value for storage
      const encryptedValue = this.encryptValue(match.value);

      try {
        await this.prisma.scanResult.create({
          data: {
            userId,
            requestId,
            severity: match.pattern.severity,
            category: match.pattern.category,
            type: match.pattern.type,
            description: match.pattern.description,
            value: match.maskedValue,
            valueHash,
            fullValue: encryptedValue,
            location: match.location,
            context: match.context,
            confidence: match.confidence,
            isMarkedSafe: false,
            isFalsePositive: false,
          },
        });

        scanLogger.info(`Stored finding: ${match.pattern.type} (confidence: ${match.confidence}%)`);
      } catch (error) {
        scanLogger.error('Failed to store scan result', { error, type: match.pattern.type });
      }
    }
  }

  /**
   * Get scan results for a user (with pagination and filtering)
   */
  public async getResults(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      severity?: Severity;
      category?: AssetCategory;
      requestId?: string;
      includeSafe?: boolean;
    } = {}
  ) {
    const {
      limit = 50,
      offset = 0,
      severity,
      category,
      requestId,
      includeSafe = false,
    } = options;

    const where: any = { userId };
    if (severity) where.severity = severity;
    if (category) where.category = category;
    if (requestId) where.requestId = requestId;
    if (!includeSafe) where.isMarkedSafe = false;

    const [results, total] = await Promise.all([
      this.prisma.scanResult.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          request: {
            select: {
              id: true,
              method: true,
              url: true,
              timestamp: true,
            },
          },
        },
      }),
      this.prisma.scanResult.count({ where }),
    ]);

    return {
      results,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get scan statistics
   */
  public async getStats(userId: string) {
    const [
      totalFindings,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      byCategoryStats,
    ] = await Promise.all([
      this.prisma.scanResult.count({
        where: { userId, isMarkedSafe: false },
      }),
      this.prisma.scanResult.count({
        where: { userId, severity: Severity.CRITICAL, isMarkedSafe: false },
      }),
      this.prisma.scanResult.count({
        where: { userId, severity: Severity.HIGH, isMarkedSafe: false },
      }),
      this.prisma.scanResult.count({
        where: { userId, severity: Severity.MEDIUM, isMarkedSafe: false },
      }),
      this.prisma.scanResult.count({
        where: { userId, severity: Severity.LOW, isMarkedSafe: false },
      }),
      this.prisma.scanResult.groupBy({
        by: ['category'],
        where: { userId, isMarkedSafe: false },
        _count: true,
      }),
    ]);

    const byCategory: Record<string, number> = {};
    for (const stat of byCategoryStats) {
      byCategory[stat.category] = stat._count;
    }

    return {
      total: totalFindings,
      bySeverity: {
        CRITICAL: criticalCount,
        HIGH: highCount,
        MEDIUM: mediumCount,
        LOW: lowCount,
      },
      byCategory,
    };
  }

  /**
   * Mark a finding as safe
   */
  public async markAsSafe(userId: string, resultId: string): Promise<void> {
    await this.prisma.scanResult.updateMany({
      where: { id: resultId, userId },
      data: { isMarkedSafe: true },
    });

    scanLogger.info(`Marked finding as safe: ${resultId}`);
  }

  /**
   * Mark a finding as false positive
   */
  public async markAsFalsePositive(userId: string, resultId: string): Promise<void> {
    await this.prisma.scanResult.updateMany({
      where: { id: resultId, userId },
      data: { isFalsePositive: true, isMarkedSafe: true },
    });

    scanLogger.info(`Marked finding as false positive: ${resultId}`);
  }

  /**
   * Delete a finding
   */
  public async deleteResult(userId: string, resultId: string): Promise<void> {
    await this.prisma.scanResult.deleteMany({
      where: { id: resultId, userId },
    });

    scanLogger.info(`Deleted finding: ${resultId}`);
  }

  /**
   * Rescan a specific request
   */
  public async rescanRequest(userId: string, requestId: string): Promise<ScanMatch[]> {
    // Get request from database
    const request = await this.prisma.requestLog.findFirst({
      where: { id: requestId, userId },
    });

    if (!request) {
      throw new Error('Request not found');
    }

    // Delete old results for this request
    await this.prisma.scanResult.deleteMany({
      where: { userId, requestId },
    });

    // Scan request
    const requestMatches = await this.scanRequest(
      userId,
      requestId,
      request.method,
      request.url,
      request.headers as Record<string, string>,
      request.body || undefined
    );

    // Scan response if available
    const responseMatches = request.responseBody
      ? await this.scanResponse(
          userId,
          requestId,
          request.statusCode || 0,
          (request.responseHeaders as Record<string, string>) || {},
          request.responseBody || undefined
        )
      : [];

    return [...requestMatches, ...responseMatches];
  }
}

// Export singleton instance
export const scannerService = new ScannerService();
