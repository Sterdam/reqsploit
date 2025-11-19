import { CheckSquare, Square, FilterX, Tag } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { TagSelector } from './TagSelector';

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  selectedRequestIds: string[];
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkForward: () => void;
  onBulkDrop: () => void;
  onBulkSendToRepeater: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  totalCount,
  selectedRequestIds,
  onSelectAll,
  onDeselectAll,
  onBulkForward,
  onBulkDrop,
  onBulkSendToRepeater,
}: BulkActionsToolbarProps) {
  const [showTagSelector, setShowTagSelector] = useState(false);
  const tagButtonRef = useRef<HTMLButtonElement>(null);

  // Close tag selector on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showTagSelector) {
        setShowTagSelector(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showTagSelector]);

  if (selectedCount === 0) return null;

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-4 py-2 flex items-center gap-4 relative">
      <div className="flex items-center gap-2">
        <button
          onClick={selectedCount === totalCount ? onDeselectAll : onSelectAll}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          title={selectedCount === totalCount ? 'Deselect all' : 'Select all'}
        >
          {selectedCount === totalCount ? (
            <CheckSquare className="w-5 h-5" />
          ) : (
            <Square className="w-5 h-5" />
          )}
        </button>
        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
          {selectedCount} selected
        </span>
      </div>

      <div className="flex-1 flex items-center gap-2">
        <button
          onClick={onBulkForward}
          className="w-8 h-8 bg-green-600 hover:bg-green-700 text-white rounded flex items-center justify-center font-bold transition-colors"
          title={`Forward ${selectedCount} selected (Shift+F)`}
        >
          F
        </button>

        <button
          onClick={onBulkDrop}
          className="w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded flex items-center justify-center font-bold transition-colors"
          title={`Drop ${selectedCount} selected (Shift+D)`}
        >
          D
        </button>

        <button
          onClick={onBulkSendToRepeater}
          className="w-8 h-8 bg-purple-600 hover:bg-purple-700 text-white rounded flex items-center justify-center font-bold transition-colors"
          title={`Send ${selectedCount} to Repeater (Ctrl+R)`}
        >
          R
        </button>

        <button
          ref={tagButtonRef}
          onClick={() => setShowTagSelector(!showTagSelector)}
          className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center justify-center transition-colors"
          title={`Tag ${selectedCount} selected (T)`}
        >
          <Tag className="w-4 h-4" />
        </button>

        <button
          onClick={onDeselectAll}
          className="w-8 h-8 bg-gray-600 hover:bg-gray-700 text-white rounded flex items-center justify-center transition-colors"
          title="Clear selection (Esc)"
        >
          <FilterX className="w-4 h-4" />
        </button>
      </div>

      {/* Tag Selector Popup */}
      {showTagSelector && (
        <div className="absolute left-0 top-full mt-1 z-50">
          <TagSelector
            requestIds={selectedRequestIds}
            onClose={() => setShowTagSelector(false)}
          />
        </div>
      )}
    </div>
  );
}
