import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Attack Types
 */
export type AttackType = 'sniper' | 'battering_ram' | 'pitchfork' | 'cluster_bomb';

/**
 * Payload Types
 */
export type PayloadType =
  | 'simple_list'
  | 'numbers'
  | 'sqli'
  | 'xss'
  | 'lfi'
  | 'command_injection'
  | 'custom';

/**
 * Payload Position (§marker§ in template)
 */
export interface PayloadPosition {
  id: string;
  start: number;
  end: number;
  payloadSetId: string;
}

/**
 * Payload Set
 */
export interface PayloadSet {
  id: string;
  name: string;
  type: PayloadType;
  payloads: string[];
}

/**
 * Campaign Request Template
 */
export interface CampaignRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

/**
 * Campaign Configuration
 */
export interface Campaign {
  id: string;
  name: string;
  requestTemplate: CampaignRequest;
  payloadPositions: PayloadPosition[];
  payloadSets: PayloadSet[];
  attackType: AttackType;
  concurrency: number;
  delayMs: number;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'stopped';
  totalRequests: number;
  completedRequests: number;
  failedRequests: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

/**
 * Campaign Result
 */
export interface CampaignResult {
  id: string;
  campaignId: string;
  payloadSet: string[];
  request: any;
  statusCode?: number;
  responseLength?: number;
  responseTime?: number;
  response?: any;
  error?: string;
  timestamp: string;
}

/**
 * Campaign Progress
 */
export interface CampaignProgress {
  campaignId: string;
  status: Campaign['status'];
  totalRequests: number;
  completedRequests: number;
  failedRequests: number;
  currentProgress: number; // percentage
}

/**
 * Built-in Payload Info
 */
export interface BuiltinPayloadInfo {
  id: string;
  name: string;
  count: number;
}

/**
 * Intruder Store State
 */
interface IntruderState {
  // State
  campaigns: Campaign[];
  activeCampaignId: string | null;
  results: Map<string, CampaignResult[]>;
  progress: Map<string, CampaignProgress>;
  builtinPayloads: BuiltinPayloadInfo[];
  isLoading: boolean;
  error: string | null;

  // Draft Campaign (being created)
  draftCampaign: {
    name: string;
    request: CampaignRequest;
    rawTemplate: string; // Template with §markers§
    payloadPositions: PayloadPosition[];
    payloadSets: Map<string, PayloadSet>;
    attackType: AttackType;
    concurrency: number;
    delayMs: number;
  } | null;

  // Actions - Campaign Management
  fetchCampaigns: () => Promise<void>;
  fetchCampaign: (campaignId: string) => Promise<Campaign | null>;
  createCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt' | 'status' | 'totalRequests' | 'completedRequests' | 'failedRequests'>) => Promise<string>;
  deleteCampaign: (campaignId: string) => Promise<void>;
  setActiveCampaign: (campaignId: string) => void;

  // Actions - Campaign Control
  startCampaign: (campaignId: string) => Promise<void>;
  pauseCampaign: (campaignId: string) => Promise<void>;
  resumeCampaign: (campaignId: string) => Promise<void>;
  stopCampaign: (campaignId: string) => Promise<void>;
  fetchProgress: (campaignId: string) => Promise<void>;
  pollProgress: (campaignId: string) => Promise<void>;

  // Actions - Results
  fetchResults: (campaignId: string, filters?: { statusCode?: number; minLength?: number; maxLength?: number }) => Promise<void>;
  clearResults: (campaignId: string) => void;

  // Actions - Draft Campaign
  startDraft: (request?: CampaignRequest) => void;
  updateDraftName: (name: string) => void;
  updateDraftTemplate: (template: string) => void;
  parseMarkers: () => void; // Parse §markers§ from rawTemplate
  updatePayloadSet: (positionId: string, payloadSet: PayloadSet) => void;
  updateAttackType: (attackType: AttackType) => void;
  updateConcurrency: (concurrency: number) => void;
  updateDelay: (delayMs: number) => void;
  saveDraft: () => Promise<string | null>;
  cancelDraft: () => void;

  // Actions - Payloads
  fetchBuiltinPayloads: () => Promise<void>;
  generateNumberPayloads: (from: number, to: number, step: number) => Promise<string[]>;

