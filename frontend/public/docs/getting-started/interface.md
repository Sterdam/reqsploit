# 🖥️ User Interface Overview

**Learn the ReqSploit interface in 10 minutes**

This guide walks you through every component of the ReqSploit interface, so you can navigate confidently and work efficiently.

---

## 📋 Table of Contents

1. [Dashboard Layout](#dashboard-layout)
2. [Navigation Tabs](#navigation-tabs)
3. [Projects Panel](#projects-panel)
4. [Request History](#request-history)
5. [Intercept Mode](#intercept-mode)
6. [Repeater](#repeater)
7. [Intruder](#intruder)
8. [Decoder](#decoder)
9. [Magic Scan](#magic-scan)
10. [Keyboard Shortcuts](#keyboard-shortcuts)

---

## Dashboard Layout

The ReqSploit dashboard is organized into clean, intuitive sections:

```
┌─────────────────────────────────────────────────────────┐
│  🎯 ReqSploit          [Projects ▼]    👤 User  ⚙️      │
├─────────────────────────────────────────────────────────┤
│  📊 Requests │ 🚦 Intercept │ 🔁 Repeater │ ⚡ Intruder │
│  🔐 Decoder  │ 🎣 Magic Scan                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│                   Main Content Area                      │
│                                                          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Top Bar Components

**Left Side:**
- **Logo**: Click to return to Requests tab
- **Project Selector**: Switch between projects with dropdown menu

**Right Side:**
- **User Menu**: Account settings, token balance, logout
- **Settings Icon**: Global configuration and preferences

---

## Navigation Tabs

### 📊 Requests (HTTP History)

**Purpose**: View all captured HTTP/HTTPS traffic

**Key Features:**
- Real-time request capture from Chrome extension
- Advanced filtering (method, status, URL, scope)
- Tags and organization system
- AI-powered analysis (Quick Scan, Deep Scan)
- Search and sort capabilities

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  Filters: [Method ▼] [Status ▼] [Search...]    │
├───────────┬─────────┬────────────┬──────────────┤
│  Method   │ Status  │    URL     │    Time      │
├───────────┼─────────┼────────────┼──────────────┤
│  POST     │  200    │ /api/login │  14:32:45    │
│  GET      │  404    │ /admin     │  14:32:46    │
└───────────┴─────────┴────────────┴──────────────┘

┌─────────────────────────────────────────────────┐
│  📋 Request Details                             │
│                                                  │
│  POST /api/login HTTP/1.1                       │
│  Host: example.com                              │
│  Content-Type: application/json                 │
│                                                  │
│  {"username": "admin", "password": "test123"}   │
├─────────────────────────────────────────────────┤
│  📥 Response (200 OK)                           │
│                                                  │
│  {"token": "eyJhbG...", "user": {...}}          │
└─────────────────────────────────────────────────┘
```

**Actions:**
- **Right-click** on any request for context menu:
  - Send to Repeater
  - Send to Intruder
  - Quick Scan (AI)
  - Deep Scan (AI)
  - Add Tag
  - Delete

---

### 🚦 Intercept Mode

**Purpose**: Intercept and modify requests before they're sent

**Key Features:**
- Real-time request interception
- Edit requests on the fly
- AI-powered suggestions during intercept
- Forward, drop, or modify requests
- Intercept rules and scope management

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  🚦 Intercept: [ON] [OFF]                       │
│  Scope: [✓] In-scope only                      │
├─────────────────────────────────────────────────┤
│  ⏸️  INTERCEPTED REQUEST                        │
│                                                  │
│  POST /api/users/update HTTP/1.1                │
│  Host: example.com                              │
│  Authorization: Bearer eyJhbG...                │
│  Content-Type: application/json                 │
│                                                  │
│  {"userId": "123", "role": "user"}              │
│                                                  │
│  [🤖 AI Suggest] [✏️ Edit] [➡️ Forward] [🗑️ Drop] │
└─────────────────────────────────────────────────┘
```

**Workflow:**
1. Toggle intercept **ON**
2. Browse target site in Chrome
3. Request appears in intercept panel
4. Modify parameters, headers, body
5. Click **Forward** to send or **Drop** to block

**Pro Tip**: Use AI Suggest to get intelligent modification ideas (e.g., privilege escalation attempts, parameter tampering).

---

### 🔁 Repeater

**Purpose**: Manually test and replay requests with modifications

**Key Features:**
- Send modified requests repeatedly
- Side-by-side request/response comparison
- AI-generated test suggestions
- Save and organize test cases
- Multiple tabs for parallel testing

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  Tab 1: POST /api/login  [+]                    │
├─────────────────┬───────────────────────────────┤
│  📤 REQUEST     │  📥 RESPONSE                  │
│                 │                                │
│  POST /api/login│  HTTP/1.1 200 OK              │
│  Host: ex.com   │  Content-Type: application... │
│  Content-Type...│                                │
│                 │  {"success": true, ...}        │
│  {"username":   │                                │
│   "admin",      │  [🤖 AI Analysis] [📋 History] │
│   "password":...│                                │
│                 │                                │
│  [🚀 Send]      │  Status: 200 | Time: 234ms    │
│  [🤖 AI Tests]  │  Size: 1.2 KB                 │
└─────────────────┴───────────────────────────────┘
```

**Common Use Cases:**
- **Authentication Testing**: Try different credentials, tokens, session IDs
- **Parameter Fuzzing**: Modify values to test input validation
- **Authorization Testing**: Change user IDs, roles, permissions
- **Injection Testing**: Insert SQLi, XSS, command injection payloads

---

### ⚡ Intruder (Automated Fuzzing)

**Purpose**: Automated fuzzing and payload injection for vulnerability discovery

**Key Features:**
- Position markers for injection points
- Built-in payload lists (SQLi, XSS, LFI, etc.)
- AI-generated context-aware payloads
- Attack types: Sniper, Battering Ram, Pitchfork, Cluster Bomb
- Real-time results with pattern matching

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  🎯 Target: POST /api/login                     │
│  Attack Type: [Sniper ▼]  [▶️ Start Attack]     │
├─────────────────────────────────────────────────┤
│  📝 POSITIONS                                    │
│                                                  │
│  POST /api/login HTTP/1.1                       │
│  Host: example.com                              │
│  Content-Type: application/json                 │
│                                                  │
│  {"username": "§admin§",                        │
│   "password": "§password123§"}                  │
│                                                  │
│  [🤖 AI Generate Payloads]                      │
├─────────────────────────────────────────────────┤
│  💣 PAYLOADS                                     │
│                                                  │
│  Position 1 (username):                         │
│  [✓] SQLi Payloads (250)                        │
│  [✓] Admin Usernames (50)                       │
│  [ ] Custom List                                │
│                                                  │
│  Position 2 (password):                         │
│  [✓] Common Passwords (1000)                    │
│  [✓] AI-Generated (150)                         │
├─────────────────────────────────────────────────┤
│  📊 RESULTS (523 requests)                      │
│                                                  │
│  Payload     Status  Length  Time  Notes        │
│  ─────────────────────────────────────────────  │
│  admin       200     1234    120   ⚠️ Different │
│  ' OR '1'='1 500     89      145   🚨 Error     │
│  test        401     234     98    ❌ Failed    │
└─────────────────────────────────────────────────┘
```

**Attack Types:**

1. **Sniper**: One payload set, one position at a time
   - Use for: Testing single parameters systematically
   - Example: Fuzzing one input field

2. **Battering Ram**: Same payload in all positions simultaneously
   - Use for: Testing same value across multiple fields
   - Example: Username enumeration across multiple endpoints

3. **Pitchfork**: Multiple payload sets, parallel iteration
   - Use for: Testing paired values (username + password lists)
   - Example: Credential stuffing attacks

4. **Cluster Bomb**: All combinations of all payload sets
   - Use for: Exhaustive testing (warning: can generate many requests!)
   - Example: Brute force with all username/password combinations

---

### 🔐 Decoder

**Purpose**: Encode, decode, and analyze data in multiple formats

**Key Features:**
- Real-time encoding/decoding
- Multiple formats: Base64, URL, HTML, Hex, JWT, Hash
- Smart detection of encoding types
- JWT token parsing and analysis
- Hash identification (MD5, SHA1, SHA256, etc.)

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  🔐 DECODER                                      │
├─────────────────────────────────────────────────┤
│  📝 INPUT                                        │
│  ┌───────────────────────────────────────────┐  │
│  │ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  │  │
│  │                                            │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  🔍 Detected: JWT Token, Base64                 │
│                                                  │
│  [Base64 ▼] [Decode ⬇️] [Encode ⬆️]             │
├─────────────────────────────────────────────────┤
│  📤 OUTPUT                                       │
│  ┌───────────────────────────────────────────┐  │
│  │ {                                          │  │
│  │   "alg": "HS256",                          │  │
│  │   "typ": "JWT"                             │  │
│  │ }                                          │  │
│  │ {                                          │  │
│  │   "userId": "123",                         │  │
│  │   "role": "admin",                         │  │
│  │   "exp": 1234567890                        │  │
│  │ }                                          │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  💡 JWT Info:                                   │
│  - Algorithm: HS256 (HMAC SHA-256)              │
│  - Expires: 2025-11-20 14:30:00 (⚠️ expired)    │
│  - Payload: 3 claims                            │
└─────────────────────────────────────────────────┘
```

**Supported Formats:**
- **Base64**: Encode/decode Base64 strings
- **URL**: URL encoding/decoding
- **HTML**: HTML entity encoding/decoding
- **Hex**: Hexadecimal encoding/decoding
- **JWT**: Parse and analyze JWT tokens
- **Hash**: Identify hash types (MD5, SHA1, SHA256, bcrypt, etc.)

**Smart Detection**: Decoder automatically detects encoding type and suggests appropriate decoding.

---

### 🎣 Magic Scan

**Purpose**: Automatic detection of sensitive data in captured requests and responses

**Key Features:**
- Real-time scanning of all HTTP traffic
- 160+ sensitive data patterns detected
- Instant notifications for critical findings
- Advanced filtering and search
- Export findings for reporting

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  🎣 MAGIC SCAN                                   │
│                                                  │
│  📊 Statistics                                   │
│  ┌──────────┬──────────┬──────────┬──────────┐  │
│  │ 🔴 CRIT  │ 🟠 HIGH  │ 🟡 MED   │ 🔵 LOW   │  │
│  │    15    │    42    │    89    │   156    │  │
│  └──────────┴──────────┴──────────┴──────────┘  │
│                                                  │
│  Filters: [Severity ▼] [Category ▼] [Search...] │
├─────────────────────────────────────────────────┤
│  🚨 CRITICAL FINDINGS                            │
│                                                  │
│  🔑 AWS Access Key (Exposed)                    │
│  Found in: GET /config.json                     │
│  Value: AKIA***************QWER                 │
│  Location: Response body, line 12               │
│  Risk: Complete AWS account compromise          │
│  [📋 Copy] [🔍 Details] [✅ Mark Safe]          │
│  ─────────────────────────────────────────────  │
│  💳 Credit Card Number (Valid)                  │
│  Found in: POST /api/payment                    │
│  Value: 4532-****-****-1234                     │
│  Location: Request body                         │
│  Risk: PCI-DSS compliance violation             │
│  [📋 Copy] [🔍 Details] [✅ Mark Safe]          │
│  ─────────────────────────────────────────────  │
│  🔐 Private SSH Key                             │
│  Found in: GET /backup/keys.txt                 │
│  Value: -----BEGIN PRIVATE KEY-----             │
│  Location: Response body                        │
│  Risk: Unauthorized server access               │
│  [📋 Copy] [🔍 Details] [✅ Mark Safe]          │
└─────────────────────────────────────────────────┘
```

**Categories of Findings:**
- 🔑 API Keys & Secrets (AWS, Google, Stripe, etc.)
- 💳 Payment Information (Credit cards, IBANs, etc.)
- 🔐 Authentication (Passwords, tokens, private keys)
- 👤 Personal Information (SSNs, passports, emails)
- 🏢 Corporate Data (Internal IPs, database URLs)
- 🔧 Infrastructure (Database credentials, config files)

**Severity Levels:**
- **🔴 CRITICAL**: Immediate security risk (API keys, credentials, private keys)
- **🟠 HIGH**: Significant risk (PII, payment data, internal URLs)
- **🟡 MEDIUM**: Moderate risk (emails, phone numbers, tokens)
- **🔵 LOW**: Informational (public data, test values)

---

## Projects Panel

**Purpose**: Organize your security testing work into separate projects

**Access**: Click project dropdown in top-left corner

**Features:**
- Create unlimited projects (FREE plan: 5, PRO: unlimited)
- Switch between projects instantly
- Each project has isolated data:
  - Captured requests
  - Scan results
  - Tags and filters
  - Repeater tabs
  - Intruder campaigns

**Creating a Project:**
```
1. Click project dropdown
2. Select "+ New Project"
3. Enter project name (e.g., "example.com - Bug Bounty")
4. Click "Create"
5. All new captures go to this project
```

**Best Practices:**
- One project per target domain/application
- Use descriptive names with dates
- Archive completed projects
- Export findings before deleting

---

## Request History

**Purpose**: Browse and analyze all captured HTTP/HTTPS traffic

**Key Components:**

### Filters Bar
```
┌─────────────────────────────────────────────────┐
│  [GET ▼] [200 ▼] [🏷️ Tags] [🔍 Search...]      │
│  [✓] In Scope Only  [✓] Show Only HTTPS        │
└─────────────────────────────────────────────────┘
```

**Available Filters:**
- **Method**: GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD
- **Status**: 200, 301, 302, 400, 401, 403, 404, 500, etc.
- **Tags**: Custom tags you've created
- **Scope**: In-scope vs. out-of-scope requests
- **Protocol**: HTTP vs. HTTPS
- **Search**: URL, headers, body content

### Request Table

| Column | Description | Sortable |
|--------|-------------|----------|
| **Method** | HTTP method (GET, POST, etc.) | ✅ |
| **Status** | Response status code | ✅ |
| **URL** | Full request URL | ✅ |
| **Time** | Timestamp of request | ✅ |
| **Size** | Response size in bytes | ✅ |
| **Duration** | Request duration in ms | ✅ |
| **Tags** | Applied tags | ❌ |

**Click on any row** to view full request/response details in bottom panel.

---

## Keyboard Shortcuts

Work faster with these keyboard shortcuts:

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Quick search across all requests |
| `Ctrl/Cmd + N` | New project |
| `Ctrl/Cmd + T` | New Repeater tab |
| `Ctrl/Cmd + W` | Close current tab |
| `Ctrl/Cmd + 1-6` | Switch between main tabs |
| `Ctrl/Cmd + /` | Toggle keyboard shortcuts help |

### Request History

| Shortcut | Action |
|----------|--------|
| `↑` / `↓` | Navigate requests |
| `Enter` | View selected request details |
| `Ctrl/Cmd + F` | Focus search box |
| `Ctrl/Cmd + R` | Send to Repeater |
| `Ctrl/Cmd + I` | Send to Intruder |
| `Ctrl/Cmd + D` | Delete selected request |
| `T` | Add tag to selected request |

### Intercept Mode

| Shortcut | Action |
|----------|--------|
| `Space` | Toggle intercept on/off |
| `F` | Forward request |
| `D` | Drop request |
| `A` | AI suggest modifications |
| `E` | Edit request |

### Repeater

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Enter` | Send request |
| `Ctrl/Cmd + Shift + A` | AI suggest tests |
| `Ctrl/Cmd + H` | View request history |
| `Ctrl/Cmd + S` | Save current request |

### Intruder

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Enter` | Start attack |
| `Esc` | Stop attack |
| `Ctrl/Cmd + A` | AI generate payloads |
| `Ctrl/Cmd + P` | Add position marker |
| `Ctrl/Cmd + Shift + P` | Clear all positions |

---

## Status Indicators

Understand the visual feedback ReqSploit provides:

### Connection Status

| Icon | Meaning |
|------|---------|
| 🟢 | Connected to backend and extension |
| 🟡 | Connecting or reconnecting |
| 🔴 | Disconnected - check connection |
| ⚡ | High traffic volume detected |

### Request Status

| Color | Meaning |
|-------|---------|
| 🟢 Green | Successful (2xx status codes) |
| 🔵 Blue | Redirect (3xx status codes) |
| 🟡 Yellow | Client error (4xx status codes) |
| 🔴 Red | Server error (5xx status codes) |
| ⚫ Gray | No response or timeout |

### AI Status

| Icon | Meaning |
|------|---------|
| 🤖 | AI analysis available |
| ⏳ | AI analysis in progress |
| ✅ | AI analysis complete |
| ❌ | AI analysis failed |
| 💰 | Insufficient tokens |

---

## Dark Mode

ReqSploit features a modern dark mode optimized for long testing sessions:

**Toggle Dark Mode:**
1. Click settings icon (⚙️) in top-right
2. Select "Appearance"
3. Choose Light, Dark, or System Default

**Dark Mode Benefits:**
- Reduced eye strain during long sessions
- Better contrast for code and data
- Professional appearance
- Lower power consumption on OLED screens

---

## Next Steps

Now that you understand the interface:

1. ✅ **[Complete Quick Start Tutorial](./quick-start.md)** - Hands-on learning
2. ✅ **[Learn Intercept Mode](../core-features/intercept.md)** - Real-time request modification
3. ✅ **[Master Repeater](../core-features/repeater.md)** - Manual testing techniques
4. ✅ **[Configure Intruder](../core-features/intruder.md)** - Automated fuzzing campaigns
5. ✅ **[Explore AI Features](../ai-features/overview.md)** - AI-powered testing

---

## Tips for Efficiency

**Workspace Organization:**
- Keep Repeater tabs labeled clearly
- Use tags to organize related requests
- Create separate projects for different targets
- Archive old projects regularly

**Performance Optimization:**
- Filter requests to reduce visual clutter
- Clear old requests periodically
- Use scope to focus on target domain
- Close unused Repeater/Intruder tabs

**Professional Workflow:**
- Always start with project creation
- Use descriptive names for everything
- Document findings with tags and notes
- Export results before closing project

---

**Need Help?** Check the [FAQ](../troubleshooting/faq.md) or [contact support](mailto:support@reqsploit.com).

**Ready to test?** Start with the [Quick Start Tutorial](./quick-start.md).
