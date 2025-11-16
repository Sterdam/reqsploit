import { PrismaClient } from '@prisma/client';
import { claudeClient } from './claude-client.js';
import {
  REQUEST_ANALYZER_PROMPT,
  RESPONSE_ANALYZER_PROMPT,
  FULL_ANALYSIS_PROMPT,
  EXPLOIT_GENERATOR_PROMPT,
  buildRequestAnalysisContext,
  buildResponseAnalysisContext,
  buildFullAnalysisContext,
} from './prompts.js';
import { HTTPRequest, HTTPResponse } from '../../types/proxy.types.js';
import {
  AISuggestion,
  VulnerabilityInfo,
  ExploitPayload,
  AIAnalysisResult,
} from '../../types/ai.types.js';
import { aiLogger } from '../../utils/logger.js';
import { AIServiceError, InsufficientTokensError } from '../../utils/errors.js';
import { wsServer } from '../websocket/ws-server.js';
import type { AIModel } from '../../services/ai-pricing.service.js';

const prisma = new PrismaClient();

/**
 * AI Analyzer Service
 * Handles security analysis of HTTP requests/responses using Claude AI
 */

export class AIAnalyzer {
  private static instance: AIAnalyzer;

  private constructor() {
    aiLogger.info('AI Analyzer initialized');
  }

  /**
   * Calculate total tokens from Claude response
   */
  private getTotalTokens(response: any): number {
    return response.inputTokens + response.outputTokens;
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AIAnalyzer {
    if (!AIAnalyzer.instance) {
      AIAnalyzer.instance = new AIAnalyzer();
    }
    return AIAnalyzer.instance;
  }

  /**
   * Check if user has sufficient tokens
   */
  private async checkTokenAvailability(
    userId: string,
    estimatedTokens: number
  ): Promise<void> {
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const usage = await prisma.tokenUsage.findUnique({
      where: {
        userId_monthYear: {
          userId,
          monthYear,
        },
      },
    });

    if (!usage) {
      throw new AIServiceError('Token usage record not found');
    }

    const remaining = usage.tokensLimit - usage.tokensUsed;

    if (remaining < estimatedTokens) {
      throw new InsufficientTokensError(
        `Insufficient tokens. Remaining: ${remaining}, Required: ~${estimatedTokens}`
      );
    }

    aiLogger.debug('Token check passed', {
      userId,
      remaining,
      estimated: estimatedTokens,
    });
  }

  /**
   * Update token usage
   */
  private async updateTokenUsage(userId: string, tokensUsed: number): Promise<void> {
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    await prisma.tokenUsage.update({
      where: {
        userId_monthYear: {
          userId,
          monthYear,
        },
      },
      data: {
        tokensUsed: {
          increment: tokensUsed,
        },
      },
    });

    // Get updated usage and emit to WebSocket
    const updated = await prisma.tokenUsage.findUnique({
      where: {
        userId_monthYear: {
          userId,
          monthYear,
        },
      },
    });

    if (updated) {
      wsServer.emitToUser(userId, 'tokens:updated', {
        used: updated.tokensUsed,
        limit: updated.tokensLimit,
        remaining: updated.tokensLimit - updated.tokensUsed,
        resetDate: updated.resetDate,
      });

      // Check if limit reached
      if (updated.tokensUsed >= updated.tokensLimit) {
        wsServer.emitToUser(userId, 'tokens:limit-reached', {
          message: 'Monthly token limit reached',
        });
      }
    }

    aiLogger.info('Token usage updated', {
      userId,
      tokensUsed,
    });
  }

  /**
   * Parse AI response into structured format
   */
  private parseAIResponse(content: string): {
    vulnerabilities: VulnerabilityInfo[];
    suggestions: AISuggestion[];
  } {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(content);
      return {
        vulnerabilities: parsed.vulnerabilities || [],
        suggestions: parsed.suggestions || [],
      };
    } catch {
      // Fallback: extract information from text
      aiLogger.warn('Failed to parse AI response as JSON, using text extraction');

      return {
        vulnerabilities: [],
        suggestions: [
          {
            id: `info-${Date.now()}`,
            type: 'info',
            severity: 'info',
            title: 'AI Analysis',
            description: content.substring(0, 500),
            context: {
              request: undefined,
              response: undefined,
              relatedRequests: [],
            },
            actions: [],
            confidence: 0,
            tokensUsed: 0,
          },
        ],
      };
    }
  }

