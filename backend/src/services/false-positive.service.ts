import { PrismaClient, VulnerabilityType, FindingStatus } from '@prisma/client';
import { prisma } from '../server.js';

/**
 * False Positive Management Service (Module 3.1)
 * Handles dismissing vulnerabilities and learning patterns for auto-suppression
 */

export interface DismissVulnerabilityRequest {
  vulnerabilityId: string;
  reason: string;
  createPattern?: boolean;
}

export interface FalsePositivePattern {
  id: string;
  vulnerabilityType: VulnerabilityType;
  pattern: PatternRules;
  confidence: number;
  matchCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PatternRules {
  urlPattern?: string; // Regex pattern for URL matching
  urlContains?: string[]; // Substring matching
  methodPattern?: string; // HTTP method pattern
  headerPatterns?: Record<string, string>; // Header regex patterns
  bodyPatterns?: string[]; // Body content patterns
  evidencePatterns?: string[]; // Evidence text patterns
}

export interface PatternMatchResult {
  matched: boolean;
  confidence: number;
  matchedPatterns: string[];
}

class FalsePositiveService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  /**
   * Dismiss a vulnerability as false positive
   */
  async dismissVulnerability(
    userId: string,
    vulnerabilityId: string,
    reason: string,
    createPattern: boolean = false
  ): Promise<void> {
    // Update vulnerability status
    const vulnerability = await this.prisma.vulnerability.update({
      where: { id: vulnerabilityId },
      data: {
        status: FindingStatus.FALSE_POSITIVE,
        dismissedAt: new Date(),
        dismissedBy: userId,
        dismissReason: reason,
      },
      include: {
        analysis: {
          include: {
            requestLog: true,
          },
        },
      },
    });

    // Optionally create a pattern from this dismissal
    if (createPattern) {
      await this.createPatternFromVulnerability(userId, vulnerability);
    }
  }

  /**
   * Create a false positive pattern from a dismissed vulnerability
   */
  private async createPatternFromVulnerability(userId: string, vulnerability: any): Promise<void> {
    const requestLog = vulnerability.analysis.requestLog;

    // Extract pattern rules from the vulnerability and request
    const pattern: PatternRules = {
      urlPattern: this.extractUrlPattern(requestLog.url),
      methodPattern: requestLog.method,
      evidencePatterns: this.extractEvidencePatterns(vulnerability.evidence),
    };

    // Create pattern with initial confidence of 50%
    await this.prisma.falsePositivePattern.create({
      data: {
        userId,
        vulnerabilityType: vulnerability.type,
        pattern,
        confidence: 50,
        matchCount: 1,
      },
    });
  }

  /**
   * Extract URL pattern from a specific URL
   */
  private extractUrlPattern(url: string): string {
    try {
      const urlObj = new URL(url);
      // Replace dynamic segments with wildcards
      const pathname = urlObj.pathname
        .replace(/\/\d+/g, '/\\d+') // Numbers
        .replace(/\/[a-f0-9-]{36}/gi, '/[a-f0-9-]{36}') // UUIDs
        .replace(/\/[a-f0-9]{24}/gi, '/[a-f0-9]{24}'); // MongoDB IDs

      return `${urlObj.protocol}//${urlObj.host}${pathname}`;
    } catch {
      return url;
    }
  }

  /**
   * Extract evidence patterns from vulnerability evidence
   */
  private extractEvidencePatterns(evidence: any): string[] {
    const patterns: string[] = [];

    if (typeof evidence === 'string') {
      patterns.push(evidence.substring(0, 100)); // First 100 chars
    } else if (Array.isArray(evidence)) {
      evidence.forEach((item) => {
        if (typeof item === 'string') {
          patterns.push(item.substring(0, 100));
        }
      });
    }

    return patterns;
  }

  /**
   * Restore a dismissed vulnerability (undo dismiss)
   */
  async restoreVulnerability(vulnerabilityId: string): Promise<void> {
    await this.prisma.vulnerability.update({
      where: { id: vulnerabilityId },
      data: {
        status: FindingStatus.OPEN,
        dismissedAt: null,
        dismissedBy: null,
        dismissReason: null,
      },
    });
  }

  /**
   * Get all false positive patterns for a user
   */
  async getUserPatterns(userId: string, activeOnly: boolean = true): Promise<FalsePositivePattern[]> {
    return this.prisma.falsePositivePattern.findMany({
      where: {
        userId,
        ...(activeOnly ? { isActive: true } : {}),
      },
      orderBy: [
        { confidence: 'desc' },
        { matchCount: 'desc' },
      ],
    });
  }

  /**
   * Check if a vulnerability matches any false positive patterns
   */
  async checkAgainstPatterns(
    userId: string,
    vulnerabilityType: VulnerabilityType,
    requestUrl: string,
    evidence: any
  ): Promise<PatternMatchResult> {
    const patterns = await this.prisma.falsePositivePattern.findMany({
      where: {
        userId,
        vulnerabilityType,
        isActive: true,
        confidence: { gte: 70 }, // Only high-confidence patterns
      },
    });

    let bestMatch: PatternMatchResult = {
      matched: false,
      confidence: 0,
      matchedPatterns: [],
    };

    for (const pattern of patterns) {
      const matchResult = this.matchPattern(pattern.pattern as PatternRules, requestUrl, evidence);

      if (matchResult.matched && matchResult.confidence > bestMatch.confidence) {
        bestMatch = {
          matched: true,
          confidence: Math.min(pattern.confidence, matchResult.confidence),
          matchedPatterns: matchResult.matchedPatterns,
        };
      }
    }

    // Update match count for matched pattern
    if (bestMatch.matched) {
      const matchedPattern = patterns.find((p) => {
        const result = this.matchPattern(p.pattern as PatternRules, requestUrl, evidence);
        return result.matched && result.confidence === bestMatch.confidence;
      });

      if (matchedPattern) {
        await this.incrementPatternMatchCount(matchedPattern.id);
      }
    }

    return bestMatch;
  }

