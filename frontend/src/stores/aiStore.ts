import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  aiAPI,
  type AIAnalysis,
  type TokenUsage,
} from '../lib/api';

// Re-export types for convenience
export type { AIAnalysis as AIAnalysisResult, AISuggestion, Vulnerability } from '../lib/api';

/**
 * AI Store
 * Manages AI analysis state, token usage, credits, and model selection
 */

export type AIModel = 'haiku-4.5' | 'sonnet-4.5' | 'auto';
export type AIMode = 'EDUCATIONAL' | 'DEFAULT' | 'ADVANCED';

export type AIAction =
  | 'analyzeRequest'
  | 'analyzeResponse'
  | 'analyzeTransaction'
  | 'generateExploits'
  | 'generatePayloads'
  | 'securityCheck'
  | 'explain'
  | 'quickScan'
  | 'deepScan'
  | 'suggestTests'
  | 'generateDorks'
  | 'attackChain';

export interface CreditBalance {
  used: number;
  limit: number;
  available: number;
  resetDate: string;
}

export interface ActionCost {
  action: AIAction;
  haiku: number;
  sonnet: number;
}

interface AIState {
  // State
  analyses: Map<string, AIAnalysis>; // requestId → analysis
  activeAnalysis: AIAnalysis | null;
  currentAnalysis: AIAnalysis | null; // For InterceptPanel
  interceptAnalysis: AIAnalysis | null; // For InterceptPanel inline display
  shouldShowAIPanel: boolean; // Trigger to auto-open AI panel
  tokenUsage: TokenUsage | null;
  isAnalyzing: boolean;
  error: string | null;

  // New AI features
  model: AIModel;
  mode: AIMode;
  credits: CreditBalance | null;
  actionCosts: ActionCost[];
  isLoadingCredits: boolean;

  // Actions
  analyzeRequest: (requestId: string, type?: 'request' | 'response' | 'full') => Promise<void>;
  setActiveAnalysis: (analysis: AIAnalysis | null, openPanel?: boolean) => void;
  setCurrentAnalysis: (analysis: AIAnalysis | null) => void;
  setInterceptAnalysis: (analysis: AIAnalysis | null) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setShouldShowAIPanel: (show: boolean) => void;
  clearCurrentAnalysis: () => void;
  clearInterceptAnalysis: () => void;
  updateTokenUsage: (usage: TokenUsage) => void;
  loadTokenUsage: () => Promise<void>;
  clearError: () => void;
  getAnalysisForRequest: (requestId: string) => AIAnalysis | undefined;

