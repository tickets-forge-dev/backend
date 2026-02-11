# PRD Breakdown Quick Reference

**Quick lookup for API endpoints, error codes, and common scenarios**

---

## API Endpoints Summary

| Endpoint | Method | Purpose | Auth | Transport | Timeout |
|----------|--------|---------|------|-----------|---------|
| `/tickets/breakdown/prd` | POST | Analyze PRD text | ✅ | SSE | 120s |
| `/tickets/breakdown/bulk-create` | POST | Create draft tickets | ✅ | JSON | 30s |
| `/tickets/bulk/enrich` | POST | Generate questions | ✅ | SSE | 120s |
| `/tickets/bulk/finalize` | POST | Generate specs | ✅ | SSE | 120s |

---

## Request/Response Schemas

### POST /tickets/breakdown/prd

**Request:**
```json
{
  "prdText": "string (100-50000 chars, required)",
  "projectName": "string (optional)",
  "repositoryOwner": "string (optional, ignored)",
  "repositoryName": "string (optional, ignored)"
}
```

**Response (SSE Stream):**
```
progress: { "type": "progress", "step": "extracting", "message": "..." }
progress: { "type": "progress", "step": "proposing", "message": "..." }
progress: { "type": "progress", "step": "generating", "message": "..." }
complete: { "type": "complete", "breakdown": {...}, "analysisTime": 25000, "estimatedTicketsCount": 12 }
```

---

### POST /tickets/breakdown/bulk-create

**Request:**
```json
{
  "workspaceId": "string (required)",
  "tickets": [
    {
      "epicName": "string (required)",
      "title": "string (required)",
      "description": "string (required)",
      "type": "feature|bug|task (required)",
      "priority": "low|medium|high|urgent (required)",
      "acceptanceCriteria": "JSON string (required)"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "results": [
    {
      "originalIndex": 0,
      "title": "string",
      "ticketId": "string (if success)",
      "error": "string (if failure)"
    }
  ]
}
```

**Error Responses:**
```json
// 400 - Validation error
{ "statusCode": 400, "message": "...", "error": "BadRequest" }

// 403 - Unauthorized
{ "statusCode": 403, "message": "User does not have permission", "error": "Forbidden" }

// 500 - Server error
{ "statusCode": 500, "message": "...", "error": "InternalServerError" }
```

---

### POST /tickets/bulk/enrich

**Request:**
```json
{
  "workspaceId": "string (required)",
  "ticketIds": ["string (ticket IDs)", ...]
}
```

**Response (SSE Stream):**
```
progress: { "type": "progress", "ticketId": "...", "phase": "analyzing", "message": "..." }
complete: { "type": "complete", "ticketId": "...", "questions": [...] }
complete: { "type": "complete", "questions": {...}, "completedCount": 2, "failedCount": 0 }
```

---

### POST /tickets/bulk/finalize

**Request:**
```json
{
  "workspaceId": "string (required)",
  "answers": [
    {
      "ticketId": "string (required)",
      "questionId": "string (required)",
      "answer": "string (max 5000 chars, required)"
    }
  ]
}
```

**Response (SSE Stream):**
```
progress: { "type": "progress", "ticketId": "...", "phase": "generating_spec", "message": "..." }
complete: { "type": "complete", "ticketId": "...", "spec": {...} }
complete: { "type": "complete", "completedCount": 2, "failedCount": 0, "specs": {...} }
```

---

## Validation Rules

### PRD Text
- Min: 100 characters
- Max: 50,000 characters
- Required: non-empty, trimmed

### Batch Size
- Min: 1 ticket
- Max: 100 tickets per request

### Acceptance Criteria (BDD)
```json
[
  {
    "given": "string (required, non-empty)",
    "when": "string (required, non-empty)",
    "then": "string (required, non-empty)"
  }
]
```
- Must be valid JSON
- All fields required
- No empty strings after trim()

### Answer Text
- Max: 5,000 characters
- Required: non-empty
- Supports: Plain text, markdown, unicode

### Ticket Type
- `feature`
- `bug`
- `task`

### Priority Levels
- `low`
- `medium`
- `high`
- `urgent`

---