  // Utility
  getActiveCampaign: () => Campaign | null;
  getCampaignResults: (campaignId: string) => CampaignResult[];
  getCampaignProgress: (campaignId: string) => CampaignProgress | null;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

/**
 * Intruder Store
 */
export const useIntruderStore = create<IntruderState>()(
  persist(
    (set, get) => ({
      // Initial state
      campaigns: [],
      activeCampaignId: null,
      results: new Map(),
      progress: new Map(),
      builtinPayloads: [],
      isLoading: false,
      error: null,
      draftCampaign: null,

      // Fetch all campaigns
      fetchCampaigns: async () => {
        set({ isLoading: true, error: null });

        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${BACKEND_URL}/api/intruder/campaigns`, {
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
            },
          });

          const data = await response.json();

          if (!data.success) {
            throw new Error(data.error?.message || 'Failed to fetch campaigns');
          }

          set({ campaigns: data.data, isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch campaigns'
          });
        }
      },

      // Fetch single campaign
      fetchCampaign: async (campaignId: string) => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${BACKEND_URL}/api/intruder/campaigns/${campaignId}`, {
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
            },
          });

          const data = await response.json();

          if (!data.success) {
            throw new Error(data.error?.message || 'Failed to fetch campaign');
          }

          // Update campaign in list
          set((state) => ({
            campaigns: state.campaigns.map((c) => (c.id === campaignId ? data.data : c)),
          }));

          return data.data;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch campaign' });
          return null;
        }
      },

      // Create campaign
      createCampaign: async (campaign) => {
        set({ isLoading: true, error: null });

        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${BACKEND_URL}/api/intruder/campaigns`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify(campaign),
          });

          const data = await response.json();

          if (!data.success) {
            throw new Error(data.error?.message || 'Failed to create campaign');
          }

          set((state) => ({
            campaigns: [data.data, ...state.campaigns],
            isLoading: false,
          }));

          return data.data.id;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to create campaign'
          });
          return '';
        }
      },

      // Delete campaign
      deleteCampaign: async (campaignId: string) => {
        try {
          const token = localStorage.getItem('token');
          await fetch(`${BACKEND_URL}/api/intruder/campaigns/${campaignId}`, {
            method: 'DELETE',
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
            },
          });

          set((state) => ({
            campaigns: state.campaigns.filter((c) => c.id !== campaignId),
            activeCampaignId: state.activeCampaignId === campaignId ? null : state.activeCampaignId,
          }));

          // Clear results and progress
          get().clearResults(campaignId);
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete campaign' });
        }
      },

      // Set active campaign
      setActiveCampaign: (campaignId: string) => {
        set({ activeCampaignId: campaignId });
      },

      // Start campaign
      startCampaign: async (campaignId: string) => {
        try {
          const token = localStorage.getItem('token');
          await fetch(`${BACKEND_URL}/api/intruder/campaigns/${campaignId}/start`, {
            method: 'POST',
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
            },
          });

          // Update status
          set((state) => ({
            campaigns: state.campaigns.map((c) =>
              c.id === campaignId ? { ...c, status: 'running' as const } : c
            ),
          }));

          // Start polling progress
          get().pollProgress(campaignId);
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to start campaign' });
        }
      },

      // Pause campaign
      pauseCampaign: async (campaignId: string) => {
        try {
          const token = localStorage.getItem('token');
          await fetch(`${BACKEND_URL}/api/intruder/campaigns/${campaignId}/pause`, {
            method: 'POST',
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
            },
          });

          set((state) => ({
            campaigns: state.campaigns.map((c) =>
              c.id === campaignId ? { ...c, status: 'paused' as const } : c
            ),
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to pause campaign' });
        }
      },

      // Resume campaign
      resumeCampaign: async (campaignId: string) => {
        try {
          const token = localStorage.getItem('token');
          await fetch(`${BACKEND_URL}/api/intruder/campaigns/${campaignId}/resume`, {
            method: 'POST',
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
            },
          });

          set((state) => ({
            campaigns: state.campaigns.map((c) =>
              c.id === campaignId ? { ...c, status: 'running' as const } : c
            ),
          }));

          // Resume polling progress
          get().pollProgress(campaignId);
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to resume campaign' });
        }
      },

      // Stop campaign
      stopCampaign: async (campaignId: string) => {
        try {
          const token = localStorage.getItem('token');
          await fetch(`${BACKEND_URL}/api/intruder/campaigns/${campaignId}/stop`, {
            method: 'POST',
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
            },
          });

          set((state) => ({
            campaigns: state.campaigns.map((c) =>
              c.id === campaignId ? { ...c, status: 'stopped' as const } : c
            ),
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to stop campaign' });
        }
      },

      // Fetch progress
      fetchProgress: async (campaignId: string) => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${BACKEND_URL}/api/intruder/campaigns/${campaignId}/progress`, {
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
            },
          });

          const data = await response.json();

