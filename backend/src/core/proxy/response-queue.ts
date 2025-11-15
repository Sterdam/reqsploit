/**
 * Response Queue System
 * Holds and manages HTTP responses for interception and modification
 */

import { EventEmitter } from 'events';
import logger from '../../utils/logger.js';

const responseLogger = logger.child({ module: 'response-queue' });

export interface PendingResponse {
  id: string;
  requestId: string; // Link to original request
  statusCode: number;
  statusMessage: string;
  headers: Record<string, string | string[]>;
  body: Buffer;
  timestamp: Date;
  timeout: NodeJS.Timeout;
}

export interface ResponseModification {
  statusCode?: number;
  statusMessage?: string;
  headers?: Record<string, string | string[]>;
  body?: string; // Modified body as string
}

export class ResponseQueue extends EventEmitter {
  private queue: Map<string, PendingResponse> = new Map();
  private timeoutDuration = 60000; // 60 seconds

  /**
   * Hold a response in the queue for inspection/modification
   */
  async hold(response: Omit<PendingResponse, 'id' | 'timeout'>): Promise<string> {
    const id = `resp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const timeout = setTimeout(() => {
      responseLogger.warn('Response auto-forwarded due to timeout', { id });
      this.forward(id); // Auto-forward on timeout
    }, this.timeoutDuration);

    const pendingResponse: PendingResponse = {
      id,
      ...response,
      timeout,
    };

    this.queue.set(id, pendingResponse);

    responseLogger.info('Response held in queue', {
      id,
      requestId: response.requestId,
      statusCode: response.statusCode,
      queueSize: this.queue.size,
    });

    this.emit('response:held', pendingResponse);

    return id;
  }

  /**
   * Forward a response (with optional modifications) to the client
   */
  async forward(
    responseId: string,
    modifications?: ResponseModification
  ): Promise<PendingResponse | null> {
    const response = this.queue.get(responseId);
    if (!response) {
      responseLogger.warn('Response not found in queue', { responseId });
      return null;
    }

    // Clear timeout
    clearTimeout(response.timeout);

    // Apply modifications
    if (modifications) {
      if (modifications.statusCode !== undefined) {
        response.statusCode = modifications.statusCode;
      }
      if (modifications.statusMessage !== undefined) {
        response.statusMessage = modifications.statusMessage;
      }
      if (modifications.headers !== undefined) {
        response.headers = modifications.headers;
      }
      if (modifications.body !== undefined) {
        response.body = Buffer.from(modifications.body);
      }
    }

    // Remove from queue
    this.queue.delete(responseId);

    responseLogger.info('Response forwarded', {
      responseId,
      modified: !!modifications,
      queueSize: this.queue.size,
    });

    this.emit('response:forwarded', response, modifications);

    return response;
  }

  /**
   * Drop a response (return error to client)
   */
  drop(responseId: string): boolean {
    const response = this.queue.get(responseId);
    if (!response) {
      responseLogger.warn('Response not found for drop', { responseId });
      return false;
    }

    // Clear timeout
    clearTimeout(response.timeout);

    // Remove from queue
    this.queue.delete(responseId);

    responseLogger.info('Response dropped', {
      responseId,
      queueSize: this.queue.size,
    });

    this.emit('response:dropped', response);

    return true;
  }

  /**
   * Get current queue state
   */
  getQueue(): PendingResponse[] {
    return Array.from(this.queue.values()).map((response) => ({
      ...response,
      timeout: undefined as any, // Remove timeout from serialization
    }));
  }

  /**
   * Clear all responses from queue
   */
  clearQueue(): void {
    // Clear all timeouts
    for (const response of this.queue.values()) {
      clearTimeout(response.timeout);
    }

    const count = this.queue.size;
    this.queue.clear();

    responseLogger.info('Queue cleared', { clearedCount: count });

    this.emit('queue:cleared');
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.size;
  }

  /**
   * Check if response is in queue
   */
  has(responseId: string): boolean {
    return this.queue.has(responseId);
  }
}

export const responseQueue = new ResponseQueue();