## Error Codes & Messages

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| 400 | PRD text is too short (X chars). Minimum 100 required. | User provided < 100 chars | Expand PRD text |
| 400 | PRD text is too long (X chars). Maximum 50000 allowed. | User provided > 50,000 chars | Shorten PRD text |
| 400 | No tickets provided for bulk creation | Empty tickets array | Select at least 1 ticket |
| 400 | Bulk creation limit is 100 tickets. Please split... | > 100 tickets in batch | Split into multiple requests |
| 400 | Invalid BDD criteria... criterion(s) at index X missing required fields | Missing given/when/then | Edit criteria in UI |
| 403 | User does not have permission to create tickets in this workspace | User not workspace owner | Check workspace access |
| 404 | Workspace not found | Invalid workspaceId | Use valid workspace ID |
| 500 | Failed to analyze PRD | LLM error or network issue | Retry, check PRD quality |
| 500 | Failed to create tickets from breakdown | Database error | Contact support |

---

## localStorage Keys

| Key | Format | TTL | Notes |
|-----|--------|-----|-------|
| `prd-breakdown-latest` | string (draftId) | None | Pointer to latest draft |
| `prd-breakdown-<draftId>` | JSON object | 24 hours | Full draft data |

**Draft Object Structure:**
```json
{
  "id": "draft-1707650400000",
  "prdText": "string",
  "projectName": "string",
  "breakdown": {
    "tickets": [...],
    "summary": {...}
  },
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

---

## Common Scenarios

### Scenario 1: User has unsaved draft on return

```javascript
// On page load:
const draft = await prdService.getLatestDraft();

if (draft && isWithin24Hours(draft.createdAt)) {
  showResumeBanner();
  // User clicks "Resume" or "Dismiss"
}
```

### Scenario 2: Network timeout during analysis

```javascript
// Frontend timeout: 120 seconds
// If no data received in 120s:
throw new Error(
  'PRD analysis timeout: No response for 120 seconds. ' +
  'Check your network connection.'
);

// User should retry
```

### Scenario 3: Partial batch failure

```json
// Request: 5 tickets
// Response: 4 succeed, 1 fails with invalid BDD criteria

{
  "results": [
    { "originalIndex": 0, "ticketId": "uuid-1", "error": null },
    { "originalIndex": 1, "ticketId": "uuid-2", "error": null },
    { "originalIndex": 2, "title": "Failed Story", "error": "Invalid BDD criteria" },
    { "originalIndex": 3, "ticketId": "uuid-3", "error": null },
    { "originalIndex": 4, "ticketId": "uuid-4", "error": null }
  ]
}

// Note: originalIndex preserved even when tickets fail
// User can see which specific ticket failed
```

### Scenario 4: User deselects all tickets

```javascript
// Before "Enrich & Create":
const selectedCount = breakdown.tickets.filter(t => t.isSelected).length;

if (selectedCount === 0) {
  showError('Please select at least one ticket');
  disableButton();
  return;
}
```

### Scenario 5: Auto-save triggered on edit

```javascript
// Debounced 2-second auto-save
useEffect(() => {
  const timeout = setTimeout(async () => {
    const draftId = await prdService.saveDraft(breakdown, prdText, projectName);
    setLastSavedAt(new Date());
  }, 2000);

  return () => clearTimeout(timeout);
}, [breakdown, prdText, projectName]);
```

---

## Testing Quick Commands

### Test PRD Analysis
```bash
curl -X POST http://localhost:3000/api/tickets/breakdown/prd \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"prdText":"'$(cat << 'EOF' | sed 's/"/\\"/g'
## Product Overview

This is a test PRD with requirements for a user authentication system.

## Requirements

1. Users must be able to sign up with email and password
2. Users must be able to log in with email and password
3. Users must be able to reset their password via email
4. All passwords must be hashed using bcrypt
5. Session tokens must expire after 1 hour

## Acceptance Criteria

The system must handle concurrent user registrations without race conditions.
The password reset flow must not be vulnerable to enumeration attacks.
The session management must not allow token reuse after logout.

## Technical Constraints

- Use Node.js with Express for the backend
- Use React for the frontend
- Use PostgreSQL for the database
- All endpoints must use HTTPS
EOF
)'", "projectName":"Auth System"}'
```

### Test Bulk Create
```bash
curl -X POST http://localhost:3000/api/tickets/breakdown/bulk-create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "workspaceId": "ws-123",
    "tickets": [
      {
        "epicName": "Authentication",
        "title": "Implement user signup",
        "description": "As a user, I want to sign up with email and password",
        "type": "feature",
        "priority": "high",
        "acceptanceCriteria": "[{\"given\":\"User is on signup page\",\"when\":\"User enters valid email and password\",\"then\":\"Account is created and user is logged in\"}]"
      }
    ]
  }'
```

### Validate Error Response
```bash
# Test with undersized PRD (should get 400)
curl -X POST http://localhost:3000/api/tickets/breakdown/prd \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"prdText":"Too short"}'

