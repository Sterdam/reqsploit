# 🤖 AI Features Overview

**Claude-powered security intelligence for automated vulnerability detection and exploitation**

ReqSploit's AI features leverage Anthropic's Claude models to provide intelligent security testing capabilities that go far beyond traditional tools.

---

## 🎯 What Makes ReqSploit's AI Special?

### Traditional Tools vs ReqSploit AI

| Feature | Traditional Tools | ReqSploit AI |
|---------|------------------|--------------|
| **Vulnerability Detection** | Pattern matching | Context-aware AI analysis |
| **False Positives** | High (30-50%) | Low (5-10%) with AI validation |
| **Payload Generation** | Static wordlists | Dynamic, context-aware payloads |
| **Test Suggestions** | Manual | Automatic with reasoning |
| **Attack Chains** | Manual discovery | AI-generated multi-step exploits |
| **Explanation** | None | Detailed "why" and "how" |
| **Learning Curve** | Steep | Guided by AI |

### Core AI Capabilities

```
┌─────────────────────────────────────────────────┐
│          Claude AI Engine (Anthropic)           │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────┐  ┌───────────────────────┐   │
│  │ Quick Scan   │  │ • Fast assessment      │   │
│  │ 8K tokens    │  │ • 20-30 seconds       │   │
│  │ Haiku 4.5    │  │ • Basic vulns         │   │
│  └──────────────┘  └───────────────────────┘   │
│                                                  │
│  ┌──────────────┐  ┌───────────────────────┐   │
│  │ Deep Scan    │  │ • Comprehensive       │   │
│  │ 16K tokens   │  │ • 60-90 seconds       │   │
│  │ Sonnet 4.5   │  │ • Advanced analysis   │   │
│  └──────────────┘  └───────────────────────┘   │
│                                                  │
│  ┌──────────────┐  ┌───────────────────────┐   │
│  │ Test         │  │ • Generate test cases │   │
│  │ Suggestions  │  │ • 5-10 tests          │   │
│  │ 12K tokens   │  │ • Execution ready     │   │
│  └──────────────┘  └───────────────────────┘   │
│                                                  │
│  ┌──────────────┐  ┌───────────────────────┐   │
│  │ Payload      │  │ • Smart fuzzing       │   │
│  │ Generator    │  │ • 10-200 payloads     │   │
│  │ 16K tokens   │  │ • Context-aware       │   │
│  └──────────────┘  └───────────────────────┘   │
│                                                  │
│  ┌──────────────┐  ┌───────────────────────┐   │
│  │ Dork         │  │ • OSINT queries       │   │
│  │ Generator    │  │ • Google/Shodan/Git   │   │
│  │ 14K tokens   │  │ • Intelligence recon  │   │
│  └──────────────┘  └───────────────────────┘   │
│                                                  │
│  ┌──────────────┐  ┌───────────────────────┐   │
│  │ Attack Chain │  │ • Multi-step exploits │   │
│  │ 20-30K tokens│  │ • 3-8 chained steps   │   │
│  │ Sonnet 4.5   │  │ • Full attack paths   │   │
│  └──────────────┘  └───────────────────────┘   │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 🧠 AI Models

ReqSploit uses two Claude models optimized for different use cases:

### Haiku 4.5 (claude-3-5-haiku-20241022)

**Best For**: Quick scans, rapid assessment, real-time analysis

**Characteristics**:
- ⚡ **Speed**: 20-30 seconds per analysis
- 💰 **Cost**: Lower token usage
- 🎯 **Focus**: Common vulnerabilities (SQLi, XSS, Auth issues)
- 📊 **Accuracy**: 85-90% detection rate
- 🔄 **Use Cases**:
  - Initial screening
  - Quick vulnerability checks
  - High-volume testing
  - Real-time interception analysis

**Example Output Quality**:
```json
{
  "vulnerabilities": [
    {
      "type": "SQL Injection",
      "severity": "HIGH",
      "location": "username parameter",
      "evidence": "Error: SQL syntax error",
      "exploitation": ["Try admin' OR '1'='1"],
      "remediation": ["Use prepared statements"]
    }
  ]
}
```

### Sonnet 4.5 (claude-sonnet-4-20250514)

**Best For**: Deep analysis, complex exploits, attack chains

**Characteristics**:
- 🔬 **Depth**: Comprehensive security analysis
- 🧩 **Context**: Full understanding of request/response
- 🎯 **Detection**: 30+ vulnerability types
- 💡 **Insights**: Detailed explanation of findings
- 🔄 **Use Cases**:
  - In-depth security assessment
  - Complex vulnerability chains
  - Business logic flaws
  - Advanced exploitation techniques

**Example Output Quality**:
```json
{
  "vulnerabilities": [
    {
      "type": "SQL Injection",
      "severity": "CRITICAL",
      "confidence": 95,
      "location": "username parameter",
      "evidence": "MySQL error: You have an error in your SQL syntax",
      "exploitation": [
        "Extract database structure: admin' UNION SELECT table_name FROM information_schema.tables--",
        "Dump user credentials: admin' UNION SELECT username,password FROM users--",
        "Bypass authentication: admin'--"
      ],
      "remediation": [
        "Implement parameterized queries",
        "Use ORM with automatic escaping",
        "Apply input validation",
        "Enable WAF rules for SQL injection"
      ],
      "explanation": {
        "why": "Unsanitized user input directly concatenated into SQL query",
        "evidence": ["Error message exposes SQL syntax", "Special characters not escaped"],
        "verificationSteps": ["Try UNION-based injection", "Test time-based blind SQLi"]
      },
      "cwe": "CWE-89",
      "cvss": 9.8,
      "references": ["OWASP A03:2021"]
    }
  ],
  "summary": {
    "totalVulnerabilities": 3,
    "criticalCount": 1,
    "riskScore": 8.5,
    "keyFindings": [
      "Critical SQL injection allows database compromise",
      "Missing authentication on sensitive endpoints",
      "Predictable session tokens"
    ]
  }
}
```

### Model Selection Guide

```
Use Haiku 4.5 when:
✅ You need quick results (screening phase)
✅ Testing many requests in batch
✅ Budget-conscious testing
✅ Real-time interception analysis
✅ You know what you're looking for

