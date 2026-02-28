import { useEffect } from 'react';
import { useExtensionStore } from '../stores/extensionStore';
import { Wifi, WifiOff, Play, Square, Monitor, Loader2, Chrome, Download, RefreshCw, Link, Unlink, AlertTriangle } from 'lucide-react';
import { wsService } from '../lib/websocket';

/**
 * ExtensionControls - CDP Architecture Control Panel
 *
 * Shows extension connection status, intercept controls, tab management, and stats.
 * Filters out the ReqSploit dashboard tab from the list.
 */
export function ExtensionControls() {
  const {
    isConnected,
    extensionVersion,
    isActive,
    isLoading,
    interceptEnabled,
    responseInterceptEnabled,
    stats,
    startSession,
    stopSession,
    toggleIntercept,
    availableTabs,
    isLoadingTabs,
    requestTabsList,
    attachTab,
    detachTab,
  } = useExtensionStore();

  // Auto-refresh tabs when connected
  useEffect(() => {
    if (isConnected && isActive) {
      requestTabsList();
    }
  }, [isConnected, isActive]);

  // --- Helpers ---

  // Filter out the ReqSploit dashboard tab
  const filteredTabs = availableTabs.filter((tab) => {
    const url = tab.url.toLowerCase();
    const title = (tab.title || '').toLowerCase();
    return !url.includes('reqsploit') && !url.includes('localhost:5173') && !title.includes('reqsploit');
  });

  const attachedCount = filteredTabs.filter((t) => t.attached).length;
  const allAttached = filteredTabs.length > 0 && attachedCount === filteredTabs.length;

  const truncateUrl = (url: string, maxLength: number = 48): string => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength - 3) + '...';
  };

  // --- Handlers ---

  const handleStartStop = async () => {
    try {
      if (isActive) {
        await stopSession();
      } else {
        await startSession(true);
      }
    } catch (error) {
      console.error('[ExtensionControls] Start/stop failed:', error);
    }
  };

  const handleToggleRequestIntercept = () => {
    toggleIntercept(!interceptEnabled);
  };

  const handleToggleResponseIntercept = () => {
    wsService.toggleIntercept(!responseInterceptEnabled);
  };

  const handleDetachAllTabs = () => {
    for (const tab of filteredTabs.filter((t) => t.attached)) {
      detachTab(tab.tabId);
    }
  };

  const handleAttachAllFiltered = () => {
    for (const tab of filteredTabs.filter((t) => !t.attached)) {
      attachTab(tab.tabId);
    }
  };

  return (
    <div className="p-4 border-b border-white/10 space-y-4">
      {/* Title */}
      <h2 className="text-lg font-semibold text-white">Extension Control</h2>

      {/* Connection Status Indicator */}
      <div className="flex items-center justify-between p-3 bg-white/5 rounded-md">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Wifi className="w-4 h-4 text-cyber-green" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-400" />
          )}
          <span className="text-sm text-gray-300">
            {isConnected ? 'Extension Connected' : 'Extension Disconnected'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isConnected
                ? 'bg-cyber-green shadow-[0_0_6px_rgba(0,255,136,0.5)]'
                : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]'
            }`}
          />
        </div>
      </div>

      {/* Extension Version */}
      {isConnected && extensionVersion && (
        <div className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-md">
          <span className="text-xs text-gray-400">Extension Version</span>
          <span className="text-xs font-mono text-gray-300">v{extensionVersion}</span>
        </div>
      )}

      {/* Start/Stop Intercepting Button */}
      <button
        onClick={handleStartStop}
        disabled={isLoading || !isConnected}
        className={`w-full px-4 py-3 rounded-md font-medium transition-colors duration-200 flex items-center justify-center gap-2 ${
          isActive
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-cyber-green hover:bg-cyber-green/90 text-deep-navy'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isActive ? (
          <Square className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5" />
        )}
        {isLoading
          ? 'Processing...'
          : isActive
            ? 'Stop Intercepting'
            : 'Start Intercepting'}
      </button>

      {/* Not connected - Get Extension CTA */}
      {!isConnected && (
        <div className="space-y-3">
          <a
            href="/extension"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 text-blue-400 rounded-md transition text-sm font-medium"
          >
            <Chrome className="w-4 h-4" />
            Get Chrome Extension
          </a>
          <a
            href="/reqsploit-extension-v2.1.1.zip"
            download
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-md transition text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Direct Download (.zip)
          </a>
        </div>
      )}

      {/* Active Session Controls */}
      {isActive && (
        <div className="space-y-3">
          {/* Intercept Toggles */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Intercept Mode
            </p>

            {/* Intercept Requests Toggle */}
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-md">
              <span className="text-sm text-gray-300">Intercept Requests</span>
              <button
                onClick={handleToggleRequestIntercept}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                  interceptEnabled ? 'bg-cyber-green' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                    interceptEnabled ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {/* Intercept Responses Toggle */}
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-md">
              <span className="text-sm text-gray-300">Intercept Responses</span>
              <button
                onClick={handleToggleResponseIntercept}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                  responseInterceptEnabled ? 'bg-cyber-green' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                    responseInterceptEnabled ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Tab Management Section - Always visible */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Browser Tabs ({attachedCount} intercepted)
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={requestTabsList}
                  disabled={isLoadingTabs}
                  className="p-1 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-gray-300 rounded transition disabled:opacity-50"
                  title="Refresh tabs"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingTabs ? 'animate-spin' : ''}`} />
                </button>
                {!allAttached ? (
                  <button
                    onClick={handleAttachAllFiltered}
                    className="p-1 bg-cyber-green/10 hover:bg-cyber-green/20 border border-cyber-green/20 text-cyber-green rounded transition"
                    title="Attach all tabs"
                  >
                    <Link className="w-3 h-3" />
                  </button>
                ) : (
                  <button
                    onClick={handleDetachAllTabs}
                    className="p-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded transition"
                    title="Detach all tabs"
                  >
                    <Unlink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Warning when 0 tabs attached */}
            {attachedCount === 0 && !isLoadingTabs && (
              <div className="flex items-center gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-md">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <p className="text-xs text-amber-300">
                  No tabs intercepted. Select at least one tab below to capture traffic.
                </p>
              </div>
            )}

            {/* Tabs List */}
            {isLoadingTabs ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                <span className="text-xs text-gray-400 ml-2">Loading tabs...</span>
              </div>
            ) : filteredTabs.length === 0 ? (
              <div className="text-center py-3 bg-white/5 rounded-md">
                <Monitor className="w-5 h-5 text-gray-500 mx-auto mb-1" />
                <p className="text-xs text-gray-500">No browser tabs found</p>
                <p className="text-xs text-gray-600 mt-1">Click refresh to scan</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-56 overflow-y-auto">
                {filteredTabs.map((tab) => (
                  <div
                    key={tab.tabId}
                    className={`flex items-center gap-2 p-2 rounded-md transition ${
                      tab.attached
                        ? 'bg-cyber-green/5 border border-cyber-green/20'
                        : 'bg-white/5 border border-transparent hover:border-white/10'
                    }`}
                  >
                    {/* Toggle switch per tab */}
                    <button
                      onClick={() => tab.attached ? detachTab(tab.tabId) : attachTab(tab.tabId)}
                      className={`relative w-8 h-4 rounded-full transition-colors duration-200 flex-shrink-0 ${
                        tab.attached ? 'bg-cyber-green' : 'bg-gray-600'
                      }`}
                      title={tab.attached ? 'Stop intercepting this tab' : 'Intercept this tab'}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${
                          tab.attached ? 'translate-x-4' : ''
                        }`}
                      />
                    </button>

                    {/* Tab info */}
                    <div className="flex-1 min-w-0">
                      {tab.title && (
                        <p className="text-xs text-gray-300 truncate">{tab.title}</p>
                      )}
                      <p className="text-xs text-gray-500 font-mono truncate" title={tab.url}>
                        {truncateUrl(tab.url)}
                      </p>
                    </div>

                    {/* Active tab indicator */}
                    {tab.active && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" title="Active tab" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats Section */}
          {stats && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Statistics
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between p-2 bg-white/5 rounded-md">
                  <span className="text-xs text-gray-400">Total</span>
                  <span className="text-sm font-semibold text-white">
                    {stats.totalRequests}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/5 rounded-md">
                  <span className="text-xs text-gray-400">Intercepted</span>
                  <span className="text-sm font-semibold text-cyber-green">
                    {stats.interceptedRequests}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/5 rounded-md">
                  <span className="text-xs text-gray-400">Forwarded</span>
                  <span className="text-sm font-semibold text-blue-400">
                    {stats.forwarded}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/5 rounded-md">
                  <span className="text-xs text-gray-400">Dropped</span>
                  <span className="text-sm font-semibold text-red-400">
                    {stats.dropped}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
