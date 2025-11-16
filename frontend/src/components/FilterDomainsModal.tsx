import { useState, useMemo } from 'react';
import { useRequestsStore, type DomainFilter } from '../stores/requestsStore';
import { X, Plus, Trash2, Filter, RotateCcw, Search } from 'lucide-react';

interface FilterDomainsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FilterDomainsModal({ isOpen, onClose }: FilterDomainsModalProps) {
  const {
    domainFilters,
    domainFiltersEnabled,
    toggleDomainFilters,
    addDomainFilter,
    removeDomainFilter,
    toggleDomainFilter,
    resetDomainFilters,
    getFilteredCount,
  } = useRequestsStore();

  const [newPattern, setNewPattern] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(domainFilters.map((f) => f.category));
    return ['all', ...Array.from(cats).sort()];
  }, [domainFilters]);

  // Filter domains by search and category
  const filteredDomains = useMemo(() => {
    return domainFilters.filter((filter) => {
      const matchesSearch =
        !searchFilter ||
        filter.pattern.toLowerCase().includes(searchFilter.toLowerCase()) ||
        filter.category.toLowerCase().includes(searchFilter.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || filter.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [domainFilters, searchFilter, selectedCategory]);

  // Group by category
  const groupedFilters = useMemo(() => {
    const groups: Record<string, DomainFilter[]> = {};
    filteredDomains.forEach((filter) => {
      if (!groups[filter.category]) {
        groups[filter.category] = [];
      }
      groups[filter.category].push(filter);
    });
    return groups;
  }, [filteredDomains]);

  const handleAddPattern = () => {
    if (newPattern.trim()) {
      addDomainFilter(newPattern.trim());
      setNewPattern('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddPattern();
    }
  };

  if (!isOpen) return null;

  const enabledCount = domainFilters.filter((f) => f.enabled).length;
  const totalCount = domainFilters.length;
  const filteredRequestsCount = getFilteredCount();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#0D1F2D] rounded-lg shadow-2xl w-[800px] max-h-[90vh] flex flex-col border border-white/10">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Domain Filters
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {enabledCount}/{totalCount} filters active • {filteredRequestsCount} requests hidden
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition p-2 hover:bg-white/10 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-white/10 bg-[#0A1929] space-y-3">
          {/* Master Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-white">Domain Filtering</label>
              <p className="text-xs text-gray-400">Hide requests to third-party services</p>
            </div>
            <button
              onClick={toggleDomainFilters}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                domainFiltersEnabled
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-600 text-gray-300'
              }`}
            >
              {domainFiltersEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search domains or categories..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Add New Domain */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add custom domain (e.g., example.com)"
              value={newPattern}
              onChange={(e) => setNewPattern(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddPattern}
              disabled={!newPattern.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {/* Reset Button */}
          <button
            onClick={resetDomainFilters}
            className="w-full px-4 py-2 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 rounded-lg font-medium transition flex items-center justify-center gap-2 border border-orange-600/30"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </button>
        </div>

        {/* Filters List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredDomains.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No filters found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedFilters).map(([category, filters]) => (
                <div key={category}>
                  {/* Category Header */}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-300">{category}</h3>
                    <span className="text-xs text-gray-500">{filters.length} domains</span>
                  </div>

                  {/* Filters in Category */}
                  <div className="space-y-1">
                    {filters.map((filter) => (
                      <div
                        key={filter.id}
                        className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition group"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={filter.enabled}
                            onChange={() => toggleDomainFilter(filter.id)}
                            className="w-4 h-4 rounded border-gray-500 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 bg-gray-700"
                          />

                          {/* Pattern */}
                          <code className="text-sm text-white font-mono flex-1">
                            {filter.pattern}
                          </code>

                          {/* Custom Badge */}
                          {filter.custom && (
                            <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded text-xs font-medium border border-blue-600/30">
                              Custom
                            </span>
                          )}
                        </div>

                        {/* Delete Button (only for custom filters) */}
                        {filter.custom && (
                          <button
                            onClick={() => removeDomainFilter(filter.id)}
                            className="opacity-0 group-hover:opacity-100 transition text-red-400 hover:text-red-300 p-1 hover:bg-red-500/20 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#0A1929]">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
