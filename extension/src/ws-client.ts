/**
 * ReqSploit WS Client
 * Socket.io client connecting extension to the backend server.
 * Handles bidirectional communication for request/response interception.
 */

import { io, Socket } from 'socket.io-client';
import type {
  ExtRequestPausedPayload,
  ExtResponsePausedPayload,
  ExtRepeaterResultPayload,
  ExtIntruderResultPayload,
  ExtStatusPayload,
  ExtForwardRequestPayload,
  ExtForwardResponsePayload,
  ExtToggleInterceptPayload,
  ExtUpdateFiltersPayload,
  ExtRepeaterSendPayload,
  ExtIntruderStartPayload,
  ExtIntruderStopPayload,
} from './types';

export interface ExtStartInterceptPayload {
  attachAll?: boolean;
  tabIds?: number[];
}

export interface BrowserTab {
  tabId: number;
  url: string;
  title: string;
  active: boolean;
  attached: boolean;
}

export type WSClientEventHandlers = {
  onForwardRequest: (data: ExtForwardRequestPayload) => void;
  onDropRequest: (data: { requestId: string }) => void;
  onForwardResponse: (data: ExtForwardResponsePayload) => void;
  onDropResponse: (data: { requestId: string }) => void;
  onToggleIntercept: (data: ExtToggleInterceptPayload) => void;
  onStartIntercept: (data: ExtStartInterceptPayload) => void;
  onStopIntercept: () => void;
  onUpdateFilters: (data: ExtUpdateFiltersPayload) => void;
  onRepeaterSend: (data: ExtRepeaterSendPayload) => void;
  onIntruderStart: (data: ExtIntruderStartPayload) => void;
  onIntruderStop: (data: ExtIntruderStopPayload) => void;
  onListTabs: () => void;
  onAttachTab: (data: { tabId: number }) => void;
  onDetachTab: (data: { tabId: number }) => void;
  onAttachAllTabs: () => void;
};

export class WSClient {
  private socket: Socket | null = null;
  private handlers: WSClientEventHandlers | null = null;
  private serverUrl = '';
  private token = '';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private keepaliveInterval: ReturnType<typeof setInterval> | null = null;
  private _connected = false;

  /**
   * Set event handlers
   */
  onEvents(handlers: WSClientEventHandlers): void {
    this.handlers = handlers;
  }

  /**
   * Connect to the server
   */
  connect(serverUrl: string, token: string): void {
    if (this.socket?.connected) {
      console.log('[WS] Already connected');
      return;
    }

    this.serverUrl = serverUrl;
    this.token = token;
    this.reconnectAttempts = 0;

    console.log('[WS] Connecting to', serverUrl);

    this.socket = io(serverUrl, {
      auth: { token },
      query: { client: 'extension', version: chrome.runtime.getManifest().version },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 10000,
      transports: ['websocket', 'polling'],
    });

    this.setupListeners();
    this.startKeepalive();
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    this.stopKeepalive();

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this._connected = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this._connected && (this.socket?.connected ?? false);
  }

  // ============================================
  // Extension → Server Events
  // ============================================

  /**
   * Notify server that extension connected
   */
  emitConnected(attachedTabs: Array<{ tabId: number; url: string }>): void {
    this.socket?.emit('ext:connected', {
      extensionVersion: chrome.runtime.getManifest().version,
      attachedTabs,
    });
  }

  /**
   * Send paused request to server
   */
  emitRequestPaused(data: ExtRequestPausedPayload): void {
    this.socket?.emit('ext:request-paused', data);
  }

  /**
   * Send paused response to server
   */
  emitResponsePaused(data: ExtResponsePausedPayload): void {
    this.socket?.emit('ext:response-paused', data);
  }

  /**
   * Notify server that request was continued
   */
  emitRequestContinued(requestId: string): void {
    this.socket?.emit('ext:request-continued', { requestId });
  }

  /**
   * Notify server that response was continued
   */
  emitResponseContinued(requestId: string): void {
    this.socket?.emit('ext:response-continued', { requestId });
  }

  /**
   * Notify server of tab attach
   */
  emitTabAttached(tabId: number, url: string): void {
    this.socket?.emit('ext:tab-attached', { tabId, url });
  }

  /**
   * Notify server of tab detach
   */
  emitTabDetached(tabId: number, reason: string): void {
    this.socket?.emit('ext:tab-detached', { tabId, reason });
  }

