# Story 7.9: Status Sync Web + CLI

Status: review

## Story

As a developer,
I want `forge list`, `forge review`, `forge execute`, and the web ticket list to correctly display and validate all ticket statuses (including `waiting-for-approval` and `ready`),
so that status transitions from the PM approval flow are immediately visible and actionable in both interfaces.

## Acceptance Criteria

1. CLI `AECStatus` enum values match the backend API response format exactly (lowercase hyphenated: `'draft'`, `'ready'`, `'waiting-for-approval'`, `'created'`, etc.).
2. `forge list` displays a correct status icon (⏳, 🚀, 📝, etc.) for all ticket statuses — no `❓` for tickets with `ready` or `waiting-for-approval` status.
3. `forge review <ticketId>` accepts tickets with status `ready` (post-approval flow) — the `REVIEW_VALID_STATUSES` check passes for real API responses.
4. `forge execute <ticketId>` accepts tickets with status `ready` — the `EXECUTE_VALID_STATUSES` check passes for real API responses.
5. `update_ticket_status` MCP tool sends lowercase hyphenated status values to the backend (currently sends uppercase like `'CREATED'`; backend expects `'created'`).
6. Status text displayed via `forge show` and `forge list` replaces hyphens with spaces for readability (e.g., `waiting-for-approval` → `waiting for approval`).
7. All existing CLI tests continue to pass after updating enum values.
8. Web UI ticket list correctly shows `'waiting-for-approval'` tickets with amber "Awaiting Review" badge — confirmed present, no changes needed.
9. `tsc --noEmit` → 0 errors in forge-cli.

## Tasks / Subtasks

- [x] Task 1: Fix `AECStatus` enum in `forge-cli/src/types/ticket.ts` (AC: 1, 2, 3, 4, 5)
  - [ ] Change all enum values to lowercase hyphenated to match backend:
    - `DRAFT = 'DRAFT'` → `DRAFT = 'draft'`
    - `IN_QUESTION_ROUND_1 = 'IN_QUESTION_ROUND_1'` → `IN_QUESTION_ROUND_1 = 'in-question-round-1'`
    - `IN_QUESTION_ROUND_2 = 'IN_QUESTION_ROUND_2'` → `IN_QUESTION_ROUND_2 = 'in-question-round-2'`
    - `IN_QUESTION_ROUND_3 = 'IN_QUESTION_ROUND_3'` → `IN_QUESTION_ROUND_3 = 'in-question-round-3'`
    - `QUESTIONS_COMPLETE = 'QUESTIONS_COMPLETE'` → `QUESTIONS_COMPLETE = 'questions-complete'`
    - `VALIDATED = 'VALIDATED'` → `VALIDATED = 'validated'`
    - `READY = 'READY'` → `READY = 'ready'`
    - `CREATED = 'CREATED'` → `CREATED = 'created'`
    - `WAITING_FOR_APPROVAL = 'WAITING_FOR_APPROVAL'` → `WAITING_FOR_APPROVAL = 'waiting-for-approval'`
    - `DRIFTED = 'DRIFTED'` → `DRIFTED = 'drifted'`
    - `COMPLETE = 'COMPLETE'` → `COMPLETE = 'complete'`

- [x] Task 2: Fix status text display — replace hyphens (AC: 6)
  - [ ] In `forge-cli/src/ui/pager.ts`: change `ticket.status.replace(/_/g, ' ')` → `ticket.status.replace(/-/g, ' ')`
  - [ ] In `forge-cli/src/ui/formatters.ts` (`formatTicketRow`): change `ticket.status.replace(/_/g, ' ')` → `ticket.status.replace(/-/g, ' ')`
  - [ ] In `forge-cli/src/commands/review.ts`: change `ticket.status.replace(/_/g, ' ')` → `ticket.status.replace(/-/g, ' ')`
  - [ ] In `forge-cli/src/commands/execute.ts`: change `ticket.status.replace(/_/g, ' ')` → `ticket.status.replace(/-/g, ' ')`

