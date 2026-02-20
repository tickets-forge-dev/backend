# Story 5.2: Login Command — OAuth Device Flow

Status: review

## Story

As a developer using the Forge platform,
I want to run `forge login` and authenticate via OAuth Device Flow,
so that my terminal session is securely linked to my Forge account and subsequent CLI commands can access my tickets.

## Acceptance Criteria

1. `ConfigService.load()` reads and validates `~/.forge/config.json` via Zod schema; returns `null` if the file does not exist; throws with a clear human-readable message if the file is corrupt or fails schema validation.
2. `ConfigService.save(config)` writes the full `ForgeConfig` object as JSON to `~/.forge/config.json` and immediately sets file permissions to `0o600`.
3. `ConfigService.clear()` deletes (or zeroes out) the token fields in `~/.forge/config.json`, effectively logging the user out at the config layer.
4. `AuthService.startDeviceFlow()` calls `POST /auth/device/request` (via `API_URL` from `src/config.ts`) and returns the parsed `{ deviceCode, userCode, verificationUri, expiresIn, interval }` response.
5. `AuthService.pollToken(deviceCode, interval)` polls `POST /auth/device/token` at the given interval (seconds); continues on `authorization_pending`, throws with a clear error on `expired_token` or `access_denied`, and returns `DeviceFlowToken` on success. Max polling duration: 5 minutes.
6. `forge login` displays the verification URL and user code prominently using chalk (e.g., `Visit: https://forge.app/device` + `Code: WXYZ-1234`), followed by an `ora` spinner "Waiting for authorization…".
7. `forge login` on success: saves the full config (tokens + user info) via `ConfigService.save()`, stops the spinner, and prints `✅ Logged in as {email} | Team: {teamName}`, then exits 0.
8. `forge login` on `expired_token` or `access_denied`: stops the spinner, prints a clear error with recovery instruction (e.g., "Authorization timed out. Run `forge login` to try again."), and exits 1.
9. `forge login` handles `Ctrl+C` (SIGINT) during the polling loop: stops polling, does NOT write partial config, restores terminal state, and exits cleanly.
10. If a valid config already exists (`ConfigService.load()` returns non-null), `forge login` prints a warning ("You are already logged in as {email}. Run `forge logout` first.") and exits 0 without re-authenticating.
11. `tsc --noEmit` exits with zero errors after all changes.

## Tasks / Subtasks

- [x] Task 1: Implement `ConfigService` (AC: 1, 2, 3)
  - [x] Define `ForgeConfig` Zod schema with all fields: `accessToken`, `refreshToken`, `expiresAt`, `userId`, `teamId`, `workspaceId?`, `user: { email, displayName }`
  - [x] `getConfigPath()`: return `path.join(os.homedir(), '.forge', 'config.json')`
  - [x] `load()`: read file (return null if ENOENT), parse JSON, validate with Zod (throw clear error if invalid)
  - [x] `save(config)`: ensure `~/.forge/` dir exists (`fs.mkdir` recursive), write JSON (2-space indent), then `fs.chmod(path, 0o600)`
  - [x] `clear()`: unlink config file (no-op if ENOENT, re-throws other errors)
  - [x] Export named functions

- [x] Task 2: Implement `AuthService` (AC: 4, 5)
  - [x] Define `DeviceFlowRequest` and `DeviceFlowToken` interfaces in `src/types/auth.ts`
  - [x] `startDeviceFlow()`: `POST ${API_URL}/auth/device/request` with `Content-Type: application/json`; parse + return response
  - [x] `pollToken(deviceCode, interval, maxMs = 300_000)`: while loop with sleep; handle `authorization_pending` (continue), `expired_token` / `access_denied` (throw), success (return `DeviceFlowToken`)
  - [x] `isLoggedIn(config)`: return `!!config?.accessToken`

- [x] Task 3: Implement `LoginCommand` (AC: 6, 7, 8, 9, 10)
  - [x] Import `ConfigService`, `AuthService`, `ora`, `chalk`
  - [x] On command action: call `ConfigService.load()` — if non-null and logged in, print already-logged-in warning and exit 0
  - [x] Call `AuthService.startDeviceFlow()`
  - [x] Print URL + code with chalk (clear, prominent formatting)
  - [x] Start `ora` spinner "Waiting for authorization…"
  - [x] Register `process.on('SIGINT', ...)` handler: stop spinner, print "Cancelled.", exit 0
  - [x] Await `AuthService.pollToken(deviceCode, interval)` inside try/catch
  - [x] On success: `ConfigService.save(...)`, spinner.succeed(), print success line, exit 0
  - [x] On error: spinner.fail(), print error + recovery step, exit 1

- [x] Task 4: Typecheck (AC: 11)
  - [x] Run `npm run typecheck` → 0 errors ✓

## Dev Notes

### Learnings from Previous Story

**From Story 5-1-cli-project-setup (Status: done)**

