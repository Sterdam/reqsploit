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
  'request:held': (data: { requestId: string }) => void;
  'request:forwarded': (data: { requestId: string }) => void;
  'request:dropped': (data: { requestId: string }) => void;
  'request:queue': (data: { queue: any[] }) => void;
  'queue:changed': (data: { count: number }) => void;
  'response:received': (data: ResponseReceivedPayload) => void;

  // Bulk Action Results
  'bulk:result': (data: { action: 'forward' | 'drop'; success: string[]; failed: string[] }) => void;

  // Smart Filters
  'smart-filters:config': (data: { filters: any[] }) => void;

  // AI Events
  'ai:analysis-started': (data: { requestId: string }) => void;
  'ai:analysis-complete': (data: AIAnalysisPayload) => void;
  'ai:analysis-error': (data: { requestId: string; message: string }) => void;
  'ai:suggestion': (data: { requestId: string; suggestions: any[] }) => void;

  // Token Usage
  'tokens:updated': (data: TokenUsagePayload) => void;
  'tokens:limit-reached': (data: { message: string }) => void;

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
