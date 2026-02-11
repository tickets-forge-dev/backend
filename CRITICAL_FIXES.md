# Critical Fixes - Ready-to-Implement Code Changes

**These are the 5 fixes that must be implemented immediately before production.**

---

## FIX #1: Add Error State Display to BreakdownReview

**File:** `client/src/tickets/components/prd/BreakdownReview.tsx`

**Problem:** Auto-save failures are logged to console but not shown to user

**Changes Required:**

### Step 1: Add error state (after line 68)
```typescript
// BEFORE:
const [isSaving, setIsSaving] = useState(false);
const [elapsedSeconds, setElapsedSeconds] = useState(0);
const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

// AFTER:
const [isSaving, setIsSaving] = useState(false);
const [saveError, setSaveError] = useState<string | null>(null);  // ← ADD
const [elapsedSeconds, setElapsedSeconds] = useState(0);
const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
```

### Step 2: Update handleAutoSave callback (lines 72-104)
```typescript
// BEFORE:
const handleAutoSave = useCallback(() => {
  if (!breakdown) return;

  if (saveTimeoutRef.current) {
    clearTimeout(saveTimeoutRef.current);
  }

  saveTimeoutRef.current = setTimeout(async () => {
    try {
      setIsSaving(true);
      await prdService.saveDraft(breakdown, prdText, projectName);
      setLastSavedAt(new Date());
    } catch (error) {
      console.error('Failed to auto-save draft:', error);  // ← PROBLEM: Silent
    } finally {
      setIsSaving(false);
    }
  }, 2000);
}, [breakdown, prdText, projectName]);

// AFTER:
const handleAutoSave = useCallback(() => {
  if (!breakdown) return;

  if (saveTimeoutRef.current) {
    clearTimeout(saveTimeoutRef.current);
  }

  saveTimeoutRef.current = setTimeout(async () => {
    try {
      setIsSaving(true);
      setSaveError(null);  // ← CLEAR previous error
      await prdService.saveDraft(breakdown, prdText, projectName);
      setLastSavedAt(new Date());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Save failed';
      setSaveError(message);  // ← SHOW error to user
      console.error('Failed to auto-save draft:', error);
      // Auto-retry after 5 seconds
      setTimeout(() => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        handleAutoSave();  // ← Recursive retry
      }, 5000);
    } finally {
      setIsSaving(false);
    }
  }, 2000);
}, [breakdown, prdText, projectName]);
```

### Step 3: Add error banner in JSX (after line 327, before closing div)
```typescript
// BEFORE (line 327-328):
        )}
        </div>
      </div>

// AFTER:
        )}
        {saveError && (
          <div
            className="flex gap-3 p-4 rounded-lg border"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderColor: 'var(--red)',
            }}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--red)' }} />
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: 'var(--red)' }}>
                Auto-save failed: {saveError}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                Will retry in 5 seconds, or click the button below to retry now.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                handleAutoSave();
              }}
              className="flex-shrink-0"
            >
              Retry Now
            </Button>
          </div>
        )}
        </div>
      </div>
```

**Testing:** Set localStorage to throw QuotaExceededError, edit breakdown, wait 2s, verify error banner appears

---

## FIX #2: Pass analysisTime to saveDraft

**File:** `client/src/tickets/components/prd/BreakdownReview.tsx`

**Problem:** analysisTime is not passed when saving, so resumed draft loses this metadata

**Changes Required:**

### Update saveDraft call (line 83)
```typescript
// BEFORE:
await prdService.saveDraft(breakdown, prdText, projectName);

// AFTER:
await prdService.saveDraft(
  breakdown,
  prdText,
  projectName,
  analysisTime,  // ← ADD
  estimatedTicketsCount  // ← ADD
);
```

**Note:** You need access to `analysisTime` and `estimatedTicketsCount` from store. They should already be in the destructuring at line 46-54. If not, add them:

```typescript
const {
  breakdown,
  analysisTime,  // ← ADD if missing
  estimatedTicketsCount,  // ← ADD if missing
  // ... rest of destructuring
} = usePRDBreakdownStore();
```

---

## FIX #3: Update saveDraft Function Signature

**File:** `client/src/services/prd.service.ts`

**Problem:** saveDraft doesn't accept or store analysisTime and estimatedTicketsCount

**Changes Required:**

### Update method signature (line 242)
```typescript
// BEFORE:
async saveDraft(breakdown: BreakdownResult, prdText: string, projectName?: string): Promise<string> {

// AFTER:
async saveDraft(
  breakdown: BreakdownResult,
  prdText: string,
  projectName?: string,
  analysisTime?: number,  // ← ADD
  estimatedTicketsCount?: number  // ← ADD
): Promise<string> {
```

### Update draft object (lines 248-255)
```typescript
// BEFORE:
const draft = {
  id: draftId,
  prdText,
  projectName,
  breakdown,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// AFTER:
const draft = {
  id: draftId,
  prdText,
  projectName,
  breakdown,
  analysisTime,  // ← ADD
  estimatedTicketsCount,  // ← ADD
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
```

---

## FIX #4: Fix resumeDraft to Read From Correct Paths

**File:** `client/src/tickets/stores/prd-breakdown.store.ts`

**Problem:** resumeDraft tries to read analysisTime from draft.breakdown?.analysisTime (wrong path)

**Changes Required:**

