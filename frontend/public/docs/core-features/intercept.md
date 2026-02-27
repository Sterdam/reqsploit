# 🚦 Intercept Mode - Real-Time Request Modification

**Master the art of intercepting and modifying HTTP traffic in real-time**

Intercept Mode is one of ReqSploit's most powerful features, allowing you to catch requests before they're sent, modify them on the fly, and discover vulnerabilities through manual testing.

---

## 📋 Table of Contents

1. [What is Intercept Mode?](#what-is-intercept-mode)
2. [Getting Started](#getting-started)
3. [Intercepting Requests](#intercepting-requests)
4. [Modifying Requests](#modifying-requests)
5. [AI-Powered Suggestions](#ai-powered-suggestions)
6. [Intercept Rules & Scope](#intercept-rules--scope)
7. [Common Testing Scenarios](#common-testing-scenarios)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## What is Intercept Mode?

**Intercept Mode** pauses HTTP/HTTPS requests between your browser and the server, giving you the opportunity to:

- 🔍 **Inspect** requests before they're sent
- ✏️ **Modify** parameters, headers, body content
- 🤖 **Get AI suggestions** for security tests
- 🛡️ **Test authorization** by changing user IDs, roles, tokens
- 💉 **Inject payloads** for vulnerability testing
- 🚫 **Block malicious** or unwanted requests

**Example Use Case:**
```
Original Request:
POST /api/users/update
{"userId": "123", "role": "user"}

Modified Request (privilege escalation test):
POST /api/users/update
{"userId": "123", "role": "admin"}
```

---

## Getting Started

### Enabling Intercept Mode

**Step 1: Navigate to Intercept Tab**
```
Click "🚦 Intercept" in the main navigation
```

**Step 2: Toggle Intercept ON**
```
┌─────────────────────────────────────┐
│  🚦 Intercept: [OFF] → [ON]         │
└─────────────────────────────────────┘
```

**Step 3: Browse Target Site**
- Open your Chrome browser
- Navigate to your target website
- Perform actions (click buttons, submit forms, etc.)

**Step 4: Request Appears**
- First matching request will pause
- Request details appear in intercept panel
- You can now modify before forwarding

### Quick Start Example

**Test scenario:** Check if you can change another user's email

1. Turn intercept **ON**
2. In your browser, go to account settings
3. Change your email to `newemail@test.com`
4. Click "Save"
5. **Request appears in intercept panel:**
   ```
   POST /api/users/456/update
   {"email": "newemail@test.com"}
   ```
6. **Modify the user ID:**
   ```
   POST /api/users/789/update  ← Changed from 456 to 789
   {"email": "newemail@test.com"}
   ```
7. Click **Forward**
8. **Result:** If request succeeds, you found an IDOR vulnerability! 🎯

---

## Intercepting Requests

### Intercept Panel Layout

```
┌─────────────────────────────────────────────────┐
│  🚦 Intercept: [ON] [OFF]                       │
│  Scope: [✓] In-scope only                      │
│  Intercept: [✓] Requests  [ ] Responses        │
├─────────────────────────────────────────────────┤
│  ⏸️  INTERCEPTED REQUEST #47                    │
│                                                  │
│  POST /api/users/123/update HTTP/1.1            │
│  Host: example.com                              │
│  Authorization: Bearer eyJhbGciOiJIUz...        │
│  Content-Type: application/json                 │
│  Content-Length: 45                             │
│                                                  │
│  {"userId": "123", "email": "test@test.com"}    │
│                                                  │
│  [🤖 AI Suggest] [✏️ Edit] [➡️ Forward] [🗑️ Drop]│
└─────────────────────────────────────────────────┘
```

### Control Buttons

| Button | Shortcut | Action |
|--------|----------|--------|
| **➡️ Forward** | `F` | Send request to server as-is or modified |
| **🗑️ Drop** | `D` | Block request from reaching server |
| **✏️ Edit** | `E` | Open request in edit mode |
| **🤖 AI Suggest** | `A` | Get AI-powered modification suggestions |
| **📋 Copy** | `Ctrl+C` | Copy request to clipboard |
| **🔁 Send to Repeater** | `R` | Send to Repeater for further testing |

### Request Queue

When multiple requests arrive:
```
┌─────────────────────────────────────┐
│  Queued: 3 requests                 │
│  ─────────────────────────────────  │
│  1. POST /api/login                 │
│  2. GET /api/user/profile           │
│  3. POST /api/products/buy          │
└─────────────────────────────────────┘
```

**Options:**
- Forward all: Process all queued requests
- Drop all: Block all queued requests
- Forward to here: Forward previous, pause at current

---

## Modifying Requests

### Editing the Request

**Click the Edit button** to enter edit mode:

```
┌─────────────────────────────────────────────────┐
│  ✏️ EDIT MODE                                   │
├─────────────────────────────────────────────────┤
│  POST /api/users/123/update HTTP/1.1            │
│  Host: example.com                              │
│  Authorization: Bearer eyJhbGci...   [✏️ Edit] │
│  Content-Type: application/json                 │
│  Content-Length: 45                [Auto ✓]    │
│                                                  │
│  {                                              │
│    "userId": "123",      ← Click to edit        │
│    "email": "test@test.com",                    │
│    "role": "user"        ← Add new field        │
│  }                                              │
│                                                  │
│  [💾 Save Changes] [↩️ Reset] [➡️ Forward]      │
└─────────────────────────────────────────────────┘
```

### Common Modifications

#### 1. Parameter Tampering

**Original:**
```
POST /api/products/purchase
{"productId": "123", "price": 99.99, "quantity": 1}
```

**Modified (test price manipulation):**
```
POST /api/products/purchase
{"productId": "123", "price": 0.01, "quantity": 1}
```

**What to test:**
- Negative prices: `"price": -99.99`
- Large quantities: `"quantity": 999999`
- Invalid product IDs: `"productId": "../admin"`

---

#### 2. Header Manipulation

**Original:**
```
GET /api/admin/users
Authorization: Bearer user_token_xyz
X-User-Role: user
```

**Modified (test authorization bypass):**
```
GET /api/admin/users
Authorization: Bearer user_token_xyz
X-User-Role: admin    ← Changed from "user" to "admin"
```

**What to test:**
- Role headers: `X-User-Role`, `X-Admin`, `X-Privilege-Level`
- Custom headers: `X-Original-URL`, `X-Forwarded-For`
- Remove security headers: Delete `X-CSRF-Token`

---

#### 3. User ID Modification (IDOR Testing)

**Original:**
```
GET /api/users/456/profile
```

**Modified:**
```
GET /api/users/123/profile   ← Different user ID
```

**What to test:**
- Sequential IDs: `123`, `124`, `125`
- Admin IDs: `1`, `0`, `admin`
- Negative IDs: `-1`, `-999`
- UUIDs: Try different UUID formats

---

#### 4. JSON Injection

**Original:**
```
POST /api/users/create
{"username": "john", "role": "user"}
```

**Modified (test privilege escalation):**
```
POST /api/users/create
{
  "username": "john",
  "role": "user",
  "isAdmin": true,        ← New field
  "permissions": ["*"]    ← New field
}
```

**What to test:**
- Add privileged fields: `isAdmin`, `isSuperuser`, `permissions`
- Array manipulation: `"roles": ["admin", "superuser"]`
- Nested objects: `"settings": {"role": "admin"}`

---

## AI-Powered Suggestions

### Getting AI Suggestions

**Click 🤖 AI Suggest** to get intelligent modification ideas:

```
┌─────────────────────────────────────────────────┐
│  🤖 AI SUGGESTIONS (5)                          │
├─────────────────────────────────────────────────┤
│  1. 🎯 IDOR Test - Change User ID               │
│     Modify: userId "123" → "789"                │
│     Risk: Access other user's data              │
│     [Apply] [Details]                           │
│  ─────────────────────────────────────────────  │
│  2. 🔓 Privilege Escalation                     │
│     Add: "role": "admin"                        │
│     Risk: Gain administrative access            │
│     [Apply] [Details]                           │
│  ─────────────────────────────────────────────  │
│  3. 💉 SQL Injection                            │
│     Modify: email → "' OR '1'='1"               │
│     Risk: Database compromise                   │
│     [Apply] [Details]                           │
│  ─────────────────────────────────────────────  │
│  4. 🌐 XSS Injection                            │
│     Modify: username → "<script>alert(1)</...   │
│     Risk: Client-side code execution            │
│     [Apply] [Details]                           │
│  ─────────────────────────────────────────────  │
│  5. 🔢 Parameter Pollution                      │
│     Add: Second "userId" parameter              │
│     Risk: Logic bypass, unexpected behavior     │
│     [Apply] [Details]                           │
└─────────────────────────────────────────────────┘
```

### AI Suggestion Categories

**🎯 Authorization Tests:**
- IDOR (Insecure Direct Object Reference)
- Privilege escalation
- Role manipulation
- Token tampering

**💉 Injection Tests:**
- SQL Injection
- NoSQL Injection
- Command Injection
- XSS (Cross-Site Scripting)
- XXE (XML External Entity)

**🔓 Authentication Tests:**
- Credential stuffing
- Session hijacking
- JWT manipulation
- Authentication bypass

**🌐 Business Logic Tests:**
- Price manipulation
- Quantity tampering
- Race conditions
- Workflow bypass

---

## Intercept Rules & Scope

### Setting Up Intercept Scope

**Why use scope?** Only intercept requests to your target, ignore everything else.

**Configure Scope:**
1. Click **Scope** button in intercept panel
2. Add target domains:
   ```
   ✅ example.com
   ✅ api.example.com
   ✅ *.example.com  (wildcard)
   ```
3. Enable "In-scope only" checkbox

**Example Configuration:**
```
┌─────────────────────────────────────┐
│  INTERCEPT SCOPE                    │
│                                      │
│  [✓] In-scope only                  │
│                                      │
│  Included:                          │
│  • https://example.com/*            │
│  • https://api.example.com/*        │
│                                      │
│  Excluded:                          │
│  • */static/*                       │
│  • */assets/*                       │
│  • *.jpg, *.png, *.gif              │
│                                      │
│  [Save Scope]                       │
└─────────────────────────────────────┘
```

### Advanced Intercept Rules

**Intercept only specific requests:**

```
┌─────────────────────────────────────┐
│  INTERCEPT RULES                    │
│                                      │
│  Match:                             │
│  [✓] POST requests only             │
│  [✓] Contains: "api/admin"          │
│  [✓] Header: "Authorization"        │
│  [ ] Status: 403, 401               │
│                                      │
│  [Save Rules]                       │
└─────────────────────────────────────┘
```

**Rule Examples:**

| Rule | Use Case |
|------|----------|
| `Method: POST, PUT, DELETE` | Only intercept modifying requests |
| `URL contains: /api/admin` | Only intercept admin API calls |
| `Header exists: Authorization` | Only intercept authenticated requests |
| `Body contains: userId` | Only intercept user-specific requests |

---

## Common Testing Scenarios

### Scenario 1: Testing Authorization (IDOR)

**Goal:** See if you can access other users' data

**Steps:**
1. Turn intercept ON
2. Browse to your profile: `/api/users/456/profile`
3. Intercept the request
4. Change user ID: `456` → `123`
5. Forward request
6. **Check response:**
   - ✅ **200 OK with other user's data** = IDOR vulnerability found! 🎯
   - ❌ **403 Forbidden** = Properly protected

**Report finding:**
```
Vulnerability: Insecure Direct Object Reference (IDOR)
Endpoint: GET /api/users/{id}/profile
Severity: HIGH
Impact: Any authenticated user can access other users' profiles
Proof: Changed userId from 456 to 123, received 200 OK with user 123's data
```

---

### Scenario 2: Testing Privilege Escalation

**Goal:** Try to gain admin access

**Steps:**
1. Turn intercept ON
2. Update your profile with role change
3. Intercept: `POST /api/users/456/update`
4. Original body: `{"email": "test@test.com"}`
5. **Modified body:**
   ```json
   {
     "email": "test@test.com",
     "role": "admin",
     "isAdmin": true
   }
   ```
6. Forward request
7. **Check response and verify:**
   - Log out and log back in
   - Try accessing `/admin` panel
   - If successful = Critical vulnerability! 🚨

---

### Scenario 3: Testing Price Manipulation

**Goal:** Purchase items for $0

**Steps:**
1. Turn intercept ON
2. Add item to cart, proceed to checkout
3. Intercept: `POST /api/checkout`
4. Original: `{"items": [{"id": "123", "price": 99.99, "qty": 1}]}`
5. **Modified:**
   ```json
   {"items": [{"id": "123", "price": 0.01, "qty": 1}]}
   ```
6. Forward and complete purchase
7. **If successful:** Critical business logic vulnerability! 💰

**Also test:**
- Negative prices: `"price": -99.99`
- Remove price field entirely
- Change quantity to 0 or negative

---

### Scenario 4: Testing Authentication Bypass

**Goal:** Access protected endpoints without authentication

**Steps:**
1. Turn intercept ON
2. Access protected page: `/api/admin/users`
3. Intercept the request
4. **Try these header manipulations:**
   ```
   Original:
   Authorization: Bearer invalid_token

   Test 1: Remove header entirely
   (no Authorization header)

   Test 2: Add custom headers
   X-Original-URL: /api/admin/users
   X-Rewrite-URL: /api/admin/users

   Test 3: Change method
   POST → GET

   Test 4: Add bypass headers
   X-Custom-IP-Authorization: 127.0.0.1
   X-Forwarded-For: 127.0.0.1
   ```
5. Forward each test
6. **If any succeed:** Authentication bypass vulnerability! 🔓

---

### Scenario 5: Testing File Upload Restrictions

**Goal:** Upload executable files bypassing filters

**Steps:**
1. Turn intercept ON
2. Upload legitimate file (e.g., image.png)
3. Intercept: `POST /api/upload`
4. **Modify request:**
   ```
   Original:
   Content-Disposition: form-data; name="file"; filename="image.png"
   Content-Type: image/png

   Modified:
   Content-Disposition: form-data; name="file"; filename="shell.php"
   Content-Type: image/png    ← Keep as image

   OR

   Content-Disposition: form-data; name="file"; filename="image.png.php"
   Content-Type: application/x-php
   ```
5. Forward and check if file is accepted
6. **If uploaded:** File upload bypass vulnerability! 📁

---

## Best Practices

### 1. Always Use Scope
```
✅ DO: Set scope to target domain only
❌ DON'T: Intercept all traffic (slows down browsing)
```

### 2. Document Your Tests
```
✅ DO: Take screenshots, save modified requests
❌ DON'T: Forget what you tested
```

### 3. Test Incrementally
```
✅ DO: Change one parameter at a time
❌ DON'T: Change everything at once (hard to identify what worked)
```

### 4. Forward Carefully
```
✅ DO: Review changes before forwarding
❌ DON'T: Forward destructive requests to production
```

### 5. Use Repeater for Complex Tests
```
✅ DO: Send to Repeater for repeated testing
❌ DON'T: Use Intercept for 20+ test variations
```

### 6. Understand Impact
```
✅ DO: Know the consequences of your modifications
❌ DON'T: Send requests that could damage data
```

---

## Troubleshooting

### Intercept Not Catching Requests

**Problem:** Requests pass through without being intercepted

**Solutions:**
1. **Check intercept is ON**
   - Verify toggle shows "ON" (green)

2. **Check scope configuration**
   - Ensure target domain is in scope
   - Disable "In-scope only" temporarily to test

3. **Verify Chrome extension**
   - Extension must be active and connected
   - Check extension icon shows "Connected"

4. **Check intercept rules**
   - Review rules aren't too restrictive
   - Temporarily disable all rules

---

### Can't Modify Request

**Problem:** Edit mode doesn't save changes

**Solutions:**
1. **Check JSON syntax**
   - Invalid JSON won't save
   - Use online JSON validator

2. **Content-Length mismatch**
   - Enable "Auto-update Content-Length"

3. **Browser cached**
   - Close edit mode, reopen

---

### Modified Request Not Working

**Problem:** Modified request returns error

**Solutions:**
1. **Check content type**
   - JSON body needs `Content-Type: application/json`

2. **Check encoding**
   - URL parameters need URL encoding

3. **Check required fields**
   - Don't remove required fields

4. **Verify authentication**
   - Ensure Authorization header is valid

---

## Next Steps

Now that you've mastered Intercept Mode:

1. ✅ **[Learn Repeater](./repeater.md)** - Repeated manual testing
2. ✅ **[Configure Intruder](./intruder.md)** - Automated fuzzing
3. ✅ **[Use AI Features](../ai-features/suggest-tests.md)** - AI-powered test generation
4. ✅ **[Complete REST API Tutorial](../tutorials/testing-rest-api.md)** - Real-world examples

---

**Need Help?** Check the [FAQ](../troubleshooting/faq.md) or [contact support](mailto:support@reqsploit.com).

**Ready for automation?** Learn about [Intruder Mode](./intruder.md) next.