  /**
   * Match a vulnerability against a pattern
   */
  private matchPattern(pattern: PatternRules, url: string, evidence: any): PatternMatchResult {
    const matchedPatterns: string[] = [];
    let matchScore = 0;
    let totalChecks = 0;

    // URL pattern matching
    if (pattern.urlPattern) {
      totalChecks++;
      try {
        const regex = new RegExp(pattern.urlPattern);
        if (regex.test(url)) {
          matchScore++;
          matchedPatterns.push('urlPattern');
        }
      } catch {
        // Invalid regex, skip
      }
    }

    // URL contains matching
    if (pattern.urlContains && pattern.urlContains.length > 0) {
      totalChecks++;
      const containsMatch = pattern.urlContains.some((substring) => url.includes(substring));
      if (containsMatch) {
        matchScore++;
        matchedPatterns.push('urlContains');
      }
    }

    // Evidence pattern matching
    if (pattern.evidencePatterns && pattern.evidencePatterns.length > 0) {
      totalChecks++;
      const evidenceStr = JSON.stringify(evidence).toLowerCase();
      const evidenceMatch = pattern.evidencePatterns.some((evidencePattern) =>
        evidenceStr.includes(evidencePattern.toLowerCase())
      );
      if (evidenceMatch) {
        matchScore++;
        matchedPatterns.push('evidencePattern');
      }
    }

    const confidence = totalChecks > 0 ? Math.round((matchScore / totalChecks) * 100) : 0;
    const matched = confidence >= 70; // 70% threshold for matching

    return {
      matched,
      confidence,
      matchedPatterns,
    };
  }

  /**
   * Increment match count for a pattern (improves confidence over time)
   */
  private async incrementPatternMatchCount(patternId: string): Promise<void> {
    const pattern = await this.prisma.falsePositivePattern.findUnique({
      where: { id: patternId },
    });

    if (pattern) {
      const newMatchCount = pattern.matchCount + 1;
      // Increase confidence gradually based on successful matches
      const confidenceBoost = Math.min(5, Math.floor(newMatchCount / 10)); // +5% per 10 matches, max +5%
      const newConfidence = Math.min(95, pattern.confidence + confidenceBoost);

      await this.prisma.falsePositivePattern.update({
        where: { id: patternId },
        data: {
          matchCount: newMatchCount,
          confidence: newConfidence,
        },
      });
    }
  }

  /**
   * Delete a false positive pattern
   */
  async deletePattern(userId: string, patternId: string): Promise<void> {
    await this.prisma.falsePositivePattern.delete({
      where: {
        id: patternId,
        userId, // Security: ensure user owns this pattern
      },
    });
  }

  /**
   * Toggle pattern active status
   */
  async togglePatternStatus(userId: string, patternId: string): Promise<void> {
    const pattern = await this.prisma.falsePositivePattern.findUnique({
      where: { id: patternId, userId },
    });

    if (pattern) {
      await this.prisma.falsePositivePattern.update({
        where: { id: patternId },
        data: { isActive: !pattern.isActive },
      });
    }
  }

  /**
   * Get statistics about false positives for a user
   */
  async getFalsePositiveStats(userId: string): Promise<{
    totalDismissed: number;
    totalPatterns: number;
    activePatterns: number;
    averageConfidence: number;
    totalMatches: number;
  }> {
    const [dismissedCount, patterns] = await Promise.all([
      this.prisma.vulnerability.count({
        where: {
          analysis: { userId },
          status: FindingStatus.FALSE_POSITIVE,
        },
      }),
      this.prisma.falsePositivePattern.findMany({
        where: { userId },
      }),
    ]);

    const activePatterns = patterns.filter((p) => p.isActive).length;
    const averageConfidence =
      patterns.length > 0
        ? Math.round(patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length)
        : 0;
    const totalMatches = patterns.reduce((sum, p) => sum + p.matchCount, 0);

    return {
      totalDismissed: dismissedCount,
      totalPatterns: patterns.length,
      activePatterns,
      averageConfidence,
      totalMatches,
    };
  }

  /**
   * Get all dismissed vulnerabilities for a user
   */
  async getDismissedVulnerabilities(userId: string, limit: number = 100) {
    return this.prisma.vulnerability.findMany({
      where: {
        analysis: { userId },
        status: FindingStatus.FALSE_POSITIVE,
      },
      include: {
        analysis: {
          include: {
            requestLog: {
              select: {
                method: true,
                url: true,
                timestamp: true,
              },
            },
          },
        },
        dismissedUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        dismissedAt: 'desc',
      },
      take: limit,
    });
  }
}

// Export singleton instance
export const falsePositiveService = new FalsePositiveService(prisma);
