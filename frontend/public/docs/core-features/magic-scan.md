# 🎣 Magic Scan - Sensitive Data Detection

**Automatic detection of 160+ types of sensitive information in your HTTP traffic**

Magic Scan is ReqSploit's real-time sensitive data scanner that automatically detects API keys, secrets, credentials, PII, and other sensitive information exposed in your requests and responses.

---

## 🎯 What is Magic Scan?

Magic Scan continuously monitors all captured HTTP traffic and automatically flags sensitive data using **160+ intelligent patterns** with smart validation.

### Why Use Magic Scan?

**🔒 Security**: Detect accidentally exposed credentials before attackers do
**🐛 Bug Bounty**: Find sensitive data exposure vulnerabilities worth $$$
**📋 Compliance**: Identify PII leaks for GDPR/CCPA compliance
**⚡ Real-time**: Instant alerts as sensitive data is detected
**🎯 Accurate**: Smart validators reduce false positives (Luhn, JWT, IBAN checks)

---

## 🚀 Getting Started

### Accessing Magic Scan

1. **Navigate to Magic Scan Tab**
   ```
   Dashboard → Center Panel → 🎣 Magic Scan (last tab)
   ```

2. **Automatic Scanning**
   - Magic Scan runs automatically on ALL captured requests
   - No configuration needed
   - Results appear immediately
   - Real-time notifications for CRITICAL/HIGH findings

3. **Check Statistics**
   ```
   Top Bar shows:
   - Total Findings: 142
   - Critical: 5 🔴
   - High: 12 🟠
   - Medium: 45 🟡
   - Low: 80 🟢
   ```

---

## 📊 Understanding Findings

### Finding Card Structure

Each detected item shows:

```
┌─────────────────────────────────────────────────┐
│ 🔴 CRITICAL - AWS Access Key                   │
├─────────────────────────────────────────────────┤
│ Pattern: AKIA****************WXYZ              │
│ Location: Request Headers → Authorization       │
│ Request: POST /api/upload                       │
│ Found in: https://api.example.com              │
│ Confidence: 95%                                 │
│ Created: 2025-11-20 15:30:42                   │
├─────────────────────────────────────────────────┤
│ Description:                                    │
│ AWS Access Key ID detected. This credential    │
│ can be used to access AWS services and should  │
│ never be exposed in HTTP traffic.              │
├─────────────────────────────────────────────────┤
│ [View Request] [Mark Safe] [False Positive] [X]│
└─────────────────────────────────────────────────┘
```

### Severity Levels

| Severity | Color | Description | Examples |
|----------|-------|-------------|----------|
| **CRITICAL** | 🔴 Red | Immediate security risk | AWS keys, private keys, DB passwords |
| **HIGH** | 🟠 Orange | Significant exposure | API tokens, OAuth secrets |
| **MEDIUM** | 🟡 Yellow | Potential information leak | Email addresses, internal IPs |
| **LOW** | 🟢 Green | Minor information disclosure | Public IPs, non-sensitive URLs |

---

## 🔍 What Magic Scan Detects

### 1. API Keys & Service Credentials (50+ patterns)

**Cloud Providers**:
```
✅ AWS Access Keys (AKIA..., ASIA..., AIDA..., AROA...)
✅ AWS Secret Keys (40-character base64)
✅ Google API Keys (AIza...)
✅ Google OAuth Secrets
✅ Azure Subscription Keys
✅ Azure Client Secrets
```

**Payment & Commerce**:
```
✅ Stripe API Keys (sk_live_..., pk_live_...)
✅ Stripe Webhooks Secrets
✅ PayPal Client IDs & Secrets
✅ Square Access Tokens
```

**Communication & Messaging**:
```
✅ Slack Bot Tokens (xoxb-...)
✅ Slack Webhooks URLs
✅ SendGrid API Keys
✅ Mailgun API Keys
✅ Twilio Auth Tokens
✅ Twilio Account SIDs
```

**Development & Version Control**:
```
✅ GitHub Personal Access Tokens (ghp_...)
✅ GitHub OAuth Tokens
✅ GitLab Personal Access Tokens (glpat-...)
✅ Bitbucket App Passwords
```

**AI & Machine Learning**:
```
✅ OpenAI API Keys (sk-...)
✅ Anthropic API Keys (sk-ant-...)
✅ Hugging Face Tokens
```

