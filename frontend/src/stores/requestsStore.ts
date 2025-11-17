import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HTTPRequest } from '../lib/api';

/**
 * Requests Store
 * Manages intercepted HTTP requests (real-time from WebSocket)
 */

/**
 * Domain Filter Rule
 */
export interface DomainFilter {
  id: string;
  pattern: string; // Domain pattern (supports wildcards)
  category: string;
  enabled: boolean;
  custom: boolean; // true if manually added by user
}

/**
 * AI Analysis Information
 */
export interface AIAnalysisInfo {
  requestId: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  vulnerabilityCount: number;
  suggestionCount: number;
  analyzedAt: Date;
  analysisType: 'quick' | 'deep'; // Quick scan (1₵) vs Deep scan (20₵)
}

/**
 * Default domain filters (common third-party services)
 */
const DEFAULT_DOMAIN_FILTERS: Omit<DomainFilter, 'id'>[] = [
  // Analytics & Tracking
  { pattern: 'google-analytics.com', category: 'Analytics', enabled: true, custom: false },
  { pattern: 'googletagmanager.com', category: 'Analytics', enabled: true, custom: false },
  { pattern: 'doubleclick.net', category: 'Analytics', enabled: true, custom: false },
  { pattern: 'analytics.google.com', category: 'Analytics', enabled: true, custom: false },
  { pattern: 'facebook.com/tr', category: 'Analytics', enabled: true, custom: false },
  { pattern: 'connect.facebook.net', category: 'Analytics', enabled: true, custom: false },
  { pattern: 'facebook.net', category: 'Analytics', enabled: true, custom: false },
  { pattern: 'omtrdc.net', category: 'Analytics', enabled: true, custom: false },
  { pattern: 'demdex.net', category: 'Analytics', enabled: true, custom: false },
  { pattern: '2o7.net', category: 'Analytics', enabled: true, custom: false },
  { pattern: 'mixpanel.com', category: 'Analytics', enabled: true, custom: false },
  { pattern: 'segment.com', category: 'Analytics', enabled: true, custom: false },
  { pattern: 'segment.io', category: 'Analytics', enabled: true, custom: false },
  { pattern: 'amplitude.com', category: 'Analytics', enabled: true, custom: false },
  { pattern: 'hotjar.com', category: 'Analytics', enabled: true, custom: false },
  { pattern: 'crazyegg.com', category: 'Analytics', enabled: true, custom: false },
  { pattern: 'heapanalytics.com', category: 'Analytics', enabled: true, custom: false },
  { pattern: 'matomo.org', category: 'Analytics', enabled: true, custom: false },
  { pattern: 'piwik.org', category: 'Analytics', enabled: true, custom: false },
  { pattern: 'clicky.com', category: 'Analytics', enabled: true, custom: false },
  { pattern: 'kissmetrics.com', category: 'Analytics', enabled: true, custom: false },

  // Advertising
  { pattern: 'googlesyndication.com', category: 'Advertising', enabled: true, custom: false },
  { pattern: 'googleadservices.com', category: 'Advertising', enabled: true, custom: false },
  { pattern: 'adservice.google.com', category: 'Advertising', enabled: true, custom: false },
  { pattern: 'adroll.com', category: 'Advertising', enabled: true, custom: false },
  { pattern: 'criteo.com', category: 'Advertising', enabled: true, custom: false },
  { pattern: 'criteo.net', category: 'Advertising', enabled: true, custom: false },
  { pattern: 'taboola.com', category: 'Advertising', enabled: true, custom: false },
  { pattern: 'outbrain.com', category: 'Advertising', enabled: true, custom: false },
  { pattern: 'adnxs.com', category: 'Advertising', enabled: true, custom: false },

  // CDNs (only specific subdomains, not main domains)
  { pattern: 'cdnjs.cloudflare.com', category: 'CDN', enabled: true, custom: false },
  { pattern: 'akamaihd.net', category: 'CDN', enabled: true, custom: false },
  { pattern: 'akamaized.net', category: 'CDN', enabled: true, custom: false },
  { pattern: 'fastly.net', category: 'CDN', enabled: true, custom: false },
  { pattern: 'cloudfront.net', category: 'CDN', enabled: true, custom: false },

  // Social Media Widgets
  { pattern: 'platform.twitter.com', category: 'Social', enabled: true, custom: false },
  { pattern: 'syndication.twitter.com', category: 'Social', enabled: true, custom: false },
  { pattern: 'platform.linkedin.com', category: 'Social', enabled: true, custom: false },
  { pattern: 'assets.pinterest.com', category: 'Social', enabled: true, custom: false },
  { pattern: 'platform.instagram.com', category: 'Social', enabled: true, custom: false },

  // Chat & Support
  { pattern: 'intercom.io', category: 'Chat', enabled: true, custom: false },
  { pattern: 'widget.intercom.io', category: 'Chat', enabled: true, custom: false },
  { pattern: 'zdassets.com', category: 'Chat', enabled: true, custom: false },
  { pattern: 'drift.com', category: 'Chat', enabled: true, custom: false },
  { pattern: 'driftt.com', category: 'Chat', enabled: true, custom: false },
  { pattern: 'tawk.to', category: 'Chat', enabled: true, custom: false },
  { pattern: 'livechatinc.com', category: 'Chat', enabled: true, custom: false },
  { pattern: 'olark.com', category: 'Chat', enabled: true, custom: false },

  // Error Tracking & Monitoring
  { pattern: 'sentry.io', category: 'Monitoring', enabled: true, custom: false },
  { pattern: 'rollbar.com', category: 'Monitoring', enabled: true, custom: false },
  { pattern: 'bugsnag.com', category: 'Monitoring', enabled: true, custom: false },
  { pattern: 'newrelic.com', category: 'Monitoring', enabled: true, custom: false },
  { pattern: 'nr-data.net', category: 'Monitoring', enabled: true, custom: false },
  { pattern: 'datadoghq.com', category: 'Monitoring', enabled: true, custom: false },

  // Marketing & Email
  { pattern: 'list-manage.com', category: 'Marketing', enabled: true, custom: false },
  { pattern: 'sendgrid.net', category: 'Marketing', enabled: true, custom: false },
  { pattern: 'customer.io', category: 'Marketing', enabled: true, custom: false },
  { pattern: 'marketo.com', category: 'Marketing', enabled: true, custom: false },
  { pattern: 'mktoresp.com', category: 'Marketing', enabled: true, custom: false },

  // Fonts
  { pattern: 'fonts.googleapis.com', category: 'Fonts', enabled: true, custom: false },
  { pattern: 'fonts.gstatic.com', category: 'Fonts', enabled: true, custom: false },
  { pattern: 'typekit.net', category: 'Fonts', enabled: true, custom: false },
  { pattern: 'use.typekit.net', category: 'Fonts', enabled: true, custom: false },

  // Maps
  { pattern: 'maps.googleapis.com', category: 'Maps', enabled: true, custom: false },
  { pattern: 'maps.gstatic.com', category: 'Maps', enabled: true, custom: false },

  // Video Players
  { pattern: 'youtube.com/iframe_api', category: 'Video', enabled: true, custom: false },
  { pattern: 'player.vimeo.com', category: 'Video', enabled: true, custom: false },

  // Cookie Consent
  { pattern: 'onetrust.com', category: 'Privacy', enabled: true, custom: false },
  { pattern: 'cdn.cookielaw.org', category: 'Privacy', enabled: true, custom: false },
  { pattern: 'cookiebot.com', category: 'Privacy', enabled: true, custom: false },

  // reCAPTCHA & Bot Detection
  { pattern: 'google.com/recaptcha', category: 'Security', enabled: true, custom: false },
  { pattern: 'recaptcha.net', category: 'Security', enabled: true, custom: false },
  { pattern: 'hcaptcha.com', category: 'Security', enabled: true, custom: false },
];

