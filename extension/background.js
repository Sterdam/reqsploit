/**
 * ReqSploit Chrome Extension - Background Service Worker
 * Manages proxy configuration and communication with backend
 */

const PROXY_HOST = 'localhost';
const PROXY_PORT = 8080; // Standard proxy port
const BACKEND_URL = 'http://localhost:3000';

// Extension state
let proxyEnabled = false;
let requestCount = 0;
let backendConnected = false;

/**
 * Get authentication token from storage
 */
async function getAuthToken() {
  const result = await chrome.storage.local.get(['apiToken']);
  return result.apiToken;
}

/**
 * Initialize extension on install/startup
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log('ReqSploit extension installed');

  // Initialize storage
  chrome.storage.local.set({
    proxyEnabled: false,
    requestCount: 0,
    apiToken: null,
  });

  // Check backend connection
  checkBackendConnection();
});

/**
 * Check if backend is reachable and sync proxy state
 */
async function checkBackendConnection() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });

    backendConnected = response.ok;

    // If backend is connected, sync proxy state
    if (backendConnected) {
      await syncProxyState();
    }

    // Update extension icon
    updateIcon();

    return backendConnected;
  } catch (error) {
    backendConnected = false;
    updateIcon();
    return false;
  }
}

/**
 * Sync proxy state from backend
 * Checks if there's an active proxy session on the backend
 */
