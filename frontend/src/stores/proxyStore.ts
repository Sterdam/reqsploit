import { create } from 'zustand';
import { proxyAPI, type ProxySession, type ProxyStats } from '../lib/api';
import { wsService } from '../lib/websocket';

/**
 * Proxy Store
 * Manages proxy session state and statistics
 */

interface ProxyState {
  // State
  session: ProxySession | null;
  stats: ProxyStats | null;
  isActive: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  startSession: (interceptMode?: boolean) => Promise<void>;
  stopSession: () => Promise<void>;
  loadStatus: () => Promise<void>;
  updateStats: (stats: ProxyStats) => void;
  toggleIntercept: (enabled: boolean) => Promise<void>;
  clearError: () => void;
}

export const useProxyStore = create<ProxyState>((set, get) => ({
  // Initial state
  session: null,
  stats: null,
  isActive: false,
  isLoading: false,
  error: null,

  // Start proxy session
  startSession: async (interceptMode: boolean = false) => {
    set({ isLoading: true, error: null });
    try {
      const session = await proxyAPI.startSession(interceptMode);

      set({
        session,
        isActive: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error?.message || 'Failed to start proxy',
        isLoading: false,
      });
      throw error;
    }
  },

  // Stop proxy session
  stopSession: async () => {
    const { session } = get();

    // Only stop if there's an active session
    if (!session) {
      console.warn('Cannot stop proxy: no active session');
      return;
    }

    set({ isLoading: true, error: null });
    try {
      await proxyAPI.stopSession();

      set({
        session: null,
        stats: null,
        isActive: false,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error?.message || 'Failed to stop proxy',
        isLoading: false,
      });
      // Don't throw - just log the error
      console.error('Failed to stop proxy session:', error);
    }
  },

  // Load proxy status
  loadStatus: async () => {
    try {
      const status = await proxyAPI.getStatus();

      set({
        session: status.session || null,
        stats: status.stats || null,
        isActive: status.hasActiveSession,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Failed to load proxy status:', error);
      // Clear session state on error
      set({
        session: null,
        stats: null,
        isActive: false,
        isLoading: false,
        error: null,
      });
    }
  },

  // Update stats (from WebSocket)
  updateStats: (stats: ProxyStats) => {
    set({ stats });
  },

  // Toggle intercept mode
  toggleIntercept: async (enabled: boolean) => {
    const { session, isActive } = get();

    // Only toggle if there's an active session
    if (!isActive || !session) {
      console.warn('Cannot toggle intercept: no active session');
      return;
    }

    try {
      await proxyAPI.updateSettings({ interceptMode: enabled });

      set({
        session: {
          ...session,
          interceptMode: enabled,
        },
      });

      // Also send via WebSocket for real-time update
      wsService.toggleIntercept(enabled);
    } catch (error: any) {
      set({
        error: error.response?.data?.error?.message || 'Failed to toggle intercept mode',
      });
      // Don't throw - just log the error
      console.error('Failed to toggle intercept mode:', error);
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
