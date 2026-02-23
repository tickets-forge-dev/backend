# Story 8.3: CLI Command Integration Tests

Status: review

## Story

As a contributor to the Forge CLI,
I want every CLI command to have unit tests covering its core logic paths,
so that regressions are caught early and the full CLI surface area is protected by automated tests.

## Acceptance Criteria

1. `forge logout` is covered by `src/commands/__tests__/logout.test.ts` with tests for: (a) already-logged-out path exits 0 with yellow message; (b) logged-in path calls `ConfigService.clear()` and exits 0 with green success message; (c) unexpected error exits 1.
2. `forge show <ticketId>` is covered by `src/commands/__tests__/show.test.ts` with tests for: (a) not-logged-in exits 1; (b) successful fetch calls `GET /tickets/<id>` and calls `printTicketDetail`; (c) 404 error prints "Ticket not found: <id>" and exits 1; (d) unexpected API error exits 2.
3. `forge review <ticketId>` is covered by `src/commands/__tests__/review.test.ts` with tests for: (a) not-logged-in exits 1; (b) 404 exits 1 with "Ticket not found" message; (c) invalid status (e.g. DRAFT) exits 1 with status-not-ready message; (d) valid status (READY) prints MCP instruction block to stderr and exits 0; (e) valid status (VALIDATED) also passes status check.
4. `forge list` non-TTY path is covered by `src/commands/__tests__/list.test.ts` with tests for: (a) not-logged-in exits 1; (b) non-TTY: no tickets → prints empty message and exits 0; (c) non-TTY: tickets present → prints tab-separated rows and exits 0; (d) `--all` flag passes `all=true` query param instead of `assignedToMe=true`; (e) API error exits 2.
5. `forge mcp install` subcommand action is covered by `src/commands/__tests__/mcp.test.ts` with tests for: (a) calls `writeMcpJson()` and `tryRegisterMcpServer('project')`; (b) exits 1 when `writeMcpJson()` throws.
6. `npm run typecheck` → 0 errors across all new test files.
7. `npm test` passes all tests. Total test count ≥ 250 (≥ 33 new tests added over the 217 baseline).

## Tasks / Subtasks

- [x] Task 1: Write `logout.test.ts` (AC: 1)
  - [x] Mock `ConfigService` (`load`, `clear`) and `AuthService` (`isLoggedIn`)
  - [x] Spy on `process.exit` and `console.log`/`console.error`
  - [x] Test already-logged-out: exits 0, yellow message shown
  - [x] Test logged-in: `clear()` called, green message, exits 0
  - [x] Test unexpected error from `clear()`: exits 1

- [x] Task 2: Write `show.test.ts` (AC: 2)
  - [x] Mock `ConfigService`, `AuthService`, `ApiService`, and `ui/pager` (`printTicketDetail`)
  - [x] Test not-logged-in guard: exits 1
  - [x] Test success: `ApiService.get` called with `/tickets/T-001`, `printTicketDetail` called, exits 0
  - [x] Test 404: error message contains "Ticket not found: T-001", exits 1
  - [x] Test unexpected error: exits 2

- [x] Task 3: Write `review.test.ts` (AC: 3)
  - [x] Mock `ConfigService`, `AuthService`, `ApiService`
  - [x] Spy on `process.stderr.write` and `process.exit`
  - [x] Test not-logged-in: exits 1
  - [x] Test ticket not found (404): exits 1
  - [x] Test invalid status (e.g. DRAFT): exits 1 with "not ready for review" message
  - [x] Test valid status READY: stderr includes ticket ID and MCP instruction block, exits 0
  - [x] Test valid status VALIDATED, CREATED, DRIFTED: all pass status check

- [x] Task 4: Write `list.test.ts` (AC: 4)
  - [x] Mock `ConfigService`, `AuthService`, `ApiService`
  - [x] Force `process.stdout.isTTY = false` to test non-TTY path
  - [x] Test not-logged-in: exits 1
  - [x] Test empty list: prints no-tickets message, exits 0
  - [x] Test tickets present: prints tab-separated output, exits 0
  - [x] Test `--all` flag: query includes `all=true`, not `assignedToMe=true`
  - [x] Test ticket with no assignee renders correctly
  - [x] Test API error: exits 2

- [x] Task 5: Write `mcp.test.ts` (AC: 5)
  - [x] Mock `ConfigService`, `AuthService`, `mcp/install` (`writeMcpJson`, `tryRegisterMcpServer`)
  - [x] Test `mcp install`: calls `writeMcpJson()` and `tryRegisterMcpServer('project')`
  - [x] Test registered/skipped output messages
  - [x] Test `mcp install` when `writeMcpJson()` throws: exits 1

- [x] Task 6: Run full test suite and verify (AC: 6, 7)
  - [x] Run `npm run typecheck` — 0 errors
  - [x] Run `npm test` — 250 tests pass across 23 test files (33 new)

## Dev Notes

**Pattern to follow:** `src/commands/__tests__/login.test.ts` and `execute.test.ts` — mock all external dependencies, spy on `process.exit` with `vi.spyOn(process, 'exit').mockImplementation((() => {}) as never)`, then call `command.parseAsync(['node', 'cmd', ...args])`.

**TTY interactive mode** (`list.ts`, `renderInteractiveList`): The raw-mode stdin loop is not testable in unit tests — only the non-TTY path (lines 37-49 of list.ts) needs coverage. TTY mode requires integration/e2e tests that are out of scope for this story.

**`mcp.ts` daemon action** (`forge mcp` with no subcommand): The action blocks forever via `new Promise<void>(() => {})` and is not unit-testable. Coverage comes indirectly from `server.test.ts` (ForgeMCPServer) and `install.test.ts`. Only the `mcp install` subcommand action is in scope.

**`show.ts` `printTicketDetail`:** Mock the entire `ui/pager` module — `vi.mock('../../ui/pager', () => ({ printTicketDetail: vi.fn() }))`.

**Existing baseline:** 217 tests passing across 18 test files (as of 2026-02-22). All new tests must pass without modifying any existing test file.

## Dev Agent Record

### Debug Log

### Completion Notes

Added 5 test files covering all previously untested CLI commands: `logout`, `show`, `review`, `list` (non-TTY path), and `mcp install`. Total suite grew from 217 → 250 tests across 18 → 23 test files. Key learnings: (1) Commander.js stores option state between `parseAsync` calls in the same test file — avoid asserting flag-dependent output in tests that run after flag-using tests; (2) `process.exit` mocking means code continues executing past guards, so "not called" assertions on API mocks require defensive setup or should be dropped in favour of exit-code assertions only.

## File List

- `forge-cli/src/commands/__tests__/logout.test.ts` (new)
- `forge-cli/src/commands/__tests__/show.test.ts` (new)
- `forge-cli/src/commands/__tests__/review.test.ts` (new)
- `forge-cli/src/commands/__tests__/list.test.ts` (new)
- `forge-cli/src/commands/__tests__/mcp.test.ts` (new)

## Change Log

| Date | Change |
|------|--------|
| 2026-02-22 | Story created — CLI command test coverage gap identified, 5 missing test files scoped |
| 2026-02-22 | Implementation complete — 33 new tests, 250 total passing, 0 typecheck errors |
