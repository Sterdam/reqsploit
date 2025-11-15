# 🎯 ReqSploit → Burp Suite Features - Implementation Roadmap

> Transformation progressive en outil de pentest professionnel

---

## 🏗️ Phase 1: Request Interception & Modification (CRITICAL)

**Objectif**: Permettre d'intercepter, modifier et contrôler les requêtes HTTP/HTTPS avant envoi

### 1.1 Backend: Request Queue System
**Fichier**: `/backend/src/core/proxy/request-queue.ts` (nouveau)

**Features**:
- Hold requests when intercept mode enabled
- Timeout mechanism (auto-forward after 60s)
- Thread-safe queue management
- Event emission for queue changes

**API**:
```typescript
class RequestQueue {
  hold(request: PendingRequest): Promise<void>
  forward(requestId: string, modifications?: RequestModification): Promise<void>
  drop(requestId: string): void
  getQueue(): PendingRequest[]
  clearQueue(): void
}
```

### 1.2 Backend: MITM Proxy Enhancement
**Fichier**: `/backend/src/core/proxy/mitm-proxy.ts` (modification)

**Changes**:
- Line ~150: Add queue check before auto-forward
- Integrate RequestQueue
- Emit `request:held` event to WebSocket
- Apply modifications before forwarding

### 1.3 Backend: WebSocket Handlers
**Fichier**: `/backend/src/core/websocket/ws-server.ts` (modification)

**Implement**:
- `request:forward` → Remove from queue, send to target
- `request:drop` → Remove from queue, return 403
- `request:modify` → Apply changes, forward to target
- `request:get-queue` → Return current queue state

### 1.4 Frontend: Intercept Store
**Fichier**: `/frontend/src/stores/interceptStore.ts` (nouveau)

**State**:
```typescript
{
  queuedRequests: PendingRequest[]
  selectedRequest: PendingRequest | null
  isEditing: boolean
  editedRequest: EditableRequest | null
}
```

**Actions**:
- `forwardRequest(id, modifications?)`
- `dropRequest(id)`
- `startEdit(id)`
- `saveEdit(modifications)`
- `cancelEdit()`

### 1.5 Frontend: InterceptPanel Component
**Fichier**: `/frontend/src/components/InterceptPanel.tsx` (nouveau)

**UI Layout**:
```
┌─────────────────────────────────────────────┐
│  Intercept: [ON] [OFF]    Queue: 3 requests │
├─────────────────────────────────────────────┤
│ Queue List (left 30%)                       │
│ ┌─────────────────┐                         │
│ │ GET /api/users  │  Selected Request       │
│ │ POST /login     │  ┌──────────────────┐   │
│ │ GET /data       │  │ Method: [POST ▼] │   │
│ └─────────────────┘  │ URL: [/login    ]│   │
│                      │ Headers:         │   │
│                      │  Content-Type:   │   │
│                      │  [application/json]  │
│                      │ Body:            │   │
│                      │  {              │   │
│                      │    "user": "..." │   │
│                      │  }              │   │
│                      └──────────────────┘   │
│                                             │
│ [Forward] [Drop] [Modify & Forward]        │
└─────────────────────────────────────────────┘
```

**Features**:
- Real-time queue updates via WebSocket
- Syntax highlighting for JSON/XML
- Header editor (add/remove/edit)
- Method selector dropdown
- URL editor with validation
- Action buttons with keyboard shortcuts

### 1.6 Frontend: Dashboard Integration
**Fichier**: `/frontend/src/pages/Dashboard.tsx` (modification)

**Changes**:
- Add InterceptPanel tab alongside Requests, Projects, AI
- Badge showing queue count
- Keyboard shortcut: `Ctrl+I` to toggle intercept

---

## 🔁 Phase 2: Repeater (HIGH PRIORITY)

**Objectif**: Renvoyer des requêtes modifiées manuellement

### 2.1 Backend: Repeater Service
**Fichier**: `/backend/src/services/repeater.service.ts` (nouveau)

**Features**:
- Fetch original request from DB
- Apply user modifications
- Execute HTTP request (bypass proxy)
- Measure response time
- Store in `repeater_requests` table

### 2.2 Backend: Repeater Routes
**Fichier**: `/backend/src/routes/repeater.routes.ts` (nouveau)