- [x] Task 3: Update all CLI tests to use correct lowercase status values (AC: 7)
  - [ ] `forge-cli/src/commands/__tests__/execute.test.ts` — update mock status values
  - [ ] `forge-cli/src/commands/__tests__/review.test.ts` (if exists) — update mock status values
  - [ ] `forge-cli/src/mcp/tools/__tests__/update-ticket-status.test.ts` — update expected values
  - [ ] Any other test file using `AECStatus.*` as mock API response values

- [x] Task 4: Verify web UI status display (AC: 8)
  - [ ] Confirm `client/app/(main)/tickets/page.tsx` status map includes `'waiting-for-approval'` with label and color (already present — read-only verification, no code change expected)

- [x] Task 5: TypeScript check and run tests (AC: 9)
  - [ ] Run `tsc --noEmit` in `forge-cli/` → 0 errors
  - [ ] Run `pnpm test` in `forge-cli/` → all tests pass

## Dev Notes

### Root Cause

The CLI's `AECStatus` enum has always used uppercase underscore values (e.g., `READY = 'READY'`) while the backend `AECStatus` enum uses lowercase hyphenated values (e.g., `READY = 'ready'`). This mismatch means:

1. `REVIEW_VALID_STATUSES.has(ticket.status)` — checks if `Set<'READY', ...>` contains `'ready'` → always `false`
2. `statusIcon(ticket.status)` — looks up `STATUS_ICONS['ready']` but key is `'READY'` → returns `❓`
3. `update_ticket_status` sends `'CREATED'` to backend which expects `'created'`

The `STATUS_ICONS` map uses `[AECStatus.READY]: '🚀'` which auto-resolves via computed property key — so fixing the enum value automatically fixes the map lookup.

### Backend Reference Values

From `backend/src/tickets/domain/value-objects/AECStatus.ts`:
```typescript
DRAFT = 'draft',
IN_QUESTION_ROUND_1 = 'in-question-round-1',
READY = 'ready',
CREATED = 'created',
WAITING_FOR_APPROVAL = 'waiting-for-approval',
DRIFTED = 'drifted',
COMPLETE = 'complete',
```

### Display Text Fix

Old status format was underscore-separated uppercase (e.g., `IN_QUESTION_ROUND_1`), so `.replace(/_/g, ' ')` produced `IN QUESTION ROUND 1`. After fix, status is hyphen-separated lowercase (e.g., `in-question-round-1`), so `.replace(/-/g, ' ')` produces `in question round 1` — readable without further transformation.

### Tests Strategy

Test files that mock API responses with `status: AECStatus.READY` (which expands to `'READY'`) need updating to reflect that real API returns `'ready'`. After enum fix, `AECStatus.READY === 'ready'`, so using `AECStatus.READY` in tests is still correct — tests just need to be aware that the actual string value changed for string equality assertions.

### Web UI Already Correct

`client/app/(main)/tickets/page.tsx` already has:
```typescript
'waiting-for-approval': { dot: 'bg-amber-500', label: 'Awaiting Review', text: 'text-amber-500' },
'ready': { dot: 'bg-green-500', label: 'Ready', text: 'text-green-500' },
```
No client changes needed.

### References

- [Source: forge-cli/src/types/ticket.ts] — AECStatus enum to update
- [Source: forge-cli/src/ui/formatters.ts] — STATUS_ICONS map + formatTicketRow display
- [Source: forge-cli/src/ui/pager.ts] — printTicketDetail status display
- [Source: forge-cli/src/commands/review.ts] — REVIEW_VALID_STATUSES + display
- [Source: forge-cli/src/commands/execute.ts] — EXECUTE_VALID_STATUSES + display
- [Source: forge-cli/src/mcp/tools/update-ticket-status.ts] — sends status to backend
- [Source: backend/src/tickets/domain/value-objects/AECStatus.ts] — authoritative status values

### Learnings from Previous Story

**From Story 7-8 (Status: review)**

- Domain method stays pure (no NestJS deps)
- `RolesGuard` not in codebase — don't reference it
- Pre-existing client TS errors: `workspaceId` on `AECResponse` (unrelated, from story 7-2)
- Pre-existing backend test failures: CreateTeamUseCase/GetUserTeamsUseCase (10 failures, unrelated)

[Source: stories/7-8-approve-button-pm-only.md#Dev-Agent-Record]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
