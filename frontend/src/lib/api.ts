import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

/**
 * API Client for ReqSploit Backend
 * Axios wrapper with authentication and error handling
 */

// API URL from environment variable
// Default to localhost:3000 for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Create AI-specific axios instance with longer timeout
const aiApi: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 120 seconds (2 minutes) for AI analysis
});

// Request interceptor - Add auth token (for both api and aiApi)
const authInterceptor = (config: any) => {
  // Read from Zustand persist storage
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    try {
      const { state } = JSON.parse(authStorage);
      if (state?.accessToken) {
        config.headers.Authorization = `Bearer ${state.accessToken}`;
      }
    } catch (e) {
      console.error('Failed to parse auth storage:', e);
    }
  }
  return config;
};

api.interceptors.request.use(authInterceptor, (error) => Promise.reject(error));
aiApi.interceptors.request.use(authInterceptor, (error) => Promise.reject(error));

// Response interceptor - Handle token refresh
const refreshTokenInterceptor = async (error: AxiosError) => {
  const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

  // If 401 and not already retrying, try to refresh token
  if (error.response?.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;

    try {
      // Read from Zustand persist storage
      const authStorage = localStorage.getItem('auth-storage');
      if (!authStorage) {
        throw new Error('No auth storage');
      }

      const { state } = JSON.parse(authStorage);
      if (!state?.refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await axios.post(`${API_URL}/api/auth/refresh`, {
        refreshToken: state.refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data.data;

      // Update Zustand storage
      const updatedState = {
        ...state,
        accessToken,
        refreshToken: newRefreshToken || state.refreshToken,
      };
      localStorage.setItem('auth-storage', JSON.stringify({ state: updatedState }));

      // Retry original request with new token
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      }
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh failed - clear auth storage and redirect to login
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
      return Promise.reject(refreshError);
    }
  }

  return Promise.reject(error);
};

api.interceptors.response.use((response) => response, refreshTokenInterceptor);
aiApi.interceptors.response.use((response) => response, refreshTokenInterceptor);

// ============================================
// Authentication API
// ============================================

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  name: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  isActive: boolean;
  createdAt: string;
}

export const authAPI = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  refresh: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data.data;
  },

  me: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data.data.user;
  },
};

// ============================================
// Proxy API
// ============================================

