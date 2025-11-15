import { EventEmitter } from 'events';
import http from 'http';
import https from 'https';
import { HTTPRequest, RequestModification } from '../../types/proxy.types.js';
import { proxyLogger } from '../../utils/logger.js';

/**
 * Pending request in the queue
 */
export interface PendingRequest extends HTTPRequest {
  userId: string;
  proxySessionId: string;
  isIntercepted: boolean;
  queuedAt: Date;
  timeoutId?: NodeJS.Timeout;
  clientReq: http.IncomingMessage;
  clientRes: http.ServerResponse;
  isHttps: boolean;
  targetHost?: string;
}

/**
 * Queue statistics
 */
export interface QueueStats {
  totalQueued: number;
  currentlyQueued: number;
  forwarded: number;
  dropped: number;
  timedOut: number;
}

/**
 * Request Queue Manager
 * Holds intercepted requests and manages their lifecycle (forward/drop/timeout)
 */
export class RequestQueue extends EventEmitter {
  private queue: Map<string, PendingRequest> = new Map();
  private stats: QueueStats = {
    totalQueued: 0,
    currentlyQueued: 0,
    forwarded: 0,
    dropped: 0,
    timedOut: 0,
  };
  private readonly TIMEOUT_MS = 60000; // 60 seconds

  constructor() {
    super();
    proxyLogger.info('RequestQueue initialized');
  }

  /**
   * Hold a request in the queue
   */
  async hold(request: PendingRequest): Promise<void> {
    // Check if request already exists
    if (this.queue.has(request.id)) {
      proxyLogger.warn('Request already in queue', { requestId: request.id });
      return;
    }

    // Set up timeout for auto-forward
    const timeoutId = setTimeout(() => {
      proxyLogger.warn('Request timeout - auto-forwarding', {
        requestId: request.id,
        url: request.url,
      });
      this.stats.timedOut++;
      this.forward(request.id).catch((error) => {
        proxyLogger.error('Auto-forward failed', { requestId: request.id, error });
      });
    }, this.TIMEOUT_MS);

    // Add timeout to request
    request.timeoutId = timeoutId;

    // Add to queue
    this.queue.set(request.id, request);
    this.stats.totalQueued++;
    this.stats.currentlyQueued++;

    proxyLogger.info('Request held in queue', {
      requestId: request.id,
      url: request.url,
      queueSize: this.queue.size,
    });

    // Emit queue change event
    this.emit('queue:changed', {
      action: 'hold',
      requestId: request.id,
      queueSize: this.queue.size,
    });

    // Emit request held event for WebSocket
    this.emit('request:held', {
      userId: request.userId,
      request: {
        id: request.id,
        method: request.method,
        url: request.url,
        headers: request.headers,
        body: request.body,
        timestamp: request.timestamp,
        queuedAt: request.queuedAt,
      },
    });
  }

  /**
   * Forward a request (with optional modifications)
   */
  async forward(requestId: string, modifications?: RequestModification): Promise<void> {
    const pendingReq = this.queue.get(requestId);

    if (!pendingReq) {
      proxyLogger.warn('Request not found in queue', { requestId });
      throw new Error(`Request ${requestId} not found in queue`);
    }

    // Clear timeout
    if (pendingReq.timeoutId) {
      clearTimeout(pendingReq.timeoutId);
    }

    // Apply modifications if provided
    let finalRequest = pendingReq;
    if (modifications) {
      finalRequest = this.applyModifications(pendingReq, modifications);
      proxyLogger.info('Request modified before forwarding', {
        requestId,
        modifications: Object.keys(modifications.modifications),
      });
    }

    // Forward the request to target server
    try {
      await this.forwardToTarget(finalRequest);

      this.stats.forwarded++;
      this.stats.currentlyQueued--;

      proxyLogger.info('Request forwarded', {
        requestId,
        url: finalRequest.url,
        wasModified: !!modifications,
      });

      // Remove from queue
      this.queue.delete(requestId);

      // Emit events
      this.emit('queue:changed', {
        action: 'forward',
        requestId,
        queueSize: this.queue.size,
      });

      this.emit('request:forwarded', {
        userId: pendingReq.userId,
        requestId,
        wasModified: !!modifications,
      });
    } catch (error) {
      proxyLogger.error('Failed to forward request', { requestId, error });

      // Send error response to client
      pendingReq.clientRes.writeHead(502, { 'Content-Type': 'text/plain' });
      pendingReq.clientRes.end('Bad Gateway - Failed to forward request');

      // Remove from queue even on error
      this.queue.delete(requestId);
      this.stats.currentlyQueued--;

      throw error;
    }
  }

