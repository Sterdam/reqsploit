# ⚡ Quick Scan vs Deep Scan - AI-Powered Vulnerability Analysis

**Choose the right AI scan for your testing needs**

ReqSploit offers two AI-powered scanning modes powered by Claude by Anthropic: Quick Scan for rapid assessment and Deep Scan for comprehensive analysis.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Scan](#quick-scan)
3. [Deep Scan](#deep-scan)
4. [Comparison](#comparison)
5. [When to Use Each](#when-to-use-each)
6. [Running Scans](#running-scans)
7. [Understanding Results](#understanding-results)
8. [Token Usage](#token-usage)
9. [Best Practices](#best-practices)

---

## Overview

**AI-Powered Vulnerability Scanning** leverages Claude AI to analyze HTTP requests and responses for security vulnerabilities, configuration issues, and attack vectors.

**Both scan types detect:**
- 💉 Injection vulnerabilities (SQLi, XSS, XXE, SSTI, etc.)
- 🔓 Authentication and authorization issues
- 🎯 Business logic flaws
- 📊 Information disclosure
- ⚙️ Security misconfigurations
- 🌐 API security issues (BOLA, BFLA, Mass Assignment)
- 🔐 Cryptographic weaknesses
- 🚨 OWASP Top 10 vulnerabilities

**Key Differences:**

| Feature | Quick Scan | Deep Scan |
|---------|------------|-----------|
| **AI Model** | Haiku 4.5 | Sonnet 4.5 |
| **Token Usage** | ~8K tokens | ~16K tokens |
| **Speed** | 20-30 seconds | 60-90 seconds |
| **Depth** | Focused analysis | Comprehensive analysis |
| **Best For** | Initial triage, rapid testing | Critical endpoints, thorough review |
| **Cost** | Lower (1 scan ≈ 8K tokens) | Higher (1 scan ≈ 16K tokens) |

---

## Quick Scan

**⚡ Quick Scan** provides rapid vulnerability assessment using Claude Haiku 4.5 for fast, focused security analysis.

### Features

**Speed-Optimized:**
- Analysis completes in 20-30 seconds
- Perfect for rapid iteration during testing
- Minimal token consumption (~8K per scan)

**Focused Detection:**
- Critical vulnerabilities prioritized
- OWASP Top 10 coverage
- Common attack vectors
- Quick wins and obvious issues

**Ideal For:**
- 🔍 Initial reconnaissance
- 🏃 Fast iteration during active testing
- 📊 Large-scale scanning (many endpoints)
- 💰 Token budget consciousness
- ⚡ Bug bounty time-boxing

### What Quick Scan Detects

**High-Priority Vulnerabilities:**
```
✅ SQL Injection (SQLi)
✅ Cross-Site Scripting (XSS)
✅ Authentication bypass
✅ IDOR (Insecure Direct Object Reference)
✅ Sensitive data exposure
✅ Security misconfiguration
✅ Command injection
✅ Path traversal
✅ XXE (XML External Entity)
✅ CSRF (Cross-Site Request Forgery)
```

**Example Output:**
```
┌──────────────────────────────────────────────────┐
│  ⚡ QUICK SCAN RESULTS                           │
│  Endpoint: POST /api/users/update                │
│  Time: 23 seconds | Tokens: 7,842               │
├──────────────────────────────────────────────────┤
│  🚨 CRITICAL (1)                                 │
│  • IDOR: User ID in URL path not validated      │
│    Risk: Any user can modify other users' data  │
│    Test: Change userId from 123 to 456          │
│  ──────────────────────────────────────────────  │
│  🟠 HIGH (2)                                     │
│  • Missing rate limiting on password change     │
│  • Sensitive user data in response              │
│  ──────────────────────────────────────────────  │
│  🟡 MEDIUM (3)                                   │
│  • Weak CORS policy allows any origin           │
│  • Missing security headers (CSP, HSTS)         │
│  • Verbose error messages                       │
│  ──────────────────────────────────────────────  │
│  💡 RECOMMENDATIONS (5)                          │
│  1. Implement object-level authorization        │
│  2. Add rate limiting (5 req/min per user)      │
│  3. Remove sensitive data from responses        │
│  4. Configure strict CORS policy                │
│  5. Implement security headers                  │
└──────────────────────────────────────────────────┘
```

---

## Deep Scan

**🔬 Deep Scan** provides comprehensive vulnerability analysis using Claude Sonnet 4.5 for thorough, expert-level security review.

### Features

**Comprehensive Analysis:**
- Analysis completes in 60-90 seconds
- Expert-level security review
- Higher token consumption (~16K per scan)

**Advanced Detection:**
- All Quick Scan vulnerabilities PLUS:
- Complex business logic flaws
- Advanced injection techniques
- Subtle authorization issues
- Cryptographic weaknesses
- API security best practices
- Attack chain discovery
- Edge cases and race conditions

**Ideal For:**
- 🎯 Critical endpoints (login, payment, admin)
- 🏆 Bug bounty final validation
- 📝 Security audit reports
- 🔐 High-value targets
- 🧪 Complex API testing
- 📊 Comprehensive assessment

### What Deep Scan Detects

**All Quick Scan vulnerabilities PLUS:**
```
✅ Advanced SQLi (time-based, boolean-blind)
✅ Server-Side Template Injection (SSTI)
✅ NoSQL injection
✅ LDAP injection
✅ Business logic vulnerabilities
✅ Race conditions
✅ Mass assignment
✅ Broken function-level authorization (BFLA)
✅ Excessive data exposure
✅ JWT vulnerabilities
✅ OAuth/SAML flaws
✅ GraphQL security issues
✅ WebSocket vulnerabilities
✅ API rate limiting issues
✅ Cryptographic weaknesses
```

**Example Output:**
```
┌──────────────────────────────────────────────────┐
│  🔬 DEEP SCAN RESULTS                            │
│  Endpoint: POST /api/payment/process             │
│  Time: 78 seconds | Tokens: 15,234              │
├──────────────────────────────────────────────────┤
│  🚨 CRITICAL (2)                                 │
│  • Price manipulation via client-side value     │
│    Risk: Purchase items for $0 or negative      │
│    PoC: Change "amount": 99.99 → 0.01           │
│    Impact: $50K+ potential loss                 │
│                                                  │
│  • Race condition in payment processing         │
│    Risk: Double-spending attack possible        │
│    PoC: Send 2 concurrent requests same order   │
│    Impact: Financial loss, inventory issues     │
│  ──────────────────────────────────────────────  │
│  🟠 HIGH (4)                                     │
│  • No idempotency key validation                │
│  • Missing 3D Secure authentication             │
│  • PCI-DSS: Card data in logs                   │
│  • Insufficient transaction validation          │
│  ──────────────────────────────────────────────  │
│  🟡 MEDIUM (5)                                   │
│  • Weak session management                      │
│  • Missing anti-automation measures             │
│  • Verbose error reveals card validation logic  │
│  • No velocity checking                         │
│  • Missing fraud detection                      │
│  ──────────────────────────────────────────────  │
│  💡 ATTACK CHAINS DISCOVERED (2)                │
│                                                  │
│  Chain 1: "Payment Bypass"                      │
│  1. Create account with stolen card             │
│  2. Add items to cart                           │
│  3. Modify price in payment request             │
│  4. Complete purchase for $0.01                 │
│  Impact: Complete payment bypass                │
│                                                  │
│  Chain 2: "Refund Fraud"                        │
│  1. Purchase item legitimately                  │
│  2. Request refund                              │
│  3. Race condition allows double refund         │
│  4. Profit from duplicate refunds               │
│  Impact: Financial loss via refund fraud        │
│  ──────────────────────────────────────────────  │
│  💡 RECOMMENDATIONS (12)                         │
│  1. Implement server-side price validation      │
│  2. Add idempotency keys for payment requests   │
│  3. Implement transaction locking               │
│  4. Add 3D Secure authentication                │
│  5. Remove card data from all logs              │
│  6. Implement velocity checking                 │
│  7. Add fraud detection system                  │
│  8. Strengthen session management               │
│  9. Implement rate limiting                     │
│  10. Add CAPTCHA for payment forms              │
│  11. Validate all payment parameters            │
│  12. Implement comprehensive audit logging      │
└──────────────────────────────────────────────────┘
```

---

## Comparison

### Side-by-Side Comparison

| Aspect | Quick Scan ⚡ | Deep Scan 🔬 |
|--------|--------------|--------------|
| **AI Model** | Claude Haiku 4.5 | Claude Sonnet 4.5 |
| **Intelligence** | Fast & Focused | Expert & Comprehensive |
| **Token Usage** | ~8,000 tokens | ~16,000 tokens |
| **Speed** | 20-30 seconds | 60-90 seconds |
| **Vulnerabilities Found** | 5-15 typical | 10-30 typical |
| **Analysis Depth** | Surface-level + common | Deep + complex |
| **Attack Chains** | Basic sequences | Multi-step exploitation |
| **Business Logic** | Simple flaws | Complex flaws |
| **Recommendations** | 3-8 items | 8-20 items |
| **Report Detail** | Concise | Comprehensive |
| **Best Use Case** | Initial testing | Final validation |
| **Cost (FREE plan)** | 6-7 scans/day | 3 scans/day |

### Detection Capabilities

```
┌─────────────────────────────────────────────────────┐
│  VULNERABILITY COVERAGE                             │
├─────────────────────────────────────────────────────┤
│  Category              Quick  Deep   Example        │
│  ─────────────────────────────────────────────────  │
│  OWASP Top 10          ✅ 95% ✅ 100% SQLi, XSS, XXE │
│  Authentication        ✅ 85% ✅ 100% JWT, OAuth     │
│  Authorization         ✅ 80% ✅ 100% IDOR, BOLA     │
│  Business Logic        ⚠️ 60% ✅ 95%  Price, Race   │
│  API Security          ✅ 75% ✅ 100% REST, GraphQL  │
│  Injection             ✅ 90% ✅ 100% SQL, NoSQL     │
│  Configuration         ✅ 85% ✅ 95%  CORS, Headers  │
│  Crypto                ⚠️ 50% ✅ 90%  Weak algo      │
│  Info Disclosure       ✅ 85% ✅ 100% Errors, Debug  │
│  Complex Attacks       ❌ 30% ✅ 85%  Multi-step     │
└─────────────────────────────────────────────────────┘

Legend:
✅ Excellent coverage (80%+)
⚠️ Good coverage (50-79%)
❌ Limited coverage (<50%)
```

---

## When to Use Each

### Use Quick Scan ⚡ When:

**✅ Initial Reconnaissance**
- First time testing an endpoint
- Mapping attack surface
- Identifying low-hanging fruit

**✅ Rapid Iteration**
- Testing multiple variations quickly
- Bug bounty time-boxing
- Active testing workflow

**✅ Large-Scale Testing**
- Scanning 20+ endpoints
- Automated scanning workflows
- Token budget constraints

**✅ Non-Critical Endpoints**
- Public read-only APIs
- Static content endpoints
- Low-risk functionality

**Example Workflow:**
```
1. Capture 50 requests in HTTP History
2. Run Quick Scan on all endpoints (400K tokens)
3. Identify 10 interesting findings
4. Deep Scan those 10 endpoints (160K tokens)
5. Total: 560K tokens vs. 800K tokens (30% savings)
```

---

### Use Deep Scan 🔬 When:

**✅ Critical Endpoints**
- Authentication and login
- Payment processing
- User data modification
- Admin functionality
- File upload/download

**✅ Final Validation**
- Confirming vulnerability before report
- Creating proof-of-concept
- Security audit deliverables

**✅ Complex Applications**
- Multi-step business logic
- Complex authorization models
- Financial transactions
- Healthcare data (HIPAA)
- PCI-DSS compliance testing

**✅ High-Value Targets**
- Bug bounty critical findings
- Client deliverables
- Regulatory compliance
- Pre-deployment review

**Example Scenario:**
```
Target: E-commerce checkout flow

Quick Scan Results:
- Found 8 medium-severity issues
- Flagged "price" parameter as suspicious

Deep Scan Results:
- Confirmed price manipulation vulnerability
- Discovered race condition in payment
- Found attack chain for payment bypass
- Detailed PoC with step-by-step exploitation

Action: Submit $2,500 bug bounty report
```

---

## Running Scans

### From Request History

**Right-click any request:**
```
┌─────────────────────────────────────┐
│  POST /api/users/update             │
│  ─────────────────────────────────  │
│  Send to Repeater                   │
│  Send to Intruder                   │
│  ⚡ Quick Scan                       │ ← Click
│  🔬 Deep Scan                        │ ← Or this
│  Add Tag                            │
│  Delete                             │
└─────────────────────────────────────┘
```

**Scan starts immediately:**
```
┌─────────────────────────────────────────────────┐
│  🤖 AI SCAN IN PROGRESS                         │
│  Endpoint: POST /api/users/update               │
│  Model: Claude Haiku 4.5                        │
│  Progress: [████████████░░░░░░░] 65%            │
│  Estimated time: 8 seconds remaining            │
│  Tokens used: ~5,200 / ~8,000                   │
│                                                  │
│  Analyzing:                                     │
│  ✅ Request structure                           │
│  ✅ Authentication mechanisms                   │
│  🔄 Authorization checks                        │
│  ⏳ Input validation                            │
│  ⏳ Business logic                              │
│  ⏳ Response analysis                           │
└─────────────────────────────────────────────────┘
```

### From Repeater

**Click AI Scan button:**
```
┌──────────────────────────┐
│  [🚀 Send]               │
│  [⚡ Quick Scan] ← Click │
│  [🔬 Deep Scan]  ← Or    │
│  [💾 Save]               │
└──────────────────────────┘
```

### From Intercept

**While intercepting:**
```
┌─────────────────────────────────────┐
│  ⏸️  INTERCEPTED REQUEST            │
│  POST /api/admin/users              │
│  ...                                │
│                                      │
│  [⚡ Quick Scan] [🔬 Deep Scan]     │
│  [➡️ Forward] [🗑️ Drop]             │
└─────────────────────────────────────┘
```

---

## Understanding Results

### Result Structure

**All scan results include:**

1. **Summary**
   - Vulnerability count by severity
   - Risk score (0-100)
   - Compliance status (OWASP, PCI-DSS, etc.)

2. **Findings**
   - Severity: CRITICAL, HIGH, MEDIUM, LOW, INFO
   - Title and description
   - Risk and impact
   - Proof-of-concept (PoC)
   - Remediation steps

3. **Recommendations**
   - Prioritized action items
   - Implementation guidance
   - Best practices

4. **Attack Chains** (Deep Scan only)
   - Multi-step exploitation paths
   - Combined vulnerability scenarios

### Severity Levels

| Severity | Risk Score | Description | Example |
|----------|-----------|-------------|---------|
| 🚨 **CRITICAL** | 9.0-10.0 | Immediate exploitation, severe impact | SQL injection, RCE, Auth bypass |
| 🟠 **HIGH** | 7.0-8.9 | Easily exploitable, significant impact | IDOR, XSS, Sensitive data exposure |
| 🟡 **MEDIUM** | 4.0-6.9 | Moderate difficulty, moderate impact | CSRF, Security misconfiguration |
| 🔵 **LOW** | 0.1-3.9 | Difficult to exploit, minor impact | Info disclosure, Missing headers |
| ℹ️ **INFO** | 0.0 | No immediate risk, informational | Best practices, Recommendations |

### Risk Score Calculation

**Formula:**
```
Risk Score = (Likelihood × Impact × Exploitability) / 10

Likelihood (0-10):
- How likely is exploitation?
- Are there known exploits?
- Is the vulnerability public?

Impact (0-10):
- What's the potential damage?
- Data breach? Financial loss?
- Reputation damage?

Exploitability (0-10):
- How easy to exploit?
- Authentication required?
- Technical skill needed?
```

**Example:**
```
Vulnerability: Price Manipulation in Checkout

Likelihood: 9/10 (trivial to exploit, no auth needed)
Impact: 9/10 (direct financial loss)
Exploitability: 10/10 (modify single parameter)

Risk Score = (9 × 9 × 10) / 10 = 81 / 10 = 8.1
Severity: HIGH (but close to CRITICAL)
```

---

## Token Usage

### Understanding Token Consumption

**Token usage breakdown:**

**Quick Scan (~8K tokens):**
```
- Request analysis: ~2K tokens
- Security assessment: ~3K tokens
- Recommendations: ~2K tokens
- Response formatting: ~1K tokens
Total: ~8,000 tokens
```

**Deep Scan (~16K tokens):**
```
- Request analysis: ~3K tokens
- Deep security assessment: ~6K tokens
- Attack chain discovery: ~3K tokens
- Detailed recommendations: ~3K tokens
- Response formatting: ~1K tokens
Total: ~16,000 tokens
```

### FREE Plan Token Management

**FREE Plan: 50,000 tokens/month**

**Quick Scan strategy:**
```
50,000 tokens ÷ 8,000 = ~6 Quick Scans/day
Monthly: ~185 Quick Scans
```

**Deep Scan strategy:**
```
50,000 tokens ÷ 16,000 = ~3 Deep Scans/day
Monthly: ~93 Deep Scans
```

**Hybrid strategy (recommended):**
```
Daily:
- 4 Quick Scans (32K tokens)
- 1 Deep Scan (16K tokens)
Total: 48K tokens/day, 2K buffer

Monthly:
- ~120 Quick Scans
- ~30 Deep Scans
```

### Token Optimization Tips

**✅ Maximize your tokens:**

1. **Use Quick Scan first**
   - Identify interesting endpoints
   - Only Deep Scan high-value targets

2. **Batch similar requests**
   - Scan unique endpoints only
   - Skip duplicate patterns

3. **Focus on critical paths**
   - Prioritize auth, payment, admin
   - Skip static content, CDN

4. **Review results carefully**
   - Learn from AI suggestions
   - Apply lessons to manual testing

---

## Best Practices

### 1. Strategic Scanning

```
✅ DO:
- Quick Scan all endpoints initially
- Deep Scan critical functionality
- Use results to guide manual testing

❌ DON'T:
- Deep Scan everything (waste tokens)
- Skip analysis of results
- Ignore recommendations
```

### 2. Result Validation

```
✅ DO:
- Verify findings manually
- Test provided PoCs
- Understand the vulnerability

❌ DON'T:
- Blindly trust AI results
- Report without verification
- Skip remediation steps
```

### 3. Token Management

```
✅ DO:
- Monitor token balance
- Plan scanning strategy
- Save tokens for important targets

❌ DON'T:
- Waste tokens on low-value endpoints
- Scan same endpoint repeatedly
- Ignore token usage patterns
```

### 4. Documentation

```
✅ DO:
- Save scan results
- Document findings
- Export to reports

❌ DON'T:
- Lose track of vulnerabilities
- Forget to save PoCs
- Skip impact assessment
```

---

## Next Steps

Now that you understand Quick vs Deep Scan:

1. ✅ **[Explore AI Features](./overview.md)** - Full AI capabilities guide
2. ✅ **[Learn Token System](./tokens.md)** - Token management and pricing
3. ✅ **[Try AI Payload Generator](./payload-generator.md)** - Custom payload generation
4. ✅ **[Complete Tutorial](../tutorials/testing-rest-api.md)** - Real-world examples

---

**Need Help?** Check the [FAQ](../troubleshooting/faq.md) or [contact support](mailto:support@reqsploit.com).

**Ready to start scanning?** Head to [Request History](../core-features/requests.md) and right-click any request!
