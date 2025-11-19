# 🎣 Magic Scan - Automatic Sensitive Data Discovery

**Status**: 🟡 Backend 95% Complete, Frontend Pending
**Priority**: P0 - Critical Security Feature
**Effort**: ~10h remaining
**ROI**: Major differentiator, Critical for pentesters

---

## 📋 Feature Overview

**Magic Scan** est un scanner automatique ultra-intelligent qui détecte en temps réel les données sensibles dans **toutes** les requêtes/réponses HTTP.

### Position dans l'App
```
Intercept(69) → History → [🎣 Magic Scan (42)] → Repeater(5) → Decoder → Intruder
```

### Cas d'Usage
- **Automatic Discovery**: Scan automatique de chaque request/response
- **Real-time Alerts**: Notification instantanée quand données critiques détectées
- **Zero Manual Effort**: Aucune action requise, tout est automatique
- **Comprehensive Coverage**: 30+ types de données sensibles
- **Smart Filtering**: False positive reduction via confidence scoring

---

## 🎯 Assets Detected (9 Categories, 30+ Types)

### 1. 🔴 API KEYS & SECRETS (CRITICAL)
- AWS Access Keys (AKIA...) + Secret Keys
- GitHub Tokens (ghp_, gho_, ghs_, ghr_)
- Stripe API Keys (sk_live_, pk_live_)
- Google API Keys (AIza...)
- Slack Tokens (xox...)
- SendGrid, Twilio, Mailgun, Firebase
- Generic API key patterns

### 2. 🔴 PRIVATE KEYS & CERTIFICATES (CRITICAL)
- RSA Private Keys (-----BEGIN RSA PRIVATE KEY-----)
- SSH Private Keys (-----BEGIN OPENSSH PRIVATE KEY-----)
- PGP Private Keys
- SSL/TLS certificates

