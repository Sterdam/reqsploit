/**
 * Layout Persistence Hook
 * Saves and restores panel sizes and workspace configuration
 */

import { useState, useEffect, useCallback } from 'react';

export interface LayoutConfig {
  panelSizes: {
    projects?: number;
    requests?: number;
    center?: number;
    ai?: number;
  };
  panelVisibility: {
    showProjects: boolean;
    showRequests: boolean;
    showAI: boolean;
  };
  centerTab: 'history' | 'intercept' | 'repeater' | 'decoder' | 'intruder';
}

const LAYOUT_STORAGE_KEY = 'reqsploit-layout-config';

const DEFAULT_LAYOUT: LayoutConfig = {
  panelSizes: {
    projects: 20,
    requests: 25,
    center: 35,
    ai: 20,
  },
  panelVisibility: {
    showProjects: true,
    showRequests: true,
    showAI: true,
  },
  centerTab: 'history',
};

export function useLayoutPersistence() {
  const [layout, setLayout] = useState<LayoutConfig>(DEFAULT_LAYOUT);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load layout from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as LayoutConfig;
        setLayout(parsed);
      }
    } catch (error) {
      console.error('Failed to load layout config:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save layout to localStorage
  const saveLayout = useCallback((newLayout: Partial<LayoutConfig>) => {
    setLayout((prev) => {
      const updated = {
        ...prev,
        ...newLayout,
        panelSizes: { ...prev.panelSizes, ...newLayout.panelSizes },
        panelVisibility: { ...prev.panelVisibility, ...newLayout.panelVisibility },
      };

      try {
        localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save layout config:', error);
      }

      return updated;
    });
  }, []);

  // Reset to default layout
  const resetLayout = useCallback(() => {
    setLayout(DEFAULT_LAYOUT);
    try {
      localStorage.removeItem(LAYOUT_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to reset layout config:', error);
    }
  }, []);

  // Update panel sizes
  const updatePanelSizes = useCallback(
    (sizes: Partial<LayoutConfig['panelSizes']>) => {
      saveLayout({ panelSizes: sizes });
    },
    [saveLayout]
  );

  // Update panel visibility
  const updatePanelVisibility = useCallback(
    (visibility: Partial<LayoutConfig['panelVisibility']>) => {
      setLayout((prev) => {
        const updated = {
          ...prev,
          panelVisibility: {
            ...prev.panelVisibility,
            ...visibility,
          },
        };
        try {
          localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(updated));
        } catch (error) {
          console.error('Failed to save layout config:', error);
        }
        return updated;
      });
    },
    []
  );

  // Update center tab
  const updateCenterTab = useCallback(
    (tab: LayoutConfig['centerTab']) => {
      saveLayout({ centerTab: tab });
    },
    [saveLayout]
  );

  return {
    layout,
    isLoaded,
    saveLayout,
    resetLayout,
    updatePanelSizes,
    updatePanelVisibility,
    updateCenterTab,
  };
}