  /**
   * Analyze HTTP request
   */
  async analyzeRequest(
    userId: string,
    requestLogId: string,
    request: HTTPRequest,
    model: AIModel = 'auto'
  ): Promise<AIAnalysisResult> {
    aiLogger.info('Analyzing request', { userId, requestLogId, model });

    try {
      // Check token availability (estimate ~2000 tokens for request analysis)
      await this.checkTokenAvailability(userId, 2000);

      // Emit analysis started event
      wsServer.emitToUser(userId, 'ai:analysis-started', { requestId: requestLogId });

      // Build context and analyze with selected model
      const context = buildRequestAnalysisContext(request);
      const response = await claudeClient.analyze(context, REQUEST_ANALYZER_PROMPT, { model });

      // Parse response
      const { vulnerabilities, suggestions } = this.parseAIResponse(response.content);

      // Save to database
      const analysis = await prisma.aIAnalysis.create({
        data: {
          userId,
          requestLogId: requestLogId,
          mode: 'DEFAULT',
          aiResponse: response.content,
          suggestions: suggestions as any,
          tokensUsed: this.getTotalTokens(response),
          model: response.model,
          confidence: 80,
        },
      });

      const totalTokens = this.getTotalTokens(response);

      // Update token usage
      await this.updateTokenUsage(userId, totalTokens);

      const result: AIAnalysisResult = {
        id: analysis.id,
        requestLogId,
        analysisType: 'request',
        aiResponse: response.content,
        confidence: 80,
        vulnerabilities,
        suggestions,
        tokensUsed: totalTokens,
        timestamp: analysis.createdAt,
      };

      // Emit completion event
      wsServer.emitToUser(userId, 'ai:analysis-complete', {
        requestId: requestLogId,
        analysisId: analysis.id,
        suggestions,
        tokensUsed: this.getTotalTokens(response),
        analysisType: 'request',
        timestamp: new Date(),
      });

      aiLogger.info('Request analysis complete', {
        userId,
        requestLogId,
        vulnerabilitiesFound: vulnerabilities.length,
        tokensUsed: this.getTotalTokens(response),
      });

      return result;
    } catch (error) {
      aiLogger.error('Request analysis failed', { userId, requestLogId, error });

      // Emit error event
      wsServer.emitToUser(userId, 'ai:analysis-error', {
        requestId: requestLogId,
        message: error instanceof Error ? error.message : 'Analysis failed',
      });

      throw error;
    }
  }

  /**
   * Analyze HTTP response
   */
  async analyzeResponse(
    userId: string,
    requestLogId: string,
    request: HTTPRequest,
    response: HTTPResponse,
    model: AIModel = 'auto'
  ): Promise<AIAnalysisResult> {
    aiLogger.info('Analyzing response', { userId, requestLogId, model });

    try {
      // Check token availability (estimate ~2500 tokens for response analysis)
      await this.checkTokenAvailability(userId, 2500);

      // Emit analysis started event
      wsServer.emitToUser(userId, 'ai:analysis-started', { requestId: requestLogId });

      // Build context and analyze with selected model
      const context = buildResponseAnalysisContext(request, response);
      const aiResponse = await claudeClient.analyze(context, RESPONSE_ANALYZER_PROMPT, { model });

      // Parse response
      const { vulnerabilities, suggestions } = this.parseAIResponse(aiResponse.content);

      // Save to database
      const analysis = await prisma.aIAnalysis.create({
        data: {
          userId,
          requestLogId: requestLogId,
          mode: 'DEFAULT',
          aiResponse: aiResponse.content,
          suggestions: suggestions as any,
          tokensUsed: this.getTotalTokens(aiResponse),
          model: aiResponse.model,
          confidence: 80,
        },
      });

      // Update token usage
      await this.updateTokenUsage(userId, this.getTotalTokens(aiResponse));

      const result: AIAnalysisResult = {
        id: analysis.id,
        requestLogId,
        analysisType: 'response',
        aiResponse: aiResponse.content,
        confidence: 80,
        vulnerabilities,
        suggestions,
        tokensUsed: this.getTotalTokens(aiResponse),
        timestamp: analysis.createdAt,
      };

      // Emit completion event
      wsServer.emitToUser(userId, 'ai:analysis-complete', {
        requestId: requestLogId,
        analysisId: analysis.id,
        suggestions,
        tokensUsed: this.getTotalTokens(aiResponse),
        analysisType: 'response',
        timestamp: new Date(),
      });

      aiLogger.info('Response analysis complete', {
        userId,
        requestLogId,
        vulnerabilitiesFound: vulnerabilities.length,
        tokensUsed: this.getTotalTokens(aiResponse),
      });

      return result;
    } catch (error) {
      aiLogger.error('Response analysis failed', { userId, requestLogId, error });

      // Emit error event
      wsServer.emitToUser(userId, 'ai:analysis-error', {
        requestId: requestLogId,
        message: error instanceof Error ? error.message : 'Analysis failed',
      });

      throw error;
    }
  }

