# ReqSploit Chrome Extension - Setup Guide

Complete step-by-step guide to install and use the ReqSploit Chrome extension.

## Prerequisites

- Google Chrome or Chromium-based browser (Edge, Brave, etc.)
- ReqSploit backend running on `localhost:3000`
- ReqSploit proxy running on `localhost:8080`

## Installation

### Step 1: Load Extension in Chrome

1. **Open Chrome Extensions Page**:
   - Navigate to `chrome://extensions/`
   - Or: Menu → More Tools → Extensions

2. **Enable Developer Mode**:
   - Toggle "Developer mode" switch (top right corner)

3. **Load Unpacked Extension**:
   - Click "Load unpacked" button
   - Navigate to `/burponweb/extension/` directory
   - Click "Select Folder"

4. **Verify Installation**:
   - You should see "ReqSploit" extension card
   - Extension status should be "Enabled"
   - ReqSploit icon should appear in toolbar

### Step 2: Start Backend

```bash
cd /home/will/burponweb/backend
npm run dev
```

**Expected output**:
```
🚀 ReqSploit Backend Server started
📡 Health check: http://0.0.0.0:3000/health
🔐 API endpoint: http://0.0.0.0:3000/api
🔌 WebSocket endpoint: ws://0.0.0.0:3000
```

### Step 3: Download and Install SSL Certificate

This is **CRITICAL** for intercepting HTTPS traffic.

1. **Click ReqSploit Extension Icon** (in Chrome toolbar)

2. **Verify Backend Status**:
   - Should show "Backend: Connected" with green dot
   - If red, check that backend is running

3. **Download Certificate**:
   - Click "Download SSL Certificate" button
   - File `reqsploit-root-ca.crt` will download

4. **Install Certificate in Chrome**:
   - Go to `chrome://settings/security`
   - Scroll to "Manage certificates"
   - Click "Authorities" tab
   - Click "Import" button
   - Select the downloaded `reqsploit-root-ca.crt`
   - **IMPORTANT**: Check "Trust this certificate for identifying websites"
   - Click "OK"

5. **Verify Certificate Installation**:
   - In the Authorities list, search for "ReqSploit"
   - You should see the certificate listed

### Step 4: Enable Proxy

1. **Open Extension Popup**:
   - Click ReqSploit icon

2. **Enable Proxy**:
   - Click "Enable Proxy" button
   - Button should turn green and say "Disable Proxy"
   - Badge on icon should show "0" (request counter)

3. **Verify Proxy is Active**:
   - Browse to any website (e.g., `http://example.com`)
   - Badge counter should increment
   - Check dashboard to see intercepted requests

### Step 5: Open Dashboard

From extension popup:
- Click "Open Dashboard" button
- Dashboard opens in new tab: `http://localhost:5173`

You should see:
- Intercepted requests in the list
- Request/response details
- AI analysis panel

## Usage Workflow

### Normal Pentesting Session

1. **Start Backend** → `npm run dev`
2. **Open Extension** → Click icon
3. **Enable Proxy** → One click
4. **Browse Target** → Navigate to target website
5. **Analyze Traffic** → Open dashboard
6. **Run AI Analysis** → Select request, choose AI mode
7. **Review Findings** → Check vulnerabilities
8. **Disable Proxy** → When done testing

### Quick Actions

From extension popup:
- **Toggle Proxy**: Enable/disable with one click
- **Reset Counter**: Clear intercepted request count
- **Download Certificate**: Re-download if needed
- **Open Dashboard**: Quick access to web interface
- **View Docs**: Open API documentation

## Troubleshooting

### Issue: "Backend: Disconnected"

**Cause**: Backend server is not running or not reachable.

**Solutions**:
1. Start backend: `cd backend && npm run dev`
2. Verify port 3000 is not blocked by firewall
3. Check backend logs for errors
4. Try `curl http://localhost:3000/health`