**Databases & Caching**:
```
✅ MongoDB Connection Strings
✅ PostgreSQL URLs
✅ MySQL Connection Strings
✅ Redis URLs
✅ Firebase Keys
```

**And 30+ more services!**

### 2. Private Keys (6 patterns)

```
✅ RSA Private Keys (-----BEGIN RSA PRIVATE KEY-----)
✅ SSH Private Keys (-----BEGIN OPENSSH PRIVATE KEY-----)
✅ DSA Private Keys
✅ EC Private Keys
✅ PGP Private Keys
✅ PuTTY Private Keys (.ppk format)
```

**Validation**: Checks for proper BEGIN/END markers and key structure

### 3. Database Credentials (9 patterns)

```
✅ MongoDB: mongodb://user:pass@host/db
✅ PostgreSQL: postgresql://user:pass@host/db
✅ MySQL: mysql://user:pass@host/db
✅ Redis: redis://user:pass@host:port
✅ MSSQL: Server=host;Database=db;User=user;Password=pass
✅ Oracle: user/password@host:port/service
✅ SQLite: file paths with .db, .sqlite extensions
✅ Cassandra: contact points with credentials
✅ CouchDB: http://user:pass@host:port/db
```

**Validation**: Checks protocol format and credential presence

### 4. Authentication Tokens (6 patterns)

```
✅ JWT Tokens (eyJ...)
   - Validates JWT structure (header.payload.signature)
   - Decodes and checks expiration
   - Identifies algorithm (HS256, RS256, etc.)

✅ OAuth 2.0 Tokens
   - Bearer tokens
   - Refresh tokens
   - Access tokens

✅ API Tokens (generic patterns)
   - 32+ character hex strings
   - Base64 encoded credentials
   - UUID-format tokens
```

**Validation**: JWT structure validation, length checks, entropy analysis

### 5. Cryptocurrency Wallets (6 patterns)

```
✅ Bitcoin Addresses (1..., 3..., bc1...)
✅ Ethereum Addresses (0x... 40 hex chars)
✅ Ripple Addresses (r... base58)
✅ Litecoin Addresses (L..., M...)
✅ Monero Addresses (4... 95 chars)
✅ Dogecoin Addresses (D...)
```

**Validation**: Address format and checksum validation

### 6. Personal Identifiable Information (10 patterns)

```
✅ Credit Card Numbers
   - Visa, Mastercard, Amex, Discover
   - Luhn algorithm validation
   - Format: 4111-1111-1111-1111

✅ Social Security Numbers (SSN)
   - Format: XXX-XX-XXXX
   - US SSN pattern validation

✅ IBAN Bank Accounts
   - International format
   - Checksum validation (mod 97)
   - Country-specific lengths

✅ Email Addresses
   - RFC 5322 compliant
   - Filters test/example emails

✅ Phone Numbers
   - International format: +1-XXX-XXX-XXXX
   - Various country formats

✅ Passport Numbers
✅ Driver's License Numbers
✅ National IDs
✅ IP Addresses (IPv4, IPv6)
```

**Validation**: Luhn check for credit cards, checksum for IBAN, regex for formats

### 7. Sensitive File Patterns (8 patterns)

```
✅ Private key files (.pem, .key, .p12, .pfx)
✅ Configuration files (.env, .config, credentials.json)
✅ Database dumps (.sql, .dump, .backup)
✅ Certificate files (.crt, .cer, .ca-bundle)
✅ Keystore files (.jks, .keystore)
✅ SSH config files (id_rsa, authorized_keys)
✅ AWS credentials files
✅ Docker secrets
```

### 8. Error & Debug Information (5 patterns)

```
✅ Stack traces (Java, Python, Node.js, PHP)
✅ Debug messages with sensitive data
✅ Internal file paths (/var/www/html/...)
✅ Database error messages
✅ SQL queries in errors
```

---

## 🎨 User Interface

### Main View

