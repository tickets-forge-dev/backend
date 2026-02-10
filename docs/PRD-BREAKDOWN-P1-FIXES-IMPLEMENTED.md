# PRD Breakdown - P1 Critical Fixes Implemented

**Status:** ✅ COMPLETE
**Commit:** 57b0008
**Date:** 2026-02-10
**Build Status:** ✅ 0 TypeScript errors (both backend and client)

---

## Overview

All 3 P1 Critical fixes identified in the gap analysis have been successfully implemented. These fixes address security, data validation, and error handling concerns before the feature can be deployed to production.

---

## P1 Fix #1: BDD Criteria Parsing Validation

### Problem
The acceptance criteria parsing in `BulkCreateFromBreakdownUseCase` silently failed when criteria was invalid:
- Empty `given`, `when`, `then` fields would be silently ignored
- Invalid JSON would log a warning but continue
- User wouldn't know if their criteria was actually saved

### Solution
Added comprehensive validation in BulkCreateFromBreakdownUseCase.ts (lines 98-130):

```typescript
// Validate structure
if (!Array.isArray(criteria)) {
  throw new BadRequestException(
    `Invalid acceptance criteria format: must be an array`
  );
}

// Validate each criterion
const invalidIndices = criteria
  .map((c: any, idx: number) => ({ c, idx }))
  .filter(({ c }) => !c.given?.trim() || !c.when?.trim() || !c.then?.trim())
  .map(({ idx }) => idx);

if (invalidIndices.length > 0) {
  throw new BadRequestException(
    `Invalid BDD criteria: criterion(s) at index ${invalidIndices.join(', ')}
     missing required fields (given, when, then)`
  );
}

// Re-throw validation errors
if (e instanceof BadRequestException) {
  throw e;
}

// Convert parse errors
throw new BadRequestException(
  `Failed to parse acceptance criteria: ${e.message}`
);
```

### Behavior Changes

| Scenario | Before | After |
|----------|--------|-------|
| Empty given/when/then | ✗ Silent failure, logged warning | ✓ 400 BadRequest with error message |
| Invalid JSON | ✗ Silent failure, logged warning | ✓ 400 BadRequest with parse error |
| Missing field | ✗ Silent failure | ✓ 400 BadRequest with field index |
| Valid criteria | ✓ Works | ✓ Works (unchanged) |

### Test Cases

```bash
# Test 1: Empty field should fail
curl -X POST /tickets/breakdown/bulk-create \
  -d '{
    "tickets": [{
      "acceptanceCriteria": "[{\"given\": \"\", \"when\": \"W\", \"then\": \"T\"}]"
    }]
  }'
# Expected: 400 BadRequest with "missing required fields"

# Test 2: Invalid JSON should fail
curl -X POST /tickets/breakdown/bulk-create \
  -d '{
    "tickets": [{
      "acceptanceCriteria": "invalid json {{"
    }]
  }'
# Expected: 400 BadRequest with "Failed to parse"

# Test 3: Valid criteria should work
curl -X POST /tickets/breakdown/bulk-create \
  -d '{
    "tickets": [{
      "acceptanceCriteria": "[{\"given\": \"G\", \"when\": \"W\", \"then\": \"T\"}]"
    }]
  }'
# Expected: 201 Created
```

---

## P1 Fix #2: Error Response Format Consistency

### Problem
Error responses from the bulk-create endpoint had inconsistent formats:
- Domain errors (BadRequestException) wrapped in additional BadRequestException
- Frontend expected { message, statusCode } but might receive raw error strings
- Error codes inconsistent between endpoints

### Solution
Updated error handling in tickets.controller.ts:

```typescript
} catch (error: any) {
  this.logger.error(`Bulk creation failed: ${error.message}`);

  // Re-throw BadRequestException and ForbiddenException with original format
  if (error instanceof BadRequestException || error instanceof ForbiddenException) {
    throw error;
  }

  // Wrap other errors
  throw new BadRequestException(
    error.message || 'Failed to create tickets from breakdown'
  );
}
```

### Behavior Changes

| Error Type | Before | After |
|-----------|--------|-------|
| BadRequestException | Wrapped twice | Thrown as-is (NestJS formats as JSON) |
| ForbiddenException | Wrapped in BadRequest | Thrown as-is (403 status) |
| Other errors | Generic message | Wrapped in BadRequest with details |

### NestJS Error Format

All exceptions now return consistent NestJS format:

```json
{
  "statusCode": 400,
  "message": "Invalid BDD criteria: criterion(s) at index 0 missing required fields (given, when, then)",
  "error": "BadRequest"
}
```

Or for forbidden access:

```json
{
  "statusCode": 403,
  "message": "User does not have permission to create tickets in this workspace",
  "error": "Forbidden"
}
```

---

## P1 Fix #3: Workspace Isolation Verification

### Problem
The bulk-create endpoint accepted a `workspaceId` but never verified:
- Whether the user owns the workspace
- Whether the workspace exists
- Whether the user has permission to create in that workspace

This could allow users to create tickets in other users' workspaces (security issue).

### Solution
Added workspace ownership verification in BulkCreateFromBreakdownUseCase.ts (lines 72-83):

**1. Updated BulkCreateCommand interface:**
```typescript
export interface BulkCreateCommand {
  workspaceId: string;
  userEmail: string;
  userId: string;  // ← NEW: Firebase UID for verification
  tickets: BreakdownTicketToCreate[];
}
```

**2. Injected WorkspaceRepository:**
```typescript
constructor(
  @Inject(AEC_REPOSITORY)
  private readonly aecRepository: AECRepository,
  @Inject(WORKSPACE_REPOSITORY)
  private readonly workspaceRepository: WorkspaceRepository,  // ← NEW
  private readonly createTicketUseCase: CreateTicketUseCase,
) {}
```

