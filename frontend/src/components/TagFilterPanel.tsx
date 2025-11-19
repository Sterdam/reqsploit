import React, { useEffect } from 'react';
import { Filter, X } from 'lucide-react';
import { useTagStore } from '../stores/tagStore';

export const TagFilterPanel: React.FC = () => {
  const {
    tagStats,
    selectedTags,
    toggleTagFilter,
    clearTagFilters,
    loadTagStats,
  } = useTagStore();

  // Load stats on mount
  useEffect(() => {
    loadTagStats();
  }, [loadTagStats]);

  if (tagStats.length === 0) {
    return null; // Don't show panel if no tags used yet
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-300">Filter by Tags</h3>
          {selectedTags.length > 0 && (
            <span className="text-xs text-gray-500">({selectedTags.length} active)</span>
          )}
        </div>
        {selectedTags.length > 0 && (
          <button
            onClick={clearTagFilters}
            className="text-xs text-gray-400 hover:text-gray-300 transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {tagStats.map((stat) => {
          const isSelected = selectedTags.includes(stat.tag);
          return (
            <button
              key={stat.tag}
              onClick={() => toggleTagFilter(stat.tag)}
              className={`
                px-3 py-1.5 rounded-md text-xs font-medium transition-all
                ${
                  isSelected
                    ? 'ring-2 ring-offset-2 ring-offset-gray-800'
                    : 'opacity-70 hover:opacity-100'
                }
              `}
              style={{
                backgroundColor: `${stat.color}20`,
                color: stat.color,
                border: `1px solid ${stat.color}40`,
                ...(isSelected && {
                  ringColor: stat.color,
                }),
              }}
              title={`${stat.count} request${stat.count > 1 ? 's' : ''}`}
            >
              {stat.tag}
              <span className="ml-1.5 opacity-75">({stat.count})</span>
            </button>
          );
        })}
      </div>

      {selectedTags.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-400">
            Showing requests with: {selectedTags.join(', ')}
          </p>
        </div>
      )}
    </div>
  );
};