interface RequestsState {
  // State
  requests: HTTPRequest[];
  selectedRequest: HTTPRequest | null;
  filter: {
    method?: string;
    search?: string;
    statusCode?: number;
  };
  domainFilters: DomainFilter[];
  domainFiltersEnabled: boolean;

  // AI Analysis State
  aiAnalyses: Map<string, AIAnalysisInfo>;
  aiFilter: {
    analyzed?: boolean; // undefined = show all, true = only analyzed, false = only not analyzed
    severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
  };

  // Batch Selection State
  selectedRequestIds: Set<string>;

  // Actions
  addRequest: (request: HTTPRequest) => void;
  updateRequest: (requestId: string, updates: Partial<HTTPRequest>) => void;
  selectRequest: (requestId: string | null) => void;
  deleteRequest: (requestId: string) => void;
  clearRequests: () => void;
  setFilter: (filter: Partial<RequestsState['filter']>) => void;
  getFilteredRequests: () => HTTPRequest[];

  // Domain Filter Actions
  toggleDomainFilters: () => void;
  addDomainFilter: (pattern: string, category?: string) => void;
  removeDomainFilter: (filterId: string) => void;
  toggleDomainFilter: (filterId: string) => void;
  resetDomainFilters: () => void;
  getFilteredCount: () => number;