```
┌──────────────────────────────────────────────────┐
│  Magic Scan Dashboard                            │
├──────────────────────────────────────────────────┤
│  📊 Stats: Total: 142 | 🔴 5 | 🟠 12 | 🟡 45 | 🟢 80│
├──────────────────────────────────────────────────┤
│  Filters:  [Severity ▼] [Category ▼] [Search 🔍] │
│            [Show Safe ☐]                          │
├──────────────────────────────────────────────────┤
│  Results (50)                  [Load More]        │
│                                                    │
│  🔴 AWS Access Key          Request #12345        │
│  🔴 Private RSA Key         Request #12340        │
│  🟠 JWT Token              Request #12338        │
│  🟠 Stripe API Key         Request #12330        │
│  🟡 Email Address          Request #12325        │
│  ...                                               │
└──────────────────────────────────────────────────┘
```

### Filters

**By Severity**:
```
[All] [Critical] [High] [Medium] [Low]
```

**By Category**:
```
- All Categories
- API Keys
- Private Keys
- Database Credentials
- Authentication Tokens
- Cryptocurrency Wallets
- Personal Information (PII)
- Sensitive Files
- Error/Debug Info
```

**By Search**:
```
Search by:
- Pattern value (partial match)
- Location (headers, body, url)
- Request URL
- Request ID
```

**Other Options**:
```
☑ Include Safe Items (show marked-safe findings)
☐ Auto-scroll (scroll to new findings)
☑ Notifications (show toast for CRITICAL/HIGH)
```

---

## 🎬 Practical Examples

### Example 1: Detecting Exposed AWS Key

**Scenario**: Testing an upload API that accidentally includes AWS credentials

**Request Captured**:
```http
POST /api/upload HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: multipart/form-data

{
  "file": "document.pdf",
  "aws_key": "AKIAIOSFODNN7EXAMPLE",
  "aws_secret": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
}
```

**Magic Scan Detection**:
```
🔴 CRITICAL - AWS Access Key
├─ Pattern: AKIAIOSFODNN7EXAMPLE
├─ Location: Request Body → aws_key
├─ Confidence: 100%
└─ Description: Valid AWS Access Key ID format detected

🔴 CRITICAL - AWS Secret Key
├─ Pattern: wJalrXUt***************PLEKEY
├─ Location: Request Body → aws_secret
├─ Confidence: 100%
└─ Description: Valid AWS Secret Access Key format (40 chars)
```

**Action**:
1. Click [View Request] to see full context
2. Report to bug bounty program: "AWS Credentials Exposed in API"
3. Severity: Critical
4. Impact: Full AWS account compromise

### Example 2: Leaked JWT with No Expiration

**Request**:
```http
GET /api/user/profile HTTP/1.1
Host: app.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTYiLCJyb2xlIjoiYWRtaW4ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**Magic Scan Detection**:
```
🟠 HIGH - JWT Token
├─ Pattern: eyJhbGci***************w5c
├─ Location: Request Headers → Authorization
├─ Confidence: 100%
├─ Decoded Claims:
│   {
│     "userId": "123456",
│     "role": "admin"
│   }
├─ ⚠️ No "exp" (expiration) claim found!
└─ Description: JWT without expiration never expires
```

**Action**:
1. Report: "JWT Tokens Without Expiration"
2. Impact: Stolen tokens valid forever
3. Recommendation: Add "exp" claim to all JWTs

### Example 3: Credit Card in Logs

**Response**:
```http
HTTP/1.1 500 Internal Server Error

{
  "error": "Payment failed",
  "debug_info": {
    "card_number": "4532-1234-5678-9010",
    "stack": "Error at PaymentProcessor.process()..."
  }
}
```

**Magic Scan Detection**:
```
🔴 CRITICAL - Credit Card Number (Visa)
├─ Pattern: 4532-****-****-9010
├─ Location: Response Body → debug_info.card_number
├─ Confidence: 100% (Luhn check passed)
├─ Card Type: Visa
└─ Description: Credit card number exposed in error response
```

**Action**:
1. Report: "PCI DSS Violation - Card Number in Debug Logs"
2. Severity: Critical (PCI compliance issue)
3. Recommendation: Never log full card numbers

### Example 4: Private Key in Config File

**Request**:
```http
GET /.env HTTP/1.1
Host: example.com

