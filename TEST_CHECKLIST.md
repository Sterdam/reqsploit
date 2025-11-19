# ✅ Test Checklist - P0 Features Complete

**Date:** 2025-11-18
**Scope:** All P0 features + Bug fixes + Backend Undo Grace Period
**Type:** Manual E2E Testing

---

## 🏁 **Setup Requirements**

### Backend
```bash
cd /home/will/burponweb/backend
docker-compose up -d
# Wait for PostgreSQL + Redis to be ready
npm run dev
```

### Frontend
```bash
cd /home/will/burponweb/frontend
npm run dev
```

### Initial State
1. [ ] Backend running on http://localhost:3000
2. [ ] Frontend running on http://localhost:5173
3. [ ] Login: test@test.com / password123
4. [ ] Proxy session started
5. [ ] Intercept mode enabled

---

## ✅ **Compilation Tests**

### Backend TypeScript
```bash
cd /home/will/burponweb/backend
npm run type-check
```
- [x] **Result:** ✅ 0 errors (Verified)

### Frontend TypeScript
```bash
cd /home/will/burponweb/frontend
npm run type-check
```
- [x] **Result:** ✅ 0 errors (Verified)

**Status:** ✅ PASS

---

## 🐛 **Bug Fixes Validation (3/3)**

### 1. AI Analyze 400 Error - FIXED ✅
**File:** `/backend/src/core/ai/claude-client.ts`
**Fix:** Changed default model to `'sonnet-4.5'`, fixed MODEL_MAP

**Test Steps:**
1. [ ] Navigate to History panel
2. [ ] Select any HTTP request
3. [ ] Click "AI Analyze" button
4. [ ] Wait for analysis

**Expected:**
- ✅ No 400 error in browser console
- ✅ No "model: Field required" error
- ✅ Analysis completes successfully
- ✅ Vulnerabilities displayed (if any)

**Actual:**
- [ ] PASS / [ ] FAIL
- Notes: ___________________________________________

---

### 2. Ctrl+R Always Adds 2 Requests - FIXED ✅
**File:** `/frontend/src/pages/Dashboard.tsx`
**Fix:** Added context check for intercept panel, use bulkSendToRepeater

**Test Steps:**
1. [ ] Intercept 5+ requests
2. [ ] **Test A:** Select 1 request → Press Ctrl+R
   - Expected: Exactly 1 Repeater tab
   - Actual: ___________________________________________
3. [ ] Clear Repeater tabs
4. [ ] **Test B:** Select 3 requests (Shift+Click) → Press Ctrl+R
   - Expected: Exactly 3 Repeater tabs
   - Actual: ___________________________________________
5. [ ] Clear Repeater tabs
6. [ ] **Test C:** Select all (Ctrl+A) → Press Ctrl+R
   - Expected: N Repeater tabs (where N = total requests)
   - Actual: ___________________________________________

**Expected:**
- ✅ N selected requests → N Repeater tabs (NOT always 2!)
- ✅ Each tab has correct request data

**Actual:**
- [ ] PASS / [ ] FAIL
- Notes: ___________________________________________

---

### 3. Bulk Send to Repeater Not Working - FIXED ✅
**File:** `/frontend/src/stores/repeaterStore.ts`
**Fix:** Added panelBridge event listeners, changed to batchToRepeater

**Test Steps:**
1. [ ] Intercept 4 requests
2. [ ] Select 3 requests (checkboxes)
3. [ ] Click "R" button in BulkActionsToolbar
4. [ ] Verify toast: "3 requests sent to Repeater"
5. [ ] Check Repeater panel: Should have 3 new tabs
6. [ ] Open each tab: Verify request data is correct

**Expected:**
- ✅ Bulk send creates N tabs (not 0)
- ✅ Toast notification correct
- ✅ Auto-switch to Repeater panel

**Actual:**
- [ ] PASS / [ ] FAIL
- Notes: ___________________________________________

---

## 🆕 **P0 Features Validation (4/4)**

### 1. Toast Notifications System ✅
**Files:** `/frontend/src/stores/toastStore.ts`, `/frontend/src/components/ToastContainer.tsx`

**Test Steps:**
1. [ ] **Success Toast:** Forward 1 request (Shift+F)
   - Expected: Green toast, "1 request forwarded"
   - Actual: ___________________________________________

