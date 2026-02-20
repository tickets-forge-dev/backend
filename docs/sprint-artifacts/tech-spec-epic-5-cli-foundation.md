# Epic Technical Specification: CLI Foundation

Date: 2026-02-20
Author: BMad
Epic ID: 5
Status: Draft

---

## Overview

Epic 5 (CLI Foundation) delivers the `forge` command-line interface — the developer execution layer for the Forge platform. While the Web UI serves both PMs and Developers for planning and review, the CLI is exclusively a developer tool that authenticates against the Forge backend, lists assigned tickets, and displays full ticket details in the terminal. This epic establishes the project scaffold, authentication (OAuth Device Flow), core read commands, config persistence, and stub handlers for the MCP-powered execute/review commands that will be completed in Epic 6.

The CLI is the critical bridge between the PM's ticket specifications (web) and the developer's AI-assisted code execution (MCP + Claude Code). Epic 5 builds the foundation — authentication, session management, ticket browsing — while keeping Epic 6's MCP integration cleanly decoupled.

## Objectives and Scope

**In Scope:**
- CLI package scaffold as `@forge/cli` under the pnpm monorepo `packages/` workspace
- OAuth Device Flow authentication (`forge login` / `forge logout`)
- Config file management at `~/.forge/config.json` (chmod 600, structured JSON)
- Interactive ticket list command (`forge list`) with ↑↓ keyboard navigation
- Ticket detail view command (`forge show <id>`) with paged terminal output
- Action handler stubs for `forge review` / `forge execute` (prints MCP instructions, no actual MCP in this epic)
- Automatic access token refresh on 401 responses
- Offline/error handling with retry logic and clear human-readable terminal messages

**Out of Scope:**
- MCP server implementation → Epic 6
- `forge review` / `forge execute` MCP integration → Epic 6
- `forge complete` command → Epic 6/7
- Web UI changes → Epic 7
- npm registry publishing → Epic 8
- Multi-team CLI context switching (single team per CLI session for MVP)

## System Architecture Alignment

The CLI fits into the existing architecture as a third client alongside the Web UI, communicating exclusively with the NestJS backend over HTTPS REST. It does not access Firestore directly.

**Architectural alignment points:**
- **Auth layer:** Extends Firebase Auth via OAuth Device Flow. Backend exposes `POST /auth/device/request` and `POST /auth/device/token` endpoints (new, parallel to existing web OAuth). Tokens are standard JWTs already used by the web client.
- **API layer:** Consumes the same NestJS REST endpoints used by the web client (`GET /teams`, `GET /tickets`, `GET /tickets/:id`, `PATCH /tickets/:id`). No new backend routes required for Epic 5 read commands.
- **Config layer:** New — `~/.forge/config.json` is CLI-local. No web equivalent. Stores access/refresh tokens + current team/workspace context.
- **MCP layer:** Empty stubs in Epic 5 (`forge review`, `forge execute` print instructions only). Full MCP integration added in Epic 6 using the `@modelcontextprotocol/sdk` package embedded inside the CLI process via stdio transport.
- **Package location:** `packages/cli/` in monorepo, published as `@forge/cli`. Shares `packages/shared-types/` for AEC/ticket DTO types.
- **Constraints:** CLI must work offline for `forge show` when a ticket was previously cached (graceful degradation); requires Node.js ≥ 20.

## Detailed Design

### Services and Modules

**Package root:** `packages/cli/`

| Module | Path | Responsibility |
|--------|------|---------------|
| **Entry point** | `src/index.ts` | Registers all Commander.js commands, sets version/description |
| **LoginCommand** | `src/commands/login.ts` | Initiates Device Flow, polls for token, saves config |
| **LogoutCommand** | `src/commands/logout.ts` | Clears tokens from config file |
| **ListCommand** | `src/commands/list.ts` | Fetches tickets, renders interactive list with ink or blessed |
| **ShowCommand** | `src/commands/show.ts` | Fetches single ticket, renders paged terminal output |
| **ReviewCommand** (stub) | `src/commands/review.ts` | Validates ticket status, prints MCP start instructions |
| **ExecuteCommand** (stub) | `src/commands/execute.ts` | Validates ticket status, prints MCP start instructions |
| **ApiService** | `src/services/api.service.ts` | Wraps all HTTP calls to backend; handles 401 → refresh → retry |
| **AuthService** | `src/services/auth.service.ts` | Device Flow logic, token refresh, login state check |
| **ConfigService** | `src/services/config.service.ts` | Read/write `~/.forge/config.json`, chmod 600 on write |
| **Formatters** | `src/ui/formatters.ts` | Status icons, color mapping, ticket list row formatter |
| **Pager** | `src/ui/pager.ts` | Long-content pagination for `forge show` output |

