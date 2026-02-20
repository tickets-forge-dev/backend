# Story 5.5: Ticket Detail View

Status: review

## Story

As a developer using the Forge platform,
I want to run `forge show <ticketId>` and see the full ticket details in the terminal,
so that I can understand the full context of a ticket before reviewing or executing it.

## Acceptance Criteria

1. `forge show <ticketId>` requires a valid login — prints error and exits 1 if not logged in.
2. `forge show <ticketId>` fetches `GET /tickets/:ticketId` via `ApiService.get()`.
3. Output displays: ID + title header, status (with icon), priority, assignee, created/updated timestamps, description, numbered acceptance criteria list.
4. `forge show <ticketId>` with a non-existent ID prints "Ticket not found: {id}" and exits 1.
5. Output includes a footer with hints: `forge review <id>` and `forge execute <id>`.
6. `tsc --noEmit` exits with zero errors.

## Tasks / Subtasks

- [x] Task 1: Implement `Pager` in `src/ui/pager.ts` (AC: 3, 5)
  - [x] `printTicketDetail(ticket: TicketDetail)`: renders all ticket fields with chalk formatting
  - [x] Header: `[{id}] {title}` (bold)
  - [x] Metadata row: status icon + status text, priority (color-coded), assignee, created, updated
  - [x] Description section (if present)
  - [x] Numbered acceptance criteria list
  - [x] Footer divider + `forge review/execute` hints

- [x] Task 2: Implement `ShowCommand` (AC: 1–5)
  - [x] Replace stub; argument: `<ticketId>`
  - [x] Load config + check `isLoggedIn()`
  - [x] Call `ApiService.get<TicketDetail>('/tickets/:ticketId', config)`
  - [x] Handle 404 (error message contains "404") → print "Ticket not found" and exit 1
  - [x] Call `printTicketDetail(ticket)`; exit 0

- [x] Task 3: Tests + Typecheck (AC: 6)
  - [x] 9 unit tests for `printTicketDetail()`: title, status, priority, assignee, description, ACs, footer, no-description, assignedTo fallback ✓
  - [x] `npm run typecheck` → 0 errors ✓

## Dev Notes

### Learnings from Previous Stories

- `ApiService.get<T>()` is ready — already handles 401. For 404, error message contains "API error 404". Detect in ShowCommand.
- `statusIcon()` from `src/ui/formatters.ts` — import and reuse for the status line.
- `TicketDetail` extends `TicketListItem` and has: `description?`, `acceptanceCriteria: string[]`, `assignedTo?`, `createdAt`, `updatedAt`.

### Output Format

```
[T-001] Fix the login bug on mobile
────────────────────────────────────────────────────────────────────────
Status:    🚀 READY
Priority:  HIGH
Assignee:  dev@example.com
Created:   2/20/2026, 9:00:00 AM
Updated:   2/20/2026, 11:30:00 AM

Description
Fix the login flow on iOS Safari where the OAuth redirect fails silently.

Acceptance Criteria
  1. Login works on iOS Safari 16+
  2. Error message shown if redirect fails
  3. No silent failures in auth flow

────────────────────────────────────────────────────────────────────────
forge review T-001   # start AI-assisted review
forge execute T-001  # start AI-assisted execution
```

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-5-cli-foundation.md — AC5, Workflows → forge show]
- [Source: docs/sprint-artifacts/stories/5-4-interactive-ticket-list.md — ApiService, formatters]

## Dev Agent Record

### Context Reference

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- `printTicketDetail()` uses `assignee ?? assignedTo` fallback — handles both field names from backend
- Priority color-coded: urgent=red, high=yellow, medium=white, low=dim
- Fixed `afterEach` import missing from vitest — added to import list
- `npm test` → 41/41 passing ✓; `npm run typecheck` → 0 errors ✓

### File List

- `forge-cli/src/ui/pager.ts` (NEW)
- `forge-cli/src/commands/show.ts` (MODIFIED — replaced stub)
- `forge-cli/src/ui/__tests__/pager.test.ts` (NEW)