  /**
   * Analyze full HTTP transaction (request + response)
   */
  async analyzeTransaction(
    userId: string,
    requestLogId: string,
    request: HTTPRequest,
    response: HTTPResponse,
    model: AIModel = 'auto'
  ): Promise<AIAnalysisResult> {
    aiLogger.info('Analyzing transaction', { userId, requestLogId, model });

    try {
      // Check token availability (estimate ~4000 tokens for full analysis)
      await this.checkTokenAvailability(userId, 4000);

      // Emit analysis started event
      wsServer.emitToUser(userId, 'ai:analysis-started', { requestId: requestLogId });

      // Build context and analyze with selected model
      const context = buildFullAnalysisContext(request, response);
      const aiResponse = await claudeClient.analyze(context, FULL_ANALYSIS_PROMPT, { model });

      // Parse response
      const { vulnerabilities, suggestions } = this.parseAIResponse(aiResponse.content);

      // Save to database
      const analysis = await prisma.aIAnalysis.create({
        data: {
          userId,
          requestLogId: requestLogId,
          mode: 'ADVANCED',
          aiResponse: aiResponse.content,
          suggestions: suggestions as any,
          tokensUsed: this.getTotalTokens(aiResponse),
          model: aiResponse.model,
          confidence: 85,
        },
      });

      // Update token usage
      await this.updateTokenUsage(userId, this.getTotalTokens(aiResponse));

      const result: AIAnalysisResult = {
        id: analysis.id,
        requestLogId,
        analysisType: 'full',
        aiResponse: aiResponse.content,
        confidence: 85,
        vulnerabilities,
        suggestions,
        tokensUsed: this.getTotalTokens(aiResponse),
        timestamp: analysis.createdAt,
      };

      // Emit completion event
      wsServer.emitToUser(userId, 'ai:analysis-complete', {
        requestId: requestLogId,
        analysisId: analysis.id,
        suggestions,
        tokensUsed: this.getTotalTokens(aiResponse),
        analysisType: 'full',
        timestamp: new Date(),
      });

      aiLogger.info('Transaction analysis complete', {
        userId,
        requestLogId,
        vulnerabilitiesFound: vulnerabilities.length,
        tokensUsed: this.getTotalTokens(aiResponse),
      });

      return result;
    } catch (error) {
      aiLogger.error('Transaction analysis failed', { userId, requestLogId, error });

      // Emit error event
      wsServer.emitToUser(userId, 'ai:analysis-error', {
        requestId: requestLogId,
        message: error instanceof Error ? error.message : 'Analysis failed',
      });

      throw error;
    }
  }

  /**
   * Generate exploit payloads for a vulnerability
   */
  async generateExploits(
    userId: string,
    vulnerability: VulnerabilityInfo,
    model: AIModel = 'auto'
  ): Promise<ExploitPayload[]> {
    aiLogger.info('Generating exploits', { userId, vulnerability: vulnerability.type, model });

    try {
      // Check token availability (estimate ~3000 tokens)
      await this.checkTokenAvailability(userId, 3000);

      const context = `Generate exploitation payloads for this vulnerability:

Type: ${vulnerability.type}
Severity: ${vulnerability.severity}
Description: ${vulnerability.description}
Evidence: ${vulnerability.evidence || 'N/A'}
Location: ${vulnerability.location || 'N/A'}

Provide practical, working exploit payloads.`;

      const response = await claudeClient.analyze(context, EXPLOIT_GENERATOR_PROMPT, { model });

      // Update token usage
      await this.updateTokenUsage(userId, this.getTotalTokens(response));

      // Parse exploits
      try {
        const parsed = JSON.parse(response.content);
        return parsed.exploits || [];
      } catch {
        aiLogger.warn('Failed to parse exploit payloads');
        return [];
      }
    } catch (error) {
      aiLogger.error('Exploit generation failed', { userId, error });
      throw error;
    }
  }

  /**
   * Get analysis history for a user
   */
  async getAnalysisHistory(
    userId: string,
    limit: number = 50
  ): Promise<AIAnalysisResult[]> {
    const analyses = await prisma.aIAnalysis.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        requestLog: {
          select: {
            url: true,
            method: true,
          },
        },
      },
    });

    return analyses.map((analysis) => {
      // Parse vulnerabilities from aiResponse JSON
      let vulnerabilities: VulnerabilityInfo[] = [];
      try {
        if (analysis.aiResponse) {
          const parsed = JSON.parse(analysis.aiResponse);
          vulnerabilities = parsed.vulnerabilities || [];
        }
      } catch (e) {
        // If parsing fails, leave vulnerabilities empty
      }

      return {
        id: analysis.id,
        requestLogId: analysis.requestLogId,
        analysisType: (analysis.mode === 'DEFAULT' ? 'request' : analysis.mode === 'ADVANCED' ? 'full' : 'request') as 'request' | 'response' | 'full',
        aiResponse: analysis.aiResponse,
        confidence: analysis.confidence,
        vulnerabilities,
        suggestions: analysis.suggestions as unknown as AISuggestion[],
        tokensUsed: analysis.tokensUsed,
        timestamp: analysis.createdAt.toISOString(),
        // Add URL and method for better UX
        requestUrl: analysis.requestLog?.url,
        requestMethod: analysis.requestLog?.method,
      };
    });
  }

  /**
   * Get token usage for a user
   */
  async getTokenUsage(userId: string) {
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const usage = await prisma.tokenUsage.findUnique({
      where: {
        userId_monthYear: {
          userId,
          monthYear,
        }
      },
    });

    if (!usage) {
      throw new AIServiceError('Token usage record not found');
    }

    return {
      used: usage.tokensUsed,
      limit: usage.tokensLimit,
      remaining: usage.tokensLimit - usage.tokensUsed,
      resetDate: usage.resetDate,
    };
  }
}

// Export singleton instance
export const aiAnalyzer = AIAnalyzer.getInstance();
