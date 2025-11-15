import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI, type User, type LoginData, type RegisterData } from '../lib/api';
import { wsService } from '../lib/websocket';
import { autoSyncTokenToExtension } from '../lib/extension';

/**
 * Authentication Store
 * Manages user authentication state and tokens
 */

interface AuthState {
  // State
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  _hasHydrated: boolean; // Internal: tracks if store has loaded from localStorage

  // Actions
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  getToken: () => string | null;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      _hasHydrated: false,

      // Login action
      login: async (data: LoginData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.login(data);

          // Update state (Zustand persist will auto-save to localStorage)
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          // Connect to WebSocket
          wsService.connect(response.accessToken);

          // Sync token to ReqSploit extension if installed
          autoSyncTokenToExtension(response.accessToken);
        } catch (error: any) {
          set({
            error: error.response?.data?.error?.message || 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      // Register action
      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.register(data);

          // Update state (Zustand persist will auto-save to localStorage)
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          // Connect to WebSocket
          wsService.connect(response.accessToken);

          // Sync token to ReqSploit extension if installed
          autoSyncTokenToExtension(response.accessToken);
        } catch (error: any) {
          set({
            error: error.response?.data?.error?.message || 'Registration failed',
            isLoading: false,
          });
          throw error;
        }
      },

      // Logout action
      logout: async () => {
        try {
          await authAPI.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Disconnect WebSocket
          wsService.disconnect();

          // Clear state (Zustand persist will auto-clear localStorage)
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      // Load current user
      loadUser: async () => {
        const { accessToken } = get();

        if (!accessToken) {
          set({ isAuthenticated: false });
          return;
        }

        set({ isLoading: true });
        try {
          const user = await authAPI.me();

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });

          // Connect to WebSocket if not connected
          if (!wsService.isConnected()) {
            wsService.connect(accessToken);
          }

          // Sync token to extension if installed (handles browser restart or late extension install)
          autoSyncTokenToExtension(accessToken);
        } catch (error) {
          console.error('Load user error:', error);
          // Token is invalid, clear auth state
          get().logout();
        }
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Set tokens (used by refresh interceptor)
      setTokens: (accessToken: string, refreshToken: string) => {
        set({ accessToken, refreshToken });
      },

      // Get current access token
      getToken: () => {
        return get().accessToken;
      },

      // Set hydration status (called by persist middleware)
      setHasHydrated: (hasHydrated: boolean) => {
        set({ _hasHydrated: hasHydrated });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Called after hydration is complete
        state?.setHasHydrated(true);
      },
    }
  )
);
