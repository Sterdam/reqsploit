/**
 * AnalysisService - AI analysis management and execution
 *
 * Features:
 * - Create and store AI analyses with 3 modes (EDUCATIONAL, DEFAULT, ADVANCED)
 * - Vulnerability detection and tracking
 * - Analysis history and caching
 * - Context-aware analysis with request flow understanding
 * - Attack surface analysis
 */

import { PrismaClient, AIAnalysis, Vulnerability, AIMode, VulnerabilityType, Severity } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';
import { PromptBuilder } from '../core/ai/prompt-builder';
import { ContextBuilder } from '../core/ai/context-builder';
import { AttackSurfaceAnalyzer } from '../core/ai/attack-surface-analyzer';

interface CreateAnalysisInput {
  userId: string;
  requestLogId: string;
  mode: AIMode;
  userContext?: string;
}

interface AnalysisResult {
  analysis: AIAnalysis;
  vulnerabilities: Vulnerability[];
}

interface VulnerabilityInput {
  type: VulnerabilityType;
  severity: Severity;
  title: string;
  description: string;
  evidence: Record<string, any>;
  remediation: string;
  cwe?: string;
  cvss?: number;
}

interface AttackSurface {
  parameters: {
    query: string[];
    body: string[];
    headers: string[];
    cookies: string[];
    path: string[];
  };
  potentialVulnerabilities: Array<{
    type: VulnerabilityType;
    confidence: number;
    targetParameter: string;
    location: 'query' | 'body' | 'headers' | 'cookies' | 'path';
  }>;
  recommendations: string[];
}

export class AnalysisService {
  private anthropic: Anthropic;
  private contextBuilder: ContextBuilder;

  constructor(private prisma: PrismaClient) {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.contextBuilder = new ContextBuilder(prisma);
  }

  /**
   * Create a new AI analysis with intelligent context
   */
  async createAnalysis(data: CreateAnalysisInput): Promise<AnalysisResult> {
    // Get request log with related data
    const requestLog = await this.prisma.requestLog.findFirst({
      where: { id: data.requestLogId, userId: data.userId },
      include: {
        project: true,
        proxySession: true,
      },
    });

    if (!requestLog) throw new Error('Request log not found');

    // Extract domain from URL
    const url = new URL(requestLog.url);
    const domain = url.hostname;

    // Build comprehensive application context
    const appContext = await this.contextBuilder.buildApplicationContext(
      data.userId,
      domain,
      3600000 // 1 hour window
    );

    // Get related requests for flow understanding
    const relatedRequests = await this.getRelatedRequestsForContext(
      data.requestLogId,
      data.userId
    );

    // Build intelligent prompt using PromptBuilder
    const systemPrompt = PromptBuilder.getSystemPrompt(data.mode);
    const userPrompt = PromptBuilder.buildAnalysisPrompt(
      {
        method: requestLog.method,
        url: requestLog.url,
        headers: requestLog.headers as Record<string, any>,
        body: requestLog.body || undefined,
        statusCode: requestLog.statusCode || undefined,
        responseHeaders: requestLog.responseHeaders as Record<string, any> || undefined,
        responseBody: requestLog.responseBody || undefined,
        duration: requestLog.duration || undefined,
      },
      relatedRequests.map(r => ({
        method: r.method,
        url: r.url,
        timestamp: r.timestamp,
        statusCode: r.statusCode || undefined,
      })),
      data.userContext,
      {
        technology: appContext.technology,
        authentication: appContext.authentication,
        sessionType: appContext.sessionType,
        apiEndpoints: appContext.apiEndpoints,
      }
    );

    // Call Claude API with mode-specific parameters
    const maxTokens = {
      EDUCATIONAL: 4096,
      DEFAULT: 2048,
      ADVANCED: 8192,
    };

    const response = await this.anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
      max_tokens: maxTokens[data.mode],
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

    // Parse AI response
    const aiResponse = response.content[0].type === 'text' ? response.content[0].text : '';
    const parsedResult = this.parseAIResponse(aiResponse, data.mode);

    // Create analysis record
    const analysis = await this.prisma.aIAnalysis.create({
      data: {
        userId: data.userId,
        requestLogId: data.requestLogId,
        mode: data.mode,
        userContext: data.userContext,
        aiResponse: aiResponse,
        suggestions: parsedResult.suggestions,
        tokensUsed,
        confidence: parsedResult.confidence,
      },
    });

    // Create vulnerability records
    const vulnerabilities = await Promise.all(
      parsedResult.vulnerabilities.map((vuln: VulnerabilityInput) =>
        this.prisma.vulnerability.create({
          data: {
            analysisId: analysis.id,
            type: vuln.type,
            severity: vuln.severity,
            title: vuln.title,
            description: vuln.description,
            evidence: vuln.evidence,
            remediation: vuln.remediation,
            cwe: vuln.cwe,
            cvss: vuln.cvss,
          },
        })
      )
    );

    // Update token usage
    await this.updateTokenUsage(data.userId, tokensUsed);

    return {
      analysis,
      vulnerabilities,
    };
  }