**3. Added validation logic:**
```typescript
// Verify workspace exists
const workspace = await this.workspaceRepository.findById(command.workspaceId);
if (!workspace) {
  throw new BadRequestException(`Workspace "${command.workspaceId}" not found`);
}

// Verify user owns workspace
if (workspace.ownerId !== command.userId) {
  throw new ForbiddenException(
    'User does not have permission to create tickets in this workspace'
  );
}
```

**4. Updated controller to pass userId:**
```typescript
const result = await this.bulkCreateFromBreakdownUseCase.execute({
  workspaceId,
  userEmail,
  userId,  // ← Now included
  tickets: dto.tickets,
});
```

### Security Implications

| Scenario | Before | After |
|----------|--------|-------|
| Valid user, valid workspace | ✓ Creates | ✓ Creates |
| Valid user, non-existent workspace | ✗ Creates (no validation) | ✓ 400 BadRequest |
| Valid user, other user's workspace | ✗ Creates (no validation) | ✓ 403 Forbidden |
| Invalid userId (spoofed) | ✗ Would create | ✓ 403 Forbidden |

### Defense-in-Depth

**Note:** The `WorkspaceGuard` already prevents cross-workspace access at the HTTP layer by validating the `workspaceId` matches the user's Firebase UID. This fix adds a second layer of validation at the use case level for defense-in-depth:

1. **HTTP Layer:** WorkspaceGuard validates workspaceId ← Firebase UID
2. **Use Case Layer:** BulkCreateFromBreakdownUseCase validates workspace ownership ← NEW

This ensures that even if the guard is bypassed or modified, the use case still validates permissions.

---

## Files Modified

### Backend

**`backend/src/tickets/application/use-cases/BulkCreateFromBreakdownUseCase.ts`**
- Added ForbiddenException import
- Added WORKSPACE_REPOSITORY import
- Updated BulkCreateCommand interface with userId field
- Updated constructor to inject WorkspaceRepository
- Added BDD validation logic (lines 98-130)
- Added workspace ownership verification (lines 72-83)
- Enhanced error handling for parse errors

**`backend/src/tickets/presentation/controllers/tickets.controller.ts`**
- Pass userId to bulkCreateFromBreakdownUseCase.execute()
- Updated error handling to properly re-throw domain exceptions

### New Files

**`scripts/test-prd-breakdown-p1-fixes.sh`**
- Comprehensive test suite for all 3 P1 fixes
- Tests BDD validation (empty, missing, invalid fields)
- Tests error response format consistency
- Tests workspace isolation verification
- Run: `bash scripts/test-prd-breakdown-p1-fixes.sh`

---

## Testing

### Manual Testing Commands

**Test P1 Fix #1 (BDD Validation):**
```bash
# Invalid criteria (empty given field)
curl -X POST http://localhost:3000/api/tickets/breakdown/bulk-create \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tickets": [{
      "epicName": "Test",
      "title": "Test",
      "description": "Test",
      "type": "feature",
      "priority": "high",
      "acceptanceCriteria": "[{\"given\": \"\", \"when\": \"When\", \"then\": \"Then\"}]"
    }]
  }'
# Expected: 400 BadRequest with message about "missing required fields"
```

**Test P1 Fix #3 (Workspace Isolation):**
```bash
# Will be validated by WorkspaceGuard at HTTP layer
# Use case adds second layer: attempts to access non-existent workspace
curl -X POST http://localhost:3000/api/tickets/breakdown/bulk-create \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tickets": [{
      "epicName": "Test",
      "title": "Test",
      "description": "Test",
      "type": "feature",
      "priority": "high",
      "acceptanceCriteria": "[{\"given\": \"G\", \"when\": \"W\", \"then\": \"T\"}]"
    }]
  }'
# WorkspaceGuard validates user can access workspace
# BulkCreateFromBreakdownUseCase validates workspace ownership
```

### Automated Testing

Run the comprehensive test suite:
```bash
export FIREBASE_TOKEN="your_firebase_token"
bash scripts/test-prd-breakdown-p1-fixes.sh
```

The script tests:
- BDD criteria with empty fields
- BDD criteria with invalid JSON
- BDD criteria with missing fields
- Error response format consistency
- Bulk create limits (100 tickets max)
- Workspace isolation validation

---

## Deployment Checklist

- [x] P1 Fix #1: BDD Criteria Parsing Validation ✅
- [x] P1 Fix #2: Error Response Format Consistency ✅
- [x] P1 Fix #3: Workspace Isolation Verification ✅
- [x] Build passes with 0 TypeScript errors ✅
- [x] Manual testing commands documented ✅
- [x] Automated test suite created ✅
- [x] Implementation documented ✅

**Status:** Ready for production deployment ✅

---

## Next Steps

After deployment, address P2 Medium gaps:
1. **Acceptance Criteria Field Storage** - Add epicName as AEC field (not just in description)
2. **User Tracking** - Implement audit trail for who created/modified tickets
3. **BDD Criteria Validation** - Enhance validation error messages with specific field details

Then P3 Minor gaps:
4. **Epic Name Field** - Add structured epicName to AEC model
5. **Frontend Partial Failure UI** - Show detailed error info for partial successes
6. **BDD Structure Preservation** - Store BDD structure for future export
7. **Batch Progress Tracking** - Stream progress updates during bulk creation

---

## References

- Gap Analysis: `/docs/PRD-BREAKDOWN-GAPS.md`
- Curl Tests: `/docs/PRD-BREAKDOWN-CURL-TESTS.md`
- Flow Documentation: `/docs/PRD-BREAKDOWN-FLOW.md`
- Test Script: `/scripts/test-prd-breakdown-p1-fixes.sh`