  // AI Analysis Actions
  setRequestAnalysis: (requestId: string, analysis: Omit<AIAnalysisInfo, 'requestId'>) => void;
  getRequestAnalysis: (requestId: string) => AIAnalysisInfo | undefined;
  hasAnalysis: (requestId: string) => boolean;
  setAIFilter: (filter: Partial<RequestsState['aiFilter']>) => void;
  clearAIFilter: () => void;

  // Batch Selection Actions
  toggleRequestSelection: (requestId: string) => void;
  selectAllRequests: () => void;
  clearSelection: () => void;
  getSelectedRequests: () => HTTPRequest[];
}

/**
 * Check if URL matches a domain filter pattern
 */
const matchesDomainPattern = (url: string, pattern: string): boolean => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const path = urlObj.pathname;

    // Check if pattern includes path (e.g., "google.com/recaptcha")
    if (pattern.includes('/')) {
      const fullPattern = `${hostname}${path}`;
      return fullPattern.includes(pattern);
    }

    // Check if hostname ends with pattern (supports subdomains)
    return hostname === pattern || hostname.endsWith('.' + pattern);
  } catch {
    return false;
  }
};

export const useRequestsStore = create<RequestsState>()(
  persist(
    (set, get) => ({
      // Initial state
      requests: [],
      selectedRequest: null,
      filter: {},
      domainFilters: DEFAULT_DOMAIN_FILTERS.map((f, i) => ({ ...f, id: `default-${i}` })),
      domainFiltersEnabled: true,
      aiAnalyses: new Map(),
      aiFilter: {},
      selectedRequestIds: new Set(),

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

      // Delete a single request
      deleteRequest: (requestId: string) => {
        set((state) => {
          const newRequests = state.requests.filter((r) => r.id !== requestId);
          const newSelectedRequest = state.selectedRequest?.id === requestId ? null : state.selectedRequest;

          // Also remove from selection if selected
          const newSelectedIds = new Set(state.selectedRequestIds);
          newSelectedIds.delete(requestId);

          // Remove AI analysis for this request
          const newAiAnalyses = new Map(state.aiAnalyses);
          newAiAnalyses.delete(requestId);

          return {
            requests: newRequests,
            selectedRequest: newSelectedRequest,
            selectedRequestIds: newSelectedIds,
            aiAnalyses: newAiAnalyses,
          };
        });
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
        const { requests, filter, domainFilters, domainFiltersEnabled, aiAnalyses, aiFilter } = get();

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

          // Domain filters
          if (domainFiltersEnabled) {
            const enabledFilters = domainFilters.filter((f) => f.enabled);
            for (const filter of enabledFilters) {
              if (matchesDomainPattern(req.url, filter.pattern)) {
                return false; // Filter out this request
              }
            }
          }

          // AI Analysis filter - analyzed/not analyzed
          if (aiFilter.analyzed !== undefined) {
            const hasAIAnalysis = aiAnalyses.has(req.id);
            if (aiFilter.analyzed && !hasAIAnalysis) {
              return false; // Show only analyzed, but this one is not
            }
            if (!aiFilter.analyzed && hasAIAnalysis) {
              return false; // Show only not analyzed, but this one is
            }
          }

          // AI Severity filter
          if (aiFilter.severity) {
            const analysis = aiAnalyses.get(req.id);
            if (!analysis || analysis.severity !== aiFilter.severity) {
              return false; // Not matching severity
            }
          }

          return true;
        });
      },

      // Toggle domain filters on/off
      toggleDomainFilters: () => {
        set((state) => ({
          domainFiltersEnabled: !state.domainFiltersEnabled,
        }));
      },

      // Add a custom domain filter
      addDomainFilter: (pattern: string, category: string = 'Custom') => {
        set((state) => ({
          domainFilters: [
            ...state.domainFilters,
            {
              id: `custom-${Date.now()}`,
              pattern,
              category,
              enabled: true,
              custom: true,
            },
          ],
        }));
      },

      // Remove a domain filter
      removeDomainFilter: (filterId: string) => {
        set((state) => ({
          domainFilters: state.domainFilters.filter((f) => f.id !== filterId),
        }));
      },

      // Toggle a domain filter on/off
      toggleDomainFilter: (filterId: string) => {
        set((state) => ({
          domainFilters: state.domainFilters.map((f) =>
            f.id === filterId ? { ...f, enabled: !f.enabled } : f
          ),
        }));
      },

      // Reset to default filters
      resetDomainFilters: () => {
        set({
          domainFilters: DEFAULT_DOMAIN_FILTERS.map((f, i) => ({ ...f, id: `default-${i}` })),
        });
      },

      // Get count of filtered requests
      getFilteredCount: () => {
        const { requests, domainFilters, domainFiltersEnabled } = get();

        if (!domainFiltersEnabled) return 0;

        const enabledFilters = domainFilters.filter((f) => f.enabled);
        return requests.filter((req) => {
          for (const filter of enabledFilters) {
            if (matchesDomainPattern(req.url, filter.pattern)) {
              return true;
            }
          }
          return false;
        }).length;
      },

      // AI Analysis Actions
      setRequestAnalysis: (requestId: string, analysis: Omit<AIAnalysisInfo, 'requestId'>) => {
        set((state) => {
          const newAnalyses = new Map(state.aiAnalyses);
          newAnalyses.set(requestId, {
            requestId,
            ...analysis,
          });
          return { aiAnalyses: newAnalyses };
        });
      },

      getRequestAnalysis: (requestId: string) => {
        return get().aiAnalyses.get(requestId);
      },

      hasAnalysis: (requestId: string) => {
        return get().aiAnalyses.has(requestId);
      },

      setAIFilter: (filter: Partial<RequestsState['aiFilter']>) => {
        set((state) => ({
          aiFilter: { ...state.aiFilter, ...filter },
        }));
      },

      clearAIFilter: () => {
        set({ aiFilter: {} });
      },

      // Batch Selection Actions
      toggleRequestSelection: (requestId: string) => {
        set((state) => {
          const newSelection = new Set(state.selectedRequestIds);
          if (newSelection.has(requestId)) {
            newSelection.delete(requestId);
          } else {
            newSelection.add(requestId);
          }
          return { selectedRequestIds: newSelection };
        });
      },

      selectAllRequests: () => {
        const filteredRequests = get().getFilteredRequests();
        set({
          selectedRequestIds: new Set(filteredRequests.map((r) => r.id)),
        });
      },

      clearSelection: () => {
        set({ selectedRequestIds: new Set() });
      },

      getSelectedRequests: () => {
        const { requests, selectedRequestIds } = get();
        return requests.filter((r) => selectedRequestIds.has(r.id));
      },
    }),
    {
      name: 'requests-storage',
      partialize: (state) => ({
        domainFilters: state.domainFilters,
        domainFiltersEnabled: state.domainFiltersEnabled,
      }),
    }
  )
);