- **Config exports**: `API_URL` and `APP_URL` already exported from `src/config.ts` — import and use these, do NOT hardcode URLs.
- **Command stubs**: `src/commands/login.ts` exists as a stub (prints "Not yet implemented") — replace the action handler completely.
- **Shebang warning**: Shebang (`#!/usr/bin/env node`) is added via tsup `banner` in `tsup.config.ts`. NEVER add it to any `src/` file directly — it will appear twice and cause a Node.js SyntaxError.
- **AECStatus / types**: `src/types/ticket.ts` exists. Add `src/types/auth.ts` as a new file for Device Flow types — do not pollute ticket types.
- **Services dir**: `src/services/` is empty and ready — create `config.service.ts` and `auth.service.ts` here.

[Source: stories/5-1-cli-project-setup.md#Dev-Agent-Record]

### Architecture Constraints

- **Config path**: `~/.forge/config.json` — always resolve with `os.homedir()`, never hardcode `/Users/...`
- **File permissions**: `chmod 0o600` MUST be set immediately after every write (owner-read/write only)
- **No token logging**: Token values must never appear in stdout, stderr, or debug logs
- **HTTPS enforcement**: `API_URL` in production is `https://api.forge.app`. Never allow HTTP in ApiService (enforced in Story 5-7)
- **Node 20**: Use native `fetch` (not `node-fetch`) for all HTTP calls
- **SIGINT handling**: Clean exit required — no raw terminal artifacts, no partial config written

### Zod Config Schema

```typescript
const ForgeConfigSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.string(),        // ISO datetime
  userId: z.string(),
  teamId: z.string(),
  workspaceId: z.string().optional(),
  user: z.object({
    email: z.string().email(),
    displayName: z.string(),
  }),
});
type ForgeConfig = z.infer<typeof ForgeConfigSchema>;
```

### Device Flow API Contract

```
POST /auth/device/request
Response: { deviceCode, userCode, verificationUri, expiresIn, interval }

POST /auth/device/token
Body: { deviceCode }
Success:  200 { accessToken, refreshToken, userId, teamId, user: { email, displayName } }
Pending:  400 { error: "authorization_pending" }
Expired:  400 { error: "expired_token" }
Denied:   400 { error: "access_denied" }
```

> ⚠️ **Backend Risk**: `POST /auth/device/request` and `POST /auth/device/token` endpoints do not yet exist in the backend. This CLI implementation can be built and tested independently (mock the endpoints locally). Story is unblocked for CLI implementation; backend must implement these endpoints before end-to-end testing.

### `forge login` UX Flow

```
$ forge login
Open this URL in your browser:
  https://forge.app/device

Enter this code:
  WXYZ-1234

⠋ Waiting for authorization…   ← ora spinner

✅ Logged in as dev@example.com | Team: team-456
```

### Testing Notes

- 21 unit tests across 2 test files
- `config.service.test.ts`: 10 tests — ENOENT→null, valid config, malformed JSON, schema validation failure, chmod 600, clear+ENOENT, re-throws non-ENOENT
- `auth.service.test.ts`: 11 tests — isLoggedIn (3), startDeviceFlow (2), pollToken (6: success, pending×N→success, expired, denied, timeout, unexpected response)

### Project Structure Notes

```
src/
├── commands/login.ts        ← REPLACED stub with full implementation
├── services/
│   ├── config.service.ts    ← NEW
│   └── auth.service.ts      ← NEW
└── types/
    ├── ticket.ts            ← existing (unchanged)
    └── auth.ts              ← NEW: DeviceFlowRequest, DeviceFlowToken
```

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-5-cli-foundation.md — Workflows → forge login, Security, Data Models]
- [Source: docs/CLI/FORGE-TEAMS-CLI-ARCHITECTURE.md — Section 6: Authentication]
- [Source: docs/sprint-artifacts/stories/5-1-cli-project-setup.md — Dev Agent Record]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- **Mock type issue in tests**: `vi.mocked(fs.readFile).mockResolvedValue(...)` with string values required `as any` cast — TypeScript can't disambiguate `readFile` overloads (Buffer vs string) in vitest mock return types. Added `// eslint-disable-next-line` comments for clarity.
- **pollToken SIGINT safety**: `process.exit(0)` in SIGINT handler guarantees no partial config write — `ConfigService.save()` only executes after `pollToken` resolves successfully; SIGINT exits process before that code runs.

### Completion Notes List

- `ConfigService`: full CRUD for `~/.forge/config.json` with Zod validation + chmod 600
- `AuthService`: Device Flow polling with `authorization_pending`/`expired_token`/`access_denied` handling; native `fetch`; `isLoggedIn` helper
- `LoginCommand`: replaced stub with complete OAuth Device Flow UX (chalk display, ora spinner, SIGINT handler, already-logged-in check)
- Added `src/types/auth.ts` for Device Flow types (kept separate from ticket types)
- Added `vitest` dev dependency + `test` script to package.json
- 21 unit tests: `npm test` → 21/21 passing ✓
- `npm run typecheck` → 0 errors ✓

### File List

- `forge-cli/src/types/auth.ts` (NEW)
- `forge-cli/src/services/config.service.ts` (NEW)
- `forge-cli/src/services/auth.service.ts` (NEW)
- `forge-cli/src/commands/login.ts` (MODIFIED — replaced stub)
- `forge-cli/src/services/__tests__/config.service.test.ts` (NEW)
- `forge-cli/src/services/__tests__/auth.service.test.ts` (NEW)
- `forge-cli/package.json` (MODIFIED — added vitest, test script)
