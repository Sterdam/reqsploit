/**
 * ReqSploit CDP Engine
 * Core Chrome DevTools Protocol interception engine using chrome.debugger API.
 * Handles request AND response interception via Fetch domain.
 */

import type {
  CDPSession,
  CDPRequestPaused,
  CDPResponseBody,
  RequestModifications,
  ResponseModifications,
  SmartFilterConfig,
} from './types';

// Default smart filters - auto-continue these requests
const DEFAULT_SMART_FILTERS: SmartFilterConfig[] = [
  {
    name: 'static-assets',
    pattern: '\\.(css|js|jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot)(\\?.*)?$',
    enabled: true,
    description: 'Static assets (images, fonts, stylesheets)',
  },
  {
    name: 'google-analytics',
    pattern: '(google-analytics\\.com|googletagmanager\\.com|analytics\\.google\\.com)',
    enabled: true,
    description: 'Google Analytics tracking',
  },
  {
    name: 'cdn-resources',
    pattern: '(cdn\\.jsdelivr\\.net|unpkg\\.com|cdnjs\\.cloudflare\\.com)',
    enabled: false,
    description: 'CDN resources',
  },
  {
    name: 'websocket-upgrades',
    pattern: '^wss?://',
    enabled: true,
    description: 'WebSocket connections',
  },
  {
    name: 'extension-internal',
    pattern: '^chrome-extension://',
    enabled: true,
    description: 'Chrome extension internal requests',
  },
  {
    name: 'favicon',
    pattern: '/favicon\\.',
    enabled: true,
    description: 'Favicon requests',
  },
  {
    name: 'reqsploit-internal',
    pattern: '(reqsploit\\.com|localhost:(3000|5173))',
    enabled: true,
    description: 'ReqSploit dashboard requests (prevent self-interception)',
  },
];

export type CDPEventCallback = (
  event: 'request-paused' | 'response-paused',
  tabId: number,
  data: CDPRequestPaused
) => void;

export class CDPEngine {
  private sessions: Map<number, CDPSession> = new Map();
  private smartFilters: SmartFilterConfig[] = [...DEFAULT_SMART_FILTERS];
  private compiledFilters: Array<{ name: string; regex: RegExp; enabled: boolean }> = [];
  private eventCallback: CDPEventCallback | null = null;
  private interceptEnabled = false;
  private responseInterceptEnabled = false;

  constructor() {
    this.compileFilters();
    this.setupDetachListener();
  }

  /**
   * Set callback for CDP events (request/response paused)
   */
  onEvent(callback: CDPEventCallback): void {
    this.eventCallback = callback;
  }