### Data Models and Contracts

**Config file schema** (`~/.forge/config.json`):
```typescript
interface ForgeConfig {
  accessToken: string;        // JWT, 15-min expiry
  refreshToken: string;       // JWT, 7-day expiry
  expiresAt: string;          // ISO datetime of accessToken expiry
  userId: string;             // Firebase UID
  teamId: string;             // Current team context
  workspaceId?: string;       // Current workspace (optional)
  user: {
    email: string;
    displayName: string;
  };
}
```

**Ticket list item** (display model, derived from shared AEC DTO):
```typescript
interface TicketListItem {
  id: string;           // e.g. "ABC-123"
  title: string;
  status: AECStatus;    // from shared-types
  assignee?: string;    // displayName
  priority?: string;
}
```

**Device Flow response** (from backend):
```typescript
interface DeviceFlowRequest {
  deviceCode: string;
  userCode: string;       // e.g. "WXYZ-1234"
  verificationUri: string; // e.g. "https://forge.app/device"
  expiresIn: number;      // seconds
  interval: number;       // polling interval in seconds (default: 5)
}

interface DeviceFlowToken {
  accessToken: string;
  refreshToken: string;
  userId: string;
  teamId: string;
  user: { email: string; displayName: string };
}
```

### APIs and Interfaces

**New backend endpoints required for Epic 5:**

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/auth/device/request` | Initiate Device Flow, returns deviceCode + userCode | None |
| POST | `/auth/device/token` | Exchange deviceCode for tokens (polling) | None |
| POST | `/auth/refresh` | Exchange refreshToken for new accessToken | Refresh token |

**Existing backend endpoints consumed:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/tickets` | List tickets (filter: `assignedToMe=true`, `status=...`) |
| GET | `/tickets/:id` | Get full ticket details |
| GET | `/teams` | Get user's teams (used to show team context on login) |

**CLI command interface summary:**

```
forge login                    # Device Flow OAuth
forge logout                   # Clear config
forge list [--all] [--status STATUS]  # Interactive ticket list
forge show <ticketId>          # Show ticket details
forge review <ticketId>        # Stub: print instructions for MCP review
forge execute <ticketId>       # Stub: print instructions for MCP execute
```

### Workflows and Sequencing

**forge login flow:**
```
$ forge login
  → POST /auth/device/request
  ← { deviceCode, userCode, verificationUri }
  → Print: "Visit {verificationUri} and enter code: {userCode}"
  → Poll POST /auth/device/token every 5s (up to 5 min)
    - 400 "authorization_pending" → keep polling
    - 400 "expired_token" → abort with error
    - 200 → store tokens in ~/.forge/config.json (chmod 600)
  → Print: "✅ Logged in as {email} | Team: {teamName}"
```

**forge list interactive flow:**
```
$ forge list
  → ConfigService.load() → validate token (refresh if expired)
  → ApiService.get('/tickets?assignedToMe=true')
  → Render interactive list (ink/blessed):
      ↑↓ = navigate rows
      Enter = call forge show <id>
      F = filter prompt
      Q = quit
```

**Token refresh flow (transparent):**
```
ApiService.get(path)
  → attach Authorization: Bearer {accessToken}
  → if response 401:
      → POST /auth/refresh with refreshToken
      → update config with new accessToken
      → retry original request (once)
      → if refresh also 401 → print "Session expired. Run forge login." and exit 1
```

## Non-Functional Requirements

### Performance

- `forge list` must render first paint within **1 second** of command invocation (exclusive of network latency)
- `forge show <id>` must render within **500ms** of API response receipt
- Device Flow polling interval: **5 seconds** (matches backend expectation); max polling duration: **5 minutes**
- Token refresh must complete in **< 2 seconds** and be fully transparent (no user-visible delay beyond the original request latency)

### Security

