# Critical Findings - PRD Breakdown Code Review

**Date:** 2026-02-11
**Risk Level:** HIGH - 3 critical issues found

---

## 🔴 CRITICAL ISSUE #1: Silent Auto-Save Failures (Data Loss Risk)

**Severity:** CRITICAL
**File:** `client/src/tickets/components/prd/BreakdownReview.tsx` (lines 72-90)
**Impact:** User thinks changes are saved when they're actually lost

### The Problem
```typescript
const handleAutoSave = useCallback(() => {
  // ... setup ...
  saveTimeoutRef.current = setTimeout(async () => {
    try {
      setIsSaving(true);
      await prdService.saveDraft(breakdown, prdText, projectName);
      setLastSavedAt(new Date());
    } catch (error) {
      console.error('Failed to auto-save draft:', error);  // ❌ SILENT FAILURE
    } finally {
      setIsSaving(false);
    }
  }, 2000);
}, [breakdown, prdText, projectName]);
```

### Scenario (Data Loss)
1. User has large breakdown (4MB of JSON)
2. Makes edits → auto-save triggers
3. localStorage quota exceeded (5MB limit)
4. Error caught, logged to console only
5. UI shows "Saved 2s ago" ✅ but no data was actually saved ❌
6. User closes tab thinking changes are safe
7. Changes are lost forever

### Why This is Critical
- **Silent failure:** User has no way to know save failed
- **Data loss:** User can lose hours of work
- **No recovery:** No error message, no retry button
- **Trust issue:** App appears to work but loses data

### Required Fix
```typescript
// Add error state tracking
const [saveError, setSaveError] = useState<string | null>(null);

const handleAutoSave = useCallback(() => {
  // ... existing code ...
  saveTimeoutRef.current = setTimeout(async () => {
    try {
      setIsSaving(true);
      setSaveError(null);  // Clear previous error
      await prdService.saveDraft(breakdown, prdText, projectName);
      setLastSavedAt(new Date());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Save failed';
      setSaveError(message);  // ✅ SHOW ERROR TO USER
      // Auto-retry after 5s
      setTimeout(() => handleAutoSave(), 5000);
    } finally {
      setIsSaving(false);
    }
  }, 2000);
}, [breakdown, prdText, projectName]);

// In JSX, add error display:
{saveError && (
  <div className="p-3 rounded border border-red-300 bg-red-50">
    <p className="text-sm text-red-600">
      ⚠️ Failed to save draft: {saveError}
    </p>
    <button onClick={handleAutoSave} className="text-red-600 underline">
      Retry
    </button>
  </div>
)}
```

---

## 🔴 CRITICAL ISSUE #2: Incomplete Draft Resumption (Data Loss)

**Severity:** CRITICAL
**Files:**
- `client/src/services/prd.service.ts` (lines 242-265)
- `client/src/tickets/stores/prd-breakdown.store.ts` (lines 420-433)
**Impact:** Metadata lost when user resumes draft (analysis time, ticket count)

### The Problem
```typescript
// When saving, analysisTime is NOT passed:
await prdService.saveDraft(breakdown, prdText, projectName);  // ❌ Missing analysisTime!

// When resuming, code tries to read from wrong location:
analysisTime: draft.breakdown?.analysisTime || null,  // ❌ BUG!
// But analysisTime is at root level of draft, not inside breakdown!
```

### What Gets Lost
1. **Analysis Time** - "ANALYSIS TIME: —" shows instead of actual time
2. **Ticket Count** - Metadata about analysis results lost

### Why This is Critical
- User can't see how long analysis took
- Incomplete restoration of state
- Summary cards show wrong data

### Root Cause
`analysisTime` and `estimatedTicketsCount` are stored in Zustand state at root level:
```typescript
// In prd-breakdown.store.ts state:
analysisTime: number | null;  // ← Root level
estimatedTicketsCount: number | null;  // ← Root level
breakdown: BreakdownResult | null;  // ← Separate field
```

But when saving, only `breakdown` is passed to prdService.

### Required Fix

**Step 1: Update saveDraft signature**
```typescript
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
```

