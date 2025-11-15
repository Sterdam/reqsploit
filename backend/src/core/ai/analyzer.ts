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
    const usage = await prisma.tokenUsage.findUnique({
      where: { userId },
    });

    if (!usage) {
      throw new AIServiceError('Token usage record not found');
    }

    const remaining = usage.monthlyLimit - usage.tokensUsed;

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
    await prisma.tokenUsage.update({
      where: { userId },
      data: {
        tokensUsed: {
          increment: tokensUsed,
        },
      },
    });

    // Get updated usage and emit to WebSocket
    const updated = await prisma.tokenUsage.findUnique({
      where: { userId },
    });

    if (updated) {
      wsServer.emitToUser(userId, 'tokens:updated', {
        used: updated.tokensUsed,
        limit: updated.monthlyLimit,
        remaining: updated.monthlyLimit - updated.tokensUsed,
        resetDate: updated.resetDate,
      });

      // Check if limit reached
      if (updated.tokensUsed >= updated.monthlyLimit) {
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
            type: 'info',
            severity: 'info',
            title: 'AI Analysis',
            description: content.substring(0, 500),
            actions: [],
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
    requestId: string,
    request: HTTPRequest
  ): Promise<AIAnalysisResult> {
    aiLogger.info('Analyzing request', { userId, requestId });

    try {
      // Check token availability (estimate ~2000 tokens for request analysis)
      await this.checkTokenAvailability(userId, 2000);

      // Emit analysis started event
      wsServer.emitToUser(userId, 'ai:analysis-started', { requestId });

      // Build context and analyze
      const context = buildRequestAnalysisContext(request);
      const response = await claudeClient.analyze(context, REQUEST_ANALYZER_PROMPT);

      // Parse response
      const { vulnerabilities, suggestions } = this.parseAIResponse(response.content);

      // Save to database
      const analysis = await prisma.aIAnalysis.create({
        data: {
          userId,
          requestId,
          analysisType: 'request',
          vulnerabilities: vulnerabilities as unknown as Record<string, unknown>[],
          suggestions: suggestions as unknown as Record<string, unknown>[],
          tokensUsed: response.tokensUsed,
          model: response.model,
        },
      });

      // Update token usage
      await this.updateTokenUsage(userId, response.tokensUsed);

      const result: AIAnalysisResult = {
        analysisId: analysis.id,
        requestId,
        analysisType: 'request',
        vulnerabilities,
        suggestions,
        tokensUsed: response.tokensUsed,
        timestamp: analysis.createdAt,
      };

      // Emit completion event
      wsServer.emitToUser(userId, 'ai:analysis-complete', {
        requestId,
        analysisId: analysis.id,
        suggestions,
        tokensUsed: response.tokensUsed,
        analysisType: 'request',
        timestamp: new Date(),
      });

      aiLogger.info('Request analysis complete', {
        userId,
        requestId,
        vulnerabilitiesFound: vulnerabilities.length,
        tokensUsed: response.tokensUsed,
      });

      return result;
    } catch (error) {
      aiLogger.error('Request analysis failed', { userId, requestId, error });

      // Emit error event
      wsServer.emitToUser(userId, 'ai:analysis-error', {
        requestId,
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
    requestId: string,
    request: HTTPRequest,
    response: HTTPResponse
  ): Promise<AIAnalysisResult> {
    aiLogger.info('Analyzing response', { userId, requestId });

    try {
      // Check token availability (estimate ~2500 tokens for response analysis)
      await this.checkTokenAvailability(userId, 2500);

      // Emit analysis started event
      wsServer.emitToUser(userId, 'ai:analysis-started', { requestId });

      // Build context and analyze
      const context = buildResponseAnalysisContext(request, response);
      const aiResponse = await claudeClient.analyze(context, RESPONSE_ANALYZER_PROMPT);

      // Parse response
      const { vulnerabilities, suggestions } = this.parseAIResponse(aiResponse.content);

      // Save to database
      const analysis = await prisma.aIAnalysis.create({
        data: {
          userId,
          requestId,
          analysisType: 'response',
          vulnerabilities: vulnerabilities as unknown as Record<string, unknown>[],
          suggestions: suggestions as unknown as Record<string, unknown>[],
          tokensUsed: aiResponse.tokensUsed,
          model: aiResponse.model,
        },
      });

      // Update token usage
      await this.updateTokenUsage(userId, aiResponse.tokensUsed);

      const result: AIAnalysisResult = {
        analysisId: analysis.id,
        requestId,
        analysisType: 'response',
        vulnerabilities,
        suggestions,
        tokensUsed: aiResponse.tokensUsed,
        timestamp: analysis.createdAt,
      };

      // Emit completion event
      wsServer.emitToUser(userId, 'ai:analysis-complete', {
        requestId,
        analysisId: analysis.id,
        suggestions,
        tokensUsed: aiResponse.tokensUsed,
        analysisType: 'response',
        timestamp: new Date(),
      });

      aiLogger.info('Response analysis complete', {
        userId,
        requestId,
        vulnerabilitiesFound: vulnerabilities.length,
        tokensUsed: aiResponse.tokensUsed,
      });

      return result;
    } catch (error) {
      aiLogger.error('Response analysis failed', { userId, requestId, error });

      // Emit error event
      wsServer.emitToUser(userId, 'ai:analysis-error', {
        requestId,
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
    requestId: string,
    request: HTTPRequest,
    response: HTTPResponse
  ): Promise<AIAnalysisResult> {
    aiLogger.info('Analyzing transaction', { userId, requestId });

    try {
      // Check token availability (estimate ~4000 tokens for full analysis)
      await this.checkTokenAvailability(userId, 4000);

      // Emit analysis started event
      wsServer.emitToUser(userId, 'ai:analysis-started', { requestId });

      // Build context and analyze
      const context = buildFullAnalysisContext(request, response);
      const aiResponse = await claudeClient.analyze(context, FULL_ANALYSIS_PROMPT);

      // Parse response
      const { vulnerabilities, suggestions } = this.parseAIResponse(aiResponse.content);

      // Save to database
      const analysis = await prisma.aIAnalysis.create({
        data: {
          userId,
          requestId,
          analysisType: 'full',
          vulnerabilities: vulnerabilities as unknown as Record<string, unknown>[],
          suggestions: suggestions as unknown as Record<string, unknown>[],
          tokensUsed: aiResponse.tokensUsed,
          model: aiResponse.model,
        },
      });

      // Update token usage
      await this.updateTokenUsage(userId, aiResponse.tokensUsed);

      const result: AIAnalysisResult = {
        analysisId: analysis.id,
        requestId,
        analysisType: 'full',
        vulnerabilities,
        suggestions,
        tokensUsed: aiResponse.tokensUsed,
        timestamp: analysis.createdAt,
      };

      // Emit completion event
      wsServer.emitToUser(userId, 'ai:analysis-complete', {
        requestId,
        analysisId: analysis.id,
        suggestions,
        tokensUsed: aiResponse.tokensUsed,
        analysisType: 'full',
        timestamp: new Date(),
      });

      aiLogger.info('Transaction analysis complete', {
        userId,
        requestId,
        vulnerabilitiesFound: vulnerabilities.length,
        tokensUsed: aiResponse.tokensUsed,
      });

      return result;
    } catch (error) {
      aiLogger.error('Transaction analysis failed', { userId, requestId, error });

      // Emit error event
      wsServer.emitToUser(userId, 'ai:analysis-error', {
        requestId,
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
    vulnerability: VulnerabilityInfo
  ): Promise<ExploitPayload[]> {
    aiLogger.info('Generating exploits', { userId, vulnerability: vulnerability.type });

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

      const response = await claudeClient.analyze(context, EXPLOIT_GENERATOR_PROMPT);

      // Update token usage
      await this.updateTokenUsage(userId, response.tokensUsed);

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
    });

    return analyses.map((analysis) => ({
      analysisId: analysis.id,
      requestId: analysis.requestId,
      analysisType: analysis.analysisType as 'request' | 'response' | 'full',
      vulnerabilities: analysis.vulnerabilities as unknown as VulnerabilityInfo[],
      suggestions: analysis.suggestions as unknown as AISuggestion[],
      tokensUsed: analysis.tokensUsed,
      timestamp: analysis.createdAt,
    }));
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