# Response:
DB_HOST=localhost
DB_PASS=secret123
AWS_KEY=AKIAI...
PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
-----END RSA PRIVATE KEY-----
```

**Magic Scan Detection**:
```
🔴 CRITICAL - RSA Private Key
├─ Pattern: -----BEGIN RSA PRIVATE KEY-----...
├─ Location: Response Body
├─ Confidence: 100%
├─ Key Size: 2048 bits (estimated)
└─ Description: RSA private key exposed - can decrypt sensitive data
```

**Action**:
1. Report: "Private Keys Exposed via .env File"
2. Severity: Critical
3. Impact: Complete security compromise
4. Recommendation: Never expose .env files publicly

---

## ⚙️ Configuration

### Pattern Management

**View All Patterns**:
```
Settings → Magic Scan → Patterns
```

**Customize Patterns**:
```
- Enable/Disable specific patterns
- Adjust confidence thresholds
- Add custom regex patterns
- Configure severity levels
```

**Example Custom Pattern**:
```javascript
{
  id: 'custom-internal-token',
  category: 'AUTHENTICATION_TOKENS',
  type: 'Internal Auth Token',
  severity: 'HIGH',
  patterns: [
    /INT-TOKEN-[A-Z0-9]{32}/gi
  ],
  enabled: true,
  description: 'Custom internal authentication token',
  maskPattern: (val) => `INT-TOKEN-****${val.slice(-8)}`
}
```

### Notifications

Configure real-time alerts:

```
Settings → Magic Scan → Notifications

☑ Enable Notifications
☑ Critical Findings (popup + sound)
☑ High Findings (popup)
☐ Medium Findings
☐ Low Findings

Notification Duration: 5 seconds
Sound: [Default ▼]
```

### Performance

Magic Scan is highly optimized:

```
✅ Pre-compiled regex patterns (cached)
✅ Hash-based deduplication (no duplicates)
✅ Smart validators reduce false positives
✅ Background processing (non-blocking)
✅ Incremental scanning (only new requests)

Performance Impact: < 2% CPU overhead
```

---

## 🎯 Best Practices

### 1. Review Findings Immediately

```
🔴 CRITICAL/HIGH findings:
- Review within 5 minutes
- Validate if real or false positive
- Report immediately if confirmed

🟡 MEDIUM/LOW findings:
- Review at end of session
- Batch review similar findings
- Mark safe if not relevant
```

### 2. Use Filters Effectively

```
When reviewing API security:
Filter: Category = API_KEYS, Severity = CRITICAL/HIGH

When checking PII compliance:
Filter: Category = PII, Severity = ALL

When analyzing a specific request:
Search: Request ID or URL
```

### 3. Mark False Positives

Help improve accuracy:

```
Example false positive:
🟡 Email Address: test@example.com (in test suite)
Action: Click [False Positive]
Result: Pattern learns to exclude test@example.com
```

### 4. Export Findings for Reports

```
1. Filter relevant findings
2. Click "Export" button
3. Choose format:
   - CSV (for Excel)
   - JSON (for automation)
   - HTML (for reports)
4. Include in bug bounty/pentest report
```

### 5. Integrate with Workflow

```
Typical workflow:
1. Capture traffic normally
2. Check Magic Scan periodically
3. If CRITICAL finding → investigate immediately
4. Run AI Deep Scan on the request
5. Use Repeater to confirm vulnerability
6. Document and report
```

---

## 🐛 Bug Bounty Tips

### High-Value Findings

Magic Scan detects vulnerabilities worth $$$ in bug bounty programs:

**Critical Severity** ($500-$5,000):
- AWS/Cloud credentials exposure
- Private key leakage
- Database connection strings with creds
- Admin API tokens

**High Severity** ($100-$1,000):
- API keys for third-party services
- JWT tokens without expiration
- OAuth secrets in responses

**Medium Severity** ($50-$500):
- Email enumeration via error messages
- Internal IP addresses disclosed
- Debug information leakage

### Reporting Template

```markdown
**Title**: [Service] API Keys Exposed in HTTP Response

**Severity**: Critical

**Description**:
The application exposes [AWS Access Keys] in the HTTP response when [action].
This was detected using automated scanning of HTTP traffic.

**Steps to Reproduce**:
1. Navigate to https://target.com/endpoint
2. Observe the response headers/body
3. [AWS Access Key] is visible: AKIA...

**Impact**:
An attacker can use these credentials to:
- Access AWS services
- Enumerate S3 buckets
- Potential data exfiltration

