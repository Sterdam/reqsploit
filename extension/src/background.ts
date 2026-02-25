/**
 * ReqSploit Chrome Extension - Background Service Worker
 * Orchestrates CDP interception, WebSocket communication, and request execution.
 */

import { CDPEngine } from './cdp-engine';
import { WSClient } from './ws-client';
import { RequestExecutor } from './request-executor';
import type {
  CDPRequestPaused,
  PopupMessage,
  PopupStatusResponse,
  ExtRequestPausedPayload,
  ExtResponsePausedPayload,
  ExtIntruderResultPayload,
  RequestModifications,
  ResponseModifications,
} from './types';

// ============================================
// Configuration
// ============================================

const BACKEND_URL = 'http://localhost:3000';
const DASHBOARD_URL = 'http://localhost:5173';
const AUTO_CONTINUE_TIMEOUT_MS = 60000; // 60s timeout for pending actions

// ============================================
// Core modules
// ============================================

const cdpEngine = new CDPEngine();
const wsClient = new WSClient();
const requestExecutor = new RequestExecutor();

// Track pending requests waiting for server decision
const pendingRequests = new Map<string, { tabId: number; timeoutId: ReturnType<typeof setTimeout> }>();
const pendingResponses = new Map<string, { tabId: number; timeoutId: ReturnType<typeof setTimeout> }>();

// Active intruder campaigns (for stop control)
const activeCampaigns = new Map<string, AbortController>();

// ============================================
// CDP Event Handler
// ============================================

cdpEngine.onEvent(async (event, tabId, params: CDPRequestPaused) => {
  if (event === 'request-paused') {
    await handleCDPRequestPaused(tabId, params);
  } else if (event === 'response-paused') {
    await handleCDPResponsePaused(tabId, params);
  }
});

async function handleCDPRequestPaused(tabId: number, params: CDPRequestPaused): Promise<void> {
  const requestId = params.requestId;

  // If not connected to server, auto-continue
  if (!wsClient.isConnected()) {
    await cdpEngine.continueRequest(tabId, requestId);
    return;
  }

  // Convert CDP headers array format to Record
  const headers: Record<string, string> = {};
  if (params.request.headers) {
    for (const [key, value] of Object.entries(params.request.headers)) {
      headers[key] = value;
    }
  }

  // Send to server
  const payload: ExtRequestPausedPayload = {
    requestId,
    tabId,
    method: params.request.method,
    url: params.request.url,
    headers,
    body: params.request.postData,
    resourceType: params.resourceType,
    timestamp: Date.now(),
  };

  wsClient.emitRequestPaused(payload);

  // Set auto-continue timeout
  const timeoutId = setTimeout(async () => {
    console.log(`[BG] Request ${requestId} timed out, auto-continuing`);
    pendingRequests.delete(requestId);
    try {
      await cdpEngine.continueRequest(tabId, requestId);
    } catch {
      // Tab might have closed
    }
  }, AUTO_CONTINUE_TIMEOUT_MS);

  pendingRequests.set(requestId, { tabId, timeoutId });
}

async function handleCDPResponsePaused(tabId: number, params: CDPRequestPaused): Promise<void> {
  const requestId = params.requestId;

  if (!wsClient.isConnected()) {
    await cdpEngine.continueResponse(tabId, requestId);
    return;
  }

  // Get response body
  let body: string | undefined;
  try {
    const responseBody = await cdpEngine.getResponseBody(tabId, requestId);
    body = responseBody.base64Encoded ? atob(responseBody.body) : responseBody.body;
  } catch {
    // Body might not be available for some responses
  }

  // Convert headers
  const headers: Record<string, string> = {};
  if (params.responseHeaders) {
    for (const h of params.responseHeaders) {
      headers[h.name] = h.value;
    }
  }

  const payload: ExtResponsePausedPayload = {
    requestId,
    tabId,
    statusCode: params.responseStatusCode || 0,
    headers,
    body,
    originalRequestUrl: params.request.url,
    originalRequestMethod: params.request.method,
    timestamp: Date.now(),
  };

  wsClient.emitResponsePaused(payload);

  // Set auto-continue timeout
  const timeoutId = setTimeout(async () => {
    console.log(`[BG] Response ${requestId} timed out, auto-continuing`);
    pendingResponses.delete(requestId);
    try {
      await cdpEngine.continueResponse(tabId, requestId);
    } catch {
      // Tab might have closed
    }
  }, AUTO_CONTINUE_TIMEOUT_MS);

  pendingResponses.set(requestId, { tabId, timeoutId });
}

