# PRD Breakdown Bug Reference Guide

**Quick lookup for all identified issues**

---

## Flow 1: Ticket Selection

### ✅ No Critical Issues
Selection logic works correctly. Epic totals update properly.

---

## Flow 2: Draft Saving

### BUG #1: Silent Auto-Save Failures
- **ID:** `PRD-SAVE-001`
- **Severity:** CRITICAL
- **File:** BreakdownReview.tsx:86
- **Issue:** localStorage errors logged but not shown to user
- **Fix:** Add error state and display error banner
- **Blocker:** Yes, causes data loss

### BUG #2: Missing Error State Display
- **ID:** `PRD-SAVE-002`
- **Severity:** HIGH
- **File:** BreakdownReview.tsx:314-327
- **Issue:** No error banner for failed saves
- **Fix:** Add `[saveError, setSaveError]` state
- **Blocker:** Yes, user can't tell if save failed

### BUG #3: Race Condition - Multiple Saves Create Orphaned Drafts
- **ID:** `PRD-SAVE-003`
- **Severity:** MEDIUM
- **File:** prd.service.ts:247
- **Issue:** Every save creates new draft with new ID; old drafts become orphaned
- **Impact:** localStorage fills up with unused drafts
- **Fix:** Reuse draft ID instead of generating new one each time
- **Scenario:**
  ```
  Edit 1 → Save (creates draft-1707553200000)
  Edit 2 → Save (creates draft-1707553200500, old one orphaned)
  Edit 3 → Save (creates draft-1707553201000, 2 old ones orphaned)
  ```

### BUG #4: localStorage Quota Exceeded Error Not Distinguished
- **ID:** `PRD-SAVE-004`
- **Severity:** CRITICAL
- **File:** prd.service.ts:262-264
- **Issue:** Throws generic error for all exceptions
- **Impact:** User doesn't know storage is full
- **Fix:** Check error.name === 'QuotaExceededError' and provide specific message
- **Code:**
  ```typescript
  if (error.name === 'QuotaExceededError') {
    throw new Error('Storage quota exceeded...');
  }
  ```

### BUG #5: No Recovery Strategy for Quota Exceeded
- **ID:** `PRD-SAVE-005`
- **Severity:** HIGH
- **File:** prd.service.ts (global)
- **Issue:** When storage full, no way to delete old drafts or recover
- **Impact:** User can't save until browser cleared
- **Fix:** Implement cleanup: delete drafts older than 7 days before new save
- **Pseudo-code:**
  ```typescript
  // Before saving, cleanup old drafts
  const keys = Object.keys(localStorage)
    .filter(k => k.startsWith('prd-breakdown-draft-'))
    .sort();
  // Keep only latest 5 drafts
  keys.slice(0, -5).forEach(k => localStorage.removeItem(k));
  ```

### BUG #6: Debounce Clears Timeout But Error Can Still Occur
- **ID:** `PRD-SAVE-006`
- **Severity:** MEDIUM
- **File:** BreakdownReview.tsx:75-90
- **Issue:** If error occurs, next auto-save might not trigger
- **Impact:** After first save failure, subsequent edits don't retry
- **Fix:** In catch block, re-arm timeout for retry
- **Pseudo-code:**
  ```typescript
  } catch (error) {
    setSaveError(message);
    // Re-arm timeout for retry
    setTimeout(() => handleAutoSave(), 5000);
  } finally {
  ```

---

## Flow 3: Draft Resumption

### BUG #7: analysisTime Not Passed to saveDraft
- **ID:** `PRD-RESUME-001`
- **Severity:** CRITICAL
- **File:** BreakdownReview.tsx:83
- **Issue:** saveDraft() called without analysisTime and estimatedTicketsCount
- **Impact:** Resumed draft loses analysis metadata
- **Fix:**
  ```typescript
  await prdService.saveDraft(
    breakdown,
    prdText,
    projectName,
    analysisTime,  // ← Add
    estimatedTicketsCount  // ← Add
  );
  ```
- **Blocker:** Yes, metadata lost on resume

### BUG #8: resumeDraft Reads From Wrong Path
- **ID:** `PRD-RESUME-002`
- **Severity:** CRITICAL
- **File:** prd-breakdown.store.ts:428
- **Issue:** `draft.breakdown?.analysisTime` doesn't exist; field is at `draft.analysisTime`
- **Impact:** ANALYSIS TIME shows "—" instead of actual time
- **Fix:** Change line 428 to `draft.analysisTime || null`
- **Blocker:** Yes, UI shows broken data

