import { create } from 'zustand';
import axios from 'axios';
import { wsService } from '../lib/websocket';
import { useAuthStore } from './authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Magic Scan Types
 */
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type AssetCategory =
  | 'API_KEYS'
  | 'PRIVATE_KEYS'
  | 'DATABASE_CREDS'
  | 'AUTH_DATA'
  | 'NETWORK_INFO'
  | 'PII'
  | 'SENSITIVE_FILES'
  | 'ERROR_INFO'
  | 'BUSINESS_LOGIC';

export interface ScanLocation {
  source: 'request' | 'response';
  part: 'url' | 'headers' | 'body' | 'cookies';
  path?: string;
}

export interface ScanResult {
  id: string;
  requestId: string;
  severity: Severity;
  category: AssetCategory;
  type: string;
  description: string;
  value: string; // Masked value
  location: ScanLocation;
  context: string;
  confidence: number;
  isMarkedSafe: boolean;
  isFalsePositive: boolean;
  timestamp: Date;
}

export interface ScanStats {
  total: number;
  bySeverity: Record<Severity, number>;
  byCategory: Record<AssetCategory, number>;
  criticalCount: number;
  highCount: number;
}

export interface ScanFilters {
  severity: Severity[];
  category: AssetCategory[];
  showSafe: boolean;
  search: string;
  minConfidence: number;
}

/**
 * Magic Scan Store
 * Manages scan results, real-time notifications, and filtering
 */
interface MagicScanState {
  // State
  results: ScanResult[];
  stats: ScanStats | null;
  filters: ScanFilters;
  isLoading: boolean;
  error: string | null;
  selectedResult: ScanResult | null;

  // Pagination
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };

  // Actions - Data fetching
  fetchResults: () => Promise<void>;
  fetchStats: () => Promise<void>;
  loadMore: () => Promise<void>;

  // Actions - Filtering
  setFilters: (filters: Partial<ScanFilters>) => void;
  resetFilters: () => void;
  toggleSeverity: (severity: Severity) => void;
  toggleCategory: (category: AssetCategory) => void;

  // Actions - Result management
  selectResult: (result: ScanResult | null) => void;
  markAsSafe: (id: string) => Promise<void>;
  markAsFalsePositive: (id: string) => Promise<void>;
  deleteResult: (id: string) => Promise<void>;
  rescanRequest: (requestId: string) => Promise<void>;

  // Real-time updates
  addResult: (result: ScanResult) => void;
  updateStats: (stats: ScanStats) => void;

  // Initialization
  initialize: () => void;
  cleanup: () => void;
}

const DEFAULT_FILTERS: ScanFilters = {
  severity: [],
  category: [],
  showSafe: false,
  search: '',
  minConfidence: 0,
};

