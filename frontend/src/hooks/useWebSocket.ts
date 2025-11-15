import { useEffect } from 'react';
import { wsService, type WebSocketEventHandlers } from '../lib/websocket';
import { useAuthStore } from '../stores/authStore';
import { useProxyStore } from '../stores/proxyStore';
import { useRequestsStore } from '../stores/requestsStore';
import { useAIStore } from '../stores/aiStore';

/**
 * WebSocket Hook
 * Connects WebSocket service to Zustand stores
 */

export function useWebSocket() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const { updateStats } = useProxyStore();
  const { addRequest, updateRequest } = useRequestsStore();
  const { updateTokenUsage } = useAIStore();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      wsService.disconnect();
      return;
    }

    // Set up event handlers
    const handlers: WebSocketEventHandlers = {
      onConnect: () => {
        console.log('[App] WebSocket connected');
      },

      onDisconnect: () => {
        console.log('[App] WebSocket disconnected');
      },

      onAuthenticated: (data) => {
        console.log('[App] WebSocket authenticated:', data);
      },

      onAuthError: (data) => {
        console.error('[App] WebSocket auth error:', data);
      },

      // Proxy events
      onProxyStats: (stats) => {
        updateStats(stats);
      },

      // Request events
      onRequestIntercepted: (data) => {
        addRequest({
          ...data.request,
          timestamp: data.timestamp,
        });
      },

      onResponseReceived: (data) => {
        updateRequest(data.request.id, {
          statusCode: data.response.statusCode,
          responseHeaders: data.response.headers,
          duration: data.response.duration,
        });
      },

      // AI events
      onTokensUpdated: (usage) => {
        updateTokenUsage(usage);
      },

      onTokensLimitReached: (data) => {
        console.warn('[App] Token limit reached:', data);
        // Could show a toast notification here
      },
    };

    wsService.setHandlers(handlers);

    // Connect if not already connected
    if (!wsService.isConnected()) {
      wsService.connect(accessToken);
    }

    // Cleanup on unmount or auth change
    return () => {
      // Don't disconnect on unmount, only when user logs out
      // This allows WebSocket to persist across route changes
    };
  }, [isAuthenticated, accessToken, updateStats, addRequest, updateRequest, updateTokenUsage]);

  return {
    isConnected: wsService.isConnected(),
    ws: wsService,
  };
}