  /**
   * Drop a request (return 403 to client)
   */
  drop(requestId: string): void {
    const pendingReq = this.queue.get(requestId);

    if (!pendingReq) {
      proxyLogger.warn('Request not found in queue for drop', { requestId });
      return;
    }

    // Clear timeout
    if (pendingReq.timeoutId) {
      clearTimeout(pendingReq.timeoutId);
    }

    // Send 403 Forbidden to client
    pendingReq.clientRes.writeHead(403, { 'Content-Type': 'text/plain' });
    pendingReq.clientRes.end('Request blocked by interceptor');

    this.stats.dropped++;
    this.stats.currentlyQueued--;

    proxyLogger.info('Request dropped', {
      requestId,
      url: pendingReq.url,
    });

    // Remove from queue
    this.queue.delete(requestId);

    // Emit events
    this.emit('queue:changed', {
      action: 'drop',
      requestId,
      queueSize: this.queue.size,
    });

    this.emit('request:dropped', {
      userId: pendingReq.userId,
      requestId,
    });
  }

  /**
   * Get all queued requests
   */
  getQueue(): PendingRequest[] {
    return Array.from(this.queue.values()).map((req) => ({
      ...req,
      // Remove sensitive internal properties
      clientReq: undefined as any,
      clientRes: undefined as any,
      timeoutId: undefined,
    }));
  }

  /**
   * Clear all queued requests (forward all)
   */
  async clearQueue(): Promise<void> {
    const requestIds = Array.from(this.queue.keys());

    proxyLogger.info('Clearing queue', { count: requestIds.length });

    // Forward all pending requests
    for (const requestId of requestIds) {
      try {
        await this.forward(requestId);
      } catch (error) {
        proxyLogger.error('Failed to clear request', { requestId, error });
      }
    }

    proxyLogger.info('Queue cleared');
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    return { ...this.stats };
  }

  /**
   * Apply modifications to a request
   */
  private applyModifications(
    request: PendingRequest,
    modifications: RequestModification
  ): PendingRequest {
    const modified = { ...request };

    if (modifications.modifications.method) {
      modified.method = modifications.modifications.method;
    }

    if (modifications.modifications.url) {
      modified.url = modifications.modifications.url;
    }

    if (modifications.modifications.headers) {
      modified.headers = {
        ...modified.headers,
        ...modifications.modifications.headers,
      };
    }

    if (modifications.modifications.body !== undefined) {
      modified.body = modifications.modifications.body;
    }

    return modified;
  }

  /**
   * Forward request to target server
   */
  private async forwardToTarget(pendingReq: PendingRequest): Promise<void> {
    return new Promise((resolve, reject) => {
      const targetUrl = new URL(pendingReq.url);
      const isHttps = pendingReq.isHttps || targetUrl.protocol === 'https:';

      const options: http.RequestOptions | https.RequestOptions = {
        hostname: targetUrl.hostname,
        port: targetUrl.port || (isHttps ? 443 : 80),
        path: targetUrl.pathname + targetUrl.search,
        method: pendingReq.method,
        headers: pendingReq.headers,
      };

      const requestModule = isHttps ? https : http;

      const proxyReq = requestModule.request(options, (proxyRes) => {
        // Forward response to client
        pendingReq.clientRes.writeHead(
          proxyRes.statusCode || 200,
          proxyRes.headers
        );
        proxyRes.pipe(pendingReq.clientRes);

        proxyRes.on('end', () => {
          resolve();
        });
      });

      proxyReq.on('error', (error) => {
        reject(error);
      });

      // Write body if present
      if (pendingReq.body) {
        proxyReq.write(pendingReq.body);
      }

      proxyReq.end();
    });
  }

  /**
   * Shutdown queue (forward all pending requests)
   */
  async shutdown(): Promise<void> {
    proxyLogger.info('RequestQueue shutting down', {
      pendingRequests: this.queue.size,
    });

    await this.clearQueue();

    // Clear any remaining timeouts
    for (const request of this.queue.values()) {
      if (request.timeoutId) {
        clearTimeout(request.timeoutId);
      }
    }

    this.queue.clear();
    this.removeAllListeners();

    proxyLogger.info('RequestQueue shutdown complete');
  }
}
