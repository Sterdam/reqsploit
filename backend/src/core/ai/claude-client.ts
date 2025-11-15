import Anthropic from '@anthropic-ai/sdk';
import { AIServiceError } from '../../utils/errors.js';
import { aiLogger } from '../../utils/logger.js';

/**
 * Claude AI Client (Singleton)
 * Wrapper for Anthropic API with rate limiting and error handling
 */

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeResponse {
  content: string;
  tokensUsed: number;
  model: string;
  stopReason: string;
}

export class ClaudeClient {
  private static instance: ClaudeClient;
  private client: Anthropic;
  private model: string;
  private maxTokens: number;

  private constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      aiLogger.warn('ANTHROPIC_API_KEY not set - Claude AI features will be disabled');
      this.client = null as any; // Will throw error if actually used
    } else {
      this.client = new Anthropic({
        apiKey,
      });

      aiLogger.info('Claude AI Client initialized', {
        model: this.model,
        maxTokens: this.maxTokens,
      });
    }

    this.model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
    this.maxTokens = parseInt(process.env.ANTHROPIC_MAX_TOKENS || '4096', 10);
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
    systemPrompt?: string,
    temperature: number = 0.7
  ): Promise<ClaudeResponse> {
    try {
      aiLogger.debug('Sending message to Claude', {
        messageCount: messages.length,
        systemPromptLength: systemPrompt?.length || 0,
      });

      const startTime = Date.now();

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature,
        system: systemPrompt,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      });

      const duration = Date.now() - startTime;

      const result: ClaudeResponse = {
        content: response.content[0].type === 'text' ? response.content[0].text : '',
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        model: response.model,
        stopReason: response.stop_reason || 'unknown',
      };

      aiLogger.info('Claude response received', {
        tokensUsed: result.tokensUsed,
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
    context?: string
  ): Promise<ClaudeResponse> {
    const userMessage = context ? `${context}\n\n${text}` : text;

    return this.sendMessage(
      [{ role: 'user', content: userMessage }],
      systemPrompt,
      0.5 // Lower temperature for analysis tasks
    );
  }

  /**
   * Stream a message to Claude (for future real-time analysis)
   */
  async *streamMessage(
    messages: ClaudeMessage[],
    systemPrompt?: string
  ): AsyncGenerator<string, void, unknown> {
    try {
      aiLogger.debug('Streaming message to Claude', {
        messageCount: messages.length,
      });

      const stream = await this.client.messages.stream({
        model: this.model,
        max_tokens: this.maxTokens,
        system: systemPrompt,
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
  getModelInfo(): { model: string; maxTokens: number } {
    return {
      model: this.model,
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
  getConfig: () =>
    ClaudeClient.getInstance().getConfig(),
};
