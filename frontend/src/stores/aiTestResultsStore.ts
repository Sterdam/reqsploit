/**
 * AI Test Results Store
 * Manages AI test execution results across all repeater tabs
 */

import { create } from 'zustand';
import type { TestExecutionResult } from '../components/AITestResults';

interface AITestSuggestion {
  id: string;
  name: string;
  description: string;
  category: 'sqli' | 'xss' | 'auth' | 'authz' | 'injection' | 'validation' | 'ratelimit' | 'other';
  severity: 'critical' | 'high' | 'medium' | 'low';
  variations: Array<{
    description: string;
    method: string;
    url?: string;
    headers?: Record<string, string>;
    body?: string;
  }>;
  indicators: string[];
}

interface AITestSuggestionsData {
  tests: AITestSuggestion[];
  summary: string;
  tokensUsed: number;
}

interface AITestResultsState {
  // Test suggestions per tab
  suggestionsByTab: Map<string, AITestSuggestionsData>;

  // Test execution results per tab
  resultsByTab: Map<string, TestExecutionResult[]>;

  // Actions
  setSuggestions: (tabId: string, suggestions: AITestSuggestionsData) => void;
  getSuggestions: (tabId: string) => AITestSuggestionsData | null;

  addTestResult: (tabId: string, result: TestExecutionResult) => void;
  updateTestResult: (tabId: string, resultIndex: number, updates: Partial<TestExecutionResult>) => void;
  getTestResults: (tabId: string) => TestExecutionResult[];
  clearTestResults: (tabId: string) => void;

  // Clear all data for a tab
  clearTabData: (tabId: string) => void;
}

export const useAITestResultsStore = create<AITestResultsState>((set, get) => ({
  suggestionsByTab: new Map(),
  resultsByTab: new Map(),

  setSuggestions: (tabId, suggestions) => {
    set((state) => {
      const newMap = new Map(state.suggestionsByTab);
      newMap.set(tabId, suggestions);
      return { suggestionsByTab: newMap };
    });
  },

  getSuggestions: (tabId) => {
    return get().suggestionsByTab.get(tabId) || null;
  },

  addTestResult: (tabId, result) => {
    set((state) => {
      const newMap = new Map(state.resultsByTab);
      const currentResults = newMap.get(tabId) || [];
      newMap.set(tabId, [...currentResults, result]);
      return { resultsByTab: newMap };
    });
  },

  updateTestResult: (tabId, resultIndex, updates) => {
    set((state) => {
      const newMap = new Map(state.resultsByTab);
      const currentResults = newMap.get(tabId) || [];

      if (resultIndex >= 0 && resultIndex < currentResults.length) {
        const updatedResults = [...currentResults];
        updatedResults[resultIndex] = { ...updatedResults[resultIndex], ...updates };
        newMap.set(tabId, updatedResults);
      }

      return { resultsByTab: newMap };
    });
  },

  getTestResults: (tabId) => {
    return get().resultsByTab.get(tabId) || [];
  },

  clearTestResults: (tabId) => {
    set((state) => {
      const newMap = new Map(state.resultsByTab);
      newMap.set(tabId, []);
      return { resultsByTab: newMap };
    });
  },

  clearTabData: (tabId) => {
    set((state) => {
      const newSuggestions = new Map(state.suggestionsByTab);
      const newResults = new Map(state.resultsByTab);
      newSuggestions.delete(tabId);
      newResults.delete(tabId);
      return {
        suggestionsByTab: newSuggestions,
        resultsByTab: newResults,
      };
    });
  },
}));
