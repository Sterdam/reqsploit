# 🗺️ ReqSploit - Roadmap Complète & Ordre Logique

**Date:** 2025-11-17
**Version:** 1.0
**Objectif:** Développement structuré et cohérent malgré sessions multiples

---

## 📊 **État Actuel - Baseline**

### ✅ Complété (Session 2025-11-17)

**Backend (100%):**
- ✅ Race condition fix
- ✅ Smart queue management
- ✅ Bulk actions API
- ✅ WebSocket events integration
- ✅ AI Analyze fix (model mapping)

**Frontend (95%):**
- ✅ Toast notifications system
- ✅ SmartFiltersPanel UI
- ✅ Undo/Redo system (frontend)
- ✅ BulkActionsToolbar
- ✅ Keyboard Shortcuts Panel
- ✅ Multi-select avec Shift+Click
- ✅ All keyboard shortcuts functional

**Bugs Résolus:**
- ✅ AI Analyze 400 error
- ✅ Ctrl+R adds 2 requests
- ✅ Bulk send to repeater broken

**Qualité:**
- ✅ 0 TypeScript errors
- ✅ Production build OK
- ✅ Documentation complète

### ✅ Complété Récemment (Session 2025-11-17 Extended)

**Backend:**
- ✅ Undo grace period implementation (P0) - COMPLETE
- ✅ Endpoint POST /api/intercept/undo (P0) - COMPLETE
- ✅ Limbo state management (30s grace period)
- ✅ WebSocket events (undo-success, final-drop)

**Frontend:**
- ✅ Undo API integration in undoStore
- ✅ Toast notifications avec grace period info
- ✅ Keyboard Shortcuts Panel (P1) - COMPLETE

### ⚠️ En Attente - Prochaine Session

**Frontend:**
- ⚠️ Request Tagging System (P1) - Next priority
- ⚠️ Detachable Panels (P2) - Phase 3

---

## 🎯 **PHASE 1: STABILITÉ & CORE FEATURES** (Priorité Absolue)

**Objectif:** Base rock-solid pour production
**Durée:** 1-2 semaines
**Status:** 🔄 IN PROGRESS

### 1.1 Backend Undo Grace Period (P0 - CRITIQUE)
**Effort:** 4h
**Priorité:** 🔥 URGENT
**Blocage:** Safety net critique pour éviter data loss

**Implémentation:**
```typescript
// backend/src/core/proxy/request-queue.ts

interface PendingDropRequest {
  request: QueuedRequest;
  timestamp: number;
  timeoutId: NodeJS.Timeout;
}

class RequestQueue {
  private pendingDrops: Map<string, PendingDropRequest> = new Map();
  private DROP_GRACE_PERIOD = 30000; // 30s

  // Au lieu de drop immédiat:
  drop(requestId: string) {
    const request = this.queuedRequests.get(requestId);

    // 1. Marquer en "limbo"
    const timeoutId = setTimeout(() => {
      this.finalDrop(requestId);
    }, this.DROP_GRACE_PERIOD);

    this.pendingDrops.set(requestId, {
      request,
      timestamp: Date.now(),
      timeoutId
    });

    // 2. Retirer de la queue visible
    this.queuedRequests.delete(requestId);

    // 3. Emit event avec grace period info
    this.wsServer.emitToUser(userId, 'request:dropped', {
      requestId,
      canUndo: true,
      graceSeconds: 30
    });
  }

  // Nouveau: Undo endpoint
  undoDrop(requestId: string): boolean {
    const pending = this.pendingDrops.get(requestId);
    if (!pending) return false;

    // 1. Clear timeout
    clearTimeout(pending.timeoutId);

    // 2. Re-queue
    this.queuedRequests.set(requestId, pending.request);

    // 3. Remove from pending
    this.pendingDrops.delete(requestId);

    // 4. Emit success
    this.wsServer.emitToUser(userId, 'request:undo-success', {
      requestId
    });

    return true;
  }

  private finalDrop(requestId: string) {
    const pending = this.pendingDrops.get(requestId);
    if (!pending) return;

    // Vraiment drop (send 403)
    pending.request.clientRes.writeHead(403);
    pending.request.clientRes.end();

    this.pendingDrops.delete(requestId);
  }
}
```

**Backend Route:**
```typescript
// backend/src/routes/proxy.routes.ts
router.post('/intercept/undo', authMiddleware, async (req, res) => {
  const { requestId } = req.body;
  const userId = req.user.id;

  const queue = sessionManager.getQueue(userId);
  const success = queue.undoDrop(requestId);

  res.json({ success, requestId });
});
```