2. [ ] **Warning Toast:** Drop 1 request (Shift+D)
   - Expected: Yellow toast, "1 request dropped - Press Ctrl+Z to undo (30s)"
   - Actual: ___________________________________________

3. [ ] **Info Toast:** Send to Repeater (Ctrl+R)
   - Expected: Blue toast, "1 request sent to Repeater"
   - Actual: ___________________________________________

4. [ ] **Error Toast:** Trigger error (e.g., undo after grace period)
   - Expected: Red toast with error message
   - Actual: ___________________________________________

5. [ ] **Auto-Dismiss:** Watch toast for 5-7 seconds
   - Expected: Toast fades out and disappears
   - Actual: ___________________________________________

6. [ ] **Stacking:** Trigger 3 actions quickly
   - Expected: Toasts stack vertically (top-right)
   - Actual: ___________________________________________

**Expected:**
- ✅ 4 toast types work (success, error, info, warning)
- ✅ Auto-dismiss timing correct (~3-7s)
- ✅ Position top-right corner
- ✅ Messages accurate and informative

**Actual:**
- [ ] PASS / [ ] FAIL
- Notes: ___________________________________________

---

### 2. SmartFiltersPanel UI ✅
**File:** `/frontend/src/components/SmartFiltersPanel.tsx`

**Test Steps:**
1. [ ] Open Intercept panel
2. [ ] Locate SmartFiltersPanel (above request queue)
3. [ ] Verify header shows "Smart Filters"
4. [ ] Check active filter count displayed
5. [ ] Click collapse button (if present)
6. [ ] Verify panel collapses
7. [ ] Click expand button
8. [ ] Verify panel expands
9. [ ] Toggle a filter on/off
10. [ ] Check backend logs for WebSocket sync

**Expected:**
- ✅ Panel visible and accessible
- ✅ Collapse/expand animations smooth
- ✅ Filter toggles sync with backend
- ✅ Filter stats update correctly

**Actual:**
- [ ] PASS / [ ] FAIL
- Notes: ___________________________________________

---

### 3. Undo/Redo System with Backend Grace Period ✅ **NEW**
**Files:**
- `/frontend/src/stores/undoStore.ts`
- `/backend/src/core/proxy/request-queue.ts`
- `/backend/src/api/routes/proxy.routes.ts`

**Critical Tests:**

#### Test 3.1: Single Drop Undo (Within 30s Grace Period)
**Test Steps:**
1. [ ] Intercept 1 request
2. [ ] Note request URL: ___________________________________________
3. [ ] Drop request (Shift+D or "D" button)
4. [ ] Verify toast: "1 request dropped - Press Ctrl+Z to undo (30s)"
5. [ ] **WITHIN 30 SECONDS:** Press Ctrl+Z
6. [ ] Verify toast: "Undo successful - 1 request restored to queue"
7. [ ] Verify request appears back in Intercept queue
8. [ ] Verify request is actionable (can forward/drop again)

**Expected:**
- ✅ Request restored to queue successfully
- ✅ Toast success message shown
- ✅ Request has same data as before drop
- ✅ Backend logs show "Request restored to queue (undo successful)"

**Actual:**
- [ ] PASS / [ ] FAIL
- Notes: ___________________________________________

---

#### Test 3.2: Bulk Drop Undo (Within 30s Grace Period)
**Test Steps:**
1. [ ] Intercept 5 requests
2. [ ] Select all 5 (Ctrl+A or manual selection)
3. [ ] Bulk drop (Shift+D)
4. [ ] Verify toast: "5 requests dropped - Press Ctrl+Z to undo (30s)"
5. [ ] **WITHIN 30 SECONDS:** Press Ctrl+Z
6. [ ] Verify toast: "Undo successful - 5 requests restored to queue"
7. [ ] Count requests in queue: Should be 5
8. [ ] Verify all 5 requests visible and correct

**Expected:**
- ✅ All 5 requests restored to queue
- ✅ Toast shows correct count (5)
- ✅ No data loss, all request details intact
- ✅ Queue state correct

**Actual:**
- [ ] PASS / [ ] FAIL
- Notes: ___________________________________________

---