### BUG #9: JSON.parse() Not Wrapped in Try/Catch
- **ID:** `PRD-RESUME-003`
- **Severity:** MEDIUM
- **File:** prd.service.ts:305
- **Issue:** If draft JSON is corrupted, JSON.parse throws but outer catch silently returns null
- **Impact:** User loses draft with no indication of corruption
- **Fix:** Wrap JSON.parse in try/catch with proper logging
- **Code:**
  ```typescript
  try {
    const parsed = JSON.parse(draft);  // ← Can throw
    // Validate schema
    if (!parsed.breakdown || !Array.isArray(parsed.breakdown.tickets)) {
      throw new Error('Invalid draft schema');
    }
    // ...
  } catch (error) {
    console.warn('Failed to parse draft:', error.message);
    return null;
  }
  ```

### BUG #10: No Schema Validation for Loaded Drafts
- **ID:** `PRD-RESUME-004`
- **Severity:** MEDIUM
- **File:** prd.service.ts:305 / prd-breakdown.store.ts:420
- **Issue:** Draft object not validated before use
- **Impact:** If user manually edits localStorage, could crash app
- **Fix:** Validate draft shape before setting state
- **Required Fields:**
  ```typescript
  interface SavedDraft {
    id: string;
    prdText: string;
    projectName?: string;
    breakdown: BreakdownResult;
    analysisTime?: number;
    estimatedTicketsCount?: number;
    createdAt: string;
    updatedAt: string;
  }
  ```

### BUG #11: 24-hour Expiration Uses createdAt Instead of updatedAt
- **ID:** `PRD-RESUME-005`
- **Severity:** MEDIUM
- **File:** prd.service.ts:307
- **Issue:** Uses `createdAt` for expiration, not `updatedAt`
- **Impact:** Draft expires even though user worked on it all day
- **Scenario:**
  ```
  Monday 10:00 AM: Draft created
  Monday 10:00 AM - Tuesday 9:59 AM: User edits draft (100 auto-saves)
  Tuesday 10:00 AM: Draft marked expired (24h from creation, not last update)
  User loses work they were just doing!
  ```
- **Fix:** Use `updatedAt` instead:
  ```typescript
  const relevantDate = new Date(parsed.updatedAt || parsed.createdAt);
  ```

---

## Flow 4: Ticket Creation

### BUG #12: Missing Pre-Creation Validation
- **ID:** `PRD-CREATE-001`
- **Severity:** MEDIUM
- **File:** BreakdownReview.tsx:149-158
- **Issue:** No validation of ticket data before API call
- **Impact:** Invalid data sent to backend, gets 400 errors
- **Validation Missing:**
  - title is not empty
  - type is valid enum ('feature' | 'bug' | 'task')
  - priority is valid enum
  - acceptanceCriteria is valid BDD format
- **Fix:** Add validation loop before line 149
- **Pseudo-code:**
  ```typescript
  const validationErrors = [];
  selectedTickets.forEach(ticket => {
    if (!ticket.title?.trim()) {
      validationErrors.push(`Ticket ${ticket.storyIndex}: Missing title`);
    }
    if (!['feature', 'bug', 'task'].includes(ticket.type)) {
      validationErrors.push(`Ticket ${ticket.storyIndex}: Invalid type`);
    }
  });
  if (validationErrors.length > 0) {
    setCreationError(validationErrors.join('\n'));
    return;
  }
  ```

### BUG #13: JSON.stringify Can Throw on Circular References
- **ID:** `PRD-CREATE-002`
- **Severity:** MEDIUM
- **File:** BreakdownReview.tsx:156
- **Issue:** No try/catch around JSON.stringify
- **Impact:** If BDDCriterion has circular reference, app crashes
- **Probability:** Low (unlikely to happen naturally)
- **Fix:** Wrap in try/catch
- **Code:**
  ```typescript
  acceptanceCriteria: (() => {
    try {
      return JSON.stringify(ticket.acceptanceCriteria);
    } catch (e) {
      throw new Error(`Failed to serialize criteria for: ${ticket.title}`);
    }
  })(),
  ```

### BUG #14: No Selection Limit Warning
- **ID:** `PRD-CREATE-003`
- **Severity:** MEDIUM
- **File:** BreakdownReview.tsx:332
- **Issue:** No validation that selectedCount <= 100 (API limit)
- **Impact:** User selects 150 tickets, API rejects with 400 error
- **Scenario:**
  ```
  User selects all tickets: 150 selected
  Clicks "Enrich & Create"
  API rejects: BulkEnrichDto has @ArrayMaxSize(100)
  User sees error, must deselect tickets and retry
  ```
- **Fix:** Add validation before line 149
- **Code:**
  ```typescript
  const MAX_TICKETS = 100;
  if (selectedTickets.length > MAX_TICKETS) {
    setCreationError(
      `Too many tickets (${selectedTickets.length}). Max is ${MAX_TICKETS}.`
    );
    return;
  }
  ```