  // New AI actions
  setModel: (model: AIModel) => void;
  setMode: (mode: AIMode) => void;
  setCredits: (credits: CreditBalance) => void;
  setActionCosts: (costs: ActionCost[]) => void;
  setIsLoadingCredits: (loading: boolean) => void;
  fetchCredits: () => Promise<void>;
  fetchActionCosts: () => Promise<void>;
  getEstimatedCost: (action: AIAction) => number | null;
  canAfford: (action: AIAction) => boolean;
}

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      // Initial state
      analyses: new Map(),
      activeAnalysis: null,
      currentAnalysis: null,
      interceptAnalysis: null,
      shouldShowAIPanel: false,
      tokenUsage: null,
      isAnalyzing: false,
      error: null,

      // New AI features state
      model: 'haiku-4.5',
      mode: 'DEFAULT',
      credits: null,
      actionCosts: [],
      isLoadingCredits: false,

  // Analyze request
  analyzeRequest: async (
    requestId: string,
    type: 'request' | 'response' | 'full' = 'full'
  ) => {
    set({ isAnalyzing: true, error: null });
    try {
      let analysis: AIAnalysis;

      switch (type) {
        case 'request':
          analysis = await aiAPI.analyzeRequest(requestId);
          break;
        case 'response':
          analysis = await aiAPI.analyzeResponse(requestId);
          break;
        case 'full':
          analysis = await aiAPI.analyzeTransaction(requestId);
          break;
      }

      set((state) => {
        const newAnalyses = new Map(state.analyses);
        newAnalyses.set(requestId, analysis);

        return {
          analyses: newAnalyses,
          activeAnalysis: analysis,
          isAnalyzing: false,
        };
      });

      // Load updated token usage
      await get().loadTokenUsage();
    } catch (error: any) {
      set({
        error: error.response?.data?.error?.message || 'AI analysis failed',
        isAnalyzing: false,
      });
      throw error;
    }
  },

  // Set active analysis
  setActiveAnalysis: (analysis: AIAnalysis | null, openPanel: boolean = false) => {
    set({
      activeAnalysis: analysis,
      shouldShowAIPanel: openPanel
    });
  },

  // Set current analysis (for InterceptPanel)
  setCurrentAnalysis: (analysis: AIAnalysis | null) => {
    set({ currentAnalysis: analysis });
  },

  // Set intercept analysis (for InterceptPanel inline display)
  setInterceptAnalysis: (analysis: AIAnalysis | null) => {
    set({ interceptAnalysis: analysis });
  },

  // Set analyzing state
  setIsAnalyzing: (analyzing: boolean) => {
    set({ isAnalyzing: analyzing });
  },

  // Set should show AI panel flag
  setShouldShowAIPanel: (show: boolean) => {
    set({ shouldShowAIPanel: show });
  },

  // Clear current analysis
  clearCurrentAnalysis: () => {
    set({ currentAnalysis: null });
  },

  // Clear intercept analysis
  clearInterceptAnalysis: () => {
    set({ interceptAnalysis: null });
  },

  // Update token usage (from WebSocket)
  updateTokenUsage: (usage: TokenUsage) => {
    set({ tokenUsage: usage });
  },

  // Load token usage
  loadTokenUsage: async () => {
    try {
      const usage = await aiAPI.getTokenUsage();
      set({ tokenUsage: usage });
    } catch (error) {
      console.error('Failed to load token usage:', error);
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Get analysis for a specific request
  getAnalysisForRequest: (requestId: string) => {
    return get().analyses.get(requestId);
  },

  // New AI actions
  setModel: (model) => {
    console.log('🔧 aiStore.setModel called with:', model);
    set({ model });
    console.log('✅ aiStore.model updated to:', model);
  },
  setMode: (mode) => set({ mode }),
  setCredits: (credits) => set({ credits }),
  setActionCosts: (costs) => set({ actionCosts: costs }),
  setIsLoadingCredits: (loading) => set({ isLoadingCredits: loading }),

  // Deprecated: Use loadTokenUsage instead
  fetchCredits: async () => {
    console.warn('fetchCredits is deprecated, use loadTokenUsage instead');
    return get().loadTokenUsage();
  },

  // Fetch action costs
  fetchActionCosts: async () => {
    try {
      const pricingData = await aiAPI.getPricing();
      set({ actionCosts: pricingData.actions as ActionCost[] });
    } catch (error) {
      console.error('Failed to fetch action costs:', error);
    }
  },

  // Get estimated cost for an action
  getEstimatedCost: (action) => {
    const { model, actionCosts } = get();
    const cost = actionCosts.find((c) => c.action === action);

    if (!cost) return null;

    // Auto mode uses Haiku by default
    if (model === 'auto' || model === 'haiku-4.5') {
      return cost.haiku;
    }

    return cost.sonnet;
  },

  // Check if user can afford an action
  canAfford: (action) => {
    const { tokenUsage } = get();
    const cost = get().getEstimatedCost(action);

    if (!tokenUsage || cost === null) return false;

    return tokenUsage.remaining >= cost;
  },
    }),
    {
      name: 'ai-store',
      partialize: (state) => ({
        model: state.model,
        mode: state.mode,
      }),
    }
  )
);
