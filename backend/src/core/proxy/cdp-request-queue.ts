/**
 * CDP Request Queue
 * Manages pending intercepted requests and responses from the Chrome extension.
 * Replaces the MITM proxy-based request-queue.ts with a protocol-agnostic queue.
 */

import { EventEmitter } from 'events';
import { proxyLogger } from '../../utils/logger.js';
import { extensionManager } from '../websocket/extension-manager.js';
import type { ExtRepeaterResultPayload } from '../../types/extension.types.js';

export interface CDPPendingRequest {
  requestId: string;
  userId: string;
  tabId: number;
  phase: 'request' | 'response';
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  statusCode?: number;
  resourceType?: string;
  timestamp: number;
  queuedAt?: Date;
  timeoutId?: ReturnType<typeof setTimeout>;
}

export interface CDPQueueStats {
  totalQueued: number;
  currentRequests: number;
  currentResponses: number;
  forwarded: number;
  dropped: number;
  timedOut: number;
}

const TIMEOUT_MS = 60000; // 60 seconds
const GRACE_PERIOD_MS = 30000; // 30 seconds for undo

interface LimboEntry {
  request: CDPPendingRequest;
  droppedAt: Date;
  graceTimeoutId: ReturnType<typeof setTimeout>;
}

type RepeaterResolver = (result: ExtRepeaterResultPayload) => void;

export class CDPRequestQueue extends EventEmitter {
  private queue: Map<string, CDPPendingRequest> = new Map();
  private limbo: Map<string, LimboEntry> = new Map();
  private repeaterPromises: Map<string, RepeaterResolver> = new Map();
  private stats: CDPQueueStats = {
    totalQueued: 0,
    currentRequests: 0,
    currentResponses: 0,
    forwarded: 0,
    dropped: 0,
    timedOut: 0,
  };

  constructor() {
    super();
    proxyLogger.info('CDPRequestQueue initialized');
  }

  /**
   * Hold a request/response in the queue
   */
  hold(request: CDPPendingRequest): void {
    if (this.queue.has(request.requestId)) {
      proxyLogger.warn('Request already in queue', { requestId: request.requestId });
      return;
    }

    // Set timeout for auto-forward
    const timeoutId = setTimeout(() => {
      proxyLogger.warn('Request timed out, auto-forwarding', {
        requestId: request.requestId,
        url: request.url,
        phase: request.phase,
      });
      this.stats.timedOut++;
      this.forward(request.userId, request.requestId);
    }, TIMEOUT_MS);

    request.timeoutId = timeoutId;
    request.queuedAt = new Date();

    this.queue.set(request.requestId, request);
    this.stats.totalQueued++;

    if (request.phase === 'request') {
      this.stats.currentRequests++;
    } else {
      this.stats.currentResponses++;
    }

    this.emit('queue:changed', {
      action: 'hold',
      requestId: request.requestId,
      phase: request.phase,
      queueSize: this.queue.size,
    });
  }

  /**
   * Forward a request/response (with optional modifications)
   */
  forward(userId: string, requestId: string, modifications?: any): void {
    const pending = this.queue.get(requestId);
    if (!pending) {
      proxyLogger.warn('Request not in queue for forward', { requestId });
      return;
    }

    // Clear timeout
    if (pending.timeoutId) {
      clearTimeout(pending.timeoutId);
    }

    // Relay to extension via ExtensionManager
    if (pending.phase === 'request') {
      extensionManager.forwardRequest(userId, requestId, modifications);
      this.stats.currentRequests--;
    } else {
      extensionManager.forwardResponse(userId, requestId, modifications);
      this.stats.currentResponses--;
    }

    this.stats.forwarded++;
    this.queue.delete(requestId);

    this.emit('queue:changed', {
      action: 'forward',
      requestId,
      phase: pending.phase,
      queueSize: this.queue.size,
    });

    // Emit forwarded event
    this.emit(`${pending.phase}:forwarded`, {
      userId: pending.userId,
      requestId,
      wasModified: !!modifications,
    });
  }

  /**
   * Drop a request/response (with grace period for undo)
   */
  drop(userId: string, requestId: string): void {
    const pending = this.queue.get(requestId);
    if (!pending) {
      proxyLogger.warn('Request not in queue for drop', { requestId });
      return;
    }

    // Clear timeout
    if (pending.timeoutId) {
      clearTimeout(pending.timeoutId);
    }

    // Remove from queue
    this.queue.delete(requestId);
    if (pending.phase === 'request') {
      this.stats.currentRequests--;
    } else {
      this.stats.currentResponses--;
    }

    // Move to limbo with grace period
    const graceTimeoutId = setTimeout(() => {
      this.finalDrop(userId, requestId);
    }, GRACE_PERIOD_MS);

    this.limbo.set(requestId, {
      request: pending,
      droppedAt: new Date(),
      graceTimeoutId,
    });

    this.emit('queue:changed', {
      action: 'drop',
      requestId,
      phase: pending.phase,
      queueSize: this.queue.size,
    });

    this.emit(`${pending.phase}:dropped`, {
      userId: pending.userId,
      requestId,
      canUndo: true,
      graceSeconds: GRACE_PERIOD_MS / 1000,
    });
  }

