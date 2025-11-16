/**
 * Background Service Worker for ReqSploit
 * Handles proxy configuration and communication with backend
 */

const API_URL = 'http://localhost:3000';

interface ProxyConfig {
  port: number;
  enabled: boolean;
}

interface UserState {
  isAuthenticated: boolean;
  accessToken: string | null;
  proxyPort: number | null;
  proxyEnabled: boolean;
}

// State management
let userState: UserState = {
  isAuthenticated: false,
  accessToken: null,
  proxyPort: null,
  proxyEnabled: false,
};

/**
 * Initialize extension
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[ReqSploit] Extension installed');

  // Load saved state from storage
  const stored = await chrome.storage.local.get(['accessToken', 'proxyPort', 'proxyEnabled', 'certificateInstalled']);

  if (stored.accessToken) {
    userState.isAuthenticated = true;
    userState.accessToken = stored.accessToken;
    userState.proxyPort = stored.proxyPort || null;
    userState.proxyEnabled = stored.proxyEnabled || false;

    // Sync with backend to get real state
    await syncWithBackend();
  }

  // Create context menu items
  chrome.contextMenus.create({
    id: 'reqsploit-analyze',
    title: 'Analyze with ReqSploit',
    contexts: ['page', 'link'],
  });

  // On first install, prompt for certificate installation
  if (details.reason === 'install' && !stored.certificateInstalled) {
    await promptCertificateInstallation();
  }
});

/**
 * On extension startup (browser restart)
 */
chrome.runtime.onStartup.addListener(async () => {
  console.log('[ReqSploit] Extension started');

  // Load saved state from storage
  const stored = await chrome.storage.local.get(['accessToken', 'proxyPort', 'proxyEnabled']);

  if (stored.accessToken) {
    userState.isAuthenticated = true;
    userState.accessToken = stored.accessToken;
    userState.proxyPort = stored.proxyPort || null;
    userState.proxyEnabled = stored.proxyEnabled || false;

    // Sync with backend to get real state
    await syncWithBackend();
  }
});

/**
 * Periodic sync with backend (every 10 seconds)
 */
setInterval(async () => {
  if (userState.isAuthenticated && userState.accessToken) {
    await syncWithBackend();
  }
}, 10000);

/**
 * Configure Chrome proxy settings
 */
async function configureProxy(port: number): Promise<void> {
  const config = {
    mode: 'fixed_servers',
    rules: {
      singleProxy: {
        scheme: 'http',
        host: '127.0.0.1',
        port: port,
      },
      bypassList: ['localhost', '127.0.0.1'],
    },
  };

  try {
    await chrome.proxy.settings.set({
      value: config,
      scope: 'regular',
    });

    userState.proxyEnabled = true;
    userState.proxyPort = port;

    // Save to storage
    await chrome.storage.local.set({
      proxyEnabled: true,
      proxyPort: port,
    });

    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'ReqSploit',
      message: `Proxy enabled on port ${port}`,
    });

    console.log('[ReqSploit] Proxy configured:', config);
  } catch (error) {
    console.error('[ReqSploit] Failed to configure proxy:', error);
    throw error;
  }
}

/**
 * Clear Chrome proxy settings
 */
async function clearProxy(): Promise<void> {
  try {
    await chrome.proxy.settings.clear({ scope: 'regular' });

    userState.proxyEnabled = false;

    // Save to storage
    await chrome.storage.local.set({
      proxyEnabled: false,
    });

    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'ReqSploit',
      message: 'Proxy disabled',
    });

    console.log('[ReqSploit] Proxy cleared');
  } catch (error) {
    console.error('[ReqSploit] Failed to clear proxy:', error);
    throw error;
  }
}

/**
 * Start proxy session via API
 */
