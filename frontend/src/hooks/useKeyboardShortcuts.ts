import { useEffect } from 'react';

/**
 * Keyboard Shortcuts Configuration
 * Professional Burp Suite-like shortcuts
 */
export type ShortcutAction =
  | 'toggle-intercept'
  | 'send-to-repeater'
  | 'open-decoder'
  | 'send-to-intruder'
  | 'focus-search'
  | 'save-current'
  | 'close-tab'
  | 'next-tab'
  | 'prev-tab'
  | 'new-tab';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: ShortcutAction;
  description: string;
}

/**
 * Global keyboard shortcuts
 */
const SHORTCUTS: ShortcutConfig[] = [
  // Navigation
  { key: 'i', ctrl: true, action: 'toggle-intercept', description: 'Toggle Intercept Mode' },
  { key: 'r', ctrl: true, action: 'send-to-repeater', description: 'Send to Repeater' },
  { key: 'd', ctrl: true, action: 'open-decoder', description: 'Open Decoder' },
  { key: 'i', ctrl: true, shift: true, action: 'send-to-intruder', description: 'Send to Intruder' },

  // Search & Actions
  { key: 'f', ctrl: true, action: 'focus-search', description: 'Focus Search' },
  { key: 's', ctrl: true, action: 'save-current', description: 'Save Current' },

  // Tab Management
  { key: 'w', ctrl: true, action: 'close-tab', description: 'Close Current Tab' },
  { key: 'Tab', ctrl: true, action: 'next-tab', description: 'Next Tab' },
  { key: 'Tab', ctrl: true, shift: true, action: 'prev-tab', description: 'Previous Tab' },
  { key: 't', ctrl: true, action: 'new-tab', description: 'New Tab' },
];

/**
 * Hook for global keyboard shortcuts
 */
export function useKeyboardShortcuts(
  onShortcut: (action: ShortcutAction) => void,
  options?: {
    enabled?: boolean;
    preventDefault?: boolean;
  }
) {
  const { enabled = true, preventDefault = true } = options || {};

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Find matching shortcut
      const shortcut = SHORTCUTS.find((s) => {
        const keyMatch = event.key.toLowerCase() === s.key.toLowerCase();
        const ctrlMatch = s.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = s.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = s.alt ? event.altKey : !event.altKey;

        return keyMatch && ctrlMatch && shiftMatch && altMatch;
      });

      if (shortcut) {
        if (preventDefault) {
          event.preventDefault();
        }
        onShortcut(shortcut.action);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, preventDefault, onShortcut]);
}

/**
 * Get all shortcuts for help menu
 */
export function getShortcuts(): ShortcutConfig[] {
  return SHORTCUTS;
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: ShortcutConfig): string {
  const parts: string[] = [];

  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.alt) parts.push('Alt');
  parts.push(shortcut.key === ' ' ? 'Space' : shortcut.key.toUpperCase());

  return parts.join('+');
}