#### Test 3.3: Undo After Grace Period Expired (Should Fail)
**Test Steps:**
1. [ ] Intercept 1 request
2. [ ] Drop request (Shift+D)
3. [ ] Verify toast: "1 request dropped - Press Ctrl+Z to undo (30s)"
4. [ ] **WAIT 31 SECONDS** (let grace period expire)
5. [ ] Press Ctrl+Z (attempt undo)
6. [ ] Verify toast: "Undo failed - Grace period may have expired"
7. [ ] Verify request NOT restored to queue
8. [ ] Check backend logs: "Request finally dropped (grace period expired)"

**Expected:**
- ✅ Undo fails gracefully after grace period
- ✅ Error toast shown with helpful message
- ✅ Request NOT restored (403 already sent to client)
- ✅ Backend logs confirm final drop after 30s

**Actual:**
- [ ] PASS / [ ] FAIL
- Notes: ___________________________________________

---

#### Test 3.4: Multiple Undo Stack (LIFO Order)
**Test Steps:**
1. [ ] Intercept 3 requests (label them A, B, C)
2. [ ] Drop request A (Shift+D on A)
3. [ ] Drop request B (Shift+D on B)
4. [ ] Drop request C (Shift+D on C)
5. [ ] Press Ctrl+Z → Should undo C (Last In, First Out)
6. [ ] Verify: Request C restored
7. [ ] Press Ctrl+Z → Should undo B
8. [ ] Verify: Request B restored
9. [ ] Press Ctrl+Z → Should undo A
10. [ ] Verify: Request A restored
11. [ ] Verify: All 3 requests back in queue

**Expected:**
- ✅ LIFO order respected (C → B → A)
- ✅ All 3 requests restored correctly
- ✅ Each undo shows success toast

**Actual:**
- [ ] PASS / [ ] FAIL
- Notes: ___________________________________________

---

#### Test 3.5: Redo Functionality
**Test Steps:**
1. [ ] Intercept 2 requests
2. [ ] Select both, drop (Shift+D)
3. [ ] Undo drop (Ctrl+Z within 30s)
4. [ ] Verify: 2 requests restored
5. [ ] Press Ctrl+Shift+Z or Ctrl+Y (Redo)
6. [ ] Verify toast: "Re-dropped 2 requests - Press Ctrl+Z to undo again"
7. [ ] Verify: 2 requests dropped again
8. [ ] Undo again (Ctrl+Z)
9. [ ] Verify: 2 requests restored again

**Expected:**
- ✅ Redo re-executes drop action correctly
- ✅ Toast notification accurate
- ✅ Can undo the redo

**Actual:**
- [ ] PASS / [ ] FAIL
- Notes: ___________________________________________

---

#### Test 3.6: Backend API Endpoint (Manual Test)
**Prerequisites:**
- Get access token from browser localStorage (key: `accessToken`)
- Drop 1 request to get its ID (check Network tab → WebSocket messages)

**Test Steps:**
```bash
# Replace YOUR_ACCESS_TOKEN and REQUEST_ID
curl -X POST http://localhost:3000/api/proxy/intercept/undo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"requestIds": ["REQUEST_ID"]}'
```

1. [ ] Call API **within 30s** of dropping request
2. [ ] Verify response:
   ```json
   {
     "success": true,
     "restored": ["REQUEST_ID"],
     "failed": [],
     "message": "Restored 1/1 requests"
   }
   ```
3. [ ] Verify request restored in UI
4. [ ] Drop another request
5. [ ] **Wait 31s** (grace period expired)
6. [ ] Call API again
7. [ ] Verify response:
   ```json
   {
     "success": false,
     "restored": [],
     "failed": ["REQUEST_ID"],
     "message": "Restored 0/1 requests"
   }
   ```

**Expected:**
- ✅ API returns correct success/failure based on grace period
- ✅ Request restoration works via API
- ✅ Grace period enforced at backend level

**Actual:**
- [ ] PASS / [ ] FAIL
- Notes: ___________________________________________

---

#### Test 3.7: Backend Logs Verification
**Test Steps:**
1. [ ] Open backend terminal logs
2. [ ] Drop 1 request
3. [ ] Look for log: `"Request moved to limbo (grace period active)"`
4. [ ] Note timestamp: ___________________________________________
5. [ ] Wait 31 seconds
6. [ ] Look for log: `"Request finally dropped (grace period expired)"`
7. [ ] Note timestamp: ___________________________________________
8. [ ] Calculate difference: Should be ~30 seconds

**Expected:**
- ✅ Limbo log appears immediately on drop
- ✅ Final drop log appears after exactly 30s
- ✅ Grace period timing accurate