// ============================================
// WebSocket Event Handlers (Server → Extension)
// ============================================

wsClient.onEvents({
  onForwardRequest: async (data) => {
    const pending = pendingRequests.get(data.requestId);
    if (!pending) {
      console.warn('[BG] No pending request for', data.requestId);
      return;
    }

    clearTimeout(pending.timeoutId);
    pendingRequests.delete(data.requestId);

    try {
      let modifications: RequestModifications | undefined;
      if (data.modifications) {
        modifications = data.modifications;
      }
      await cdpEngine.continueRequest(pending.tabId, data.requestId, modifications);
      wsClient.emitRequestContinued(data.requestId);
    } catch (error) {
      console.error('[BG] Failed to forward request:', error);
    }
  },

  onDropRequest: async (data) => {
    const pending = pendingRequests.get(data.requestId);
    if (!pending) return;

    clearTimeout(pending.timeoutId);
    pendingRequests.delete(data.requestId);

    try {
      await cdpEngine.failRequest(pending.tabId, data.requestId);
    } catch (error) {
      console.error('[BG] Failed to drop request:', error);
    }
  },

  onForwardResponse: async (data) => {
    const pending = pendingResponses.get(data.requestId);
    if (!pending) return;

    clearTimeout(pending.timeoutId);
    pendingResponses.delete(data.requestId);

    try {
      if (data.modifications) {
        await cdpEngine.fulfillRequest(pending.tabId, data.requestId, data.modifications);
      } else {
        await cdpEngine.continueResponse(pending.tabId, data.requestId);
      }
      wsClient.emitResponseContinued(data.requestId);
    } catch (error) {
      console.error('[BG] Failed to forward response:', error);
    }
  },

  onDropResponse: async (data) => {
    const pending = pendingResponses.get(data.requestId);
    if (!pending) return;

    clearTimeout(pending.timeoutId);
    pendingResponses.delete(data.requestId);

    try {
      // Fulfill with empty 403 response
      await cdpEngine.fulfillRequest(pending.tabId, data.requestId, {
        responseCode: 403,
        body: 'Response blocked by interceptor',
        responseHeaders: [{ name: 'content-type', value: 'text/plain' }],
      });
    } catch (error) {
      console.error('[BG] Failed to drop response:', error);
    }
  },

  onToggleIntercept: (data) => {
    cdpEngine.setInterceptEnabled(data.enabled);
    if (data.responseIntercept !== undefined) {
      cdpEngine.setResponseInterceptEnabled(data.responseIntercept);
    }
    updateBadge();
  },

  onUpdateFilters: (data) => {
    cdpEngine.setSmartFilters(data.filters);
  },

  onRepeaterSend: async (data) => {
    try {
      const result = await requestExecutor.executeRequest({
        method: data.method,
        url: data.url,
        headers: data.headers,
        body: data.body,
      });

      wsClient.emitRepeaterResult({
        requestId: data.requestId,
        statusCode: result.statusCode,
        statusMessage: result.statusMessage,
        headers: result.headers,
        body: result.body,
        responseTime: result.responseTime,
      });
    } catch (error) {
      wsClient.emitRepeaterResult({
        requestId: data.requestId,
        statusCode: 0,
        statusMessage: error instanceof Error ? error.message : 'Unknown error',
        headers: {},
        body: '',
        responseTime: 0,
      });
    }
  },

  onIntruderStart: async (data) => {
    const controller = new AbortController();
    activeCampaigns.set(data.campaignId, controller);

    try {
      await requestExecutor.executeBatch({
        requests: data.requests,
        concurrency: data.concurrency,
        delayMs: data.delayMs,
        signal: controller.signal,
        onResult: (result: ExtIntruderResultPayload) => {
          result.campaignId = data.campaignId;
          wsClient.emitIntruderResult(result);
        },
        onError: (index: number, error: string) => {
          wsClient.emitIntruderResult({
            campaignId: data.campaignId,
            index,
            payloads: [],
            statusCode: 0,
            responseLength: 0,
            responseTime: 0,
            body: '',
            headers: {},
            error,
          });
        },
      });
    } finally {
      activeCampaigns.delete(data.campaignId);
    }
  },

  onIntruderStop: (data) => {
    const controller = activeCampaigns.get(data.campaignId);
    if (controller) {
      controller.abort();
      activeCampaigns.delete(data.campaignId);
    }
  },
});