Use Sonnet 4.5 when:
✅ Deep security assessment required
✅ Complex business logic testing
✅ Attack chain discovery needed
✅ Detailed remediation guidance wanted
✅ Bug bounty submissions (need solid evidence)
✅ Penetration testing reports
```

---

## 💰 Token System & Pricing

### Understanding Tokens

**What is a Token?**
- Tokens are units of text processing
- ~4 characters = 1 token
- Both input and output count

**Example**:
```
Request (input): "POST /api/login {"username":"admin"}" = ~15 tokens
AI Analysis (output): "SQL Injection detected..." = ~500 tokens
Total: ~515 tokens
```

### Token Allocation by Plan

| Plan | Monthly Tokens | Typical Usage |
|------|----------------|---------------|
| **FREE** | 50,000 | ~6 Deep Scans or ~12 Quick Scans |
| **PRO** | 500,000 | ~60 Deep Scans or ~125 Quick Scans |
| **ENTERPRISE** | Unlimited | No limits |

### Cost per Feature

| Feature | Tokens Used | FREE Plan | PRO Plan |
|---------|-------------|-----------|----------|
| **Quick Scan** | ~8,000 | 6 scans | 62 scans |
| **Deep Scan** | ~16,000 | 3 scans | 31 scans |
| **AI Suggest Tests** | ~12,000 | 4 uses | 41 uses |
| **AI Payloads** | ~16,000 | 3 uses | 31 uses |
| **Dork Generator** | ~14,000 | 3 uses | 35 uses |
| **Attack Chain** | ~25,000 | 2 uses | 20 uses |

### Token Optimization Tips

**1. Use Quick Scan First**
```
❌ Bad: Deep Scan on every request
✅ Good: Quick Scan → Deep Scan only on interesting findings
Savings: 50-70% tokens
```

**2. Batch Similar Requests**
```
❌ Bad: Analyze each login attempt separately
✅ Good: Analyze one representative request
Savings: 80-90% tokens
```

**3. Filter Before AI Analysis**
```
❌ Bad: AI scan on static resources (CSS, images)
✅ Good: Scope filter to APIs and dynamic endpoints only
Savings: 60-80% tokens
```

**4. Leverage AI Suggestions**
```
❌ Bad: Deep Scan → Manual testing → More Deep Scans
✅ Good: Deep Scan → AI Suggest Tests → Execute automatically
Savings: 40-60% tokens (reuses initial analysis)
```

**5. Use Magic Scan First**
```
❌ Bad: AI scan to find API keys
✅ Good: Magic Scan (free) → AI scan for logic issues
Savings: Magic Scan is free, save tokens for complex analysis
```

### Monitoring Token Usage

**Check Current Usage**:
```
Top bar shows: 🪙 Tokens: 45,230 / 50,000 (90% used)
```

**View Usage History**:
```
Settings → Billing → Token Usage
├─ This Month: 45,230 tokens
├─ Quick Scans: 15 × 8K = 120,000
├─ Deep Scans: 8 × 16K = 128,000
├─ AI Payloads: 5 × 16K = 80,000
└─ Reset Date: December 1, 2025
```

---

## 🎯 AI Feature Comparison

### Quick Scan vs Deep Scan

| Aspect | Quick Scan | Deep Scan |
|--------|------------|-----------|
| **Model** | Haiku 4.5 | Sonnet 4.5 |
| **Tokens** | ~8,000 | ~16,000 |
| **Time** | 20-30s | 60-90s |
| **Vulnerability Types** | 10-15 common | 30+ comprehensive |
| **Context Analysis** | Basic | Full (request + response) |
| **Exploitation Depth** | Single step | Multi-step chains |
| **Remediation** | Generic | Detailed + code examples |
| **Confidence Score** | ✅ Yes | ✅ Yes (more accurate) |
| **CVSS Scoring** | ❌ No | ✅ Yes |
| **CWE Mapping** | ❌ No | ✅ Yes |
| **References** | ❌ No | ✅ Yes (OWASP, etc.) |

**When to Use Each**:
```
Quick Scan:
✅ Initial reconnaissance
✅ High-volume testing
✅ Known vulnerability verification
✅ Budget-constrained projects