**Actual:**
- [ ] PASS / [ ] FAIL
- Time difference: __________ seconds
- Notes: ___________________________________________

---

### 4. BulkActionsToolbar ✅
**File:** `/frontend/src/components/BulkActionsToolbar.tsx`

**Test Steps:**
1. [ ] Intercept 5 requests
2. [ ] Select 3 requests (checkboxes)
3. [ ] Verify BulkActionsToolbar appears
4. [ ] Verify displays "3 selected"
5. [ ] Verify 4 buttons visible: F, D, R, X
6. [ ] Hover over each button
7. [ ] Verify tooltips show:
   - F: "Forward (Shift+F)"
   - D: "Drop (Shift+D)"
   - R: "Repeater (Ctrl+R)"
   - X: "Clear (Esc)"
8. [ ] Click "F" button → 3 requests forwarded
9. [ ] Select 2 more, click "X" button → selection cleared

**Expected:**
- ✅ Toolbar visible on multi-select
- ✅ Count accurate and updates
- ✅ All 4 buttons functional
- ✅ Tooltips informative with shortcuts
- ✅ Color-coded (green, red, purple, gray)

**Actual:**
- [ ] PASS / [ ] FAIL
- Notes: ___________________________________________

---

## ⌨️ **Keyboard Shortcuts Validation**

### Selection Shortcuts
1. [ ] **Ctrl+A** - Select all requests
   - Intercept 5 requests → Press Ctrl+A
   - Expected: All 5 selected
   - Actual: ___________________________________________

2. [ ] **Shift+Click** - Range selection
   - Click request 1 → Shift+Click request 5
   - Expected: Requests 1-5 selected
   - Actual: ___________________________________________

3. [ ] **Esc** - Clear selection
   - Select 3 requests → Press Esc
   - Expected: All selections cleared
   - Actual: ___________________________________________

### Action Shortcuts
1. [ ] **Shift+F** - Forward selected
   - Select 2 requests → Press Shift+F
   - Expected: 2 requests forwarded
   - Actual: ___________________________________________

2. [ ] **Shift+D** - Drop selected
   - Select 3 requests → Press Shift+D
   - Expected: 3 requests dropped (with grace period)
   - Actual: ___________________________________________

3. [ ] **Ctrl+R** - Send to Repeater
   - Select 4 requests → Press Ctrl+R
   - Expected: 4 Repeater tabs created
   - Actual: ___________________________________________

### Undo/Redo Shortcuts
1. [ ] **Ctrl+Z** - Undo
   - Drop 1 request → Press Ctrl+Z within 30s
   - Expected: Request restored
   - Actual: ___________________________________________

2. [ ] **Ctrl+Shift+Z** - Redo
   - After undo → Press Ctrl+Shift+Z
   - Expected: Request dropped again
   - Actual: ___________________________________________

3. [ ] **Ctrl+Y** - Redo (alternative)
   - Same as Ctrl+Shift+Z
   - Expected: Works identically
   - Actual: ___________________________________________

**Status:**
- [ ] All shortcuts functional
- [ ] No conflicts detected
- [ ] Toast feedback for each action

---

## 🚀 **Performance Tests**

### Test 1: Large Queue (100+ Requests)
**Test Steps:**
1. [ ] Configure browser to route all traffic through proxy
2. [ ] Enable intercept mode
3. [ ] Browse to a resource-heavy website (news site, social media)
4. [ ] Let queue fill to 100+ requests
5. [ ] Check UI responsiveness:
   - Scrolling smooth? [ ] Yes / [ ] No
   - Selection works? [ ] Yes / [ ] No
   - Actions responsive? [ ] Yes / [ ] No
6. [ ] Select all (Ctrl+A)
7. [ ] Time operation: __________ ms
8. [ ] Bulk drop all (Shift+D)
9. [ ] Time operation: __________ ms
10. [ ] Undo (Ctrl+Z within 30s)
11. [ ] Time operation: __________ ms

**Expected:**
- ✅ UI remains responsive with 100+ requests
- ✅ Select all completes <1s
- ✅ Bulk drop completes <2s
- ✅ Undo restoration completes <3s
- ✅ No browser freeze or crash

**Actual:**
- [ ] PASS / [ ] FAIL
- Notes: ___________________________________________

---