**Frontend Integration:**
```typescript
// frontend/src/stores/undoStore.ts - Modifier pour appeler backend

undo: async () => {
  const action = undoStack[undoStack.length - 1];
  if (!action || !action.canUndo) return;

  if (action.type === 'bulk-drop' || action.type === 'single-drop') {
    // Call backend undo
    const response = await fetch('/api/proxy/intercept/undo', {
      method: 'POST',
      body: JSON.stringify({ requestIds: action.data.requestIds })
    });

    if (response.ok) {
      toast.success('Undo successful', 'Requests restored to queue');
    }
  }
}
```

**Tests:**
1. Drop request → Wait 29s → Undo → Should re-queue
2. Drop request → Wait 31s → Undo → Should fail (grace period expired)
3. Bulk drop 10 → Undo → All 10 re-queued
4. Server restart pendant grace period → Pending drops lost (acceptable)

**Blockers:** Aucun
**Dependencies:** Aucune

---

### 1.2 Tests End-to-End Complets
**Effort:** 2h
**Priorité:** 🔥 HIGH

**Checklist:**
- [ ] Tester tous les bugs fixes (AI Analyze, Ctrl+R, Bulk repeater)
- [ ] Tester toutes les features P0 (Toast, SmartFilters, Undo, BulkActions, Shortcuts)
- [ ] Tester keyboard shortcuts (tous)
- [ ] Tester multi-select range selection
- [ ] Tester undo/redo avec backend grace period
- [ ] Performance test (100+ requests dans queue)
- [ ] Browser compatibility (Chrome, Firefox, Safari)

**Documentation:** TEST_CHECKLIST.md déjà créé

---

### 1.3 Performance Optimization
**Effort:** 3h
**Priorité:** 🟡 MEDIUM

**Optimizations:**
1. **Virtualized List pour Intercept Queue**
   - Si >50 requests → Virtual scrolling
   - Library: `react-window` ou `@tanstack/react-virtual`
   - Benefit: Smooth avec 1000+ requests

2. **WebSocket Event Throttling**
   - Batch updates toutes les 100ms
   - Éviter re-render pour chaque request

3. **Memoization Aggressive**
   - useMemo pour filteredRequests
   - React.memo pour RequestItem components

**Tests:**
- Benchmark avec 500 requests
- Memory profiling
- CPU usage monitoring

---

## 🎯 **PHASE 2: FEATURES PREMIUM** (P1 High Value)

**Objectif:** Features différenciatrices vs. compétition
**Durée:** 1-2 semaines
**Status:** 📅 PLANNED

### 2.1 Request Tagging System
**Effort:** 6h
**Priorité:** ⭐⭐⭐⭐ HIGH
**Value:** Game-changer pour workflow pentest

**Architecture:**
```typescript
// Types
type TagColor = 'red' | 'yellow' | 'green' | 'blue' | 'purple' | 'gray';
type TagType = 'critical' | 'interesting' | 'safe' | 'idor' | 'xss' | 'custom';

interface RequestTag {
  type: TagType;
  color: TagColor;
  label: string;
  description?: string;
}

interface TaggedRequest extends QueuedRequest {
  tags: RequestTag[];
}

// Backend - Database Schema
model RequestLog {
  // ... existing fields
  tags Json[] @default([])
}

// Backend - API
POST /api/requests/:id/tags
DELETE /api/requests/:id/tags/:tagType
GET /api/requests/by-tag/:tagType

// Frontend - Store
interface InterceptStore {
  // ... existing
  tagRequest: (requestId: string, tag: RequestTag) => void;
  removeTag: (requestId: string, tagType: TagType) => void;
  filterByTag: (tagType: TagType | null) => void;
  selectedTag: TagType | null;
}
```

**UI Components:**
```typescript
// 1. Tag Badge Component
<TagBadge tag={tag} onRemove={() => removeTag(req.id, tag.type)} />

// 2. Tag Context Menu (Right-click)
<ContextMenu>
  <MenuItem onClick={() => tagAs('critical')}>🔴 Mark as Critical</MenuItem>
  <MenuItem onClick={() => tagAs('interesting')}>🟡 Mark as Interesting</MenuItem>
  <MenuItem onClick={() => tagAs('safe')}>🟢 Mark as Safe</MenuItem>
  <MenuItem onClick={() => tagAs('idor')}>🔵 Potential IDOR</MenuItem>
  <MenuItem onClick={() => tagAs('xss')}>🟣 Potential XSS</MenuItem>
</ContextMenu>

// 3. Tag Filter Bar
<TagFilterBar>
  <TagFilterChip tag="critical" count={5} />
  <TagFilterChip tag="interesting" count={12} />
  <TagFilterChip tag="safe" count={40} />
  <TagFilterChip tag="idor" count={3} />
  <TagFilterChip tag="xss" count={2} />
  <TagFilterChip tag="untagged" count={150} />
</TagFilterBar>

// 4. Bulk Tag Actions
<BulkActionsToolbar>
  {/* ... existing buttons */}
  <Dropdown>
    <DropdownTrigger>Tag Selected</DropdownTrigger>
    <DropdownMenu>
      <DropdownItem onClick={() => bulkTag('critical')}>
        🔴 Critical
      </DropdownItem>
      {/* ... other tags */}
    </DropdownMenu>
  </Dropdown>
</BulkActionsToolbar>
```