async function startProxySession(): Promise<number> {
  if (!userState.accessToken) {
    throw new Error('Not authenticated');
  }

  try {
    const response = await fetch(`${API_URL}/api/proxy/session/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userState.accessToken}`,
      },
      body: JSON.stringify({ interceptMode: true }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const proxyPort = data.data.session.proxyPort;

    // Configure Chrome proxy
    await configureProxy(proxyPort);

    return proxyPort;
  } catch (error) {
    console.error('[ReqSploit] Failed to start proxy session:', error);
    throw error;
  }
}

/**
 * Stop proxy session via API
 */
async function stopProxySession(): Promise<void> {
  if (!userState.accessToken) {
    throw new Error('Not authenticated');
  }

  try {
    // Clear Chrome proxy first
    await clearProxy();

    // Then stop backend session
    const response = await fetch(`${API_URL}/api/proxy/session/stop`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${userState.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    userState.proxyPort = null;
    await chrome.storage.local.set({ proxyPort: null });
  } catch (error) {
    console.error('[ReqSploit] Failed to stop proxy session:', error);
    throw error;
  }
}

/**
 * Sync state with backend
 */
async function syncWithBackend(): Promise<void> {
  if (!userState.accessToken) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/proxy/session/status`, {
      headers: {
        'Authorization': `Bearer ${userState.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const backendState = data.data;

    // Sync state with backend
    if (backendState.hasActiveSession && backendState.session) {
      const backendPort = backendState.session.proxyPort;

      // Backend has active session but extension doesn't
      if (!userState.proxyEnabled || userState.proxyPort !== backendPort) {
        console.log('[ReqSploit] Syncing with backend - configuring proxy');
        await configureProxy(backendPort);
      }
    } else {
      // Backend has no active session but extension thinks it does
      if (userState.proxyEnabled) {
        console.log('[ReqSploit] Syncing with backend - clearing proxy');
        await clearProxy();
      }
    }
  } catch (error) {
    console.error('[ReqSploit] Failed to sync with backend:', error);
  }
}

/**
 * Get proxy status
 */
async function getProxyStatus(): Promise<{
  isAuthenticated: boolean;
  proxyEnabled: boolean;
  proxyPort: number | null;
}> {
  // Sync with backend first
  await syncWithBackend();

  return {
    isAuthenticated: userState.isAuthenticated,
    proxyEnabled: userState.proxyEnabled,
    proxyPort: userState.proxyPort,
  };
}

/**
 * Set authentication token
 */
async function setAuthToken(token: string): Promise<void> {
  userState.isAuthenticated = true;
  userState.accessToken = token;

  await chrome.storage.local.set({
    accessToken: token,
  });
}

/**
 * Clear authentication
 */
async function clearAuth(): Promise<void> {
  // Stop proxy if running
  if (userState.proxyEnabled) {
    await stopProxySession();
  }

  userState.isAuthenticated = false;
  userState.accessToken = null;
  userState.proxyPort = null;
  userState.proxyEnabled = false;

  await chrome.storage.local.clear();
}

/**
 * Download default certificate (no auth required)
 */
async function downloadDefaultCertificate(): Promise<void> {
  try {
    const downloadId = await chrome.downloads.download({
      url: `${API_URL}/api/certificates/default/download`,
      filename: 'reqsploit-ca.crt',
      saveAs: true,
    });

    console.log('[ReqSploit] Default certificate download started:', downloadId);

    // Mark certificate as installed after download
    await chrome.storage.local.set({ certificateInstalled: true });
  } catch (error) {
    console.error('[ReqSploit] Failed to download default certificate:', error);
    throw error;
  }
}

/**
 * Download authenticated user certificate
 */
async function downloadCertificate(): Promise<void> {
  if (!userState.accessToken) {
    throw new Error('Not authenticated');
  }

  try {
    // Service workers can't use URL.createObjectURL, so we download directly from the backend
    const downloadId = await chrome.downloads.download({
      url: `${API_URL}/api/certificates/root/download`,
      filename: 'reqsploit-ca.crt',
      saveAs: true,
      headers: [
        { name: 'Authorization', value: `Bearer ${userState.accessToken}` }
      ],
    });

    console.log('[ReqSploit] Certificate download started:', downloadId);
  } catch (error) {
    console.error('[ReqSploit] Failed to download certificate:', error);
    throw error;
  }
}

/**
 * Prompt user to install certificate
 */
async function promptCertificateInstallation(): Promise<void> {
  try {
    // Show notification with instructions
    await chrome.notifications.create('cert-install', {
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'ReqSploit - Certificate Installation Required',
      message: 'Click to download and install the Root CA certificate to use HTTPS interception.',
      priority: 2,
      requireInteraction: true,
    });

    console.log('[ReqSploit] Certificate installation prompt shown');
  } catch (error) {
    console.error('[ReqSploit] Failed to show certificate prompt:', error);
  }
}

/**
 * Handle notification clicks
 */
chrome.notifications.onClicked.addListener(async (notificationId) => {
  if (notificationId === 'cert-install') {
    // Download certificate
    await downloadDefaultCertificate();

    // Clear notification
    await chrome.notifications.clear('cert-install');

    // Show installation instructions
    await chrome.notifications.create('cert-instructions', {
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'ReqSploit - Install Certificate',
      message: 'Open Chrome Settings → Privacy & Security → Manage certificates → Authorities → Import the downloaded file.',
      priority: 1,
      requireInteraction: false,
    });
  }
});

/**
 * Message handler from popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.action) {
        case 'startProxy':
          const port = await startProxySession();
          sendResponse({ success: true, port });
          break;

        case 'stopProxy':
          await stopProxySession();
          sendResponse({ success: true });
          break;

        case 'getStatus':
          const status = await getProxyStatus();
          sendResponse({ success: true, ...status });
          break;

        case 'setAuthToken':
          await setAuthToken(message.token);
          sendResponse({ success: true });
          break;

        case 'clearAuth':
          await clearAuth();
          sendResponse({ success: true });
          break;

        case 'downloadCertificate':
          await downloadCertificate();
          sendResponse({ success: true });
          break;

        case 'downloadDefaultCertificate':
          await downloadDefaultCertificate();
          sendResponse({ success: true });
          break;

        case 'promptCertificateInstallation':
          await promptCertificateInstallation();
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error: any) {
      console.error('[ReqSploit] Message handler error:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();

  // Return true to indicate async response
  return true;
});

/**
 * External message handler (from webapp)
 */
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  console.log('[ReqSploit] External message received:', message, 'from:', sender.url);

  (async () => {
    try {
      switch (message.action) {
        case 'ping':
          // Extension detection ping from webapp
          sendResponse({ success: true, installed: true });
          break;

        case 'setAuthToken':
          // Token sync from webapp after login
          await setAuthToken(message.token);
          console.log('[ReqSploit] Auth token stored from webapp');
          sendResponse({ success: true });
          break;

        case 'getStatus':
          // Status query from webapp
          const status = await getProxyStatus();
          sendResponse({ success: true, ...status });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown external action' });
      }
    } catch (error: any) {
      console.error('[ReqSploit] External message handler error:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();

  // Return true to indicate async response
  return true;
});

/**
 * Context menu handler
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'reqsploit-analyze') {
    // Open dashboard with analysis
    chrome.tabs.create({
      url: `${API_URL.replace(':3000', ':5173')}/dashboard`,
    });
  }
});

console.log('[ReqSploit] Background service worker initialized');
