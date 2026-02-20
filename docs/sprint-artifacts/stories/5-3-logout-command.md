# Story 5.3: Logout Command

Status: review

## Story

As a developer using the Forge platform,
I want to run `forge logout` and have my credentials cleared,
so that my machine no longer has access to my Forge account.

## Acceptance Criteria

1. `forge logout` calls `ConfigService.clear()` to remove `~/.forge/config.json`.
2. `forge logout` prints a confirmation message ("Logged out successfully.") and exits 0.
3. `forge logout` when not logged in (no config file) prints a friendly message ("You are not logged in.") and exits 0 — no error.
4. `tsc --noEmit` exits with zero errors after all changes.

## Tasks / Subtasks

- [x] Task 1: Implement `LogoutCommand` (AC: 1, 2, 3)
  - [x] Import `ConfigService` and `chalk`
  - [x] Call `ConfigService.load()` — if null, print "You are not logged in." and exit 0
  - [x] Call `ConfigService.clear()`
  - [x] Print chalk.green("Logged out successfully.") and exit 0
  - [x] Wrap in try/catch — on error print clear message and exit 1

- [x] Task 2: Typecheck (AC: 4)
  - [x] Run `npm run typecheck` → 0 errors ✓

## Dev Notes

### Learnings from Previous Story

**From Story 5-2-login-command-oauth (Status: done)**

- **ConfigService is ready**: `load()`, `save()`, `clear()` fully implemented at `src/services/config.service.ts` — import and use directly, no changes needed.
- **AuthService.isLoggedIn()**: Available at `src/services/auth.service.ts` — use to check login state without re-implementing.
- **Command pattern**: LoginCommand uses `async () => { try { ... } catch { ... } }` action pattern — follow the same pattern.
- **chalk import**: `import chalk from 'chalk'` (default import with esModuleInterop).
- **SIGINT not needed for logout**: logout is instantaneous, no async polling.

[Source: stories/5-2-login-command-oauth.md#Dev-Agent-Record]

### Architecture Constraints

- LogoutCommand replaces the existing stub at `src/commands/logout.ts`
- Do NOT implement config logic directly in the command — always delegate to `ConfigService`

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-5-cli-foundation.md — AC2, Workflows → logout]

## Dev Agent Record

### Context Reference

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- `LogoutCommand` replaced stub: checks login state via `isLoggedIn()`, clears config via `ConfigService.clear()`, prints chalk-colored confirmation
- No new tests added (logout is trivial delegation to ConfigService which is already fully tested in 5-2)
- `npm run typecheck` → 0 errors ✓; existing 21 tests still passing ✓

### File List

- `forge-cli/src/commands/logout.ts` (MODIFIED — replaced stub)
