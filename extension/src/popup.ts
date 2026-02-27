/**
 * ReqSploit Chrome Extension - Popup Script (CDP Mode)
 * Communicates with background service worker via chrome.runtime.sendMessage
 */

interface PopupStatus {
  isConnected: boolean;
  interceptEnabled: boolean;
  responseInterceptEnabled: boolean;
  attachedTabs: Array<{ tabId: number; url: string }>;
  requestCount: number;
  extensionVersion: string;
  serverUrl: string;
}

// DOM elements
const serverStatus = document.getElementById('server-status') as HTMLElement;
const serverText = document.getElementById('server-text') as HTMLElement;
const toggleBtn = document.getElementById('toggle-intercept') as HTMLButtonElement;
const toggleIcon = document.getElementById('toggle-icon') as HTMLElement;
const toggleText = document.getElementById('toggle-text') as HTMLElement;
const responseToggleSection = document.getElementById('response-toggle-section') as HTMLElement;
const responseInterceptToggle = document.getElementById('response-intercept-toggle') as HTMLInputElement;
const tabSection = document.getElementById('tab-section') as HTMLElement;
const tabList = document.getElementById('tab-list') as HTMLElement;
const statsSection = document.getElementById('stats-section') as HTMLElement;
const requestCount = document.getElementById('request-count') as HTMLElement;
const openDashboardBtn = document.getElementById('open-dashboard') as HTMLButtonElement;

let currentStatus: PopupStatus | null = null;
let isProcessing = false;

/**
 * Load status from background service worker
 */
async function loadStatus(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getStatus' });

    if (response.error) {
      showDisconnected(response.error);
      return;
    }

    currentStatus = response as PopupStatus;
    updateUI(currentStatus);
  } catch (err) {
    console.error('Failed to get status:', err);
    showDisconnected('Extension error');
  }
}

/**
 * Update the popup UI based on current status
 */
function updateUI(status: PopupStatus): void {
  // Server connection status
  if (status.isConnected) {
    serverStatus.className = 'status-dot connected';
    serverText.className = 'status-text connected';
    serverText.textContent = 'Connected';
  } else {
    serverStatus.className = 'status-dot disconnected';
    serverText.className = 'status-text disconnected';
    serverText.textContent = 'Disconnected';
  }

  // Toggle button state
  if (status.interceptEnabled && status.attachedTabs.length > 0) {
    toggleBtn.classList.add('active');
    toggleBtn.classList.remove('disabled');
    toggleIcon.textContent = '\u25A0'; // Stop square
    toggleText.textContent = 'Stop Intercepting';
  } else if (!status.isConnected) {
    toggleBtn.classList.remove('active');
    toggleBtn.classList.add('disabled');
    toggleIcon.textContent = '\u25CF'; // Circle
    toggleText.textContent = 'Not Connected';
  } else {
    toggleBtn.classList.remove('active', 'disabled');
    toggleIcon.textContent = '\u25B6'; // Play triangle
    toggleText.textContent = 'Start Intercepting';
  }

  // Response intercept toggle
  const isIntercepting = status.interceptEnabled && status.attachedTabs.length > 0;
  if (isIntercepting) {
    responseToggleSection.style.display = 'block';
    responseInterceptToggle.checked = status.responseInterceptEnabled;
  } else {
    responseToggleSection.style.display = 'none';
  }

  // Attached tabs
  if (status.attachedTabs.length > 0) {
    tabSection.style.display = 'block';
    tabList.innerHTML = '';
    for (const tab of status.attachedTabs) {
      const item = document.createElement('div');
      item.className = 'tab-item';
      const dot = document.createElement('span');
      dot.className = 'tab-dot';
      const url = document.createElement('span');
      url.className = 'tab-url';
      url.textContent = truncateUrl(tab.url, 40);
      url.title = tab.url;
      item.appendChild(dot);
      item.appendChild(url);
      tabList.appendChild(item);
    }
  } else {
    tabSection.style.display = 'none';
  }

  // Stats
  if (isIntercepting && status.requestCount > 0) {
    statsSection.style.display = 'block';
    requestCount.textContent = status.requestCount.toString();
  } else if (isIntercepting) {
    statsSection.style.display = 'block';
    requestCount.textContent = '0';
  } else {
    statsSection.style.display = 'none';
  }
}

/**
 * Show disconnected state
 */
function showDisconnected(message: string): void {
  serverStatus.className = 'status-dot disconnected';
  serverText.className = 'status-text disconnected';
  serverText.textContent = message;
  toggleBtn.classList.remove('active');
  toggleBtn.classList.add('disabled');
  toggleIcon.textContent = '\u25CF';
  toggleText.textContent = 'Not Connected';
  responseToggleSection.style.display = 'none';
  tabSection.style.display = 'none';
  statsSection.style.display = 'none';
}

/**
 * Handle start/stop intercept toggle
 */
async function handleToggle(): Promise<void> {
  if (isProcessing || !currentStatus) return;

  // Don't allow action if not connected
  if (!currentStatus.isConnected) return;

  isProcessing = true;
  toggleBtn.classList.add('disabled');

  const isIntercepting = currentStatus.interceptEnabled && currentStatus.attachedTabs.length > 0;

  try {
    const action = isIntercepting ? 'stopIntercept' : 'startIntercept';
    const response = await chrome.runtime.sendMessage({ action });

    if (response.error) {
      showError(response.error);
    }
  } catch (err: any) {
    showError(err.message || 'Action failed');
  } finally {
    isProcessing = false;
    // Reload status after action
    await loadStatus();
  }
}

/**
 * Handle response intercept toggle
 */
async function handleResponseToggle(): Promise<void> {
  try {
    await chrome.runtime.sendMessage({
      action: 'toggleResponseIntercept',
      enabled: responseInterceptToggle.checked,
    });
  } catch (err) {
    console.error('Failed to toggle response intercept:', err);
    // Revert checkbox
    responseInterceptToggle.checked = !responseInterceptToggle.checked;
  }
}

/**
 * Open the dashboard
 */
function handleOpenDashboard(): void {
  chrome.runtime.sendMessage({ action: 'openDashboard' });
}

/**
 * Show a temporary error message
 */
function showError(message: string): void {
  serverText.className = 'status-text disconnected';
  serverText.textContent = message;
  setTimeout(() => loadStatus(), 3000);
}

/**
 * Truncate URL for display
 */
function truncateUrl(url: string, maxLength: number): string {
  if (!url) return '(no url)';
  if (url.length <= maxLength) return url;
  try {
    const u = new URL(url);
    const host = u.hostname;
    const path = u.pathname;
    const display = host + path;
    if (display.length <= maxLength) return display;
    return display.substring(0, maxLength - 3) + '...';
  } catch {
    return url.substring(0, maxLength - 3) + '...';
  }
}

// Event listeners
toggleBtn.addEventListener('click', handleToggle);
responseInterceptToggle.addEventListener('change', handleResponseToggle);
openDashboardBtn.addEventListener('click', handleOpenDashboard);

// Initial load
loadStatus();

// Auto-refresh every 2 seconds while popup is open
setInterval(loadStatus, 2000);
