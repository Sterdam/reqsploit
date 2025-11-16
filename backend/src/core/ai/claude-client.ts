import Anthropic from '@anthropic-ai/sdk';
import { AIServiceError } from '../../utils/errors.js';
import { aiLogger } from '../../utils/logger.js';
import type { AIModel } from '../../services/ai-pricing.service.js';

/**
 * Claude AI Client (Singleton)
 * Wrapper for Anthropic API with rate limiting and error handling
 *
 * Supports both models:
 * - Haiku 4.5: Fast and cost-effective
 * - Sonnet 4.5: Deep analysis and comprehensive responses
 */

// Model name mapping
const MODEL_MAP: Record<AIModel, string> = {
  'haiku-4.5': 'claude-haiku-4-5-20251001',
  'sonnet-4.5': 'claude-sonnet-4-5-20250929',
};

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  stopReason: string;
}

export class ClaudeClient {
  private static instance: ClaudeClient;
  private client: Anthropic;
  private defaultModel: AIModel;
  private maxTokens: number;

  private constructor() {
    // Initialize properties first
    this.defaultModel = (process.env.ANTHROPIC_MODEL as AIModel) || 'haiku-4.5';
    this.maxTokens = parseInt(process.env.ANTHROPIC_MAX_TOKENS || '4096', 10);

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      aiLogger.warn('ANTHROPIC_API_KEY not set - Claude AI features will be disabled');
      this.client = null as any; // Will throw error if actually used
    } else {
      this.client = new Anthropic({
        apiKey,
      });

      aiLogger.info('Claude AI Client initialized', {
        defaultModel: this.defaultModel,
        maxTokens: this.maxTokens,
      });
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ClaudeClient {
    if (!ClaudeClient.instance) {
      ClaudeClient.instance = new ClaudeClient();
    }
    return ClaudeClient.instance;
  }

  /**
   * Send a message to Claude
   */
  async sendMessage(
    messages: ClaudeMessage[],
    options?: {
      systemPrompt?: string;
      temperature?: number;
      model?: AIModel;
      maxTokens?: number;
    }
  ): Promise<ClaudeResponse> {
    try {
      const model = options?.model || this.defaultModel;
      const modelName = MODEL_MAP[model];
      const temperature = options?.temperature ?? 0.7;
      const maxTokens = options?.maxTokens || this.maxTokens;

      aiLogger.debug('Sending message to Claude', {
        messageCount: messages.length,
        model,
        modelName,
        systemPromptLength: options?.systemPrompt?.length || 0,
      });

      const startTime = Date.now();

      const response = await this.client.messages.create({
        model: modelName,
        max_tokens: maxTokens,
        temperature,
        system: options?.systemPrompt,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      });

      const duration = Date.now() - startTime;

      const result: ClaudeResponse = {
        content: response.content[0].type === 'text' ? response.content[0].text : '',
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        model: response.model,
        stopReason: response.stop_reason || 'unknown',
      };

      aiLogger.info('Claude response received', {
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        totalTokens: result.inputTokens + result.outputTokens,
        duration: `${duration}ms`,
        stopReason: result.stopReason,
      });

      return result;
    } catch (error) {
      aiLogger.error('Claude API error', { error });

      if (error instanceof Anthropic.APIError) {
        throw new AIServiceError(
          `Claude API error: ${error.message}`,
          error.status || 500
        );
      }

      throw new AIServiceError('Failed to communicate with Claude AI');
    }
  }

  /**
   * Analyze text with a specific system prompt
   */
  async analyze(
    text: string,
    systemPrompt: string,
    options?: {
      context?: string;
      model?: AIModel;
    }
  ): Promise<ClaudeResponse> {
    const userMessage = options?.context ? `${options.context}\n\n${text}` : text;

    return this.sendMessage(
      [{ role: 'user', content: userMessage }],
      {
        systemPrompt,
        temperature: 0.5, // Lower temperature for analysis tasks
        model: options?.model,
      }
    );
  }

  /**
   * Stream a message to Claude (for future real-time analysis)
   */
  async *streamMessage(
    messages: ClaudeMessage[],
    options?: {
      systemPrompt?: string;
      model?: AIModel;
    }
  ): AsyncGenerator<string, void, unknown> {
    try {
      const model = options?.model || this.defaultModel;
      const modelName = MODEL_MAP[model];

      aiLogger.debug('Streaming message to Claude', {
        messageCount: messages.length,
        model,
        modelName,
      });

      const stream = await this.client.messages.stream({
        model: modelName,
        max_tokens: this.maxTokens,
        system: options?.systemPrompt,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      });

      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          yield chunk.delta.text;
        }
      }

      aiLogger.debug('Stream completed');
    } catch (error) {
      aiLogger.error('Claude streaming error', { error });
      throw new AIServiceError('Failed to stream from Claude AI');
    }
  }

  /**
   * Get current model information
   */
  getModelInfo(): { defaultModel: AIModel; maxTokens: number } {
    return {
      defaultModel: this.defaultModel,
      maxTokens: this.maxTokens,
    };
  }
}

// Export lazy getter for singleton instance
export const claudeClient = {
  get instance() {
    return ClaudeClient.getInstance();
  },
  // Expose methods for easier access
  sendMessage: (...args: Parameters<ClaudeClient['sendMessage']>) =>
    ClaudeClient.getInstance().sendMessage(...args),
  analyze: (...args: Parameters<ClaudeClient['analyze']>) =>
    ClaudeClient.getInstance().analyze(...args),
  getModelInfo: () =>
    ClaudeClient.getInstance().getModelInfo(),
};
