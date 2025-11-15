import { useState } from 'react';
import { useProxyStore } from '../stores/proxyStore';
import { certificateAPI } from '../lib/api';

export function ProxyControls() {
  const { session, stats, isActive, isLoading, startSession, stopSession, toggleIntercept } =
    useProxyStore();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleStartStop = async () => {
    if (isActive) {
      await stopSession();
    } else {
      await startSession(true); // Start with intercept mode enabled
    }
  };

  const handleToggleIntercept = async () => {
    if (session) {
      await toggleIntercept(!session.interceptMode);
    }
  };

  const handleDownloadCertificate = async () => {
    setIsDownloading(true);
    try {
      const blob = await certificateAPI.download();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'reqsploit-ca.crt';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download certificate:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  return (
    <div className="p-4 border-b border-white/10 space-y-4">
      {/* Title */}
      <h2 className="text-lg font-semibold text-white">Proxy Control</h2>

      {/* Start/Stop Button */}
      <button
        onClick={handleStartStop}
        disabled={isLoading}
        className={`w-full px-4 py-3 rounded-md font-medium transition-colors duration-200 ${
          isActive
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-cyber-green hover:bg-cyber-green/90 text-deep-navy'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading ? 'Loading...' : isActive ? 'Stop Proxy' : 'Start Proxy'}
      </button>

      {/* Status */}
      {isActive && session && (
        <div className="space-y-3">
          {/* Proxy Port */}
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-md">
            <span className="text-sm text-gray-400">Proxy Port</span>
            <span className="text-sm font-mono font-semibold text-white">
              localhost:{session.proxyPort}
            </span>
          </div>

          {/* Intercept Mode Toggle */}
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-md">
            <span className="text-sm text-gray-400">Intercept Mode</span>
            <button
              onClick={handleToggleIntercept}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                session.interceptMode ? 'bg-cyber-green' : 'bg-gray-600'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                  session.interceptMode ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-white/5 rounded-md">
                <span className="text-xs text-gray-400">Total Requests</span>
                <span className="text-sm font-semibold text-white">{stats.totalRequests}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/5 rounded-md">
                <span className="text-xs text-gray-400">Intercepted</span>
                <span className="text-sm font-semibold text-cyber-green">
                  {stats.interceptedRequests}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/5 rounded-md">
                <span className="text-xs text-gray-400">Active Connections</span>
                <span className="text-sm font-semibold text-white">{stats.activeConnections}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/5 rounded-md">
                <span className="text-xs text-gray-400">Uptime</span>
                <span className="text-sm font-semibold text-white">
                  {formatUptime(stats.uptime)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Download Certificate */}
      <button
        onClick={handleDownloadCertificate}
        disabled={isDownloading}
        className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDownloading ? 'Downloading...' : 'Download Root CA Certificate'}
      </button>

      {/* Instructions */}
      {isActive && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-md">
          <p className="text-xs text-blue-200 font-medium mb-2">Setup Instructions:</p>
          <ol className="text-xs text-gray-300 space-y-1 list-decimal list-inside">
            <li>Configure browser proxy to localhost:{session?.proxyPort}</li>
            <li>Download and install Root CA certificate</li>
            <li>Browse the web - traffic will be intercepted!</li>
          </ol>
        </div>
      )}
    </div>
  );
}