// ============================================
// Popup Message Handler
// ============================================

chrome.runtime.onMessage.addListener((message: PopupMessage, _sender, sendResponse) => {
  (async () => {
    try {
      switch (message.action) {
        case 'getStatus': {
          const status: PopupStatusResponse = {
            isConnected: wsClient.isConnected(),
            interceptEnabled: cdpEngine.isInterceptEnabled(),
            responseInterceptEnabled: cdpEngine.isResponseInterceptEnabled(),
            attachedTabs: cdpEngine.getAttachedTabs(),
            requestCount: cdpEngine.getTotalRequestCount(),
            extensionVersion: chrome.runtime.getManifest().version,
            serverUrl: BACKEND_URL,
          };
          sendResponse(status);
          break;
        }

        case 'startIntercept': {
          // Get active tab
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (!tab?.id) {
            sendResponse({ error: 'No active tab found' });
            return;
          }

          // Connect to server if not connected
          if (!wsClient.isConnected()) {
            const token = await getAuthToken();
            if (!token) {
              sendResponse({ error: 'No authentication token. Please log in to the dashboard first.' });
              return;
            }
            wsClient.connect(BACKEND_URL, token);
            // Wait briefly for connection
            await sleep(1000);
            if (!wsClient.isConnected()) {
              sendResponse({ error: 'Failed to connect to server. Is the backend running?' });
              return;
            }
          }

          // Attach to tab
          await cdpEngine.attach(tab.id);
          cdpEngine.setInterceptEnabled(true);

          // Notify server
          wsClient.emitTabAttached(tab.id, tab.url || '');
          wsClient.emitConnected(cdpEngine.getAttachedTabs());

          updateBadge();

          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'ReqSploit - Intercepting',
            message: `Now intercepting traffic on: ${tab.url?.substring(0, 50) || 'current tab'}`,
          });

          sendResponse({ success: true });
          break;
        }

        case 'stopIntercept': {
          cdpEngine.setInterceptEnabled(false);

          // Auto-continue all pending requests
          for (const [requestId, pending] of pendingRequests) {
            clearTimeout(pending.timeoutId);
            try {
              await cdpEngine.continueRequest(pending.tabId, requestId);
            } catch { /* tab might be closed */ }
          }
          pendingRequests.clear();

          for (const [requestId, pending] of pendingResponses) {
            clearTimeout(pending.timeoutId);
            try {
              await cdpEngine.continueResponse(pending.tabId, requestId);
            } catch { /* tab might be closed */ }
          }
          pendingResponses.clear();

          // Detach from all tabs
          const tabs = cdpEngine.getAttachedTabs();
          await cdpEngine.detachAll();

          // Notify server
          for (const tab of tabs) {
            wsClient.emitTabDetached(tab.tabId, 'user-stopped');
          }

          updateBadge();

          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'ReqSploit - Stopped',
            message: 'Traffic interception stopped',
          });

          sendResponse({ success: true });
          break;
        }

        case 'toggleResponseIntercept': {
          await cdpEngine.setResponseInterceptEnabled(message.enabled);
          sendResponse({ success: true });
          break;
        }

        case 'openDashboard': {
          chrome.tabs.create({ url: DASHBOARD_URL });
          sendResponse({ success: true });
          break;
        }

        case 'attachTab': {
          await cdpEngine.attach(message.tabId);
          wsClient.emitTabAttached(message.tabId, '');
          updateBadge();
          sendResponse({ success: true });
          break;
        }

        case 'detachTab': {
          await cdpEngine.detach(message.tabId);
          wsClient.emitTabDetached(message.tabId, 'user-detached');
          updateBadge();
          sendResponse({ success: true });
          break;
        }

        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  })();

  return true; // Keep channel open for async response
});