async function syncProxyState() {
  try {
    const token = await getAuthToken();
    if (!token) {
      // No token, assume proxy is off
      proxyEnabled = false;
      chrome.storage.local.set({ proxyEnabled: false });
      return;
    }

    const response = await fetch(`${BACKEND_URL}/api/proxy/session/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      // If unauthorized or error, assume no session
      proxyEnabled = false;
      chrome.storage.local.set({ proxyEnabled: false });
      return;
    }

    const data = await response.json();
    const hasActiveSession = data.success && data.data.hasActiveSession;

    // Update local state to match backend
    if (hasActiveSession !== proxyEnabled) {
      proxyEnabled = hasActiveSession;
      chrome.storage.local.set({ proxyEnabled: hasActiveSession });

      // If backend has session but Chrome proxy not configured, configure it
      if (hasActiveSession) {
        await configureProxySettings();
      } else {
        await clearProxySettings();
      }
    }
  } catch (error) {
    // On error, don't change state
    console.warn('Failed to sync proxy state:', error);
  }
}

/**
 * Configure Chrome proxy settings without starting backend session
 */
async function configureProxySettings() {
  const config = {
    mode: 'fixed_servers',
    rules: {
      singleProxy: {
        scheme: 'http',
        host: PROXY_HOST,
        port: PROXY_PORT,
      },
      bypassList: ['localhost', '127.0.0.1'],
    },
  };

  return new Promise((resolve, reject) => {
    chrome.proxy.settings.set(
      { value: config, scope: 'regular' },
      () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          updateIcon();
          resolve();
        }
      }
    );
  });
}

/**
 * Clear Chrome proxy settings
 */
async function clearProxySettings() {
  const config = {
    mode: 'direct',
  };

  return new Promise((resolve, reject) => {
    chrome.proxy.settings.set(
      { value: config, scope: 'regular' },
      () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          updateIcon();
          resolve();
        }
      }
    );
  });
}

/**
 * Enable proxy configuration
 */
async function enableProxy() {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('No authentication token. Please log in to the dashboard first.');
    }

    // 1. Check if session already exists
    const statusResponse = await fetch(`${BACKEND_URL}/api/proxy/session/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      if (statusData.success && statusData.data.hasActiveSession) {
        // Session already exists, just configure Chrome proxy
        await configureProxySettings();
        proxyEnabled = true;
        requestCount = 0;
        chrome.storage.local.set({ proxyEnabled: true, requestCount: 0 });

        // Show notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'ReqSploit Proxy',
          message: 'Proxy enabled (using existing backend session)',
        });

        return;
      }
    }

    // 2. Start backend proxy session
    const startResponse = await fetch(`${BACKEND_URL}/api/proxy/session/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ interceptMode: true }),
    });

    if (!startResponse.ok) {
      const errorData = await startResponse.json().catch(() => null);
      throw new Error(errorData?.error?.message || `Failed to start backend proxy: ${startResponse.statusText}`);
    }

    // 3. Configure Chrome proxy settings
    await configureProxySettings();
    proxyEnabled = true;
    requestCount = 0;
    chrome.storage.local.set({ proxyEnabled: true, requestCount: 0 });

    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'ReqSploit Proxy Enabled',
      message: `Proxy active on localhost:${PROXY_PORT}`,
    });
  } catch (error) {
    console.error('Error enabling proxy:', error);
    throw error;
  }
}

/**
 * Disable proxy configuration
 */
async function disableProxy() {
  try {
    // 1. Stop backend proxy session (if exists)
    const token = await getAuthToken();
    if (token) {
      try {
        await fetch(`${BACKEND_URL}/api/proxy/session/stop`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.warn('Failed to stop backend proxy (may already be stopped):', error);
        // Continue anyway to disable Chrome proxy
      }
    }

    // 2. Disable Chrome proxy settings
    await clearProxySettings();
    proxyEnabled = false;
    chrome.storage.local.set({ proxyEnabled: false });

    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'ReqSploit Proxy Disabled',
      message: 'Traffic interception stopped',
    });
  } catch (error) {
    console.error('Error disabling proxy:', error);
    throw error;
  }
}

/**
 * Update extension icon based on state
 */
function updateIcon() {
  // Set badge color
  if (!backendConnected) {
    chrome.action.setBadgeBackgroundColor({ color: '#EF4444' }); // Red
    chrome.action.setBadgeText({ text: '!' });
  } else if (proxyEnabled) {
    chrome.action.setBadgeBackgroundColor({ color: '#10B981' }); // Green
    chrome.action.setBadgeText({ text: requestCount.toString() });
  } else {
    chrome.action.setBadgeBackgroundColor({ color: '#6B7280' }); // Gray
    chrome.action.setBadgeText({ text: '' });
  }
}

/**
 * Listen for web requests (count intercepted requests)
 */
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (proxyEnabled && !details.url.includes('localhost')) {
      requestCount++;
      chrome.storage.local.set({ requestCount });
      updateIcon();
    }
  },
  { urls: ['<all_urls>'] }
);

/**
 * Message handler from external sources (Frontend)
 */
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  console.log('External message received:', message, 'from:', sender.url);

  // Handle auth token from frontend
  if (message.action === 'setAuthToken' && message.token) {
    chrome.storage.local.set({ apiToken: message.token }, () => {
      console.log('Auth token stored from frontend');
      sendResponse({ success: true });

      // Check backend connection with new token
      checkBackendConnection();
    });
    return true; // Keep channel open for async response
  }

  // Handle ping from frontend (extension detection)
  if (message.action === 'ping') {
    sendResponse({ success: true, installed: true });
    return true;
  }

  sendResponse({ error: 'Unknown external action' });
});

/**
 * Message handler from popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.action) {
        case 'toggleProxy':
          if (proxyEnabled) {
            await disableProxy();
          } else {
            await enableProxy();
          }
          sendResponse({ success: true, proxyEnabled });
          break;

        case 'getStatus':
          await checkBackendConnection();
          sendResponse({
            proxyEnabled,
            requestCount,
            backendConnected,
          });
          break;

        case 'resetCount':
          requestCount = 0;
          chrome.storage.local.set({ requestCount: 0 });
          updateIcon();
          sendResponse({ success: true });
          break;

        case 'checkBackend':
          const connected = await checkBackendConnection();
          sendResponse({ connected });
          break;

        case 'downloadCertificate':
          // Open certificate download URL
          chrome.tabs.create({
            url: `${BACKEND_URL}/api/certificates/root/download`,
          });
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      sendResponse({ error: error.message });
    }
  })();

  // Return true to indicate async response
  return true;
});

/**
 * Periodic backend health check
 */
setInterval(() => {
  checkBackendConnection();
}, 10000); // Check every 10 seconds
