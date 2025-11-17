/**
 * AI Findings Panel - Unified viewer for all AI analyses
 *
 * Features:
 * - View all findings from all sources in one place
 * - Advanced filtering (severity, source, date, confidence)
 * - Search across all fields
 * - Export to JSON/CSV/Markdown
 * - Virtual scrolling for performance
 * - Statistics dashboard
 */

import { useState, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Shield,
  Filter,
  Download,
  Search,
  X,
  BarChart3,
  FileJson,
  FileText,
  Table,
} from 'lucide-react';
import { useUnifiedAIStore } from '../stores/unifiedAIStore';
import { useRequestsStore } from '../stores/requestsStore';
import { useWorkflowStore } from '../stores/workflowStore';
import { VulnerabilityCard } from './VulnerabilityCard';
import type { FindingFilter, AISource } from '../stores/unifiedAIStore';

export function AIFindingsPanel() {
  const { selectRequest } = useRequestsStore();
  const { setActivePanel } = useWorkflowStore();
  const {
    getFilteredFindings,
    filter,
    setFilter,
    clearFilter,
    exportAsJSON,
    exportAsCSV,
    exportAsMarkdown,
    getStats,
  } = useUnifiedAIStore();

  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);

  const parentRef = useRef<HTMLDivElement>(null);

  const findings = useMemo(() => getFilteredFindings(), [getFilteredFindings, filter, searchTerm]);
  const stats = useMemo(() => getStats(), [getStats]);

  // Virtual scrolling for performance with large lists
  const rowVirtualizer = useVirtualizer({
    count: findings.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 180, // Estimated height of VulnerabilityCard
    overscan: 5, // Render 5 extra items above/below viewport
  });

  const handleSeverityFilter = (severity: FindingFilter['severity']) => {
    setFilter({ severity: severity === filter.severity ? null : severity });
  };

  const handleSourceFilter = (source: AISource | null) => {
    setFilter({ source: source === filter.source ? null : source });
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setFilter({ searchTerm: term || undefined });
  };

  const handleConfidenceFilter = (minConfidence: number) => {
    setFilter({ minConfidence: minConfidence === filter.minConfidence ? undefined : minConfidence });
  };

  const handleExport = (format: 'json' | 'csv' | 'markdown') => {
    let content = '';
    let filename = '';
    let mimeType = '';

    switch (format) {
      case 'json':
        content = exportAsJSON();
        filename = `findings-${Date.now()}.json`;
        mimeType = 'application/json';
        break;
      case 'csv':
        content = exportAsCSV();
        filename = `findings-${Date.now()}.csv`;
        mimeType = 'text/csv';
        break;
      case 'markdown':
        content = exportAsMarkdown();
        filename = `findings-${Date.now()}.md`;
        mimeType = 'text/markdown';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const hasActiveFilters = !!(
    filter.severity ||
    filter.source ||
    filter.searchTerm ||
    filter.minConfidence
  );

  return (
    <div className="flex flex-col h-full bg-[#0A1929]">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-white/10 bg-gradient-to-r from-[#0A1929] to-[#0D1F2D]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-500" />
            <div>
              <h2 className="text-xl font-bold text-white">Security Findings</h2>
              <p className="text-xs text-gray-500">
                {findings.length} findings {hasActiveFilters && `(filtered from ${stats.total})`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                showFilters || hasActiveFilters
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                  {[filter.severity, filter.source, filter.searchTerm, filter.minConfidence].filter(Boolean).length}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-gray-400 rounded-lg text-sm font-medium transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>

              {showExportMenu && (
                <div className="absolute right-0 top-full mt-2 bg-[#0D1F2D] border border-white/20 rounded-lg shadow-xl py-1 min-w-[160px] z-50">
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 transition flex items-center gap-2"
                  >
                    <FileJson className="w-4 h-4 text-blue-400" />
                    Export as JSON
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 transition flex items-center gap-2"
                  >
                    <Table className="w-4 h-4 text-green-400" />
                    Export as CSV
                  </button>
                  <button
                    onClick={() => handleExport('markdown')}
                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 transition flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-purple-400" />
                    Export as Markdown
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-5 gap-3">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            <div className="text-xs text-gray-500 mb-1">Critical</div>
            <div className="text-xl font-bold text-red-400">{stats.bySeverity.CRITICAL || 0}</div>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg px-3 py-2">
            <div className="text-xs text-gray-500 mb-1">High</div>
            <div className="text-xl font-bold text-orange-400">{stats.bySeverity.HIGH || 0}</div>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2">
            <div className="text-xs text-gray-500 mb-1">Medium</div>
            <div className="text-xl font-bold text-yellow-400">{stats.bySeverity.MEDIUM || 0}</div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2">
            <div className="text-xs text-gray-500 mb-1">Low</div>
            <div className="text-xl font-bold text-blue-400">{stats.bySeverity.LOW || 0}</div>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-lg px-3 py-2">
            <div className="text-xs text-gray-500 mb-1">Avg Confidence</div>
            <div className="text-xl font-bold text-white">{Math.round(stats.avgConfidence * 100)}%</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search findings (title, description, URL, evidence...)"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex-shrink-0 px-6 py-3 border-b border-white/10 bg-white/5 space-y-3">
          {/* Severity Filter */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Severity</label>
            <div className="flex gap-2">
              {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as const).map((severity) => (
                <button
                  key={severity}
                  onClick={() => handleSeverityFilter(severity)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                    filter.severity === severity
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-gray-400 hover:bg-white/20'
                  }`}
                >
                  {severity}
                </button>
              ))}
            </div>
          </div>

          {/* Source Filter */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Source</label>
            <div className="flex gap-2">
              {(['intercept', 'request-list', 'repeater', 'manual'] as const).map((source) => (
                <button
                  key={source}
                  onClick={() => handleSourceFilter(source)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                    filter.source === source
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/10 text-gray-400 hover:bg-white/20'
                  }`}
                >
                  {source}
                </button>
              ))}
            </div>
          </div>

          {/* Confidence Filter */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">
              Minimum Confidence
            </label>
            <div className="flex gap-2">
              {[0.9, 0.7, 0.5, 0.3].map((conf) => (
                <button
                  key={conf}
                  onClick={() => handleConfidenceFilter(conf)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                    filter.minConfidence === conf
                      ? 'bg-green-600 text-white'
                      : 'bg-white/10 text-gray-400 hover:bg-white/20'
                  }`}
                >
                  {Math.round(conf * 100)}%+
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilter}
              className="text-xs text-blue-400 hover:text-blue-300 transition flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Findings List with Virtual Scrolling */}
      <div ref={parentRef} className="flex-1 overflow-y-auto px-6 py-4">
        {findings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
            <BarChart3 className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">
              {hasActiveFilters ? 'No findings match your filters' : 'No findings yet'}
            </p>
            <p className="text-sm">
              {hasActiveFilters
                ? 'Try adjusting your filters or clearing them'
                : 'Run AI analyses to discover security findings'}
            </p>
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const finding = findings[virtualItem.index];
              return (
                <div
                  key={virtualItem.key}
                  data-index={virtualItem.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  className="pb-3"
                >
                  <VulnerabilityCard
                    finding={finding}
                    onViewRequest={(requestId) => {
                      // Select the request in the store
                      selectRequest(requestId);

                      // Navigate to history panel to view the request details
                      setActivePanel('history');
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
