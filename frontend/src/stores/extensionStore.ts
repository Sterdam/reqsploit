import { create } from 'zustand';
import { proxyAPI, type ProxySession } from '../lib/api';
import { wsService } from '../lib/websocket';

/**
 * Extension Store
 * Manages Chrome extension connection state via CDP architecture.
 * Replaces proxyStore - backward-compatible API surface.
 */

export interface ExtensionStats {
  totalRequests: number;
  interceptedRequests: number;
  forwarded?: number;
  dropped?: number;
}

interface AttachedTab {
  tabId: number;
  url: string;
}

interface ExtensionState {
  // Connection state
  isConnected: boolean;
  extensionVersion: string | null;

  // Session state (backward-compatible with proxyStore)
  session: ProxySession | null;
  isActive: boolean;
  isLoading: boolean;
  error: string | null;

  // Extension-specific
  interceptEnabled: boolean;
  responseInterceptEnabled: boolean;
  attachedTabs: AttachedTab[];
  stats: ExtensionStats | null;

  // Actions (same API as proxyStore for compatibility)
  startSession: (interceptMode?: boolean) => Promise<void>;
  stopSession: () => Promise<void>;
  loadStatus: () => Promise<void>;
  toggleIntercept: (enabled: boolean) => Promise<void>;

  // Extension-specific actions
  setExtensionConnected: (connected: boolean, version?: string, tabs?: AttachedTab[]) => void;
  addTab: (tabId: number, url: string) => void;
  removeTab: (tabId: number) => void;
  updateStats: (stats: ExtensionStats) => void;
  clearError: () => void;
}

export const useExtensionStore = create<ExtensionState>((set, get) => ({
  // Initial state - connection
  isConnected: false,
  extensionVersion: null,

  // Initial state - session (backward-compatible)
  session: null,
  isActive: false,
  isLoading: false,
  error: null,

  // Initial state - extension-specific
  interceptEnabled: false,
  responseInterceptEnabled: false,
  attachedTabs: [],
  stats: null,

  // Start session with CDP mode
  startSession: async (interceptMode: boolean = false) => {
    set({ isLoading: true, error: null });
    try {
      const session = await proxyAPI.startSession(interceptMode);

      set({
        session,
        isActive: true,
        isLoading: false,
        interceptEnabled: interceptMode,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error?.message || 'Failed to start session',
        isLoading: false,
      });
      throw error;
    }
  },

  // Stop session
  stopSession: async () => {
    const { session } = get();

    if (!session) {
      console.warn('[ExtensionStore] Cannot stop session: no active session');
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
        interceptEnabled: false,
        responseInterceptEnabled: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error?.message || 'Failed to stop session',
        isLoading: false,
      });
      console.error('[ExtensionStore] Failed to stop session:', error);
    }
  },

  // Load session status from server
  loadStatus: async () => {
    try {
      const status = await proxyAPI.getStatus();

      set({
        session: status.session || null,
        stats: status.stats
          ? {
              totalRequests: status.stats.totalRequests,
              interceptedRequests: status.stats.interceptedRequests,
              forwarded: 0,
              dropped: 0,
            }
          : null,
        isActive: status.hasActiveSession,
        isLoading: false,
        error: null,
        interceptEnabled: status.session?.interceptMode ?? false,
      });
    } catch (error: any) {
      console.error('[ExtensionStore] Failed to load status:', error);
      set({
        session: null,
        stats: null,
        isActive: false,
        isLoading: false,
        error: null,
      });
    }
  },

  // Toggle intercept mode
  toggleIntercept: async (enabled: boolean) => {
    const { session, isActive } = get();

    if (!isActive || !session) {
      console.warn('[ExtensionStore] Cannot toggle intercept: no active session');
      return;
    }

    try {
      await proxyAPI.updateSettings({ interceptMode: enabled });

      set({
        session: {
          ...session,
          interceptMode: enabled,
        },
        interceptEnabled: enabled,
      });

      // Also send via WebSocket for real-time update
      wsService.toggleIntercept(enabled);
    } catch (error: any) {
      set({
        error: error.response?.data?.error?.message || 'Failed to toggle intercept mode',
      });
      console.error('[ExtensionStore] Failed to toggle intercept mode:', error);
    }
  },

  // Set extension connection status (called from WS events)
  setExtensionConnected: (connected: boolean, version?: string, tabs?: AttachedTab[]) => {
    set({
      isConnected: connected,
      extensionVersion: version ?? (connected ? get().extensionVersion : null),
      attachedTabs: tabs ?? (connected ? get().attachedTabs : []),
      ...(connected ? {} : { stats: null }),
    });
  },

  // Add a tab to tracked list
  addTab: (tabId: number, url: string) => {
    const { attachedTabs } = get();
    const exists = attachedTabs.some((t) => t.tabId === tabId);

    if (exists) {
      // Update URL if tab already tracked
      set({
        attachedTabs: attachedTabs.map((t) =>
          t.tabId === tabId ? { tabId, url } : t
        ),
      });
    } else {
      set({
        attachedTabs: [...attachedTabs, { tabId, url }],
      });
    }
  },

  // Remove a tab from tracked list
  removeTab: (tabId: number) => {
    const { attachedTabs } = get();
    set({
      attachedTabs: attachedTabs.filter((t) => t.tabId !== tabId),
    });
  },

  // Update stats (from WebSocket)
  updateStats: (stats: ExtensionStats) => {
    set({
      stats: {
        totalRequests: stats.totalRequests ?? 0,
        interceptedRequests: stats.interceptedRequests ?? 0,
        forwarded: stats.forwarded ?? 0,
        dropped: stats.dropped ?? 0,
      },
    });
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

// Backward-compatible alias
export const useProxyStore = useExtensionStore;

// ============================================
// WebSocket event handlers for extension events
// ============================================

wsService.setHandlers({
  onConnect: () => {
    // WebSocket connected
  },

  onDisconnect: () => {
    useExtensionStore.getState().setExtensionConnected(false);
  },

  // Extension connection events
  onExtensionConnected: (data) => {
    useExtensionStore.getState().setExtensionConnected(true, data.version, data.attachedTabs);
  },

  onExtensionDisconnected: () => {
    useExtensionStore.getState().setExtensionConnected(false);
  },

  // Tab events
  onTabAttached: (data) => {
    useExtensionStore.getState().addTab(data.tabId, data.url);
  },

  onTabDetached: (data) => {
    useExtensionStore.getState().removeTab(data.tabId);
  },

  // Session events (backward compat with proxy events)
  onProxyStarted: (data) => {
    useExtensionStore.setState({
      isActive: true,
      session: {
        sessionId: data.sessionId,
        proxyPort: data.proxyPort,
        interceptMode: false,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    });
  },

  onProxyStopped: () => {
    useExtensionStore.setState({
      isActive: false,
      session: null,
      stats: null,
      interceptEnabled: false,
      responseInterceptEnabled: false,
    });
  },

  onProxyStats: (data) => {
    useExtensionStore.getState().updateStats(data);
  },
});
