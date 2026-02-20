# Story 5.7: Config Management — Token Refresh + Permission Check

Status: done

## Story

As a developer using the Forge platform,
I want my CLI session to transparently refresh expired access tokens,
so that I am never interrupted mid-session by an expired token unless my refresh token is also expired.

## Acceptance Criteria

1. `AuthService.refresh(refreshToken)` calls `POST /auth/refresh` and returns `{ accessToken, expiresAt }`.
2. `ApiService.get()` on a 401 response: calls `AuthService.refresh()`, saves the new accessToken to config via `ConfigService.save()`, then retries the original request once. If the retry also fails with 401, throws "Session expired. Run `forge login` to re-authenticate."
3. `ConfigService.load()` checks file permissions after reading — if not 0o600, prints a warning to stderr but continues (does not throw).
4. `tsc --noEmit` exits with zero errors.

## Tasks / Subtasks

- [x] Task 1: Add `AuthService.refresh()` (AC: 1)
  - [x] `POST /auth/refresh` with `{ refreshToken }` in body
  - [x] Return `{ accessToken: string; expiresAt: string }`
  - [x] Throw clear error on non-OK response

- [x] Task 2: Enhance `ApiService.get()` with refresh+retry (AC: 2)
  - [x] Extract `makeRequest()` helper for raw fetch
  - [x] On 401: call `AuthService.refresh()`, update config, retry once
  - [x] On retry 401: throw "Session expired"
  - [x] On refresh failure: throw "Session expired"

- [x] Task 3: Add permission check to `ConfigService.load()` (AC: 3)
  - [x] After reading file, call `fs.stat()` to get mode
  - [x] If `(stat.mode & 0o777) !== 0o600`: `process.stderr.write(warning)`
  - [x] Continue normally (do not throw)

- [x] Task 4: Tests + Typecheck (AC: 4)
  - [x] Unit test `AuthService.refresh()`: success, failure (2 tests added to auth.service.test.ts)
  - [x] Unit test `ApiService.get()` refresh retry: 401→refresh→200, 401→refresh→401 (3 tests)
  - [x] `npm run typecheck` → 0 errors

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- `AuthService.refresh()` added to `auth.service.ts` — POST /auth/refresh, returns `{ accessToken, expiresAt }`
- `ApiService.get()` completely rewritten with refresh+retry logic; stat mock added to config.service tests
- Permission check in `ConfigService.load()` warns to stderr only — does not block loading
- 2 new auth tests + 3 new api tests; all 48 tests pass
- `vi.mocked(fs.stat).mockResolvedValue()` required adding `stat` to the `fs/promises` mock in config.service.test.ts

### File List

- `forge-cli/src/services/auth.service.ts` (added `refresh()`)
- `forge-cli/src/services/api.service.ts` (full rewrite with refresh+retry)
- `forge-cli/src/services/config.service.ts` (added permission check in `load()`)
- `forge-cli/src/services/__tests__/auth.service.test.ts` (added 2 refresh tests)
- `forge-cli/src/services/__tests__/api.service.test.ts` (added 3 401 retry tests)
- `forge-cli/src/services/__tests__/config.service.test.ts` (added `stat` to fs mock)
