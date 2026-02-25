import { io, Socket } from 'socket.io-client';
import type {
  ProxyStats,
  HTTPRequest,
  AISuggestion,
  TokenUsage,
} from './api';

/**
 * WebSocket Service for Real-Time Communication
 * Type-safe Socket.io client
 */

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

// ============================================
// Event Payload Types
// ============================================

export interface RequestInterceptedPayload {
  request: HTTPRequest;
  sessionId: string;
  timestamp: string;
}

export interface ResponseReceivedPayload {
  request: HTTPRequest;
  response: {
    statusCode: number;
    statusMessage: string;
    headers: Record<string, string>;
    duration: number;
  };
  sessionId: string;
  timestamp: string;
}

export interface AIAnalysisPayload {
  requestId: string;
  analysisId: string;
  suggestions: AISuggestion[];
  tokensUsed: number;
  analysisType: 'request' | 'response' | 'full';
  timestamp: string;
}

// ============================================
// Event Handlers Type
// ============================================

export interface PendingRequest extends HTTPRequest {
  userId: string;
  proxySessionId: string;
  isIntercepted: boolean;
  queuedAt: string;
}

export interface QueueChangedPayload {
  sessionId: string;
  action: 'hold' | 'forward' | 'drop';
  requestId: string;
  queueSize: number;
}

export interface RequestHeldPayload {
  sessionId: string;
  userId: string;
  request: PendingRequest;
}

// Response held payload (CDP response interception)
export interface ResponseHeldPayload {
  userId: string;
  response: {
    id: string;
    statusCode: number;
    headers: Record<string, string>;
    body?: string;
    originalRequestUrl: string;
    originalRequestMethod: string;
    tabId?: number;
    timestamp: string;
    queuedAt: string;
  };
}

// Extension connection payload
export interface ExtensionConnectedPayload {
  version: string;
  attachedTabs: Array<{ tabId: number; url: string }>;
}

export interface WebSocketEventHandlers {
  // Connection events
  onAuthenticated?: (data: { userId: string; sessionId: string }) => void;
  onAuthError?: (data: { message: string }) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;

  // Proxy events
  onProxyStarted?: (data: { sessionId: string; proxyPort: number }) => void;
  onProxyStopped?: () => void;
  onProxyError?: (data: { message: string }) => void;
  onProxyStats?: (data: ProxyStats) => void;

  // Request events
  onRequestIntercepted?: (data: RequestInterceptedPayload) => void;
  onResponseReceived?: (data: ResponseReceivedPayload) => void;

  // Request queue events
  onRequestHeld?: (data: RequestHeldPayload) => void;
  onRequestForwarded?: (data: { sessionId: string; userId: string; requestId: string; wasModified: boolean }) => void;
  onRequestDropped?: (data: { sessionId: string; userId: string; requestId: string }) => void;
  onQueueChanged?: (data: QueueChangedPayload) => void;
  onRequestQueue?: (data: { queue: PendingRequest[] }) => void;
  onBulkResult?: (data: { action: 'forward' | 'drop'; success: string[]; failed: string[] }) => void;
  onSmartFiltersConfig?: (data: { filters: any[] }) => void;

  // Response queue events (CDP response interception)
  onResponseHeld?: (data: ResponseHeldPayload) => void;
  onResponseForwarded?: (data: { userId: string; requestId: string }) => void;
  onResponseDropped?: (data: { userId: string; requestId: string }) => void;

  // Extension events
  onExtensionConnected?: (data: ExtensionConnectedPayload) => void;
  onExtensionDisconnected?: () => void;
  onTabAttached?: (data: { tabId: number; url: string }) => void;
  onTabDetached?: (data: { tabId: number; reason: string }) => void;

  // AI events
  onAIAnalysisStarted?: (data: { requestId: string }) => void;
  onAIAnalysisComplete?: (data: AIAnalysisPayload) => void;
  onAIAnalysisError?: (data: { requestId: string; message: string }) => void;

  // Token events
  onTokensUpdated?: (data: TokenUsage) => void;
  onTokensLimitReached?: (data: { message: string }) => void;

  // Magic Scan events
  onScanResult?: (data: any) => void;
  onScanStats?: (data: any) => void;
}

// ============================================
// WebSocket Service Class
// ============================================