**Step 2: Pass metadata when saving**
```typescript
// In BreakdownReview.tsx line 83:
await prdService.saveDraft(
  breakdown,
  prdText,
  projectName,
  analysisTime,  // ← Get from store
  estimatedTicketsCount  // ← Get from store
);
```

**Step 3: Read from correct path when resuming**
```typescript
// In prd-breakdown.store.ts:
resumeDraft: (draft: any) => {
  if (!draft) return;

  set({
    prdText: draft.prdText || '',
    projectName: draft.projectName || '',
    breakdown: draft.breakdown || null,
    analysisTime: draft.analysisTime || null,  // ← Correct path now!
    estimatedTicketsCount: draft.estimatedTicketsCount || null,  // ← Correct path
    currentStep: 'review',
    currentDraftId: draft.id,
    hasSavedDraft: true,
  });
}
```

---

## 🔴 CRITICAL ISSUE #3: Unhandled localStorage Quota Errors

**Severity:** CRITICAL
**File:** `client/src/services/prd.service.ts` (lines 257-264)
**Impact:** User can't save work when storage is full, with no helpful error message

### The Problem
```typescript
try {
  localStorage.setItem(`prd-breakdown-${draftId}`, JSON.stringify(draft));
  localStorage.setItem('prd-breakdown-latest', draftId);
  return draftId;
} catch (error) {
  throw new Error('Failed to save draft to local storage');  // ❌ Generic message
}
```

### Scenario
1. User's browser has 4.8MB in localStorage (photos, other apps)
2. localStorage limit is 5MB
3. User's breakdown is 300KB
4. save fails with QuotaExceededError
5. Error message: "Failed to save draft to local storage"
6. User has no idea what to do

### Why This is Critical
- **No context:** User doesn't know storage is full
- **No recovery path:** Can't delete old data to free space
- **Confusing:** Generic error doesn't explain the real problem
- **Data loss:** Changes aren't saved, user loses work

### Required Fix
```typescript
async saveDraft(breakdown, prdText, projectName) {
  const draftId = `draft-${Date.now()}`;
  const draft = {
    id: draftId,
    prdText,
    projectName,
    breakdown,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(`prd-breakdown-${draftId}`, JSON.stringify(draft));
    localStorage.setItem('prd-breakdown-latest', draftId);
    return draftId;
  } catch (error) {
    // Distinguish quota errors from other errors
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      throw new Error(
        'Storage quota exceeded. Your browser storage is full. ' +
        'Please clear old drafts or browser data to continue. ' +
        'You can delete old drafts from the resume panel.'
      );
    }
    throw new Error(
      'Failed to save draft: ' +
      (error instanceof Error ? error.message : 'Unknown error')
    );
  }
}
```

---

## Summary: Why These Are Critical

| Issue | Why Critical | User Impact |
|-------|-----------|------------|
| Silent Save Failure | Data loss is invisible | User loses hours of work with no indication |
| Incomplete Resumption | Metadata doesn't restore | User sees broken summary cards |
| Quota Errors | No recovery path | User can't save, no helpful error message |

---

## Testing These Issues

### Test 1: Storage Quota Exceeded
```
1. Open DevTools → Storage → Local Storage
2. Add large values to fill quota to 4.8MB
3. Try to save a breakdown
4. Verify error message is clear and helpful
5. Verify user can retry after freeing space
```

### Test 2: Resume Draft Metadata
```
1. Create breakdown → analyze (shows analysis time)
2. Save draft
3. Reload page
4. Resume draft
5. Verify ANALYSIS TIME card shows actual time, not "—"
6. Verify estimated ticket count is correct
```

### Test 3: Silent Failures
```
1. Simulate localStorage error by mocking fetch:
   window.localStorage.setItem = () => { throw new Error('QuotaExceededError'); }
2. Edit breakdown
3. Wait 2 seconds for auto-save
4. Verify error banner appears in UI (not just console)
5. Verify retry button is available
```

---

## Implementation Timeline

**High Priority (implement immediately):**
1. Add error state display to BreakdownReview
2. Pass analysisTime/estimatedTicketsCount to saveDraft
3. Distinguish and display quota errors

**Should follow in next sprint:**
4. Implement retry logic
5. Add draft schema validation
6. Add pre-creation validation

