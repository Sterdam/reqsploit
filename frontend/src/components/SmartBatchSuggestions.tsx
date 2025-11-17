import { useState } from 'react';
import { aiAPI } from '../lib/api';
import { Sparkles, Check, Clock } from 'lucide-react';

/**
 * Smart Batch Suggestions Component (Module 3.3)
 * Shows intelligent grouping suggestions for batch processing
 */

interface RequestGroup {
  id: string;
  name: string;
  pattern: string;
  requests: string[];
  confidence: number;
  reason: string;
}

interface BatchSuggestion {
  groups: RequestGroup[];
  totalRequests: number;
  suggestedBatches: number;
  estimatedTimeSaving: number;
}

export function SmartBatchSuggestions({
  requestIds,
  onSelectGroup,
  onClose,
}: {
  requestIds: string[];
  onSelectGroup: (requestIds: string[]) => void;
  onClose: () => void;
}) {
  const [suggestions, setSuggestions] = useState<BatchSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const data = await aiAPI.suggestBatches(requestIds);
      setSuggestions(data);
    } catch (error) {
      console.error('Failed to load batch suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGroup = (group: RequestGroup) => {
    const newSelected = new Set(selectedGroups);
    if (newSelected.has(group.id)) {
      newSelected.delete(group.id);
    } else {
      newSelected.add(group.id);
    }
    setSelectedGroups(newSelected);
  };

  const handleApplySelection = () => {
    const allSelectedIds = suggestions?.groups
      .filter((g) => selectedGroups.has(g.id))
      .flatMap((g) => g.requests) || [];
    onSelectGroup(allSelectedIds);
    onClose();
  };

  if (!suggestions && !loading) {
    loadSuggestions();
  }

  return (
    <div className="bg-gray-900 border border-purple-500/30 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold">Smart Batch Suggestions</h3>
        </div>
        {suggestions && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            Save ~{suggestions.estimatedTimeSaving}s
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-4 text-gray-400">Analyzing patterns...</div>
      ) : suggestions && suggestions.groups.length > 0 ? (
        <>
          <div className="text-sm text-gray-400">
            Found {suggestions.suggestedBatches} intelligent groupings from {suggestions.totalRequests} requests
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {suggestions.groups.map((group) => {
              const isSelected = selectedGroups.has(group.id);
              return (
                <button
                  key={group.id}
                  onClick={() => handleSelectGroup(group)}
                  className={`w-full text-left p-3 rounded border ${
                    isSelected
                      ? 'bg-purple-500/20 border-purple-500'
                      : 'bg-gray-800 border-gray-700 hover:border-purple-500/50'
                  } transition-colors`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{group.name}</span>
                        <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                          {group.confidence}% match
                        </span>
                        <span className="text-xs text-gray-400">{group.requests.length} requests</span>
                      </div>
                      <div className="text-xs text-gray-400">{group.reason}</div>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-purple-400 flex-shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
            <button
              onClick={handleApplySelection}
              disabled={selectedGroups.size === 0}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 px-4 py-2 rounded font-medium transition-colors"
            >
              Apply Selection ({selectedGroups.size} groups)
            </button>
            <button onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors">
              Cancel
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-4 text-gray-400">
          Not enough requests to suggest groupings (minimum 5 required)
        </div>
      )}
    </div>
  );
}
