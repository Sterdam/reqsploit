# 🧪 Backend Improvements - Test Plan

## ✅ **Test 1: Smart Filters (Auto-Forward)**

### Setup
1. Start proxy with intercept mode ON
2. Navigate to a website with static assets (example.com)

### Expected Behavior
```
BEFORE (without smart filters):
- Queue size: 50+ requests (CSS, JS, images, fonts, etc.)

AFTER (with smart filters):
- Queue size: 5-10 requests (only API calls, forms, auth)
- Log shows: "Request matched smart filter - auto-forwarding"
```

### Verification
```bash
docker logs reqsploit-backend-dev 2>&1 | grep "smart filter"
# Should see: "RequestQueue initialized with smart filters"
# Should see: "Request matched smart filter - auto-forwarding" for static assets
```

---

## ✅ **Test 2: Bulk Actions**

### Test via Browser Console (Frontend exists)
```javascript
// Get WebSocket from window (if exposed)
const socket = io('http://localhost:3000', {
  auth: { token: localStorage.getItem('accessToken') }
});

// Wait for connection
socket.on('connect', () => {
  console.log('Connected:', socket.id);

  // Get current queue
  socket.emit('request:get-queue');
});

// Listen for queue
socket.on('request:queue', (data) => {
  console.log('Queue size:', data.queue.length);
  const requestIds = data.queue.map(r => r.id);

  // Test bulk forward
  socket.emit('request:bulk-forward', { requestIds: requestIds.slice(0, 5) });
});

// Listen for results
socket.on('bulk:result', (data) => {
  console.log('Bulk action:', data.action);
  console.log('Success:', data.success.length);
  console.log('Failed:', data.failed.length);
});
```

### Expected Logs
```
[info] Bulk forward requested { userId: '...', count: 5 }
[info] Request forwarded { requestId: '...', ... }
[info] Request forwarded { requestId: '...', ... }
... (5 times)
[info] Bulk forward completed { success: 5, failed: 0 }
```

---

## ✅ **Test 3: Pattern-Based Actions**

### Test Scenario
Capture mix of googleapis.com and phantom.app requests

```javascript
// Forward all googleapis.com requests
socket.emit('request:forward-by-pattern', {
  urlPattern: '.*googleapis\\.com.*'
});

// Expected result:
socket.on('bulk:result', (data) => {
  // data.action === 'forward'
  // data.success contains all googleapis.com request IDs
  // Queue now only has phantom.app requests
});
```

### Expected Logs
```
[info] Pattern-based forward requested { pattern: '.*googleapis\.com.*' }
[info] Pattern-based forward { pattern: '.*googleapis\.com.*', matches: 3 }
[info] Bulk forward completed { success: 3, failed: 0 }
```

---

## ✅ **Test 4: Race Condition Fix**

### Test Scenario
1. Start proxy, capture 1 request
2. Wait exactly 59 seconds
3. Click "Drop" in UI (or send drop event)

### Previous Behavior (Bug)
```
[error] Failed to drop request
[warn] Request timeout - auto-forwarding
[error] [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent
```

### New Behavior (Fixed)
```
[info] Request dropped { requestId: '...', url: '...' }
OR
[warn] Response already sent, cannot drop
```

### Verification
```bash
# Monitor logs during test
docker logs reqsploit-backend-dev -f 2>&1 | grep -E "(drop|timeout|ERR_HTTP)"

# Should NOT see ERR_HTTP_HEADERS_SENT
# Should see clean drop OR "already sent" warning
```

---

## ✅ **Test 5: Smart Filters Configuration**

### Get Filters
```javascript
socket.emit('smart-filters:get');

socket.on('smart-filters:config', (data) => {
  console.log('Filters:', data.filters);
  // [
  //   { name: 'static-assets', pattern: /\.css$/i, enabled: true, ... },
  //   { name: 'google-analytics', pattern: /google-analytics/i, enabled: true, ... },
  //   ...
  // ]
});
```

