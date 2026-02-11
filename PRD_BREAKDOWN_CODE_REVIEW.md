# Comprehensive Code Review: PRD Breakdown Implementation

**Review Date:** 2026-02-11
**Scope:** PRD Breakdown critical flows (ticket selection, draft saving, draft resumption, ticket creation)
**Status:** 4 flows reviewed, multiple issues found

---

## FLOW 1: Ticket Selection (Phase 1)

### Files Reviewed
- `client/src/tickets/components/prd/TicketCard.tsx` (checkbox logic)
- `client/src/tickets/components/prd/BreakdownReview.tsx` (select all/deselect all)
- `client/src/tickets/components/prd/EpicGroup.tsx` (epic totals)
- `client/src/tickets/stores/prd-breakdown.store.ts` (selection state)

### ✅ What Works Correctly

1. **Checkbox state reflects store state** (TicketCard.tsx:186, 211-212)
   - Opacity changes based on `ticket.isSelected`
   - Checkbox border and background color update correctly
   - Check icon displays when selected

2. **Selection state persists in Zustand store** (prd-breakdown.store.ts:306-335)
   - `toggleTicketSelection()` properly updates all references (lines 310-335)
   - Both `breakdown.tickets` and `breakdown.summary.epics[].stories` are synchronized
   - No orphaned references

3. **Select All/Deselect All buttons work** (prd-breakdown.store.ts:337-395)
   - Both actions map over all tickets and update isSelected uniformly
   - Epic summaries are properly updated in parallel
   - Button disabled states are correct (BreakdownReview.tsx:288, 296)

4. **Count display accuracy** (BreakdownReview.tsx:133-135)
   - `selectedCount = breakdown.tickets.filter((t) => t.isSelected).length`
   - Calculation happens at render time, always current
   - Total count: `breakdown.tickets.length` is correct

5. **Epic totals update correctly** (EpicGroup.tsx:124)
   - Shows `epic.stories.length` which is updated by store mutations
   - No caching issues observed

### ⚠️ Potential Issues Found

#### Issue 1: Selection State Not Cleared When Tickets Deleted
**Severity:** Medium
**Location:** prd-breakdown.store.ts:204-231 (deleteTicket action)

**Problem:**
```typescript
deleteTicket: (ticketId) =>
  set((state) => {
    if (!state.breakdown) return state;
    const updatedTickets = state.breakdown.tickets.filter(
      (t) => t.id !== ticketId,  // ✅ Removed from main list
    );
    // epics updated...
    return { breakdown: { ... } };  // ✅ Proper update
  }),
```

**Why it's an issue:**
- When a ticket is deleted, its isSelected state is lost
- But the selected count only re-filters the remaining tickets
- This is actually fine! The selected count will automatically adjust.

**Verdict:** NOT AN ISSUE - Working as intended.

#### Issue 2: Store Mutation Order - Multiple Rebuilds
**Severity:** Low (performance, not correctness)
**Location:** prd-breakdown.store.ts:306-335, 337-395

**Problem:**
Every selection action rebuilds THREE structures:
1. `updatedTickets` array (line 310)
2. `updatedEpics` array (line 317)
3. Both stored in nested `breakdown` object

For 100 tickets, this means ~300 object allocations per toggle.

**What this means:**
- Not a correctness issue (state is properly updated)
- Minor performance degradation for large breakdowns (100+ tickets)
- React reconciliation still works (immutable updates)

**Verdict:** NOT CRITICAL - Acceptable for MVP scale.

#### Issue 3: Key Prop in Epic Group Stories Render
**Severity:** Low
**Location:** EpicGroup.tsx:135

**Problem:**
```typescript
{epic.stories.map((ticket, index) => (
  <div
    key={`drop-zone-${ticket.id}`}  // ✅ Using ticket.id
```

**Analysis:**
- Key is stable (based on ticket.id, not index)
- Drag/drop uses index positions correctly (line 47)
- No reconciliation issues observed

**Verdict:** NOT AN ISSUE - Keys are correct.

### 🔧 Recommended Improvements (Optional)

1. **Optimize selection mutations** - Memoize the ticket/epic rebuilding:
```typescript
// Instead of rebuilding entire breakdown object each time,
// could use immer middleware to simplify immutable updates
```

2. **Add visual feedback for selection count threshold**
   - Currently disables "Enrich & Create" at 0 selections
   - Could show warning at >50 selections to prevent accidental bulk operations

### 📝 Edge Cases to Test

1. ✅ Select all → deselect one → select all again
2. ✅ Delete all selected tickets → verify count goes to 0
3. ✅ Add new ticket → verify it's selected by default (addTicket sets isSelected=true)
4. ⚠️ Rapidly toggle same ticket 10 times → verify consistency
5. ✅ Select, navigate to another epic, verify selection persists

---

## FLOW 2: Draft Saving (Phase 2)

### Files Reviewed
- `client/src/services/prd.service.ts` (saveDraft, getLatestDraft)
- `client/src/tickets/components/prd/BreakdownReview.tsx` (auto-save logic)
- `client/src/tickets/stores/prd-breakdown.store.ts` (draft state)

### ✅ What Works Correctly