export class WebSocketService {
  private socket: Socket | null = null;
  private handlers: WebSocketEventHandlers = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Connect to WebSocket server
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      console.log('[WS] Already connected');
      return;
    }

    console.log('[WS] Connecting to', WS_URL);

    this.socket = io(WS_URL, {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 10000,
    });

    this.setupEventListeners();
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      console.log('[WS] Disconnecting');
      this.socket.disconnect();
      this.socket = null;
      this.reconnectAttempts = 0;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Set event handlers
   */
  setHandlers(handlers: WebSocketEventHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * Setup Socket.io event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('[WS] Connected');
      this.reconnectAttempts = 0;
      this.handlers.onConnect?.();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WS] Disconnected:', reason);
      this.handlers.onDisconnect?.();
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WS] Connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[WS] Max reconnection attempts reached');
        this.disconnect();
      }
    });

    // Server events
    this.socket.on('authenticated', (data: { userId: string; sessionId: string }) => {
      console.log('[WS] Authenticated:', data);
      this.handlers.onAuthenticated?.(data);
    });

    this.socket.on('auth:error', (data: { message: string }) => {
      console.error('[WS] Auth error:', data);
      this.handlers.onAuthError?.(data);
    });

    // Proxy events
    this.socket.on('proxy:started', (data: { sessionId: string; proxyPort: number }) => {
      console.log('[WS] Proxy started:', data);
      this.handlers.onProxyStarted?.(data);
    });

    this.socket.on('proxy:stopped', () => {
      console.log('[WS] Proxy stopped');
      this.handlers.onProxyStopped?.();
    });

    this.socket.on('proxy:error', (data: { message: string }) => {
      console.error('[WS] Proxy error:', data);
      this.handlers.onProxyError?.(data);
    });

    this.socket.on('proxy:stats', (data: ProxyStats) => {
      this.handlers.onProxyStats?.(data);
    });

    // Request events
    this.socket.on('request:intercepted', (data: RequestInterceptedPayload) => {
      console.log('[WS] Request intercepted:', data.request.url);
      this.handlers.onRequestIntercepted?.(data);
    });

    this.socket.on('response:received', (data: ResponseReceivedPayload) => {
      console.log('[WS] Response received:', data.request.url);
      this.handlers.onResponseReceived?.(data);
    });

    // Request queue events
    this.socket.on('request:held', (data: RequestHeldPayload) => {
      console.log('[WS] Request held in queue:', data.request.url);
      this.handlers.onRequestHeld?.(data);
    });

    this.socket.on('request:forwarded', (data: { sessionId: string; userId: string; requestId: string; wasModified: boolean }) => {
      console.log('[WS] Request forwarded:', data.requestId, 'wasModified:', data.wasModified);
      this.handlers.onRequestForwarded?.(data);
    });

    this.socket.on('request:dropped', (data: { sessionId: string; userId: string; requestId: string }) => {
      console.log('[WS] Request dropped:', data.requestId);
      this.handlers.onRequestDropped?.(data);
    });

    this.socket.on('queue:changed', (data: QueueChangedPayload) => {
      console.log('[WS] Queue changed:', data.action, 'queueSize:', data.queueSize);
      this.handlers.onQueueChanged?.(data);
    });

    this.socket.on('request:queue', (data: { queue: PendingRequest[] }) => {
      console.log('[WS] Request queue received:', data.queue.length, 'requests');
      this.handlers.onRequestQueue?.(data);
    });

    this.socket.on('bulk:result', (data: { action: 'forward' | 'drop'; success: string[]; failed: string[] }) => {
      console.log('[WS] Bulk result:', data.action, data.success.length, 'success', data.failed.length, 'failed');
      this.handlers.onBulkResult?.(data);
    });

    this.socket.on('smart-filters:config', (data: { filters: any[] }) => {
      console.log('[WS] Smart filters config received:', data.filters.length, 'filters');
      this.handlers.onSmartFiltersConfig?.(data);
    });

    // Response queue events (CDP response interception)
    this.socket.on('response:held', (data: ResponseHeldPayload) => {
      console.log('[WS] Response held:', data.response.originalRequestUrl);
      this.handlers.onResponseHeld?.(data);
    });

    this.socket.on('response:forwarded', (data: { userId: string; requestId: string }) => {
      console.log('[WS] Response forwarded:', data.requestId);
      this.handlers.onResponseForwarded?.(data);
    });

    this.socket.on('response:dropped', (data: { userId: string; requestId: string }) => {
      console.log('[WS] Response dropped:', data.requestId);
      this.handlers.onResponseDropped?.(data);
    });

    // Extension events
    this.socket.on('ext:connected', (data: ExtensionConnectedPayload) => {
      console.log('[WS] Extension connected:', data.version);
      this.handlers.onExtensionConnected?.(data);
    });

    this.socket.on('ext:disconnected', () => {
      console.log('[WS] Extension disconnected');
      this.handlers.onExtensionDisconnected?.();
    });

    this.socket.on('ext:tab-attached', (data: { tabId: number; url: string }) => {
      console.log('[WS] Tab attached:', data.tabId, data.url);
      this.handlers.onTabAttached?.(data);
    });

    this.socket.on('ext:tab-detached', (data: { tabId: number; reason: string }) => {
      console.log('[WS] Tab detached:', data.tabId);
      this.handlers.onTabDetached?.(data);
    });

    // AI events
    this.socket.on('ai:analysis-started', (data: { requestId: string }) => {
      console.log('[WS] AI analysis started:', data);
      this.handlers.onAIAnalysisStarted?.(data);
    });

    this.socket.on('ai:analysis-complete', (data: AIAnalysisPayload) => {
      console.log('[WS] AI analysis complete:', data);
      this.handlers.onAIAnalysisComplete?.(data);
    });

    this.socket.on('ai:analysis-error', (data: { requestId: string; message: string }) => {
      console.error('[WS] AI analysis error:', data);
      this.handlers.onAIAnalysisError?.(data);
    });

    // Token events
    this.socket.on('tokens:updated', (data: TokenUsage) => {
      this.handlers.onTokensUpdated?.(data);
    });

    this.socket.on('tokens:limit-reached', (data: { message: string }) => {
      console.warn('[WS] Token limit reached:', data);
      this.handlers.onTokensLimitReached?.(data);
    });

    // Magic Scan events
    this.socket.on('scan:result', (data: any) => {
      console.log('[WS] Scan result received:', data);
      this.handlers.onScanResult?.(data);
    });

    this.socket.on('scan:stats', (data: any) => {
      console.log('[WS] Scan stats received:', data);
      this.handlers.onScanStats?.(data);
    });
  }

  // ============================================
  // Client → Server Events
  // ============================================

  /**
   * Start proxy session
   */
  startProxy(interceptMode: boolean = false): void {
    this.socket?.emit('proxy:start', { interceptMode });
  }

  /**
   * Stop proxy session
   */
  stopProxy(): void {
    this.socket?.emit('proxy:stop');
  }

  /**
   * Toggle intercept mode
   */
  toggleIntercept(enabled: boolean): void {
    this.socket?.emit('proxy:toggle-intercept', { enabled });
  }

  /**
   * Forward a request
   */
  forwardRequest(requestId: string): void {
    this.socket?.emit('request:forward', { requestId });
  }

  /**
   * Drop a request
   */
  dropRequest(requestId: string): void {
    this.socket?.emit('request:drop', { requestId });
  }

  /**
   * Modify and forward a request
   */
  modifyRequest(requestId: string, modifications: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    body?: string;
  }): void {
    this.socket?.emit('request:modify', { requestId, modifications });
  }

  /**
   * Get current request queue
   */
  getRequestQueue(): void {
    this.socket?.emit('request:get-queue');
  }

  /**
   * Request AI analysis
   */
  analyzeRequest(requestId: string): void {
    this.socket?.emit('ai:analyze-request', { requestId });
  }

  /**
   * Apply AI suggestion
   */
  applySuggestion(requestId: string, suggestionId: string): void {
    this.socket?.emit('ai:apply-suggestion', { requestId, suggestionId });
  }

  /**
   * Bulk forward multiple requests
   */
  bulkForward(requestIds: string[]): void {
    this.socket?.emit('request:bulk-forward', { requestIds });
  }

  /**
   * Bulk drop multiple requests
   */
  bulkDrop(requestIds: string[]): void {
    this.socket?.emit('request:bulk-drop', { requestIds });
  }

  /**
   * Forward requests matching URL pattern
   */
  forwardByPattern(urlPattern: string): void {
    this.socket?.emit('request:forward-by-pattern', { urlPattern });
  }

  /**
   * Drop requests matching URL pattern
   */
  dropByPattern(urlPattern: string): void {
    this.socket?.emit('request:drop-by-pattern', { urlPattern });
  }

  /**
   * Get smart filters configuration
   */
  getSmartFilters(): void {
    this.socket?.emit('smart-filters:get');
  }

  /**
   * Update smart filters configuration
   */
  updateSmartFilters(filters: any[]): void {
    this.socket?.emit('smart-filters:update', { filters });
  }

  // ============================================
  // Response Interception (CDP)
  // ============================================

  /**
   * Forward a response (with optional modifications)
   */
  forwardResponse(requestId: string, modifications?: {
    statusCode?: number;
    headers?: Record<string, string>;
    body?: string;
  }): void {
    this.socket?.emit('response:forward', { requestId, modifications });
  }

  /**
   * Drop a response
   */
  dropResponse(requestId: string): void {
    this.socket?.emit('response:drop', { requestId });
  }
}

// Export singleton instance
export const wsService = new WebSocketService();
export default wsService;
