import { create } from 'zustand';
import {
  aiAPI,
  type AIAnalysis,
  type TokenUsage,
} from '../lib/api';

/**
 * AI Store
 * Manages AI analysis state and token usage
 */

interface AIState {
  // State
  analyses: Map<string, AIAnalysis>; // requestId → analysis
  activeAnalysis: AIAnalysis | null;
  tokenUsage: TokenUsage | null;
  isAnalyzing: boolean;
  error: string | null;

  // Actions
  analyzeRequest: (requestId: string, type?: 'request' | 'response' | 'full') => Promise<void>;
  setActiveAnalysis: (requestId: string | null) => void;
  updateTokenUsage: (usage: TokenUsage) => void;
  loadTokenUsage: () => Promise<void>;
  clearError: () => void;
  getAnalysisForRequest: (requestId: string) => AIAnalysis | undefined;
}

export const useAIStore = create<AIState>((set, get) => ({
  // Initial state
  analyses: new Map(),
  activeAnalysis: null,
  tokenUsage: null,
  isAnalyzing: false,
  error: null,

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
  setActiveAnalysis: (requestId: string | null) => {
    if (!requestId) {
      set({ activeAnalysis: null });
      return;
    }

    const analysis = get().analyses.get(requestId);
    set({ activeAnalysis: analysis || null });
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
}));