**Persistence:**
- Backend: Tags stockés dans database
- Frontend: Tag filters dans localStorage
- Sync: WebSocket events pour multi-user

**Tests:**
- Tag 1 request → Badge visible
- Filter by tag → Only tagged requests shown
- Bulk tag 10 requests → All tagged
- Remove tag → Badge removed
- Persistence → Reload → Tags restored

---

### 2.2 Advanced Keyboard Shortcuts
**Effort:** 2h
**Priorité:** ⭐⭐⭐ MEDIUM

**New Shortcuts:**
```typescript
// Navigation
'j' → Select next request
'k' → Select previous request
'gg' → Jump to top
'G' → Jump to bottom

// Quick actions
't' → Open tag menu
'/' → Focus search/filter
'a' → Select all visible (filtered)
'i' → Toggle inline edit

// Views
'1' → Switch to History
'2' → Switch to Intercept
'3' → Switch to Repeater
'4' → Switch to Decoder
'5' → Switch to Intruder
```

**Vim-like Navigation:**
- Option to enable "Vim mode"
- Settings panel pour customize shortcuts

---

### 2.3 Quick Filters & Search
**Effort:** 4h
**Priorité:** ⭐⭐⭐⭐ HIGH

**Features:**
```typescript
// Filter Bar Component
<QuickFilterBar>
  {/* Method filter */}
  <MethodFilter methods={['GET', 'POST', 'PUT', 'DELETE']} />

  {/* Status code filter */}
  <StatusFilter ranges={['2xx', '3xx', '4xx', '5xx']} />

  {/* Text search */}
  <SearchInput
    placeholder="Search URL, headers, body..."
    debounce={300}
  />

  {/* Advanced filters */}
  <AdvancedFilters>
    <FilterBySize min={0} max={10000} />
    <FilterByTime min={0} max={5000} />
    <FilterByHeaders key="value" />
  </AdvancedFilters>
</QuickFilterBar>
```

**Search Scope:**
- URL
- Headers (keys + values)
- Request body
- Response body
- Method
- Status code

**Performance:**
- Debounced search (300ms)
- Search index (Lunr.js or Fuse.js)
- Highlight matches

---

## 🎯 **PHASE 3: ADVANCED FEATURES** (P2 Innovation)

**Objectif:** Competitive differentiation
**Durée:** 2-3 semaines
**Status:** 📋 BACKLOG

### 3.1 Detachable Panels (Multi-Window)
**Effort:** 40-60h (2-3 weeks)
**Priorité:** ⭐⭐⭐⭐⭐ PREMIUM
**Value:** Professional multi-screen workflow

**Déjà analysé en détail ci-dessus.**

**Implementation Order:**
1. Week 1: Architecture + State Sync (BroadcastChannel)
2. Week 2: Detach/Reattach UI + WebSocket Proxy
3. Week 3: Layout Persistence + Polish + Testing

---

### 3.2 Request Comparison (Diff View)
**Effort:** 8h
**Priorité:** ⭐⭐⭐⭐ HIGH
**Value:** IDOR detection, API versioning

**UI:**
```
┌─────────────────────────────────────────────────────┐
│ Compare Requests                              [×]   │
├─────────────────────────────────────────────────────┤
│ Request A: GET /api/user/123    │ Request B: GET /api/user/456 │
├─────────────────────────┼─────────────────────────┤
│ Headers:                │ Headers:                │
│ Authorization: Bearer…  │ Authorization: Bearer…  │
│                         │                         │
│ Response:               │ Response:               │
│ {                       │ {                       │
│   "id": 123,           │   "id": 456,           │ ← DIFF
│   "email": "a@a.com",  │   "email": "b@b.com",  │ ← DIFF
│   "role": "admin"      │   "role": "user"       │ ← DIFF highlighted
│ }                       │ }                       │
└─────────────────────────────────────────────────────┘
```