# Expected response:
# {"statusCode":400,"message":"PRD text is too short (9 chars). Minimum 100 required.","error":"BadRequest"}
```

---

## UI Component Hierarchy

```
/tickets/breakdown (page)
├── PRDInputForm
│   ├── Resume Draft Banner
│   ├── PRD Text Input
│   ├── Project Name Input (optional)
│   └── Analyze Button
├── BreakdownReview (after analysis)
│   ├── Header (analysis time, estimated count)
│   ├── EpicGroup (for each epic)
│   │   ├── TicketCard (for each ticket)
│   │   │   ├── Edit Dialog
│   │   │   ├── BDD Criteria Editor
│   │   │   └── Delete Button
│   │   └── Reorder Controls
│   ├── Select All / Deselect All
│   ├── Last Saved Timestamp
│   └── Enrich & Create Button
├── BulkEnrichmentWizard (after creation)
│   ├── Stage 1: Enrich Progress
│   ├── Stage 2: Answer Questions
│   └── Stage 3: Finalize Progress
└── SuccessView (after finalization)
    ├── Created Count
    ├── Ticket Links
    └── View All Tickets Button
```

---

## File Locations

### Backend
- Use Cases: `backend/src/tickets/application/use-cases/`
  - `PRDBreakdownUseCase.ts`
  - `BulkCreateFromBreakdownUseCase.ts`
  - `EnrichMultipleTicketsUseCase.ts`
  - `FinalizeMultipleTicketsUseCase.ts`
- Services: `backend/src/tickets/application/services/PRDBreakdownService.ts`
- DTOs: `backend/src/tickets/presentation/dto/PRDBreakdownDto.ts`
- Controller: `backend/src/tickets/presentation/controllers/tickets.controller.ts` (lines 865-1100)
- Domain Types: `backend/src/tickets/domain/prd-breakdown/prd-breakdown.types.ts`

### Frontend
- Service: `client/src/services/prd.service.ts`
- Store: `client/src/tickets/stores/prd-breakdown.store.ts`
- Components: `client/src/tickets/components/prd/`
  - `PRDInputForm.tsx`
  - `BreakdownReview.tsx`
  - `EpicGroup.tsx`
  - `TicketCard.tsx`
  - `SuccessView.tsx`
- Bulk Wizard: `client/src/tickets/components/bulk/BulkEnrichmentWizard.tsx`

---

## Performance Targets

| Operation | Expected Time | Max Time | Notes |
|-----------|---------------|---------|----|
| PRD Analysis | 15-45s | 120s | Depends on LLM speed |
| Bulk Create (10 tickets) | 5-10s | 30s | Sequential creation |
| Bulk Enrich (5 tickets) | 20-60s | 120s | Parallel, LLM dependent |
| Bulk Finalize (5 tickets) | 30-90s | 120s | Parallel, LLM dependent |
| Draft Auto-save | <500ms | 2s | localStorage write (debounced) |
| Draft Resume | <100ms | N/A | localStorage read |

---

## Security Checklist

- ✅ Workspace isolation enforced (ForbiddenException if user not owner)
- ✅ BDD criteria validated (no empty required fields)
- ✅ Batch size limited (max 100 tickets)
- ✅ Input length validated (100-50,000 chars for PRD)
- ✅ Auth token required (Firebase Auth)
- ✅ XSS protected (React auto-escapes)
- ✅ No localStorage sensitive data (only PRD + breakdown)
- ✅ CORS configured (Backend handles)

---

## Debugging Tips

### Check Draft Storage
```javascript
// In browser console:
Object.keys(localStorage)
  .filter(k => k.includes('prd-breakdown'))
  .forEach(k => console.log(k, JSON.parse(localStorage[k])))
```

### Monitor SSE Stream
```javascript
// In browser DevTools Network tab:
// Filter by Name: "breakdown/prd"
// Click request → Response tab
// Watch streaming data chunks arrive
```

### Verify Auth Token
```bash
# Extract Firebase token and check contents
token=$(<firebase_token>)
echo $token | cut -d. -f2 | base64 -d | jq .
```

### Check Workspace Ownership
```javascript
// Verify user owns workspace before bulk create
// Check workspace.ownerId === currentUser.uid
```

---

## Related Documentation

- Full E2E Validation: [`PRD-BREAKDOWN-E2E-VALIDATION.md`](./PRD-BREAKDOWN-E2E-VALIDATION.md)
- Architecture: See `/docs/architecture/`
- API Reference: See OpenAPI spec
- Domain Models: `backend/src/tickets/domain/prd-breakdown/`