  /**
   * Final drop after grace period
   */
  private finalDrop(userId: string, requestId: string): void {
    const entry = this.limbo.get(requestId);
    if (!entry) return;

    // Send drop to extension
    if (entry.request.phase === 'request') {
      extensionManager.dropRequest(userId, requestId);
    } else {
      extensionManager.dropResponse(userId, requestId);
    }

    this.stats.dropped++;
    this.limbo.delete(requestId);

    this.emit('request:final-drop', {
      userId,
      requestId,
    });
  }

  /**
   * Undo a drop (during grace period)
   */
  undoDrop(requestId: string): boolean {
    const entry = this.limbo.get(requestId);
    if (!entry) return false;

    clearTimeout(entry.graceTimeoutId);
    this.limbo.delete(requestId);

    // Re-add to queue with new timeout
    this.hold(entry.request);

    this.emit('request:undo-success', {
      userId: entry.request.userId,
      requestId,
    });

    return true;
  }

  /**
   * Remove a request from the queue (already handled)
   */
  remove(requestId: string): void {
    const pending = this.queue.get(requestId);
    if (pending) {
      if (pending.timeoutId) {
        clearTimeout(pending.timeoutId);
      }
      this.queue.delete(requestId);
      if (pending.phase === 'request') {
        this.stats.currentRequests--;
      } else {
        this.stats.currentResponses--;
      }
    }
  }

  // ============================================
  // Bulk Operations
  // ============================================

  async bulkForward(userId: string, requestIds: string[]): Promise<{ success: string[]; failed: string[] }> {
    const results = { success: [] as string[], failed: [] as string[] };

    for (const id of requestIds) {
      try {
        this.forward(userId, id);
        results.success.push(id);
      } catch {
        results.failed.push(id);
      }
    }

    return results;
  }

  bulkDrop(userId: string, requestIds: string[]): { success: string[]; failed: string[] } {
    const results = { success: [] as string[], failed: [] as string[] };

    for (const id of requestIds) {
      try {
        this.drop(userId, id);
        results.success.push(id);
      } catch {
        results.failed.push(id);
      }
    }

    return results;
  }

  forwardByPattern(userId: string, urlPattern: string): { success: string[]; failed: string[] } {
    const regex = new RegExp(urlPattern, 'i');
    const matchingIds: string[] = [];

    for (const [id, req] of this.queue.entries()) {
      if (req.userId === userId && regex.test(req.url)) {
        matchingIds.push(id);
      }
    }

    const results = { success: [] as string[], failed: [] as string[] };
    for (const id of matchingIds) {
      try {
        this.forward(userId, id);
        results.success.push(id);
      } catch {
        results.failed.push(id);
      }
    }

    return results;
  }

  dropByPattern(userId: string, urlPattern: string): { success: string[]; failed: string[] } {
    const regex = new RegExp(urlPattern, 'i');
    const matchingIds: string[] = [];

    for (const [id, req] of this.queue.entries()) {
      if (req.userId === userId && regex.test(req.url)) {
        matchingIds.push(id);
      }
    }

    const results = { success: [] as string[], failed: [] as string[] };
    for (const id of matchingIds) {
      try {
        this.drop(userId, id);
        results.success.push(id);
      } catch {
        results.failed.push(id);
      }
    }

    return results;
  }

  // ============================================
  // Repeater Promise Management
  // ============================================

  /**
   * Wait for a repeater result from the extension
   */
  waitForRepeaterResult(requestId: string, timeoutMs = 30000): Promise<ExtRepeaterResultPayload> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.repeaterPromises.delete(requestId);
        reject(new Error(`Repeater request ${requestId} timed out`));
      }, timeoutMs);

      this.repeaterPromises.set(requestId, (result) => {
        clearTimeout(timeout);
        this.repeaterPromises.delete(requestId);
        resolve(result);
      });
    });
  }

  /**
   * Resolve a pending repeater promise
   */
  resolveRepeaterResult(requestId: string, result: ExtRepeaterResultPayload): void {
    const resolver = this.repeaterPromises.get(requestId);
    if (resolver) {
      resolver(result);
    }
  }

  // ============================================
  // Query Methods
  // ============================================

  getQueue(userId?: string): CDPPendingRequest[] {
    const all = Array.from(this.queue.values());
    if (userId) {
      return all.filter((r) => r.userId === userId);
    }
    return all;
  }

  getRequestQueue(userId?: string): CDPPendingRequest[] {
    return this.getQueue(userId).filter((r) => r.phase === 'request');
  }

  getResponseQueue(userId?: string): CDPPendingRequest[] {
    return this.getQueue(userId).filter((r) => r.phase === 'response');
  }

  getStats(): CDPQueueStats {
    return { ...this.stats };
  }

  canUndo(requestId: string): boolean {
    return this.limbo.has(requestId);
  }

  /**
   * Shutdown: forward all pending, clear timeouts
   */
  async shutdown(): Promise<void> {
    proxyLogger.info('CDPRequestQueue shutting down', { pending: this.queue.size });

    for (const [, request] of this.queue) {
      if (request.timeoutId) clearTimeout(request.timeoutId);
    }

    for (const [, entry] of this.limbo) {
      clearTimeout(entry.graceTimeoutId);
    }

    this.queue.clear();
    this.limbo.clear();
    this.repeaterPromises.clear();
    this.removeAllListeners();
  }
}

// Export singleton
export const cdpRequestQueue = new CDPRequestQueue();