1. **Debounce implemented correctly** (BreakdownReview.tsx:72-104)
   - `useRef<NodeJS.Timeout>` pattern prevents race conditions (line 69)
   - 2-second debounce window (line 90)
   - Timeout cleared before setting new one (lines 75-76)
   - Cleanup happens on unmount (lines 99-103)

2. **Auto-save triggers on breakdown changes** (BreakdownReview.tsx:94-104)
   - useEffect depends on `breakdown, handleAutoSave` (line 104)
   - `handleAutoSave` dependency includes `breakdown, prdText, projectName` (line 91)
   - Proper closure over store values

3. **Draft ID is unique** (prd.service.ts:247)
   - Uses `Date.now()` timestamp - sufficient for MVP
   - Also stores UUID would be better for production, but Date.now() is acceptable for single-user browser storage

4. **Draft persistence to localStorage** (prd.service.ts:242-265)
   - Wraps with `try/catch` for quota exceeded (lines 257-264)
   - Updates both specific draft and "latest" pointer (lines 258-260)
   - Returns draftId for tracking

5. **Save indicator in UI** (BreakdownReview.tsx:314-327)
   - Shows "Saving draft..." during 2s window
   - Shows "Saved Xs ago" with timestamp
   - Elapsed time updates correctly (lines 107-117)

### ⚠️ Potential Issues Found

#### Issue 1: CRITICAL - Multiple Concurrent Save Attempts
**Severity:** HIGH (data loss risk)
**Location:** BreakdownReview.tsx:72-104

**Problem:**
```typescript
const handleAutoSave = useCallback(() => {
  if (!breakdown) return;

  if (saveTimeoutRef.current) {
    clearTimeout(saveTimeoutRef.current);  // ✅ Clear existing
  }

  saveTimeoutRef.current = setTimeout(async () => {
    try {
      setIsSaving(true);
      await prdService.saveDraft(breakdown, prdText, projectName);  // ⚠️ No error recovery
      setLastSavedAt(new Date());
    } catch (error) {
      console.error('Failed to auto-save draft:', error);  // ❌ Silent failure!
    } finally {
      setIsSaving(false);
    }
  }, 2000);
}, [breakdown, prdText, projectName]);
```

**The Bug:**
If save fails, the component doesn't:
- Show error to user
- Retry the save
- Persist the failure state

User edits disappear if localStorage quota is exceeded.

**Scenario:**
1. User has 4.5MB breakdown (valid, just large)
2. Tries to save to localStorage (5MB quota)
3. JSON.stringify succeeds, but setItem() fails (line 258)
4. Catch block logs to console only
5. User sees "Saved 5s ago" but data was never saved!

**Test Case:**
```
// Simulate quota exceeded
const mockLocalStorage = {
  setItem: () => { throw new Error('QuotaExceededError'); }
};
// Save draft → UI shows success, but nothing was saved
```

#### Issue 2: Missing Error State Display
**Severity:** HIGH
**Location:** BreakdownReview.tsx:86, 314-327

**Problem:**
- No error state in component local state
- No UI feedback when save fails
- `setIsSaving(false)` runs, but never `setError(true)`

**Impact:**
User thinks changes are saved when they aren't.

#### Issue 3: Race Condition - Multiple Saves to Same Draft
**Severity:** MEDIUM
**Location:** prd.service.ts:247-261

**Problem:**
```typescript
async saveDraft(breakdown, prdText, projectName) {
  const draftId = `draft-${Date.now()}`;  // ⚠️ New ID each time!
  // ...
  localStorage.setItem('prd-breakdown-latest', draftId);  // ⚠️ Overwrites previous
  return draftId;
}
```

**Scenario:**
1. User makes edits → Draft A saved (`draft-1707553200000`)
2. 500ms later → More edits → Draft B saved (`draft-1707553200500`)
3. Both stored in localStorage, but only B is marked "latest"
4. Draft A is orphaned but still uses disk space

**Impact:**
- localStorage slowly fills with orphaned drafts
- Eventually hits quota limit
- Old drafts become unretrievable (no index)

**Workaround Currently:**
- The "latest" pointer prevents loading old drafts
- But orphaned data persists

#### Issue 4: localStorage Quota Exceeded - No Recovery
**Severity:** HIGH
**Location:** prd.service.ts:257-264

**Problem:**
```typescript
try {
  localStorage.setItem(`prd-breakdown-${draftId}`, JSON.stringify(draft));
  localStorage.setItem('prd-breakdown-latest', draftId);
  return draftId;
} catch (error) {
  throw new Error('Failed to save draft to local storage');  // ❌ Generic error
}
```

**Issues:**
- Doesn't distinguish between quota exceeded vs. other errors
- No recovery strategy (e.g., "delete old drafts to free space")
- User gets cryptic error message

**Real Scenario:**
- User has 150 artifacts across browser (cookies, other apps)
- localStorage is already 4.8MB full
- Next save fails with quota error
- Error message: "Failed to save draft to local storage"
- User has no way to recover

#### Issue 5: No Timestamp Validation in saveDraft
**Severity:** LOW
**Location:** prd.service.ts:247

