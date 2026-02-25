/**
 * Extension Manager
 * Tracks connected Chrome extensions per user and relays events.
 */

import { wsLogger } from '../../utils/logger.js';
import type {
  ExtensionConnectionInfo,
  ExtForwardRequestPayload,
  ExtForwardResponsePayload,
  ExtToggleInterceptPayload,
  ExtUpdateFiltersPayload,
  ExtRepeaterSendPayload,
  ExtIntruderStartPayload,
} from '../../types/extension.types.js';

export class ExtensionManager {
  private static instance: ExtensionManager;
  private extensions: Map<string, ExtensionConnectionInfo> = new Map(); // userId → connection info

  // Socket.io server emit function (injected by ws-server)
  private emitToSocket: ((socketId: string, event: string, data: any) => void) | null = null;

  private constructor() {
    wsLogger.info('ExtensionManager initialized');
  }

  static getInstance(): ExtensionManager {
    if (!ExtensionManager.instance) {
      ExtensionManager.instance = new ExtensionManager();
    }
    return ExtensionManager.instance;
  }

  /**
   * Set the emit function (called by ws-server during initialization)
   */
  setEmitFunction(fn: (socketId: string, event: string, data: any) => void): void {
    this.emitToSocket = fn;
  }

  /**
   * Register a connected extension
   */
  register(userId: string, socketId: string, version: string, attachedTabs: Array<{ tabId: number; url: string }>): void {
    this.extensions.set(userId, {
      socketId,
      userId,
      version,
      attachedTabs,
      interceptEnabled: false,
      connectedAt: new Date(),
    });

    wsLogger.info('Extension registered', { userId, socketId, version, tabs: attachedTabs.length });
  }

  /**
   * Unregister extension (on disconnect)
   */
  unregister(userId: string): void {
    this.extensions.delete(userId);
    wsLogger.info('Extension unregistered', { userId });
  }

  /**
   * Check if user has a connected extension
   */
  isConnected(userId: string): boolean {
    return this.extensions.has(userId);
  }

  /**
   * Get extension info for a user
   */
  getConnection(userId: string): ExtensionConnectionInfo | undefined {
    return this.extensions.get(userId);
  }

  /**
   * Update attached tabs for a user's extension
   */
  updateTabs(userId: string, tabs: Array<{ tabId: number; url: string }>): void {
    const ext = this.extensions.get(userId);
    if (ext) {
      ext.attachedTabs = tabs;
    }
  }

  /**
   * Add an attached tab
   */
  addTab(userId: string, tabId: number, url: string): void {
    const ext = this.extensions.get(userId);
    if (ext) {
      ext.attachedTabs = ext.attachedTabs.filter((t) => t.tabId !== tabId);
      ext.attachedTabs.push({ tabId, url });
    }
  }

  /**
   * Remove an attached tab
   */
  removeTab(userId: string, tabId: number): void {
    const ext = this.extensions.get(userId);
    if (ext) {
      ext.attachedTabs = ext.attachedTabs.filter((t) => t.tabId !== tabId);
    }
  }

  // ============================================
  // Relay events to extension
  // ============================================

  /**
   * Send event to a user's extension
   */
  private sendToExtension(userId: string, event: string, data: any): boolean {
    const ext = this.extensions.get(userId);
    if (!ext || !this.emitToSocket) {
      wsLogger.warn('Cannot send to extension: not connected', { userId, event });
      return false;
    }

    this.emitToSocket(ext.socketId, event, data);
    return true;
  }

  /**
   * Forward a paused request
   */
  forwardRequest(userId: string, requestId: string, modifications?: ExtForwardRequestPayload['modifications']): boolean {
    return this.sendToExtension(userId, 'ext:forward-request', {
      requestId,
      modifications,
    } as ExtForwardRequestPayload);
  }

  /**
   * Drop a paused request
   */
  dropRequest(userId: string, requestId: string): boolean {
    return this.sendToExtension(userId, 'ext:drop-request', { requestId });
  }

  /**
   * Forward a paused response
   */
  forwardResponse(userId: string, requestId: string, modifications?: ExtForwardResponsePayload['modifications']): boolean {
    return this.sendToExtension(userId, 'ext:forward-response', {
      requestId,
      modifications,
    } as ExtForwardResponsePayload);
  }

  /**
   * Drop a paused response
   */
  dropResponse(userId: string, requestId: string): boolean {
    return this.sendToExtension(userId, 'ext:drop-response', { requestId });
  }

  /**
   * Toggle intercept mode
   */
  toggleIntercept(userId: string, data: ExtToggleInterceptPayload): boolean {
    const ext = this.extensions.get(userId);
    if (ext) {
      ext.interceptEnabled = data.enabled;
    }
    return this.sendToExtension(userId, 'ext:toggle-intercept', data);
  }

  /**
   * Update smart filters
   */
  updateFilters(userId: string, data: ExtUpdateFiltersPayload): boolean {
    return this.sendToExtension(userId, 'ext:update-filters', data);
  }

  /**
   * Send a repeater request to extension
   */
  sendRepeaterRequest(userId: string, data: ExtRepeaterSendPayload): boolean {
    return this.sendToExtension(userId, 'ext:repeater-send', data);
  }

  /**
   * Start an intruder campaign on extension
   */
  sendIntruderBatch(userId: string, data: ExtIntruderStartPayload): boolean {
    return this.sendToExtension(userId, 'ext:intruder-start', data);
  }

  /**
   * Stop an intruder campaign on extension
   */
  stopIntruder(userId: string, campaignId: string): boolean {
    return this.sendToExtension(userId, 'ext:intruder-stop', { campaignId });
  }

  /**
   * Get all connected extensions (for monitoring)
   */
  getAllConnections(): ExtensionConnectionInfo[] {
    return Array.from(this.extensions.values());
  }

  /**
   * Get connected extension count
   */
  getConnectionCount(): number {
    return this.extensions.size;
  }
}

// Export singleton
export const extensionManager = ExtensionManager.getInstance();