  /**
   * Parse AI response and extract structured data
   */
  private parseAIResponse(response: string, mode: AIMode): any {
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      // Try to parse as direct JSON
      return JSON.parse(response);
    } catch (error) {
      // Fallback: create basic structure from text response
      return {
        vulnerabilities: [],
        suggestions: {
          nextSteps: [],
          payloads: [],
          references: [],
          rawAnalysis: response,
        },
        confidence: 50,
      };
    }
  }

  /**
   * Get related requests for context building
   */
  private async getRelatedRequestsForContext(
    requestLogId: string,
    userId: string
  ): Promise<any[]> {
    const requestLog = await this.prisma.requestLog.findFirst({
      where: { id: requestLogId },
    });

    if (!requestLog) return [];

    const url = new URL(requestLog.url);
    const domain = url.hostname;

    return this.prisma.requestLog.findMany({
      where: {
        userId,
        id: { not: requestLogId },
        url: { contains: domain },
        timestamp: {
          gte: new Date(requestLog.timestamp.getTime() - 3600000), // 1 hour before
          lte: new Date(requestLog.timestamp.getTime() + 3600000), // 1 hour after
        },
      },
      select: {
        id: true,
        method: true,
        url: true,
        timestamp: true,
        statusCode: true,
      },
      orderBy: { timestamp: 'asc' },
      take: 10,
    });
  }

  /**
   * Get analysis by ID
   */
  async getAnalysis(id: string, userId: string): Promise<AIAnalysis | null> {
    return this.prisma.aIAnalysis.findFirst({
      where: { id, userId },
      include: {
        vulnerabilities: true,
        requestLog: {
          include: {
            project: true,
          },
        },
      },
    });
  }

  /**
   * List analyses for a request
   */
  async listAnalysesForRequest(requestLogId: string, userId: string): Promise<AIAnalysis[]> {
    return this.prisma.aIAnalysis.findMany({
      where: {
        requestLogId,
        userId,
      },
      include: {
        vulnerabilities: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Analyze attack surface from request using intelligent analyzer
   */
  async analyzeAttackSurface(requestLogId: string, userId: string): Promise<any> {
    const requestLog = await this.prisma.requestLog.findFirst({
      where: { id: requestLogId, userId },
    });

    if (!requestLog) throw new Error('Request log not found');

    // Use AttackSurfaceAnalyzer for comprehensive analysis
    const analysis = AttackSurfaceAnalyzer.analyze(
      requestLog.method,
      requestLog.url,
      requestLog.headers as Record<string, any>,
      requestLog.body || undefined
    );

    return {
      totalParameters: analysis.totalParameters,
      riskScore: analysis.riskScore,
      complexity: analysis.complexity,
      parameters: analysis.parameters.map(p => ({
        name: p.name,
        location: p.location,
        type: p.type,
      })),
      vulnerabilities: analysis.vulnerabilityTargets
        .filter(t => t.vulnerabilityTypes.length > 0)
        .map(t => ({
          parameter: t.parameter.name,
          location: t.parameter.location,
          detectedVulnerabilities: t.vulnerabilityTypes.map(v => ({
            type: v.type,
            confidence: v.confidence,
            reason: v.reason,
            testPayloads: v.testPayloads.slice(0, 3), // Limit to 3 payloads
          })),
        })),
      recommendations: analysis.recommendations,
    };
  }

  /**
   * Update user token usage
   */
  private async updateTokenUsage(userId: string, tokensUsed: number): Promise<void> {
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Get user plan for token limit
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    const tokenLimits = {
      FREE: 10000,
      PRO: 100000,
      ENTERPRISE: 500000,
    };

    const tokensLimit = user ? tokenLimits[user.plan] : 10000;

    // Upsert token usage
    await this.prisma.tokenUsage.upsert({
      where: {
        userId_monthYear: {
          userId,
          monthYear,
        },
      },
      create: {
        userId,
        monthYear,
        tokensUsed,
        tokensLimit,
        resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      },
      update: {
        tokensUsed: {
          increment: tokensUsed,
        },
      },
    });
  }

  /**
   * Check if user has available tokens
   */
  async checkTokenAvailability(userId: string): Promise<{
    available: boolean;
    used: number;
    limit: number;
    remaining: number;
  }> {
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const usage = await this.prisma.tokenUsage.findUnique({
      where: {
        userId_monthYear: {
          userId,
          monthYear,
        },
      },
    });

    const used = usage?.tokensUsed || 0;
    const limit = usage?.tokensLimit || 10000;
    const remaining = Math.max(0, limit - used);

    return {
      available: remaining > 0,
      used,
      limit,
      remaining,
    };
  }
}
