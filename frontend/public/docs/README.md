# 📘 ReqSploit Documentation

**Version:** 1.0.0
**Last Updated:** November 2025

Welcome to ReqSploit, the AI-powered web security testing platform that revolutionizes penetration testing and bug bounty hunting.

---

## 📚 Table of Contents

### 🚀 Getting Started
- [What is ReqSploit?](#what-is-reqsploit)
- [Installation Guide](./getting-started/installation.md)
- [Quick Start Tutorial](./getting-started/quick-start.md)
- [User Interface Overview](./getting-started/interface.md)

### 🔌 Core Features
- [Chrome Extension & Proxy](./core-features/extension-and-proxy.md)
- [Projects & Organization](./core-features/projects.md)
- [Request Capture & Analysis](./core-features/requests.md)
- [Intercept Mode](./core-features/intercept.md)
- [Repeater](./core-features/repeater.md)
- [Intruder - Fuzzing & Automation](./core-features/intruder.md)
- [Decoder](./core-features/decoder.md)
- [Magic Scan - Sensitive Data Detection](./core-features/magic-scan.md)

### 🤖 AI Features
- [AI Overview](./ai-features/overview.md)
- [Quick Scan vs Deep Scan](./ai-features/quick-deep-scan.md)
- [AI Suggest Tests](./ai-features/suggest-tests.md)
- [AI Payload Generator](./ai-features/payload-generator.md)
- [Dork Generator](./ai-features/dork-generator.md)
- [Attack Chain Generator](./ai-features/attack-chain.md)
- [Token System & Pricing](./ai-features/tokens.md)

### 📖 Tutorials
- [Testing a REST API](./tutorials/testing-rest-api.md)
- [Testing a Web Application](./tutorials/testing-web-app.md)
- [Bug Bounty Workflow](./tutorials/bug-bounty-workflow.md)
- [Penetration Testing Workflow](./tutorials/pentest-workflow.md)

### ⚙️ Advanced
- [Configuration & Settings](./advanced/configuration.md)
- [Keyboard Shortcuts](./advanced/shortcuts.md)
- [API Documentation](./advanced/api.md)
- [Export & Import](./advanced/export-import.md)

### 🛠️ Troubleshooting
- [Common Issues](./troubleshooting/common-issues.md)
- [SSL Certificate Problems](./troubleshooting/ssl-certificate.md)
- [Proxy Issues](./troubleshooting/proxy-issues.md)
- [AI Features Issues](./troubleshooting/ai-issues.md)
- [FAQ](./troubleshooting/faq.md)

### 💎 Best Practices
- [Security Testing Best Practices](./best-practices/security-testing.md)
- [Optimization Tips](./best-practices/optimization.md)
- [Ethical Hacking Guidelines](./best-practices/ethical-hacking.md)

---

## What is ReqSploit?

**ReqSploit** is a modern, AI-powered web security testing platform designed for security professionals, penetration testers, and bug bounty hunters. Built with cutting-edge AI technology (powered by Claude by Anthropic), ReqSploit automates vulnerability detection, generates intelligent test payloads, and provides actionable security insights.

### 🎯 Key Features

#### **Intelligent Proxy & Interception**
- Real-time HTTP/HTTPS traffic capture
- Modify requests before they're sent
- AI-powered analysis during interception
- Advanced filtering and scope management

#### **AI-Powered Security Analysis**
- **Quick Scan**: Rapid vulnerability assessment (~8K tokens, 20-30s)
- **Deep Scan**: Comprehensive security analysis (~16K tokens, 60-90s)
- **Magic Scan**: Automatic sensitive data detection (API keys, secrets, PII)
- Detection of: SQLi, XSS, CSRF, Auth issues, IDOR, and 30+ vulnerability types

#### **Professional Testing Tools**
- **Repeater**: Manual request testing with AI suggestions
- **Intruder**: Automated fuzzing with AI-generated payloads
- **Decoder**: Encode/decode data (Base64, URL, JWT, Hex, etc.)
- **Magic Scan**: Real-time detection of 160+ sensitive data patterns

#### **Advanced AI Features**
- **AI Test Suggestions**: Generate 5-10 security test cases automatically
- **AI Payload Generator**: Create context-aware payloads for 10+ attack categories
- **Dork Generator**: Generate OSINT queries for Google, Shodan, GitHub
- **Attack Chain Generator**: Identify multi-step exploitation paths

### 💪 Why ReqSploit?

| Feature | Burp Suite | ReqSploit |
|---------|------------|-----------|
| **AI-Powered Analysis** | ❌ No | ✅ Yes (Claude) |
| **Real-time Suggestions** | ❌ No | ✅ Yes |
| **Cloud-Based** | ❌ Desktop only | ✅ Access anywhere |
| **Auto Payload Generation** | ⚠️ Limited | ✅ AI-generated |
| **Sensitive Data Detection** | ⚠️ Basic | ✅ 160+ patterns |
| **Attack Chain Discovery** | ❌ Manual | ✅ Automated |
| **Price (Free Plan)** | Limited features | 50K AI tokens/month |

### 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Chrome Extension                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Capture    │  │   Intercept  │  │   Forward    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend Proxy Server                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Request     │  │   Magic      │  │   Database   │      │
│  │  Processing  │  │   Scanner    │  │   Storage    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                     AI Analysis Engine                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Claude AI  │  │   Pattern    │  │   Payload    │      │
│  │   Analyzer   │  │   Matching   │  │   Generator  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   Web Dashboard (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   History    │  │   Repeater   │  │   Intruder   │      │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤      │
│  │  Intercept   │  │   Decoder    │  │ Magic Scan   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 🚀 Quick Example

Here's what ReqSploit can do in 60 seconds:

```bash
# 1. Capture a login request
POST /api/auth/login
{"username": "admin", "password": "test123"}

# 2. Run AI Deep Scan (60 seconds)
✅ Detected: Weak password policy
✅ Detected: Missing rate limiting
✅ Detected: JWT token without expiration
⚠️  Suggested tests: SQL injection, brute force, session hijacking

# 3. Auto-generate test payloads
📝 Generated 50 SQLi payloads
📝 Generated 30 auth bypass payloads
📝 Generated 20 XSS payloads

# 4. Execute in Intruder (automated)
🎯 Found: SQL injection in username field
🎯 Found: Weak password allows brute force
🎯 Found: Session token predictable
```

### 📊 Supported Vulnerability Types

ReqSploit detects and helps exploit 30+ vulnerability categories:

**Injection Attacks**
- SQL Injection (SQLi)
- NoSQL Injection
- Command Injection (OS)
- LDAP Injection
- XPath Injection
- XML External Entity (XXE)
- Server-Side Template Injection (SSTI)

**Web Vulnerabilities**
- Cross-Site Scripting (XSS)
- Cross-Site Request Forgery (CSRF)
- Insecure Direct Object Reference (IDOR)
- Authentication Bypass
- Authorization Issues
- Session Management Flaws

**API Security**
- Broken Object Level Authorization (BOLA)
- Broken Function Level Authorization
- Mass Assignment
- Excessive Data Exposure
- Rate Limiting Issues

**Configuration & Info Disclosure**
- Sensitive Data Exposure (API keys, secrets, credentials)
- Security Misconfiguration
- Information Disclosure
- Debug Information Leakage

...and many more!

---

## 🎓 Learning Path

### Beginner (Week 1)
1. ✅ [Install Extension & Certificate](./getting-started/installation.md)
2. ✅ [Complete Quick Start Tutorial](./getting-started/quick-start.md)
3. ✅ [Learn the Interface](./getting-started/interface.md)
4. ✅ [Capture Your First Request](./core-features/requests.md)
5. ✅ [Run Your First AI Scan](./ai-features/quick-deep-scan.md)

### Intermediate (Week 2-3)
1. ✅ [Master Intercept Mode](./core-features/intercept.md)
2. ✅ [Use Repeater for Manual Testing](./core-features/repeater.md)
3. ✅ [Set Up an Intruder Campaign](./core-features/intruder.md)
4. ✅ [Understand AI Suggestions](./ai-features/suggest-tests.md)
5. ✅ [Test a Real Application](./tutorials/testing-web-app.md)

### Advanced (Week 4+)
1. ✅ [Generate AI Payloads](./ai-features/payload-generator.md)
2. ✅ [Use Dork Generator for OSINT](./ai-features/dork-generator.md)
3. ✅ [Discover Attack Chains](./ai-features/attack-chain.md)
4. ✅ [Optimize Token Usage](./ai-features/tokens.md)
5. ✅ [Master Bug Bounty Workflow](./tutorials/bug-bounty-workflow.md)

---

## 🆘 Need Help?

- 📖 **Documentation**: You're reading it!
- 💬 **Community**: [Discord Server](https://discord.gg/reqsploit)
- 📧 **Email Support**: support@reqsploit.com
- 🐛 **Report Bugs**: [GitHub Issues](https://github.com/reqsploit/reqsploit)

**Support Levels by Plan:**
- **FREE**: Documentation + Community
- **PRO**: Priority email support (24h response)
- **ENTERPRISE**: Dedicated support + Live chat

---

## 📄 License & Legal

ReqSploit is a commercial product designed for **authorized security testing only**.

### ⚖️ Terms of Use
- ✅ **Allowed**: Authorized penetration testing, bug bounty programs, security research
- ❌ **Prohibited**: Unauthorized access, illegal hacking, malicious use

By using ReqSploit, you agree to:
1. Only test systems you have **explicit permission** to test
2. Follow **responsible disclosure** practices
3. Comply with all applicable laws and regulations
4. Respect the [Terms of Service](https://reqsploit.com/terms)

### 🔒 Privacy & Data

- **Your data is yours**: We never access your captured requests
- **AI Processing**: Requests sent to Claude AI are not stored by Anthropic
- **Encryption**: All data encrypted at rest and in transit
- **GDPR Compliant**: Full compliance with data protection regulations

---

## 🎉 Ready to Start?

Choose your path:

<table>
<tr>
<td width="50%">

### 🏃 Quick Start
**Get up and running in 10 minutes**

1. [Install Extension](./getting-started/installation.md)
2. [Configure Certificate](./getting-started/installation.md#ssl-certificate)
3. [Start Capturing Traffic](./getting-started/quick-start.md)
4. [Run Your First Scan](./ai-features/quick-deep-scan.md)

[→ Start Now](./getting-started/installation.md)

</td>
<td width="50%">

### 📚 Full Tutorial
**Complete learning experience**

1. [Understand ReqSploit](./getting-started/interface.md)
2. [Learn Each Feature](./core-features/requests.md)
3. [Master AI Tools](./ai-features/overview.md)
4. [Real-World Examples](./tutorials/testing-rest-api.md)

[→ Learn More](./getting-started/interface.md)

</td>
</tr>
</table>

---

## 🔄 Documentation Updates

This documentation is continuously updated to reflect new features and improvements.

**Latest Changes:**
- **Nov 2025**: Added Magic Scan documentation (160+ sensitive data patterns)
- **Nov 2025**: Updated AI model names (Haiku 4.5, Sonnet 4.5)
- **Nov 2025**: Enhanced AI features section
- **Nov 2025**: Added interactive code examples

**Found an issue?** [Report it](https://github.com/reqsploit/docs/issues) or [contribute](https://github.com/reqsploit/docs/pulls).

---

<div align="center">

**Made with ❤️ by the ReqSploit Team**

[Website](https://reqsploit.com) • [Discord](https://discord.gg/reqsploit) • [Twitter](https://twitter.com/reqsploit) • [GitHub](https://github.com/reqsploit)

</div>