export interface ProxySession {
  sessionId: string;
  proxyPort: number;
  interceptMode: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ProxyStats {
  totalRequests: number;
  interceptedRequests: number;
  activeConnections: number;
  uptime: number;
}

export const proxyAPI = {
  startSession: async (interceptMode: boolean = false): Promise<ProxySession> => {
    const response = await api.post('/proxy/session/start', { interceptMode });
    return response.data.data.session;
  },

  stopSession: async (): Promise<void> => {
    await api.delete('/proxy/session/stop');
  },

  getStatus: async (): Promise<{
    hasActiveSession: boolean;
    session?: ProxySession;
    stats?: ProxyStats;
  }> => {
    const response = await api.get('/proxy/session/status');
    return response.data.data;
  },

  updateSettings: async (settings: {
    interceptMode?: boolean;
    filters?: {
      methods?: string[];
      domains?: string[];
      urlPatterns?: string[];
    };
  }): Promise<void> => {
    await api.patch('/proxy/session/settings', settings);
  },

  getActiveSessions: async (): Promise<number> => {
    const response = await api.get('/proxy/sessions/active');
    return response.data.data.activeSessionsCount;
  },
};

// ============================================
// Certificate API
// ============================================

export const certificateAPI = {
  download: async (): Promise<Blob> => {
    const response = await api.get('/certificates/root/download', {
      responseType: 'blob',
    });
    return response.data;
  },

  getStatus: async (): Promise<{ hasRootCA: boolean; message: string }> => {
    const response = await api.get('/certificates/root/status');
    return response.data.data;
  },

  regenerate: async (): Promise<void> => {
    await api.post('/certificates/root/regenerate');
  },
};

// ============================================
// AI Analysis API
// ============================================

export interface Vulnerability {
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  confidence?: number;
  title: string;
  description: string;
  location?: string;
  evidence?: string;
  exploitation?: string;
  remediation?: string;
  references?: string[];
  cwe?: string;
  cvss?: number;
  explanation?: {
    why: string;
    evidence: string[];
    verificationSteps: string[];
  };
}

export interface AISuggestion {
  id?: string;
  type: 'vulnerability' | 'exploit' | 'modification' | 'info';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  confidence?: number;
  actions: Array<{
    label: string;
    payload?: any;
    type: 'modify' | 'repeat' | 'copy' | 'send' | 'learn_more';
  }>;
}

export interface AIAnalysis {
  analysisId: string;
  requestId: string;
  analysisType: 'request' | 'response' | 'full';
  vulnerabilities: Vulnerability[];
  suggestions: AISuggestion[];
  aiResponse?: string;
  tokensUsed: number;
  confidence?: number;
  timestamp: string;
  requestUrl?: string;
  requestMethod?: string;
}

export interface TokenUsage {
  used: number;
  limit: number;
  remaining: number;
  resetDate: string;
}

export const aiAPI = {
  analyzeRequest: async (requestId: string, model?: string): Promise<AIAnalysis> => {
    const response = await aiApi.post(`/ai/analyze/request/${requestId}`, { model });
    return response.data.data;
  },

  analyzeResponse: async (requestId: string, model?: string): Promise<AIAnalysis> => {
    const response = await aiApi.post(`/ai/analyze/response/${requestId}`, { model });
    return response.data.data;
  },

  analyzeTransaction: async (requestId: string, model?: string): Promise<AIAnalysis> => {
    const response = await aiApi.post(`/ai/analyze/transaction/${requestId}`, { model });
    return response.data.data;
  },

  analyzeIntercepted: async (
    requestId: string,
    action: string,
    modifications?: {
      method?: string;
      url?: string;
      headers?: Record<string, string>;
      body?: string;
    }
  ): Promise<AIAnalysis> => {
    const response = await aiApi.post(`/ai/analyze/intercepted/${requestId}`, {
      action,
      modifications,
    });
    return response.data.data;
  },

  getAnalysis: async (analysisId: string): Promise<AIAnalysis> => {
    const response = await aiApi.get(`/ai/analysis/${analysisId}`);
    return response.data.data;
  },

  getHistory: async (limit: number = 100, requestId?: string): Promise<AIAnalysis[]> => {
    const params: any = { limit };
    if (requestId) params.requestId = requestId;
    const response = await aiApi.get('/ai/history', { params });
    return response.data.data;
  },

  getUsageHistory: async (days: number = 30): Promise<{
    history: Array<{ date: string; tokensUsed: number; actions: number; byType: Record<string, number> }>;
    totalTokens: number;
    totalActions: number;
    period: number;
  }> => {
    const response = await aiApi.get('/ai/usage-history', { params: { days } });
    return response.data.data;
  },

  compareAnalyses: async (baselineId: string, currentId: string): Promise<{
    baseline: AIAnalysis;
    current: AIAnalysis;
  }> => {
    const response = await aiApi.post('/ai/history/compare', { baselineId, currentId });
    return response.data.data;
  },

  getTokenUsage: async (): Promise<TokenUsage> => {
    const response = await aiApi.get('/ai/tokens');
    return response.data.data;
  },

  getPricing: async (): Promise<{
    plans: Array<{ plan: string; credits: number }>;
    actions: Array<{ action: string; haiku: number; sonnet: number }>;
  }> => {
    const response = await aiApi.get('/ai/pricing');
    return response.data;
  },

  generateExploits: async (vulnerability: Vulnerability): Promise<any[]> => {
    const response = await aiApi.post('/ai/exploits/generate', { vulnerability });
    return response.data.data.exploits;
  },

  quickScan: async (requestId: string): Promise<AIAnalysis> => {
    const response = await aiApi.post(`/ai/quick-scan/${requestId}`);
    return response.data.data;
  },

  deepScan: async (requestId: string): Promise<AIAnalysis> => {
    const response = await aiApi.post(`/ai/deep-scan/${requestId}`);
    return response.data.data;
  },

  batchAnalyze: async (requestIds: string[]): Promise<any> => {
    const response = await aiApi.post('/ai/batch-analyze', { requestIds });
    return response.data.data;
  },

  generatePayloads: async (target: any, options: any): Promise<any> => {
    const response = await aiApi.post('/ai/generate-payloads', { target, options });
    return response.data.data;
  },

  generateReport: async (projectId: string, options: any): Promise<any> => {
    const response = await aiApi.post(`/ai/generate-report/${projectId}`, options);
    return response.data.data;
  },

  generateDorks: async (config: any): Promise<any> => {
    const response = await aiApi.post('/ai/generate-dorks', config);
    return response.data.data;
  },

  suggestTests: async (request: { method: string; url: string; headers: Record<string, string>; body?: string }, model?: string): Promise<any> => {
    const response = await aiApi.post('/ai/suggest-tests', { request, model });
    return response.data.data;
  },
};

// ============================================
// Request History API (using RequestLog)
// ============================================

export interface HTTPRequest {
  id: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: string;
  statusCode?: number;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  duration?: number;
  isIntercepted: boolean;
}

// Note: This would need a dedicated endpoint in the backend
// For now, we'll receive requests via WebSocket
export const requestsAPI = {
  // Placeholder - requests will come from WebSocket
  getRecent: async (_limit: number = 100): Promise<HTTPRequest[]> => {
    // This endpoint doesn't exist yet in backend
    // Would need to create GET /api/requests endpoint
    // For now, return empty array - data comes from WebSocket
    return [];
  },
};

// ============================================
// Health Check
// ============================================

export const healthAPI = {
  check: async (): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
  }> => {
    const response = await axios.get(`${API_URL}/health`);
    return response.data.data;
  },
};

export default api;