          if (data.success) {
            set((state) => {
              const newProgress = new Map(state.progress);
              newProgress.set(campaignId, data.data);
              return { progress: newProgress };
            });
          }
        } catch (error) {
          console.error('Failed to fetch progress:', error);
        }
      },

      // Poll progress (internal helper)
      pollProgress: async (campaignId: string) => {
        const interval = setInterval(async () => {
          const campaign = get().campaigns.find((c) => c.id === campaignId);
          if (!campaign || campaign.status === 'completed' || campaign.status === 'stopped') {
            clearInterval(interval);
            return;
          }

          await get().fetchProgress(campaignId);
        }, 2000); // Poll every 2 seconds
      },

      // Fetch results
      fetchResults: async (campaignId: string, filters = {}) => {
        try {
          const token = localStorage.getItem('token');
          const params = new URLSearchParams(filters as any);
          const response = await fetch(
            `${BACKEND_URL}/api/intruder/campaigns/${campaignId}/results?${params}`,
            {
              headers: {
                Authorization: token ? `Bearer ${token}` : '',
              },
            }
          );

          const data = await response.json();

          if (data.success) {
            set((state) => {
              const newResults = new Map(state.results);
              newResults.set(campaignId, data.data);
              return { results: newResults };
            });
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch results' });
        }
      },

      // Clear results
      clearResults: (campaignId: string) => {
        set((state) => {
          const newResults = new Map(state.results);
          const newProgress = new Map(state.progress);
          newResults.delete(campaignId);
          newProgress.delete(campaignId);
          return { results: newResults, progress: newProgress };
        });
      },

      // Start draft
      startDraft: (request) => {
        const defaultRequest: CampaignRequest = request || {
          method: 'GET',
          url: '',
          headers: {},
          body: '',
        };

        set({
          draftCampaign: {
            name: 'New Campaign',
            request: defaultRequest,
            rawTemplate: '',
            payloadPositions: [],
            payloadSets: new Map(),
            attackType: 'sniper',
            concurrency: 5,
            delayMs: 0,
          },
        });
      },

      // Update draft name
      updateDraftName: (name: string) => {
        set((state) => ({
          draftCampaign: state.draftCampaign ? { ...state.draftCampaign, name } : null,
        }));
      },

      // Update draft template
      updateDraftTemplate: (template: string) => {
        set((state) => ({
          draftCampaign: state.draftCampaign ? { ...state.draftCampaign, rawTemplate: template } : null,
        }));
      },

      // Parse markers from template
      parseMarkers: () => {
        const draft = get().draftCampaign;
        if (!draft) return;

        const markerRegex = /§([^§]+)§/g;
        const positions: PayloadPosition[] = [];
        let match;
        let index = 0;

        while ((match = markerRegex.exec(draft.rawTemplate)) !== null) {
          const id = `pos-${index++}`;
          positions.push({
            id,
            start: match.index,
            end: match.index + match[0].length,
            payloadSetId: '',
          });
        }

        set((state) => ({
          draftCampaign: state.draftCampaign ? { ...state.draftCampaign, payloadPositions: positions } : null,
        }));
      },

      // Update payload set for position
      updatePayloadSet: (positionId: string, payloadSet: PayloadSet) => {
        set((state) => {
          if (!state.draftCampaign) return state;

          const newPayloadSets = new Map(state.draftCampaign.payloadSets);
          newPayloadSets.set(positionId, payloadSet);

          return {
            draftCampaign: {
              ...state.draftCampaign,
              payloadSets: newPayloadSets,
            },
          };
        });
      },

      // Update attack type
      updateAttackType: (attackType: AttackType) => {
        set((state) => ({
          draftCampaign: state.draftCampaign ? { ...state.draftCampaign, attackType } : null,
        }));
      },

      // Update concurrency
      updateConcurrency: (concurrency: number) => {
        set((state) => ({
          draftCampaign: state.draftCampaign ? { ...state.draftCampaign, concurrency } : null,
        }));
      },

      // Update delay
      updateDelay: (delayMs: number) => {
        set((state) => ({
          draftCampaign: state.draftCampaign ? { ...state.draftCampaign, delayMs } : null,
        }));
      },

      // Save draft
      saveDraft: async () => {
        const draft = get().draftCampaign;
        if (!draft) return null;

        const payloadSets = Array.from(draft.payloadSets.values());

        const campaignId = await get().createCampaign({
          name: draft.name,
          requestTemplate: draft.request,
          payloadPositions: draft.payloadPositions,
          payloadSets,
          attackType: draft.attackType,
          concurrency: draft.concurrency,
          delayMs: draft.delayMs,
        });

        if (campaignId) {
          set({ draftCampaign: null });
        }

        return campaignId;
      },

      // Cancel draft
      cancelDraft: () => {
        set({ draftCampaign: null });
      },

      // Fetch builtin payloads
      fetchBuiltinPayloads: async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${BACKEND_URL}/api/intruder/payloads/builtin`, {
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
            },
          });

          const data = await response.json();

          if (data.success) {
            set({ builtinPayloads: data.data });
          }
        } catch (error) {
          console.error('Failed to fetch builtin payloads:', error);
        }
      },

      // Generate number payloads
      generateNumberPayloads: async (from: number, to: number, step: number) => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${BACKEND_URL}/api/intruder/payloads/generate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify({
              type: 'numbers',
              config: { from, to, step },
            }),
          });

          const data = await response.json();

          if (data.success) {
            return data.data.payloads;
          }

          return [];
        } catch (error) {
          console.error('Failed to generate number payloads:', error);
          return [];
        }
      },

      // Get active campaign
      getActiveCampaign: () => {
        const state = get();
        return state.campaigns.find((c) => c.id === state.activeCampaignId) || null;
      },

      // Get campaign results
      getCampaignResults: (campaignId: string) => {
        return get().results.get(campaignId) || [];
      },

      // Get campaign progress
      getCampaignProgress: (campaignId: string) => {
        return get().progress.get(campaignId) || null;
      },
    }),
    {
      name: 'intruder-storage',
      partialize: (state) => ({
        campaigns: state.campaigns,
        activeCampaignId: state.activeCampaignId,
        builtinPayloads: state.builtinPayloads,
      }),
    }
  )
);