**Endpoints**:
- `POST /api/repeater/send` - Send modified request
- `GET /api/repeater/history` - Get send history
- `POST /api/repeater/save-template` - Save request template
- `GET /api/repeater/templates` - List templates
- `DELETE /api/repeater/templates/:id` - Delete template

### 2.3 Frontend: Repeater Store
**Fichier**: `/frontend/src/stores/repeaterStore.ts` (nouveau)

**State**:
- Open tabs (multi-tab support)
- Request templates
- Send history per tab
- Loading states

### 2.4 Frontend: RepeaterTab Component
**Fichier**: `/frontend/src/components/RepeaterTab.tsx` (nouveau)

**UI Layout**:
```
┌───────────────────────────────────────────┐
│ Tab 1 | Tab 2 | [+]                       │
├───────────────────────────────────────────┤
│ Request Editor (50%)  │ Response (50%)    │
│ ┌──────────────────┐  │ ┌──────────────┐  │
│ │ POST /api/login  │  │ │ Status: 200  │  │
│ │                  │  │ │ Time: 145ms  │  │
│ │ Headers:         │  │ │              │  │
│ │  Content-Type:   │  │ │ Response:    │  │
│ │  application/json│  │ │ {            │  │
│ │                  │  │ │   "token":   │  │
│ │ Body:            │  │ │   "..."      │  │
│ │  {...}           │  │ │ }            │  │
│ └──────────────────┘  │ └──────────────┘  │
│                       │                   │
│ [Send] [Save Template]│ [Copy] [Compare] │
└───────────────────────────────────────────┘
│ History (bottom 20%)                      │
│ ┌──────────────────────────────────────┐  │
│ │ #1  200  145ms  POST /api/login      │  │
│ │ #2  401  89ms   POST /api/login      │  │
│ └──────────────────────────────────────┘  │
└───────────────────────────────────────────┘
```

**Features**:
- Monaco Editor for syntax highlighting
- Multiple tabs (like browser tabs)
- History sidebar with diff comparison
- Template management
- Export request as curl/Python/Node.js

### 2.5 Frontend: Context Menu Integration
**Fichier**: `/frontend/src/components/RequestList.tsx` (modification)

**Add**:
- Right-click menu on requests
- "Send to Repeater" option
- Opens new Repeater tab with request data

---

## 🔧 Phase 3: Decoder Utilities (MEDIUM PRIORITY)

**Objectif**: Encoder/décoder/hasher des données

### 3.1 Backend: Decoder Service
**Fichier**: `/backend/src/services/decoder.service.ts` (nouveau)

**Features**:
- URL encode/decode
- Base64 encode/decode
- HTML entity encode/decode
- Hex/Unicode conversion
- Hash: MD5, SHA1, SHA256, SHA512
- Auto-detection for decoding

### 3.2 Backend: Decoder Routes
**Fichier**: `/backend/src/routes/decoder.routes.ts` (nouveau)

**Endpoints**:
- `POST /api/decoder/encode` - Encode text
- `POST /api/decoder/decode` - Decode text (auto-detect)
- `POST /api/decoder/hash` - Hash text

### 3.3 Frontend: Decoder Panel
**Fichier**: `/frontend/src/components/DecoderPanel.tsx` (nouveau)

**UI Layout**:
```
┌─────────────────────────────────────────┐
│ Decoder / Encoder                       │
├─────────────────────────────────────────┤
│ Input:                                  │
│ ┌─────────────────────────────────────┐ │
│ │ Hello World!                        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Format: [URL Encode ▼]  [Encode ↓]     │
│                                         │
│ Output:                                 │
│ ┌─────────────────────────────────────┐ │
│ │ Hello%20World%21                    │ │
│ └─────────────────────────────────────┘ │
│                         [Copy] [Chain] │
├─────────────────────────────────────────┤
│ Quick Actions:                          │
│ [URL] [Base64] [HTML] [Hex] [MD5]      │
└─────────────────────────────────────────┘
```

**Features**:
- Real-time encoding/decoding
- Chain multiple operations
- Copy to clipboard
- History of operations
- Smart detection (auto-detect encoding)

### 3.4 Frontend: Inline Decoder
**Fichier**: `/frontend/src/components/RequestViewer.tsx` (modification)

**Add**:
- Select text in request/response
- Right-click → "Decode selection"
- Inline decoding hint (e.g., "Looks like Base64")

---

## 💥 Phase 4: Intruder/Fuzzing (COMPLEX)

