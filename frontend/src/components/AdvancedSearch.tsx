/**
 * Advanced Search Component
 * Powerful search and filtering for request history
 */

import { useState } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';

export interface SearchFilters {
  query: string;
  method?: string;
  statusCode?: string;
  minLength?: number;
  maxLength?: number;
  hasAIAnalysis?: boolean;
  starred?: boolean;
  tags?: string[];
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onClear: () => void;
}

export function AdvancedSearch({ onSearch, onClear }: AdvancedSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [method, setMethod] = useState('');
  const [statusCode, setStatusCode] = useState('');
  const [starred, setStarred] = useState<boolean | undefined>(undefined);

  const handleSearch = () => {
    const filters: SearchFilters = {
      query,
      method: method || undefined,
      statusCode: statusCode || undefined,
      starred,
    };
    onSearch(filters);
  };

  const handleClear = () => {
    setQuery('');
    setMethod('');
    setStatusCode('');
    setStarred(undefined);
    onClear();
  };

  const hasActiveFilters = query || method || statusCode || starred !== undefined;

  return (
    <div className="bg-[#0D1F2D] border-b border-white/10">
      {/* Search Bar */}
      <div className="px-4 py-3 flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search requests (URL, method, status...)"
            className="w-full pl-10 pr-4 py-2 bg-[#0A1929] text-white border border-white/20 rounded text-sm focus:outline-none focus:border-blue-500 placeholder-white/40"
          />
        </div>

        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition"
        >
          Search
        </button>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`px-3 py-2 rounded text-sm font-medium transition flex items-center gap-1 ${
            isExpanded
              ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
              : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
          }`}
          title="Advanced Filters"
        >
          <Filter className="w-4 h-4" />
          {hasActiveFilters && <span className="w-2 h-2 bg-blue-400 rounded-full" />}
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>

        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="p-2 hover:bg-white/10 rounded text-white/60 hover:text-white transition"
            title="Clear Filters"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-white/5 pt-3">
          {/* Method Filter */}
          <div>
            <label className="text-xs text-white/60 block mb-1.5">Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2 bg-[#0A1929] text-white border border-white/20 rounded text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">All Methods</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
              <option value="OPTIONS">OPTIONS</option>
              <option value="HEAD">HEAD</option>
            </select>
          </div>

          {/* Status Code Filter */}
          <div>
            <label className="text-xs text-white/60 block mb-1.5">Status Code</label>
            <select
              value={statusCode}
              onChange={(e) => setStatusCode(e.target.value)}
              className="w-full px-3 py-2 bg-[#0A1929] text-white border border-white/20 rounded text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="2">2xx Success</option>
              <option value="3">3xx Redirect</option>
              <option value="4">4xx Client Error</option>
              <option value="5">5xx Server Error</option>
              <option value="200">200 OK</option>
              <option value="201">201 Created</option>
              <option value="301">301 Moved</option>
              <option value="302">302 Found</option>
              <option value="400">400 Bad Request</option>
              <option value="401">401 Unauthorized</option>
              <option value="403">403 Forbidden</option>
              <option value="404">404 Not Found</option>
              <option value="500">500 Internal Error</option>
            </select>
          </div>

          {/* Starred Filter */}
          <div>
            <label className="text-xs text-white/60 block mb-1.5">Filter by</label>
            <select
              value={starred === undefined ? '' : starred ? 'starred' : 'unstarred'}
              onChange={(e) =>
                setStarred(e.target.value === '' ? undefined : e.target.value === 'starred')
              }
              className="w-full px-3 py-2 bg-[#0A1929] text-white border border-white/20 rounded text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">All Requests</option>
              <option value="starred">Starred Only</option>
              <option value="unstarred">Unstarred Only</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
