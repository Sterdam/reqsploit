import { useState, useEffect } from 'react';
import './popup.css';

interface ProxyStatus {
  isAuthenticated: boolean;
  proxyEnabled: boolean;
  proxyPort: number | null;
}

interface CertificateStatus {
  installed: boolean;
  checking: boolean;
}

export function Popup() {
  const [status, setStatus] = useState<ProxyStatus>({
    isAuthenticated: false,
    proxyEnabled: false,
    proxyPort: null,
  });
  const [certStatus, setCertStatus] = useState<CertificateStatus>({
    installed: false,
    checking: true,
  });
  const [showCertGuide, setShowCertGuide] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load status on mount
  useEffect(() => {
    loadStatus();
    checkCertificateStatus();
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

  const checkCertificateStatus = async () => {
    setCertStatus({ installed: false, checking: true });

    try {
      // Try to fetch from a test HTTPS endpoint through the proxy
      // If certificate is not installed, this will fail with certificate error
      const stored = await chrome.storage.local.get(['certificateInstalled']);

      // Simple check: has user marked it as installed?
      setCertStatus({
        installed: stored.certificateInstalled || false,
        checking: false,
      });
    } catch (err) {
      setCertStatus({ installed: false, checking: false });
    }
  };

  const handleDownloadCertificate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Use the default certificate endpoint (no auth required)
      const response = await chrome.runtime.sendMessage({
        action: status.isAuthenticated ? 'downloadCertificate' : 'downloadDefaultCertificate'
      });

      if (response.success) {
        // Show the installation guide
        setShowCertGuide(true);

        // Open Chrome certificate settings
        chrome.tabs.create({ url: 'chrome://settings/certificates' });
      } else {
        setError(response.error || 'Failed to download certificate');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to download certificate');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkCertificateInstalled = async () => {
    await chrome.storage.local.set({ certificateInstalled: true });
    setCertStatus({ installed: true, checking: false });
    setShowCertGuide(false);
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
            {/* Certificate Info */}
            {!certStatus.installed && !certStatus.checking && (
              <div className="popup-info">
                <p className="popup-info-title">🔐 Certificate Setup</p>
                <p className="popup-info-text">
                  Install the Root CA certificate to intercept HTTPS traffic
                </p>
                <button
                  onClick={handleDownloadCertificate}
                  className="popup-button popup-button-secondary"
                  disabled={isLoading}
                >
                  Download & Install Certificate
                </button>
              </div>
            )}

            {/* Certificate Installation Guide */}
            {showCertGuide && (
              <div className="popup-guide">
                <p className="popup-guide-title">📝 Certificate Installation Steps</p>
                <ol className="popup-guide-list">
                  <li>The certificate settings page has been opened</li>
                  <li>Click on the <strong>Authorities</strong> tab</li>
                  <li>Click <strong>Import</strong> button</li>
                  <li>Select the downloaded <code>reqsploit-ca.crt</code> file</li>
                  <li>Check <strong>"Trust this certificate for identifying websites"</strong></li>
                  <li>Click <strong>OK</strong></li>
                </ol>
                <button
                  onClick={handleMarkCertificateInstalled}
                  className="popup-button popup-button-success"
                >
                  ✓ I've installed the certificate
                </button>
              </div>
            )}

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

              {/* Certificate Status Indicator */}
              {!certStatus.checking && (
                <div className="popup-status" style={{ marginTop: '8px' }}>
                  <div className="popup-status-dot-container">
                    <div
                      className={`popup-status-dot ${
                        certStatus.installed ? 'popup-status-dot-active' : ''
                      }`}
                    />
                  </div>
                  <div>
                    <p className="popup-status-label">Certificate</p>
                    <p className="popup-status-value">
                      {certStatus.installed ? 'Installed' : 'Not installed'}
                    </p>
                  </div>
                </div>
              )}
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
