# ReqSploit Chrome Extension

AI-Powered MITM Proxy extension for Chrome - seamless integration with ReqSploit backend.

## Features

- **One-Click Proxy Configuration**: Enable/disable proxy with a single click
- **SSL Certificate Download**: Automated certificate download and installation
- **Real-Time Request Counter**: See intercepted requests count in extension badge
- **Backend Status Monitor**: Visual indicator of backend connection
- **Quick Actions**: Direct access to dashboard and documentation
- **Auto-Reconnect**: Automatic reconnection if backend restarts

## Installation

### Development Mode

1. **Open Chrome Extensions Page**:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)

2. **Load Extension**:
   - Click "Load unpacked"
   - Select the `/extension` directory

3. **Verify Installation**:
   - You should see the ReqSploit icon in your extensions toolbar
   - Click the icon to open the popup

### Production Mode

Package the extension:
```bash
cd extension
zip -r reqsploit-extension.zip . -x "*.git*" "README.md"
```

Upload to Chrome Web Store for distribution.

## Usage

### First-Time Setup

1. **Start ReqSploit Backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Open Extension Popup**:
   - Click the ReqSploit icon in Chrome toolbar
   - Verify "Backend: Connected" status is green

3. **Download SSL Certificate**:
   - Click "Download SSL Certificate" button
   - Install the certificate in Chrome:
     - Settings → Privacy and security → Security
     - Manage certificates → Authorities → Import
     - Select the downloaded certificate
     - Check "Trust this certificate for identifying websites"

4. **Enable Proxy**:
   - Click "Enable Proxy" button
   - Badge will show request count

### Daily Usage

1. Click ReqSploit icon
2. Click "Enable Proxy"
3. Browse target website
4. Watch requests being intercepted (badge shows count)
5. Click "Open Dashboard" to analyze requests with AI
6. When done, click "Disable Proxy"

## Architecture

### Files

- **manifest.json**: Extension configuration (Manifest V3)
- **background.js**: Service worker for proxy management
- **popup.html**: Extension popup UI
- **popup.css**: Popup styling
- **popup.js**: Popup logic and event handling

### Communication Flow

```
User Action (Popup)
    ↓
chrome.runtime.sendMessage()
    ↓
Background Service Worker
    ↓
Chrome Proxy API / Backend API
    ↓
Response to Popup
    ↓
UI Update
```

### Proxy Configuration

When enabled, the extension configures Chrome to route all HTTP/HTTPS traffic through:
- **Host**: localhost
- **Port**: 8080
- **Bypass**: localhost, 127.0.0.1

## Troubleshooting

### Backend Disconnected

**Symptom**: Red "!" badge on extension icon

**Solutions**:
1. Start backend: `cd backend && npm run dev`
2. Check backend is running on port 3000
3. Verify no firewall blocking localhost:3000

### Proxy Not Working

**Symptom**: No requests being intercepted

**Solutions**:
1. Check proxy is enabled (green badge)
2. Verify certificate is installed and trusted
3. Restart Chrome
4. Check backend proxy is running on port 8080

### Certificate Issues

**Symptom**: HTTPS sites show security warnings

**Solutions**:
1. Re-download certificate from extension
2. Remove old certificates from Chrome
3. Install new certificate as "Trusted Authority"
4. Restart Chrome

## Development

### Local Development

1. Make changes to extension files
2. Go to `chrome://extensions/`
3. Click reload icon on ReqSploit extension
4. Test changes in popup

### Debug Background Worker

1. Go to `chrome://extensions/`
2. Find ReqSploit extension
3. Click "service worker" link
4. Open Chrome DevTools for background worker

### Debug Popup

1. Right-click on extension icon
2. Select "Inspect popup"
3. Chrome DevTools will open for popup

## Security

- Extension only works with localhost backend (safe for development)
- No external API calls or tracking
- Proxy configuration is temporary (cleared on browser restart)
- Certificate is self-signed for MITM testing only

## Permissions Explained

- **proxy**: Configure Chrome proxy settings
- **storage**: Store extension state (proxy on/off, request count)
- **tabs**: Open dashboard in new tab
- **webRequest**: Count intercepted requests
- **notifications**: Show proxy enable/disable notifications

## Future Enhancements

- [ ] Auto-detect backend URL (support remote backends)
- [ ] Token balance display in popup
- [ ] Quick vulnerability summary
- [ ] One-click certificate installation
- [ ] Browser profile selection
- [ ] Request filtering in popup