**Problem:**
```typescript
const draftId = `draft-${Date.now()}`;  // ⚠️ Relies on system clock
const draft = {
  id: draftId,
  // ...
  createdAt: new Date().toISOString(),  // ⚠️ Called separately
  updatedAt: new Date().toISOString(),
};
```

**Edge Case:**
If system clock goes backward (DST, manual adjustment), could create:
- Draft with ID `draft-1707553200000`
- Then Draft with ID `draft-1707553100000` (older!)
- Sorting by timestamp breaks

**Impact:** Very rare, but possible on:
- Browser running on VM with clock sync issues
- Manual clock adjustment
- DST transition edge cases

### 🔧 Recommended Fixes (Priority Order)

#### FIX 1 (HIGH PRIORITY): Add Error State and Retry
```typescript
// In BreakdownReview.tsx
const [saveError, setSaveError] = useState<string | null>(null);

const handleAutoSave = useCallback(() => {
  if (!breakdown) return;

  if (saveTimeoutRef.current) {
    clearTimeout(saveTimeoutRef.current);
  }

  saveTimeoutRef.current = setTimeout(async () => {
    try {
      setIsSaving(true);
      setSaveError(null);  // Clear previous error
      await prdService.saveDraft(breakdown, prdText, projectName);
      setLastSavedAt(new Date());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Save failed';
      setSaveError(message);
      // Auto-retry after 5 seconds
      setTimeout(() => {
        handleAutoSave();  // Recursive retry
      }, 5000);
    } finally {
      setIsSaving(false);
    }
  }, 2000);
}, [breakdown, prdText, projectName]);

// In JSX, after line 327:
{saveError && (
  <div className="text-xs flex items-center gap-2 p-3 bg-red-100/20 rounded border border-red-300">
    <AlertCircle className="w-4 h-4 text-red-600" />
    <span className="text-red-600">Auto-save failed: {saveError}</span>
    <button onClick={handleAutoSave} className="text-red-600 underline ml-auto">
      Retry
    </button>
  </div>
)}
```

#### FIX 2 (HIGH PRIORITY): Distinguish Quota Errors
```typescript
// In prd.service.ts
async saveDraft(breakdown, prdText, projectName) {
  const draftId = `draft-${Date.now()}`;
  const draft = { /* ... */ };

  try {
    localStorage.setItem(`prd-breakdown-${draftId}`, JSON.stringify(draft));
    localStorage.setItem('prd-breakdown-latest', draftId);
    return draftId;
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      throw new Error(
        'Storage quota exceeded. Please delete old drafts or clear browser data to continue.'
      );
    }
    throw new Error('Failed to save draft: ' + (error instanceof Error ? error.message : 'Unknown'));
  }
}
```

#### FIX 3 (MEDIUM PRIORITY): Reuse Draft ID Instead of Creating New
```typescript
// Option A: Reuse latest draft ID
// In BreakdownReview.tsx: track currentDraftId in store
async saveDraft(breakdown, prdText, projectName) {
  const draftId = getCurrentDraftId() || `draft-${Date.now()}`;
  // ...
  localStorage.setItem(`prd-breakdown-${draftId}`, JSON.stringify(draft));
}

// Option B: Delete old drafts before new save
// Before line 258 in prd.service.ts
const keys = Object.keys(localStorage)
  .filter(k => k.startsWith('prd-breakdown-draft-'))
  .sort()
  .slice(0, -4);  // Keep only latest 5 drafts
keys.forEach(k => localStorage.removeItem(k));
```

#### FIX 4 (LOW PRIORITY): Add Secure ID Generation
```typescript
// Instead of Date.now(), use:
const draftId = `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
```

### 📝 Edge Cases to Test

1. ❌ **localStorage quota exceeded**
   - Fill localStorage to 4.9MB
   - Try to save breakdown
   - Verify error message is helpful
   - Verify user can retry

2. ❌ **Rapid edits (10 changes in 1 second)**
   - Each should cancel previous timeout
   - Only 1 final save should occur

3. ❌ **Network/storage failure mid-save**
   - Save starts, then localStorage.setItem fails
   - Verify error displayed and retry available

4. ✅ **Navigate away during save**
   - User closes tab while save in progress
   - Data should be saved by prdService (no deps on component)

5. ⚠️ **System clock goes backward**
   - Very rare, but drafts could get out of order
   - Current implementation doesn't handle this

6. ✅ **Multiple browser tabs with PRD Breakdown**
   - Both try to save to same localStorage
   - One wins, other's latest pointer may be stale
   - getLatestDraft() will load the latest anyway

---

## FLOW 3: Draft Resumption (Phase 2)

### Files Reviewed
- `client/src/tickets/components/prd/PRDInputForm.tsx` (resume banner, handleResumeDraft)
- `client/src/services/prd.service.ts` (getLatestDraft)
- `client/src/tickets/stores/prd-breakdown.store.ts` (resumeDraft action)

### ✅ What Works Correctly

1. **Latest draft detection on mount** (PRDInputForm.tsx:38-53)
   - useEffect runs once on mount (empty dependency array would be better)
   - Actually has `prdService` as stable singleton (comment at line 40)
   - Silently fails if no draft found (line 50)

2. **24-hour draft expiration** (prd.service.ts:306-311)
   - Correctly filters old drafts
   - Comparison: `createdAt < oneDayAgo`
   - Returns null for expired drafts

3. **Resume button in UI** (PRDInputForm.tsx:149-157)
   - Calls `resumeDraft(savedDraft)` action
   - Moves user to review step
   - Shows ticket count in banner

4. **Dismiss draft removes from storage** (PRDInputForm.tsx:62-73)
   - Calls `prdService.deleteDraft()`
   - Updates store state
   - Hides banner

5. **Draft info display** (PRDInputForm.tsx:144-145)
   - Shows date and ticket count
   - User sees what they're resuming

### ⚠️ Potential Issues Found

#### Issue 1: CRITICAL - resumeDraft() Doesn't Fully Restore State
**Severity:** HIGH (data loss / incomplete restoration)
**Location:** prd-breakdown.store.ts:420-433

**Problem:**
```typescript
resumeDraft: (draft: any) => {
  if (!draft) return;

  set({
    prdText: draft.prdText || '',  // ✅ Restores input
    projectName: draft.projectName || '',  // ✅ Restores project
    breakdown: draft.breakdown || null,  // ✅ Restores breakdown
    analysisTime: draft.breakdown?.analysisTime || null,  // ⚠️ BUG!
    estimatedTicketsCount: draft.breakdown?.totalTickets || null,  // ⚠️ BUG!
    currentStep: 'review',  // ✅ Moves to review
    currentDraftId: draft.id,  // ✅ Stores draft ID
    hasSavedDraft: true,  // ✅ Marks as saved
  });
},
```

**The Bug:**
```typescript
// Line 428 reads from wrong path:
analysisTime: draft.breakdown?.analysisTime || null,