### Issue: HTTPS Sites Show Certificate Error

**Cause**: Root CA certificate not installed or not trusted.

**Solutions**:
1. Re-download certificate from extension
2. Remove old ReqSploit certificates from Chrome
3. Re-install certificate and **check "Trust for websites"**
4. Restart Chrome completely
5. Verify certificate in `chrome://settings/security` → Manage certificates → Authorities

### Issue: No Requests Being Intercepted

**Cause**: Proxy not properly configured or not enabled.

**Solutions**:
1. Verify extension shows "Disable Proxy" (green button)
2. Check badge shows a number (not empty)
3. Restart Chrome
4. Disable/enable proxy again
5. Check no other proxy/VPN is interfering
6. Verify backend proxy is running on port 8080

### Issue: "Failed to toggle proxy"

**Cause**: Permission denied or Chrome conflict.

**Solutions**:
1. Close other proxy extensions (Proxy SwitchyOmega, etc.)
2. Restart Chrome
3. Re-install extension
4. Check Chrome console for errors (F12 → Console)

### Issue: Extension Icon Not Showing

**Cause**: Extension not pinned to toolbar.

**Solutions**:
1. Click puzzle icon in Chrome toolbar
2. Find "ReqSploit" in list
3. Click pin icon next to it

## Advanced Configuration

### Custom Backend URL

Edit `background.js`:
```javascript
const BACKEND_URL = 'http://your-backend-url:3000';
```

### Custom Proxy Port

Edit `background.js`:
```javascript
const PROXY_PORT = 8080; // Change to your port
```

### Bypass Proxy for Specific Sites

Edit `background.js`:
```javascript
bypassList: ['localhost', '127.0.0.1', 'your-domain.com']
```

## Development

### Reload Extension After Changes

1. Go to `chrome://extensions/`
2. Find ReqSploit extension
3. Click reload icon (circular arrow)
4. Re-open popup to see changes

### Debug Background Worker

1. Go to `chrome://extensions/`
2. Find ReqSploit extension
3. Click "service worker" link
4. Chrome DevTools opens for background script

### Debug Popup

1. Right-click extension icon
2. Select "Inspect popup"
3. Chrome DevTools opens for popup

### View Console Logs

Background worker logs:
- Follow "Debug Background Worker" steps above
- Console shows all `console.log()` from `background.js`

Popup logs:
- Follow "Debug Popup" steps above
- Console shows all `console.log()` from `popup.js`

## Security Notes

- Extension works with **localhost only** by default (safe for development)
- Proxy configuration is **temporary** (cleared on Chrome restart)
- Certificate is **self-signed** for testing purposes only
- **Never use on production systems** without proper authorization
- Extension has **no external API calls** or tracking

## Uninstallation

### Remove Extension

1. Go to `chrome://extensions/`
2. Find ReqSploit extension
3. Click "Remove" button
4. Confirm removal

### Remove Certificate

1. Go to `chrome://settings/security`
2. Click "Manage certificates"
3. Go to "Authorities" tab
4. Search for "ReqSploit"
5. Select certificate
6. Click "Delete" button
7. Confirm deletion

### Remove Proxy Settings

Proxy settings are automatically removed when:
- Extension is uninstalled
- Proxy is disabled via extension
- Chrome is closed

To manually reset:
1. Go to `chrome://settings/system`
2. Click "Open your computer's proxy settings"
3. Ensure no proxy is configured

## Support

If you encounter issues:
1. Check this troubleshooting guide
2. Review backend logs: `backend/logs/`
3. Check Chrome console for errors
4. Verify all prerequisites are met
5. Try a fresh Chrome profile for testing

## Next Steps

After successful setup:
1. Read the [main README](../README.md) for full features
2. Check [AI System Documentation](../backend/AI_SYSTEM.md)
3. Explore the [Dashboard](http://localhost:5173)
4. Review [API Documentation](http://localhost:3000/docs)
