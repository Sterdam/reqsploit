import React, { useEffect, useState } from 'react';
import {
  Fish,
  RefreshCw,
  Filter,
  Search,
  X,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { useMagicScanStore, Severity, AssetCategory } from '../stores/magicScanStore';
import { ScanResultCard } from '../components/MagicScanResultCard';
import { useNavigate } from 'react-router-dom';

const SEVERITY_OPTIONS: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const CATEGORY_OPTIONS: AssetCategory[] = [
  'API_KEYS',
  'PRIVATE_KEYS',
  'DATABASE_CREDS',
  'AUTH_DATA',
  'NETWORK_INFO',
  'PII',
  'SENSITIVE_FILES',
  'ERROR_INFO',
  'BUSINESS_LOGIC',
];

const CATEGORY_LABELS: Record<AssetCategory, string> = {
  API_KEYS: 'API Keys',
  PRIVATE_KEYS: 'Private Keys',
  DATABASE_CREDS: 'Database Credentials',
  AUTH_DATA: 'Authentication',
  NETWORK_INFO: 'Network Info',
  PII: 'Personal Data',
  SENSITIVE_FILES: 'Sensitive Files',
  ERROR_INFO: 'Error Messages',
  BUSINESS_LOGIC: 'Business Logic',
};

const SEVERITY_COLORS = {
  CRITICAL: 'bg-red-500/20 text-red-300 border-red-500/30',
  HIGH: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  MEDIUM: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  LOW: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

export const MagicScan: React.FC = () => {
  const navigate = useNavigate();
  const {
    results,
    stats,
    filters,
    isLoading,
    error,
    pagination,
    fetchResults,
    loadMore,
    setFilters,
    resetFilters,
    toggleSeverity,
    toggleCategory,
    initialize,
    cleanup,
  } = useMagicScanStore();

  const [showFilters, setShowFilters] = useState(true);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    initialize();
    return () => cleanup();
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  const handleSearchSubmit = () => {
    setFilters({ search: searchInput });
  };

  const handleViewRequest = (requestId: string) => {
    // Navigate to Dashboard with this request selected
    navigate('/dashboard', { state: { requestId } });
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(results, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `magic-scan-results-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const criticalCount = stats?.bySeverity?.CRITICAL || 0;
  const totalCount = stats?.total || 0;

  const hasFilters =
    filters.severity.length > 0 ||
    filters.category.length > 0 ||
    filters.search !== '' ||
    !filters.showSafe;

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border-b border-[#2a2a3e] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Fish className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Magic Scan</h1>
              <p className="text-sm text-gray-400">Automatic sensitive data discovery</p>
            </div>
            {totalCount > 0 && (
              <div className="flex items-center gap-2 ml-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    criticalCount > 0
                      ? 'bg-red-500/20 text-red-300 animate-pulse'
                      : 'bg-gray-500/20 text-gray-300'
                  }`}
                >
                  {totalCount} findings
                </span>
                {criticalCount > 0 && (
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-500/30 text-red-200 animate-pulse">
                    {criticalCount} critical
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchResults()}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition border border-blue-500/30 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              onClick={handleExport}
              disabled={results.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition border border-green-500/30 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition border ${
                showFilters
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  : 'bg-white/5 text-gray-400 border-gray-700 hover:bg-white/10'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="flex items-center gap-3">
            {SEVERITY_OPTIONS.map((severity) => {
              const count = stats.bySeverity?.[severity] || 0;
              if (count === 0) return null;

              return (
                <button
                  key={severity}
                  onClick={() => toggleSeverity(severity)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border ${
                    filters.severity.includes(severity)
                      ? SEVERITY_COLORS[severity]
                      : 'bg-white/5 text-gray-400 border-gray-700 hover:bg-white/10'
                  }`}
                >
                  {severity} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="w-80 flex-shrink-0 border-r border-[#2a2a3e] bg-[#0f0f1a] p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Filters</h2>
              {hasFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-gray-400 hover:text-white transition"
                >
                  Reset all
                </button>
              )}
            </div>

            {/* Search */}
            <div className="mb-6">
              <label className="text-xs font-medium text-gray-400 mb-2 block">Search</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                    placeholder="Search in value or context..."
                    className="w-full pl-9 pr-3 py-2 bg-black/40 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                {searchInput && (
                  <button
                    onClick={() => {
                      setSearchInput('');
                      setFilters({ search: '' });
                    }}
                    className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Show Safe Findings */}
            <div className="mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showSafe}
                  onChange={(e) => setFilters({ showSafe: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-700 bg-black/40 text-purple-500 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-300">Show safe findings</span>
              </label>
            </div>

            {/* Category Filters */}
            <div className="mb-6">
              <label className="text-xs font-medium text-gray-400 mb-3 block">
                Asset Categories
              </label>
              <div className="space-y-2">
                {CATEGORY_OPTIONS.map((category) => {
                  const count = stats?.byCategory?.[category] || 0;
                  const isSelected = filters.category.includes(category);

                  return (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition border ${
                        isSelected
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          : 'bg-white/5 text-gray-400 border-gray-700 hover:bg-white/10'
                      }`}
                    >
                      <span>{CATEGORY_LABELS[category]}</span>
                      <span className="text-xs">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Confidence Filter */}
            <div>
              <label className="text-xs font-medium text-gray-400 mb-2 block">
                Min Confidence: {filters.minConfidence}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={filters.minConfidence}
                onChange={(e) => setFilters({ minConfidence: parseInt(e.target.value) })}
                className="w-full accent-purple-500"
              />
            </div>
          </div>
        )}

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {isLoading && results.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-4">
                <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
                <span className="text-gray-400">Loading scan results...</span>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-4 text-center max-w-md">
                <Fish className="w-16 h-16 text-gray-600" />
                <h3 className="text-xl font-semibold text-white">No findings yet</h3>
                <p className="text-gray-400">
                  Magic Scan will automatically detect sensitive data in your requests and
                  responses. Start intercepting traffic to see findings appear here.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-400">
                Showing {results.length} of {pagination.total} findings
              </div>

              <div className="space-y-3">
                {results.map((result) => (
                  <ScanResultCard
                    key={result.id}
                    result={result}
                    onViewRequest={handleViewRequest}
                  />
                ))}
              </div>

              {pagination.hasMore && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={loadMore}
                    disabled={isLoading}
                    className="px-6 py-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition border border-purple-500/30 disabled:opacity-50"
                  >
                    {isLoading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