**Objectif**: Fuzzing automatisé avec payloads

### 4.1 Backend: Payload Engine
**Fichier**: `/backend/src/core/fuzzing/payload-engine.ts` (nouveau)

**Payload Types**:
- **Lists**: Custom wordlists
- **Numbers**: Range (1-100, step 1)
- **SQLi**: Common SQL injection payloads
- **XSS**: XSS test vectors
- **LFI/RFI**: Path traversal
- **Command Injection**: OS command payloads
- **Custom**: User-defined payloads

### 4.2 Backend: Campaign Manager
**Fichier**: `/backend/src/core/fuzzing/campaign-manager.ts` (nouveau)

**Features**:
- Create fuzzing campaign from template request
- Define payload positions (§marker§)
- Assign payload sets to positions
- Execute with concurrency control
- Progress tracking via WebSocket
- Pause/Resume/Stop controls
- Result storage and analysis

### 4.3 Backend: Fuzzing Routes
**Fichier**: `/backend/src/routes/fuzzing.routes.ts` (nouveau)

**Endpoints**:
- `POST /api/intruder/campaigns` - Create campaign
- `GET /api/intruder/campaigns` - List campaigns
- `GET /api/intruder/campaigns/:id` - Get campaign details
- `POST /api/intruder/campaigns/:id/start` - Start campaign
- `POST /api/intruder/campaigns/:id/pause` - Pause campaign
- `POST /api/intruder/campaigns/:id/stop` - Stop campaign
- `GET /api/intruder/campaigns/:id/results` - Get results
- `DELETE /api/intruder/campaigns/:id` - Delete campaign

### 4.4 Backend: Database Schema
**Fichier**: `/backend/prisma/schema.prisma` (modification)

**Add Models**:
```prisma
model FuzzingCampaign {
  id                String   @id @default(uuid())
  userId            String
  name              String
  requestTemplate   Json     // Original request
  payloadPositions  Json     // Marker positions
  payloadSets       Json     // Payload assignments
  concurrency       Int      @default(5)
  status            String   // running|paused|completed
  totalRequests     Int      @default(0)
  completedRequests Int      @default(0)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user    User            @relation(fields: [userId], references: [id])
  results FuzzingResult[]
  @@map("fuzzing_campaigns")
}

model FuzzingResult {
  id             String   @id @default(uuid())
  campaignId     String
  payload        String   @db.Text
  statusCode     Int?
  responseLength Int?
  responseTime   Int?     // milliseconds
  timestamp      DateTime @default(now())

  campaign FuzzingCampaign @relation(fields: [campaignId], references: [id])
  @@map("fuzzing_results")
}
```

### 4.5 Frontend: Intruder Panel
**Fichier**: `/frontend/src/components/IntruderPanel.tsx` (nouveau)

**UI Layout**:
```
┌─────────────────────────────────────────────┐
│ Intruder Campaign: "Login Brute Force"     │
├─────────────────────────────────────────────┤
│ 1. Positions                                │
│ ┌─────────────────────────────────────────┐ │
│ │ POST /login                             │ │
│ │ {"username":"§user§","password":"§pass§"}│ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ 2. Payloads                                 │
│ Position 1 (user): [Simple List ▼]         │
│ ┌─────────────────────────────────────────┐ │
│ │ admin                                   │ │
│ │ root                                    │ │
│ │ test                                    │ │
│ └─────────────────────────────────────────┘ │
│ Position 2 (pass): [Wordlist ▼]            │
│                                             │
│ 3. Options                                  │
│ Concurrency: [5 ▼]  Delay: [0ms]          │
│                                             │
│ Total Requests: 100  [Start Attack]        │
├─────────────────────────────────────────────┤
│ Results (Status: Running 45/100)            │
│ ┌─────────────────────────────────────────┐ │
│ │ #  Payload        Status  Length  Time  │ │
│ │ 1  admin:admin    401     156     89ms  │ │
│ │ 2  admin:pass     401     156     92ms  │ │
│ │ 3  admin:123456   200     1024    145ms │ │ ← Different!
│ └─────────────────────────────────────────┘ │
│ [Pause] [Stop] [Export Results]             │
└─────────────────────────────────────────────┘
```

**Features**:
- Visual payload position markers
- Payload set management
- Attack type: Sniper, Battering Ram, Pitchfork, Cluster Bomb
- Live progress bar
- Results filtering (status code, response length)
- Highlight anomalies (different response length)
- Export results (CSV, JSON)

