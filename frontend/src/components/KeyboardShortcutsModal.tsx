import { X } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  title: string;
  shortcuts: Array<{
    keys: string[];
    description: string;
  }>;
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'Selection',
    shortcuts: [
      { keys: ['Shift', 'Click'], description: 'Range selection' },
      { keys: ['Ctrl', 'A'], description: 'Select all' },
      { keys: ['Esc'], description: 'Deselect all' },
    ],
  },
  {
    title: 'Actions',
    shortcuts: [
      { keys: ['Shift', 'F'], description: 'Forward selected requests' },
      { keys: ['Shift', 'D'], description: 'Drop selected requests' },
      { keys: ['Ctrl', 'R'], description: 'Send to Repeater' },
      { keys: ['Ctrl', 'Z'], description: 'Undo last action' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo action' },
      { keys: ['Ctrl', 'Y'], description: 'Redo action (alternative)' },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['Ctrl', '/'], description: 'Toggle this help panel' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
    ],
  },
  {
    title: 'Intercept Control',
    shortcuts: [
      { keys: ['Ctrl', 'I'], description: 'Toggle intercept mode' },
    ],
  },
];

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <span className="text-2xl">⌨️</span>
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800 rounded"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-80px)] p-6">
          <div className="space-y-6">
            {shortcutGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-800/50 transition-colors"
                    >
                      <span className="text-gray-300">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex} className="flex items-center gap-1">
                            <kbd className="px-2 py-1 text-xs font-semibold text-gray-300 bg-gray-800 border border-gray-600 rounded shadow-sm">
                              {key}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="text-gray-500 text-xs">+</span>
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

          {/* Footer tip */}
          <div className="mt-8 p-4 bg-blue-900/20 border border-blue-800/30 rounded-lg">
            <p className="text-sm text-blue-300">
              <strong>💡 Pro Tip:</strong> Most shortcuts work when you have requests selected in the Intercept panel.
              Use <kbd className="px-1.5 py-0.5 text-xs bg-gray-800 border border-gray-600 rounded">Shift</kbd>+
              <kbd className="px-1.5 py-0.5 text-xs bg-gray-800 border border-gray-600 rounded">Click</kbd> for quick
              multi-selection!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