// ============================================
// External Message Handler (from Frontend)
// ============================================

chrome.runtime.onMessageExternal.addListener((message, _sender, sendResponse) => {
  if (message.action === 'setAuthToken' && message.token) {
    chrome.storage.local.set({ apiToken: message.token }, () => {
      console.log('[BG] Auth token stored from frontend');

      // Auto-connect to server if not connected
      if (!wsClient.isConnected()) {
        wsClient.connect(BACKEND_URL, message.token);
      }

      sendResponse({ success: true });
    });
    return true;
  }

  if (message.action === 'ping') {
    sendResponse({
      success: true,
      installed: true,
      version: chrome.runtime.getManifest().version,
      cdpMode: true,
    });
    return true;
  }

  if (message.action === 'getStatus') {
    sendResponse({
      success: true,
      isConnected: wsClient.isConnected(),
      interceptEnabled: cdpEngine.isInterceptEnabled(),
      responseInterceptEnabled: cdpEngine.isResponseInterceptEnabled(),
      attachedTabs: cdpEngine.getAttachedTabs(),
    });
    return true;
  }

  sendResponse({ error: 'Unknown external action' });
  return false;
});

// ============================================
// Debugger detach listener (user dismissed debugger bar)
// ============================================

chrome.debugger.onDetach.addListener((source, reason) => {
  if (source.tabId !== undefined) {
    wsClient.emitTabDetached(source.tabId, reason);
    updateBadge();
  }
});

// ============================================
// Tab close listener
// ============================================

chrome.tabs.onRemoved.addListener((tabId) => {
  if (cdpEngine.isAttached(tabId)) {
    cdpEngine.detach(tabId);
    wsClient.emitTabDetached(tabId, 'tab-closed');
    updateBadge();
  }
});

// ============================================
// Badge and Icon Management
// ============================================

function updateBadge(): void {
  const sessions = cdpEngine.getSessions();
  const isIntercepting = cdpEngine.isInterceptEnabled() && sessions.length > 0;

  if (!wsClient.isConnected() && sessions.length === 0) {
    // Not connected, no sessions
    chrome.action.setBadgeBackgroundColor({ color: '#6B7280' }); // Gray
    chrome.action.setBadgeText({ text: '' });
  } else if (!wsClient.isConnected()) {
    // Sessions but no server connection
    chrome.action.setBadgeBackgroundColor({ color: '#EF4444' }); // Red
    chrome.action.setBadgeText({ text: '!' });
  } else if (isIntercepting) {
    // Active interception
    chrome.action.setBadgeBackgroundColor({ color: '#10B981' }); // Green
    const count = cdpEngine.getTotalRequestCount();
    chrome.action.setBadgeText({ text: count > 0 ? count.toString() : 'ON' });
  } else {
    // Connected but not intercepting
    chrome.action.setBadgeBackgroundColor({ color: '#F59E0B' }); // Amber
    chrome.action.setBadgeText({ text: '' });
  }
}

// ============================================
// Utilities
// ============================================

async function getAuthToken(): Promise<string | null> {
  const result = await chrome.storage.local.get(['apiToken']);
  return result.apiToken || null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================
// Initialization
// ============================================

chrome.runtime.onInstalled.addListener(() => {
  console.log('[BG] ReqSploit v2 extension installed (CDP mode)');
  chrome.storage.local.set({
    interceptEnabled: false,
    apiToken: null,
  });
  updateBadge();
});

// Auto-connect on startup if token exists
(async () => {
  const token = await getAuthToken();
  if (token) {
    console.log('[BG] Auto-connecting to server with stored token');
    wsClient.connect(BACKEND_URL, token);
  }
  updateBadge();
})();

// Periodic badge update
setInterval(() => {
  updateBadge();
}, 10000);
