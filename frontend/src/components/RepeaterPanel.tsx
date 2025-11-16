import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRepeaterStore } from '../stores/repeaterStore';
import {
  Play,
  X,
  Plus,
  Clock,
  Copy,
  Sparkles,
} from 'lucide-react';
import { ResponseViewer } from './common';
import { RepeaterAIPanel } from './RepeaterAIPanel';
import { panelBridge } from '../lib/panel-bridge';
import { useWorkflowStore } from '../stores/workflowStore';

export function RepeaterPanel() {
  const {
    tabs,
    activeTabId,
    createTab,
    closeTab,
    setActiveTab,
    updateRequest,
    addHeader,
    updateHeader,
    removeHeader,
    sendRequest,
    selectHistoryEntry,
    clearHistory,
    getActiveTab,
  } = useRepeaterStore();

  const [activeEditorTab, setActiveEditorTab] = useState<'headers' | 'body'>('headers');
  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderValue, setNewHeaderValue] = useState('');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [autoExecuteAI, setAutoExecuteAI] = useState(false);

  const activeTab = getActiveTab();
  const { setActivePanel } = useWorkflowStore();

  // Create first tab if none exist
  useEffect(() => {
    if (tabs.length === 0) {
      createTab();
    }
  }, []);

  // Listen for panel-bridge events (send_to_repeater)
  useEffect(() => {
    const unsubscribe = panelBridge.on('send_to_repeater', (event) => {
      console.log('📥 Repeater received request from', event.source, event.data);

      // Create new tab with the request
      const tabId = createTab('From ' + event.source, event.data.request);

      // Switch to repeater panel
      setActivePanel('repeater');

      // Set the new tab as active
      setActiveTab(tabId);
    });

    return unsubscribe;
  }, [createTab, setActiveTab, setActivePanel]);

  // Listen for batch_to_repeater events
  useEffect(() => {
    const unsubscribe = panelBridge.on('batch_to_repeater', (event) => {
      console.log('📥 Repeater received batch from', event.source, event.data);

      // Create tabs for each request
      event.data.requests.forEach((request: any, index: number) => {
        createTab(`Batch ${index + 1}`, request);
      });

      // Switch to repeater panel
      setActivePanel('repeater');
    });

    return unsubscribe;
  }, [createTab, setActivePanel]);

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'text-green-400';
      case 'POST':
        return 'text-blue-400';
      case 'PUT':
        return 'text-yellow-400';
      case 'DELETE':
        return 'text-red-400';
      case 'PATCH':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return 'text-green-400';
    if (statusCode >= 300 && statusCode < 400) return 'text-blue-400';
    if (statusCode >= 400 && statusCode < 500) return 'text-yellow-400';
    if (statusCode >= 500) return 'text-red-400';
    return 'text-gray-400';
  };

  const handleSend = async () => {
    if (!activeTab) return;
    await sendRequest(activeTab.id);
  };

  const handleAddHeader = () => {
    if (!activeTab || !newHeaderKey.trim()) return;

    addHeader(activeTab.id, newHeaderKey.trim(), newHeaderValue);
    setNewHeaderKey('');
    setNewHeaderValue('');
  };

  const copyResponseToClipboard = () => {
    if (!activeTab?.response) return;
    navigator.clipboard.writeText(activeTab.response.body);
  };

  const handleExecuteAITest = async (test: any, variationIndex: number) => {
    if (!activeTab) return;

    const variation = test.variations[variationIndex];

    // Apply the variation to create a new request
    updateRequest(activeTab.id, 'method', variation.method || activeTab.request.method);
    if (variation.url) {
      updateRequest(activeTab.id, 'url', variation.url);
    }
    if (variation.body) {
      updateRequest(activeTab.id, 'body', variation.body);
    }
    if (variation.headers) {
      // Merge headers
      const newHeaders = { ...activeTab.request.headers, ...variation.headers };
      Object.entries(newHeaders).forEach(([key, value]) => {
        updateHeader(activeTab.id, key, value as string);
      });
    }

    // Execute the test if auto-execute is enabled
    if (autoExecuteAI) {
      await sendRequest(activeTab.id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0A1929]">
      {/* Tabs Bar */}
      <div className="flex items-center border-b border-white/10 bg-[#0D1F2D]">
        <div className="flex-1 flex items-center overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-3 text-sm font-medium border-r border-white/10 flex items-center gap-2
                transition-colors whitespace-nowrap
                ${
                  activeTabId === tab.id
                    ? 'bg-[#0A1929] text-white'
                    : 'bg-[#0D1F2D] text-white/60 hover:text-white hover:bg-[#0A1929]/50'
                }
              `}
            >
              <span>
                {tab.name}
                {tab.history.length > 0 && (
                  <span className="text-[#10B981] ml-1">({tab.history.length})</span>
                )}
              </span>
              {tabs.length > 1 && (
                <X
                  className="w-3 h-3 hover:text-red-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                />
              )}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAIPanel(!showAIPanel)}
          className={`relative px-4 py-3 transition-all ${
            showAIPanel
              ? 'text-electric-blue bg-[#0A1929] shadow-lg shadow-electric-blue/20'
              : 'text-white/60 hover:text-electric-blue hover:bg-[#0A1929]/50'
          }`}
          title="Toggle AI Assistant (AI test suggestions and security analysis)"
        >
          <Sparkles className={`w-4 h-4 ${showAIPanel ? 'animate-pulse' : ''}`} />
          {/* Indicator badge when panel is hidden */}
          {!showAIPanel && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-electric-blue rounded-full animate-pulse" />
          )}
        </button>
        <button
          onClick={() => createTab()}
          className="px-4 py-3 text-white/60 hover:text-white hover:bg-[#0A1929]/50 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {!activeTab ? (
        <div className="flex-1 flex items-center justify-center text-white/40">
          <p>No active tab</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Content: Request + Response Split + AI Panel */}
          <div className="flex-1 flex overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            {/* Request Editor (Left side - flexible width) */}
            <div className={`${showAIPanel ? 'flex-1 min-w-[400px]' : 'w-1/2 min-w-[400px]'} flex flex-col border-r border-white/10`}>
              {/* Request Header */}
              <div className="px-4 py-3 border-b border-white/10 bg-[#0D1F2D]">
                <div className="flex items-center gap-2 min-w-0">
                  {/* Method Selector */}
                  <select
                    value={activeTab.request.method}
                    onChange={(e) => updateRequest(activeTab.id, 'method', e.target.value)}
                    className="px-3 py-1.5 bg-[#0A1929] text-white border border-white/20 rounded text-sm font-medium"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                    <option value="HEAD">HEAD</option>
                    <option value="OPTIONS">OPTIONS</option>
                  </select>

                  {/* URL Input */}
                  <input
                    type="text"
                    value={activeTab.request.url}
                    onChange={(e) => updateRequest(activeTab.id, 'url', e.target.value)}
                    placeholder="https://example.com/api/endpoint"
                    className="flex-1 min-w-0 px-3 py-1.5 bg-[#0A1929] text-white border border-white/20 rounded text-sm"
                  />

                  {/* Send Button */}
                  <button
                    onClick={handleSend}
                    disabled={activeTab.isLoading}
                    className="flex-shrink-0 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {activeTab.isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Send
                      </>
                    )}
                  </button>
                </div>

                {activeTab.error && (
                  <div className="mt-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
                    {activeTab.error}
                  </div>
                )}
              </div>

              {/* Request Tabs */}
              <div className="flex border-b border-white/10 bg-[#0D1F2D]">
                <button
                  onClick={() => setActiveEditorTab('headers')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeEditorTab === 'headers'
                      ? 'text-white border-b-2 border-blue-500'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Headers
                </button>
                <button
                  onClick={() => setActiveEditorTab('body')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeEditorTab === 'body'
                      ? 'text-white border-b-2 border-blue-500'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Body
                </button>
              </div>

              {/* Request Content */}
              <div className="flex-1 overflow-auto p-4">
                {activeEditorTab === 'headers' ? (
                  <div className="space-y-2">
                    {/* Existing Headers */}
                    {Object.entries(activeTab.request.headers).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={key}
                          readOnly
                          className="flex-1 px-3 py-1.5 bg-[#0D1F2D] text-white/60 border border-white/10 rounded text-sm"
                        />
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => updateHeader(activeTab.id, key, e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-[#0A1929] text-white border border-white/20 rounded text-sm"
                        />
                        <button
                          onClick={() => removeHeader(activeTab.id, key)}
                          className="p-1.5 text-red-400 hover:bg-red-500/10 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {/* Add New Header */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                      <input
                        type="text"
                        value={newHeaderKey}
                        onChange={(e) => setNewHeaderKey(e.target.value)}
                        placeholder="Header name"
                        className="flex-1 px-3 py-1.5 bg-[#0A1929] text-white border border-white/20 rounded text-sm"
                      />
                      <input
                        type="text"
                        value={newHeaderValue}
                        onChange={(e) => setNewHeaderValue(e.target.value)}
                        placeholder="Header value"
                        className="flex-1 px-3 py-1.5 bg-[#0A1929] text-white border border-white/20 rounded text-sm"
                      />
                      <button
                        onClick={handleAddHeader}
                        disabled={!newHeaderKey.trim()}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <textarea
                    value={activeTab.request.body || ''}
                    onChange={(e) => updateRequest(activeTab.id, 'body', e.target.value)}
                    placeholder="Request body (JSON, XML, etc.)"
                    className="w-full h-full px-3 py-2 bg-[#0A1929] text-white border border-white/20 rounded text-sm font-mono resize-none"
                  />
                )}
              </div>
            </div>

            {/* Response Viewer (Right side - flexible width) */}
            <div className={`${showAIPanel ? 'flex-1 min-w-[400px]' : 'w-1/2 min-w-[400px]'} flex flex-col bg-[#0D1F2D]`}>
              {/* Response Header */}
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="text-sm font-medium text-white">Response</h3>
                  {activeTab.response && (
                    <>
                      <span className={`text-sm font-medium ${getStatusColor(activeTab.response.statusCode)}`}>
                        {activeTab.response.statusCode} {activeTab.response.statusMessage}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-white/60">
                        <Clock className="w-3 h-3" />
                        {activeTab.response.responseTime}ms
                      </span>
                    </>
                  )}
                </div>
                {activeTab.response && (
                  <button
                    onClick={copyResponseToClipboard}
                    className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Response Content */}
              <div className="flex-1 overflow-auto">
                {!activeTab.response ? (
                  <div className="flex items-center justify-center h-full text-white/40">
                    <p>Send a request to see the response</p>
                  </div>
                ) : (
                  <ResponseViewer
                    statusCode={activeTab.response.statusCode}
                    statusMessage={activeTab.response.statusMessage}
                    headers={activeTab.response.headers}
                    body={activeTab.response.body}
                    responseTime={activeTab.response.responseTime}
                  />
                )}
              </div>
            </div>

            {/* AI Assistant Panel (Right side - 320px when shown inline OR modal in Portal) */}
            {showAIPanel && activeTab && window.innerWidth >= 1024 && (
              <RepeaterAIPanel
                tabId={activeTab.id}
                request={activeTab.request}
                onExecuteTest={handleExecuteAITest}
                autoExecute={autoExecuteAI}
                onToggleAutoExecute={setAutoExecuteAI}
              />
            )}
          </div>

          {/* History Bottom Panel (20% height) */}
          {activeTab.history.length > 0 && (
            <div className="h-[20%] border-t border-white/10 flex flex-col">
              <div className="px-4 py-2 bg-[#0D1F2D] border-b border-white/10 flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">History ({activeTab.history.length})</h3>
                <button
                  onClick={() => clearHistory(activeTab.id)}
                  className="text-xs text-white/60 hover:text-white"
                >
                  Clear
                </button>
              </div>
              <div className="flex-1 overflow-auto">
                {activeTab.history.map((entry, index) => (
                  <button
                    key={entry.id}
                    onClick={() => selectHistoryEntry(activeTab.id, entry.id)}
                    className="w-full px-4 py-2 text-left hover:bg-white/5 border-b border-white/5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-white/40">#{activeTab.history.length - index}</span>
                      <span className={`text-xs font-medium ${getMethodColor(entry.request.method)}`}>
                        {entry.request.method}
                      </span>
                      <span className="text-xs text-white/60 truncate max-w-[300px]">
                        {entry.request.url}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs ${getStatusColor(entry.response.statusCode)}`}>
                        {entry.response.statusCode}
                      </span>
                      <span className="text-xs text-white/40">{entry.response.responseTime}ms</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Assistant Modal (Portal for small screens or narrow panels) */}
      {showAIPanel && activeTab && window.innerWidth < 1024 && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            style={{ zIndex: 2147483646 }}
            onClick={() => setShowAIPanel(false)}
          />

          {/* Modal Panel */}
          <div
            className="fixed right-4 top-4 bottom-4 w-[400px] max-w-[90vw] rounded-lg shadow-2xl border-2 border-white/20 overflow-hidden"
            style={{
              backgroundColor: '#0D1F2D',
              zIndex: 2147483647,
            }}
          >
            {/* Header */}
            <div className="px-4 py-3 bg-[#0A1929] border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-electric-blue" />
                AI Assistant
              </h3>
              <button
                onClick={() => setShowAIPanel(false)}
                className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-auto h-full">
              <RepeaterAIPanel
                tabId={activeTab.id}
                request={activeTab.request}
                onExecuteTest={handleExecuteAITest}
                autoExecute={autoExecuteAI}
                onToggleAutoExecute={setAutoExecuteAI}
              />
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
