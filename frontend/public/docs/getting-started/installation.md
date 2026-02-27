# 🚀 Installation Guide

Complete step-by-step guide to install and configure ReqSploit.

---

## Prerequisites

Before installing ReqSploit, ensure you have:

- ✅ **Google Chrome** browser (v90 or higher)
- ✅ **Internet connection** for extension download
- ✅ **Administrator access** for SSL certificate installation
- ✅ **ReqSploit account** (sign up at [reqsploit.com](https://reqsploit.com))

**Estimated Time**: 10-15 minutes

---

## Step 1: Install Chrome Extension

### Download the Extension

1. **Visit Chrome Web Store**
   ```
   https://chrome.google.com/webstore
   Search for: "ReqSploit Proxy"
   ```

2. **Click "Add to Chrome"**
   - The extension icon will appear in your toolbar
   - A welcome popup will open

3. **Verify Installation**
   - Look for the ReqSploit icon (🎯) in Chrome toolbar
   - Click the icon to open the popup
   - You should see "Not Connected" status

### Extension Permissions

ReqSploit requires these permissions:

| Permission | Why It's Needed |
|------------|-----------------|
| **webRequest** | Intercept and modify HTTP/HTTPS requests |
| **proxy** | Route traffic through ReqSploit proxy |
| **storage** | Save your settings and auth tokens |
| **tabs** | Manage capture of requests from different tabs |
| **<all_urls>** | Capture requests to any website (respects your scope) |

**Security Note**: ReqSploit never sends your data to third parties. All requests are processed locally or through your authenticated backend.

---

## Step 2: Configure SSL Certificate

To intercept HTTPS traffic, you must install ReqSploit's SSL certificate.

###  Why Do I Need a Certificate?

HTTPS traffic is encrypted. To view and modify it, ReqSploit acts as a "man-in-the-middle":

```
Browser ←[HTTPS]→ ReqSploit Proxy ←[HTTPS]→ Target Server
         ↓
     Your cert          ReqSploit cert
```

The certificate tells your browser to trust ReqSploit's proxy.

### Download Certificate

1. **Open ReqSploit Dashboard**
   - Go to [app.reqsploit.com](https://app.reqsploit.com)
   - Log in with your account

2. **Navigate to Settings**
   - Click your profile (top-right)
   - Select "Settings" → "Certificate"

3. **Download Certificate**
   - Click "Download Certificate" button
   - File will be saved as `reqsploit-ca.crt`
   - Save it somewhere easy to find (e.g., Downloads folder)

### Install Certificate

Choose your operating system:

<details>
<summary><b>🪟 Windows Installation</b></summary>

1. **Open Certificate Manager**
   ```
   Press Windows + R
   Type: certmgr.msc
   Press Enter
   ```

2. **Navigate to Trusted Root Certification Authorities**
   ```
   Certificates - Current User
    └─ Trusted Root Certification Authorities
        └─ Certificates (right-click here)
   ```

3. **Import Certificate**
   - Right-click on "Certificates"
   - Select "All Tasks" → "Import..."
   - Click "Next"
   - Browse to `reqsploit-ca.crt`
   - Click "Next" → "Finish"

4. **Verify Installation**
   - You should see "ReqSploit CA" in the certificate list
   - Certificate should show as valid

**Troubleshooting Windows**:
- If you see "Administrator required", run certmgr as admin
- If import fails, try double-clicking the `.crt` file instead

</details>

<details>
<summary><b>🍎 macOS Installation</b></summary>

1. **Open Keychain Access**
   ```
   Applications → Utilities → Keychain Access
   Or: Spotlight (Cmd+Space) → type "Keychain Access"
   ```

2. **Import Certificate**
   - Go to "File" → "Import Items..."
   - Select `reqsploit-ca.crt`
   - Choose "login" keychain
   - Click "Open"

3. **Trust Certificate**
   - Find "ReqSploit CA" in the certificate list
   - Double-click on it
   - Expand "Trust" section
   - Set "When using this certificate" to **"Always Trust"**
   - Close window (you'll be prompted for password)

4. **Verify Installation**
   - Certificate should show green checkmark
   - Status: "This certificate is marked as trusted"

**Troubleshooting macOS**:
- If you can't change trust settings, enter your admin password
- If still not working, try adding to "System" keychain instead of "login"

</details>

<details>
<summary><b>🐧 Linux Installation</b></summary>

**For Debian/Ubuntu:**

```bash
# Copy certificate to certificates directory
sudo cp reqsploit-ca.crt /usr/local/share/ca-certificates/

# Update CA certificates
sudo update-ca-certificates

# Verify installation
ls /etc/ssl/certs | grep reqsploit
```

**For Fedora/RHEL/CentOS:**

```bash
# Copy certificate
sudo cp reqsploit-ca.crt /etc/pki/ca-trust/source/anchors/

# Update CA trust
sudo update-ca-trust

# Verify
trust list | grep -i reqsploit
```

**For Arch Linux:**

```bash
# Copy certificate
sudo cp reqsploit-ca.crt /etc/ca-certificates/trust-source/anchors/

# Update trust
sudo trust extract-compat

# Verify
trust list | grep -i reqsploit
```

**Troubleshooting Linux**:
- If Chrome still shows certificate errors, try restarting Chrome completely
- For Firefox on Linux, you need to import the certificate in Firefox settings separately

</details>

### Verify Certificate Installation

1. **Restart Chrome** (completely close and reopen)

2. **Test HTTPS Site**
   - Open ReqSploit extension
   - Enable "Intercept" toggle
   - Visit https://example.com
   - You should NOT see certificate warnings

3. **If You Still See Warnings**
   - Certificate not installed correctly → Redo installation steps
   - Certificate installed in wrong store → Check "Trusted Root" location
   - Chrome not restarted → Close ALL Chrome windows and reopen

---

## Step 3: Connect Extension to Backend

### Start Proxy Server

1. **Open ReqSploit Dashboard**
   - Go to [app.reqsploit.com](https://app.reqsploit.com)
   - Log in if not already

2. **Check Connection Status**
   - Look for "● Connected" in top bar
   - Should show green status
   - If red: Check your internet connection

### Configure Extension

1. **Open Extension Popup**
   - Click ReqSploit icon (🎯) in Chrome toolbar
   - You should see the control panel

2. **Check Connection**
   - Status should show "🟢 Connected"
   - Proxy Port: Should show "8080" (default)
   - If "🔴 Not Connected": Click "Reconnect"

3. **Enable Interception** (Optional)
   - Toggle "Intercept" switch to ON
   - Switch turns orange when active
   - All requests will be held for review

---

## Step 4: Verify Installation

Let's confirm everything is working:

### Test 1: HTTP Request Capture

```bash
1. Open Chrome
2. Open ReqSploit Dashboard (app.reqsploit.com)
3. Go to "History" tab
4. In Chrome, visit: http://httpbin.org/get
5. Check ReqSploit Dashboard - you should see the request appear!
```

✅ **Success**: Request appears in History
❌ **Failed**: [Troubleshoot proxy issues](#troubleshooting)

### Test 2: HTTPS Request Capture

```bash
1. Clear History in ReqSploit (optional, for clarity)
2. Visit: https://httpbin.org/get
3. Check ReqSploit Dashboard - request should appear
4. No certificate warning should show
```

✅ **Success**: HTTPS request captured without warnings
❌ **Failed**: [Troubleshoot certificate](#troubleshooting)

### Test 3: Request Modification

```bash
1. Enable "Intercept" in extension (orange toggle)
2. Visit: http://httpbin.org/get
3. Request should appear in "Intercept" tab
4. Click "Forward" to send it
5. Page should load normally
```

✅ **Success**: You can intercept and forward requests
❌ **Failed**: [Troubleshoot interception](#troubleshooting)

---

## Advanced Configuration

### Change Proxy Port

Default port is 8080. To change it:

1. Open extension popup
2. Click "Settings" icon (⚙️)
3. Change "Proxy Port" field
4. Click "Save"
5. Restart Chrome

**When to change port**:
- Port 8080 is already in use
- Corporate firewall blocks 8080
- Running multiple proxy tools

### Scope Configuration

Control which sites ReqSploit captures:

1. Go to Dashboard → Settings → Scope
2. **Include**: Add domains to capture
   ```
   *.example.com
   https://api.example.com/*
   ```
3. **Exclude**: Add domains to ignore
   ```
   *.google.com
   *.facebook.com
   *.googleapis.com
   ```

**Recommended exclusions**:
- CDNs and static resources
- Analytics and tracking scripts
- Social media widgets
- Large file downloads

---

## Troubleshooting

### Certificate Not Working

**Symptom**: Chrome shows "Your connection is not private" warnings

**Solutions**:
1. Verify certificate is in "Trusted Root Certification Authorities" (Windows)
2. Verify certificate is set to "Always Trust" (macOS)
3. Restart Chrome completely (close all windows)
4. Clear Chrome SSL state: `chrome://net-internals/#sslclear`
5. Try downloading and re-installing the certificate

### Proxy Not Capturing Requests

**Symptom**: No requests appear in History tab

**Solutions**:
1. Check extension is enabled (icon should be colored, not gray)
2. Verify "Connected" status in extension popup
3. Check scope settings - site might be excluded
4. Try disabling other extensions that might conflict
5. Check browser console for errors (F12 → Console tab)

### Extension Won't Connect

**Symptom**: Extension shows "🔴 Not Connected"

**Solutions**:
1. Refresh the Dashboard page (app.reqsploit.com)
2. Check your internet connection
3. Verify you're logged in
4. Try logging out and back in
5. Clear browser cache and cookies for reqsploit.com

### Slow Browsing / Timeout

**Symptom**: Websites load very slowly or timeout

**Solutions**:
1. Disable "Intercept" mode (it holds requests)
2. Check your network connection
3. Reduce capture scope - exclude large files/CDNs
4. Lower request retention limit in settings
5. Close other resource-intensive applications

---

## Next Steps

✅ Installation complete! Here's what to do next:

1. **📖 [Quick Start Tutorial](./quick-start.md)**
   - Learn the interface
   - Capture your first requests
   - Run your first AI scan

2. **🎯 [Interface Overview](./interface.md)**
   - Understand the dashboard layout
   - Learn keyboard shortcuts
   - Customize your workspace

3. **🔍 [Start Testing](../tutorials/testing-rest-api.md)**
   - Test a sample API
   - Learn practical workflows
   - Discover vulnerabilities

---

## Need Help?

- 📖 **Documentation**: [View all docs](../README.md)
- 💬 **Community**: [Discord Server](https://discord.gg/reqsploit)
- 📧 **Support**: support@reqsploit.com
- 🐛 **Bug Report**: [GitHub Issues](https://github.com/reqsploit/reqsploit)

---

**Installation successful?** → Continue to [Quick Start Guide](./quick-start.md) 🚀