### Update Filters
```javascript
socket.emit('smart-filters:update', {
  filters: [
    {
      name: 'static-assets',
      pattern: /\.(css|js|jpg|png|gif)$/i,
      enabled: false, // DISABLE static asset filtering
      description: 'Static assets'
    },
    {
      name: 'custom-api',
      pattern: /\/api\/internal\//i,
      enabled: true, // NEW FILTER
      description: 'Internal API calls to skip'
    }
  ]
});

// Server responds with updated config
socket.on('smart-filters:config', (data) => {
  console.log('Filters updated');
});
```

### Expected Logs
```
[info] Update smart filters { count: 2 }
[info] Smart filters updated
[debug] Request matched smart filter - auto-forwarding { filter: 'custom-api' }
```

---

## 📊 **Performance Validation**

### Metrics to Track

| Test | Metric | Target | Actual |
|------|--------|--------|--------|
| Smart Filters | Queue noise reduction | >70% | ? |
| Bulk Forward | Time for 10 requests | <1s | ? |
| Race Condition | Errors per 100 drops | 0 | ? |
| Pattern Match | Regex match time | <100ms | ? |

### Benchmark Script
```javascript
// Bulk forward benchmark
const startTime = Date.now();
socket.emit('request:bulk-forward', { requestIds: allIds });

socket.on('bulk:result', (data) => {
  const elapsed = Date.now() - startTime;
  console.log(`Bulk forward ${data.success.length} requests in ${elapsed}ms`);
  // Target: <100ms for 10 requests
});
```

---

## 🔧 **Integration with Existing UI**

### Backward Compatibility Check

All existing WebSocket events should still work:

```javascript
// OLD API (still works)
socket.emit('request:forward', { requestId: '...' });
socket.emit('request:drop', { requestId: '...' });
socket.emit('request:modify', { requestId: '...', modifications: {} });

// NEW API (additive)
socket.emit('request:bulk-forward', { requestIds: [...] });
socket.emit('smart-filters:get');
```

### Expected Result
✅ **Zero breaking changes** - existing UI continues to function perfectly

---

## ✅ **Manual Testing Checklist**

- [ ] **Proxy starts successfully** with smart filters initialized
- [ ] **Static assets** (CSS/JS) are auto-forwarded (check logs)
- [ ] **Bulk forward** via WebSocket works and returns results
- [ ] **Bulk drop** via WebSocket works and returns results
- [ ] **Pattern-based forward** matches correct requests
- [ ] **Pattern-based drop** matches correct requests
- [ ] **Smart filter get** returns current configuration
- [ ] **Smart filter update** applies new configuration
- [ ] **Race condition** no longer throws errors
- [ ] **Existing frontend** (intercept panel) still works
- [ ] **TypeScript compilation** passes with 0 errors

---

## 🎯 **Success Criteria**

### Critical (Must Pass)
- ✅ Zero TypeScript errors
- ✅ Backend starts without crashes
- ✅ Race condition completely eliminated
- ✅ Existing WebSocket API backward compatible

### Important (Should Pass)
- ✅ Smart filters reduce queue by >70%
- ✅ Bulk actions complete in <1s for 10 requests
- ✅ Pattern matching works correctly

### Nice-to-Have (Bonus)
- ✅ Smart filter configuration persists across sessions
- ✅ Bulk action error handling is graceful
- ✅ Logs are clean and informative

---

## 📝 **Test Results Log**

Date: 2025-11-17
Tester: [Your Name]

| Test | Status | Notes |
|------|--------|-------|
| TypeScript compilation | ✅ PASS | 0 errors |
| Backend startup | ✅ PASS | Smart filters initialized |
| Smart filters | ⏳ PENDING | Need frontend to test |
| Bulk actions | ⏳ PENDING | Need WebSocket client |
| Pattern matching | ⏳ PENDING | Need WebSocket client |
| Race condition | ⏳ PENDING | Need drop near timeout |
| Backward compat | ⏳ PENDING | Need existing UI |

**Overall Status**: Backend ready, frontend integration pending
