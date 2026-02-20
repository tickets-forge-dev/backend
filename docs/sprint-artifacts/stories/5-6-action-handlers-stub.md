# Story 5.6: Action Handler Stubs (review + execute)

Status: done

## Story

As a developer using the Forge platform,
I want `forge review <ticketId>` and `forge execute <ticketId>` to validate my ticket and print clear MCP setup instructions,
so that I know exactly how to start an AI-assisted session when MCP is available (Epic 6).

## Acceptance Criteria

1. `forge review <ticketId>` and `forge execute <ticketId>` require a valid login — exit 1 if not logged in.
2. Both commands fetch the ticket via `ApiService.get()` and exit 1 with "Ticket not found" if the ID is invalid.
3. `forge review <ticketId>` validates the ticket status is appropriate for review (READY, VALIDATED, CREATED, DRIFTED) — exits 1 with guidance if status is incompatible.
4. `forge execute <ticketId>` validates the ticket status is READY or VALIDATED — exits 1 with guidance if incompatible.
5. Both commands print a clear, human-readable explanation of what the command will do in Epic 6, plus the ticket title and status.
6. Both commands exit 0 on success (instructions printed).
7. `tsc --noEmit` exits with zero errors.

## Tasks / Subtasks

- [x] Task 1: Implement `ReviewCommand` (AC: 1–3, 5, 6)
  - [x] Load config + check `isLoggedIn()`
  - [x] Fetch ticket; handle 404
  - [x] Validate status ∈ {READY, VALIDATED, CREATED, DRIFTED}; if not, print guidance and exit 1
  - [x] Print MCP instructions panel for review

- [x] Task 2: Implement `ExecuteCommand` (AC: 1–2, 4, 5, 6)
  - [x] Load config + check `isLoggedIn()`
  - [x] Fetch ticket; handle 404
  - [x] Validate status ∈ {READY, VALIDATED}; if not, print guidance and exit 1
  - [x] Print MCP instructions panel for execute

- [x] Task 3: Typecheck (AC: 7)
  - [x] `npm run typecheck` → 0 errors

## Dev Notes

- Reuse existing pattern from `show.ts`: load config → isLoggedIn → ApiService.get → handle 404
- Import `AECStatus` from `src/types/ticket.ts` for status checks
- MCP instructions are informational only — actual MCP integration is Epic 6

### MCP Instructions UX

```
forge review T-001
────────────────────────────────────────────────────────────────────────
 Ticket: [T-001] Fix login on mobile
 Status: 🚀 READY

 forge review — Coming in Epic 6 (MCP Integration)
 ──────────────────────────────────────────────────
 When available, this will start an AI-assisted review session that:
   • Loads your ticket context into your AI coding assistant
   • Asks dynamic questions to clarify implementation details
   • Enriches the ticket with technical decisions

 For now, view the full ticket with: forge show T-001
────────────────────────────────────────────────────────────────────────
```

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-5-cli-foundation.md — AC6]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- Implemented both `review.ts` and `execute.ts` in a single pass (yolo mode with 5-7 and 5-8)
- MCP instructions panel is purely informational — actual MCP integration deferred to Epic 6
- `forge review` accepts statuses: READY, VALIDATED, CREATED, DRIFTED
- `forge execute` accepts statuses: READY, VALIDATED only (stricter gate)
- All commands follow same pattern: load → isLoggedIn → get → validate → print
- `tsc --noEmit` passes with 0 errors (covered by 5-8 typecheck run)

### File List

- `forge-cli/src/commands/review.ts` (implemented from stub)
- `forge-cli/src/commands/execute.ts` (implemented from stub)
