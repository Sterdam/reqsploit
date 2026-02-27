# 🛠️ Common Issues & Solutions

**Quick solutions to the most common ReqSploit problems**

This guide covers the most frequent issues users encounter and provides step-by-step solutions to get you back on track quickly.

---

## 📋 Table of Contents

1. [Installation Issues](#installation-issues)
2. [Connection Problems](#connection-problems)
3. [Chrome Extension Issues](#chrome-extension-issues)
4. [SSL Certificate Problems](#ssl-certificate-problems)
5. [Request Capture Issues](#request-capture-issues)
6. [AI Feature Problems](#ai-feature-problems)
7. [Performance Issues](#performance-issues)
8. [Account & Billing](#account--billing)

---

## Installation Issues

### Chrome Extension Not Installing

**Problem:** Extension installation fails or shows error

**Solutions:**

**✅ Solution 1: Check Chrome Version**
```
1. Open Chrome → Settings → About Chrome
2. Ensure version is 90 or higher
3. Update Chrome if needed
4. Restart browser
5. Retry installation
```

**✅ Solution 2: Clear Extension Data**
```
1. chrome://extensions/
2. Remove any existing ReqSploit extension
3. Clear Chrome cache: Ctrl+Shift+Delete
4. Restart Chrome
5. Reinstall extension
```

**✅ Solution 3: Check Download Location**
```
1. Ensure extension downloaded completely
2. Check file size matches (should be ~2MB)
3. Re-download from official site: reqsploit.com
4. Avoid third-party extension stores
```

**✅ Solution 4: Developer Mode Installation**
```
If normal installation fails:
1. Go to chrome://extensions/
2. Enable "Developer mode" (top-right)
3. Click "Load unpacked"
4. Select extension folder
5. Extension should load manually
```

---

### Backend Connection Failed

**Problem:** "Cannot connect to ReqSploit backend"

**Solutions:**

**✅ Solution 1: Check Internet Connection**
```
1. Verify internet connectivity
2. Try opening reqsploit.com in browser
3. Check firewall isn't blocking connection
4. Disable VPN temporarily to test
```

**✅ Solution 2: Check Backend Status**
```
1. Visit status.reqsploit.com
2. Verify all services are operational
3. Check for scheduled maintenance
4. Wait if there's an ongoing incident
```

**✅ Solution 3: Clear Browser Cache**
```
1. Press Ctrl+Shift+Delete (Cmd+Shift+Delete on Mac)
2. Select "Cached images and files"
3. Choose "All time"
4. Click "Clear data"
5. Restart browser
6. Login again
```

**✅ Solution 4: Reset Extension**
```
1. Click extension icon
2. Settings → Advanced
3. "Reset Extension"
4. Reconfigure proxy settings
5. Test connection
```

---

## Connection Problems

### "Disconnected" Status in Dashboard

**Problem:** Dashboard shows red "Disconnected" indicator

**Cause:** Lost connection between browser, extension, and backend

**Solutions:**

**✅ Quick Fix:**
```
1. Refresh the dashboard page (F5)
2. Check extension icon - should be green
3. Click extension → "Reconnect"
4. Should turn green within 5 seconds
```

**✅ If Quick Fix Fails:**
```
1. Close all ReqSploit tabs
2. Close and reopen browser
3. Open extension popup
4. Verify "Connected" status
5. Open dashboard again
```

**✅ Nuclear Option:**
```
1. Logout from dashboard
2. Disable extension
3. Clear browser cache
4. Enable extension
5. Login again
6. Connection should restore
```

---

### Requests Not Appearing in Dashboard

**Problem:** Browsing websites but no requests captured

**Diagnostic Steps:**
```
Step 1: Check Extension Status
- Extension icon should be GREEN
- Click icon → verify "Connected to backend"
- Verify "Capturing: ON"

Step 2: Check Project
- Ensure a project is selected
- Create new project if needed
- Switch projects to test

Step 3: Check Scope
- Dashboard → Settings → Scope
- Ensure scope isn't too restrictive
- Try disabling scope temporarily

Step 4: Check Browser
- Use Chrome (not Brave, Edge, etc.)
- Disable other proxy extensions
- Check if requests reach Chrome DevTools
```

**Solutions:**

**✅ Solution 1: Enable Capture**
```
1. Click extension icon
2. Verify "Capturing: ON" (toggle if needed)
3. Browse to any website
4. Requests should appear within 2 seconds
```

**✅ Solution 2: Verify Proxy Settings**
```
1. Extension icon → Settings
2. Proxy Settings → "Auto-configure"
3. Or manually: localhost:8080
4. Save settings
5. Test with simple request (e.g., google.com)
```

**✅ Solution 3: Check Filters**
```
1. Dashboard → Requests tab
2. Clear all filters (Method, Status, Search)
3. Disable "In-scope only"
4. Requests should now appear
```

**✅ Solution 4: Reset Capture**
```
1. Extension → Settings → Advanced
2. "Stop All Capture"
3. "Start Capture"
4. Refresh dashboard
5. Browse to website
```

---

## Chrome Extension Issues

### Extension Icon is Gray/Red

**Problem:** Extension icon not green

**Status Meanings:**
- 🟢 **Green**: Connected and working
- 🟡 **Yellow**: Connecting...
- 🔴 **Red**: Disconnected or error
- ⚫ **Gray**: Extension disabled or not running

**Solutions:**

**For Gray Icon:**
```
1. Go to chrome://extensions/
2. Find ReqSploit
3. Ensure toggle is ON (blue)
4. Refresh any open tabs
5. Icon should turn green
```

**For Red Icon:**
```
1. Click icon to see error message
2. Common errors:
   - "Backend unreachable" → Check internet
   - "Authentication failed" → Re-login
   - "Proxy error" → Reset proxy settings
3. Click "Retry Connection"
4. If fails, logout and login again
```

**For Yellow Icon (Stuck Connecting):**
```
1. Wait 10 seconds (might be slow network)
2. If still yellow, click icon → "Force Reconnect"
3. If still stuck, disable and re-enable extension
4. Last resort: Uninstall and reinstall extension
```

---

### Extension Slowing Down Browser

**Problem:** Chrome becomes slow after installing extension

**Solutions:**

**✅ Solution 1: Optimize Settings**
```
1. Extension → Settings → Performance
2. Enable "Lightweight mode"
3. Reduce "Max requests in history" to 500
4. Enable "Auto-delete old requests"
5. Performance should improve
```

**✅ Solution 2: Clear Request History**
```
1. Dashboard → Requests
2. Select all (Ctrl+A)
3. Delete
4. Or: Settings → "Clear all data"
5. RAM usage should drop
```

**✅ Solution 3: Disable When Not Testing**
```
1. Click extension icon
2. "Pause Capture" when not actively testing
3. Or disable extension entirely
4. Re-enable when needed
```

**✅ Solution 4: Check Conflicts**
```
Disable other extensions temporarily:
- Other proxies (Foxy Proxy, etc.)
- Ad blockers (can conflict)
- Security extensions
- Developer tools extensions

Test if performance improves
```

---

## SSL Certificate Problems

### "Your connection is not private" Error

**Problem:** Certificate warnings on HTTPS sites

**Cause:** ReqSploit SSL certificate not trusted by browser

**Solutions:**

**✅ Windows:**
```
1. Download certificate from extension settings
2. Double-click reqsploit-ca.crt
3. Click "Install Certificate"
4. Select "Trusted Root Certification Authorities"
5. Finish installation
6. Restart Chrome
7. Error should disappear
```

**✅ macOS:**
```
1. Download certificate
2. Double-click reqsploit-ca.crt
3. Keychain Access opens
4. Find "ReqSploit CA"
5. Double-click → Trust → Always Trust
6. Enter password
7. Restart Chrome
8. Test HTTPS site
```

**✅ Linux:**
```
Ubuntu/Debian:
sudo cp reqsploit-ca.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates
sudo systemctl restart chrome

Arch/Manjaro:
sudo trust anchor reqsploit-ca.crt
sudo update-ca-trust

Then restart Chrome
```

**Verification:**
```
1. Go to https://example.com
2. Click padlock in address bar
3. Certificate → Details
4. Issuer should show "ReqSploit CA"
5. No warnings = correctly installed
```

---

### Certificate Expired Error

**Problem:** "Certificate has expired" message

**Cause:** ReqSploit certificate past expiration date

**Solutions:**

**✅ Solution 1: Download New Certificate**
```
1. Extension → Settings → SSL Certificate
2. "Download Latest Certificate"
3. Reinstall using steps above
4. Old certificate will be replaced
5. Restart browser
```

**✅ Solution 2: Auto-Update (if available)**
```
1. Extension → Settings → SSL Certificate
2. Enable "Auto-update certificate"
3. Extension will update automatically
4. Restart browser when prompted
```

**✅ Solution 3: Remove Old Certificate First**
```
Windows:
- Win+R → certmgr.msc
- Trusted Root Certification Authorities → Certificates
- Find "ReqSploit CA"
- Right-click → Delete
- Install new certificate

macOS:
- Keychain Access
- Find "ReqSploit CA"
- Delete
- Install new certificate

Linux:
sudo rm /usr/local/share/ca-certificates/reqsploit-ca.crt
sudo update-ca-certificates
# Then install new certificate
```

---

## Request Capture Issues

### Some Requests Not Captured

**Problem:** Missing requests from specific sites or types

**Common Causes & Solutions:**

**✅ HTTPS Sites Not Captured:**
```
Cause: Certificate not installed
Solution: Install SSL certificate (see above)
```

**✅ WebSocket Connections Not Captured:**
```
Cause: WebSocket support not enabled
Solution:
1. Extension → Settings → Advanced
2. Enable "Capture WebSocket traffic"
3. Restart browser
4. WebSockets should now appear
```

**✅ Static Files Not Captured:**
```
Cause: File type filtering enabled
Solution:
1. Dashboard → Requests → Filters
2. Uncheck "Hide static resources"
3. Images, CSS, JS should appear
```

**✅ Specific Domain Not Captured:**
```
Cause: Domain in exclusion list
Solution:
1. Extension → Settings → Scope
2. Check "Excluded domains"
3. Remove domain if listed
4. Save and test
```

---

### Duplicate Requests Appearing

**Problem:** Same request captured multiple times

**Cause:** Browser retry, redirection, or extension bug

**Solutions:**

**✅ Solution 1: Enable Deduplication**
```
1. Dashboard → Settings → Capture
2. Enable "Deduplicate requests"
3. Set "Deduplication window" to 1 second
4. Duplicates should be filtered
```

**✅ Solution 2: Check for Browser Extensions**
```
Disable these temporarily:
- Auto-refresh extensions
- Link checkers
- SEO tools
- Security scanners

Test if duplicates stop
```

**✅ Solution 3: Manually Delete**
```
1. Dashboard → Requests
2. Sort by URL and time
3. Select duplicate requests
4. Delete
```

---

## AI Feature Problems

### "Insufficient Tokens" Error

**Problem:** Cannot use AI features, token balance shows 0

**Solutions:**

**✅ Check Token Balance:**
```
1. Top-right user menu → Token Balance
2. Verify current balance
3. Check renewal date
4. If 0 tokens, wait for renewal or upgrade
```

**✅ Upgrade Plan:**
```
1. Settings → Billing → Plans
2. Compare FREE vs PRO vs ENTERPRISE
3. Upgrade to higher tier
4. Tokens available immediately after payment
```

**✅ Purchase Add-On Tokens:**
```
1. Settings → Billing → Buy Tokens
2. Select package size
3. Complete payment
4. Tokens added to account instantly
5. Never expire
```

---

### AI Scan Fails with Error

**Problem:** Scan starts but fails with error message

**Common Errors & Solutions:**

**Error: "Request too large"**
```
Cause: Request/response body exceeds token limit
Solution:
1. Use Quick Scan instead of Deep Scan
2. Truncate large request bodies
3. Or: Upgrade to PRO for larger limits
```

**Error: "AI service unavailable"**
```
Cause: Claude AI temporarily down or overloaded
Solution:
1. Check status.reqsploit.com
2. Wait 5-10 minutes
3. Retry scan
4. Contact support if persists
```

**Error: "Invalid request format"**
```
Cause: Request malformed or unsupported content type
Solution:
1. Ensure request is valid HTTP
2. Check Content-Type header
3. Try scanning different request
4. Report to support with example
```

**Error: "Rate limit exceeded"**
```
Cause: Too many scans in short time
Solution:
1. Wait 60 seconds
2. Retry scan
3. Spread out scans over time
4. Or: Upgrade to PRO for higher limits
```

---

### AI Results Seem Wrong

**Problem:** AI scan results don't match expectations

**Understanding AI Results:**
```
Important: AI is not perfect
- False positives can occur (~10-15% rate)
- False negatives possible (~5-10% rate)
- Always verify findings manually
- Use AI as a guide, not absolute truth
```

**Solutions:**

**✅ Verify Findings Manually:**
```
For each AI finding:
1. Read the description carefully
2. Test the PoC (proof-of-concept)
3. Use Repeater to reproduce
4. Confirm actual vulnerability exists
5. If false positive, mark as such
```

**✅ Try Different Scan Type:**
```
If Quick Scan seems off:
- Try Deep Scan for better analysis
- More tokens but higher accuracy

If Deep Scan has issues:
- Try Quick Scan for second opinion
- Compare results
```

**✅ Report Issues:**
```
1. Dashboard → AI Scan Result
2. Click "Report Issue"
3. Describe problem
4. Our team reviews and improves AI
5. Helps entire community
```

---

## Performance Issues

### Dashboard Loading Slowly

**Problem:** Dashboard takes long time to load or freezes

**Solutions:**

**✅ Solution 1: Clear Old Data**
```
1. Settings → Data Management
2. "Delete requests older than 30 days"
3. "Compact database"
4. Restart dashboard
5. Should load much faster
```

**✅ Solution 2: Reduce Display Limit**
```
1. Dashboard → Requests
2. Settings → Display
3. Reduce "Requests per page" to 50
4. Disable "Auto-load more"
5. Performance should improve
```

**✅ Solution 3: Use Filters**
```
Instead of loading all requests:
1. Use date range filter (last 7 days)
2. Filter by specific project
3. Use method/status filters
4. Loads only relevant data
```

**✅ Solution 4: Check Browser**
```
1. Close unused tabs
2. Disable unnecessary extensions
3. Update Chrome to latest version
4. Clear browser cache
5. Restart browser
```

---

### High Memory Usage

**Problem:** ReqSploit using too much RAM

**Solutions:**

**✅ Solution 1: Limit Request History**
```
1. Settings → Capture → Advanced
2. Set "Max requests" to 1000
3. Enable "Auto-delete old requests"
4. Set "Delete after" to 7 days
5. Memory usage should stabilize
```

**✅ Solution 2: Close Unused Tabs**
```
1. Close Repeater tabs you're not using
2. Close Intruder tabs
3. Close old dashboard tabs
4. Keep only active tabs open
```

**✅ Solution 3: Export and Clear**
```
Before clearing:
1. Export important findings
2. Save Repeater requests as templates
3. Export AI scan results

Then clear:
1. Settings → Clear all data
2. Confirm deletion
3. Memory should drop significantly
```

---

## Account & Billing

### Cannot Login

**Problem:** Login fails with error

**Solutions:**

**Error: "Invalid credentials"**
```
1. Double-check email and password
2. Check Caps Lock is off
3. Try "Forgot password" reset
4. Check spam folder for reset email
5. Contact support if still failing
```

**Error: "Account not activated"**
```
1. Check email for activation link
2. Check spam/junk folder
3. Click activation link
4. Try login again
5. Or: Request new activation email
```

**Error: "Too many login attempts"**
```
1. Wait 15 minutes
2. Clear browser cookies
3. Try again
4. Use "Forgot password" if needed
```

---

### Billing Issues

**Problem: "Payment failed"**
```
Causes:
- Insufficient funds
- Card expired
- Bank blocking transaction
- Incorrect card details

Solutions:
1. Verify card details are correct
2. Ensure sufficient balance
3. Contact your bank
4. Try different payment method
5. Contact support@reqsploit.com
```

**Problem: "Subscription not active after payment"**
```
1. Check email for confirmation
2. Wait 5-10 minutes for processing
3. Refresh dashboard
4. Logout and login again
5. If still not active, contact support with:
   - Transaction ID
   - Payment date/time
   - Amount paid
```

**Problem: "Cannot cancel subscription"**
```
1. Settings → Billing → Subscription
2. Click "Cancel Subscription"
3. Confirm cancellation
4. If button not working:
   - Try different browser
   - Clear cache and retry
   - Contact support@reqsploit.com
```

---

## Still Having Issues?

### Before Contacting Support

**Gather this information:**
1. **Error message** (exact text or screenshot)
2. **Browser version** (chrome://version)
3. **Extension version** (chrome://extensions)
4. **Steps to reproduce** (what did you do?)
5. **Expected vs actual** (what should happen vs what happened?)

### Support Channels

**📧 Email Support:**
- FREE: support@reqsploit.com (48-72h response)
- PRO: support@reqsploit.com (24h response)
- ENTERPRISE: enterprise@reqsploit.com (4h response)

**💬 Community:**
- Discord: [discord.gg/reqsploit](https://discord.gg/reqsploit)
- Forum: [community.reqsploit.com](https://community.reqsploit.com)

**📖 Documentation:**
- Full docs: [docs.reqsploit.com](https://docs.reqsploit.com)
- FAQ: [docs.reqsploit.com/faq](../troubleshooting/faq.md)
- Videos: [youtube.com/reqsploit](https://youtube.com/reqsploit)

**🐛 Bug Reports:**
- GitHub: [github.com/reqsploit/issues](https://github.com/reqsploit/issues)
- Include: Version, steps to reproduce, expected/actual behavior

---

## Related Documentation

- 📖 **[Installation Guide](../getting-started/installation.md)** - Detailed installation instructions
- 📖 **[SSL Certificate Setup](./ssl-certificate.md)** - Certificate troubleshooting
- 📖 **[FAQ](./faq.md)** - Frequently asked questions
- 📖 **[Quick Start](../getting-started/quick-start.md)** - Getting started guide

---

**Most issues resolved?** Head back to [testing](../getting-started/quick-start.md)!

**Still stuck?** We're here to help at [support@reqsploit.com](mailto:support@reqsploit.com)
