import { useEffect, useRef, useCallback } from 'react';

/**
 * Advanced keyboard shortcuts for power users
 * Vim-like navigation and quick actions
 */

export interface AdvancedShortcutHandlers {
  // Navigation
  onSelectNext?: () => void;
  onSelectPrevious?: () => void;
  onJumpToTop?: () => void;
  onJumpToBottom?: () => void;

  // Quick actions
  onOpenTagMenu?: () => void;
  onFocusSearch?: () => void;
  onSelectAll?: () => void;
  onToggleEdit?: () => void;

  // Views
  onSwitchToHistory?: () => void;
  onSwitchToIntercept?: () => void;
  onSwitchToRepeater?: () => void;
  onSwitchToDecoder?: () => void;
  onSwitchToIntruder?: () => void;
}

export interface UseAdvancedShortcutsOptions {
  enabled?: boolean;
  vimMode?: boolean; // Enable Vim-like navigation
}

export function useAdvancedShortcuts(
  handlers: AdvancedShortcutHandlers,
  options: UseAdvancedShortcutsOptions = {}
) {
  const { enabled = true, vimMode = true } = options;
  const lastKeyRef = useRef<string | null>(null);
  const lastKeyTimeRef = useRef<number>(0);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Exception: '/' to focus search
        if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          handlers.onFocusSearch?.();
        }
        return;
      }

      const now = Date.now();
      const timeSinceLastKey = now - lastKeyTimeRef.current;

      // Handle 'gg' (jump to top) - two 'g' keys within 500ms
      if (vimMode && e.key === 'g' && lastKeyRef.current === 'g' && timeSinceLastKey < 500) {
        e.preventDefault();
        handlers.onJumpToTop?.();
        lastKeyRef.current = null;
        return;
      }

      // Single key shortcuts
      switch (e.key) {
        // Navigation (Vim-like)
        case 'j':
          if (vimMode) {
            e.preventDefault();
            handlers.onSelectNext?.();
          }
          break;

        case 'k':
          if (vimMode) {
            e.preventDefault();
            handlers.onSelectPrevious?.();
          }
          break;

        case 'G':
          if (vimMode && e.shiftKey) {
            e.preventDefault();
            handlers.onJumpToBottom?.();
          }
          break;

        // Quick actions
        case 't':
          e.preventDefault();
          handlers.onOpenTagMenu?.();
          break;

        case '/':
          e.preventDefault();
          handlers.onFocusSearch?.();
          break;

        case 'a':
          e.preventDefault();
          handlers.onSelectAll?.();
          break;

        case 'i':
          e.preventDefault();
          handlers.onToggleEdit?.();
          break;

        // View switching (1-5)
        case '1':
          e.preventDefault();
          handlers.onSwitchToHistory?.();
          break;

        case '2':
          e.preventDefault();
          handlers.onSwitchToIntercept?.();
          break;

        case '3':
          e.preventDefault();
          handlers.onSwitchToRepeater?.();
          break;

        case '4':
          e.preventDefault();
          handlers.onSwitchToDecoder?.();
          break;

        case '5':
          e.preventDefault();
          handlers.onSwitchToIntruder?.();
          break;
      }

      // Store last key and time for 'gg' detection
      lastKeyRef.current = e.key;
      lastKeyTimeRef.current = now;
    },
    [enabled, vimMode, handlers]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);
}

/**
 * Hook for managing Vim mode preference
 * Stored in localStorage
 */
export function useVimMode() {
  const getVimMode = useCallback(() => {
    const stored = localStorage.getItem('vimMode');
    return stored ? JSON.parse(stored) : true; // Enabled by default
  }, []);

  const setVimMode = useCallback((enabled: boolean) => {
    localStorage.setItem('vimMode', JSON.stringify(enabled));
  }, []);

  return { vimMode: getVimMode(), setVimMode };
}
