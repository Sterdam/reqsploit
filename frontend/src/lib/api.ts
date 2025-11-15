import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

/**
 * API Client for ReqSploit Backend
 * Axios wrapper with authentication and error handling
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
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
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
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
  }
);

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
  title: string;
  description: string;
  location?: string;
  evidence?: string;
  exploitation?: string;
  remediation?: string;
  references?: string[];
}

export interface AISuggestion {
  type: 'vulnerability' | 'exploit' | 'modification' | 'info';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  actions: Array<{
    label: string;
    payload?: string;
    type: 'modify' | 'send' | 'copy';
  }>;
}

export interface AIAnalysis {
  analysisId: string;
  requestId: string;
  analysisType: 'request' | 'response' | 'full';
  vulnerabilities: Vulnerability[];
  suggestions: AISuggestion[];
  tokensUsed: number;
  timestamp: string;
}

export interface TokenUsage {
  used: number;
  limit: number;
  remaining: number;
  resetDate: string;
}

export const aiAPI = {
  analyzeRequest: async (requestId: string): Promise<AIAnalysis> => {
    const response = await api.post(`/ai/analyze/request/${requestId}`);
    return response.data.data;
  },

  analyzeResponse: async (requestId: string): Promise<AIAnalysis> => {
    const response = await api.post(`/ai/analyze/response/${requestId}`);
    return response.data.data;
  },

  analyzeTransaction: async (requestId: string): Promise<AIAnalysis> => {
    const response = await api.post(`/ai/analyze/transaction/${requestId}`);
    return response.data.data;
  },

  getAnalysis: async (analysisId: string): Promise<AIAnalysis> => {
    const response = await api.get(`/ai/analysis/${analysisId}`);
    return response.data.data;
  },

  getHistory: async (limit: number = 50): Promise<AIAnalysis[]> => {
    const response = await api.get('/ai/history', { params: { limit } });
    return response.data.data.analyses;
  },

  getTokenUsage: async (): Promise<TokenUsage> => {
    const response = await api.get('/ai/tokens');
    return response.data.data;
  },

  generateExploits: async (vulnerability: Vulnerability): Promise<any[]> => {
    const response = await api.post('/ai/exploits/generate', { vulnerability });
    return response.data.data.exploits;
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
