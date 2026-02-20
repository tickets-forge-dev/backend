# Story 5.4: Interactive Ticket List

Status: review

## Story

As a developer using the Forge platform,
I want to run `forge list` and see my assigned tickets in an interactive terminal list,
so that I can quickly navigate, find, and open the ticket I want to work on.

## Acceptance Criteria

1. `forge list` requires a valid login — if not logged in, prints an error and exits 1.
2. `forge list` fetches `GET /tickets?assignedToMe=true&teamId={teamId}` with Bearer token via `ApiService`.
3. `forge list --all` fetches `GET /tickets?all=true&teamId={teamId}` showing all team tickets.
4. In TTY mode: renders an interactive list with ↑↓ navigation; each row shows ticket ID, title, status icon, and assignee.
5. Pressing Enter on a selected ticket exits the list and prints an inline summary (id, title, status, assignee) with a hint to run `forge show <id>` for full details (stub until 5-5).
6. Pressing `q`, `Q`, or `Ctrl+C` exits the interactive list cleanly — terminal restored to normal (no raw-mode artifacts).
7. When no tickets are found, prints a friendly message and exits 0.
8. In non-TTY mode (`!process.stdout.isTTY`), outputs a plain tab-separated list and exits 0.
9. `ApiService.get()` attaches `Authorization: Bearer {accessToken}` and throws a clear error on 401.
10. `tsc --noEmit` exits with zero errors after all changes.

## Tasks / Subtasks

- [x] Task 1: Implement `ApiService` (AC: 2, 9)
  - [x] `get<T>(path, config, params?)`: build URL from `API_URL` + path + query params
  - [x] Attach `Authorization: Bearer {accessToken}` header
  - [x] Throw clear error on 401 ("Session expired. Run `forge login` to re-authenticate.")
  - [x] Throw clear error on other non-OK responses

- [x] Task 2: Implement `Formatters` in `src/ui/formatters.ts` (AC: 4)
  - [x] `statusIcon(status: AECStatus)`: map each AECStatus to an emoji icon
  - [x] `formatTicketRow(ticket, selected)`: compose colored row string with pointer, id, title, icon, status, assignee

- [x] Task 3: Implement `ListCommand` (AC: 1–8)
  - [x] Replace stub; add `--all` option
  - [x] Load config + check `isLoggedIn()`
  - [x] Call `ApiService.get<TicketListItem[]>('/tickets', config, params)`
  - [x] Non-TTY fallback: plain tab-separated output, exit 0
  - [x] Empty-state handling: "No tickets found." with --all hint
  - [x] Interactive list using `process.stdin.setRawMode(true)` + keypress handler
  - [x] ↑↓ arrows: navigate; Enter: exit list + print inline summary; q/Q/Ctrl+C: exit cleanly
  - [x] Cleanup function: `setRawMode(false)`, `pause()`, clear screen

- [x] Task 4: Tests + Typecheck (AC: 10)
  - [x] Unit tests for `ApiService.get()`: success, 401, non-OK — 4 tests ✓
  - [x] Unit tests for `formatTicketRow()` + `statusIcon()` — 7 tests ✓
  - [x] `npm run typecheck` → 0 errors ✓

## Dev Notes

### Learnings from Previous Story

**From Story 5-2-login-command-oauth (Status: done)**

- `ConfigService.load()` + `isLoggedIn()` pattern already established — reuse as-is.
- `API_URL` from `src/config.ts` — always use this, never hardcode.
- `ForgeConfig` type exported from `config.service.ts` — use for ApiService signature.

### Architecture Decision: Readline over Ink

The tech spec lists `ink` as a dependency for the interactive list. However:
- ink v4+ is ESM-only; project builds CJS output
- The tech spec explicitly notes: "If ink proves problematic, fall back to a simple readline-based list"

**Decision**: Use Node.js built-in `readline` + `process.stdin.setRawMode()` for interactive input. This avoids the ESM/CJS mismatch and keeps zero new dependencies for this story.

### Status Icons Mapping

```
DRAFT              → ⬜
IN_QUESTION_ROUND_1/2/3 → 💬
QUESTIONS_COMPLETE → ✅
VALIDATED          → ✅
READY              → 🚀
CREATED            → 📝
DRIFTED            → ⚠️
COMPLETE           → ✅
```

### API Contract

```
GET /tickets?assignedToMe=true&teamId=<id>    → TicketListItem[]
GET /tickets?all=true&teamId=<id>             → TicketListItem[]
```

> Note: Token refresh (story 5-7) will enhance ApiService later — for now 401 = re-login required.

### Project Structure

```
src/
├── commands/list.ts      ← REPLACE stub
├── services/
│   └── api.service.ts    ← NEW
└── ui/
    └── formatters.ts     ← NEW
```

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-5-cli-foundation.md — AC3, AC4, AC10, Workflows → forge list]

## Dev Agent Record

### Context Reference

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- **Readline over Ink**: Used Node built-in `process.stdin.setRawMode()` + keypress handling instead of ink — avoids ESM/CJS mismatch, zero new dependencies
- `ApiService.get<T>()` is generic and extensible for future POST/PATCH calls in story 5-7
- Interactive list: SIGINT + `process.once` to avoid duplicate handlers on re-entry
- Enter key shows inline summary (id, title, status, assignee) + hint to run `forge show <id>`; full detail view implemented in 5-5
- Non-TTY fallback outputs tab-separated lines for scripting/piping
- `npm test` → 32/32 passing; `npm run typecheck` → 0 errors ✓

### File List

- `forge-cli/src/services/api.service.ts` (NEW)
- `forge-cli/src/ui/formatters.ts` (NEW)
- `forge-cli/src/commands/list.ts` (MODIFIED — replaced stub)
- `forge-cli/src/services/__tests__/api.service.test.ts` (NEW)
- `forge-cli/src/ui/__tests__/formatters.test.ts` (NEW)