**Proof of Concept**:
[Screenshot from Magic Scan]
[Request/Response dump]

**Remediation**:
- Remove credentials from HTTP responses
- Use environment variables
- Implement proper secrets management
- Rotate exposed credentials immediately

**CWE**: CWE-200 (Information Exposure)
**CVSS**: 9.1 (Critical)
```

---

## 🔧 Troubleshooting

### No Findings Appearing

**Problem**: Magic Scan shows 0 results
**Solutions**:
1. Check that requests are being captured (History tab)
2. Verify Magic Scan is enabled (Settings → Magic Scan)
3. Check filters - might be hiding results
4. Clear cache and refresh (Ctrl+F5)

### Too Many False Positives

**Problem**: Many findings that aren't real secrets
**Solutions**:
1. Mark items as "False Positive" to improve accuracy
2. Adjust confidence threshold (Settings → Magic Scan)
3. Disable patterns for irrelevant categories
4. Use "Mark Safe" for known test data

### Performance Issues

**Problem**: Dashboard is slow after many findings
**Solutions**:
1. Clear old findings (Magic Scan → Clear All)
2. Enable pagination (Settings → Magic Scan → Results per page: 50)
3. Use filters to reduce displayed results
4. Export and archive old findings

---

## 📊 Statistics

Magic Scan provides insights:

```
Dashboard → Magic Scan → Stats Tab

Detection Rates:
├─ Total Scanned: 15,420 requests
├─ Findings: 342 (2.2% detection rate)
├─ Critical: 12 (0.08%)
├─ High: 45 (0.29%)
├─ Medium: 128 (0.83%)
└─ Low: 157 (1.02%)

Top Categories:
1. API_KEYS: 156 findings
2. AUTHENTICATION_TOKENS: 89 findings
3. PII: 54 findings
4. DATABASE_CREDENTIALS: 23 findings
5. PRIVATE_KEYS: 12 findings

Top Patterns:
1. Email Address: 78 matches
2. JWT Token: 56 matches
3. AWS Access Key: 23 matches
4. GitHub Token: 18 matches
5. IP Address: 45 matches
```

---

## 🚀 Advanced Features

### Real-Time Notifications

Desktop notifications for critical findings:

```javascript
// Example notification
🔴 Critical Finding Detected!

AWS Access Key found in request to api.example.com
Request #12567 | Confidence: 100%

[View Now] [Dismiss]
```

### WebSocket Integration

Magic Scan results stream in real-time via WebSocket:

```javascript
// Listen for new findings
socket.on('scan:result', (finding) => {
  if (finding.severity === 'CRITICAL') {
    showNotification(finding);
    playAlertSound();
  }
});
```

### API Access

Access findings programmatically:

```javascript
// GET /api/scan/results
{
  "results": [
    {
      "id": "abc123",
      "type": "AWS Access Key",
      "severity": "CRITICAL",
      "value": "AKIA****EXAMPLE",
      "location": "headers.authorization",
      "confidence": 100
    }
  ]
}
```

---

## 📚 Related Documentation

- [Quick Start Guide](../getting-started/quick-start.md) - Learn Magic Scan basics
- [AI Deep Scan](../ai-features/quick-deep-scan.md) - Combine with AI analysis
- [Repeater](./repeater.md) - Test discovered credentials
- [Best Practices](../best-practices/security-testing.md) - Responsible disclosure

---

## ❓ FAQ

**Q: Does Magic Scan send my data to external servers?**
A: No. All scanning happens locally in your browser/backend. Your data never leaves your infrastructure.

**Q: Can I add custom patterns?**
A: Yes! Go to Settings → Magic Scan → Custom Patterns

**Q: How accurate is the detection?**
A: Magic Scan uses smart validators (Luhn, JWT decode, IBAN checksum) to achieve >95% accuracy and minimize false positives.

**Q: What should I do if I find credentials?**
A: 1) Verify it's real 2) Report responsibly 3) Recommend rotation 4) Never abuse the credentials

**Q: Can Magic Scan detect encrypted secrets?**
A: No. Magic Scan detects plaintext patterns only. Encrypted/hashed secrets are not detectable.

---

**Questions?** Join our [Discord](https://discord.gg/reqsploit) or email support@reqsploit.com