// But in saveDraft (prd.service.ts:252-254):
const draft = {
  id: draftId,
  prdText,
  projectName,
  breakdown,  // ← breakdown object
  createdAt,
  updatedAt,
};

// And analysisTime is stored at root level of Zustand state,
// NOT inside breakdown object!
```

**Scenario:**
1. User saves breakdown with analysisTime: 15000
2. Reload or resume draft
3. Line 428 tries to read `draft.breakdown?.analysisTime` → undefined!
4. Sets `analysisTime: null`
5. Summary cards show "—" instead of "00:15:00"

**Impact:**
- User sees "ANALYSIS TIME: —" instead of actual time
- Loss of metadata (user doesn't know analysis took 15s)
- Data is still intact, but UI feedback is lost

#### Issue 2: Missing analysisTime in Saved Draft
**Severity:** HIGH
**Location:** prd.service.ts:242-265 (saveDraft method)

**Problem:**
```typescript
async saveDraft(breakdown: BreakdownResult, prdText: string, projectName?: string) {
  const draftId = `draft-${Date.now()}`;
  const draft = {
    id: draftId,
    prdText,
    projectName,
    breakdown,  // ← Contains breakdown.totalTickets but NOT analysisTime!
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  // ...
}
```

**The Real Bug:**
- `BreakdownResult` interface (prd-breakdown.store.ts:57-60) only has:
  ```typescript
  interface BreakdownResult {
    tickets: BreakdownTicket[];
    summary: BreakdownSummary;
  }
  ```
- analysisTime and estimatedTicketsCount are stored separately in Zustand state
- When saveDraft() is called, these values are NOT passed!

**Check in BreakdownReview.tsx:83:**
```typescript
await prdService.saveDraft(breakdown, prdText, projectName);
// ❌ NOT passing analysisTime or estimatedTicketsCount!
```

**Impact:**
- Resumed draft doesn't show analysis time
- Summary cards lose critical metadata

#### Issue 3: JSON.parse() Not Wrapped in Try/Catch
**Severity:** MEDIUM (corrupted draft recovery)
**Location:** prd.service.ts:305

**Problem:**
```typescript
async getLatestDraft(): Promise<any | null> {
  // ...
  try {
    const draftId = localStorage.getItem('prd-breakdown-latest');
    if (!draftId) {
      return null;
    }

    const draft = localStorage.getItem(`prd-breakdown-${draftId}`);
    if (!draft) {
      return null;
    }

    const parsed = JSON.parse(draft);  // ❌ Can throw if JSON corrupted
    // Rest of function...
  } catch (error) {
    return null;  // ✅ Outer catch, but...
  }
}
```

**Scenario:**
1. User has saved draft: `{"breakdown":{...large JSON...}}`
2. Browser crashes mid-save, corrupts the JSON
3. getLatestDraft() tries JSON.parse()
4. Throws SyntaxError
5. Silently returns null (line 315)
6. User sees "no saved draft" but data might be recoverable

**Impact:**
- Silent failure for corrupted drafts
- No way to manually recover
- User loses work

#### Issue 4: No Validation of Draft Schema
**Severity:** MEDIUM
**Location:** prd.service.ts:289-317 and prd-breakdown.store.ts:420-433

**Problem:**
```typescript
const parsed = JSON.parse(draft);  // ❌ No validation
// Assumes: parsed.prdText, parsed.projectName, parsed.breakdown exist

// Then in store:
resumeDraft: (draft: any) => {  // ⚠️ accepts any!
  if (!draft) return;
  set({
    prdText: draft.prdText || '',  // Defensive, but
    breakdown: draft.breakdown || null,  // ← missing schema check
  });
}
```

**Scenario:**
1. User manually edits localStorage to mess with draft
2. Loads draft with missing `breakdown` field
3. Store sets `breakdown: null`
4. User clicks "Resume"
5. Lands on review page with empty breakdown
6. All tickets disappear

**Impact:**
- No recovery if draft structure is wrong
- User sees blank review page

#### Issue 5: 24-hour Expiration Uses createdAt, Not updatedAt
**Severity:** LOW (unexpected behavior)
**Location:** prd.service.ts:306-310

**Problem:**
```typescript
const createdAt = new Date(parsed.createdAt);
const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
if (createdAt < oneDayAgo) {
  return null;  // Draft expired
}
```

**Scenario:**
1. User creates draft at Monday 10:00 AM
2. Works on it all day, auto-saves 50 times (updatedAt changes but createdAt doesn't)
3. Tuesday 10:01 AM: Draft is marked expired
4. User has been actively working on it yesterday, but it's gone!

**Expected Behavior:**
Should check `updatedAt` instead (or max of both).

### 🔧 Recommended Fixes (Priority Order)

#### FIX 1 (CRITICAL): Pass analysisTime and estimatedTicketsCount to saveDraft
```typescript
// In prd.service.ts, update signature:
async saveDraft(
  breakdown: BreakdownResult,
  prdText: string,
  projectName?: string,
  analysisTime?: number,  // ← Add
  estimatedTicketsCount?: number  // ← Add
): Promise<string> {
  const draftId = `draft-${Date.now()}`;
  const draft = {
    id: draftId,
    prdText,
    projectName,
    breakdown,
    analysisTime,  // ← Store at root level
    estimatedTicketsCount,  // ← Store at root level
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  // ... rest unchanged
}

// In BreakdownReview.tsx, line 83:
await prdService.saveDraft(
  breakdown,
  prdText,
  projectName,
  analysisTime,  // ← Pass from store
  estimatedTicketsCount  // ← Pass from store
);
```

#### FIX 2 (CRITICAL): Fix resumeDraft to Read from Correct Path
```typescript
// In prd-breakdown.store.ts, update resumeDraft:
resumeDraft: (draft: any) => {
  if (!draft) return;

  set({
    prdText: draft.prdText || '',
    projectName: draft.projectName || '',
    breakdown: draft.breakdown || null,
    analysisTime: draft.analysisTime || null,  // ← Now reads correct path
    estimatedTicketsCount: draft.estimatedTicketsCount || null,  // ← Correct path
    currentStep: 'review',
    currentDraftId: draft.id,
    hasSavedDraft: true,
  });
}
```

#### FIX 3 (MEDIUM): Add Draft Schema Validation
```typescript
// In prd.service.ts, after JSON.parse:
const parsed = JSON.parse(draft);

// Validate schema
if (
  !parsed.breakdown ||
  typeof parsed.prdText !== 'string' ||
  !Array.isArray(parsed.breakdown.tickets)
) {
  throw new Error('Invalid draft schema');
}

// Then in try/catch around JSON.parse:
try {
  const parsed = JSON.parse(draft);
  // Validate...
  const createdAt = new Date(parsed.createdAt);
  // ... rest
} catch (error) {
  // Log specific error for debugging
  console.warn('Failed to load draft:', error instanceof Error ? error.message : 'Unknown error');
  return null;
}
```

#### FIX 4 (MEDIUM): Use updatedAt for Expiration
```typescript
// In prd.service.ts, line 307:
const relevantDate = new Date(parsed.updatedAt || parsed.createdAt);
const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
if (relevantDate < oneDayAgo) {
  return null;
}
```

### 📝 Edge Cases to Test

1. ❌ **Resume draft after 24+ hours**
   - Draft should be expired and unavailable
   - Verify using createdAt, not updatedAt (per bug above)

2. ❌ **Corrupted localStorage JSON**
   - Manually corrupt the draft JSON in DevTools
   - Reload page
   - Verify graceful failure (no crash)

3. ✅ **Draft missing analysisTime**
   - Create draft the old way (before fix)
   - Resume it
   - Verify analysis time shows as "—"

4. ⚠️ **Manual ticket edits, then resume**
   - Edit a ticket in review page
   - Navigate away
   - Resume draft
   - Verify edits are restored

5. ❌ **Multiple browser tabs resuming same draft**
   - Open PRD Breakdown in 2 tabs
   - Edit in tab 1, save
   - Reload tab 2
   - Verify it loads latest from tab 1

---

## FLOW 4: Ticket Creation (Phase 1 + 2)

### Files Reviewed
- `client/src/tickets/components/prd/BreakdownReview.tsx` (handleCreateTickets)
- `client/src/services/prd.service.ts` (bulkCreateFromBreakdown)
- `client/src/tickets/stores/prd-breakdown.store.ts` (breakdown state)

### ✅ What Works Correctly

1. **Only selected tickets sent to API** (BreakdownReview.tsx:150-158)
   - Line 133: `selectedTickets = breakdown.tickets.filter((t) => t.isSelected)`
   - Line 150: Maps only `selectedTickets`
   - Non-selected tickets are never sent

2. **Selection validation before creation** (BreakdownReview.tsx:141-144)
   ```typescript
   if (selectedTickets.length === 0) {
     setCreationError('No tickets selected...');
     return;  // ✅ Early exit
   }
   ```

3. **Acceptance criteria serialization** (BreakdownReview.tsx:156)
   ```typescript
   acceptanceCriteria: JSON.stringify(ticket.acceptanceCriteria),
   ```
   - Uses JSON.stringify for serialization
   - Backend expects JSON string (per BulkCreateRequest interface)

4. **Error handling for partial failures** (BreakdownReview.tsx:168-174)
   - Filters results by `r.ticketId` (line 164)
   - Separates errors from successes (line 168)
   - Shows per-ticket error messages (line 171)

5. **API response mapping** (BreakdownReview.tsx:163-165)
   ```typescript
   const createdIds = result.results
     .filter((r) => r.ticketId)
     .map((r) => r.ticketId!);
   ```
   - Extracts ticket IDs preserving order (filter before map)
   - Non-null assertion is safe (filter ensures r.ticketId exists)

6. **Enrichment wizard shown only for successful tickets** (BreakdownReview.tsx:177-179)
   - Only if `createdIds.length > 0`
   - Wizard receives correct ticket IDs

### ⚠️ Potential Issues Found

#### Issue 1: CRITICAL - State Reads Stale selectedTickets
**Severity:** HIGH (tickets created but selection state lost)
**Location:** BreakdownReview.tsx:133-146

**Problem:**
```typescript
const selectedTickets = breakdown.tickets.filter((t) => t.isSelected);
const selectedCount = selectedTickets.length;
const totalCount = breakdown.tickets.length;

// Later in handleCreateTickets:
const handleCreateTickets = async () => {
  setCreationError(null);
  setError(null);

  if (selectedTickets.length === 0) {  // ❌ STALE CLOSURE!
    setCreationError('No tickets selected...');
    return;
  }

  const request = {
    tickets: selectedTickets.map((ticket) => ({  // ❌ STALE!
      // ...
    })),
  };
```

**Why It's a Bug:**
- `selectedTickets` is calculated at render time (line 133)
- `handleCreateTickets` is defined in component body
- React doesn't re-capture it on every render (it's re-defined every render, but closure captures old value)
- Actually, NO - this is CORRECT! In React function components, the callback captures current values.

**Verdict:** NOT AN ISSUE - React properly re-renders and updates closure.

Actually, let me verify this is correct by checking useCallback:

The function doesn't use useCallback, which means:
- Function is redefined on every render
- Always captures current `selectedTickets` value
- This is correct behavior for this case

#### Issue 2: CRITICAL - Accepting "broken" Breakdown State
**Severity:** CRITICAL
**Location:** BreakdownReview.tsx:119-130

**Problem:**
```typescript
if (!breakdown) {
  return (
    <div className="p-6 rounded-lg border">
      <p>No breakdown data available</p>
    </div>
  );
}

const selectedTickets = breakdown.tickets.filter((t) => t.isSelected);
// ✅ Safe - breakdown is checked
```

**Actually OK:** Early return prevents null access.

#### Issue 3: JSON.stringify on Circular References
**Severity:** MEDIUM
**Location:** BreakdownReview.tsx:156

**Problem:**
```typescript
acceptanceCriteria: JSON.stringify(ticket.acceptanceCriteria),
```

**Potential Issue:**
If BDDCriterion contains circular references (e.g., parent pointer), JSON.stringify throws.

**Scenario:**
1. User creates acceptance criterion
2. Somehow criterion has circular ref (unlikely but possible if store is malicious)
3. JSON.stringify() throws
4. API call fails with "Converting circular structure to JSON"

**Impact:**
Low probability, but would cause cryptic error message.

**Fix:**
```typescript
try {
  acceptanceCriteria: JSON.stringify(ticket.acceptanceCriteria),
} catch (error) {
  // Handle stringify error
  console.error('Failed to serialize criteria:', error);
  throw new Error(`Invalid acceptance criteria for ticket: ${ticket.title}`);
}
```

#### Issue 4: Missing Pre-Creation Validation
**Severity:** MEDIUM
**Location:** BreakdownReview.tsx:137-158

**Problem:**
```typescript
const request = {
  tickets: selectedTickets.map((ticket) => ({
    epicName: ticket.epicName,  // ⚠️ No validation
    title: ticket.title,  // ⚠️ Could be empty
    description: ticket.description,  // ⚠️ Could be ""
    type: ticket.type,  // ⚠️ Could be invalid enum
    priority: ticket.priority,
    acceptanceCriteria: JSON.stringify(ticket.acceptanceCriteria),
  })),
};
```

**Scenarios:**
1. User deletes ticket title → becomes ""
2. User selects invalid type during edit
3. Backend returns 400 error

**Missing Validation:**
- title is not empty
- type is valid ('feature' | 'bug' | 'task')
- priority is valid
- acceptanceCriteria is valid JSON

#### Issue 5: No Retry Logic on Creation Failure
**Severity:** MEDIUM
**Location:** BreakdownReview.tsx:137-190

**Problem:**
```typescript
try {
  const result = await prdService.bulkCreateFromBreakdown(request);
  // ... handle result
} catch (err) {
  const message = err instanceof Error ? err.message : 'Failed to create tickets';
  setCreationError(message);
  setCreating(false);  // ❌ No retry button!
}
```

**Scenario:**
1. Network hiccup during ticket creation
2. API returns 500 error
3. Error shown to user: "Failed to create tickets"
4. Button disabled (isCreating=false)
5. User must reload or go back and start over

**Expected:**
Show "Retry" button on error.

#### Issue 6: Missing Workspace Isolation in Frontend
**Severity:** MEDIUM (trust issue, backend should catch)
**Location:** BreakdownReview.tsx:149-158

**Problem:**
No client-side workspace validation before creating tickets.

**Scenario:**
1. User A in workspace A loads breakdown
2. User B logs in as different user
3. User A's selected tickets still in state
4. User A clicks "Enrich & Create"
5. API receives workspace ID from auth token
6. Backend validates ownership (per session 15 notes)
7. Should be fine!

**Verdict:** Backend handles this correctly per commit 57b0008. Frontend doesn't need to.

#### Issue 7: BDD Criteria Serialization Roundtrip
**Severity:** LOW
**Location:** BreakdownReview.tsx:156 and backend

**Problem:**
```typescript
// Frontend sends:
acceptanceCriteria: JSON.stringify(ticket.acceptanceCriteria)  // String

// Backend receives (per notes):
acceptanceCriteria: string  // In DTO

// Backend saves to DB:
BDD criteria parsed and stored

// When loaded:
Returns BDD criteria array
```

**Potential Issue:**
If user creates criterion with special characters, roundtrip might fail.

**Test Case:**
```
Given: "User's email"  // Apostrophe
When: 'clicks "Sign up"'  // Quotes within quotes
Then: "Email is validated"

JSON.stringify() → "Given: \"User's email\""
JSON.parse() → Back to object
```

**Verdict:** Should work, but worth testing.

#### Issue 8: No Maximum Selection Limit
**Severity:** LOW
**Location:** BreakdownReview.tsx:337-339

**Problem:**
```typescript
{isCreating
  ? `Creating ${selectedCount} tickets...`
  : `Enrich & Create ${selectedCount > 0 ? selectedCount : 0} Tickets`}
```

No limit on how many tickets can be selected and created.

**Scenario:**
1. User selects all 500 tickets from breakdown
2. Clicks "Enrich & Create"
3. Server tries to create 500 tickets in parallel
4. Request timeout, OOM, or rate limit hit

**Backend has limits:**
- Per commit c2452b1: `@ArrayMaxSize(100)` on BulkEnrichDto
- But frontend doesn't prevent selecting 200+ tickets

**UI Issue:**
User selects tickets, clicks create, gets error, has to deselect and retry.

### 🔧 Recommended Fixes (Priority Order)

#### FIX 1 (MEDIUM): Add Pre-Creation Validation
```typescript
const handleCreateTickets = async () => {
  setCreationError(null);
  setError(null);

  if (selectedTickets.length === 0) {
    setCreationError('No tickets selected. Please select at least one ticket to create.');
    return;
  }

  // Validate each ticket before sending
  const validationErrors: string[] = [];
  selectedTickets.forEach((ticket) => {
    if (!ticket.title?.trim()) {
      validationErrors.push(`Ticket ${ticket.storyIndex}: Title is required`);
    }
    if (!['feature', 'bug', 'task'].includes(ticket.type)) {
      validationErrors.push(`Ticket ${ticket.storyIndex}: Invalid type "${ticket.type}"`);
    }
    if (!['low', 'medium', 'high', 'urgent'].includes(ticket.priority)) {
      validationErrors.push(`Ticket ${ticket.storyIndex}: Invalid priority "${ticket.priority}"`);
    }
    if (ticket.acceptanceCriteria.length === 0) {
      // Warning, not error - ACs are optional
      console.warn(`Ticket ${ticket.storyIndex} has no acceptance criteria`);
    }
  });

  if (validationErrors.length > 0) {
    setCreationError(validationErrors.join('\n'));
    return;
  }

  // ... rest of creation
};
```

#### FIX 2 (MEDIUM): Add Selection Limit Validation
```typescript
const MAX_TICKETS_PER_CREATE = 100;  // Match backend limit

if (selectedTickets.length > MAX_TICKETS_PER_CREATE) {
  setCreationError(
    `Too many tickets selected (${selectedTickets.length}). ` +
    `Maximum ${MAX_TICKETS_PER_CREATE} tickets per batch. ` +
    `Please deselect some tickets and try again.`
  );
  return;
}
```

#### FIX 3 (MEDIUM): Add Retry Button on Creation Error
```typescript
// In JSX, replace error alert with:
{creationError && (
  <div className="flex gap-3 p-4 rounded-lg border bg-red-50 border-red-300">
    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
    <div className="flex-1">
      <p className="text-sm text-red-600 whitespace-pre-wrap">
        {creationError}
      </p>
    </div>
    <Button
      size="sm"
      variant="outline"
      onClick={handleCreateTickets}
      disabled={isCreating}
      className="flex-shrink-0"
    >
      {isCreating ? 'Retrying...' : 'Retry'}
    </Button>
  </div>
)}
```

#### FIX 4 (LOW): Wrap JSON.stringify in Try/Catch
```typescript
const request = {
  tickets: selectedTickets.map((ticket) => {
    try {
      return {
        epicName: ticket.epicName,
        title: ticket.title,
        description: ticket.description,
        type: ticket.type,
        priority: ticket.priority,
        acceptanceCriteria: JSON.stringify(ticket.acceptanceCriteria),
      };
    } catch (error) {
      throw new Error(
        `Failed to serialize ticket "${ticket.title}": ` +
        (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }),
};
```

### 📝 Edge Cases to Test

1. ✅ **Create with 0 tickets selected**
   - Error: "No tickets selected"

2. ⚠️ **Create with 101 tickets selected**
   - Currently allowed in frontend, but backend rejects
   - Should validate before sending

3. ❌ **Create, then immediately navigate away**
   - Verify tickets are created
   - Verify no data loss

4. ✅ **Create with empty title**
   - Frontend doesn't validate
   - Backend should reject
   - User sees error

5. ⚠️ **Create with special characters in AC**
   - Given: "Email's format"
   - When: "User clicks \"Send\""
   - Then: "Confirmation"
   - Verify JSON roundtrip works

6. ❌ **Network timeout during creation**
   - Verify partial results are handled
   - Some tickets created, others failed
   - Error shows which tickets failed

7. ✅ **Create same breakdown twice**
   - First click: Creates 5 tickets
   - Second click: Should create another 5 (new IDs)
   - Verify no duplicates prevented by frontend

---

## SUMMARY TABLE

### Issues by Severity

| Severity | Count | Issues |
|----------|-------|--------|
| CRITICAL | 3 | Draft save failure (silent), Draft resumption incomplete, Pre-creation validation missing |
| HIGH | 4 | Quota exceeded error handling, Race condition in draft saves, Missing error state display, JSON.parse without validation |
| MEDIUM | 8 | Selection count edge cases, Circular JSON refs, Retry logic missing, Expiration uses createdAt, Draft schema validation, Multiple concurrent saves, Storage quota handling, No selection limit |
| LOW | 3 | Draft ID collision, Timestamp validation, Performance (selection mutations) |

### Quick Checklist for QA

- [ ] Test auto-save with full localStorage (4.9MB+)
- [ ] Test draft resumption shows analysis time correctly
- [ ] Test corrupted localStorage JSON doesn't crash
- [ ] Test resuming draft after 24+ hours (should expire)
- [ ] Test creating 101 tickets (should fail with helpful error)
- [ ] Test selection state persists when editing tickets
- [ ] Test selecting all → deselecting one → selecting all again
- [ ] Test rapid auto-save (10 edits in 1 second)
- [ ] Test network timeout during creation, then retry
- [ ] Test BDD criteria with quotes and apostrophes

### Recommended Priority Fixes

**Immediate (blocker):**
1. FIX 1 (Flow 2): Add error state and retry for auto-save failures
2. FIX 1 (Flow 3): Pass analysisTime to saveDraft
3. FIX 2 (Flow 3): Fix resumeDraft to read from correct path

**Soon (first sprint):**
4. FIX 2 (Flow 2): Distinguish quota errors
5. FIX 1 (Flow 4): Add pre-creation validation
6. FIX 2 (Flow 4): Add selection limit validation

**Nice-to-have (nice-to-have):**
7. FIX 3 (Flow 2): Reuse draft ID
8. FIX 4 (Flow 3): Use updatedAt for expiration
9. FIX 3 (Flow 4): Add retry button on error

---

## Architecture Observations

### Strengths
- Clean separation of concerns (service → store → component)
- Proper use of Zustand with immutable updates
- Good error handling structure (try/catch, user feedback)
- Atomic Design followed (TicketCard, EpicGroup, BreakdownReview)

### Weaknesses
- Store mutation could be optimized (lots of object rebuilds)
- Missing comprehensive input validation before API calls
- No recovery strategies for storage failures
- Draft persistence limited to localStorage (no server backup)

### Patterns Used
- **Service pattern** (prdService singleton)
- **Store pattern** (Zustand)
- **Component composition** (organism/molecule/atom)
- **Factory pattern** (resumeDraft reconstructs state)

---

## Testing Recommendations

### Unit Tests Needed
1. `toggleTicketSelection()` - verify both tickets and epics arrays update
2. `selectAllTickets()` / `deselectAllTickets()` - verify counts match
3. `saveDraft()` - test localStorage errors, quota exceeded
4. `getLatestDraft()` - test expiration logic, corrupted JSON
5. `resumeDraft()` - test state restoration, missing fields
6. `bulkCreateFromBreakdown()` - test request formatting, error handling

### Integration Tests Needed
1. Full flow: Breakdown → Select → Save → Resume → Create
2. Draft persistence across page reload
3. Concurrent saves (rapid edits)
4. Network failures and retries
5. localStorage quota exceeded scenarios

### E2E Tests Needed
1. User adds PRD → selects all → creates tickets → sees enrichment wizard
2. User saves draft → reloads → resumes → edits → creates different set
3. User with corrupted draft tries to resume
4. User with expired draft (25 hours) sees "no draft"

