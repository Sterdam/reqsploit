import { HTTPRequest, HTTPResponse } from './proxy.types.js';
import { AISuggestion } from './ai.types.js';

/**
 * WebSocket Event Types
 * Type-safe event definitions for Socket.io communication
 */

// ============================================
// Client → Server Events
// ============================================

export interface ClientToServerEvents {
  // Authentication
  authenticate: (data: { token: string }) => void;

  // Proxy Control
  'proxy:start': (data: { interceptMode?: boolean }) => void;
  'proxy:stop': () => void;
  'proxy:toggle-intercept': (data: { enabled: boolean }) => void;

  // Request Management
  'request:forward': (data: { requestId: string; modifications?: any }) => void;
  'request:drop': (data: { requestId: string }) => void;
  'request:modify': (data: { requestId: string; modified: Partial<HTTPRequest>; modifications?: any }) => void;
  'request:get-queue': () => void;

  // Bulk Request Management
  'request:bulk-forward': (data: { requestIds: string[] }) => void;
  'request:bulk-drop': (data: { requestIds: string[] }) => void;
  'request:forward-by-pattern': (data: { urlPattern: string }) => void;
  'request:drop-by-pattern': (data: { urlPattern: string }) => void;

  // Smart Filters
  'smart-filters:get': () => void;
  'smart-filters:update': (data: { filters: any[] }) => void;

  // AI Analysis
  'ai:analyze-request': (data: { requestId: string }) => void;
  'ai:apply-suggestion': (data: { requestId: string; suggestionId: string }) => void;

  // Tab Management (Dashboard → Backend → Extension)
  'tabs:list': () => void;
  'tabs:attach': (data: { tabId: number }) => void;
  'tabs:detach': (data: { tabId: number }) => void;
  'tabs:attach-all': () => void;

  // Response Interception (Dashboard → Backend → Extension)
  'response:forward': (data: { requestId: string; modifications?: { statusCode?: number; headers?: Record<string, string>; body?: string } }) => void;
  'response:drop': (data: { requestId: string }) => void;

  // Magic Scan
  'scan:get-results': (data?: { severity?: string; category?: string; limit?: number }) => void;
  'scan:get-stats': () => void;
}

// ============================================
// Server → Client Events
// ============================================

export interface ServerToClientEvents {
  // Connection Status
  authenticated: (data: { userId: string; sessionId: string }) => void;
  'auth:error': (data: { message: string }) => void;

  // Proxy Status
  'proxy:started': (data: { sessionId: string; proxyPort: number }) => void;
  'proxy:stopped': () => void;
  'proxy:error': (data: { message: string }) => void;
  'proxy:stats': (data: ProxyStatsPayload) => void;

  // Request Events
  'request:intercepted': (data: RequestInterceptedPayload) => void;
  'request:held': (data: RequestHeldPayload) => void;
  'request:forwarded': (data: { sessionId: string; userId: string; requestId: string; wasModified: boolean }) => void;
  'request:dropped': (data: { sessionId: string; userId: string; requestId: string }) => void;
  'request:queue': (data: { queue: any[] }) => void;
  'queue:changed': (data: QueueChangedPayload) => void;
  'response:received': (data: ResponseReceivedPayload) => void;

  // Bulk Action Results
  'bulk:result': (data: { action: 'forward' | 'drop'; success: string[]; failed: string[] }) => void;

  // Smart Filters
  'smart-filters:config': (data: { filters: any[] }) => void;

  // Extension Events (Backend → Dashboard)
  'ext:connected': (data: { version: string; attachedTabs: Array<{ tabId: number; url: string }> }) => void;
  'ext:disconnected': () => void;
  'ext:tab-attached': (data: { tabId: number; url: string }) => void;
  'ext:tab-detached': (data: { tabId: number; reason: string }) => void;
  'tabs:list': (data: { tabs: BrowserTabPayload[] }) => void;

  // Response Interception Events (Backend → Dashboard)
  'response:held': (data: ResponseHeldPayload) => void;
  'response:forwarded': (data: { userId: string; requestId: string }) => void;
  'response:dropped': (data: { userId: string; requestId: string }) => void;

  // Repeater/Intruder Events
  'repeater:result': (data: any) => void;
  'intruder:result': (data: any) => void;

  // AI Events
  'ai:analysis-started': (data: { requestId: string }) => void;
  'ai:analysis-complete': (data: AIAnalysisPayload) => void;
  'ai:analysis-error': (data: { requestId: string; message: string }) => void;
  'ai:suggestion': (data: { requestId: string; suggestions: any[] }) => void;

  // Token Usage
  'tokens:updated': (data: TokenUsagePayload) => void;
  'tokens:limit-reached': (data: { message: string }) => void;

  // Magic Scan
  'scan:result': (data: ScanResultPayload) => void;
  'scan:stats': (data: ScanStatsPayload) => void;

  // Generic Error
  error: (data: { message: string }) => void;
}

// ============================================
// Payload Types
// ============================================

export interface ProxyStatsPayload {
  totalRequests: number;
  interceptedRequests: number;
  activeConnections: number;
  uptime: number;
}

export interface RequestInterceptedPayload {
  request: HTTPRequest;
  sessionId: string;
  timestamp: Date;
}

export interface ResponseReceivedPayload {
  request: HTTPRequest;
  response: HTTPResponse;
  sessionId: string;
  timestamp: Date;
}

export interface AIAnalysisPayload {
  requestId: string;
  analysisId: string;
  suggestions: AISuggestion[];
  tokensUsed: number;
  analysisType: 'request' | 'response' | 'full';
  timestamp: Date;
}

export interface TokenUsagePayload {
  used: number;
  limit: number;
  remaining: number;
  resetDate: Date;
}

export interface ScanResultPayload {
  id: string;
  requestId: string;
  severity: string;
  category: string;
  type: string;
  description: string;
  value: string; // Masked value
  location: {
    source: 'request' | 'response';
    part: 'url' | 'headers' | 'body' | 'cookies';
    path?: string;
  };
  context: string;
  confidence: number;
  timestamp: Date;
}

export interface ScanStatsPayload {
  total: number;
  bySeverity: Record<string, number>;
  byCategory: Record<string, number>;
  criticalCount: number;
  highCount: number;
}

export interface RequestHeldPayload {
  sessionId: string;
  userId: string;
  request: {
    id: string;
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string | null;
    timestamp: Date | string;
    queuedAt: string;
    isIntercepted: boolean;
    tabId?: number;
    resourceType?: string;
  };
}

export interface QueueChangedPayload {
  sessionId: string;
  action: 'hold' | 'forward' | 'drop';
  requestId: string;
  queueSize: number;
}

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
    timestamp: Date | string;
    queuedAt: string;
  };
}

export interface BrowserTabPayload {
  tabId: number;
  url: string;
  title: string;
  active: boolean;
  attached: boolean;
}

// ============================================
// Socket Data
// ============================================

export interface SocketData {
  userId: string;
  sessionId?: string;
  authenticated: boolean;
}

// ============================================
// WebSocket Room Names
// ============================================

export const WS_ROOMS = {
  user: (userId: string) => `user:${userId}`,
  proxySession: (sessionId: string) => `session:${sessionId}`,
} as const;
