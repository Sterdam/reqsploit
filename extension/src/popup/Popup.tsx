import { useState, useEffect } from 'react';
import './popup.css';

interface ProxyStatus {
  isAuthenticated: boolean;
  proxyEnabled: boolean;
  proxyPort: number | null;
}

export function Popup() {
  const [status, setStatus] = useState<ProxyStatus>({
    isAuthenticated: false,
    proxyEnabled: false,
    proxyPort: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load status on mount
  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getStatus' });
      if (response.success) {
        setStatus({
          isAuthenticated: response.isAuthenticated,
          proxyEnabled: response.proxyEnabled,
          proxyPort: response.proxyPort,
        });
      }
    } catch (err) {
      console.error('Failed to load status:', err);
    }
  };

  const handleStartProxy = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await chrome.runtime.sendMessage({ action: 'startProxy' });

      if (response.success) {
        await loadStatus();
      } else {
        setError(response.error || 'Failed to start proxy');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start proxy');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopProxy = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await chrome.runtime.sendMessage({ action: 'stopProxy' });

      if (response.success) {
        await loadStatus();
      } else {
        setError(response.error || 'Failed to stop proxy');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to stop proxy');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCertificate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await chrome.runtime.sendMessage({ action: 'downloadCertificate' });

      if (!response.success) {
        setError(response.error || 'Failed to download certificate');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to download certificate');
    } finally {
      setIsLoading(false);
    }
  };

  const openDashboard = () => {
    chrome.tabs.create({ url: 'http://localhost:5173/dashboard' });
  };

  const openLogin = () => {
    chrome.tabs.create({ url: 'http://localhost:5173/login' });
  };

  return (
    <div className="popup-container">
      {/* Header */}
      <div className="popup-header">
        <h1 className="popup-title">
          Interceptor<span className="popup-title-ai">AI</span>
        </h1>
        <p className="popup-subtitle">Security Testing</p>
      </div>

      {/* Content */}
      <div className="popup-content">
        {!status.isAuthenticated ? (
          // Not authenticated
          <div className="popup-section">
            <p className="popup-message">Please login to use ReqSploit</p>
            <button onClick={openLogin} className="popup-button popup-button-primary">
              Open Login
            </button>
          </div>
        ) : (
          // Authenticated
          <>
            {/* Status */}
            <div className="popup-section">
              <div className="popup-status">
                <div className="popup-status-dot-container">
                  <div
                    className={`popup-status-dot ${
                      status.proxyEnabled ? 'popup-status-dot-active' : ''
                    }`}
                  />
                </div>
                <div>
                  <p className="popup-status-label">Proxy Status</p>
                  <p className="popup-status-value">
                    {status.proxyEnabled ? (
                      <>
                        Active on port <strong>{status.proxyPort}</strong>
                      </>
                    ) : (
                      'Inactive'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="popup-error">
                <p>{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="popup-section">
              {/* Start/Stop Button */}
              <button
                onClick={status.proxyEnabled ? handleStopProxy : handleStartProxy}
                disabled={isLoading}
                className={`popup-button ${
                  status.proxyEnabled ? 'popup-button-danger' : 'popup-button-primary'
                }`}
              >
                {isLoading
                  ? 'Loading...'
                  : status.proxyEnabled
                  ? 'Stop Proxy'
                  : 'Start Proxy'}
              </button>

              {/* Download Certificate */}
              <button
                onClick={handleDownloadCertificate}
                disabled={isLoading}
                className="popup-button popup-button-secondary"
              >
                Download Certificate
              </button>

              {/* Open Dashboard */}
              <button onClick={openDashboard} className="popup-button popup-button-secondary">
                Open Dashboard
              </button>
            </div>

            {/* Instructions */}
            {status.proxyEnabled && (
              <div className="popup-instructions">
                <p className="popup-instructions-title">Setup Complete!</p>
                <ol className="popup-instructions-list">
                  <li>Proxy is configured automatically</li>
                  <li>Install Root CA certificate (if not done)</li>
                  <li>Browse the web - traffic is intercepted!</li>
                  <li>View requests in the dashboard</li>
                </ol>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
