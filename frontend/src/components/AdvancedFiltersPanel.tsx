import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import { useRequestsStore } from '../stores/requestsStore';

export const AdvancedFiltersPanel: React.FC = () => {
  const { filter, setFilter } = useRequestsStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters =
    filter.searchScope ||
    filter.statusRange ||
    filter.minDuration !== undefined ||
    filter.maxDuration !== undefined ||
    filter.minSize !== undefined ||
    filter.maxSize !== undefined;

  const clearAdvancedFilters = () => {
    setFilter({
      searchScope: undefined,
      statusRange: undefined,
      minDuration: undefined,
      maxDuration: undefined,
      minSize: undefined,
      maxSize: undefined,
    });
  };

  if (!isExpanded && !hasActiveFilters) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-400 hover:text-white transition flex items-center justify-between"
      >
        <span className="flex items-center gap-2">
          <Filter className="w-3 h-3" />
          Advanced Filters
        </span>
        <ChevronDown className="w-3 h-3" />
      </button>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-3 h-3 text-blue-400" />
          <span className="text-xs font-medium text-gray-300">Advanced Filters</span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 bg-blue-600/20 rounded text-xs text-blue-400 border border-blue-600/30">
              Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearAdvancedFilters}
              className="text-xs text-red-400 hover:text-red-300 transition flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white transition"
          >
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Filters */}
      {isExpanded && (
        <div className="space-y-3">
          {/* Search Scope */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Search Scope</label>
            <div className="flex gap-1">
              {['all', 'url', 'headers', 'body'].map((scope) => (
                <button
                  key={scope}
                  onClick={() => setFilter({ searchScope: scope as any })}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    (filter.searchScope || 'all') === scope
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {scope.charAt(0).toUpperCase() + scope.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Status Range */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Status Code Range</label>
            <div className="flex gap-1">
              <button
                onClick={() => setFilter({ statusRange: undefined })}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  !filter.statusRange
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 text-gray-400 hover:text-white'
                }`}
              >
                All
              </button>
              {[
                { range: '2xx', label: '2xx', color: 'bg-green-600' },
                { range: '3xx', label: '3xx', color: 'bg-blue-600' },
                { range: '4xx', label: '4xx', color: 'bg-yellow-600' },
                { range: '5xx', label: '5xx', color: 'bg-red-600' },
              ].map(({ range, label, color }) => (
                <button
                  key={range}
                  onClick={() => setFilter({ statusRange: range as any })}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    filter.statusRange === range
                      ? `${color} text-white`
                      : 'bg-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Response Time (Duration) */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Response Time (ms)</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="number"
                  placeholder="Min (ms)"
                  value={filter.minDuration || ''}
                  onChange={(e) =>
                    setFilter({ minDuration: e.target.value ? Number(e.target.value) : undefined })
                  }
                  className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white placeholder-gray-500 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Max (ms)"
                  value={filter.maxDuration || ''}
                  onChange={(e) =>
                    setFilter({ maxDuration: e.target.value ? Number(e.target.value) : undefined })
                  }
                  className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white placeholder-gray-500 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Response Size */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Response Size (bytes)</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="number"
                  placeholder="Min (bytes)"
                  value={filter.minSize || ''}
                  onChange={(e) =>
                    setFilter({ minSize: e.target.value ? Number(e.target.value) : undefined })
                  }
                  className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white placeholder-gray-500 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Max (bytes)"
                  value={filter.maxSize || ''}
                  onChange={(e) =>
                    setFilter({ maxSize: e.target.value ? Number(e.target.value) : undefined })
                  }
                  className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white placeholder-gray-500 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Quick Presets</label>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setFilter({ minDuration: 1000 })}
                className="px-2 py-1 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded text-xs transition border border-yellow-600/30"
              >
                Slow (&gt;1s)
              </button>
              <button
                onClick={() => setFilter({ minDuration: 5000 })}
                className="px-2 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-xs transition border border-red-600/30"
              >
                Very Slow (&gt;5s)
              </button>
              <button
                onClick={() => setFilter({ minSize: 1048576 })}
                className="px-2 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded text-xs transition border border-purple-600/30"
              >
                Large (&gt;1MB)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
