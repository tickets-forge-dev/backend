# Story 5.8: Error Handling + Offline Mode

Status: done

## Story

As a developer using the Forge platform,
I want clear, actionable error messages and graceful handling when the server is unavailable,
so that I always know what went wrong and what to do next.

## Acceptance Criteria

1. On 5xx server errors, `ApiService` automatically retries once after a 2-second delay; if the retry also fails, throws with a human-readable message including what to do next.
2. On network errors (fetch throws `TypeError`, e.g., server offline), throws with "Cannot reach Forge server. Check your connection or try again later."
3. All command error paths print messages with the format: what failed + why (if known) + recovery step.
4. `forge list` with no tickets assigned prints: "No tickets assigned to you. Try `forge list --all` to see all team tickets."
5. `tsc --noEmit` exits with zero errors.

## Tasks / Subtasks

- [x] Task 1: Enhance `ApiService` with retry + network error handling (AC: 1, 2)
  - [x] Wrap `fetch()` call to catch `TypeError` (network error) → throw clear message
  - [x] On 5xx: wait 2s, retry once; if retry also 5xx → throw with recovery message
  - [x] Preserve existing 401 refresh logic

- [x] Task 2: Verify command error message quality (AC: 3)
  - [x] All command catch blocks print `chalk.red('Error: <message>')` and exit 2

- [x] Task 3: Fix forge list empty-state message (AC: 4)
  - [x] Updated both TTY and non-TTY empty-state paths in `list.ts`

- [x] Task 4: Tests + Typecheck (AC: 5)
  - [x] Unit test network error → "Cannot reach Forge server"
  - [x] Unit test 5xx → retry → success; 5xx → retry → 5xx → "Forge server error"
  - [x] `npm run typecheck` → 0 errors

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- **Unhandled rejection in fake timer test**: `PromiseRejectionHandledWarning` when `expect(...).rejects` was attached after `vi.advanceTimersByTimeAsync()`. Fixed by storing `const assertion = expect(...).rejects.toThrow(...)` before advancing timers.

### Completion Notes List

- Network error: fetch `TypeError` caught and rethrown as "Cannot reach Forge server. Check your connection or try again later."
- 5xx retry: sleeps 2s via `setTimeout` promise, retries once; double 5xx throws "Forge server error (N). Try again in a moment."
- `forge list` empty-state updated in both TTY and non-TTY paths: "No tickets assigned to you. Try `forge list --all` to see all team tickets."
- All 48 tests pass; 5 test files; `npm run typecheck` → 0 errors

### File List

- `forge-cli/src/services/api.service.ts` (network error + 5xx retry, built together with 5-7 rewrite)
- `forge-cli/src/commands/list.ts` (empty-state message fix)
- `forge-cli/src/services/__tests__/api.service.test.ts` (2 5xx retry tests + 1 network error test)