**Libraries:**
- `diff` pour text diff
- `react-diff-viewer` pour UI
- Syntax highlighting

---

### 3.3 Workspace Presets
**Effort:** 6h
**Priorité:** ⭐⭐⭐ MEDIUM

**Concept:**
```typescript
interface WorkspacePreset {
  name: string;
  layout: {
    panels: PanelConfig[];
    detachedPanels: DetachedPanelConfig[];
  };
  filters: FilterConfig;
  tags: TagConfig;
  shortcuts: ShortcutConfig;
}

// Presets prédéfinis
const PRESETS = {
  'api-testing': { /* ... */ },
  'sqli-hunting': { /* ... */ },
  'xss-testing': { /* ... */ },
  'idor-detection': { /* ... */ },
  'default': { /* ... */ }
};
```

**UI:**
```
Menu: Workspace → Load Preset → "API Testing"
→ Layout auto-configured pour API testing workflow
```

---

## 🎯 **PHASE 4: POLISH & SCALE** (P3 Quality)

**Objectif:** Production-grade quality
**Durée:** 2-4 semaines
**Status:** 🔮 FUTURE

### 4.1 Analytics & Metrics
- User behavior tracking
- Performance monitoring
- Error tracking (Sentry)
- Usage analytics

### 4.2 Onboarding & Tutorials
- First-time user tutorial
- Interactive guide
- Tooltips contextuels
- Video tutorials

### 4.3 Themes & Customization
- Dark/Light themes
- Custom color schemes
- Font size adjustment
- Panel opacity

### 4.4 Export & Import
- Export workspace settings
- Export tagged requests
- Import Burp Suite projects
- HAR file support

---

## 📋 **Ordre d'Exécution Logique - PRIORITIZED**

### ✅ IMMEDIATE (Cette Session)
1. ✅ Backend Undo Grace Period (4h) - P0 CRITIQUE
2. ✅ Tests E2E complets (2h) - P0
3. ✅ Documentation update (1h)

### 📅 NEXT SESSION (Week 1)
4. Request Tagging System (6h) - P1 HIGH VALUE
5. Quick Filters & Search (4h) - P1 HIGH VALUE
6. Performance Optimization (3h) - P1

### 📅 WEEK 2
7. Advanced Keyboard Shortcuts (2h) - P1
8. Request Comparison Diff View (8h) - P2 HIGH VALUE
9. Testing & Bug Fixes (4h)

### 📅 WEEK 3-4
10. Detachable Panels Phase 1 - Architecture (1 week)
11. Detachable Panels Phase 2 - Implementation (1 week)
12. Testing & Polish (3-5 days)

### 📅 MONTH 2
13. Workspace Presets
14. Analytics & Metrics
15. Onboarding & Tutorials
16. Themes & Customization

---

## 🎯 **Session Tracking Template**

**À créer à chaque nouvelle session:**

```markdown
# Session [DATE]

## Contexte Précédent
[Lire ROADMAP.md Section "État Actuel"]
[Lire SESSION_FINAL.md dernière session]

## Objectifs Session
- [ ] Item 1
- [ ] Item 2

## Completed
- [x] Item completed

## Blockers
- Issue X

## Next Steps
[Update ROADMAP.md]
```

---

## 🔄 **Maintenance de ce Document**

**À chaque session:**
1. ✅ Mettre à jour "État Actuel - Baseline"
2. ✅ Marquer features complètes
3. ✅ Ajouter nouvelles features découvertes
4. ✅ Re-prioriser si nécessaire
5. ✅ Noter blockers/dependencies

**Fichier Sync:**
- `ROADMAP.md` (ce fichier) - Source of truth
- `SESSION_FINAL.md` - Dernière session détails
- `QUICK_STATUS.md` - Status ultra-rapide

---

## 🎯 Conclusion - Ordre Logique

**PRIORITÉ ABSOLUE (Maintenant):**
1. Backend Undo Grace Period (P0)
2. Tests E2E (P0)

**ENSUITE (Week 1-2):**
3. Request Tagging (P1)
4. Quick Filters (P1)
5. Performance (P1)

**APRÈS STABILITÉ (Week 3+):**
6. Detachable Panels (P2)
7. Advanced features (P2)

**Philosophie:**
- ✅ Shipping features complètes > Many half-baked
- ✅ Stability > Novelty
- ✅ User feedback > Assumptions
- ✅ Iterate fast > Perfect first time

---

**Ce document est le guide pour toutes les sessions futures.**
**Toujours commencer par le lire pour contexte.**
