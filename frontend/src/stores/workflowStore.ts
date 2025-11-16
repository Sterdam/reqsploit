import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WorkflowEvent, PanelType, panelBridge } from '../lib/panel-bridge';

/**
 * Workflow Store
 * Manages cross-panel state and workflow tracking
 */

export interface WorkflowState {
  // Active panel
  activePanel: PanelType;
  setActivePanel: (panel: PanelType) => void;

  // Workflow history
  workflowHistory: WorkflowEvent[];
  addWorkflowEvent: (event: WorkflowEvent) => void;
  clearWorkflowHistory: () => void;

  // Navigation state
  navigationStack: PanelType[];
  pushNavigation: (panel: PanelType) => void;
  popNavigation: () => PanelType | null;
  clearNavigation: () => void;

  // Workflow stats
  getWorkflowStats: () => {
    totalWorkflows: number;
    mostUsedAction: string | null;
    mostUsedSource: string | null;
    mostUsedTarget: string | null;
  };
}

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set, get) => ({
      // State
      activePanel: 'history',
      workflowHistory: [],
      navigationStack: [],

      // Actions
      setActivePanel: (panel) => {
        set({ activePanel: panel });
      },

      addWorkflowEvent: (event) => {
        set((state) => ({
          workflowHistory: [...state.workflowHistory, event].slice(-100), // Keep last 100
        }));
      },

      clearWorkflowHistory: () => {
        set({ workflowHistory: [] });
        panelBridge.clearHistory();
      },

      pushNavigation: (panel) => {
        set((state) => ({
          navigationStack: [...state.navigationStack, panel].slice(-20), // Keep last 20
        }));
      },

      popNavigation: () => {
        const { navigationStack } = get();
        if (navigationStack.length === 0) return null;

        const panel = navigationStack[navigationStack.length - 1];
        set({ navigationStack: navigationStack.slice(0, -1) });
        return panel;
      },

      clearNavigation: () => {
        set({ navigationStack: [] });
      },

      getWorkflowStats: () => {
        const { workflowHistory } = get();

        if (workflowHistory.length === 0) {
          return {
            totalWorkflows: 0,
            mostUsedAction: null,
            mostUsedSource: null,
            mostUsedTarget: null,
          };
        }

        // Count occurrences
        const actionCounts: Record<string, number> = {};
        const sourceCounts: Record<string, number> = {};
        const targetCounts: Record<string, number> = {};

        workflowHistory.forEach((event) => {
          actionCounts[event.action] = (actionCounts[event.action] || 0) + 1;
          sourceCounts[event.source] = (sourceCounts[event.source] || 0) + 1;
          targetCounts[event.target] = (targetCounts[event.target] || 0) + 1;
        });

        // Find most used
        const mostUsedAction =
          Object.keys(actionCounts).reduce((a, b) => (actionCounts[a] > actionCounts[b] ? a : b), '') || null;
        const mostUsedSource =
          Object.keys(sourceCounts).reduce((a, b) => (sourceCounts[a] > sourceCounts[b] ? a : b), '') || null;
        const mostUsedTarget =
          Object.keys(targetCounts).reduce((a, b) => (targetCounts[a] > targetCounts[b] ? a : b), '') || null;

        return {
          totalWorkflows: workflowHistory.length,
          mostUsedAction,
          mostUsedSource,
          mostUsedTarget,
        };
      },
    }),
    {
      name: 'workflow-store',
      partialize: (state) => ({
        workflowHistory: state.workflowHistory.slice(-50), // Persist last 50
        navigationStack: state.navigationStack.slice(-10), // Persist last 10
      }),
    }
  )
);