### BUG #15: No Retry Button on Creation Failure
- **ID:** `PRD-CREATE-004`
- **Severity:** MEDIUM
- **File:** BreakdownReview.tsx:184-189
- **Issue:** On error, user must go back and start over
- **Impact:** UX friction on network failures
- **Fix:** Add retry button to error alert
- **Code:**
  ```typescript
  <Button onClick={handleCreateTickets} disabled={isCreating}>
    {isCreating ? 'Retrying...' : 'Retry'}
  </Button>
  ```

---

## Summary Table

| Bug ID | Flow | Severity | Status | Fix Priority |
|--------|------|----------|--------|--------------|
| PRD-SAVE-001 | Saving | CRITICAL | Open | P0 |
| PRD-SAVE-002 | Saving | HIGH | Open | P0 |
| PRD-SAVE-003 | Saving | MEDIUM | Open | P1 |
| PRD-SAVE-004 | Saving | CRITICAL | Open | P0 |
| PRD-SAVE-005 | Saving | HIGH | Open | P1 |
| PRD-SAVE-006 | Saving | MEDIUM | Open | P1 |
| PRD-RESUME-001 | Resumption | CRITICAL | Open | P0 |
| PRD-RESUME-002 | Resumption | CRITICAL | Open | P0 |
| PRD-RESUME-003 | Resumption | MEDIUM | Open | P1 |
| PRD-RESUME-004 | Resumption | MEDIUM | Open | P1 |
| PRD-RESUME-005 | Resumption | MEDIUM | Open | P1 |
| PRD-CREATE-001 | Creation | MEDIUM | Open | P1 |
| PRD-CREATE-002 | Creation | MEDIUM | Open | P1 |
| PRD-CREATE-003 | Creation | MEDIUM | Open | P1 |
| PRD-CREATE-004 | Creation | MEDIUM | Open | P2 |

**P0 (Critical):** 5 bugs - implement immediately
**P1 (High):** 8 bugs - implement in next sprint
**P2 (Nice-to-have):** 2 bugs - backlog

---

## Root Causes

### Pattern 1: Silent Error Handling
- **Bugs affected:** PRD-SAVE-001, PRD-SAVE-002, PRD-RESUME-003
- **Root cause:** Errors logged but not shown to user
- **Solution:** Always display errors to user, offer retry button

### Pattern 2: Incomplete Data Persistence
- **Bugs affected:** PRD-RESUME-001, PRD-RESUME-002
- **Root cause:** Not all state fields saved/restored
- **Solution:** Use type-safe draft structure, validate on load

### Pattern 3: Missing Input Validation
- **Bugs affected:** PRD-CREATE-001, PRD-CREATE-002, PRD-CREATE-003
- **Root cause:** No validation before sending to API
- **Solution:** Validate on client before API call

### Pattern 4: Missing Error Recovery
- **Bugs affected:** PRD-SAVE-004, PRD-SAVE-005, PRD-CREATE-004
- **Root cause:** No recovery options when errors occur
- **Solution:** Add retry buttons, cleanup strategies, helpful errors

---

## File-by-File Checklist

### BreakdownReview.tsx
- [ ] Add saveError state
- [ ] Display error banner on save failure
- [ ] Add retry button for failed saves
- [ ] Validate selection count <= 100
- [ ] Add per-ticket validation before creation
- [ ] Add retry button for creation failures
- [ ] Pass analysisTime/estimatedTicketsCount to saveDraft

### prd.service.ts
- [ ] Distinguish QuotaExceededError in saveDraft
- [ ] Add helpful error message for quota exceeded
- [ ] Wrap JSON.parse in try/catch with logging
- [ ] Add draft schema validation in getLatestDraft
- [ ] Use updatedAt instead of createdAt for expiration
- [ ] Implement draft cleanup (delete old drafts before save)

### prd-breakdown.store.ts
- [ ] Update resumeDraft to read analysisTime from root level
- [ ] Update resumeDraft to read estimatedTicketsCount from root level
- [ ] Add schema validation in resumeDraft

---

## Testing Scenarios

### Critical Path Tests
1. [ ] Save → Reload → Resume → See analysis time
2. [ ] Save with full localStorage → See clear error message
3. [ ] Network failure → See retry button
4. [ ] Select 150 tickets → See helpful error before API call

### Edge Cases
1. [ ] Corrupted draft JSON → Silent recovery
2. [ ] Draft older than 24h → Expires cleanly
3. [ ] BDD criteria with quotes/apostrophes → Roundtrip success
4. [ ] Multiple concurrent auto-saves → Only final version saved
5. [ ] System clock goes backward → Draft IDs stay ordered