### 3. 🔴 DATABASE CREDENTIALS (CRITICAL)
- MongoDB connection strings (mongodb://...)
- MySQL connection strings (mysql://...)
- PostgreSQL connection strings (postgres://...)
- Redis connection strings (redis://...)

### 4. 🟡 AUTHENTICATION DATA (HIGH)
- JWT Tokens (with validation)
- Bearer Tokens
- Basic Auth credentials (base64 decoded)
- Session Tokens

### 5. 🔵 NETWORK & INFRASTRUCTURE (MEDIUM-HIGH)
- Private IP addresses (10.x, 172.16-31.x, 192.168.x)
- Cloud metadata endpoints (169.254.169.254)
- Internal URLs (localhost, admin panels)
- Debug endpoints

### 6. 🟡 PERSONAL DATA - PII (MEDIUM-CRITICAL)
- Email addresses
- Credit card numbers (Luhn algorithm validated)
- Social Security Numbers (SSN)
- IBAN numbers
- Passport numbers

### 7. 🔵 SENSITIVE FILES (MEDIUM)
- .env files (.env, .env.local, .env.prod)
- Config files (config.json, settings.yml)
- Git config files (.git/config, .gitconfig)
- Backup files (.bak, .old, .sql)

### 8. ⚪ ERROR MESSAGES & DEBUG (LOW-MEDIUM)
- Stack traces with file paths
- SQL errors with schema info
- Version disclosure
- Debug mode indicators

### 9. ⚪ BUSINESS LOGIC (LOW)
- User IDs, Account numbers
- Transaction IDs
- Internal reference numbers

---

## ✅ BACKEND IMPLEMENTATION (95% Complete)

### 1. Pattern Library ✅ DONE
**File**: `/backend/src/core/scanner/scan-patterns.ts` (586 lines)

- 30+ ultra-intelligent regex patterns
- Advanced validators (Luhn, JWT, Base64, AWS format)
- Context-aware confidence scoring
- Custom masking per asset type
- Categories & severity classification

### 2. Scanner Service ✅ DONE
**File**: `/backend/src/core/scanner/scanner.service.ts` (645 lines)

**Features**:
- Multi-target scanning (URL, headers, body, cookies)
- Context extraction (50 chars before/after)
- Confidence scoring (0-100, context-aware)
- Hash-based deduplication (SHA256)
- Encrypted storage (AES-256-GCM)
- Binary detection (skip non-text)
- Size limits (skip >10MB)
- Pre-compiled regex for performance

**Methods**:
- `scanRequest()` - Scan HTTP request
- `scanResponse()` - Scan HTTP response
- `getResults()` - Fetch findings (paginated, filtered)
- `getStats()` - Statistics by severity/category
- `markAsSafe()` - Mark as safe
- `markAsFalsePositive()` - Mark as false positive
- `deleteResult()` - Delete finding
- `rescanRequest()` - Manual rescan

### 3. API Routes ✅ DONE
**File**: `/backend/src/routes/scan.routes.ts` (194 lines)

**Endpoints**:
- `GET /api/scan/results` - Get findings (pagination + filters)
- `GET /api/scan/stats` - Get statistics
- `POST /api/scan/mark-safe/:id` - Mark as safe
- `POST /api/scan/mark-false-positive/:id` - Mark as false positive
- `DELETE /api/scan/result/:id` - Delete finding
- `POST /api/scan/rescan/:requestId` - Rescan request
- `GET /api/scan/patterns` - Get available patterns

### 4. Database Schema ✅ DONE
**File**: `/backend/prisma/schema.prisma` (+80 lines)

**Models**:
- `AssetCategory` enum (9 categories)
- `ScanResult` model (findings storage with full indexing)
- `ScanPattern` model (user-specific overrides)
- Relations: User ← ScanResult → RequestLog

**Prisma Client**: ✅ Generated successfully

### 5. Logger ✅ DONE
- Added `scanLogger` to `/backend/src/utils/logger.ts`

---

## 🚧 INTEGRATION NEEDED (5% - 1h effort)

### 1. Register Routes ❌ TODO (5 min)
**File**: `/backend/src/index.ts`

```typescript
import scanRoutes from './routes/scan.routes.js';
app.use('/api/scan', scanRoutes);
```

### 2. Auto-Scan Integration ❌ TODO (30 min)
**File**: `/backend/src/services/request-logger.service.ts`

After logging request/response, trigger scan:
```typescript
import { scannerService } from '../core/scanner/scanner.service.js';

// After logging request
scannerService.scanRequest(userId, requestId, method, url, headers, body)
  .catch(err => scanLogger.error('Auto-scan failed', { err }));

// After logging response
scannerService.scanResponse(userId, requestId, statusCode, headers, body)
  .catch(err => scanLogger.error('Auto-scan failed', { err }));
```

### 3. WebSocket Events ❌ TODO (30 min)
**File**: `/backend/src/core/websocket/ws-server.ts`

Emit events for real-time updates:
```typescript
// After storing scan result
socket.emit('scan:result', {
  result: scanResult,
  severity: scanResult.severity,
  category: scanResult.category,
});

// Periodic stats update
socket.emit('scan:stats', await scannerService.getStats(userId));
```

---

## 📱 FRONTEND TODO (8-10h effort)

### Components to Create:

#### 1. Main Panel (3h)
**File**: `/frontend/src/pages/MagicScan.tsx`

**Features**:
- Results list with virtualization (react-window)
- Real-time updates via WebSocket
- Filters (severity, category, safe/all)
- Search functionality
- Export (JSON/CSV)
- Pagination

**UI Structure**:
```tsx
<MagicScanPanel>
  <Header>
    <Title>🎣 Magic Scan</Title>
    <Badge count={42} />
    <Actions>
      <SettingsButton />
      <RescanAllButton />
    </Actions>
  </Header>

  <SeverityFilters>
    <Filter severity="CRITICAL" count={12} />
    <Filter severity="HIGH" count={8} />
    <Filter severity="MEDIUM" count={15} />
    <Filter severity="LOW" count={7} />
  </SeverityFilters>

  <CategoryFilters>
    <Toggle category="API_KEYS" count={12} />
    <Toggle category="PRIVATE_KEYS" count={3} />
    ...
  </CategoryFilters>

  <ResultsList>
    <VirtualList>
      {results.map(r => <ScanResultCard result={r} />)}
    </VirtualList>
  </ResultsList>
</MagicScanPanel>
```

#### 2. Result Card (1h)
**File**: `/frontend/src/components/MagicScanResultCard.tsx`

**UI**:
```tsx
<ResultCard severity={result.severity}>
  <SeverityBadge severity="CRITICAL" icon={🔴} />
  <TypeLabel>{result.type}</TypeLabel>

  <Value>
    <MaskedValue>{result.value}</MaskedValue>
    <RevealButton onClick={revealFull} />
  </Value>

  <Meta>
    <Location>{result.location.source} → {result.location.part}</Location>
    <Confidence>{result.confidence}%</Confidence>
    <Timestamp>{formatTime(result.createdAt)}</Timestamp>
  </Meta>

  <Context expandable>
    {result.context}
  </Context>

  <Actions>
    <Button onClick={viewRequest}>View Request</Button>
    <Button onClick={markSafe}>Mark Safe</Button>
    <Button onClick={copy}>Copy Value</Button>
    <Button onClick={deleteResult}>Delete</Button>
  </Actions>
</ResultCard>
```

#### 3. Filters Panel (1h)
**File**: `/frontend/src/components/MagicScanFilters.tsx`

- Severity chips (click to filter)
- Category toggles (checkboxes)
- Show/hide safe findings
- Search by type/value
- Clear all filters

#### 4. Notification Toast (1h)
**File**: `/frontend/src/components/MagicScanNotification.tsx`

**Features**:
- Non-intrusive toast (top-right)
- Batched notifications (combine in 1s window)
- Click to navigate to Magic Scan panel
- Auto-dismiss LOW severity (3s)
- Manual dismiss for CRITICAL/HIGH

**Visual**:
```tsx
<Toast severity="CRITICAL">
  🎣 New Critical Finding!
  <Message>AWS Access Key detected in request</Message>
  <Actions>
    <Button>View</Button>
    <Button>Dismiss</Button>
  </Actions>
</Toast>
```

#### 5. Settings Modal (1h)
**File**: `/frontend/src/components/MagicScanSettings.tsx`

**Settings**:
- Enable/disable pattern categories
- Adjust confidence threshold (slider 0-100)
- Auto-scan toggle
- Export/import patterns
- Clear all findings

#### 6. Store (1h)
**File**: `/frontend/src/stores/magicScanStore.ts`

```typescript
interface MagicScanState {
  results: ScanResult[];
  stats: ScanStats;
  filters: {
    severity: Severity[];
    category: AssetCategory[];
    showSafe: boolean;
    search: string;
  };
  pagination: { limit: number; offset: number };

  // Actions
  fetchResults: () => Promise<void>;
  fetchStats: () => Promise<void>;
  markAsSafe: (id: string) => Promise<void>;
  markAsFalsePositive: (id: string) => Promise<void>;
  deleteResult: (id: string) => Promise<void>;
  rescanRequest: (requestId: string) => Promise<void>;

  // WebSocket
  onNewResult: (result: ScanResult) => void;
  onStatsUpdate: (stats: ScanStats) => void;
}
```

#### 7. Router Integration (15 min)
**File**: `/frontend/src/App.tsx`

Add route:
```tsx
<Route path="/magic-scan" element={<MagicScan />} />
```

Update navigation (add after History):
```tsx
<NavLink to="/magic-scan">
  Magic Scan
  {criticalCount > 0 && <Badge>{criticalCount}</Badge>}
</NavLink>
```

#### 8. Visual Effects (30 min)

**CSS Animations**:
```css
/* Critical findings - red pulse */
@keyframes criticalPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); }
  50% { box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
}

.critical-finding {
  animation: criticalPulse 2s infinite;
}

/* High findings - orange glow */
.high-finding {
  box-shadow: 0 0 10px rgba(249, 115, 22, 0.5);
}

/* Smooth slide-in for new findings */
@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
```

**Badge Counter**:
```tsx
<Tab to="/magic-scan">
  Magic Scan
  {totalCount > 0 && (
    <Badge className={criticalCount > 0 ? 'critical' : ''}>
      {totalCount}
    </Badge>
  )}
</Tab>
```

---

## 🎨 UX/UI DESIGN

### Color Scheme
- **CRITICAL**: `#DC2626` (red-600) - Red pulse animation
- **HIGH**: `#F97316` (orange-500) - Orange glow
- **MEDIUM**: `#3B82F6` (blue-500) - Blue highlight
- **LOW**: `#6B7280` (gray-500) - Minimal emphasis

### Visual Indicators
- 🔴 CRITICAL: Red badge + pulse
- 🟡 HIGH: Orange badge + glow
- 🔵 MEDIUM: Blue badge
- ⚪ LOW: Gray badge

### Notification Strategy
- **CRITICAL**: Immediate toast, no auto-dismiss, red pulse
- **HIGH**: Batched toast (1s window), 10s auto-dismiss
- **MEDIUM**: Batched toast, 5s auto-dismiss
- **LOW**: Silent, badge counter only

---

## 📊 PERFORMANCE OPTIMIZATIONS

### Backend
- ✅ Pre-compiled regex patterns (cached)
- ✅ Async/non-blocking scanning
- ✅ Hash-based deduplication
- ✅ Binary content detection (skip)
- ✅ Size limits (skip >10MB)
- ✅ Database indexing (optimized queries)

### Frontend
- ❌ Virtualized list (react-window) for >50 findings
- ❌ Debounced search (300ms)
- ❌ Lazy loading for pagination
- ❌ Memoized components
- ❌ WebSocket event throttling

---

## 📈 SUCCESS METRICS

### Performance
- Scan speed: <100ms per request/response
- UI response: <16ms frame time
- Memory: <50MB for 1000 findings
- Database queries: <50ms (indexed)

### Accuracy
- False positive rate: <5%
- Detection rate: >95% for known patterns
- Confidence accuracy: ±10%

### UX
- Time to first finding: <1s
- Notification delay: <100ms
- Filter response: <50ms

---

## 🚀 DEPLOYMENT CHECKLIST

### Backend
- [ ] Register routes in app
- [ ] Add auto-scan integration
- [ ] Add WebSocket events
- [ ] Run Prisma migration
- [ ] Test all endpoints
- [ ] Load test (100 concurrent scans)

### Frontend
- [ ] Build all components
- [ ] Integrate store with WebSocket
- [ ] Add router integration
- [ ] Test all user flows
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Performance audit (Lighthouse >90)

### Documentation
- [ ] API documentation
- [ ] User guide
- [ ] Pattern catalog
- [ ] Troubleshooting guide

---

## 💡 FUTURE ENHANCEMENTS (Phase 3+)

### Custom Patterns
- User-defined regex patterns
- Import/export pattern libraries
- Pattern marketplace

### Machine Learning
- False positive learning
- Pattern confidence tuning
- Anomaly detection

### Integrations
- Export to SIEM (Splunk, ELK)
- Slack/Discord notifications
- Jira issue creation

### Advanced Features
- Historical trending
- Pattern effectiveness scoring
- Automated remediation suggestions

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

**Current Status**: Backend 95% Complete (1506 lines), Frontend 0% (est. 1105 lines)
**Total Effort Remaining**: ~10 hours for production-ready feature
**Priority**: P0 - Implement immediately after Phase 1 completion