### Test 2: Memory Leak Check (Grace Period)
**Test Steps:**
1. [ ] Open DevTools → Memory/Performance tab
2. [ ] Baseline memory: __________ MB
3. [ ] Intercept 50 requests
4. [ ] Drop all 50 (Ctrl+A → Shift+D)
5. [ ] Memory after drop: __________ MB
6. [ ] Wait 31 seconds (grace period expires)
7. [ ] Memory after grace period: __________ MB
8. [ ] Repeat cycle 3 times
9. [ ] Final memory: __________ MB

**Expected:**
- ✅ Memory returns to near baseline after grace periods
- ✅ No continuous memory growth (memory leak)
- ✅ Limbo requests properly garbage collected

**Actual:**
- [ ] PASS / [ ] FAIL
- Memory delta: __________ MB
- Notes: ___________________________________________

---

## 🌐 **Browser Compatibility**

### Chrome/Chromium
- [ ] All features work correctly
- [ ] No console errors or warnings
- [ ] Toast notifications render properly
- [ ] Keyboard shortcuts functional
- [ ] Performance acceptable

### Firefox
- [ ] All features work correctly
- [ ] No console errors or warnings
- [ ] Toast notifications render properly
- [ ] Keyboard shortcuts functional
- [ ] Performance acceptable

### Safari (if available)
- [ ] All features work correctly
- [ ] No console errors or warnings
- [ ] Toast notifications render properly
- [ ] Keyboard shortcuts functional
- [ ] Performance acceptable

**Status:**
- [ ] All tested browsers compatible
- Issues: ___________________________________________

---

## 📊 **Test Summary**

### Compilation ✅
- [x] Backend: PASS (0 errors)
- [x] Frontend: PASS (0 errors)

### Bug Fixes (3/3)
- [ ] AI Analyze 400 Error: PASS / FAIL
- [ ] Ctrl+R Always Adds 2 Requests: PASS / FAIL
- [ ] Bulk Send to Repeater: PASS / FAIL

### P0 Features (4/4)
- [ ] Toast Notifications: PASS / FAIL
- [ ] SmartFiltersPanel: PASS / FAIL
- [ ] Undo/Redo System: PASS / FAIL
- [ ] BulkActionsToolbar: PASS / FAIL

### Undo/Redo Sub-Tests (7/7)
- [ ] Single drop undo within grace: PASS / FAIL
- [ ] Bulk drop undo within grace: PASS / FAIL
- [ ] Undo after grace expired: PASS / FAIL
- [ ] Multiple undo stack (LIFO): PASS / FAIL
- [ ] Redo functionality: PASS / FAIL
- [ ] Backend API endpoint: PASS / FAIL
- [ ] Backend logs timing: PASS / FAIL

### Keyboard Shortcuts (9/9)
- [ ] All tested and functional: PASS / FAIL

### Performance (2/2)
- [ ] Large queue (100+ requests): PASS / FAIL
- [ ] Memory leak check: PASS / FAIL

### Browser Compatibility
- [ ] Chrome: PASS / FAIL
- [ ] Firefox: PASS / FAIL
- [ ] Safari: PASS / FAIL / N/A

---

## 🎯 **Overall Status**

**Total Tests:** 40+
**Passed:** _____
**Failed:** _____
**Blocked:** _____

**Critical Issues Found:**
1. ___________________________________________
2. ___________________________________________
3. ___________________________________________

**Minor Issues Found:**
1. ___________________________________________
2. ___________________________________________
3. ___________________________________________

**Recommendations:**
1. ___________________________________________
2. ___________________________________________
3. ___________________________________________

---

## ✅ **Production Readiness Sign-off**

**Tester:** ___________________________________________
**Date:** ___________________________________________
**Environment:** Dev / Staging / Prod
**Browser(s) Used:** ___________________________________________
**Version:** ___________________________________________

**Status:**
- [ ] ✅ APPROVED FOR PRODUCTION (All tests pass)
- [ ] ⚠️ APPROVED WITH NOTES (Minor issues documented)
- [ ] ❌ NOT APPROVED (Critical issues found)

**Deployment Blockers:**
___________________________________________
___________________________________________

**Post-Deployment Monitoring:**
1. Monitor backend logs for grace period timing
2. Check memory usage over 24h period
3. Monitor undo/redo API endpoint success rate
4. Track user feedback on undo functionality

**Notes:**
___________________________________________
___________________________________________
___________________________________________
