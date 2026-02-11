# Critical Fixes Required Before Production

## Summary
Found 4 critical blocking issues, 5 high-value issues, and 10+ edge cases.
**System is NOT production-ready without addressing critical issues.**

---

## 🔴 CRITICAL (Blocking) - Must Fix Before Deployment

### 1. Ticket ID Mapping Bug (Data Corruption Risk)

**File:** `client/src/tickets/components/prd/BreakdownReview.tsx`
**Severity:** CRITICAL - Can cause wrong tickets to be enriched
**Effort:** 1-2 hours

**Current Code:**
```typescript
ticketTitles={new Map(
  breakdown.tickets.map((ticket, index) => [draftTicketIds[index] || '', ticket.title]),
)}
```

**Problem:**
- If ticket[0] creation fails, returned IDs are shifted
- Frontend maps id1→ticket1, but id1 is actually ticket2
- All subsequent enrichment targets wrong tickets
- **Data integrity violation**

**Fix:**
```typescript
// Change BulkCreateFromBreakdownUseCase return type:
export interface BulkCreateResult {
  results: Array<{
    originalIndex: number;
    title: string;
    ticketId?: string;
    error?: string;
  }>;
  // Remove: createdCount, ticketIds, errors (old format)
}

// In loop, track index:
results.push({
  originalIndex: i,
  title: ticket.title,
  ticketId: aec.id,
  // OR error: message if creation failed
});

// Frontend can now safely map:
const idsByTitle = new Map(result.results.map(r => [r.title, r.ticketId]));
const ticketTitles = new Map(
  breakdown.tickets.map(t => [idsByTitle.get(t.title) || '', t.title])
);
```

**Testing:**
```typescript
// Test with 3 tickets, fail middle one
tickets: [a, b, c]
returns: [a_id, error_for_b, c_id]

// Verify mapping:
- a_id maps to ticket 'a' ✓
- c_id maps to ticket 'c' ✓
```

---

### 2. SSE Connection Timeout (Hanging UI)

**File:** `client/src/services/bulk-enrichment.service.ts`
**Severity:** CRITICAL - Can hang indefinitely
**Effort:** 30 minutes

**Problem:**
- Network drops during enrichment
- EventSource stays open forever
- User sees "enriching..." for hours
- No error feedback

**Current Code:**
```typescript
async enrichTickets(ticketIds, onProgress) {
  return new Promise((resolve, reject) => {
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // No timeout reset
    };

    // Missing: timeout handling
  });
}
```

**Fix:**
```typescript
async enrichTickets(ticketIds, onProgress) {
  return new Promise((resolve, reject) => {
    const eventSource = new EventSource(url);
    let timeout = setTimeout(() => {
      eventSource.close();
      reject(new Error('Enrichment timeout: No response for 60 seconds. Check your network.'));
    }, 60000);

    eventSource.onmessage = (event) => {
      clearTimeout(timeout); // Reset on each event
      timeout = setTimeout(() => {
        eventSource.close();
        reject(new Error('Enrichment timeout: No response for 60 seconds.'));
      }, 60000);

      const data = JSON.parse(event.data);
      if (onProgress) onProgress(data);

      if (data.type === 'complete' || data.type === 'error') {
        clearTimeout(timeout);
        eventSource.close();
      }
    };

    eventSource.onerror = (error) => {
      clearTimeout(timeout);
      eventSource.close();
      reject(new Error('Connection error. Check your internet connection.'));
    };
  });
}
```

**Testing:**
```typescript
// Mock EventSource that never sends events
// Verify timeout fires after 60s
// Verify error shown to user
```

---

### 3. AgentProgressCard Phase Type Mismatch

**File:** `client/src/tickets/components/bulk/BulkEnrichmentWizard.tsx`
**Severity:** CRITICAL - Hidden TypeScript error
**Effort:** 15 minutes

**Problem:**
```typescript
// Enrichment phases
type EnrichmentPhase = 'deep_analysis' | 'question_generation' | 'complete' | 'error';

// Finalization phases
type FinalizationPhase = 'generating_spec' | 'saving' | 'complete' | 'error';

// AgentProgressCard used for both
<AgentProgressCard
  phase={progress.phase as any}  // 🔴 'as any' hides type error
  ...
/>
```