Deep Scan:
✅ Critical endpoint analysis
✅ Bug bounty submissions
✅ Penetration testing reports
✅ Complex business logic
✅ Compliance audits
```

### AI Suggest Tests vs AI Payload Generator

| Feature | AI Suggest Tests | AI Payload Generator |
|---------|------------------|---------------------|
| **Purpose** | Generate test cases | Generate fuzzing payloads |
| **Location** | Repeater (manual) | Intruder (automated) |
| **Output** | 5-10 complete tests | 10-200 payloads |
| **Includes** | Test description + payload | Payload only |
| **Execution** | One-click or auto | Batch fuzzing campaign |
| **Best For** | Understanding vulnerabilities | Comprehensive testing |

**Example - AI Suggest Tests**:
```
Test: SQL Injection in Login
├─ Description: Test for SQL injection in username field
├─ Payload: admin' OR '1'='1'--
├─ Expected: Successful login or SQL error
├─ Confidence: HIGH
└─ [Execute Test] button
```

**Example - AI Payload Generator**:
```
Category: SQL Injection
├─ admin' OR '1'='1'--
├─ admin' UNION SELECT NULL--
├─ admin'; DROP TABLE users--
├─ admin' AND '1'='2
├─ ... (50+ payloads)
└─ Used in Intruder campaign for automated testing
```

---

## 🚀 Complete AI Workflow

### Example: Testing a Login API

**Step 1: Capture Request**
```http
POST /api/auth/login HTTP/1.1
Content-Type: application/json

