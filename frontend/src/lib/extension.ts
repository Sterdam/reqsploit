/**
 * Chrome Extension Communication Utilities
 * Handles detection and messaging with ReqSploit Chrome Extension
 */

// Extension ID will be set after loading the extension in Chrome
// Get it from chrome://extensions after loading the unpacked extension
const EXTENSION_ID = import.meta.env.VITE_EXTENSION_ID || '';

interface ExtensionMessage {
  action: string;
  [key: string]: any;
}

interface ExtensionResponse {
  success: boolean;
  [key: string]: any;
}

/**
 * Check if Chrome runtime API is available
 */
function isChromeExtensionAPIAvailable(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.runtime;
}

/**
 * Send message to extension
 */
async function sendMessageToExtension(
  message: ExtensionMessage
): Promise<ExtensionResponse> {
  if (!isChromeExtensionAPIAvailable()) {
    throw new Error('Chrome extension API not available');
  }

  if (!EXTENSION_ID) {
    console.warn('Extension ID not configured. Set VITE_EXTENSION_ID in .env');
    throw new Error('Extension ID not configured');
  }

  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(
        EXTENSION_ID,
        message,
        (response: ExtensionResponse) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response) {
            resolve(response);
          } else {
            reject(new Error('No response from extension'));
          }
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Check if ReqSploit extension is installed
 */
export async function isExtensionInstalled(): Promise<boolean> {
  if (!isChromeExtensionAPIAvailable()) {
    return false;
  }

  if (!EXTENSION_ID) {
    console.warn('Extension ID not configured');
    return false;
  }

  try {
    const response = await sendMessageToExtension({ action: 'ping' });
    return response.success === true && response.installed === true;
  } catch (error) {
    console.log('Extension not installed or not responding:', error);
    return false;
  }
}

/**
 * Send authentication token to extension
 */
export async function syncTokenToExtension(token: string): Promise<boolean> {
  if (!token) {
    console.warn('No token provided to sync to extension');
    return false;
  }

  try {
    const response = await sendMessageToExtension({
      action: 'setAuthToken',
      token,
    });

    if (response.success) {
      console.log('Token successfully synced to ReqSploit extension');
      return true;
    } else {
      console.warn('Failed to sync token to extension:', response);
      return false;
    }
  } catch (error) {
    console.error('Error syncing token to extension:', error);
    return false;
  }
}

/**
 * Auto-sync token to extension if installed
 * Non-blocking: logs errors but doesn't throw
 */
export async function autoSyncTokenToExtension(token: string): Promise<void> {
  try {
    const installed = await isExtensionInstalled();
    if (installed) {
      await syncTokenToExtension(token);
    } else {
      console.log(
        'ReqSploit extension not detected - skipping token sync (this is normal if extension is not installed)'
      );
    }
  } catch (error) {
    // Non-blocking: extension sync is optional
    console.log('Extension token sync skipped:', error);
  }
}