**Fix:**
```typescript
// In AgentProgressCard.tsx, allow union type:
export interface AgentProgressCardProps {
  agentId: number;
  ticketTitle: string;
  phase: 'deep_analysis' | 'question_generation' | 'generating_spec' | 'saving' | 'complete' | 'error';
  status: 'started' | 'in_progress' | 'completed' | 'failed';
  message: string;
  error?: string;
}

// Remove 'as any' from BulkEnrichmentWizard
// TypeScript will now validate phases correctly
```

---

### 4. No Workspace Verification (Security Issue)

**File:** `backend/src/tickets/application/use-cases/EnrichMultipleTicketsUseCase.ts`
**Severity:** CRITICAL - Can access other users' tickets
**Effort:** 1 hour

**Problem:**
```typescript
async execute(command: EnrichMultipleCommand): Promise<EnrichMultipleResult> {
  // Load tickets without workspace check
  const tickets = await Promise.all(
    command.ticketIds.map(async (id) => {
      const ticket = await this.aecRepository.findById(id);
      // No verification ticket belongs to user's workspace!
    }),
  );
}
```

**Fix:**
```typescript
export interface EnrichMultipleCommand {
  workspaceId: string;  // Already present
  ticketIds: string[];
  onProgress?: (event: EnrichmentProgressEvent) => void;
}

async execute(command: EnrichMultipleCommand): Promise<EnrichMultipleResult> {
  // Verify all tickets belong to workspace
  const tickets = await Promise.all(
    command.ticketIds.map(async (id) => {
      const ticket = await this.aecRepository.findById(id);
      if (!ticket) {
        throw new NotFoundException(`Ticket "${id}" not found`);
      }

      // CRITICAL: Verify workspace ownership
      if (ticket.workspaceId !== command.workspaceId) {
        throw new ForbiddenException(
          `Ticket "${id}" does not belong to workspace "${command.workspaceId}"`
        );
      }

      return { id, ticket };
    }),
  );
}
```

---

## 🟡 MAJOR (High Value) - Should Fix Before Deployment

### 1. Input Size Validation
**File:** `backend/src/tickets/presentation/dto/BulkEnrichDto.ts`
**Severity:** MAJOR
**Effort:** 15 minutes

```typescript
export class BulkEnrichDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)  // ADD THIS
  @IsString({ each: true })
  ticketIds!: string[];

  @IsString()
  @MinLength(1)
  repositoryOwner!: string;

  @IsString()
  @MinLength(1)
  repositoryName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)  // ADD THIS
  branch!: string;
}
```

### 2. Answer Length Validation
**File:** `client/src/tickets/components/bulk/UnifiedQuestionForm.tsx`
**Severity:** MAJOR
**Effort:** 15 minutes

```typescript
{question.type === 'textarea' ? (
  <textarea
    maxLength={5000}  // ADD THIS
    value={answer}
    onChange={(e) => onAnswerChange(e.target.value)}
    className="w-full px-3 py-2 rounded border text-sm"
    style={{ ... }}
    placeholder="Your answer... (max 5000 characters)"  // UPDATE THIS
    rows={4}
  />
)
```

### 3. Better Error Messages
**File:** `client/src/services/bulk-enrichment.service.ts`
**Severity:** MAJOR
**Effort:** 1-2 hours

```typescript
// Instead of generic errors, detect types:
if (error.message.includes('ECONNREFUSED')) {
  return 'Could not connect to server. Check if backend is running.';
} else if (error.message.includes('timeout')) {
  return 'Request timeout. Your network may be slow. Try again.';
} else if (error.status === 429) {
  return 'Too many requests. Please wait a few minutes before trying again.';
} else if (error.status === 413) {
  return 'Request too large. Your answers are too long.';
}
```

### 4. Prevent Double Submit
**File:** `client/src/tickets/components/bulk/UnifiedQuestionForm.tsx`
**Severity:** MAJOR
**Effort:** 10 minutes

