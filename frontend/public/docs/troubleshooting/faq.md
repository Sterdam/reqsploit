# ❓ Frequently Asked Questions (FAQ)

Complete answers to the most common questions about ReqSploit.

---

## 📋 Table of Contents

- [General Questions](#general-questions)
- [Installation & Setup](#installation--setup)
- [Features & Functionality](#features--functionality)
- [AI Features](#ai-features)
- [Pricing & Billing](#pricing--billing)
- [Security & Privacy](#security--privacy)
- [Troubleshooting](#troubleshooting)
- [Comparison with Other Tools](#comparison-with-other-tools)

---

## General Questions

### What is ReqSploit?

ReqSploit is an AI-powered web security testing platform that combines traditional proxy/intercept functionality (like Burp Suite) with cutting-edge AI analysis powered by Claude (Anthropic). It helps security professionals, penetration testers, and bug bounty hunters discover vulnerabilities faster and more effectively.

### Who is ReqSploit for?

- **Security Professionals**: Penetration testers, security consultants
- **Bug Bounty Hunters**: Finding and reporting vulnerabilities for rewards
- **Developers**: Testing security of their own applications
- **Students**: Learning web security and ethical hacking
- **Security Teams**: Enterprise security testing and compliance

### Is ReqSploit free?

Yes! ReqSploit offers a generous FREE plan with:
- ✅ All core features (Intercept, Repeater, Intruder, Magic Scan)
- ✅ 50,000 AI tokens per month (~6 Deep Scans or ~12 Quick Scans)
- ✅ Unlimited request capture and storage
- ✅ Community support

Paid plans (PRO and ENTERPRISE) offer more AI tokens and additional features.

### How is ReqSploit different from Burp Suite?

| Feature | Burp Suite | ReqSploit |
|---------|------------|-----------|
| **AI Analysis** | ❌ No | ✅ Yes (Claude) |
| **Cloud-Based** | ❌ Desktop only | ✅ Access anywhere |
| **Magic Scan** | ❌ No | ✅ 160+ patterns |
| **AI Payloads** | ❌ No | ✅ Context-aware |
| **Attack Chains** | ❌ Manual | ✅ AI-generated |
| **Learning Curve** | Steep | Gentle (AI-guided) |
| **Price (Free)** | Limited | Full-featured |

ReqSploit focuses on AI-powered automation while Burp Suite is more manual and desktop-focused.

### Is ReqSploit legal to use?

**Yes**, ReqSploit itself is 100% legal. However, **HOW you use it determines legality**:

✅ **Legal Uses**:
- Testing systems you own or have explicit permission to test
- Authorized penetration testing
- Bug bounty programs
- Security research with consent
- Educational purposes on lab environments

❌ **Illegal Uses**:
- Testing systems without authorization
- Malicious hacking
- Data theft
- Unauthorized access

**⚖️ Legal Disclaimer**: You are solely responsible for how you use ReqSploit. Only test systems you have explicit written permission to test.

---

## Installation & Setup

### Do I need to install anything?

Yes, you need two things:

1. **Chrome Extension** (for capturing traffic)
   - Install from Chrome Web Store
   - 5-minute setup

2. **SSL Certificate** (for HTTPS interception)
   - Download from dashboard
   - Install in your OS/browser
   - 10-minute setup

Total setup time: ~15 minutes. [View Installation Guide](../getting-started/installation.md)

### Which browsers are supported?

Currently **Google Chrome only** for the extension. However, you can use any browser's traffic if you:
- Configure system proxy to point to ReqSploit (port 8080)
- Install the SSL certificate in that browser

**Coming Soon**: Firefox, Edge, Safari extensions

### Can I use ReqSploit on mobile?

Yes! You can:

1. **Mobile Browser Testing**:
   - Configure your phone's proxy to ReqSploit (port 8080)
   - Install SSL certificate on your device
   - Browse normally - traffic is captured

2. **Mobile App Testing**:
   - Set device proxy to ReqSploit
   - Use tools like mitmproxy or Burp to route traffic
   - Capture API calls from mobile apps

[View Mobile Setup Guide](../advanced/mobile-testing.md)

### Can I use ReqSploit with Docker/WSL/VPS?

Yes! ReqSploit works with all these environments:

**Docker**:
```bash
# Route Docker traffic through ReqSploit
docker run --add-host=host.docker.internal:host-gateway \
  -e HTTP_PROXY=http://host.docker.internal:8080 \
  myapp
```

**WSL (Windows Subsystem for Linux)**:
```bash
# Configure WSL proxy
export HTTP_PROXY=http://localhost:8080
export HTTPS_PROXY=http://localhost:8080
```

**VPS/Remote Server**:
- Install extension on local machine
- Connect to VPS via SSH tunnel
- Forward proxy port: `ssh -L 8080:localhost:8080 user@vps`

---

## Features & Functionality

### What is Magic Scan?

Magic Scan is ReqSploit's automatic sensitive data detector. It continuously scans all your captured traffic for **160+ patterns** including:

- API keys (AWS, Google, GitHub, Stripe, etc.)
- Private keys (RSA, SSH, PGP)
- Database credentials
- Authentication tokens (JWT, OAuth)
- Cryptocurrency wallets
- PII (credit cards, SSNs, emails)

Magic Scan runs **automatically and in real-time** - no manual action needed!

[Learn More About Magic Scan](../core-features/magic-scan.md)

### How does Intercept mode work?

Intercept mode lets you:

1. **Pause Requests**: Hold HTTP requests before they're sent
2. **Modify**: Edit method, URL, headers, body
3. **Analyze**: Run AI analysis before forwarding
4. **Forward/Drop**: Send or block the request

**Example Use Case**:
```
1. Enable Intercept
2. Submit login form
3. Request held
4. Change username: user → admin
5. Forward modified request
6. Test for authorization bypass
```

[View Intercept Guide](../core-features/intercept.md)

### What's the difference between Repeater and Intruder?

| Feature | Repeater | Intruder |
|---------|----------|----------|
| **Purpose** | Manual testing | Automated fuzzing |
| **Requests** | One at a time | Batch (10-10,000+) |
| **Modification** | Manual editing | Payload injection |
| **Best For** | Understanding | Comprehensive testing |
| **AI Integration** | Suggest Tests | Payload Generator |

**Example**:
- **Repeater**: Test SQL injection payload manually, see exact response
- **Intruder**: Test 1,000 SQL injection payloads automatically, find which work

[Repeater Guide](../core-features/repeater.md) | [Intruder Guide](../core-features/intruder.md)

### Can I export my findings?

Yes! Multiple export formats:

**Individual Requests**:
- Copy as cURL
- Export as HAR file
- Export as JSON

**Batch Export**:
- History → Select multiple → Export
- Intruder Results → Export CSV/JSON
- Magic Scan Findings → Export report

**AI Analysis**:
- Copy AI response (Markdown)
- Export vulnerability report (PDF) *(coming soon)*
- Integration with Jira/GitHub *(coming soon)*

---

## AI Features

### How does AI analysis work?

1. You select a request
2. Click "Quick Scan" or "Deep Scan"
3. Request is sent to Claude AI (Anthropic)
4. AI analyzes for 30+ vulnerability types
5. Results returned in 20-90 seconds

**What AI Sees**:
- HTTP method, URL, headers, body
- Response status, headers, body
- Your project context (optional)

**What AI Does**:
- Pattern recognition (SQLi, XSS, etc.)
- Context analysis (business logic flaws)
- Exploitation path generation
- Remediation recommendations

[View AI Features Guide](../ai-features/overview.md)

### What's the difference between Quick Scan and Deep Scan?

| Aspect | Quick Scan | Deep Scan |
|--------|------------|-----------|
| **Model** | Haiku 4.5 (faster) | Sonnet 4.5 (smarter) |
| **Tokens** | ~8,000 | ~16,000 |
| **Time** | 20-30 seconds | 60-90 seconds |
| **Depth** | Common vulnerabilities | Comprehensive analysis |
| **Use Case** | Initial screening | In-depth assessment |

**Example Output Difference**:

**Quick Scan**:
```
🟡 SQL Injection possible in username field
Evidence: Special characters not sanitized
```

**Deep Scan**:
```
🔴 SQL Injection (CWE-89, CVSS 9.8)
Location: username parameter
Evidence: MySQL error message in response
Exploitation:
  1. Bypass auth: admin' OR '1'='1'--
  2. Extract DB: admin' UNION SELECT table_name...
  3. Dump credentials: admin' UNION SELECT username,password...
Remediation:
  - Use prepared statements
  - Validate input (whitelist)
  - Encode special characters
  - Deploy WAF
Code Example: [shows secure implementation]
```

[Detailed Comparison](../ai-features/quick-deep-scan.md)

### What are AI tokens and how do they work?

**Tokens** are units of text processing:
- Input tokens: Your request data sent to AI
- Output tokens: AI's analysis response
- 1 token ≈ 4 characters

**Token Usage**:
```
Quick Scan: ~8,000 tokens
Deep Scan: ~16,000 tokens
AI Suggest Tests: ~12,000 tokens
AI Payload Generator: ~16,000 tokens
```

**Plans**:
- FREE: 50,000 tokens/month
- PRO: 500,000 tokens/month
- ENTERPRISE: Unlimited

[View Token Guide](../ai-features/tokens.md)

### Can I run out of AI tokens?

**FREE Plan**: Yes, after 50,000 tokens (~6 Deep Scans), you'll need to wait until next month or upgrade.

**PRO Plan**: Yes, after 500,000 tokens (~31 Deep Scans), same as above.

**ENTERPRISE Plan**: No, unlimited tokens!

**What happens when you run out**:
- Core features still work (Intercept, Repeater, Intruder, Magic Scan)
- Only AI features are paused
- Tokens reset on 1st of each month

**Tips to conserve tokens**:
1. Use Quick Scan first
2. Only Deep Scan interesting findings
3. Filter out static resources
4. Use Magic Scan (free) for secrets

### Are AI results always accurate?

**No tool is 100% accurate**, including AI. ReqSploit achieves:

- 90% average detection rate
- 6-12% false positive rate
- 95%+ accuracy for high-confidence findings

**Best Practices**:
1. ✅ Always manually verify findings
2. ✅ Use AI as a guide, not gospel
3. ✅ Check evidence before reporting
4. ✅ Test exploitation manually
5. ✅ Combine AI with manual testing

**False Positives**:
If AI reports something that doesn't exist:
- Mark as "False Positive" in the UI
- This helps improve future accuracy
- AI learns from your feedback

---

## Pricing & Billing

### How much does ReqSploit cost?

| Plan | Price | AI Tokens | Support |
|------|-------|-----------|---------|
| **FREE** | $0/month | 50,000 | Community |
| **PRO** | $29/month | 500,000 | Email (24h) |
| **ENTERPRISE** | Contact us | Unlimited | Dedicated |

**All plans include**:
- ✅ Unlimited request capture
- ✅ All core features
- ✅ Magic Scan (160+ patterns)
- ✅ Export/Import
- ✅ Projects & organization

### Is there a discount for annual billing?

Yes! **Save 20%** with annual billing:

- **PRO**: $348/year instead of $418.80 ($29×12)
- **Savings**: $70.80/year

### Can I upgrade or downgrade anytime?

Yes! Change plans anytime:

**Upgrade**: Immediate access, prorated billing
**Downgrade**: Takes effect next billing cycle, keep tokens until then

### What payment methods do you accept?

- 💳 Credit/Debit Cards (Visa, Mastercard, Amex)
- 💰 PayPal
- 🏦 Wire Transfer (Enterprise only)
- ₿ Cryptocurrency (Enterprise only)

### Do you offer refunds?

**Yes**, 30-day money-back guarantee for PRO plan:

- No questions asked within first 30 days
- Full refund issued within 5-7 business days
- Keep using during refund process

**No refund after 30 days** or for ENTERPRISE plans (custom contracts).

---

## Security & Privacy

### Is my data secure?

**Yes!** ReqSploit implements enterprise-grade security:

- 🔒 **Encryption**: AES-256 at rest, TLS 1.3 in transit
- 🔐 **Authentication**: Secure JWT tokens with refresh
- 🛡️ **Isolation**: Your data isolated from other users
- 🏰 **Infrastructure**: Hosted on AWS with SOC 2 compliance
- 🔍 **Monitoring**: 24/7 security monitoring

### Do you store my captured requests?

**Yes**, in your account for analysis and history:

- Stored encrypted in our database
- Only accessible to you (we cannot see them)
- You can delete anytime
- Automatic cleanup after 90 days (configurable)

**AI Processing**:
- Requests sent to Claude AI for analysis
- Anthropic doesn't store requests (per their privacy policy)
- Only analysis results are returned

### Can ReqSploit staff see my data?

**No!** Your captured requests are:

- Encrypted with your account key
- Not accessible to ReqSploit staff
- Not used for training or analytics
- Completely private to you

**Exception**: With your explicit consent for support purposes only.

### Is ReqSploit GDPR compliant?

**Yes!** We comply with GDPR and major privacy regulations:

- ✅ Right to access your data
- ✅ Right to delete your data
- ✅ Right to export your data
- ✅ Transparent data handling
- ✅ No sale of user data
- ✅ EU data residency option (Enterprise)

[View Privacy Policy](https://reqsploit.com/privacy)

### What about compliance (SOC 2, ISO 27001)?

**Current Status**:
- ✅ SOC 2 Type I certified
- 🔄 SOC 2 Type II in progress (Q2 2026)
- 🔄 ISO 27001 certification planned (Q4 2026)

**Enterprise customers** can request:
- Penetration test reports
- Security questionnaires
- Custom BAAs (Business Associate Agreements)

---

## Troubleshooting

### Requests aren't being captured

**Possible causes**:

1. **Extension not connected**
   - Check: Extension icon should be green
   - Fix: Refresh dashboard, restart browser

2. **Wrong scope**
   - Check: Site might be excluded
   - Fix: Review project scope settings

3. **Certificate issues**
   - Check: HTTPS sites show certificate errors
   - Fix: Reinstall SSL certificate

4. **Other proxy conflicts**
   - Check: Other tools running (Burp, Charles)
   - Fix: Disable other proxies

[Full Troubleshooting Guide](./common-issues.md)

### AI scan fails or returns error

**Common issues**:

1. **Out of tokens**
   - Check: Token counter in top bar
   - Fix: Wait for monthly reset or upgrade

2. **Request too large**
   - Check: Request >100KB?
   - Fix: Use smaller request or exclude large files

3. **Network issues**
   - Check: Internet connection
   - Fix: Retry in a few minutes

4. **Rate limiting**
   - Check: Too many requests too fast
   - Fix: Wait 1-2 minutes, try again

### Certificate errors in browser

**Error**: "Your connection is not private" (HTTPS sites)

**Causes & Fixes**:

1. **Certificate not installed**
   - Go to [Installation Guide](../getting-started/installation.md#install-certificate)

2. **Certificate in wrong store**
   - Windows: Must be in "Trusted Root"
   - macOS: Must be set to "Always Trust"

3. **Browser not restarted**
   - Close ALL Chrome windows
   - Reopen Chrome

4. **Corporate proxy interfering**
   - Contact IT department
   - May need to whitelist ReqSploit

### Extension won't connect

**Error**: "🔴 Not Connected" in extension popup

**Fixes**:

1. Refresh dashboard page
2. Check internet connection
3. Clear browser cache (Ctrl+Shift+Delete)
4. Log out and back in
5. Reinstall extension (last resort)

---

## Comparison with Other Tools

### ReqSploit vs Burp Suite

| Feature | ReqSploit | Burp Suite |
|---------|-----------|------------|
| **Deployment** | Cloud + Extension | Desktop only |
| **AI Features** | ✅ Claude integration | ❌ None |
| **Magic Scan** | ✅ 160+ patterns | ⚠️ Basic scanner |
| **Learning Curve** | Gentle (AI-guided) | Steep |
| **Price** | Free-$29 | Free-$499 |
| **Platform** | Cross-platform (web) | Windows/Mac/Linux |
| **Collaboration** | ✅ Cloud-based | ❌ Desktop only |
| **Mobile Testing** | ✅ Easy setup | ⚠️ Complex |

**When to use ReqSploit**:
- Need AI-powered analysis
- Want cloud-based accessibility
- Bug bounty hunting
- Learning web security
- Team collaboration

**When to use Burp Suite**:
- Need advanced manual features
- Offline work required
- Existing Burp workflow
- Large enterprise with budget

### ReqSploit vs OWASP ZAP

| Feature | ReqSploit | OWASP ZAP |
|---------|-----------|-----------|
| **Type** | Commercial SaaS | Open source |
| **AI Features** | ✅ Yes | ❌ No |
| **Ease of Use** | Very easy | Moderate |
| **Price** | Free-$29 | Free |
| **Support** | Email + Community | Community only |
| **Updates** | Automatic | Manual |

**When to use ReqSploit**:
- Want AI assistance
- Need cloud accessibility
- Prefer polished UI/UX
- Want support

**When to use ZAP**:
- Need 100% free solution
- Want full source code control
- Offline requirement
- Open source preference

### ReqSploit vs Postman

**Note**: Postman is not a security testing tool, but some use it for API testing.

| Feature | ReqSploit | Postman |
|---------|-----------|---------|
| **Purpose** | Security testing | API development |
| **Vulnerability Detection** | ✅ Automatic | ❌ Manual only |
| **Interception** | ✅ Real-time | ❌ No |
| **Fuzzing** | ✅ Intruder | ⚠️ Limited |
| **Security Focus** | ✅ Yes | ❌ No |

**Use ReqSploit for**: Security testing, pentesting, bug bounties
**Use Postman for**: API development, functional testing, documentation

---

## Still Have Questions?

### Get Help

- 📖 **Documentation**: [View all docs](../README.md)
- 💬 **Community**: [Discord Server](https://discord.gg/reqsploit)
- 📧 **Email**: support@reqsploit.com
- 🐛 **Bug Report**: [GitHub Issues](https://github.com/reqsploit/reqsploit)
- 💡 **Feature Request**: [Feature Board](https://reqsploit.com/features)

### Support Response Times

| Plan | Response Time |
|------|---------------|
| **FREE** | Community support (1-3 days) |
| **PRO** | Email support (24 hours) |
| **ENTERPRISE** | Priority + Live chat (4 hours) |

---

**Can't find your answer?** [Contact us](mailto:support@reqsploit.com) or [join Discord](https://discord.gg/reqsploit)!
