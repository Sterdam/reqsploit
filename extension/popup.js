/**
 * ReqSploit Chrome Extension - Popup Logic
 * Handles UI interactions and communication with background worker
 */

const BACKEND_URL = 'http://localhost:3000';
const DASHBOARD_URL = 'http://localhost:5173';

// DOM elements
const backendStatus = document.getElementById('backend-status');
const backendText = document.getElementById('backend-text');
const toggleProxyBtn = document.getElementById('toggle-proxy');
const toggleIcon = document.getElementById('toggle-icon');
const toggleText = document.getElementById('toggle-text');
const statsSection = document.getElementById('stats-section');
const requestCountEl = document.getElementById('request-count');
const resetCountBtn = document.getElementById('reset-count');
const downloadCertBtn = document.getElementById('download-cert');
const openDashboardBtn = document.getElementById('open-dashboard');
const viewDocsBtn = document.getElementById('view-docs');

/**
 * Initialize popup
 */
async function init() {
  await updateStatus();
  setupEventListeners();
}

/**
 * Update status from background worker
 */
async function updateStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getStatus' });

    // Update backend status
    if (response.backendConnected) {
      backendStatus.classList.add('connected');
      backendStatus.classList.remove('disconnected');
      backendText.textContent = 'Connected';
      backendText.classList.add('connected');
      backendText.classList.remove('disconnected');
    } else {
      backendStatus.classList.add('disconnected');
      backendStatus.classList.remove('connected');
      backendText.textContent = 'Disconnected';
      backendText.classList.add('disconnected');
      backendText.classList.remove('connected');
    }

    // Update proxy toggle button
    if (response.proxyEnabled) {
      toggleProxyBtn.classList.add('active');
      toggleIcon.textContent = '●';
      toggleText.textContent = 'Disable Proxy';
      statsSection.style.display = 'block';
    } else {
      toggleProxyBtn.classList.remove('active');
      toggleIcon.textContent = '○';
      toggleText.textContent = 'Enable Proxy';
      statsSection.style.display = 'none';
    }

    // Enable/disable toggle based on backend connection
    if (!response.backendConnected) {
      toggleProxyBtn.classList.add('disabled');
      toggleProxyBtn.disabled = true;
    } else {
      toggleProxyBtn.classList.remove('disabled');
      toggleProxyBtn.disabled = false;
    }

    // Update request count
    requestCountEl.textContent = response.requestCount || 0;
  } catch (error) {
    console.error('Failed to update status:', error);
    backendStatus.classList.add('disconnected');
    backendText.textContent = 'Error';
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Toggle proxy
  toggleProxyBtn.addEventListener('click', async () => {
    try {
      toggleProxyBtn.disabled = true;
      const response = await chrome.runtime.sendMessage({ action: 'toggleProxy' });

      if (response.success) {
        await updateStatus();
      } else {
        alert('Failed to toggle proxy: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Failed to toggle proxy: ' + error.message);
    } finally {
      toggleProxyBtn.disabled = false;
    }
  });

  // Reset counter
  resetCountBtn.addEventListener('click', async () => {
    try {
      await chrome.runtime.sendMessage({ action: 'resetCount' });
      await updateStatus();
    } catch (error) {
      console.error('Failed to reset count:', error);
    }
  });

  // Download certificate
  downloadCertBtn.addEventListener('click', async () => {
    try {
      await chrome.runtime.sendMessage({ action: 'downloadCertificate' });
    } catch (error) {
      alert('Failed to download certificate: ' + error.message);
    }
  });

  // Open dashboard
  openDashboardBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: DASHBOARD_URL });
  });

  // View docs
  viewDocsBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: `${BACKEND_URL}/docs` });
  });
}

/**
 * Auto-refresh status every 2 seconds
 */
setInterval(() => {
  updateStatus();
}, 2000);

// Initialize on load
init();