### Update resumeDraft action (lines 420-433)
```typescript
// BEFORE:
resumeDraft: (draft: any) => {
  if (!draft) return;

  set({
    prdText: draft.prdText || '',
    projectName: draft.projectName || '',
    breakdown: draft.breakdown || null,
    analysisTime: draft.breakdown?.analysisTime || null,  // ❌ WRONG PATH
    estimatedTicketsCount: draft.breakdown?.totalTickets || null,  // ❌ WRONG PATH
    currentStep: 'review',
    currentDraftId: draft.id,
    hasSavedDraft: true,
  });
},

// AFTER:
resumeDraft: (draft: any) => {
  if (!draft) return;

  set({
    prdText: draft.prdText || '',
    projectName: draft.projectName || '',
    breakdown: draft.breakdown || null,
    analysisTime: draft.analysisTime || null,  // ✅ CORRECT PATH
    estimatedTicketsCount: draft.estimatedTicketsCount || null,  // ✅ CORRECT PATH
    currentStep: 'review',
    currentDraftId: draft.id,
    hasSavedDraft: true,
  });
},
```

**Testing:** Save breakdown with analysis time → reload → resume draft → verify ANALYSIS TIME shows actual time, not "—"

---

## FIX #5: Distinguish QuotaExceededError

**File:** `client/src/services/prd.service.ts`

**Problem:** localStorage quota errors throw generic message that doesn't help user

**Changes Required:**

### Update catch block in saveDraft (lines 257-264)
```typescript
// BEFORE:
try {
  localStorage.setItem(`prd-breakdown-${draftId}`, JSON.stringify(draft));
  localStorage.setItem('prd-breakdown-latest', draftId);
  return draftId;
} catch (error) {
  throw new Error('Failed to save draft to local storage');  // ❌ Generic message
}

// AFTER:
try {
  localStorage.setItem(`prd-breakdown-${draftId}`, JSON.stringify(draft));
  localStorage.setItem('prd-breakdown-latest', draftId);
  return draftId;
} catch (error) {
  // Distinguish quota errors from other errors
  if (error instanceof Error && error.name === 'QuotaExceededError') {
    throw new Error(
      'Storage quota exceeded. Your browser storage is full. ' +
      'Please clear old drafts or browser cache to continue. ' +
      'Try: Settings → Clear Browsing Data → Cookies and Cached Files'
    );
  }
  throw new Error(
    'Failed to save draft: ' +
    (error instanceof Error ? error.message : 'Unknown error')
  );
}
```

**Testing:**
1. Fill localStorage to 4.9MB using DevTools
2. Try to save breakdown
3. Verify user-friendly error message about quota
4. Verify clear instructions to free space

---

## Implementation Checklist

- [ ] FIX #1: Add saveError state and error banner
  - [ ] Add state variable
  - [ ] Clear error in handleAutoSave try block
  - [ ] Set error in catch block
  - [ ] Add retry logic with 5s timeout
  - [ ] Render error banner with retry button
  - [ ] Test: localStorage error → error displays → retry works

- [ ] FIX #2: Pass analysisTime to saveDraft call
  - [ ] Add analysisTime and estimatedTicketsCount to store destructuring (if missing)
  - [ ] Update saveDraft call at line 83
  - [ ] Test: Edit breakdown → auto-save → check Network tab

- [ ] FIX #3: Update saveDraft signature
  - [ ] Add parameters to method signature
  - [ ] Add fields to draft object
  - [ ] Test: No TypeScript errors in prd.service.ts

- [ ] FIX #4: Fix resumeDraft paths
  - [ ] Change draft.breakdown?.analysisTime to draft.analysisTime
  - [ ] Change draft.breakdown?.totalTickets to draft.estimatedTicketsCount
  - [ ] Test: Save → reload → resume → analysis time shows correctly

- [ ] FIX #5: Distinguish quota errors
  - [ ] Check error.name === 'QuotaExceededError'
  - [ ] Provide helpful error message with instructions
  - [ ] Test: Fill storage → try to save → helpful error

---

## Validation After Fixes

Run these checks to verify fixes work:

```bash
# 1. TypeScript compilation
npm run build

# 2. No runtime errors
npm run dev

# 3. Manual testing
# - Edit breakdown, wait 2s, verify save indicator
# - Change localStorage quota, edit, verify error + retry
# - Save → reload → resume, verify analysis time
```

---

## Estimated Implementation Time

- FIX #1: 30 minutes (state, callback, JSX)
- FIX #2: 5 minutes (one line change)
- FIX #3: 10 minutes (signature + object)
- FIX #4: 5 minutes (two line changes)
- FIX #5: 15 minutes (error handling)

**Total: ~1 hour of coding + 30 minutes testing = 1.5 hours**

---

## Before/After Examples

### Before Fix #1
User edits breakdown → localStorage quota exceeded → console shows error → UI shows "Saved 2m ago" ✅ → User closes tab → Changes lost ❌

### After Fix #1
User edits breakdown → localStorage quota exceeded → UI shows red error banner "Auto-save failed: Storage quota exceeded" → User clicks "Retry Now" → Save succeeds ✅

---

### Before Fix #4
User saves breakdown with 15 second analysis time → Resumes draft → Summary shows "ANALYSIS TIME: —" ❌

### After Fix #4
User saves breakdown with 15 second analysis time → Resumes draft → Summary shows "ANALYSIS TIME: 00:15:00" ✅

---

## Questions?

These fixes are straightforward and follow the existing code patterns. If you get stuck:

1. Check the comprehensive review in `PRD_BREAKDOWN_CODE_REVIEW.md`
2. Reference the bug catalog in `BUG_REFERENCE.md`
3. Test each fix independently before combining

All fixes are backward compatible - no migration needed.

