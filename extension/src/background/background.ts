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
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[ReqSploit] Extension installed');

  // Load saved state from storage
  const stored = await chrome.storage.local.get(['accessToken', 'proxyPort', 'proxyEnabled']);

  if (stored.accessToken) {
    userState.isAuthenticated = true;
    userState.accessToken = stored.accessToken;
    userState.proxyPort = stored.proxyPort || null;
    userState.proxyEnabled = stored.proxyEnabled || false;

    // Restore proxy if it was enabled
    if (userState.proxyEnabled && userState.proxyPort) {
      await configureProxy(userState.proxyPort);
    }
  }

  // Create context menu items
  chrome.contextMenus.create({
    id: 'reqsploit-analyze',
    title: 'Analyze with ReqSploit',
    contexts: ['page', 'link'],
  });
});

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
 * Get proxy status
 */
async function getProxyStatus(): Promise<{
  isAuthenticated: boolean;
  proxyEnabled: boolean;
  proxyPort: number | null;
}> {
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
 * Download certificate
 */
async function downloadCertificate(): Promise<void> {
  if (!userState.accessToken) {
    throw new Error('Not authenticated');
  }

  try {
    const response = await fetch(`${API_URL}/api/certificates/root/download`, {
      headers: {
        'Authorization': `Bearer ${userState.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    // Trigger download
    await chrome.downloads.download({
      url: url,
      filename: 'reqsploit-ca.crt',
      saveAs: true,
    });

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('[ReqSploit] Failed to download certificate:', error);
    throw error;
  }
}

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