```typescript
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async () => {
  if (isSubmitting) return; // Prevent double-click
  setIsSubmitting(true);
  try {
    await onSubmit();
  } finally {
    setIsSubmitting(false);
  }
};

<Button
  onClick={handleSubmit}
  disabled={answeredQuestions < totalQuestions || isSubmitting}
  ...
>
```

### 5. XSS Protection
**File:** `client/src/tickets/components/bulk/UnifiedQuestionForm.tsx`
**Severity:** MAJOR
**Effort:** 30 minutes

```typescript
// Install: npm install dompurify
// Add to component:
import DOMPurify from 'dompurify';

// When displaying answer (if needed):
const sanitized = DOMPurify.sanitize(answer);
// Use sanitized in display

// For textarea input, add validation:
const validateAnswer = (text: string) => {
  // Reject if contains suspicious patterns
  if (/<script|<iframe|javascript:|onerror=/.test(text)) {
    return false;
  }
  return true;
};
```

---

## Priority Fix Checklist

- [ ] Fix ticket ID mapping (Data corruption risk)
- [ ] Add SSE timeout (Hanging UI risk)
- [ ] Fix AgentProgressCard types (Type safety)
- [ ] Add workspace verification (Security)
- [ ] Add input validation (Rate limiting)
- [ ] Add answer length limits (Request size)
- [ ] Improve error messages (UX)
- [ ] Prevent double submit (UX)
- [ ] Add XSS protection (Security)

---

## Testing Plan After Fixes

### Unit Tests:
```typescript
// EnrichMultipleTicketsUseCase
test('rejects tickets not in workspace')
test('preserves ticket order on partial failure')
test('emits progress events with correct agentId')

// BulkEnrichmentService
test('times out after 60 seconds of inactivity')
test('emits better error messages')
test('validates input size')

// UnifiedQuestionForm
test('prevents double submit')
test('limits answer length')
test('validates answer content')
```

### Integration Tests:
```typescript
// Full flow
test('enriches 3 tickets in parallel')
test('handles 1 failure gracefully')
test('redirects with correct ticket IDs')

// SSE handling
test('closes connection on timeout')
test('recovers from network drop')
test('handles malformed SSE events')
```

### E2E Tests:
```typescript
// User flows
test('user sees correct ticket titles throughout')
test('user can complete enrichment with 1 failure')
test('user sees helpful error on network failure')
test('enrichment completes within 60s')
```

---

## Deployment Checklist

Before deploying to production:

- [ ] All 4 critical issues fixed
- [ ] All 5 major issues fixed
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Code review by senior engineer
- [ ] Performance testing (3 tickets in <60s)
- [ ] Security review by security team
- [ ] Error handling tested manually
- [ ] Edge cases tested manually
- [ ] Rollback plan documented

---

## Risk Assessment

| Fix | Risk of NOT Fixing | Fix Time | Priority |
|-----|-------------------|----------|----------|
| Ticket mapping | HIGH - data corruption | 1-2h | CRITICAL |
| SSE timeout | HIGH - UX broken | 30m | CRITICAL |
| Type mismatch | MEDIUM - subtle bugs | 15m | CRITICAL |
| Workspace check | CRITICAL - security | 1h | CRITICAL |
| Input validation | MEDIUM - DoS risk | 15m | HIGH |
| Answer length | LOW - edge case | 15m | HIGH |
| Error messages | MEDIUM - UX | 1-2h | HIGH |
| Double submit | LOW - edge case | 10m | HIGH |
| XSS protection | MEDIUM - security | 30m | HIGH |

---

## Estimated Timeline

- Fix all critical issues: **4-5 hours**
- Fix all major issues: **3-4 hours**
- Testing & QA: **2-3 hours**
- **Total: 9-12 hours**

**Timeline:** Can be done in 1-1.5 days by one developer

---

## Alternative: Phased Rollout

If timeline is tight, deploy with:
- ✅ Fix only critical issues (4 hours)
- ✅ Deploy to staging
- ✅ Do E2E testing (2 hours)
- ✅ Deploy to prod
- ⏳ Fix major issues in hotfix release (next sprint)

**Risk:** Medium issues remain but system is functional