- `~/.forge/config.json` must have file permissions **chmod 600** (owner read/write only) set immediately on write; ConfigService must verify permissions on every read and warn if incorrect
- Access tokens: JWT, **15-minute expiry**; Refresh tokens: JWT, **7-day expiry**
- No token values written to stdout/stderr under any circumstance (masked in debug output)
- MCP server (Epic 6) will only communicate via **stdio** — never TCP/UDP — preventing network token exposure
- Device Flow user code must be displayed clearly; CLI must **not** store the `deviceCode` in config (it's ephemeral)
- All backend calls use **HTTPS**; CLI must reject HTTP connections (enforce in ApiService)

### Reliability/Availability

- Graceful degradation: if backend is unreachable, `forge list` shows last cached ticket list (if < 1 hour old) with a `[Offline]` banner
- On 5xx backend errors: single automatic retry after **2-second** delay; on second failure, show human-readable error and exit 1
- If `~/.forge/config.json` is corrupt/malformed, CLI must print a clear message ("Config corrupted. Run `forge login` to re-authenticate.") and exit 1 — no silent crashes
- On `Ctrl+C` during `forge list`, restore terminal state cleanly (no leftover raw mode artifacts)

### Observability

- All HTTP requests logged to `~/.forge/debug.log` when `FORGE_DEBUG=1` env var is set (method, URL, status code, latency — no auth headers or body)
- Exit codes: `0` = success, `1` = user error / auth failure, `2` = network/server error
- Error messages must include: what failed, why (if known), and what to do next (e.g., "Token expired. Run `forge login` to re-authenticate.")

## Dependencies and Integrations

**Internal dependencies (monorepo):**

| Package | Usage |
|---------|-------|
| `packages/shared-types` | AEC/ticket DTO types, AECStatus enum (must exist before 5-1) |

**CLI runtime dependencies (to install):**

| Package | Version | Purpose |
|---------|---------|---------|
| `commander` | `^11.x` | CLI framework, subcommands, option parsing |
| `ink` | `^4.x` | React-based interactive terminal UI (for `forge list`) |
| `ink-text-input` | `^5.x` | Text input for filter prompt in list view |
| `chalk` | `^5.x` | Terminal colors for status icons and formatting |
| `open` | `^9.x` | Opens browser to Device Flow verification URL |
| `node-fetch` | `^3.x` | HTTP client (or use native `fetch` if Node ≥ 20) |
| `zod` | `^3.x` | Runtime validation of config file and API responses |
| `ora` | `^7.x` | Spinner for `⏳ Waiting for authorization...` |

**CLI dev dependencies:**

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | `^5.x` | Matches existing monorepo TS version |
| `@types/node` | `^20.x` | Node.js type definitions |
| `vitest` | `^1.x` | Unit testing (or jest — match monorepo) |
| `tsup` | `^8.x` | Build/bundle CLI to `dist/` |

**Backend integration points:**
- New Device Flow endpoints must be implemented in `backend/src/auth/` before Story 5-2 (Login Command) can be completed
- Existing `/tickets` and `/teams` endpoints must support JWT auth (already do — no changes required)

**External dependencies:**
- **Firebase Auth** — Device Flow token exchange may leverage Firebase custom tokens or standard JWT signing (backend decision, transparent to CLI)
- **Node.js ≥ 20** — Required (uses native `fetch`, `fs/promises`)
- **pnpm workspace** — CLI lives in `packages/cli/`, referenced from root `pnpm-workspace.yaml`

## Acceptance Criteria (Authoritative)

1. `forge login` completes Device Flow: displays verification URL + code, polls backend, stores tokens in `~/.forge/config.json` with chmod 600, and prints success message with user email and team name.
2. `forge logout` removes all token fields from `~/.forge/config.json` and prints confirmation.
3. `forge list` fetches assigned tickets and renders an interactive list with ↑↓ navigation and Enter to view details; shows ticket ID, title, status icon, and assignee.
4. `forge list --all` shows all team tickets (not just assigned to me).
5. `forge show <ticketId>` displays full ticket details (problem statement, solution, acceptance criteria, file changes) in paginated terminal output.
6. `forge review <ticketId>` and `forge execute <ticketId>` (stubs) validate the ticket exists and has a compatible status, then print human-readable instructions for starting the MCP session (Epic 6).
7. Access tokens auto-refresh transparently on 401 responses; the user is not prompted to re-login if the refresh token is still valid.
8. Config file at `~/.forge/config.json` has permissions 600; ConfigService warns if permissions are incorrect on read.
9. All commands display clear error messages with recovery instructions when network or auth errors occur.
10. `forge list` restores terminal to normal state on exit (Ctrl+C or Q), with no raw-mode artifacts.
11. CLI package builds successfully via `pnpm build` and is executable as `forge` via the `bin` field in `package.json`.
12. TypeScript compiles with zero errors (`tsc --noEmit`).

## Traceability Mapping

| AC | Spec Section | Component(s) | Story | Test Idea |
|----|-------------|-------------|-------|-----------|
| AC1 | Workflows → forge login | AuthService, ConfigService, LoginCommand | 5-2 | Mock POST /auth/device/request and /token; verify config written with chmod 600 |
| AC2 | Workflows → logout | ConfigService, LogoutCommand | 5-3 | Verify config tokens cleared after logout |
| AC3 | Workflows → forge list | ListCommand, ApiService, Formatters | 5-4 | Mock GET /tickets; verify list renders with status icons |
| AC4 | APIs → forge list --all | ListCommand, ApiService | 5-4 | Mock GET /tickets?all=true; verify all tickets shown |
| AC5 | Workflows → forge show | ShowCommand, Pager, Formatters | 5-5 | Mock GET /tickets/:id; verify all sections rendered |
| AC6 | Scope → stubs | ReviewCommand, ExecuteCommand | 5-6 | Verify stub prints instructions and exits 0 for valid ticket status |
| AC7 | Workflows → token refresh | ApiService, AuthService | 5-7, 5-8 | Mock 401 → refresh → retry; verify original response returned |
| AC8 | Security | ConfigService | 5-7 | Verify file permissions after write; verify warning on chmod mismatch |
| AC9 | Reliability | All commands | 5-8 | Mock network timeout; verify error message contains recovery step |
| AC10 | Reliability | ListCommand (ink) | 5-4 | Simulate Ctrl+C; verify terminal is in cooked mode after exit |
| AC11 | Architecture | CLI package | 5-1 | `pnpm build` succeeds; `forge --version` outputs version string |
| AC12 | Architecture | All | 5-1 | `tsc --noEmit` exits 0 |

## Risks, Assumptions, Open Questions

**Risks:**
- **Risk:** Device Flow backend endpoints don't exist yet — stories 5-2 through 5-8 are blocked until backend adds `POST /auth/device/request` and `POST /auth/device/token`. **Mitigation:** Story 5-1 scaffolds the CLI package; backend can implement Device Flow endpoints in parallel (unblocked).
- **Risk:** Ink (React terminal UI) adds complexity and is harder to test than plain console output. **Mitigation:** Keep `ink` usage isolated to `ListCommand`; all other commands use plain chalk/console. If ink proves problematic, fall back to a simple readline-based list.
- **Risk:** Terminal raw-mode handling differs across macOS / Linux / Windows (WSL). **Mitigation:** Target macOS and Linux for MVP; document Windows-via-WSL2 as best-effort only.
- **Risk:** `forge list` interactive UI conflicts with CI environments (no TTY). **Mitigation:** Detect `!process.stdout.isTTY` and fall back to plain list output.

**Assumptions:**
- **Assumption:** The existing backend JWT format is reusable for CLI tokens — no new token signing infrastructure needed.
- **Assumption:** `shared-types` package already exports `AECStatus` enum and ticket DTO types compatible with the CLI display needs.
- **Assumption:** Device Flow polling uses standard OAuth 2.0 Device Authorization Grant error codes (`authorization_pending`, `expired_token`, `access_denied`).
- **Assumption:** `pnpm-workspace.yaml` already exists at repo root and just needs a new `packages/cli` entry.

**Open Questions:**
- **Q1:** CLI package name: `@forge/cli` (scoped) or `forge-cli` (unscoped)? → Needs decision before 5-1.
- **Q2:** Should `forge list` filter to current team automatically (from config), or always show all teams? → Default: current team from config, `--all` flag expands to all.
- **Q3:** What is the backend's expected Device Flow verification URL domain? (`forge.app/device` or local dev override?) → Needs backend contract before 5-2.
- **Q4:** Should `forge show` attempt local caching for offline mode, or always require network? → Spec says graceful degradation with < 1h cache; confirm with product.

## Test Strategy Summary

**Test levels:**
- **Unit tests** (vitest): `ConfigService`, `AuthService`, `ApiService` — mock file system and HTTP; test token refresh logic, config read/write, chmod verification
- **Command unit tests** (vitest + mocks): each command tested with mocked `ApiService` to verify correct output format, error handling, and exit codes
- **Integration tests** (Epic 8): full `forge login` → `forge list` → `forge show` flow against a backend test environment

**Coverage targets:**
- `ConfigService`: 100% (critical — security-sensitive)
- `AuthService` (Device Flow + refresh): 100%
- `ApiService` (happy path + 401 retry + 5xx retry): 90%+
- Commands: 80%+ (focus on error branches and edge cases)

**Key edge cases to test:**
- Corrupt/missing config file → clear error, no crash
- Token expired mid-session → transparent refresh + retry
- Backend 5xx → retry once, then human-readable error
- `forge list` with 0 tickets → "No tickets assigned to you." message
- `forge show` with invalid ticket ID → 404 → "Ticket not found."
- Ctrl+C during Device Flow polling → clean exit, partial config not saved
