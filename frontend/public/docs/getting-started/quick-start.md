# 🎯 Quick Start Guide

Get productive with ReqSploit in 15 minutes! This guide walks you through your first security test from start to finish.

---

## What You'll Learn

By the end of this guide, you'll be able to:

- ✅ Capture HTTP/HTTPS requests automatically
- ✅ Analyze requests with AI for vulnerabilities
- ✅ Modify and replay requests in Repeater
- ✅ Run automated fuzzing campaigns with Intruder
- ✅ Detect sensitive data with Magic Scan

**Prerequisites**: [Installation complete](./installation.md)

**Estimated Time**: 15 minutes

---

## Step 1: Your First Project (2 minutes)

Projects help organize your testing sessions.

### Create a Project

1. **Open Dashboard**
   - Go to [app.reqsploit.com](https://app.reqsploit.com)
   - You'll see the main dashboard interface

2. **Create New Project**
   - Look at the left sidebar
   - Click "+ New Project" button
   - Enter project details:
     ```
     Name: My First Test
     Description: Learning ReqSploit basics
     Target: httpbin.org
     ```
   - Click "Create"

3. **Set Project Scope**
   - Click on your new project to select it
   - Go to "Scope" tab (bottom of project panel)
   - Add include rule:
     ```
     *.httpbin.org
     ```
   - This ensures only httpbin.org requests are captured

**🎯 Tip**: Use descriptive project names like "ACME Corp API Test" or "Bug Bounty - example.com"

---

## Step 2: Capture Your First Requests (3 minutes)

Let's capture some HTTP traffic!

### Enable Capture

1. **Check Extension**
   - Click ReqSploit icon (🎯) in Chrome toolbar
   - Verify status shows "🟢 Connected"
   - Leave "Intercept" OFF for now (we'll use it later)

2. **Visit Test Site**
   - Open a new Chrome tab
   - Visit: `http://httpbin.org/get`
   - The page will load with JSON response

3. **View Captured Request**
   - Go back to ReqSploit Dashboard
   - Click "History" tab (center-left panel)
   - You should see your request:
     ```
     GET  httpbin.org/get  200  2.5KB  245ms
     ```
   - Click on the request to view details

### Understanding the Request View

When you click a request, you see three sections:

**Request Panel (Top)**:
```http
GET /get HTTP/1.1
Host: httpbin.org
User-Agent: Mozilla/5.0...
Accept: text/html,application/json...
```

**Response Panel (Middle)**:
```json
{
  "args": {},
  "headers": {
    "Host": "httpbin.org",
    "User-Agent": "Mozilla/5.0..."
  },
  "origin": "123.45.67.89",
  "url": "http://httpbin.org/get"
}
```

**AI Analysis Panel (Right)**:
- Currently empty (we'll use this next!)

---

## Step 3: AI-Powered Security Analysis (5 minutes)

Now let's analyze our request for vulnerabilities using AI.

### Run a Quick Scan

1. **Select Request**
   - Make sure your httpbin.org request is selected
   - AI Analysis panel appears on the right

2. **Start Quick Scan**
   - Click "Quick Scan" button (8K tokens)
   - You'll see a loading indicator
   - Wait 20-30 seconds for analysis

3. **Review Results**

   After analysis, you'll see:

   **Vulnerabilities Section**:
   ```
   ℹ️ Information Disclosure - LOW
   ├─ Location: Response Body
   ├─ Evidence: IP address exposed (123.45.67.89)
   └─ Impact: Attacker can determine your real IP

   ⚠️ Missing Security Headers - MEDIUM
   ├─ Location: Response Headers
   ├─ Evidence: No X-Frame-Options, CSP headers
   └─ Remediation: Add security headers to responses
   ```

   **Suggestions Section**:
   ```
   💡 Test for Header Injection
   💡 Check for HTTP Parameter Pollution
   💡 Verify CORS configuration
   ```

4. **Explore a Vulnerability**
   - Click on any vulnerability to expand
   - Read the full description
   - Check "Evidence" to see exact proof
   - Review "Remediation" for how to fix it

### Quick Scan vs Deep Scan

| Feature | Quick Scan (8K tokens) | Deep Scan (16K tokens) |
|---------|----------------------|----------------------|
| **Speed** | 20-30 seconds | 60-90 seconds |
| **Depth** | Basic vulnerability detection | Comprehensive analysis |
| **Context** | Limited | Full request/response context |
| **Chains** | Single vulnerabilities | Multi-step exploitation |
| **Best For** | Rapid screening | In-depth assessment |
| **Cost** | ~8K tokens | ~16K tokens |

**🎯 Tip**: Use Quick Scan for fast screening, Deep Scan when you find something interesting!

---

## Step 4: Manual Testing with Repeater (3 minutes)

Repeater lets you manually modify and replay requests.

### Send Request to Repeater

1. **From History**
   - Right-click on your httpbin.org request
   - Select "Send to Repeater"
   - A new "Repeater" tab opens

2. **Modify the Request**
   - You'll see the request in an editable form
   - Let's add a custom header:
     ```
     Click "Add Header" button
     Key: X-Custom-Test
     Value: ReqSploit-Test
     ```

3. **Send Modified Request**
   - Click "Send" button
   - Wait for response (should be quick)
   - Check the response - your header appears in the JSON!
     ```json
     {
       "headers": {
         "X-Custom-Test": "ReqSploit-Test",
         ...
       }
     }
     ```

### AI Suggest Tests (NEW!)

Repeater has a powerful AI feature:

1. **Open AI Panel**
   - Click the "✨ AI" button (top-right of Repeater)
   - Panel slides in from the right

2. **Generate Test Suggestions**
   - Click "Suggest Tests" button (12K tokens)
   - Wait 30-45 seconds
   - AI generates 5-10 security test cases

3. **Example Suggestions**:
   ```
   🔴 SQL Injection Test
   └─ Payload: ?id=1' OR '1'='1
   └─ Expected: Different response or error message
   └─ [Execute Test] button

   🟡 XSS Test
   └─ Payload: <script>alert(1)</script>
   └─ Expected: Script in response or encoded
   └─ [Execute Test] button

   🟢 Header Injection
   └─ Payload: X-Forwarded-For: 127.0.0.1
   └─ Expected: Bypass IP restrictions
   └─ [Execute Test] button
   ```

4. **Execute a Test**
   - Click [Execute Test] on any suggestion
   - Request is automatically modified and sent
   - Results appear in the history below

**🎯 Tip**: Enable "Auto-execute" to run all tests automatically!

---

## Step 5: Automated Fuzzing with Intruder (3 minutes)

Intruder automates testing with multiple payloads.

### Create a Campaign

1. **Send to Intruder**
   - Go back to History tab
   - Right-click on a request with parameters
   - Or visit: `http://httpbin.org/get?id=1`
   - Right-click → "Send to Intruder"

2. **Mark Payload Positions**
   - Click "Intruder" tab
   - Find the parameter you want to fuzz
   - In the URL: `http://httpbin.org/get?id=§1§`
   - Click "Add Position" button
   - Select the `1` and wrap it with `§` markers

3. **Select Payload Type**
   - Go to "Payloads" section
   - Choose "Number Range":
     ```
     From: 1
     To: 100
     Step: 1
     ```
   - This will test IDs from 1 to 100

4. **Configure Attack**
   - Attack Type: "Sniper" (one position at a time)
   - Threads: 5 (5 concurrent requests)
   - Delay: 100ms (between requests)

5. **Start Campaign**
   - Click "Start Attack" button
   - Watch the progress bar
   - Results appear in real-time

### Analyze Results

After the campaign runs:

1. **Results Table**:
   ```
   #   | Payload | Status | Length | Time
   1   | 1       | 200    | 445    | 123ms
   2   | 2       | 200    | 445    | 118ms
   3   | 3       | 200    | 445    | 125ms
   ...
   99  | 99      | 200    | 445    | 120ms
   100 | 100     | 200    | 445    | 119ms
   ```

2. **Find Anomalies**
   - Sort by "Length" column
   - Look for different response sizes
   - Click rows to see full response
   - Different lengths often indicate different behavior

**🎯 Tip**: Use AI Payload Generator to create intelligent fuzzing payloads automatically!

---

## Step 6: Detect Sensitive Data with Magic Scan

Magic Scan automatically detects sensitive information in your requests.

### Enable Magic Scan

1. **Navigate to Magic Scan**
   - Click "🎣 Magic Scan" tab (after Intruder)
   - You'll see the Magic Scan dashboard

2. **View Detected Findings**

   Magic Scan runs automatically on all captured requests. You might see:

   ```
   🔴 CRITICAL - AWS Access Key
   ├─ Pattern: AKIA****************
   ├─ Location: Request Headers (Authorization)
   ├─ Confidence: 95%
   └─ Actions: [Mark Safe] [False Positive] [Delete]

   🟡 MEDIUM - Email Address
   ├─ Pattern: user@example.com
   ├─ Location: Request Body
   ├─ Confidence: 100%
   └─ Actions: [Mark Safe] [False Positive] [Delete]

   🟢 LOW - IP Address
   ├─ Pattern: 192.168.1.100
   ├─ Location: Request Headers (X-Forwarded-For)
   ├─ Confidence: 100%
   └─ Actions: [Mark Safe] [False Positive] [Delete]
   ```

3. **Filter by Severity**
   - Use severity filter at the top
   - Select: CRITICAL, HIGH, MEDIUM, LOW
   - Or combine multiple severities

4. **Filter by Category**
   - API_KEYS: AWS, GitHub, Stripe, etc.
   - PRIVATE_KEYS: RSA, SSH keys
   - DATABASE_CREDENTIALS: Passwords, connection strings
   - AUTHENTICATION_TOKENS: JWT, OAuth tokens
   - PII: Email, SSN, credit cards
   - And more!

### What Magic Scan Detects

Magic Scan includes **160+ patterns** for:

**API Keys & Secrets** (50+ patterns):
- AWS Access Keys / Secret Keys
- Google API Keys
- GitHub Personal Access Tokens
- Slack Bot Tokens
- Stripe API Keys
- SendGrid API Keys
- Twilio Auth Tokens
- OpenAI API Keys
- And 40+ more services

**Private Keys** (6 patterns):
- RSA Private Keys
- SSH Private Keys
- PGP Private Keys
- EC Private Keys

**Database Credentials** (9 patterns):
- MySQL connection strings
- PostgreSQL URLs
- MongoDB credentials
- Redis auth strings

**Tokens & Auth** (6 patterns):
- JWT tokens
- OAuth tokens
- Session tokens
- API tokens

**Personal Information** (10 patterns):
- Email addresses
- Credit card numbers (with Luhn validation)
- Social Security Numbers
- IBAN bank accounts
- Phone numbers

**🎯 Tip**: Magic Scan helps you avoid accidentally exposing credentials in bug bounty reports!

---

## Step 7: Intercept Mode (Bonus - 2 minutes)

Intercept mode lets you modify requests BEFORE they're sent.

### Enable Interception

1. **Turn On Intercept**
   - Click ReqSploit extension icon (🎯)
   - Toggle "Intercept" switch to ON (turns orange)
   - Badge shows number of intercepted requests

2. **Trigger a Request**
   - Visit: `http://httpbin.org/post` (in a form)
   - Or just navigate to any website
   - Request is held and appears in "Intercept" tab

3. **Modify the Request**
   - Go to Dashboard → "Intercept" tab
   - You'll see the held request
   - Modify any part:
     - Change HTTP method: GET → POST
     - Edit headers: Add/Remove/Modify
     - Edit body: Change parameters
     - Edit URL: Change path or query params

4. **Forward or Drop**
   - Click "Forward" to send (modified) request
   - Or click "Drop" to block the request
   - Page will load with your modifications

### AI Analysis During Intercept

1. **Analyze Before Sending**
   - With a request intercepted
   - Click "Analyze (10K tokens)" button
   - Wait for AI analysis
   - Review vulnerabilities

2. **Apply AI Suggestions**
   - If AI finds issues, it may suggest modifications
   - Click "Apply Suggestion" button
   - Request is automatically modified
   - Click "Forward" to send

**🎯 Tip**: Use Intercept mode to test authorization bypasses by changing user IDs or tokens!

---

## Common Use Cases

Now that you know the basics, here are practical scenarios:

### 🔍 **Testing an API**
```
1. Create project with API domain in scope
2. Use Postman/browser to make API calls
3. Requests captured in History
4. Run Deep Scan on interesting endpoints
5. Use Repeater to test authentication/authorization
6. Use Intruder to fuzz parameters
```

### 🐛 **Bug Bounty Hunting**
```
1. Create project for target domain
2. Browse the application normally (all requests captured)
3. Use Magic Scan to find exposed secrets
4. Run AI Deep Scan on authentication/sensitive endpoints
5. Use AI Suggest Tests to generate exploitation attempts
6. Use Intruder with AI Payloads for comprehensive fuzzing
```

### 🔐 **Pen Testing**
```
1. Set up project with full scope
2. Enable Intercept for real-time manipulation
3. Test access controls by modifying user IDs
4. Use Repeater for manual SQL injection testing
5. Generate Attack Chains to find multi-step vulnerabilities
6. Export findings for report
```

---

## Quick Reference Card

### Essential Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| **Send to Repeater** | `Ctrl+R` |
| **Send to Intruder** | `Ctrl+I` |
| **Quick Scan** | `Ctrl+Q` |
| **Deep Scan** | `Ctrl+D` |
| **Toggle Intercept** | `Ctrl+T` |
| **Forward Request** | `Ctrl+F` |
| **Drop Request** | `Ctrl+X` |
| **New Project** | `Ctrl+N` |
| **Search Requests** | `Ctrl+S` |

### Token Usage Guide

| Action | Tokens Used | Time | Best For |
|--------|-------------|------|----------|
| **Quick Scan** | ~8,000 | 20-30s | Fast screening |
| **Deep Scan** | ~16,000 | 60-90s | Thorough analysis |
| **Analyze Intercept** | ~10,000 | 30-40s | Real-time checks |
| **Suggest Tests** | ~12,000 | 30-45s | Test generation |
| **AI Payloads** | ~16,000 | 40-60s | Smart fuzzing |
| **Dork Generator** | ~14,000 | 35-50s | OSINT research |

---

## Troubleshooting

### Requests Not Appearing

**Problem**: No requests show in History
**Solution**:
- Check extension is connected (green status)
- Verify site is in project scope
- Disable other proxy extensions
- Refresh Dashboard page

### AI Scan Fails

**Problem**: AI scan returns error
**Solution**:
- Check you have enough tokens (see top bar)
- Request might be too large (>100KB)
- Try Quick Scan instead of Deep Scan
- Check internet connection

### Slow Performance

**Problem**: Dashboard is slow/laggy
**Solution**:
- Clear old requests (History → Clear button)
- Reduce number of captured requests
- Exclude CDN/static resources from scope
- Close unused projects

---

## Next Steps

Congratulations! 🎉 You've completed the Quick Start guide.

**Continue Learning**:

1. **📖 [Interface Overview](./interface.md)**
   - Master the dashboard layout
   - Learn advanced filters
   - Customize your workspace

2. **🤖 [AI Features Deep Dive](../ai-features/overview.md)**
   - Understand AI models (Haiku vs Sonnet)
   - Optimize token usage
   - Advanced AI workflows

3. **🔬 [Real-World Tutorials](../tutorials/testing-rest-api.md)**
   - Test actual APIs
   - Complete bug bounty workflow
   - Professional pen testing methodology

4. **⚙️ [Core Features](../core-features/repeater.md)**
   - Master Repeater techniques
   - Advanced Intruder campaigns
   - Intercept best practices

---

## Practice Resources

Want to practice? Try these safe, legal testing grounds:

- **OWASP Juice Shop**: Intentionally vulnerable web app
- **HackTheBox**: Cybersecurity training platform
- **TryHackMe**: Hands-on security labs
- **PortSwigger Web Security Academy**: Free web security training

**🎯 Remember**: Only test applications you have permission to test!

---

**Questions?** Check the [FAQ](../troubleshooting/faq.md) or join our [Discord Community](https://discord.gg/reqsploit)!
