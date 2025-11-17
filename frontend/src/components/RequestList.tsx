import { useState, useEffect, useRef } from 'react';
import { useRequestsStore } from '../stores/requestsStore';
import { useRepeaterStore } from '../stores/repeaterStore';
import { useAIStore } from '../stores/aiStore';
import { useUnifiedAIStore } from '../stores/unifiedAIStore';
import { ContextMenu, type ContextMenuItem } from './common';
import { FilterDomainsModal } from './FilterDomainsModal';
import { Copy, Send, Trash2, ArrowUpDown, Clock, AlertCircle, Filter, FilterX, Shield, Zap, AlertTriangle, CheckCircle, Info, XOctagon } from 'lucide-react';
import { aiAPI } from '../lib/api';

const ITEMS_PER_PAGE = 100;

type SortBy = 'time' | 'status' | 'method' | 'url';

export function RequestList() {
  const {
    selectedRequest,
    selectRequest,
    setFilter,
    getFilteredRequests,
    clearRequests,
    requests,
    domainFiltersEnabled,
    toggleDomainFilters,
    getFilteredCount,
    addDomainFilter,
    setRequestAnalysis,
    getRequestAnalysis,
    aiFilter,
    setAIFilter,
    clearAIFilter,
    selectedRequestIds,
    toggleRequestSelection,
    selectAllRequests,
    clearSelection,
    getSelectedRequests,
  } = useRequestsStore();
  const { createTab } = useRepeaterStore();
  const { canAfford, setActiveAnalysis, setIsAnalyzing, model } = useAIStore();
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('');
  const listRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; requestId: string } | null>(null);
  const [displayLimit, setDisplayLimit] = useState(ITEMS_PER_PAGE);
  const [sortBy, setSortBy] = useState<SortBy>('time');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [aiScanning, setAiScanning] = useState<Set<string>>(new Set());
  const [batchAnalyzing, setBatchAnalyzing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  const filteredRequests = getFilteredRequests();
  const filteredByDomainCount = getFilteredCount();

  // Sort requests
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    switch (sortBy) {
      case 'time':
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(); // Newest first
      case 'status':
        return (a.statusCode || 0) - (b.statusCode || 0);
      case 'method':
        return a.method.localeCompare(b.method);
      case 'url':
        return a.url.localeCompare(b.url);
      default:
        return 0;
    }
  });

  const displayedRequests = sortedRequests.slice(0, displayLimit);
  const hasMore = sortedRequests.length > displayLimit;

  useEffect(() => {
    setFilter({ search, method: methodFilter || undefined });
    // Reset display limit when filter changes
    setDisplayLimit(ITEMS_PER_PAGE);
  }, [search, methodFilter, setFilter]);

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-500';
      case 'POST':
        return 'bg-green-500';
      case 'PUT':
        return 'bg-yellow-500';
      case 'DELETE':
        return 'bg-red-500';
      case 'PATCH':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusColor = (statusCode?: number) => {
    if (!statusCode) return 'bg-gray-500';
    if (statusCode >= 200 && statusCode < 300) return 'bg-green-500';
    if (statusCode >= 300 && statusCode < 400) return 'bg-blue-500';
    if (statusCode >= 400 && statusCode < 500) return 'bg-yellow-500';
    if (statusCode >= 500) return 'bg-red-500';
    return 'bg-gray-500';
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const truncateUrl = (url: string, maxLength: number = 40) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XOctagon size={14} className="text-red-600" />;
      case 'high':
        return <AlertTriangle size={14} className="text-orange-500" />;
      case 'medium':
        return <AlertCircle size={14} className="text-yellow-500" />;
      case 'low':
        return <Info size={14} className="text-blue-500" />;
      case 'info':
        return <CheckCircle size={14} className="text-green-500" />;
      default:
        return <Info size={14} className="text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      case 'info':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleQuickScan = async (requestId: string) => {
    try {
      setAiScanning(prev => new Set(prev).add(requestId));
      setIsAnalyzing(true);

      const analysis = await aiAPI.quickScan(requestId);

      // Set active analysis and trigger AI panel to open
      setActiveAnalysis(analysis, true);

      // Add to unified AI store
      useUnifiedAIStore.getState().addAnalysis(analysis, 'request-list');

      // Calculate severity based on vulnerabilities and suggestions
      const vulnerabilityCount = analysis.vulnerabilities?.length || 0;
      const suggestionCount = analysis.suggestions?.length || 0;

      // Determine severity (simplified logic - in real app would analyze vulnerability types)
      let severity: 'critical' | 'high' | 'medium' | 'low' | 'info' = 'info';
      if (vulnerabilityCount > 0) {
        // Check if any vulnerability is marked as critical/high in the analysis
        const hasCritical = analysis.vulnerabilities?.some((v: any) => v.severity === 'critical');
        const hasHigh = analysis.vulnerabilities?.some((v: any) => v.severity === 'high');

        if (hasCritical) severity = 'critical';
        else if (hasHigh) severity = 'high';
        else if (vulnerabilityCount > 2) severity = 'medium';
        else severity = 'low';
      } else if (suggestionCount > 3) {
        severity = 'low';
      }

      // Store analysis result
      setRequestAnalysis(requestId, {
        severity,
        vulnerabilityCount,
        suggestionCount,
        analyzedAt: new Date(),
        analysisType: 'quick',
      });
    } catch (error) {
      console.error('Quick scan failed:', error);
      alert(error instanceof Error ? error.message : 'Quick scan failed');
    } finally {
      setIsAnalyzing(false);
      setAiScanning(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const handleDeepScan = async (requestId: string) => {
    try {
      setAiScanning(prev => new Set(prev).add(requestId));
      setIsAnalyzing(true);

      const analysis = await aiAPI.deepScan(requestId);

      // Set active analysis and trigger AI panel to open
      setActiveAnalysis(analysis, true);

      // Add to unified AI store
      useUnifiedAIStore.getState().addAnalysis(analysis, 'request-list');

      // Calculate severity based on vulnerabilities and suggestions
      const vulnerabilityCount = analysis.vulnerabilities?.length || 0;
      const suggestionCount = analysis.suggestions?.length || 0;

      // Determine severity (deep scan typically finds more issues)
      let severity: 'critical' | 'high' | 'medium' | 'low' | 'info' = 'info';
      if (vulnerabilityCount > 0) {
        const hasCritical = analysis.vulnerabilities?.some((v: any) => v.severity === 'critical');
        const hasHigh = analysis.vulnerabilities?.some((v: any) => v.severity === 'high');

        if (hasCritical) severity = 'critical';
        else if (hasHigh) severity = 'high';
        else if (vulnerabilityCount > 2) severity = 'medium';
        else severity = 'low';
      } else if (suggestionCount > 3) {
        severity = 'low';
      }

      // Store analysis result
      setRequestAnalysis(requestId, {
        severity,
        vulnerabilityCount,
        suggestionCount,
        analyzedAt: new Date(),
        analysisType: 'deep',
      });
    } catch (error) {
      console.error('Deep scan failed:', error);
      alert(error instanceof Error ? error.message : 'Deep scan failed');
    } finally {
      setIsAnalyzing(false);
      setAiScanning(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const handleBatchAnalyze = async () => {
    const selected = getSelectedRequests();
    if (selected.length === 0) {
      alert('Please select requests to analyze');
      return;
    }

    if (!canAfford('quickScan')) {
      alert('Insufficient credits for batch analysis');
      return;
    }

    try {
      setBatchAnalyzing(true);
      setBatchProgress({ current: 0, total: selected.length });

      // Use enhanced batch analyze with performance metrics
      const result = await aiAPI.batchAnalyze(
        selected.map((r) => r.id),
        { model, concurrency: 5 }
      );
      const { results, summary } = result;

      // Store analysis results for each successful request
      results.forEach((r: any) => {
        const analysis = r.analysis;
        const vulnerabilityCount = analysis.vulnerabilities?.length || 0;
        const suggestionCount = analysis.suggestions?.length || 0;

        let severity: 'critical' | 'high' | 'medium' | 'low' | 'info' = 'info';
        if (vulnerabilityCount > 0) {
          const hasCritical = analysis.vulnerabilities?.some((v: any) => v.severity === 'critical');
          const hasHigh = analysis.vulnerabilities?.some((v: any) => v.severity === 'high');

          if (hasCritical) severity = 'critical';
          else if (hasHigh) severity = 'high';
          else if (vulnerabilityCount > 2) severity = 'medium';
          else severity = 'low';
        } else if (suggestionCount > 3) {
          severity = 'low';
        }

        setRequestAnalysis(r.requestId, {
          severity,
          vulnerabilityCount,
          suggestionCount,
          analyzedAt: new Date(),
          analysisType: 'quick',
        });
      });

      // Clear selection after successful analysis
      clearSelection();

      // Show summary with performance metrics
      const durationSec = (summary.duration / 1000).toFixed(1);
      const avgTimeSec = (summary.averageTime / 1000).toFixed(2);
      alert(
        `Batch analysis completed in ${durationSec}s!\n\n` +
        `Successful: ${summary.successful}\n` +
        `Failed: ${summary.failed}\n` +
        `Total: ${summary.total}\n` +
        `Average time: ${avgTimeSec}s per request\n` +
        `Concurrency: ${summary.concurrency} parallel requests`
      );
    } catch (error) {
      console.error('Batch analysis failed:', error);
      alert(error instanceof Error ? error.message : 'Batch analysis failed');
    } finally {
      setBatchAnalyzing(false);
      setBatchProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/10 space-y-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-white">
              Requests ({filteredRequests.length})
              {filteredRequests.length > displayLimit && (
                <span className="text-sm text-gray-400 ml-2">
                  (showing {displayLimit})
                </span>
              )}
            </h2>

            {/* Domain Filter Indicator */}
            {domainFiltersEnabled && filteredByDomainCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-600/20 rounded-lg border border-blue-600/30">
                <Filter className="w-3 h-3 text-blue-400" />
                <span className="text-xs font-medium text-blue-400">
                  {filteredByDomainCount} hidden
                </span>
              </div>
            )}

            {/* Batch Selection Indicator */}
            {selectedRequestIds.size > 0 && (
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-electric-blue/20 rounded-lg border border-electric-blue/30">
                  <span className="text-xs font-medium text-electric-blue">
                    {selectedRequestIds.size} selected
                  </span>
                </div>
                <button
                  onClick={handleBatchAnalyze}
                  disabled={batchAnalyzing || !canAfford('quickScan')}
                  className="px-3 py-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Zap className="w-3 h-3" />
                  {batchAnalyzing ? `Analyzing (${batchProgress.current}/${batchProgress.total})...` : 'Batch Analyze'}
                </button>
                <button
                  onClick={clearSelection}
                  className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-medium transition"
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Select All / Deselect All */}
            <button
              onClick={() => {
                if (selectedRequestIds.size === filteredRequests.length && filteredRequests.length > 0) {
                  clearSelection();
                } else {
                  selectAllRequests();
                }
              }}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg text-xs font-medium transition"
            >
              {selectedRequestIds.size === filteredRequests.length && filteredRequests.length > 0
                ? 'Deselect All'
                : 'Select All'}
            </button>
            {/* Domain Filters Toggle */}
            <button
              onClick={toggleDomainFilters}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                domainFiltersEnabled
                  ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/30'
                  : 'bg-white/10 hover:bg-white/20 text-gray-400 border border-white/10'
              }`}
              title={domainFiltersEnabled ? 'Domain filters ON - Click to disable' : 'Domain filters OFF - Click to enable'}
            >
              {domainFiltersEnabled ? <Filter className="w-3 h-3" /> : <FilterX className="w-3 h-3" />}
              {domainFiltersEnabled ? 'ON' : 'OFF'}
            </button>

            {/* Manage Filters Button */}
            <button
              onClick={() => setShowFilterModal(true)}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg text-xs font-medium transition"
            >
              Manage
            </button>

            {/* Clear All Button */}
            <button
              onClick={clearRequests}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search URLs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
        />

        {/* Method Filter */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setMethodFilter('')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              methodFilter === ''
                ? 'bg-electric-blue text-white'
                : 'bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            All
          </button>
          {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((method) => (
            <button
              key={method}
              onClick={() => setMethodFilter(method)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                methodFilter === method
                  ? 'bg-electric-blue text-white'
                  : 'bg-white/10 text-gray-400 hover:text-white'
              }`}
            >
              {method}
            </button>
          ))}
        </div>

        {/* AI Analysis Filter */}
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-gray-400">AI Status:</span>
          <button
            onClick={() => setAIFilter({ ...aiFilter, analyzed: undefined })}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              aiFilter.analyzed === undefined
                ? 'bg-electric-blue text-white'
                : 'bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setAIFilter({ ...aiFilter, analyzed: true })}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              aiFilter.analyzed === true
                ? 'bg-electric-blue text-white'
                : 'bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            Analyzed
          </button>
          <button
            onClick={() => setAIFilter({ ...aiFilter, analyzed: false })}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              aiFilter.analyzed === false
                ? 'bg-electric-blue text-white'
                : 'bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            Not Analyzed
          </button>

          <span className="text-xs text-gray-400 ml-4">Severity:</span>
          <button
            onClick={() => setAIFilter({ ...aiFilter, severity: undefined })}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              !aiFilter.severity
                ? 'bg-electric-blue text-white'
                : 'bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setAIFilter({ ...aiFilter, severity: 'critical' })}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              aiFilter.severity === 'critical'
                ? 'bg-red-600 text-white'
                : 'bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            Critical
          </button>
          <button
            onClick={() => setAIFilter({ ...aiFilter, severity: 'high' })}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              aiFilter.severity === 'high'
                ? 'bg-orange-500 text-white'
                : 'bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            High
          </button>
          <button
            onClick={() => setAIFilter({ ...aiFilter, severity: 'medium' })}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              aiFilter.severity === 'medium'
                ? 'bg-yellow-500 text-white'
                : 'bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            Medium
          </button>
          <button
            onClick={() => setAIFilter({ ...aiFilter, severity: 'low' })}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              aiFilter.severity === 'low'
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            Low
          </button>
          <button
            onClick={() => setAIFilter({ ...aiFilter, severity: 'info' })}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              aiFilter.severity === 'info'
                ? 'bg-green-500 text-white'
                : 'bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            Info
          </button>

          {(aiFilter.analyzed !== undefined || aiFilter.severity) && (
            <button
              onClick={clearAIFilter}
              className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs font-medium transition-colors"
            >
              Clear AI Filters
            </button>
          )}
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2">
          <ArrowUpDown size={14} className="text-gray-400" />
          <span className="text-xs text-gray-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="text-xs bg-white/10 border border-white/20 rounded px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-electric-blue"
          >
            <option value="time">Time (newest first)</option>
            <option value="status">Status Code</option>
            <option value="method">Method</option>
            <option value="url">URL</option>
          </select>
        </div>
      </div>

      {/* Request List */}
      <div ref={listRef} className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 350px)' }}>
        {filteredRequests.length === 0 ? (
          <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
            <div className="text-center text-gray-400">
              <p className="text-sm">No requests yet</p>
              <p className="text-xs mt-1">Start the proxy to see intercepted traffic</p>
            </div>
          </div>
        ) : (
          <div className="p-2">
            {displayedRequests.map((request) => (
              <div
                key={request.id}
                className={`w-full text-left p-3 rounded-md transition-colors mb-1 relative flex gap-3 ${
                  selectedRequest?.id === request.id
                    ? 'bg-electric-blue/20 border border-electric-blue/50'
                    : request.statusCode && request.statusCode >= 400
                    ? 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/30'
                    : 'bg-white/5 hover:bg-white/10 border border-transparent'
                }`}
              >
                {/* Checkbox for batch selection */}
                <div className="flex items-start pt-1">
                  <input
                    type="checkbox"
                    checked={selectedRequestIds.has(request.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleRequestSelection(request.id);
                    }}
                    className="w-4 h-4 rounded border-white/20 bg-white/10 text-electric-blue focus:ring-electric-blue focus:ring-offset-0 cursor-pointer"
                  />
                </div>

                {/* Request content - clickable */}
                <button
                  onClick={() => selectRequest(request.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ x: e.clientX, y: e.clientY, requestId: request.id });
                  }}
                  className="flex-1 text-left"
                >
                  {/* Method and Status */}
                  <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-2 py-1 ${getMethodColor(
                      request.method
                    )} rounded text-xs font-semibold text-white`}
                  >
                    {request.method}
                  </span>
                  {request.statusCode ? (
                    <span
                      className={`px-2 py-1 ${getStatusColor(
                        request.statusCode
                      )} rounded text-xs font-semibold text-white flex items-center gap-1`}
                    >
                      {request.statusCode >= 400 && <AlertCircle size={12} />}
                      {request.statusCode}
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-500 rounded text-xs font-semibold text-white flex items-center gap-1">
                      <Clock size={12} />
                      Pending
                    </span>
                  )}
                  {request.duration && (
                    <span className="text-xs text-gray-400">{request.duration}ms</span>
                  )}

                  {/* AI Analysis Badge */}
                  {(() => {
                    const analysis = getRequestAnalysis(request.id);
                    if (analysis) {
                      return (
                        <span
                          className={`px-2 py-1 ${getSeverityColor(
                            analysis.severity
                          )} rounded text-xs font-semibold text-white flex items-center gap-1`}
                          title={`AI ${analysis.analysisType === 'quick' ? 'Quick' : 'Deep'} Scan - ${
                            analysis.vulnerabilityCount
                          } vulnerabilities found`}
                        >
                          {getSeverityIcon(analysis.severity)}
                          AI: {analysis.vulnerabilityCount}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* URL */}
                <p className="text-sm text-white font-mono truncate mb-1" title={request.url}>
                  {truncateUrl(request.url, 50)}
                </p>

                  {/* Time */}
                  <p className="text-xs text-gray-400">{formatTime(request.timestamp)}</p>
                </button>
              </div>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <button
                onClick={() => setDisplayLimit((prev) => prev + ITEMS_PER_PAGE)}
                className="w-full p-3 mt-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors text-sm font-medium border border-white/20"
              >
                Load More ({filteredRequests.length - displayLimit} more)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (() => {
        const request = requests.find(r => r.id === contextMenu.requestId);
        if (!request) return null;

        // Extract domain from URL
        let domain = '';
        try {
          const url = new URL(request.url);
          domain = url.hostname;
        } catch {
          domain = request.url;
        }

        const menuItems: ContextMenuItem[] = [
          {
            label: 'Send to Repeater',
            icon: <Send size={14} />,
            onClick: () => {
              createTab(undefined, {
                method: request.method,
                url: request.url,
                headers: request.headers,
                body: request.body || '',
              });
              setContextMenu(null);
            },
            shortcut: 'Ctrl+R',
          },
          {
            label: 'Copy URL',
            icon: <Copy size={14} />,
            onClick: () => {
              navigator.clipboard.writeText(request.url);
              setContextMenu(null);
            },
          },
          {
            label: 'Copy as cURL',
            icon: <Copy size={14} />,
            onClick: () => {
              const headers = Object.entries(request.headers)
                .map(([k, v]) => `-H "${k}: ${v}"`)
                .join(' ');
              const curl = `curl -X ${request.method} "${request.url}" ${headers}${
                request.body ? ` -d '${request.body}'` : ''
              }`;
              navigator.clipboard.writeText(curl);
              setContextMenu(null);
            },
          },
          { divider: true },
          {
            label: aiScanning.has(request.id) ? 'Scanning...' : 'Quick Scan (8K tokens)',
            icon: <Zap size={14} className={aiScanning.has(request.id) ? 'animate-pulse' : ''} />,
            onClick: () => {
              if (!aiScanning.has(request.id)) {
                handleQuickScan(request.id);
                setContextMenu(null);
              }
            },
            disabled: aiScanning.has(request.id) || !canAfford('quickScan'),
          },
          {
            label: aiScanning.has(request.id) ? 'Scanning...' : 'Deep Scan (16K tokens)',
            icon: <Shield size={14} className={aiScanning.has(request.id) ? 'animate-pulse' : ''} />,
            onClick: () => {
              if (!aiScanning.has(request.id)) {
                handleDeepScan(request.id);
                setContextMenu(null);
              }
            },
            disabled: aiScanning.has(request.id) || !canAfford('deepScan'),
          },
          { divider: true },
          {
            label: `Filter "${domain}"`,
            icon: <Filter size={14} />,
            onClick: () => {
              addDomainFilter(domain);
              setContextMenu(null);
            },
          },
          { divider: true },
          {
            label: 'Delete',
            icon: <Trash2 size={14} />,
            onClick: () => {
              // TODO: Implement delete single request
              console.log('Delete request:', request.id);
              setContextMenu(null);
            },
          },
        ];

        return (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            items={menuItems}
            onClose={() => setContextMenu(null)}
          />
        );
      })()}

      {/* Filter Domains Modal */}
      {showFilterModal && (
        <FilterDomainsModal
          isOpen={showFilterModal}
          onClose={() => setShowFilterModal(false)}
        />
      )}
    </div>
  );
}
