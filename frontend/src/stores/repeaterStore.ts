import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './authStore';

/**
 * Repeater Request Structure
 */
export interface RepeaterRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

/**
 * Repeater Response Structure
 */
export interface RepeaterResponse {
  statusCode: number;
  statusMessage: string;
  headers: Record<string, string>;
  body: string;
  responseTime: number; // milliseconds
  timestamp: string;
}

/**
 * History Entry (Request + Response pair)
 */
export interface RepeaterHistoryEntry {
  id: string;
  request: RepeaterRequest;
  response: RepeaterResponse;
  timestamp: string;
}

/**
 * Repeater Tab
 */
export interface RepeaterTab {
  id: string;
  name: string;
  request: RepeaterRequest;
  response: RepeaterResponse | null;
  history: RepeaterHistoryEntry[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Repeater Template
 */
export interface RepeaterTemplate {
  id: string;
  name: string;
  request: RepeaterRequest;
  createdAt: string;
}

/**
 * Repeater Store State
 */
interface RepeaterState {
  // State
  tabs: RepeaterTab[];
  activeTabId: string | null;
  templates: RepeaterTemplate[];

  // Actions - Tab Management
  createTab: (name?: string, request?: RepeaterRequest) => string;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  renameTab: (tabId: string, name: string) => void;

  // Actions - Request Management
  updateRequest: (tabId: string, field: keyof RepeaterRequest, value: any) => void;
  setRequest: (tabId: string, request: RepeaterRequest) => void;
  updateHeader: (tabId: string, key: string, value: string) => void;
  removeHeader: (tabId: string, key: string) => void;
  addHeader: (tabId: string, key: string, value: string) => void;

  // Actions - Send Request
  sendRequest: (tabId: string) => Promise<void>;

  // Actions - History
  selectHistoryEntry: (tabId: string, entryId: string) => void;
  clearHistory: (tabId: string) => void;

  // Actions - Templates
  saveAsTemplate: (tabId: string, name: string) => Promise<void>;
  loadTemplate: (templateId: string) => void;
  deleteTemplate: (templateId: string) => Promise<void>;
  fetchTemplates: () => Promise<void>;

  // Utility
  getActiveTab: () => RepeaterTab | null;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

/**
 * Default empty request
 */
const createEmptyRequest = (): RepeaterRequest => ({
  method: 'GET',
  url: 'https://httpbin.org/get',
  headers: {
    'User-Agent': 'ReqSploit/1.0',
    'Accept': '*/*',
  },
  body: '',
});

/**
 * Generate unique tab ID
 */
const generateTabId = () => `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useRepeaterStore = create<RepeaterState>()(
  persist(
    (set, get) => ({
      // Initial state
      tabs: [],
      activeTabId: null,
      templates: [],

      // Create new tab
      createTab: (name?: string, request?: RepeaterRequest) => {
        const newTabId = generateTabId();
        const newTab: RepeaterTab = {
          id: newTabId,
          name: name || `Request ${get().tabs.length + 1}`,
          request: request || createEmptyRequest(),
          response: null,
          history: [],
          isLoading: false,
          error: null,
        };

        set((state) => ({
          tabs: [...state.tabs, newTab],
          activeTabId: newTabId,
        }));

        return newTabId;
      },

      // Close tab
      closeTab: (tabId: string) => {
        set((state) => {
          const newTabs = state.tabs.filter((tab) => tab.id !== tabId);

          // If closing active tab, switch to another tab
          let newActiveTabId = state.activeTabId;
          if (state.activeTabId === tabId) {
            newActiveTabId = newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
          }

          return {
            tabs: newTabs,
            activeTabId: newActiveTabId,
          };
        });
      },

      // Set active tab
      setActiveTab: (tabId: string) => {
        set({ activeTabId: tabId });
      },

      // Rename tab
      renameTab: (tabId: string, name: string) => {
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.id === tabId ? { ...tab, name } : tab
          ),
        }));
      },

      // Update request field
      updateRequest: (tabId: string, field: keyof RepeaterRequest, value: any) => {
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.id === tabId
              ? {
                  ...tab,
                  request: {
                    ...tab.request,
                    [field]: value,
                  },
                }
              : tab
          ),
        }));
      },

      // Set entire request
      setRequest: (tabId: string, request: RepeaterRequest) => {
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.id === tabId ? { ...tab, request } : tab
          ),
        }));
      },

      // Update header
      updateHeader: (tabId: string, key: string, value: string) => {
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.id === tabId
              ? {
                  ...tab,
                  request: {
                    ...tab.request,
                    headers: {
                      ...tab.request.headers,
                      [key]: value,
                    },
                  },
                }
              : tab
          ),
        }));
      },

      // Remove header
      removeHeader: (tabId: string, key: string) => {
        set((state) => ({
          tabs: state.tabs.map((tab) => {
            if (tab.id === tabId) {
              const newHeaders = { ...tab.request.headers };
              delete newHeaders[key];
              return {
                ...tab,
                request: {
                  ...tab.request,
                  headers: newHeaders,
                },
              };
            }
            return tab;
          }),
        }));
      },

      // Add header
      addHeader: (tabId: string, key: string, value: string) => {
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.id === tabId
              ? {
                  ...tab,
                  request: {
                    ...tab.request,
                    headers: {
                      ...tab.request.headers,
                      [key]: value,
                    },
                  },
                }
              : tab
          ),
        }));
      },

      // Send request
      sendRequest: async (tabId: string) => {
        const tab = get().tabs.find((t) => t.id === tabId);
        if (!tab) return;

        // Set loading state
        set((state) => ({
          tabs: state.tabs.map((t) =>
            t.id === tabId ? { ...t, isLoading: true, error: null } : t
          ),
        }));

        try {
          // Get token from auth store
          const token = useAuthStore.getState().accessToken;
          const response = await fetch(`${BACKEND_URL}/api/repeater/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify(tab.request),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();

          if (!data.success) {
            throw new Error(data.error?.message || 'Request failed');
          }

          const repeaterResponse: RepeaterResponse = data.data.response;

          // Create history entry
          const historyEntry: RepeaterHistoryEntry = {
            id: `entry-${Date.now()}`,
            request: { ...tab.request },
            response: repeaterResponse,
            timestamp: new Date().toISOString(),
          };

          // Update tab with response and add to history
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId
                ? {
                    ...t,
                    response: repeaterResponse,
                    history: [historyEntry, ...t.history], // Newest first
                    isLoading: false,
                    error: null,
                  }
                : t
            ),
          }));
        } catch (error) {
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId
                ? {
                    ...t,
                    isLoading: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                  }
                : t
            ),
          }));
        }
      },

      // Select history entry
      selectHistoryEntry: (tabId: string, entryId: string) => {
        set((state) => ({
          tabs: state.tabs.map((tab) => {
            if (tab.id === tabId) {
              const entry = tab.history.find((e) => e.id === entryId);
              if (entry) {
                return {
                  ...tab,
                  request: { ...entry.request },
                  response: { ...entry.response },
                };
              }
            }
            return tab;
          }),
        }));
      },

      // Clear history
      clearHistory: (tabId: string) => {
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.id === tabId ? { ...tab, history: [] } : tab
          ),
        }));
      },

      // Save as template
      saveAsTemplate: async (tabId: string, name: string) => {
        const tab = get().tabs.find((t) => t.id === tabId);
        if (!tab) return;

        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${BACKEND_URL}/api/repeater/templates`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify({
              name,
              ...tab.request,
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();

          if (data.success) {
            // Refresh templates
            await get().fetchTemplates();
          }
        } catch (error) {
          console.error('Failed to save template:', error);
        }
      },

      // Load template
      loadTemplate: (templateId: string) => {
        const template = get().templates.find((t) => t.id === templateId);
        if (!template) return;

        // Create new tab with template
        get().createTab(template.name, template.request);
      },

      // Delete template
      deleteTemplate: async (templateId: string) => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(
            `${BACKEND_URL}/api/repeater/templates/${templateId}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': token ? `Bearer ${token}` : '',
              },
            }
          );

          if (response.ok) {
            // Refresh templates
            await get().fetchTemplates();
          }
        } catch (error) {
          console.error('Failed to delete template:', error);
        }
      },

      // Fetch templates
      fetchTemplates: async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${BACKEND_URL}/api/repeater/templates`, {
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              set({ templates: data.data || [] });
            }
          }
        } catch (error) {
          console.error('Failed to fetch templates:', error);
        }
      },

      // Get active tab
      getActiveTab: () => {
        const state = get();
        return state.tabs.find((tab) => tab.id === state.activeTabId) || null;
      },
    }),
    {
      name: 'repeater-storage',
      partialize: (state) => ({
        tabs: state.tabs,
        activeTabId: state.activeTabId,
        // Don't persist templates, fetch fresh on load
      }),
    }
  )
);
