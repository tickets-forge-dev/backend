# PRD Breakdown Documentation

**Complete documentation suite for PRD Breakdown Phase 1 & 2**

---

## Quick Navigation

### For QA/Testing
- **[Validation Matrix](./PRD-BREAKDOWN-VALIDATION-MATRIX.md)** - Complete test cases and scenarios (100+ tests)
- **[E2E Validation Guide](./PRD-BREAKDOWN-E2E-VALIDATION.md)** - Full workflow walkthrough with curl examples
- **[Quick Reference](./PRD-BREAKDOWN-QUICK-REFERENCE.md)** - API endpoints, error codes, testing commands

### For Developers
- **[API Reference](#api-reference-summary)** - Endpoint specifications
- **[Data Models](#data-models)** - Domain types and DTOs
- **[Architecture Decisions](#architecture-notes)** - Design rationale

### For Product
- **[User Flows](#user-flows)** - Step-by-step workflows
- **[Feature Summary](#feature-summary)** - What's included in Phase 1 & 2

---

## Feature Summary

### Phase 1: PRD Analysis ✅ COMPLETE

User can upload or paste a Product Requirements Document and Forge will:
- Extract functional requirements (FRs)
- Propose epic structure (high-level features)
- Generate user stories (granular work items)
- Create BDD acceptance criteria (Given/When/Then format)
- Map FR coverage (which stories cover each requirement)
- Stream real-time progress via Server-Sent Events

**Key Endpoint:** `POST /tickets/breakdown/prd` (SSE streaming)

### Phase 2: Bulk Creation & Enrichment ✅ COMPLETE

From the analyzed breakdown, users can:
- Review and edit all epics and stories
- Add/remove/reorder tickets
- Select which tickets to create as draft tickets
- Auto-save breakdown to browser localStorage
- Bulk create draft tickets (up to 100 at once)
- Run parallel enrichment (questions generation) on all selected tickets
- Answer clarification questions
- Bulk finalize (generate specs in parallel)

**Key Endpoints:**
- `POST /tickets/breakdown/bulk-create` (JSON)
- `POST /tickets/bulk/enrich` (SSE streaming)
- `POST /tickets/bulk/finalize` (SSE streaming)

---

## User Flows

### Flow 1: Analyze PRD → Review → Create

```
User                     Frontend              Backend
 │                           │                    │
 ├─ Open /tickets/breakdown──→ Check for draft    │
 │                           ├─ Resume banner if found
 │                           │
 ├─ Paste PRD text───────────→ Update store       │
 │                           │
 ├─ Click "Analyze PRD"──────→ POST /breakdown/prd ──→ Stream progress events
 │                           ├─ extracting        ├─ LLM analysis
 │                           ├─ proposing         ├─ Extract FRs
 │                           ├─ generating        ├─ Propose epics
 │                           └─ complete          └─ Generate stories
 │                           ├─ Store breakdown
 │                           │
 ├─ Review breakdown────────→ Display epics/stories
 │   - Edit titles           ├─ Edit dialog
 │   - Edit AC               ├─ Update story
 │   - Toggle selection      ├─ Save selection
 │   - Auto-saves to storage ├─ localStorage write (debounced 2s)
 │                           │
 ├─ Click "Enrich & Create"→ POST /breakdown/bulk-create ──→ Create draft tickets
 │                           ├─ Validate inputs          ├─ Save to DB
 │                           └─ Show ticket IDs          └─ Return IDs
 │                           │
 └─ [Proceed to enrichment]
```

### Flow 2: Parallel Enrichment (Stage 1)

```
User                     Frontend              Backend
 │                           │                    │
 ├─ Start enrichment─────────→ POST /bulk/enrich ──→ Parallel analysis
 │                           ├─ Stream progress   ├─ For each ticket:
 │                           │ (per ticket)       │  - Analyze context
 │                           │                    │  - Generate questions (up to 5)
 │                           │                    │  - Stream progress event
 │                           │                    │  - Send complete event
 │                           ├─ Show progress     │
 │                           │                    │
 └─ [Wait for completion]    └─ [All questions ready]
```

### Flow 3: Answer Questions (Stage 2)

```
User                     Frontend              Backend
 │                           │                    │
 ├─ View questions───────────→ Display Q&A form  │
 │                           ├─ Text inputs       │
 │                           ├─ Textarea          │
 │                           ├─ Dropdowns         │
 │                           │
 ├─ Answer all questions─────→ Validate answers  │
 │                           ├─ Max 5000 chars    │
 │                           ├─ Required fields   │
 │                           │
 ├─ Click "Finalize"────────→ POST /bulk/finalize ──→ Parallel spec generation
 │                           ├─ Submit answers    ├─ For each ticket:
 │                           │                    │  - Call FinalizeSpec
 │                           │                    │  - Generate tech spec
 │                           │                    │  - Stream progress
 │                           │                    │
 └─ [Wait for completion]    └─ [All specs ready]
```

### Flow 4: Draft Resumption (On Return Visit)

```
User                     Frontend              Backend
 │                           │                    │
 ├─ Open /tickets/breakdown──→ Check localStorage│
 │                           │                    │
 │                       Found draft (< 24h old)  │
 │                           │                    │
 ├─ See "Resume Draft" banner │                    │
 │                           │                    │
 ├─ Click "Resume"──────────→ resumeDraft()      │
 │                           ├─ Load from storage │
 │                           ├─ Restore PRD text │
 │                           ├─ Restore breakdown │
 │                           ├─ Restore selection │
 │                           └─ Move to review    │
 │                           │
 └─ [Continue from last state]
```

---

## API Reference Summary

### 1. POST /tickets/breakdown/prd

**Purpose:** Analyze PRD and return structured breakdown

**Request:**
```json
{
  "prdText": "string (100-50000 chars)",
  "projectName": "string (optional)",
  "repositoryOwner": "string (optional, ignored)",
  "repositoryName": "string (optional, ignored)"
}
```

**Response (SSE Stream):**
```
progress: {"type": "progress", "step": "extracting", "message": "..."}
progress: {"type": "progress", "step": "proposing", "message": "..."}
progress: {"type": "progress", "step": "generating", "message": "..."}
complete: {"type": "complete", "breakdown": {...}, "analysisTime": 25000, "estimatedTicketsCount": 12}
```

**Status Codes:**
- 200: SSE stream started
- 400: Validation error (PRD too short/long)
- 401: Unauthorized
- 500: LLM error

---

### 2. POST /tickets/breakdown/bulk-create

**Purpose:** Create multiple draft tickets from breakdown selection

**Request:**
```json
{
  "workspaceId": "string",
  "tickets": [
    {
      "epicName": "string",
      "title": "string",
      "description": "string",
      "type": "feature|bug|task",
      "priority": "low|medium|high|urgent",
      "acceptanceCriteria": "[{\"given\":\"...\",\"when\":\"...\",\"then\":\"...\"}]"
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
      "ticketId": "string",
      "error": null
    }
  ]
}
```

**Status Codes:**
- 201: Success
- 400: Validation error
- 403: Unauthorized (user not workspace owner)
- 500: Database error

---

### 3. POST /tickets/bulk/enrich

**Purpose:** Generate questions for multiple tickets in parallel

**Request:**
```json
{
  "workspaceId": "string",
  "ticketIds": ["ticket-id-1", "ticket-id-2"]
}
```

**Response (SSE Stream):**
```
progress: {"type": "progress", "ticketId": "...", "phase": "analyzing"}
complete: {"type": "complete", "ticketId": "...", "questions": [...]}
complete: {"type": "complete", "questions": {...}, "completedCount": 2, "failedCount": 0}
```

---

### 4. POST /tickets/bulk/finalize

**Purpose:** Generate specs for multiple tickets in parallel

**Request:**
```json
{
  "workspaceId": "string",
  "answers": [
    {
      "ticketId": "string",
      "questionId": "string",
      "answer": "string (max 5000 chars)"
    }
  ]
}
```

**Response (SSE Stream):**
```
progress: {"type": "progress", "ticketId": "...", "phase": "generating_spec"}
complete: {"type": "complete", "ticketId": "...", "spec": {...}}
complete: {"type": "complete", "completedCount": 2, "failedCount": 0, "specs": {...}}
```

---

## Data Models

### BreakdownTicket

```typescript
interface BreakdownTicket {
  id: number;                    // Numeric index for referencing
  epicName: string;              // Which epic this belongs to
  epicIndex: number;             // 1-indexed
  storyIndex: number;            // 1-indexed within epic
  title: string;                 // Story title
  description: string;           // User story
  type: 'feature' | 'bug' | 'task';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  acceptanceCriteria: BDDCriterion[];
  functionalRequirements: string[];  // e.g., ["FR1", "FR2"]
  blockedBy: number[];           // Ticket IDs that must complete first
  technicalNotes?: string;
  isSelected: boolean;           // User selection state
}
```

### BDDCriterion

```typescript
interface BDDCriterion {
  given: string;    // Precondition
  when: string;     // Action/trigger
  then: string;     // Expected outcome
}
```

### BreakdownSummary

```typescript
interface BreakdownSummary {
  totalTickets: number;
  epicCount: number;
  epics: BreakdownEpic[];
  frCoverage: Record<string, string[]>;  // FR -> [story titles]
  frInventory: Array<{ id: string; description: string }>;
}
```

---

## Critical Fixes Implemented

### CRITICAL FIX #1: BDD Criteria Validation
**Issue:** Invalid criteria could slip through (empty given/when/then fields)
**Solution:** Explicit trim() check on all required fields in `BulkCreateFromBreakdownUseCase`
**File:** `backend/src/tickets/application/use-cases/BulkCreateFromBreakdownUseCase.ts` (lines 140-149)

### CRITICAL FIX #2: originalIndex Mapping
**Issue:** When early tickets fail, order gets confused in response
**Solution:** Include `originalIndex` in all responses, preserving original order
**File:** `backend/src/tickets/application/use-cases/BulkCreateFromBreakdownUseCase.ts` (line 179-181)

### CRITICAL FIX #3: Workspace Isolation
**Issue:** User could create tickets in workspace they don't own
**Solution:** Verify `workspace.ownerId === command.userId` with ForbiddenException
**File:** `backend/src/tickets/application/use-cases/BulkCreateFromBreakdownUseCase.ts` (lines 91-100)

### CRITICAL FIX #4: SSE Timeout Handling
**Issue:** Timeout could fail silently or hang indefinitely
**Solution:** Reset timeout on each chunk received, 120-second limit enforced
**File:** `client/src/services/prd.service.ts` (lines 112-120)

---

## Architecture Notes

### Why SSE Instead of Polling?

- **Real-time:** Progress visible immediately (vs. polling every 1-2s)
- **Bandwidth:** Single connection instead of repeated HTTP requests
- **Simplicity:** No complex state management for polling
- **Browser native:** Works with standard Fetch API

### Why localStorage for Drafts?

- **MVP approach:** Fast development without backend changes
- **Privacy:** Draft data stays on user's device (not backed up)
- **Simplicity:** No need for database schema changes
- **Future:** Can migrate to Firestore with minimal code changes

### Why Parallel Enrichment/Finalization?

- **Speed:** 5 tickets enrich in ~60s (vs. 5×12s = 60s sequential with better LLM)
- **UX:** User sees all progress in parallel
- **Scalability:** Can handle up to 100 tickets in one batch

### Repository Optional (v1.1)

**Original Design:** Repository required for code-touching flows
**User Feedback:** "Why is repository here? It's not helping."

**Root Cause Analysis:**
- PRD analysis is content-only (no code reading needed)
- Repository only needed for deep analysis (future phases)

**Solution:** Made repository fields optional in Phase 1 & 2

---

## Known Limitations

1. **No Concurrent Editing**
   - Single draft per user (last-write-wins)
   - No conflict resolution if multiple tabs open

2. **localStorage Only**
   - No server-side backup
   - Deleted if browser data cleared
   - Typical quota: 5-10MB

3. **Batch Size Limit**
   - Max 100 tickets per request
   - Must split larger PRDs manually

4. **No Offline Mode**
   - Requires internet connection
   - SSE streams require stable connection

5. **No Auto-Sync Between Devices**
   - Draft only available on device where created
   - No mobile app support

---

## Deployment Checklist

Before going to production:

### Backend
- [ ] Environment variables configured
  - [ ] SESSION_SECRET
  - [ ] NEXT_PUBLIC_API_URL
  - [ ] LLM provider API keys
- [ ] Database migrations run
- [ ] Error logging enabled
- [ ] Rate limiting configured

### Frontend
- [ ] NEXT_PUBLIC_API_URL set correctly
- [ ] Firebase config valid
- [ ] Build passes without errors
- [ ] No hardcoded test data
- [ ] No debug statements

### Testing
- [ ] All happy path tests pass
- [ ] All error scenarios handled
- [ ] Performance targets met
- [ ] Accessibility verified
- [ ] Cross-browser tested (Chrome, Firefox, Safari, Edge)

### Monitoring
- [ ] Error tracking enabled (Sentry)
- [ ] Performance metrics logged
- [ ] API response times monitored
- [ ] Storage quota monitored
- [ ] User session tracking enabled

---

## Troubleshooting

### Issue: "PRD analysis timeout"
**Cause:** Network too slow or backend LLM taking too long
**Solution:** 
- Check internet connection
- Verify API server is responsive
- Try with smaller PRD (< 30,000 chars)
- Retry after 1 minute

### Issue: "Invalid BDD criteria" error on bulk create
**Cause:** Acceptance criteria missing given/when/then fields
**Solution:**
- Edit the ticket in the review step
- Ensure all AC fields are filled
- Remove empty criteria rows

### Issue: Draft not resuming
**Cause:** Draft expired (> 24 hours old) or localStorage cleared
**Solution:**
- Re-analyze the PRD
- Draft auto-saves again
- Can't recover expired drafts

### Issue: Bulk enrich only partially completes
**Cause:** Some tickets failed, others succeeded (best-effort)
**Solution:**
- Check error messages in response
- Fix failing tickets manually
- Re-enrich just the failed ones

---

## Related Documentation

- **Architecture Docs:** `/docs/architecture/`
- **API Reference:** OpenAPI spec at `/docs/openapi.json`
- **Domain Models:** `backend/src/tickets/domain/`
- **Database Schema:** Firestore collections in `backend/src/tickets/infrastructure/`

---

## Testing Resources

- **Test Cases:** `PRD-BREAKDOWN-VALIDATION-MATRIX.md` (100+ test scenarios)
- **Test Commands:** `PRD-BREAKDOWN-E2E-VALIDATION.md` (curl examples)
- **API Reference:** `PRD-BREAKDOWN-QUICK-REFERENCE.md` (quick lookup)

---

## Support & Questions

For issues or questions:
1. Check the [Validation Matrix](./PRD-BREAKDOWN-VALIDATION-MATRIX.md) for test scenarios
2. Review [Quick Reference](./PRD-BREAKDOWN-QUICK-REFERENCE.md) for API details
3. See [Troubleshooting](#troubleshooting) section above

---

## Document Versions

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-11 | Initial documentation for Phase 1 & 2 |
| | | - E2E Validation Guide |
| | | - Quick Reference |
| | | - Validation Matrix (100+ tests) |
| | | - This README |

---

**Last Updated:** 2026-02-11
**Status:** Complete & Ready for Production