### 4.6 Frontend: Intruder Store
**Fichier**: `/frontend/src/stores/intruderStore.ts` (nouveau)

**State**:
- Active campaigns
- Payload sets library
- Results cache
- Progress tracking

---

## 🎨 Phase 5: UX/UI Enhancements (CONTINUOUS)

**Objectif**: Expérience utilisateur professionnelle

### 5.1 Keyboard Shortcuts
**Global**:
- `Ctrl+I` - Toggle Intercept
- `Ctrl+R` - Send to Repeater
- `Ctrl+D` - Open Decoder
- `Ctrl+Shift+I` - Send to Intruder
- `Ctrl+F` - Focus search
- `Ctrl+S` - Save current tab

### 5.2 Dark Theme Optimization
**Fichier**: `/frontend/tailwind.config.js`

**Add**:
- Professional dark color scheme (like Burp)
- Syntax highlighting themes
- High contrast for readability

### 5.3 Layout Flexibility
**Features**:
- Resizable panels (drag dividers)
- Detachable tabs (separate windows)
- Customizable toolbar
- Save workspace layout

### 5.4 Notifications & Feedback
**Add**:
- Toast notifications for actions
- Progress indicators
- Error handling with helpful messages
- Success confirmations

---

## 🔒 Phase 6: Response Modification (OPTIONAL)

**Objectif**: Modifier les réponses avant qu'elles atteignent le navigateur

**Complexity**: High (streaming, chunked encoding, compression)

### 6.1 Backend: Response Queue
Similar to request queue but for responses

### 6.2 Backend: Response Streaming
Handle chunked/gzipped responses

### 6.3 Frontend: Response Intercept UI
Separate panel for response modification

**Note**: Lower priority - rarely used in real pentesting

---

## 📊 Implementation Timeline

| Phase | Feature | Priority | Effort | Status |
|-------|---------|----------|--------|--------|
| 1 | Request Intercept & Modify | 🔴 Critical | 3 days | ✅ **DONE** |
| 2 | Repeater | 🟠 High | 2 days | ✅ **DONE** |
| 3 | Decoder | 🟡 Medium | 1 day | ⏳ Pending |
| 4 | Intruder/Fuzzing | 🟡 Medium | 5 days | ⏳ Pending |
| 5 | UX/UI Polish | 🟢 Low | Continuous | 🔄 In Progress |
| 6 | Response Modify | ⚪ Optional | 3 days | ⏳ Pending |

**Completed**: Phases 1-2 (5 days of work) ✅
**Remaining**: Phases 3-4 (~6 days) for full Burp Suite feature parity

---

## 🎯 Success Metrics

- ✅ **Can intercept and modify requests before sending** - Phase 1 COMPLETE
- ✅ **Can resend requests with modifications (Repeater)** - Phase 2 COMPLETE
- ⏳ Can encode/decode/hash data easily - Phase 3 Pending
- ⏳ Can run automated fuzzing campaigns - Phase 4 Pending
- 🔄 **UX feels professional and efficient** - Continuous improvement
- ✅ **All features integrated seamlessly** - Dashboard tabs working
- ✅ **No breaking changes to existing functionality** - All tests passing

---

## 🚀 Next Steps

1. ✅ ~~Create development branch~~ → `feature/burp-suite-features` created
2. ✅ ~~Phase 1: Request Queue + Intercept UI~~ → COMPLETE
3. ✅ ~~Phase 2: Repeater implementation~~ → COMPLETE
4. 🔄 **Phase 3: Decoder Utilities** → Next priority (1 day effort)
5. ⏳ Phase 4: Intruder/Fuzzing → After Decoder
6. 🔄 Testing & Documentation → Ongoing

### Recent Commits (Phase 1 & 2):
```
960dacc feat(frontend): implement Repeater UI with multi-tab support
b85d04a feat(backend): implement Repeater service and API routes
2f8d8d7 fix(extension): improve proxy state sync between frontend and extension
9337985 feat(frontend): implement request interception UI
fd2e48c feat(frontend): Add WebSocket handlers and InterceptStore for request queue
e474ba6 feat(backend): Implement Phase 1 - Request Interception & Queue System
```

---

**Last Updated**: 2025-11-15
**Current Phase**: Phase 2 COMPLETE ✅ → Moving to Phase 3 (Decoder)