  /**
   * Attach debugger to a tab and enable Fetch interception
   */
  async attach(tabId: number): Promise<void> {
    if (this.sessions.has(tabId)) {
      console.log(`[CDP] Already attached to tab ${tabId}`);
      return;
    }

    try {
      // Attach debugger
      await chrome.debugger.attach({ tabId }, '1.3');

      // Enable Fetch domain with request AND response stage interception
      const patterns: Array<{ requestStage: string; urlPattern: string }> = [
        { requestStage: 'Request', urlPattern: '*' },
      ];

      // Add response stage if enabled
      if (this.responseInterceptEnabled) {
        patterns.push({ requestStage: 'Response', urlPattern: '*' });
      }

      await this.sendCommand(tabId, 'Fetch.enable', {
        patterns,
        handleAuthRequests: false,
      });

      // Get current tab URL
      const tab = await chrome.tabs.get(tabId);

      const session: CDPSession = {
        tabId,
        url: tab.url || '',
        attached: true,
        interceptEnabled: this.interceptEnabled,
        responseInterceptEnabled: this.responseInterceptEnabled,
        requestCount: 0,
        attachedAt: Date.now(),
      };

      this.sessions.set(tabId, session);

      console.log(`[CDP] Attached to tab ${tabId}: ${tab.url}`);
    } catch (error) {
      console.error(`[CDP] Failed to attach to tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Detach debugger from a tab
   */
  async detach(tabId: number): Promise<void> {
    const session = this.sessions.get(tabId);
    if (!session) {
      console.log(`[CDP] Not attached to tab ${tabId}`);
      return;
    }

    try {
      await chrome.debugger.detach({ tabId });
    } catch (error) {
      // Might already be detached
      console.warn(`[CDP] Detach warning for tab ${tabId}:`, error);
    }

    this.sessions.delete(tabId);
    console.log(`[CDP] Detached from tab ${tabId}`);
  }

  /**
   * Detach from all tabs
   */
  async detachAll(): Promise<void> {
    const tabIds = Array.from(this.sessions.keys());
    for (const tabId of tabIds) {
      await this.detach(tabId);
    }
  }

  /**
   * Handle Fetch.requestPaused event from chrome.debugger
   */
  async handleRequestPaused(tabId: number, params: CDPRequestPaused): Promise<void> {
    const session = this.sessions.get(tabId);
    if (!session) return;

    session.requestCount++;

    // Determine if this is a response or request interception
    const isResponse = params.responseStatusCode !== undefined;

    if (isResponse) {
      await this.handleResponsePaused(tabId, params);
    } else {
      await this.handleRequestInterception(tabId, params);
    }
  }

  /**
   * Handle request interception (no response yet)
   */
  private async handleRequestInterception(tabId: number, params: CDPRequestPaused): Promise<void> {
    const url = params.request.url;

    // Auto-continue filtered requests
    if (this.shouldAutoContinue(url, params.resourceType)) {
      await this.continueRequest(tabId, params.requestId);
      return;
    }

    // If intercept is disabled, continue immediately
    if (!this.interceptEnabled) {
      await this.continueRequest(tabId, params.requestId);
      return;
    }

    // Emit to callback (will be sent to server via WS)
    if (this.eventCallback) {
      this.eventCallback('request-paused', tabId, params);
    }

    // Note: request stays paused until continueRequest/failRequest/fulfillRequest is called
  }

  /**
   * Handle response interception (response available)
   */
  private async handleResponsePaused(tabId: number, params: CDPRequestPaused): Promise<void> {
    const url = params.request.url;

    // Auto-continue filtered responses
    if (this.shouldAutoContinue(url, params.resourceType)) {
      await this.continueResponse(tabId, params.requestId);
      return;
    }

    // If response intercept is disabled, continue
    if (!this.responseInterceptEnabled) {
      await this.continueResponse(tabId, params.requestId);
      return;
    }

    // Emit to callback
    if (this.eventCallback) {
      this.eventCallback('response-paused', tabId, params);
    }
  }

  /**
   * Continue a paused request (optionally with modifications)
   */
  async continueRequest(tabId: number, requestId: string, modifications?: RequestModifications): Promise<void> {
    const params: Record<string, unknown> = { requestId };

    if (modifications) {
      if (modifications.url) params.url = modifications.url;
      if (modifications.method) params.method = modifications.method;
      if (modifications.headers) params.headers = modifications.headers;
      if (modifications.postData) params.postData = modifications.postData;
    }

    await this.sendCommand(tabId, 'Fetch.continueRequest', params);
  }

  /**
   * Continue a paused response without modifications
   */
  async continueResponse(tabId: number, requestId: string): Promise<void> {
    await this.sendCommand(tabId, 'Fetch.continueResponse', { requestId });
  }

  /**
   * Fail a request (equivalent to blocking)
   */
  async failRequest(tabId: number, requestId: string, reason = 'BlockedByClient'): Promise<void> {
    await this.sendCommand(tabId, 'Fetch.failRequest', {
      requestId,
      errorReason: reason,
    });
  }

  /**
   * Get response body for a paused response
   */
  async getResponseBody(tabId: number, requestId: string): Promise<CDPResponseBody> {
    const result = await this.sendCommand(tabId, 'Fetch.getResponseBody', { requestId });
    return result as CDPResponseBody;
  }

  /**
   * Fulfill a request with custom response (for response modification)
   */
  async fulfillRequest(
    tabId: number,
    requestId: string,
    modifications: ResponseModifications
  ): Promise<void> {
    const params: Record<string, unknown> = { requestId };

    if (modifications.responseCode !== undefined) {
      params.responseCode = modifications.responseCode;
    }
    if (modifications.responseHeaders) {
      params.responseHeaders = modifications.responseHeaders;
    }
    if (modifications.body !== undefined) {
      // Body must be base64 encoded
      params.body = btoa(modifications.body);
    }
    if (modifications.responsePhrase) {
      params.responsePhrase = modifications.responsePhrase;
    }

    await this.sendCommand(tabId, 'Fetch.fulfillRequest', params);
  }

  // ============================================
  // State Management
  // ============================================

  /**
   * Set intercept mode (requests)
   */
  setInterceptEnabled(enabled: boolean): void {
    this.interceptEnabled = enabled;
  }

  /**
   * Set response intercept mode
   */
  async setResponseInterceptEnabled(enabled: boolean): Promise<void> {
    this.responseInterceptEnabled = enabled;

    // Re-enable Fetch on all attached tabs with updated patterns
    for (const [tabId, session] of this.sessions) {
      if (!session.attached) continue;

      try {
        // Disable and re-enable with new patterns
        await this.sendCommand(tabId, 'Fetch.disable', {});

        const patterns: Array<{ requestStage: string; urlPattern: string }> = [
          { requestStage: 'Request', urlPattern: '*' },
        ];

        if (enabled) {
          patterns.push({ requestStage: 'Response', urlPattern: '*' });
        }

        await this.sendCommand(tabId, 'Fetch.enable', {
          patterns,
          handleAuthRequests: false,
        });

        session.responseInterceptEnabled = enabled;
      } catch (error) {
        console.error(`[CDP] Failed to update response intercept for tab ${tabId}:`, error);
      }
    }
  }

  /**
   * Get all attached sessions
   */
  getSessions(): CDPSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get attached tab info
   */
  getAttachedTabs(): Array<{ tabId: number; url: string }> {
    return Array.from(this.sessions.values()).map((s) => ({
      tabId: s.tabId,
      url: s.url,
    }));
  }

  /**
   * Get total request count across all sessions
   */
  getTotalRequestCount(): number {
    let total = 0;
    for (const session of this.sessions.values()) {
      total += session.requestCount;
    }
    return total;
  }

  /**
   * Check if a tab is attached
   */
  isAttached(tabId: number): boolean {
    return this.sessions.has(tabId);
  }

  /**
   * Get intercept state
   */
  isInterceptEnabled(): boolean {
    return this.interceptEnabled;
  }

  isResponseInterceptEnabled(): boolean {
    return this.responseInterceptEnabled;
  }

  // ============================================
  // Smart Filters
  // ============================================

  /**
   * Update smart filters
   */
  setSmartFilters(filters: SmartFilterConfig[]): void {
    this.smartFilters = filters;
    this.compileFilters();
  }

  /**
   * Get smart filters
   */
  getSmartFilters(): SmartFilterConfig[] {
    return [...this.smartFilters];
  }

  /**
   * Compile filter patterns to RegExp objects
   */
  private compileFilters(): void {
    this.compiledFilters = this.smartFilters.map((f) => ({
      name: f.name,
      regex: new RegExp(f.pattern, 'i'),
      enabled: f.enabled,
    }));
  }

  /**
   * Check if a request should be auto-continued (not intercepted)
   */
  private shouldAutoContinue(url: string, resourceType: string): boolean {
    // Always continue chrome-extension:// and data: URLs
    if (url.startsWith('chrome-extension://') || url.startsWith('data:')) {
      return true;
    }

    // Check compiled filters
    for (const filter of this.compiledFilters) {
      if (!filter.enabled) continue;
      if (filter.regex.test(url)) {
        return true;
      }
    }

    return false;
  }

  // ============================================
  // Private Helpers
  // ============================================

  /**
   * Send a CDP command to a tab
   */
  private sendCommand(tabId: number, method: string, params: Record<string, unknown> = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      chrome.debugger.sendCommand({ tabId }, method, params, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Listen for debugger detach events (user dismissed debugger bar)
   */
  private setupDetachListener(): void {
    chrome.debugger.onDetach.addListener((source, reason) => {
      const tabId = source.tabId;
      if (tabId === undefined) return;

      console.log(`[CDP] Debugger detached from tab ${tabId}, reason: ${reason}`);
      this.sessions.delete(tabId);

      // Emit callback so WS client can notify server
      if (this.eventCallback) {
        // We use a synthetic event for tab detach
        // The background script handles this separately
      }
    });

    // Also listen for chrome.debugger.onEvent for Fetch events
    chrome.debugger.onEvent.addListener((source, method, params) => {
      if (method === 'Fetch.requestPaused' && source.tabId !== undefined) {
        this.handleRequestPaused(source.tabId, params as unknown as CDPRequestPaused);
      }
    });
  }
}
