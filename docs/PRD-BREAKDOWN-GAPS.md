# PRD Breakdown - Implementation Gaps Summary

## Overview

The PRD Breakdown feature is **functionally complete** but has **10 identified gaps** that need attention. Of these, **3 are critical** and should be fixed before production deployment.

---

## 🔴 Critical Gaps (P1 - Must Fix)

### 1. **BDD Criteria Parsing Validation**

**Current State:**
```typescript
// BulkCreateFromBreakdownUseCase.ts
try {
  const criteria = JSON.parse(ticket.acceptanceCriteria);
  if (Array.isArray(criteria) && criteria.length > 0) {
    aec.updateAcceptanceCriteria(
      criteria.map((c: any) =>
        `Given ${c.given}\nWhen ${c.when}\nThen ${c.then}`,
      ),
    );
  }
} catch (e) {
  this.logger.warn(`Failed to parse AC for ticket ${ticket.title}: ${e}`);
}
```

**Issues:**
- ❌ Silent failure if JSON is invalid
- ❌ No validation that `given`, `when`, `then` fields exist
- ❌ Empty criteria might be created silently
- ❌ Logs warning but user doesn't know criteria wasn't set

**Fix Required:**
```typescript
// Add proper validation
const criteria = JSON.parse(ticket.acceptanceCriteria);
if (!Array.isArray(criteria)) throw new Error('AC must be array');
if (criteria.some(c => !c.given || !c.when || !c.then)) {
  throw new Error('Invalid BDD criterion structure');
}
```

**Test Case:**
```bash
curl -X POST "$API_URL/tickets/breakdown/bulk-create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "tickets": [{
      "title": "Test",
      "acceptanceCriteria": "[{\"given\": \"\", \"when\": \"\", \"then\": \"\"}]"  # Empty
    }]
  }'
```

---

### 2. **Error Response Format Consistency**

**Current State:**
```typescript
// TicketsController.ts
catch (error: any) {
  throw new BadRequestException(
    error.message || 'Failed to create tickets from breakdown',
  );
}
```

**Issues:**
- ❌ Frontend expects `{ message, statusCode }` format
- ❌ NestJS throws BadRequestException with different structure
- ❌ May return plain string instead of JSON object
- ❌ Error codes inconsistent between endpoints

**Frontend Expectation:**
```javascript
// PRDInputForm.tsx
const error = await response.json().catch(() => ({ message: 'Unknown error' }));
throw new Error(error.message || `Failed: ${response.status}`);
```

**Fix Required:**
All endpoints should return consistent format:
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "BadRequest"
}
```

---

### 3. **Workspace Isolation Not Verified**

**Current State:**
```typescript
// BulkCreateFromBreakdownUseCase.ts doesn't validate workspace
async execute(command: BulkCreateCommand): Promise<BulkCreateResult> {
  // No workspace validation on created tickets
  for (const ticket of command.tickets) {
    const aec = await this.createTicketUseCase.execute({
      workspaceId: command.workspaceId,  // ← Passed but not verified
      userEmail: command.userEmail,
      ...
    });
  }
}
```

**Issues:**
- ❌ No verification that user owns the workspace
- ❌ No verification that user can create in workspace
- ❌ Could potentially create tickets in another user's workspace

**Test Case:**
```bash
# Try to create ticket with fake workspace ID
curl -X POST "$API_URL/tickets/breakdown/bulk-create" \
  -H "Authorization: Bearer $USER_A_TOKEN" \
  -d '{
    "tickets": [...]
  }'
# Should verify user has access to workspace
```

---

## 🟡 Medium Gaps (P2 - Fix This Week)

### 4. **Acceptance Criteria Field Storage**

**Current State:**
- BDD criteria converted to string format: `"Given X When Y Then Z"`
- Stored in `acceptanceCriteria` field as string array
- **Issue:** Original BDD structure lost

**Why It Matters:**
```typescript
// Original BDD structure
{
  given: "User on login page",
  when: "User enters valid credentials",
  then: "User logged in"
}

// Converted to string (loses structure)
"Given User on login page\nWhen User enters valid credentials\nThen User logged in"

// Can't parse back to BDD format
```

**Fix:**
Consider storing BDD criteria as separate field:
```typescript
interface AEC {
  acceptanceCriteria: string[];  // Flat format (current)
  bddCriteria?: BDDCriterion[];   // NEW: Structured format
}
```

---

### 5. **User Tracking Not Implemented**

**Current State:**
```typescript
// PRDBreakdownUseCase receives but doesn't track
async execute(command: PRDBreakdownExecuteCommand) {
  // @UserId() decorator not used
  // @UserEmail() decorator not used
  // No tracking of who analyzed the PRD
}