export const useMagicScanStore = create<MagicScanState>((set, get) => ({
  // Initial state
  results: [],
  stats: null,
  filters: DEFAULT_FILTERS,
  isLoading: false,
  error: null,
  selectedResult: null,
  pagination: {
    limit: 50,
    offset: 0,
    total: 0,
    hasMore: false,
  },

  // Fetch results with filters
  fetchResults: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = useAuthStore.getState().accessToken;

      const { filters, pagination } = get();
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
        includeSafe: filters.showSafe.toString(),
      });

      if (filters.severity.length > 0) {
        params.append('severity', filters.severity[0]);
      }
      if (filters.category.length > 0) {
        params.append('category', filters.category[0]);
      }

      const response = await axios.get(`${API_URL}/api/scan/results?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const apiData = response.data.data;
      const results = apiData.results.map((r: any) => ({
        ...r,
        timestamp: new Date(r.createdAt),
      }));

      set({
        results: pagination.offset === 0 ? results : [...get().results, ...results],
        pagination: {
          ...pagination,
          total: apiData.total || 0,
          hasMore: apiData.hasMore,
        },
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error
        ? (typeof error.response.data.error === 'string'
            ? error.response.data.error
            : error.response.data.error.message || JSON.stringify(error.response.data.error))
        : error.message || 'Failed to fetch scan results';

      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  // Fetch statistics
  fetchStats: async () => {
    try {
      const token = useAuthStore.getState().accessToken;

      const response = await axios.get(`${API_URL}/api/scan/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      set({ stats: response.data.data });
    } catch (error: any) {
      console.error('Failed to fetch scan stats:', error);
    }
  },

  // Load more results (pagination)
  loadMore: async () => {
    const { pagination } = get();
    if (!pagination.hasMore) return;

    set({
      pagination: {
        ...pagination,
        offset: pagination.offset + pagination.limit,
      },
    });

    await get().fetchResults();
  },

  // Set filters
  setFilters: (newFilters) => {
    set({
      filters: { ...get().filters, ...newFilters },
      pagination: { ...get().pagination, offset: 0 },
    });
    get().fetchResults();
  },

  // Reset filters
  resetFilters: () => {
    set({
      filters: DEFAULT_FILTERS,
      pagination: { ...get().pagination, offset: 0 },
    });
    get().fetchResults();
  },

  // Toggle severity filter
  toggleSeverity: (severity) => {
    const { filters } = get();
    const newSeverities = filters.severity.includes(severity)
      ? filters.severity.filter((s) => s !== severity)
      : [...filters.severity, severity];

    get().setFilters({ severity: newSeverities });
  },

  // Toggle category filter
  toggleCategory: (category) => {
    const { filters } = get();
    const newCategories = filters.category.includes(category)
      ? filters.category.filter((c) => c !== category)
      : [...filters.category, category];

    get().setFilters({ category: newCategories });
  },

  // Select result
  selectResult: (result) => {
    set({ selectedResult: result });
  },

  // Mark as safe
  markAsSafe: async (id) => {
    try {
      const token = useAuthStore.getState().accessToken;
      await axios.post(
        `${API_URL}/api/scan/mark-safe/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      set({
        results: get().results.map((r) =>
          r.id === id ? { ...r, isMarkedSafe: true } : r
        ),
      });

      // Refresh stats
      get().fetchStats();
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to mark as safe' });
    }
  },

  // Mark as false positive
  markAsFalsePositive: async (id) => {
    try {
      const token = useAuthStore.getState().accessToken;
      await axios.post(
        `${API_URL}/api/scan/mark-false-positive/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      set({
        results: get().results.map((r) =>
          r.id === id ? { ...r, isFalsePositive: true } : r
        ),
      });

      // Refresh stats
      get().fetchStats();
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to mark as false positive' });
    }
  },

  // Delete result
  deleteResult: async (id) => {
    try {
      const token = useAuthStore.getState().accessToken;
      await axios.delete(`${API_URL}/api/scan/result/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Remove from local state
      set({
        results: get().results.filter((r) => r.id !== id),
        selectedResult: get().selectedResult?.id === id ? null : get().selectedResult,
      });

      // Refresh stats
      get().fetchStats();
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to delete result' });
    }
  },

  // Rescan request
  rescanRequest: async (requestId) => {
    try {
      const token = useAuthStore.getState().accessToken;
      await axios.post(
        `${API_URL}/api/scan/rescan/${requestId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh results
      await get().fetchResults();
      await get().fetchStats();
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to rescan request' });
    }
  },

  // Add new result (from WebSocket)
  addResult: (result) => {
    const { results, filters } = get();

    // Check if should be shown based on filters
    if (!filters.showSafe && result.isMarkedSafe) return;
    if (filters.severity.length > 0 && !filters.severity.includes(result.severity)) return;
    if (filters.category.length > 0 && !filters.category.includes(result.category)) return;

    // Add to beginning of list
    set({
      results: [result, ...results],
      pagination: {
        ...get().pagination,
        total: get().pagination.total + 1,
      },
    });

    // Refresh stats
    get().fetchStats();
  },

  // Update stats (from WebSocket)
  updateStats: (stats) => {
    set({ stats });
  },

  // Initialize WebSocket listeners
  initialize: () => {
    // Set up WebSocket event handlers
    wsService.setHandlers({
      onScanResult: (data: any) => {
        const result: ScanResult = {
          ...data,
          timestamp: new Date(data.timestamp),
        };
        get().addResult(result);
      },
      onScanStats: (data: any) => {
        get().updateStats(data);
      },
    });

    // Initial data fetch
    get().fetchResults();
    get().fetchStats();
  },

  // Cleanup
  cleanup: () => {
    // Clear the handlers
    wsService.setHandlers({
      onScanResult: undefined,
      onScanStats: undefined,
    });
  },
}));
