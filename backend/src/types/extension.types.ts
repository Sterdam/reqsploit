/**
 * Extension ↔ Server WebSocket Event Types
 * Defines all events for communication between the Chrome extension and backend server.
 */

// ============================================
// Extension → Server Events
// ============================================

export interface ExtensionToServerEvents {
  'ext:connected': (data: ExtConnectedPayload) => void;
  'ext:request-paused': (data: ExtRequestPausedPayload) => void;
  'ext:response-paused': (data: ExtResponsePausedPayload) => void;
  'ext:request-continued': (data: { requestId: string }) => void;
  'ext:response-continued': (data: { requestId: string }) => void;
  'ext:tab-attached': (data: { tabId: number; url: string }) => void;
  'ext:tab-detached': (data: { tabId: number; reason: string }) => void;
  'ext:tabs-list': (data: { tabs: BrowserTab[] }) => void;
  'ext:repeater-result': (data: ExtRepeaterResultPayload) => void;
  'ext:intruder-result': (data: ExtIntruderResultPayload) => void;
  'ext:status': (data: ExtStatusPayload) => void;
  'ext:ping': () => void;
}

// ============================================
// Server → Extension Events
// ============================================

export interface ServerToExtensionEvents {
  'ext:forward-request': (data: ExtForwardRequestPayload) => void;
  'ext:drop-request': (data: { requestId: string }) => void;
  'ext:forward-response': (data: ExtForwardResponsePayload) => void;
  'ext:drop-response': (data: { requestId: string }) => void;
  'ext:toggle-intercept': (data: ExtToggleInterceptPayload) => void;
  'ext:start-intercept': (data: ExtStartInterceptPayload) => void;
  'ext:stop-intercept': (data: Record<string, never>) => void;
  'ext:update-filters': (data: ExtUpdateFiltersPayload) => void;
  'ext:repeater-send': (data: ExtRepeaterSendPayload) => void;
  'ext:intruder-start': (data: ExtIntruderStartPayload) => void;
  'ext:intruder-stop': (data: { campaignId: string }) => void;
  'ext:list-tabs': (data: Record<string, never>) => void;
  'ext:attach-tab': (data: { tabId: number }) => void;
  'ext:detach-tab': (data: { tabId: number }) => void;
  'ext:attach-all-tabs': (data: Record<string, never>) => void;
}

// ============================================
// Payload Types
// ============================================

export interface ExtConnectedPayload {
  extensionVersion: string;
  attachedTabs: Array<{ tabId: number; url: string }>;
}

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

export interface ExtForwardRequestPayload {
  requestId: string;
  modifications?: {
    method?: string;
    url?: string;
    headers?: Array<{ name: string; value: string }>;
    postData?: string;
  };
}

export interface ExtForwardResponsePayload {
  requestId: string;
  modifications?: {
    responseCode?: number;
    responseHeaders?: Array<{ name: string; value: string }>;
    body?: string;
    responsePhrase?: string;
  };
}

export interface ExtToggleInterceptPayload {
  enabled: boolean;
  responseIntercept?: boolean;
}

export interface ExtUpdateFiltersPayload {
  filters: Array<{
    name: string;
    pattern: string;
    enabled: boolean;
    description: string;
  }>;
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

// ============================================
// Extension Connection Info
// ============================================

export interface ExtensionConnectionInfo {
  socketId: string;
  userId: string;
  version: string;
  attachedTabs: Array<{ tabId: number; url: string }>;
  interceptEnabled: boolean;
  connectedAt: Date;
}
