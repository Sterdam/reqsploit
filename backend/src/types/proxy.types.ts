/**
 * Proxy & Request Types
 */

export interface HTTPRequest {
  id: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: Date;
}

export interface HTTPResponse {
  statusCode: number;
  statusMessage: string;
  headers: Record<string, string>;
  body?: string;
  duration: number; // milliseconds
}

export interface InterceptedRequest extends HTTPRequest {
  isIntercepted: boolean;
  proxySessionId: string;
  userId: string;
}

export interface RequestLog {
  id: string;
  userId: string;
  proxySessionId: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  statusCode?: number;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  duration?: number;
  timestamp: Date;
  isIntercepted: boolean;
}

export interface ProxyConfig {
  host: string;
  port: number;
  userId: string;
  interceptMode: boolean;
  filters?: RequestFilters;
}

export interface RequestFilters {
  methods?: string[];
  domains?: string[];
  statusCodes?: number[];
  urlPatterns?: string[];
}

export interface ProxySession {
  id: string;
  sessionId: string;
  userId: string;
  proxyPort: number;
  isActive: boolean;
  interceptMode: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProxyStats {
  totalRequests: number;
  interceptedRequests: number;
  requestsPerSecond: number;
  averageResponseTime: number;
  errorRate: number;
}

export interface InterceptionResult {
  shouldIntercept: boolean;
  modifiedRequest?: HTTPRequest;
  action: 'forward' | 'block' | 'modify';
}

export interface RequestModification {
  requestId: string;
  modifications: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    body?: string;
  };
}

export interface Certificate {
  id: string;
  userId: string;
  certPem: string;
  keyPem: string;
  type: 'ROOT_CA' | 'DOMAIN';
  domain?: string;
  expiresAt: Date;
  createdAt: Date;
}
