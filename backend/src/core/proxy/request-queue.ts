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
 * Request in limbo state (dropped but can be undone)
 */
export interface LimboRequest {
  request: PendingRequest;
  droppedAt: Date;
  graceTimeoutId: NodeJS.Timeout;
  canUndo: boolean;
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
  autoDropped: number; // Auto-dropped by smart filters
}

/**
 * Smart filter patterns for auto-dropping requests
 */
export interface SmartFilterPattern {
  name: string;
  pattern: RegExp;
  enabled: boolean;
  description: string;
}

/**
 * Default smart filters (static assets, tracking, etc.)
 */
export const DEFAULT_SMART_FILTERS: SmartFilterPattern[] = [
  {
    name: 'static-assets',
    pattern: /\.(css|js|jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot)(\?.*)?$/i,
    enabled: true,
    description: 'Static assets (images, fonts, stylesheets)',
  },
  {
    name: 'google-analytics',
    pattern: /(google-analytics\.com|googletagmanager\.com|analytics\.google\.com)/i,
    enabled: true,
    description: 'Google Analytics tracking',
  },
  {
    name: 'cdn-resources',
    pattern: /(cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com)/i,
    enabled: false, // Disabled by default - some pentesters might want to see CDN requests
    description: 'CDN resources',
  },
  {
    name: 'websocket-upgrades',
    pattern: /upgrade:\s*websocket/i,
    enabled: false, // Disabled by default - websockets can be attack vectors
    description: 'WebSocket upgrade requests',
  },
];

/**
 * Request Queue Manager
 * Holds intercepted requests and manages their lifecycle (forward/drop/timeout)
 */
export class RequestQueue extends EventEmitter {
  private queue: Map<string, PendingRequest> = new Map();
  private limboRequests: Map<string, LimboRequest> = new Map(); // Dropped requests in grace period
  private stats: QueueStats = {
    totalQueued: 0,
    currentlyQueued: 0,
    forwarded: 0,
    dropped: 0,
    timedOut: 0,
    autoDropped: 0,
  };
  private readonly TIMEOUT_MS = 60000; // 60 seconds
  private readonly GRACE_PERIOD_MS = 30000; // 30 seconds grace period for undo
  private smartFilters: SmartFilterPattern[] = [...DEFAULT_SMART_FILTERS];

  constructor() {
    super();
    proxyLogger.info('RequestQueue initialized with smart filters', {
      filters: this.smartFilters.filter((f) => f.enabled).map((f) => f.name),
    });
  }

  /**
   * Check if request matches any enabled smart filter
   */
  private shouldAutoForward(request: PendingRequest): boolean {
    const enabledFilters = this.smartFilters.filter((f) => f.enabled);

    for (const filter of enabledFilters) {
      // Check URL
      if (filter.pattern.test(request.url)) {
        proxyLogger.debug('Request matched smart filter - auto-forwarding', {
          url: request.url,
          filter: filter.name,
        });
        return true;
      }

      // Check headers (for websocket upgrades)
      const upgradeHeader = request.headers['upgrade'] || request.headers['Upgrade'];
      if (upgradeHeader && filter.pattern.test(`upgrade: ${upgradeHeader}`)) {
        proxyLogger.debug('Request matched header filter - auto-forwarding', {
          url: request.url,
          filter: filter.name,
        });
        return true;
      }
    }

    return false;
  }

  /**
   * Update smart filter configuration
   */
  setSmartFilters(filters: SmartFilterPattern[]): void {
    this.smartFilters = filters;
    proxyLogger.info('Smart filters updated', {
      enabled: filters.filter((f) => f.enabled).map((f) => f.name),
    });
  }

