/**
 * Keyboard Shortcut Help Modal
 * Displays all available keyboard shortcuts (Shift+?)
 */

import { useEffect, useState } from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutGroup {
  title: string;
  shortcuts: {
    keys: string[];
    description: string;
  }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['Ctrl', 'I'], description: 'Toggle Intercept Mode' },
      { keys: ['Ctrl', 'R'], description: 'Send to Repeater' },
      { keys: ['Ctrl', 'D'], description: 'Open Decoder' },
      { keys: ['Ctrl', 'Shift', 'I'], description: 'Send to Intruder' },
      { keys: ['Ctrl', 'Tab'], description: 'Next Tab' },
      { keys: ['Ctrl', 'Shift', 'Tab'], description: 'Previous Tab' },
    ],
  },
  {
    title: 'Actions',
    shortcuts: [
      { keys: ['Ctrl', 'S'], description: 'Save Current Tab' },
      { keys: ['Ctrl', 'F'], description: 'Focus Search' },
      { keys: ['Ctrl', 'W'], description: 'Close Current Tab' },
      { keys: ['Ctrl', 'T'], description: 'New Tab' },
    ],
  },
  {
    title: 'Help',
    shortcuts: [
      { keys: ['Shift', '?'], description: 'Show Keyboard Shortcuts' },
      { keys: ['Esc'], description: 'Close Modal' },
    ],
  },
];

export function KeyboardShortcutHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shift + ? to open modal
      if (e.shiftKey && e.key === '?') {
        e.preventDefault();
        setIsOpen(true);
      }

      // Escape to close modal
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-[#0D1F2D] border border-white/20 rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-[#0A1929] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Keyboard className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-white/10 rounded transition text-white/60 hover:text-white"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          <div className="space-y-6">
            {SHORTCUT_GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-3">
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 bg-white/5 rounded hover:bg-white/10 transition"
                    >
                      <span className="text-white/90 text-sm">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex} className="flex items-center gap-1">
                            <kbd className="px-2 py-1 bg-[#0A1929] border border-white/20 rounded text-xs font-mono text-white/80 shadow-sm">
                              {key}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="text-white/40 text-xs">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Tip */}
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded text-sm text-blue-400">
            <p className="font-medium mb-1">💡 Pro Tip</p>
            <p className="text-white/60">
              Press <kbd className="px-1.5 py-0.5 bg-blue-500/20 rounded text-xs">Shift</kbd> +{' '}
              <kbd className="px-1.5 py-0.5 bg-blue-500/20 rounded text-xs">?</kbd> anytime to
              view this help modal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
