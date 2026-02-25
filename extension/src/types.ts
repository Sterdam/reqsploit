/**
 * ReqSploit Extension - Shared Type Definitions
 * Types for CDP interception, WebSocket communication, and request execution
 */

// ============================================
// CDP Engine Types
// ============================================

export interface CDPSession {
  tabId: number;
  url: string;
  attached: boolean;
  interceptEnabled: boolean;
  responseInterceptEnabled: boolean;
  requestCount: number;
  attachedAt: number;
}

export interface CDPRequestPaused {
  requestId: string;
  request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    postData?: string;
  };
  frameId: string;
  resourceType: string;
  responseStatusCode?: number;
  responseHeaders?: Array<{ name: string; value: string }>;
  networkId?: string;
}

export interface CDPResponseBody {
  body: string;
  base64Encoded: boolean;
}

export interface RequestModifications {
  method?: string;
  url?: string;
  headers?: Array<{ name: string; value: string }>;
  postData?: string;
}

export interface ResponseModifications {
  responseCode?: number;
  responseHeaders?: Array<{ name: string; value: string }>;
  body?: string;
  responsePhrase?: string;
}

// ============================================
// Extension ↔ Server Event Payloads
// ============================================

/** Extension → Server */
export interface ExtRequestPausedPayload {
  requestId: string;
  tabId: number;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  resourceType: string;
  timestamp: number;
}

export interface ExtResponsePausedPayload {
  requestId: string;
  tabId: number;
  statusCode: number;
  headers: Record<string, string>;
  body?: string;
  originalRequestUrl: string;
  originalRequestMethod: string;
  timestamp: number;
}

export interface ExtRepeaterResultPayload {
  requestId: string;
  statusCode: number;
  statusMessage: string;
  headers: Record<string, string>;
  body: string;
  responseTime: number;
}

export interface ExtIntruderResultPayload {
  campaignId: string;
  index: number;
  payloads: string[];
  statusCode: number;
  responseLength: number;
  responseTime: number;
  body: string;
  headers: Record<string, string>;
  error?: string;
}

export interface ExtStatusPayload {
  interceptEnabled: boolean;
  responseInterceptEnabled: boolean;
  attachedTabs: Array<{ tabId: number; url: string }>;
  requestCount: number;
}

/** Server → Extension */
export interface ExtForwardRequestPayload {
  requestId: string;
  modifications?: RequestModifications;
}

export interface ExtForwardResponsePayload {
  requestId: string;
  modifications?: ResponseModifications;
}

export interface ExtToggleInterceptPayload {
  enabled: boolean;
  responseIntercept?: boolean;
}

export interface ExtUpdateFiltersPayload {
  filters: SmartFilterConfig[];
}

export interface ExtRepeaterSendPayload {
  requestId: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

export interface ExtIntruderStartPayload {
  campaignId: string;
  requests: Array<{
    index: number;
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
    payloads: string[];
  }>;
  concurrency: number;
  delayMs: number;
}

export interface ExtIntruderStopPayload {
  campaignId: string;
}

// ============================================
// Smart Filter Types
// ============================================

export interface SmartFilterConfig {
  name: string;
  pattern: string; // Serialized regex
  enabled: boolean;
  description: string;
}

// ============================================
// Internal Message Types (popup ↔ background)
// ============================================

export type PopupMessage =
  | { action: 'getStatus' }
  | { action: 'startIntercept' }
  | { action: 'stopIntercept' }
  | { action: 'toggleResponseIntercept'; enabled: boolean }
  | { action: 'openDashboard' }
  | { action: 'attachTab'; tabId: number }
  | { action: 'detachTab'; tabId: number };

export interface PopupStatusResponse {
  isConnected: boolean;
  interceptEnabled: boolean;
  responseInterceptEnabled: boolean;
  attachedTabs: Array<{ tabId: number; url: string }>;
  requestCount: number;
  extensionVersion: string;
  serverUrl: string;
}

// ============================================
// Request Execution Types
// ============================================

export interface ExecuteRequestOptions {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  timeout?: number;
  followRedirects?: boolean;
}

export interface ExecuteRequestResult {
  statusCode: number;
  statusMessage: string;
  headers: Record<string, string>;
  body: string;
  responseTime: number;
}

export interface BatchExecuteOptions {
  requests: Array<ExecuteRequestOptions & { index: number; payloads: string[] }>;
  concurrency: number;
  delayMs: number;
  onResult: (result: ExtIntruderResultPayload) => void;
  onError: (index: number, error: string) => void;
  signal?: AbortSignal;
}
