import { useEffect, useState, useCallback } from 'react';
import { useProxyStore } from '../stores/proxyStore';
import { useInterceptStore } from '../stores/interceptStore';
import { useRepeaterStore } from '../stores/repeaterStore';
import { useRequestsStore } from '../stores/requestsStore';
import { useAIStore } from '../stores/aiStore';
import { FilterDomainsModal } from './FilterDomainsModal';
import { AIActionButton } from './AIActionButton';
import { wsService } from '../lib/websocket';
import { aiAPI } from '../lib/api';
import { useUnifiedAIStore } from '../stores/unifiedAIStore';
import {
  Play,
  X,
  Send,
  Clock,
  ChevronRight,
  Code,
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
  Filter,
  FilterX,
  GripVertical,
  Sparkles,
  Shield,
  BookOpen,
} from 'lucide-react';

export function InterceptPanel() {
  const { session, toggleIntercept } = useProxyStore();
  const { createTab } = useRepeaterStore();
  const {
    queuedRequests,
    selectedRequest,
    queueSize,
    selectRequest,
    forwardRequest,
    dropRequest,
    clearQueue,
  } = useInterceptStore();
  const { domainFilters, domainFiltersEnabled, toggleDomainFilters, addDomainFilter } = useRequestsStore();
  const { isAnalyzing, setIsAnalyzing, setActiveAnalysis } = useAIStore();

  const [activeTab, setActiveTab] = useState<'headers' | 'body'>('headers');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [queueWidth, setQueueWidth] = useState(25); // Percentage
  const [isResizing, setIsResizing] = useState(false);
  const [domainFocusFilter, setDomainFocusFilter] = useState(''); // Focus on specific domain
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; requestId: string } | null>(null);

  // Always-on editing state
  const [editedMethod, setEditedMethod] = useState('GET');
  const [editedUrl, setEditedUrl] = useState('');
  const [editedHeaders, setEditedHeaders] = useState<Record<string, string>>({});
  const [editedBody, setEditedBody] = useState('');

  // UI state
  const [isJsonValid, setIsJsonValid] = useState(true);
  const [hasModifications, setHasModifications] = useState(false);

  // Filter queued requests by domain filters + focus filter
  const filteredQueuedRequests = queuedRequests.filter((req) => {
    // Apply domain focus filter first (positive filter - show ONLY this domain)
    if (domainFocusFilter.trim()) {
      try {
        const url = new URL(req.url);
        const hostname = url.hostname;
        if (!hostname.toLowerCase().includes(domainFocusFilter.toLowerCase())) {
          return false;
        }
      } catch {
        return false;
      }
    }

    // Apply domain filters (negative filter - hide these domains)
    if (!domainFiltersEnabled) return true;

    const enabledFilters = domainFilters.filter((f) => f.enabled);
    for (const filter of enabledFilters) {
      try {
        const url = new URL(req.url);
        const hostname = url.hostname;
        const path = url.pathname;

        if (filter.pattern.includes('/')) {
          const fullPattern = `${hostname}${path}`;
          if (fullPattern.includes(filter.pattern)) return false;
        } else {
          if (hostname === filter.pattern || hostname.endsWith('.' + filter.pattern)) return false;
        }
      } catch {
        // Invalid URL, keep the request
      }
    }
    return true;
  });

  const filteredCount = queuedRequests.length - filteredQueuedRequests.length;

  // Sync edited state when selected request changes
  useEffect(() => {
    if (selectedRequest) {
      setEditedMethod(selectedRequest.method);
      setEditedUrl(selectedRequest.url);
      setEditedHeaders({ ...selectedRequest.headers });
      setEditedBody(selectedRequest.body || '');
      setHasModifications(false);
    }
  }, [selectedRequest?.id]);

  // Validate JSON
  useEffect(() => {
    if (activeTab === 'body' && editedBody.trim()) {
      try {
        JSON.parse(editedBody);
        setIsJsonValid(true);
      } catch {
        setIsJsonValid(false);
      }
    } else {
      setIsJsonValid(true);
    }
  }, [editedBody, activeTab]);

  // Check for modifications
  useEffect(() => {
    if (!selectedRequest) {
      setHasModifications(false);
      return;
    }

    const modified =
      editedMethod !== selectedRequest.method ||
      editedUrl !== selectedRequest.url ||
      editedBody !== (selectedRequest.body || '') ||
      JSON.stringify(editedHeaders) !== JSON.stringify(selectedRequest.headers);

    setHasModifications(modified);
  }, [editedMethod, editedUrl, editedHeaders, editedBody, selectedRequest]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!selectedRequest) return;

      // Ctrl+F: Forward
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        handleForward();
      }
      // Ctrl+D: Drop
      else if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        handleDrop();
      }
      // Ctrl+R: Send to Repeater
      else if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        handleSendToRepeater();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedRequest, hasModifications]);

  const handleForward = useCallback(() => {
    if (!selectedRequest) return;

    if (hasModifications) {
      forwardRequest(selectedRequest.id, {
        method: editedMethod !== selectedRequest.method ? editedMethod : undefined,
        url: editedUrl !== selectedRequest.url ? editedUrl : undefined,
        headers: editedHeaders,
        body: editedBody !== (selectedRequest.body || '') ? editedBody : undefined,
      });
    } else {
      forwardRequest(selectedRequest.id);
    }

    // Auto-select next request
    const currentIndex = queuedRequests.findIndex((r) => r.id === selectedRequest.id);
    if (currentIndex >= 0 && queuedRequests[currentIndex + 1]) {
      selectRequest(queuedRequests[currentIndex + 1].id);
    }
  }, [selectedRequest, hasModifications, editedMethod, editedUrl, editedHeaders, editedBody, queuedRequests]);

  const handleDrop = useCallback(() => {
    if (!selectedRequest) return;

    dropRequest(selectedRequest.id);

    // Auto-select next request
    const currentIndex = queuedRequests.findIndex((r) => r.id === selectedRequest.id);
    if (currentIndex >= 0 && queuedRequests[currentIndex + 1]) {
      selectRequest(queuedRequests[currentIndex + 1].id);
    }
  }, [selectedRequest, queuedRequests]);

  const handleSendToRepeater = useCallback(() => {
    if (!selectedRequest) return;

    createTab(undefined, {
      method: editedMethod,
      url: editedUrl,
      headers: editedHeaders,
      body: editedBody,
    });
  }, [selectedRequest, editedMethod, editedUrl, editedHeaders, editedBody]);

  const handleAIAnalyze = useCallback(async (action: 'analyzeRequest' | 'explain' | 'securityCheck') => {
    if (!selectedRequest) return;

    try {
      setIsAnalyzing(true);

      const analysis = await aiAPI.analyzeIntercepted(
        selectedRequest.id,
        action,
        hasModifications ? {
          method: editedMethod !== selectedRequest.method ? editedMethod : undefined,
          url: editedUrl !== selectedRequest.url ? editedUrl : undefined,
          headers: editedHeaders,
          body: editedBody !== (selectedRequest.body || '') ? editedBody : undefined,
        } : undefined
      );

      // Set active analysis and open AI sidebar panel
      setActiveAnalysis(analysis, true);

      // Add to unified AI store
      useUnifiedAIStore.getState().addAnalysis(analysis, 'intercept');
    } catch (error) {
      console.error('AI Analysis failed:', error);
      alert(error instanceof Error ? error.message : 'AI analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedRequest, hasModifications, editedMethod, editedUrl, editedHeaders, editedBody, setIsAnalyzing, setActiveAnalysis]);

  const handleFormatJson = useCallback(() => {
    try {
      const parsed = JSON.parse(editedBody);
      setEditedBody(JSON.stringify(parsed, null, 2));
    } catch (error) {
      console.error('Invalid JSON');
    }
  }, [editedBody]);

  const handleAddHeader = useCallback(() => {
    const newKey = `New-Header-${Object.keys(editedHeaders).length}`;
    setEditedHeaders({ ...editedHeaders, [newKey]: '' });
  }, [editedHeaders]);

  const handleUpdateHeaderKey = useCallback((oldKey: string, newKey: string) => {
    const newHeaders = { ...editedHeaders };
    const value = newHeaders[oldKey];
    delete newHeaders[oldKey];
    newHeaders[newKey] = value;
    setEditedHeaders(newHeaders);
  }, [editedHeaders]);

  const handleUpdateHeaderValue = useCallback((key: string, value: string) => {
    setEditedHeaders({ ...editedHeaders, [key]: value });
  }, [editedHeaders]);

  const handleRemoveHeader = useCallback((key: string) => {
    const newHeaders = { ...editedHeaders };
    delete newHeaders[key];
    setEditedHeaders(newHeaders);
  }, [editedHeaders]);

  // Resize handler
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const containerWidth = window.innerWidth;
      const newWidth = (e.clientX / containerWidth) * 100;
      // Constrain between 15% and 50%
      setQueueWidth(Math.min(Math.max(newWidth, 15), 50));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Load queue on mount if intercept is enabled
  useEffect(() => {
    if (session?.interceptMode) {
      wsService.getRequestQueue();
    }
  }, [session?.interceptMode]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'text-green-400 bg-green-500/20 border-green-500/40';
      case 'POST':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/40';
      case 'PUT':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
      case 'DELETE':
        return 'text-red-400 bg-red-500/20 border-red-500/40';
      case 'PATCH':
        return 'text-purple-400 bg-purple-500/20 border-purple-500/40';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/40';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0A1929]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-[#0A1929] to-[#0D1F2D]">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-white">Intercept</h2>

          {/* Intercept Toggle */}
          <button
            onClick={() => toggleIntercept(!session?.interceptMode)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              session?.interceptMode
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/30'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            {session?.interceptMode ? 'ON' : 'OFF'}
          </button>

          {/* Queue Counter */}
          {queueSize > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 rounded-lg border border-blue-600/30">
              <Clock className="w-4 h-4 text-blue-400 animate-pulse" />
              <span className="text-sm font-medium text-blue-400">
                {queueSize} {queueSize === 1 ? 'request' : 'requests'}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        {queueSize > 0 && (
          <button
            onClick={clearQueue}
            className="px-4 py-2 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 rounded-lg font-medium transition border border-orange-600/30"
          >
            Forward All
          </button>
        )}
      </div>

      {/* Main Content */}
      {!session?.interceptMode ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400 space-y-4">
            <div className="text-6xl">🛑</div>
            <div>
              <p className="text-lg font-medium mb-2">Interception is OFF</p>
              <p className="text-sm">Click "ON" to start intercepting requests</p>
            </div>
          </div>
        </div>
      ) : queuedRequests.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400 space-y-4">
            <div className="text-6xl">⏳</div>
            <div>
              <p className="text-lg font-medium mb-2">No requests in queue</p>
              <p className="text-sm">Intercepted requests will appear here</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Queue List - Resizable */}
          <div className="border-r border-white/10 flex flex-col" style={{ width: `${queueWidth}%` }}>
            <div className="px-3 py-2 border-b border-white/10 bg-[#0D1F2D] flex-shrink-0 space-y-2">
              {/* Header Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-300">Queue ({filteredQueuedRequests.length})</h3>
                  {domainFiltersEnabled && filteredCount > 0 && (
                    <span className="px-2 py-0.5 bg-blue-600/20 rounded text-xs font-medium text-blue-400 border border-blue-600/30">
                      {filteredCount} filtered
                    </span>
                  )}
                  {domainFocusFilter && (
                    <span className="px-2 py-0.5 bg-green-600/20 rounded text-xs font-medium text-green-400 border border-green-600/30">
                      Focus: {domainFocusFilter}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleDomainFilters}
                    className={`p-1 rounded transition ${
                      domainFiltersEnabled
                        ? 'text-blue-400 hover:bg-blue-600/20'
                        : 'text-gray-400 hover:bg-white/10'
                    }`}
                    title={domainFiltersEnabled ? 'Filters ON' : 'Filters OFF'}
                  >
                    {domainFiltersEnabled ? <Filter className="w-3.5 h-3.5" /> : <FilterX className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setShowFilterModal(true)}
                    className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition text-xs"
                    title="Manage filters"
                  >
                    ⚙
                  </button>
                </div>
              </div>

              {/* Domain Focus Filter */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Focus on domain..."
                  value={domainFocusFilter}
                  onChange={(e) => setDomainFocusFilter(e.target.value)}
                  className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white placeholder-gray-500 text-xs focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                />
                {domainFocusFilter && (
                  <button
                    onClick={() => setDomainFocusFilter('')}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 240px)' }}>
              {filteredQueuedRequests.length === 0 ? (
                <div className="text-center text-gray-400 py-8 px-4">
                  <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">
                    {domainFocusFilter ? `No requests matching "${domainFocusFilter}"` : 'All requests filtered'}
                  </p>
                </div>
              ) : (
                [...filteredQueuedRequests]
                  .sort((a, b) => new Date(b.queuedAt).getTime() - new Date(a.queuedAt).getTime())
                  .map((request) => (
                    <button
                      key={request.id}
                      onClick={() => selectRequest(request.id)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({ x: e.clientX, y: e.clientY, requestId: request.id });
                      }}
                      className={`w-full px-4 py-3 border-b border-white/5 text-left hover:bg-white/5 transition ${
                        selectedRequest?.id === request.id ? 'bg-blue-600/20 border-l-4 border-l-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getMethodColor(request.method)}`}>
                          {request.method}
                        </span>
                        <span className="text-xs text-gray-500">{formatTimestamp(request.queuedAt)}</span>
                      </div>
                      <div className="text-sm text-gray-300 truncate font-mono">{request.url}</div>
                    </button>
                  ))
              )}
            </div>
          </div>

          {/* Resize Handle */}
          <div
            onMouseDown={handleMouseDown}
            className={`w-1 bg-white/5 hover:bg-blue-500/50 cursor-col-resize transition flex items-center justify-center group ${
              isResizing ? 'bg-blue-500' : ''
            }`}
          >
            <GripVertical className="w-3 h-3 text-gray-600 group-hover:text-blue-400" />
          </div>

          {/* Request Editor - Flexible */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {!selectedRequest ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <ChevronRight className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a request from the queue</p>
                </div>
              </div>
            ) : (
              <>
                {/* Request Info & URL Editor */}
                <div className="px-6 py-4 border-b border-white/10 bg-[#0D1F2D]">
                  <div className="flex items-center gap-3 mb-3">
                    {/* Method Selector */}
                    <select
                      value={editedMethod}
                      onChange={(e) => setEditedMethod(e.target.value)}
                      className={`px-3 py-2 rounded-lg font-bold text-sm border transition ${getMethodColor(editedMethod)} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="PATCH">PATCH</option>
                      <option value="DELETE">DELETE</option>
                      <option value="OPTIONS">OPTIONS</option>
                      <option value="HEAD">HEAD</option>
                    </select>

                    {/* URL Editor */}
                    <input
                      type="text"
                      value={editedUrl}
                      onChange={(e) => setEditedUrl(e.target.value)}
                      className="flex-1 bg-[#0A1929] border border-white/10 rounded-lg px-4 py-2 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com/path"
                    />

                    {/* Modification Indicator */}
                    {hasModifications && (
                      <div className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/20 px-3 py-1 rounded-lg border border-amber-500/30">
                        <AlertCircle className="w-3 h-3" />
                        Modified
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-500">
                    Queued at {formatTimestamp(selectedRequest.queuedAt)} •
                    <kbd className="ml-2 px-1.5 py-0.5 bg-white/10 rounded text-gray-400">Ctrl+F</kbd> Forward •
                    <kbd className="ml-1 px-1.5 py-0.5 bg-white/10 rounded text-gray-400">Ctrl+D</kbd> Drop •
                    <kbd className="ml-1 px-1.5 py-0.5 bg-white/10 rounded text-gray-400">Ctrl+R</kbd> To Repeater
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="px-6 py-3 border-b border-white/10 bg-[#0D1F2D] flex items-center justify-between flex-wrap gap-3">
                  <div className="flex gap-3">
                    {/* Forward Button */}
                    <button
                      onClick={handleForward}
                      className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition flex items-center gap-2 shadow-lg shadow-green-600/30"
                    >
                      <Play className="w-4 h-4" />
                      {hasModifications ? 'Forward Modified' : 'Forward'}
                    </button>

                    {/* Drop Button */}
                    <button
                      onClick={handleDrop}
                      className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition flex items-center gap-2 shadow-lg shadow-red-600/30"
                    >
                      <X className="w-4 h-4" />
                      Drop
                    </button>
                  </div>

                  <div className="flex gap-3">
                    {/* AI Action Buttons */}
                    <AIActionButton
                      action="analyzeRequest"
                      label="AI Analyze"
                      icon={<Sparkles className="w-4 h-4" />}
                      onClick={() => handleAIAnalyze('analyzeRequest')}
                      loading={isAnalyzing}
                      size="sm"
                    />
                    <AIActionButton
                      action="explain"
                      label="Explain"
                      icon={<BookOpen className="w-4 h-4" />}
                      onClick={() => handleAIAnalyze('explain')}
                      loading={isAnalyzing}
                      variant="secondary"
                      size="sm"
                    />
                    <AIActionButton
                      action="securityCheck"
                      label="Security"
                      icon={<Shield className="w-4 h-4" />}
                      onClick={() => handleAIAnalyze('securityCheck')}
                      loading={isAnalyzing}
                      variant="secondary"
                      size="sm"
                    />

                    {/* Send to Repeater Button */}
                    <button
                      onClick={handleSendToRepeater}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center gap-2 shadow-lg shadow-blue-600/30"
                    >
                      <Send className="w-4 h-4" />
                      Send to Repeater
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center justify-between border-b border-white/10 bg-[#0D1F2D]">
                  <div className="flex">
                    <button
                      onClick={() => setActiveTab('headers')}
                      className={`px-6 py-3 text-sm font-medium transition ${
                        activeTab === 'headers'
                          ? 'text-blue-400 border-b-2 border-blue-600 bg-blue-500/10'
                          : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      Headers ({Object.keys(editedHeaders).length})
                    </button>
                    <button
                      onClick={() => setActiveTab('body')}
                      className={`px-6 py-3 text-sm font-medium transition flex items-center gap-2 ${
                        activeTab === 'body'
                          ? 'text-blue-400 border-b-2 border-blue-600 bg-blue-500/10'
                          : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      Body
                      {activeTab === 'body' && editedBody && (
                        isJsonValid ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        )
                      )}
                    </button>
                  </div>

                  {/* JSON Format Button */}
                  {activeTab === 'body' && editedBody && isJsonValid && (
                    <button
                      onClick={handleFormatJson}
                      className="mr-4 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-medium transition flex items-center gap-1"
                    >
                      <Code className="w-3 h-3" />
                      Format JSON
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  {activeTab === 'headers' && (
                    <div>
                      {/* Headers Table */}
                      <div className="bg-[#0A1929] rounded-lg border border-white/10 overflow-hidden">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 w-1/3">
                                Name
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                                Value
                              </th>
                              <th className="px-4 py-3 w-12"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(editedHeaders).map(([key, value], index) => (
                              <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition">
                                <td className="px-4 py-2">
                                  <input
                                    type="text"
                                    value={key}
                                    onChange={(e) => handleUpdateHeaderKey(key, e.target.value)}
                                    className="w-full bg-transparent border-none px-2 py-1 text-white text-sm font-mono focus:outline-none focus:bg-white/10 rounded"
                                    placeholder="Header-Name"
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    type="text"
                                    value={value}
                                    onChange={(e) => handleUpdateHeaderValue(key, e.target.value)}
                                    className="w-full bg-transparent border-none px-2 py-1 text-white text-sm font-mono focus:outline-none focus:bg-white/10 rounded"
                                    placeholder="Header value"
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <button
                                    onClick={() => handleRemoveHeader(key)}
                                    className="text-red-400 hover:text-red-300 transition p-1 hover:bg-red-500/20 rounded"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Add Header Button */}
                      <button
                        onClick={handleAddHeader}
                        className="mt-4 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg border border-blue-600/30 text-sm font-medium transition flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Header
                      </button>
                    </div>
                  )}

                  {activeTab === 'body' && (
                    <div className="relative">
                      {/* Body Editor */}
                      <textarea
                        value={editedBody}
                        onChange={(e) => setEditedBody(e.target.value)}
                        className="w-full h-[500px] bg-[#0A1929] border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Request body (JSON, XML, form data, etc.)"
                      />

                      {/* JSON Error */}
                      {!isJsonValid && editedBody && (
                        <div className="mt-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-red-300">
                            <p className="font-semibold">Invalid JSON</p>
                            <p className="text-xs mt-1">The body contains invalid JSON syntax</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Context Menu for Queue Items */}
      {contextMenu && (() => {
        const request = queuedRequests.find((r) => r.id === contextMenu.requestId);
        if (!request) return null;

        // Extract domain from URL
        let domain = '';
        try {
          const url = new URL(request.url);
          domain = url.hostname;
        } catch {
          domain = request.url;
        }

        return (
          <div
            className="fixed bg-[#0D1F2D] border border-white/20 rounded-lg shadow-2xl py-1 min-w-[200px] z-50"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onMouseLeave={() => setContextMenu(null)}
          >
            <button
              onClick={() => {
                createTab(undefined, {
                  method: request.method,
                  url: request.url,
                  headers: request.headers,
                  body: request.body || '',
                });
                setContextMenu(null);
              }}
              className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 transition flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5 text-blue-400" />
              Send to Repeater
            </button>
            <div className="border-t border-white/10 my-1" />
            <button
              onClick={() => {
                setDomainFocusFilter(domain);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 transition flex items-center gap-2"
            >
              <Filter className="w-3.5 h-3.5 text-green-400" />
              Focus on "{domain}"
            </button>
            <button
              onClick={() => {
                addDomainFilter(domain);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 transition flex items-center gap-2"
            >
              <FilterX className="w-3.5 h-3.5 text-red-400" />
              Hide "{domain}"
            </button>
            <div className="border-t border-white/10 my-1" />
            <button
              onClick={() => {
                forwardRequest(request.id);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 transition flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5 text-green-400" />
              Forward
            </button>
            <button
              onClick={() => {
                dropRequest(request.id);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 transition flex items-center gap-2"
            >
              <X className="w-3.5 h-3.5 text-red-400" />
              Drop
            </button>
          </div>
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