{"username": "test", "password": "test123"}
```

**Step 2: Quick Scan (8K tokens, 25s)**
```
Result:
🟡 MEDIUM - Weak Password Policy
🟡 MEDIUM - No Rate Limiting
💡 Suggestion: Test SQL injection in username
```

**Step 3: Send to Repeater**
- Right-click → Send to Repeater

**Step 4: AI Suggest Tests (12K tokens, 35s)**
```
Generated 8 tests:
🔴 SQL Injection: username = admin' OR '1'='1'--
🟠 NoSQL Injection: username = {"$ne": null}
🟡 LDAP Injection: username = *)(uid=*))(|(uid=*
🟢 Parameter Pollution: username=admin&username=test
... (4 more tests)
```

**Step 5: Execute Tests**
- Click "Auto-execute all tests"
- Results appear in history

**Step 6: Found Vulnerability!**
```
SQL Injection CONFIRMED
├─ Payload: admin' OR '1'='1'--
├─ Response: {"success": true, "token": "eyJ..."}
└─ Evidence: Bypassed authentication
```

**Step 7: Deep Scan on Successful Payload (16K tokens, 70s)**
```
CRITICAL - SQL Injection
├─ Type: Authentication Bypass
├─ CVSS: 9.8
├─ CWE: CWE-89
├─ Exploitation:
│   - Bypass login
│   - Extract database
│   - Gain admin access
├─ Remediation:
│   - Use prepared statements
│   - Implement parameterized queries
│   - Add input validation
└─ Code Example:
    // Bad
    query = "SELECT * FROM users WHERE username='" + input + "'"

    // Good
    query = "SELECT * FROM users WHERE username=?"
    stmt.prepare(query)
    stmt.bind(input)
```

**Step 8: Generate Attack Chain (25K tokens, 90s)**
```
Attack Chain: Database Compromise via SQLi

Step 1: SQL Injection in Login
├─ Payload: admin' OR '1'='1'--
└─ Result: Authentication bypass

Step 2: Extract Database Schema
├─ Payload: admin' UNION SELECT table_name FROM information_schema.tables--
└─ Result: tables list obtained

Step 3: Dump User Credentials
├─ Payload: admin' UNION SELECT username,password FROM users--
└─ Result: All credentials extracted

Step 4: Privilege Escalation
├─ Use admin credentials from dump
└─ Result: Full admin access

Impact: Complete database compromise
Severity: CRITICAL
Estimated Time: 5 minutes
Detection Risk: LOW (if careful)
```

**Total Tokens Used**: 8K + 12K + 16K + 25K = 61K tokens
**Total Time**: ~4 minutes
**Result**: Complete security assessment with exploitation path

---

## 🎓 Learning Resources

### Understanding AI Output

**Confidence Scores**:
```
95-100%: Confirmed vulnerability (high confidence)
75-94%: Likely vulnerability (medium confidence)
50-74%: Possible vulnerability (low confidence)
0-49%: Unlikely (informational)
```

**Severity Levels**:
```
CRITICAL (9.0-10.0): Immediate action required
HIGH (7.0-8.9): Fix within 24-48 hours
MEDIUM (4.0-6.9): Fix within 1-2 weeks
LOW (0.1-3.9): Fix when convenient
```

**CWE (Common Weakness Enumeration)**:
```
CWE-89: SQL Injection
CWE-79: Cross-Site Scripting (XSS)
CWE-20: Improper Input Validation
CWE-200: Information Exposure
... (refer to cwe.mitre.org)
```

### Interpreting Results

**Example AI Response**:
```json
{
  "type": "SQL Injection",
  "severity": "CRITICAL",
  "confidence": 95,
  "location": "username parameter",
  "evidence": "MySQL error: You have an error in your SQL syntax",
  "explanation": {
    "why": "User input is directly concatenated into SQL query without sanitization",
    "evidence": [
      "Error message reveals MySQL database",
      "Special characters not escaped",
      "Error occurs when single quote is entered"
    ],
    "verificationSteps": [
      "Try basic injection: admin' OR '1'='1'--",
      "Confirm with UNION attack",
      "Verify with time-based blind SQLi"
    ]
  }
}
```

**How to Read**:
1. **Type**: What vulnerability was found
2. **Severity**: How serious it is (Critical = highest)
3. **Confidence**: How sure the AI is (95% = very confident)
4. **Location**: Where the vulnerability is
5. **Evidence**: Proof it exists
6. **Why**: Root cause explanation
7. **Verification Steps**: How to confirm manually

---

## 🔐 Security & Privacy

### Data Handling

**What AI Sees**:
✅ Request method, URL, headers, body
✅ Response status, headers, body
✅ Your project context (optional)

**What AI Doesn't See**:
❌ Your personal information
❌ Other users' data
❌ Unrelated requests
❌ Your account details

**Data Retention**:
- Request data sent to Claude for analysis
- Anthropic doesn't store requests (per their policy)
- Results stored in your ReqSploit account only
- You can delete anytime

### Responsible Use

**✅ Do**:
- Use on systems you're authorized to test
- Follow responsible disclosure guidelines
- Respect bug bounty program rules
- Test in non-production environments first

**❌ Don't**:
- Test unauthorized systems
- Abuse discovered vulnerabilities
- Share credentials found in tests
- Use for malicious purposes

**Legal Note**: You are responsible for how you use ReqSploit. Only test systems you have explicit permission to test.

---

## 📊 Success Metrics

### Effectiveness

Based on 10,000+ scans by ReqSploit users:

```
Detection Rates:
├─ SQL Injection: 94% detection rate
├─ XSS: 89% detection rate
├─ Auth Issues: 92% detection rate
├─ IDOR: 87% detection rate
└─ Overall: 90% average

False Positive Rate:
├─ Quick Scan: 12% false positives
├─ Deep Scan: 6% false positives
└─ With manual verification: <2%

Time Savings:
├─ Manual Testing: 4-6 hours per endpoint
├─ With AI: 15-30 minutes per endpoint
└─ Efficiency Gain: 85-90% time saved

Bug Bounty Success:
├─ Findings Accepted: 78%
├─ Average Payout: $850
├─ ROI: 15x (PRO plan)
```

---

## 🆘 Getting Help

### Common Questions

**Q: Why did AI miss a vulnerability?**
A: AI is very good but not perfect. Use it as a tool to augment, not replace, manual testing.

**Q: How do I verify AI findings?**
A: Always manually verify before reporting. Use Repeater to confirm exploitability.

**Q: Can I trust AI severity ratings?**
A: Severity is a guideline. Use your judgment based on business context.

**Q: What if I run out of tokens?**
A: Upgrade to PRO ($29/month) or ENTERPRISE (unlimited) plan.

---

## 📚 Next Steps

Explore specific AI features:

1. **[Quick Scan & Deep Scan](./quick-deep-scan.md)** - Vulnerability analysis
2. **[AI Suggest Tests](./suggest-tests.md)** - Automated test generation
3. **[AI Payload Generator](./payload-generator.md)** - Smart fuzzing
4. **[Dork Generator](./dork-generator.md)** - OSINT intelligence
5. **[Attack Chain Generator](./attack-chain.md)** - Multi-step exploits
6. **[Token Management](./tokens.md)** - Optimize usage

---

**Ready to use AI?** → Start with [Quick Start Guide](../getting-started/quick-start.md#step-3-ai-powered-security-analysis) 🚀
