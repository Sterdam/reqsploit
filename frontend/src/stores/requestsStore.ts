import { create } from 'zustand';
import type { HTTPRequest } from '../lib/api';

/**
 * Requests Store
 * Manages intercepted HTTP requests (real-time from WebSocket)
 */

interface RequestsState {
  // State
  requests: HTTPRequest[];
  selectedRequest: HTTPRequest | null;
  filter: {
    method?: string;
    search?: string;
    statusCode?: number;
  };

  // Actions
  addRequest: (request: HTTPRequest) => void;
  updateRequest: (requestId: string, updates: Partial<HTTPRequest>) => void;
  selectRequest: (requestId: string | null) => void;
  clearRequests: () => void;
  setFilter: (filter: Partial<RequestsState['filter']>) => void;
  getFilteredRequests: () => HTTPRequest[];
}

export const useRequestsStore = create<RequestsState>((set, get) => ({
  // Initial state
  requests: [],
  selectedRequest: null,
  filter: {},

  // Add new request (from WebSocket)
  addRequest: (request: HTTPRequest) => {
    set((state) => {
      // Skip if request with same ID already exists (prevents duplicates from multiple WS connections)
      if (state.requests.some((r) => r.id === request.id)) {
        return state;
      }

      return {
        requests: [request, ...state.requests].slice(0, 1000), // Keep last 1000
      };
    });
  },

  // Update request (when response is received)
  updateRequest: (requestId: string, updates: Partial<HTTPRequest>) => {
    set((state) => ({
      requests: state.requests.map((req) =>
        req.id === requestId ? { ...req, ...updates } : req
      ),
      selectedRequest:
        state.selectedRequest?.id === requestId
          ? { ...state.selectedRequest, ...updates }
          : state.selectedRequest,
    }));
  },

  // Select a request for detailed view
  selectRequest: (requestId: string | null) => {
    if (!requestId) {
      set({ selectedRequest: null });
      return;
    }

    const request = get().requests.find((r) => r.id === requestId);
    set({ selectedRequest: request || null });
  },

  // Clear all requests
  clearRequests: () => {
    set({ requests: [], selectedRequest: null });
  },

  // Set filter
  setFilter: (filter: Partial<RequestsState['filter']>) => {
    set((state) => ({
      filter: { ...state.filter, ...filter },
    }));
  },

  // Get filtered requests
  getFilteredRequests: () => {
    const { requests, filter } = get();

    return requests.filter((req) => {
      // Method filter
      if (filter.method && req.method !== filter.method) {
        return false;
      }

      // Status code filter
      if (filter.statusCode && req.statusCode !== filter.statusCode) {
        return false;
      }

      // Search filter (URL)
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        if (!req.url.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  },
}));
