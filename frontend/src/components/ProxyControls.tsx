import { useState, useEffect } from 'react';
import { useProxyStore } from '../stores/proxyStore';
import { certificateAPI } from '../lib/api';
import { Shield, Download, CheckCircle, Loader2 } from 'lucide-react';

export function ProxyControls() {
  const { session, stats, isActive, isLoading, startSession, stopSession, toggleIntercept } =
    useProxyStore();
  const [isDownloading, setIsDownloading] = useState(false);
  const [showCertGuide, setShowCertGuide] = useState(false);
  const [certInstalled, setCertInstalled] = useState(false);

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

  // Load certificate status from localStorage
  useEffect(() => {
    const installed = localStorage.getItem('reqsploit_cert_installed') === 'true';
    setCertInstalled(installed);
  }, []);

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

      // Show installation guide after download
      setShowCertGuide(true);
    } catch (error) {
      console.error('Failed to download certificate:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleMarkCertInstalled = () => {
    localStorage.setItem('reqsploit_cert_installed', 'true');
    setCertInstalled(true);
    setShowCertGuide(false);
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
        className={`w-full px-4 py-3 rounded-md font-medium transition-colors duration-200 flex items-center justify-center gap-2 ${
          isActive
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-cyber-green hover:bg-cyber-green/90 text-deep-navy'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
        {isLoading ? 'Starting Proxy...' : isActive ? 'Stop Proxy' : 'Start Proxy'}
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

      {/* Certificate Section */}
      <div className="space-y-3">
        {/* Certificate Status */}
        <div className={`p-3 rounded-md border ${
          certInstalled
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : 'bg-blue-500/10 border-blue-500/30'
        }`}>
          <div className="flex items-start gap-3">
            {certInstalled ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                certInstalled ? 'text-emerald-200' : 'text-blue-200'
              }`}>
                {certInstalled ? 'Certificate Installed ✓' : 'Certificate Setup'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {certInstalled
                  ? 'Your browser trusts the ReqSploit Root CA'
                  : 'Install Root CA to intercept HTTPS traffic'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Download Button */}
        <button
          onClick={handleDownloadCertificate}
          disabled={isDownloading}
          className="w-full px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          {isDownloading ? 'Downloading...' : 'Download Root CA Certificate'}
        </button>

        {/* Installation Guide */}
        {showCertGuide && (
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-md space-y-3">
            <div className="flex items-start gap-2">
              <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-200 mb-3">
                  Certificate Installation Guide
                </p>

                {/* Browser-specific instructions */}
                <div className="space-y-4">
                  {/* Chrome/Edge */}
                  <div>
                    <p className="text-xs font-medium text-white mb-2">
                      🌐 Chrome / Edge / Brave
                    </p>
                    <ol className="text-xs text-gray-300 space-y-1.5 list-decimal list-inside ml-2">
                      <li>Open Settings → Privacy and Security → Security</li>
                      <li>Click "Manage certificates" or "Manage device certificates"</li>
                      <li>Go to the <span className="font-semibold text-white">Authorities</span> tab</li>
                      <li>Click <span className="font-semibold text-white">Import</span></li>
                      <li>Select <code className="px-1.5 py-0.5 bg-white/10 rounded text-cyan-400">reqsploit-ca.crt</code></li>
                      <li>Check <span className="font-semibold text-white">"Trust this certificate for identifying websites"</span></li>
                      <li>Click OK</li>
                    </ol>
                  </div>

                  {/* Firefox */}
                  <div>
                    <p className="text-xs font-medium text-white mb-2">
                      🦊 Firefox
                    </p>
                    <ol className="text-xs text-gray-300 space-y-1.5 list-decimal list-inside ml-2">
                      <li>Open Settings → Privacy & Security</li>
                      <li>Scroll to "Certificates" → Click <span className="font-semibold text-white">View Certificates</span></li>
                      <li>Go to <span className="font-semibold text-white">Authorities</span> tab</li>
                      <li>Click <span className="font-semibold text-white">Import</span></li>
                      <li>Select <code className="px-1.5 py-0.5 bg-white/10 rounded text-cyan-400">reqsploit-ca.crt</code></li>
                      <li>Check <span className="font-semibold text-white">"Trust this CA to identify websites"</span></li>
                      <li>Click OK</li>
                    </ol>
                  </div>
                </div>

                {/* Confirmation Button */}
                <button
                  onClick={handleMarkCertInstalled}
                  className="mt-4 w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  I've Installed the Certificate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Toggle for Guide */}
        {!showCertGuide && !certInstalled && (
          <button
            onClick={() => setShowCertGuide(true)}
            className="w-full text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-center gap-1"
          >
            <Shield className="w-3 h-3" />
            Show installation instructions
          </button>
        )}
      </div>

      {/* Quick Setup Instructions */}
      {isActive && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-md">
          <p className="text-xs text-blue-200 font-medium mb-2">Quick Setup:</p>
          <ol className="text-xs text-gray-300 space-y-1 list-decimal list-inside">
            <li>Configure browser proxy to <code className="px-1 py-0.5 bg-white/10 rounded text-cyan-400">localhost:{session?.proxyPort}</code></li>
            <li>Install Root CA certificate (above)</li>
            <li>Browse the web - traffic will be intercepted!</li>
          </ol>
        </div>
      )}
    </div>
  );
}