  /**
   * Get current smart filter configuration
   */
  getSmartFilters(): SmartFilterPattern[] {
    return [...this.smartFilters];
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

    // Check if request should be auto-forwarded (smart filtering)
    if (this.shouldAutoForward(request)) {
      this.stats.autoDropped++;
      this.stats.totalQueued++;

      // Forward immediately without holding
      await this.forwardToTarget(request).catch((error) => {
        proxyLogger.error('Smart filter auto-forward failed', {
          requestId: request.id,
          url: request.url,
          error
        });
      });
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
   * Drop a request (with grace period for undo)
   * Request enters "limbo" state for GRACE_PERIOD_MS before actually sending 403
   */
  drop(requestId: string): void {
    const pendingReq = this.queue.get(requestId);

    if (!pendingReq) {
      proxyLogger.warn('Request not found in queue for drop', { requestId });
      return;
    }

    // Clear queue timeout FIRST to prevent race condition
    if (pendingReq.timeoutId) {
      clearTimeout(pendingReq.timeoutId);
      pendingReq.timeoutId = undefined;
    }

    // Check if response already sent (race with timeout/forward)
    if (pendingReq.clientRes.writableEnded || pendingReq.clientRes.headersSent) {
      proxyLogger.warn('Response already sent, cannot drop', { requestId });
      this.queue.delete(requestId);
      this.stats.currentlyQueued--;
      return;
    }

    // Remove from active queue
    this.queue.delete(requestId);
    this.stats.currentlyQueued--;

    // Set grace period timeout for final drop
    const graceTimeoutId = setTimeout(() => {
      this.finalDrop(requestId);
    }, this.GRACE_PERIOD_MS);

    // Move to limbo (can be undone)
    this.limboRequests.set(requestId, {
      request: pendingReq,
      droppedAt: new Date(),
      graceTimeoutId,
      canUndo: true,
    });

    proxyLogger.info('Request moved to limbo (grace period active)', {
      requestId,
      url: pendingReq.url,
      gracePeriodMs: this.GRACE_PERIOD_MS,
    });

    // Emit events
    this.emit('queue:changed', {
      action: 'drop',
      requestId,
      queueSize: this.queue.size,
    });

    this.emit('request:dropped', {
      userId: pendingReq.userId,
      requestId,
      canUndo: true,
      graceSeconds: this.GRACE_PERIOD_MS / 1000,
    });
  }

  /**
   * Final drop - actually send 403 to client
   * Called after grace period expires
   */
  private finalDrop(requestId: string): void {
    const limboReq = this.limboRequests.get(requestId);

    if (!limboReq) {
      proxyLogger.warn('Request not found in limbo for final drop', { requestId });
      return;
    }

    const { request: pendingReq } = limboReq;

    // Check if response already sent
    if (pendingReq.clientRes.writableEnded || pendingReq.clientRes.headersSent) {
      proxyLogger.warn('Response already sent during grace period', { requestId });
      this.limboRequests.delete(requestId);
      return;
    }

    try {
      // Send 403 Forbidden to client
      pendingReq.clientRes.writeHead(403, { 'Content-Type': 'text/plain' });
      pendingReq.clientRes.end('Request blocked by interceptor');

      this.stats.dropped++;

      proxyLogger.info('Request finally dropped (grace period expired)', {
        requestId,
        url: pendingReq.url,
      });
    } catch (error) {
      proxyLogger.error('Failed to send drop response', { requestId, error });
    }

    // Remove from limbo
    this.limboRequests.delete(requestId);

    // Emit final drop event
    this.emit('request:final-drop', {
      userId: pendingReq.userId,
      requestId,
    });
  }

  /**
   * Undo a drop - restore request to queue
   * Only works during grace period
   */
  undoDrop(requestId: string): boolean {
    const limboReq = this.limboRequests.get(requestId);

    if (!limboReq) {
      proxyLogger.warn('Cannot undo: request not in limbo', { requestId });
      return false;
    }

    if (!limboReq.canUndo) {
      proxyLogger.warn('Cannot undo: grace period expired', { requestId });
      return false;
    }

    // Clear grace period timeout
    clearTimeout(limboReq.graceTimeoutId);

    const { request: pendingReq } = limboReq;

    // Check if response was somehow sent
    if (pendingReq.clientRes.writableEnded || pendingReq.clientRes.headersSent) {
      proxyLogger.warn('Cannot undo: response already sent', { requestId });
      this.limboRequests.delete(requestId);
      return false;
    }

    // Remove from limbo
    this.limboRequests.delete(requestId);

    // Restore to queue with new timeout (auto-forward on timeout)
    const timeoutId = setTimeout(() => {
      proxyLogger.warn('Request timed out after undo, auto-forwarding', {
        requestId,
        url: pendingReq.url,
      });
      this.stats.timedOut++;
      this.forward(requestId).catch((error) => {
        proxyLogger.error('Auto-forward failed after undo timeout', { requestId, error });
      });
    }, this.TIMEOUT_MS);

    pendingReq.timeoutId = timeoutId;
    this.queue.set(requestId, pendingReq);
    this.stats.currentlyQueued++;

    proxyLogger.info('Request restored to queue (undo successful)', {
      requestId,
      url: pendingReq.url,
    });

    // Emit events
    this.emit('queue:changed', {
      action: 'undo',
      requestId,
      queueSize: this.queue.size,
    });

    this.emit('request:undo-success', {
      userId: pendingReq.userId,
      requestId,
    });

    // Re-emit to client (request is back in queue)
    this.emit('request:held', {
      userId: pendingReq.userId,
      request: {
        id: pendingReq.id,
        method: pendingReq.method,
        url: pendingReq.url,
        headers: pendingReq.headers,
        body: pendingReq.body,
        timestamp: pendingReq.timestamp,
        queuedAt: pendingReq.queuedAt,
      },
    });

    return true;
  }

  /**
   * Get limbo requests (for debugging/monitoring)
   */
  getLimboRequests(): LimboRequest[] {
    return Array.from(this.limboRequests.values());
  }

  /**
   * Check if a request can be undone
   */
  canUndo(requestId: string): boolean {
    const limboReq = this.limboRequests.get(requestId);
    return limboReq ? limboReq.canUndo : false;
  }

  /**
   * Get a specific request from queue
   */
  get(requestId: string): PendingRequest | undefined {
    return this.queue.get(requestId);
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
   * Bulk forward multiple requests
   */
  async bulkForward(requestIds: string[]): Promise<{ success: string[]; failed: string[] }> {
    const results = { success: [] as string[], failed: [] as string[] };

    proxyLogger.info('Bulk forward requested', { count: requestIds.length });

    for (const requestId of requestIds) {
      try {
        await this.forward(requestId);
        results.success.push(requestId);
      } catch (error) {
        proxyLogger.error('Bulk forward failed for request', { requestId, error });
        results.failed.push(requestId);
      }
    }

    proxyLogger.info('Bulk forward completed', {
      success: results.success.length,
      failed: results.failed.length,
    });

    return results;
  }

  /**
   * Bulk drop multiple requests
   */
  bulkDrop(requestIds: string[]): { success: string[]; failed: string[] } {
    const results = { success: [] as string[], failed: [] as string[] };

    proxyLogger.info('Bulk drop requested', { count: requestIds.length });

    for (const requestId of requestIds) {
      try {
        this.drop(requestId);
        results.success.push(requestId);
      } catch (error) {
        proxyLogger.error('Bulk drop failed for request', { requestId, error });
        results.failed.push(requestId);
      }
    }

    proxyLogger.info('Bulk drop completed', {
      success: results.success.length,
      failed: results.failed.length,
    });

    return results;
  }

  /**
   * Bulk undo drop for multiple requests
   */
  bulkUndoDrop(requestIds: string[]): { success: string[]; failed: string[] } {
    const results = { success: [] as string[], failed: [] as string[] };

    proxyLogger.info('Bulk undo drop requested', { count: requestIds.length });

    for (const requestId of requestIds) {
      const undone = this.undoDrop(requestId);
      if (undone) {
        results.success.push(requestId);
      } else {
        results.failed.push(requestId);
      }
    }

    proxyLogger.info('Bulk undo drop completed', {
      success: results.success.length,
      failed: results.failed.length,
    });

    return results;
  }

  /**
   * Forward requests matching a URL pattern
   */
  async forwardByPattern(urlPattern: string): Promise<{ success: string[]; failed: string[] }> {
    const matchingIds: string[] = [];
    const regex = new RegExp(urlPattern, 'i');

    for (const [id, req] of this.queue.entries()) {
      if (regex.test(req.url)) {
        matchingIds.push(id);
      }
    }

    proxyLogger.info('Pattern-based forward', {
      pattern: urlPattern,
      matches: matchingIds.length,
    });

    return this.bulkForward(matchingIds);
  }

  /**
   * Drop requests matching a URL pattern
   */
  dropByPattern(urlPattern: string): { success: string[]; failed: string[] } {
    const matchingIds: string[] = [];
    const regex = new RegExp(urlPattern, 'i');

    for (const [id, req] of this.queue.entries()) {
      if (regex.test(req.url)) {
        matchingIds.push(id);
      }
    }

    proxyLogger.info('Pattern-based drop', {
      pattern: urlPattern,
      matches: matchingIds.length,
    });

    return this.bulkDrop(matchingIds);
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
        // Only write headers if they haven't been sent yet
        if (!pendingReq.clientRes.headersSent) {
          pendingReq.clientRes.writeHead(
            proxyRes.statusCode || 200,
            proxyRes.headers
          );
        }
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