// BulkCreateFromBreakdownUseCase
async execute(command: BulkCreateCommand) {
  // command.userEmail provided but not used for tracking
  // command.workspaceId provided but not verified
}
```

**Issues:**
- ❌ Can't audit who created tickets
- ❌ Can't prevent unauthorized creation
- ❌ Can't track usage for billing/analytics

**Fix Required:**
```typescript
// Add user verification and tracking
if (aec.createdBy !== command.userEmail) {
  throw new ForbiddenException('User mismatch');
}
```

---

### 6. **BDD Criteria Validation Missing**

**Current State:**
```typescript
const criteria = criteria.filter((c) => c.given && c.when && c.then);
// Silently filters out invalid criteria
```

**Issues:**
- ❌ Invalid criteria removed without user feedback
- ❌ User might expect all criteria to be created
- ❌ No warning that some were skipped

**Fix:**
```typescript
// Validate before filtering
const invalid = criteria.filter(c => !c.given || !c.when || !c.then);
if (invalid.length > 0) {
  throw new BadRequestException(
    `Invalid BDD criteria: ${invalid.length} items missing required fields`
  );
}
```

---

## 🟠 Minor Gaps (P3 - Next Sprint)

### 7. **Epic Name Not Stored as Field**

**Current State:**
```typescript
// Only stored in description
aec.updateDescription(`**Epic:** ${ticket.epicName}\n${ticket.description}`);
```

**Issues:**
- ❌ Can't query tickets by epic
- ❌ Can't filter by epic in UI
- ❌ Epic info embedded in text, not structured

**Fix:**
```typescript
// Add epicName field to AEC model
interface AEC {
  epicName?: string;  // NEW
  // ...
}
```

---

### 8. **Frontend Partial Failure Handling**

**Current State:**
```typescript
// PRDInputForm.tsx shows generic error message
setError(message);
// Doesn't differentiate between:
// - All failed
// - Partial success (14 of 15)
// - Minor errors
```

**Issues:**
- ❌ User doesn't know how many tickets succeeded
- ❌ Can't decide whether to retry
- ❌ No option to see which specific tickets failed

**Fix:**
```typescript
// Show detailed error info
if (result.errors.length > 0 && result.createdCount > 0) {
  // Partial success - show count + error details
  showWarning(`Created ${result.createdCount} of ${total}. ${result.errors.length} failed`);
} else if (result.errors.length === result.tickets.length) {
  // Total failure
  showError('All tickets failed to create');
}
```

---

### 9. **BDD Structure Preservation**

**Current State:**
- Frontend sends: `BDDCriterion[]` (structured)
- Backend converts: String format (unstructured)
- Result: Can't reconstruct BDD format later

**Issues:**
- ❌ Can't export to other formats that need BDD
- ❌ Can't display with color-coded Given/When/Then
- ❌ Loses semantic structure

---

### 10. **No Batch Progress Tracking**

**Current State:**
```typescript
// Frontend shows single loading spinner
setCreating(true);
const result = await prdService.bulkCreateFromBreakdown(request);
setCreating(false);
// User doesn't know which ticket is being created
```

**Issues:**
- ℹ️ Works fine but UX could be better
- ℹ️ For 100 tickets, progress is unclear
- ℹ️ Could use streaming/SSE for real-time updates

---

## Priority Fix Order

### Phase 1: Critical (Do Before Deployment)
```
1. Add BDD criteria validation (prevents silent failures)
2. Standardize error response format (ensures client can handle errors)
3. Add workspace isolation verification (security)
```

### Phase 2: Important (This Week)
```
4. Add acceptance criteria field storage (enables future features)
5. Implement user tracking (audit trail)
6. Add validation error messages (better UX)
```

### Phase 3: Polish (Next Sprint)
```
7. Add epic name field (queryability)
8. Improve partial failure UI (better UX)
9. Preserve BDD structure (data integrity)
10. Add progress tracking (nice-to-have)
```

---

## Test Strategy

### Automated Tests Needed

**Unit Tests:**
```typescript
// BulkCreateFromBreakdownUseCase.test.ts
describe('BDD Criteria Parsing', () => {
  test('should validate BDD structure', () => {
    // Test empty given/when/then
    // Test missing fields
    // Test invalid JSON
  });
});

describe('Error Handling', () => {
  test('should return consistent error format', () => {
    // Test 400 response
    // Test 401 response
    // Test error message structure
  });
});
```

**Integration Tests:**
```bash
# Run curl test suite
bash scripts/test-prd-breakdown.sh

# Verify:
# 1. Can analyze PRD
# 2. Can create tickets
# 3. Workspace isolation works
# 4. Error messages are consistent
```

---

## Deployment Readiness

| Aspect | Status | Notes |
|--------|--------|-------|
| **Core Functionality** | ✅ Ready | All features work |
| **Error Handling** | ⚠️ Needs Fix | Inconsistent format |
| **Security** | ⚠️ Needs Fix | No workspace validation |
| **Data Validation** | ⚠️ Needs Fix | Silent failures possible |
| **Documentation** | ✅ Good | Comprehensive flow docs |
| **Testing** | 🔴 Missing | No automated tests |
| **Monitoring** | ⚠️ Partial | Logging works, no metrics |

**Recommendation:** Fix critical gaps (1-3) before deploying to production.

---

## Next Steps

1. **Review this document** - Confirm gap severity with team
2. **Run curl tests** - Identify any actual behavior differences
3. **Fix critical gaps** - Validation, error format, workspace isolation
4. **Add unit tests** - Especially for error cases
5. **Deploy to staging** - Test with real data
6. **Address medium gaps** - Before full production launch
