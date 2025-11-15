/**
 * API Requests Store - Manages requests from backend API
 */

import { create } from 'zustand';

export interface ApiRequest {
  id: string;
  method: string;
  url: string;
  headers: Record<string, any>;
  body?: string;
  statusCode?: number;
  responseHeaders?: Record<string, any>;
  responseBody?: string;
  duration?: number;
  timestamp: string;
  starred: boolean;
  tags: string[];
  isIntercepted: boolean;
  project?: {
    id: string;
    name: string;
    target: string;
  };
  aiAnalyses?: Array<{
    id: string;
    mode: 'EDUCATIONAL' | 'DEFAULT' | 'ADVANCED';
    confidence: number;
    createdAt: string;
  }>;
}

export interface FilterOptions {
  search?: string;
  methods?: string[];
  statusCodes?: number[];
  tags?: string[];
  starred?: boolean;
  isIntercepted?: boolean;
  startDate?: string;
  endDate?: string;
  projectId?: string;
  sortBy?: 'timestamp' | 'duration' | 'statusCode';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

interface ApiRequestsState {
  requests: ApiRequest[];
  selectedRequest: ApiRequest | null;
  loading: boolean;
  error: string | null;
  total: number;
  filters: FilterOptions;

  // Actions
  fetchRequests: (token: string) => Promise<void>;
  selectRequest: (id: string) => void;
  setFilters: (filters: FilterOptions) => void;
  toggleStar: (id: string, token: string) => Promise<void>;
  addTag: (id: string, tag: string, token: string) => Promise<void>;
  removeTag: (id: string, tag: string, token: string) => Promise<void>;
  assignToProject: (id: string, projectId: string | null, token: string) => Promise<void>;
  clearRequests: () => void;
  refreshRequest: (id: string, token: string) => Promise<void>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useApiRequestsStore = create<ApiRequestsState>((set, get) => ({
  requests: [],
  selectedRequest: null,
  loading: false,
  error: null,
  total: 0,
  filters: {
    sortBy: 'timestamp',
    sortOrder: 'desc',
    limit: 50,
    offset: 0,
  },

  fetchRequests: async (token: string) => {
    set({ loading: true, error: null });

    try {
      const { filters } = get();
      const params = new URLSearchParams();

      if (filters.search) params.append('search', filters.search);
      if (filters.methods?.length) params.append('methods', filters.methods.join(','));
      if (filters.statusCodes?.length) params.append('statusCodes', filters.statusCodes.join(','));
      if (filters.tags?.length) params.append('tags', filters.tags.join(','));
      if (filters.starred !== undefined) params.append('starred', String(filters.starred));
      if (filters.isIntercepted !== undefined) params.append('isIntercepted', String(filters.isIntercepted));
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.projectId) params.append('projectId', filters.projectId);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters.limit) params.append('limit', String(filters.limit));
      if (filters.offset) params.append('offset', String(filters.offset));

      const response = await fetch(`${API_URL}/api/requests?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }

      const data = await response.json();

      set({
        requests: data.data,
        total: data.pagination.total,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  selectRequest: (id: string) => {
    const request = get().requests.find(r => r.id === id);
    set({ selectedRequest: request || null });
  },

  setFilters: (newFilters: FilterOptions) => {
    set({ filters: { ...get().filters, ...newFilters } });
  },

  toggleStar: async (id: string, token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/requests/${id}/starred`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to toggle star');
      }

      const data = await response.json();

      set({
        requests: get().requests.map(r =>
          r.id === id ? { ...r, starred: data.data.starred } : r
        ),
        selectedRequest:
          get().selectedRequest?.id === id
            ? { ...get().selectedRequest!, starred: data.data.starred }
            : get().selectedRequest,
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  addTag: async (id: string, tag: string, token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/requests/${id}/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tag }),
      });

      if (!response.ok) {
        throw new Error('Failed to add tag');
      }

      const data = await response.json();

      set({
        requests: get().requests.map(r =>
          r.id === id ? { ...r, tags: data.data.tags } : r
        ),
        selectedRequest:
          get().selectedRequest?.id === id
            ? { ...get().selectedRequest!, tags: data.data.tags }
            : get().selectedRequest,
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  removeTag: async (id: string, tag: string, token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/requests/${id}/tags/${encodeURIComponent(tag)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to remove tag');
      }

      const data = await response.json();

      set({
        requests: get().requests.map(r =>
          r.id === id ? { ...r, tags: data.data.tags } : r
        ),
        selectedRequest:
          get().selectedRequest?.id === id
            ? { ...get().selectedRequest!, tags: data.data.tags }
            : get().selectedRequest,
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  assignToProject: async (id: string, projectId: string | null, token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/requests/${id}/project`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign to project');
      }

      const data = await response.json();

      set({
        requests: get().requests.map(r =>
          r.id === id ? data.data : r
        ),
        selectedRequest: get().selectedRequest?.id === id ? data.data : get().selectedRequest,
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  clearRequests: () => {
    set({ requests: [], selectedRequest: null, total: 0 });
  },

  refreshRequest: async (id: string, token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/requests/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to refresh request');
      }

      const data = await response.json();

      set({
        requests: get().requests.map(r => (r.id === id ? data.data : r)),
        selectedRequest: get().selectedRequest?.id === id ? data.data : get().selectedRequest,
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },
}));