  /**
   * Send repeater result to server
   */
  emitRepeaterResult(data: ExtRepeaterResultPayload): void {
    this.socket?.emit('ext:repeater-result', data);
  }

  /**
   * Send intruder result to server
   */
  emitIntruderResult(data: ExtIntruderResultPayload): void {
    this.socket?.emit('ext:intruder-result', data);
  }

  /**
   * Send status update to server
   */
  emitStatus(data: ExtStatusPayload): void {
    this.socket?.emit('ext:status', data);
  }

  /**
   * Send browser tabs list to server
   */
  emitTabsList(tabs: BrowserTab[]): void {
    this.socket?.emit('ext:tabs-list', { tabs });
  }

  // ============================================
  // Private
  // ============================================

  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[WS] Connected to server');
      this._connected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WS] Disconnected:', reason);
      this._connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WS] Connection error:', error.message);
      this.reconnectAttempts++;
      this._connected = false;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[WS] Max reconnection attempts reached');
      }
    });

    this.socket.on('authenticated', (data: { userId: string; sessionId: string }) => {
      console.log('[WS] Authenticated:', data.userId);
    });

    // Server → Extension events
    this.socket.on('ext:forward-request', (data: ExtForwardRequestPayload) => {
      console.log('[WS] Forward request:', data.requestId);
      this.handlers?.onForwardRequest(data);
    });

    this.socket.on('ext:drop-request', (data: { requestId: string }) => {
      console.log('[WS] Drop request:', data.requestId);
      this.handlers?.onDropRequest(data);
    });

    this.socket.on('ext:forward-response', (data: ExtForwardResponsePayload) => {
      console.log('[WS] Forward response:', data.requestId);
      this.handlers?.onForwardResponse(data);
    });

    this.socket.on('ext:drop-response', (data: { requestId: string }) => {
      console.log('[WS] Drop response:', data.requestId);
      this.handlers?.onDropResponse(data);
    });

    this.socket.on('ext:toggle-intercept', (data: ExtToggleInterceptPayload) => {
      console.log('[WS] Toggle intercept:', data);
      this.handlers?.onToggleIntercept(data);
    });

    this.socket.on('ext:update-filters', (data: ExtUpdateFiltersPayload) => {
      console.log('[WS] Update filters:', data.filters.length, 'filters');
      this.handlers?.onUpdateFilters(data);
    });

    this.socket.on('ext:repeater-send', (data: ExtRepeaterSendPayload) => {
      console.log('[WS] Repeater send:', data.url);
      this.handlers?.onRepeaterSend(data);
    });

    this.socket.on('ext:intruder-start', (data: ExtIntruderStartPayload) => {
      console.log('[WS] Intruder start:', data.campaignId, data.requests.length, 'requests');
      this.handlers?.onIntruderStart(data);
    });

    this.socket.on('ext:intruder-stop', (data: ExtIntruderStopPayload) => {
      console.log('[WS] Intruder stop:', data.campaignId);
      this.handlers?.onIntruderStop(data);
    });

    // Dashboard → Extension: start/stop intercept
    this.socket.on('ext:start-intercept', (data: ExtStartInterceptPayload) => {
      console.log('[WS] Start intercept from dashboard:', data);
      this.handlers?.onStartIntercept(data);
    });

    this.socket.on('ext:stop-intercept', () => {
      console.log('[WS] Stop intercept from dashboard');
      this.handlers?.onStopIntercept();
    });

    // Dashboard → Extension: tab management
    this.socket.on('ext:list-tabs', () => {
      console.log('[WS] List tabs requested');
      this.handlers?.onListTabs();
    });

    this.socket.on('ext:attach-tab', (data: { tabId: number }) => {
      console.log('[WS] Attach tab requested:', data.tabId);
      this.handlers?.onAttachTab(data);
    });

    this.socket.on('ext:detach-tab', (data: { tabId: number }) => {
      console.log('[WS] Detach tab requested:', data.tabId);
      this.handlers?.onDetachTab(data);
    });

    this.socket.on('ext:attach-all-tabs', () => {
      console.log('[WS] Attach all tabs requested');
      this.handlers?.onAttachAllTabs();
    });
  }

  /**
   * Keepalive ping every 25s to prevent service worker from sleeping
   */
  private startKeepalive(): void {
    this.stopKeepalive();
    this.keepaliveInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ext:ping');
      }
    }, 25000);
  }

  private stopKeepalive(): void {
    if (this.keepaliveInterval) {
      clearInterval(this.keepaliveInterval);
      this.keepaliveInterval = null;
    }
  }
}
