# Epic Technical Specification: MCP Server

Date: 2026-02-20
Author: BMad
Epic ID: 6
Status: Draft

---

## Overview

Epic 6 delivers the MCP (Model Context Protocol) server embedded inside the `forge-cli` package, transforming the CLI from a read-only ticket browser into a live AI-assisted development tool. When a developer runs `forge execute <ticketId>` or `forge review <ticketId>`, the CLI launches a `ForgeMCPServer` over stdio transport that exposes the ticket's full context as structured tools and prompts consumable by any MCP-capable AI coding assistant (Claude Code, Cursor, Windsurf).

This epic builds directly on Epic 5's foundation — authentication, `ConfigService`, `ApiService`, `TicketDetail` types, and command stubs — replacing the "instructions only" stubs with live MCP servers. The AI agent can call `get_ticket_context`, `get_repository_context`, `get_file_changes`, and `update_ticket_status` as first-class MCP tools, and the `forge_execute` / `forge_review` prompts guide the agent through precise, spec-driven workflows defined by the Forge ticket format.

## Objectives and Scope

**In Scope:**
- MCP server foundation: `ForgeMCPServer` class with stdio transport, tools and prompts registration, clean start/stop lifecycle
- 4 MCP tools: `get_ticket_context`, `get_file_changes`, `get_repository_context`, `update_ticket_status`
- 2 MCP prompts: `forge_execute` (implementation agent), `forge_review` (question-generation agent)
- 2 agent guide markdown files embedded in the CLI: `dev-executor.md`, `dev-reviewer.md`
- Live `forge execute <id>` command: status validation, MCP server start, Claude Code instructions, Ctrl+C wait
- Live `forge review <id>` command: status validation, MCP server start, Claude Code instructions, Ctrl+C wait
- `GitService` wrapper around `simple-git` for repository context
- `ApiService.patch()` method for status updates
- Integration tests for all tools with mocked `ApiService` and `simple-git`
- Backend `PATCH /tickets/:id` endpoint consumption (backend must expose this)

**Out of Scope:**
- Automatic question submission to backend after `forge review` → Epic 7
- Web UI status polling / real-time sync → Epic 7
- Ticket lifecycle state machine extensions (QUESTIONS_GENERATED, WAITING_FOR_APPROVAL) → Epic 7
- `forge complete` command → Epic 7
- BMAD-specific multi-agent review orchestration → separate story (6-13)
- npm registry publishing → Epic 8
- Multi-team context switching (single team per session for MVP)

## System Architecture Alignment

The MCP server is embedded inside the CLI process — it is **not** a separate daemon. When `forge execute` runs, it forks no children; it simply begins serving MCP on its own stdin/stdout, while blocking on SIGINT. Claude Code (or another MCP client) connects to this process directly via the stdio transport.

**Architectural alignment:**
- **CLI package**: `forge-cli` standalone public repo (separate from private `forge` monorepo). Already set up in Epic 5. Same `tsup` + CJS build pipeline.
- **MCP SDK**: `@modelcontextprotocol/sdk` added as a runtime dependency. **Critical**: must verify CJS compatibility before implementation starts (see Risks section). If SDK is ESM-only, the CLI build may need to switch to ESM or use dynamic `import()`.
- **Transport**: stdio. No ports opened, no TCP. The AI assistant must be configured to connect to the CLI process as its MCP server (`--stdio` mode in Claude Code MCP settings).
- **Backend communication**: All tool calls that touch the Forge backend use the existing `ApiService` (Bearer token from `~/.forge/config.json`). No direct Firestore access.
- **Git access**: `simple-git` reads the working directory where the developer runs `forge execute`. The tool works only in git repositories.
- **Config flow**: MCP server reads `~/.forge/config.json` at startup (same file `ConfigService` writes). Refreshes if expired via existing `AuthService.refresh()`.

## Detailed Design

### Services and Modules

| Module | Path | Responsibility |
|--------|------|---------------|
| **MCP Server** | `src/mcp/server.ts` | `ForgeMCPServer` class; stdio transport; registers all tools and prompts; `start()` / `stop()` |
| **Tool: get_ticket_context** | `src/mcp/tools/get-ticket-context.ts` | Fetches full `TicketDetail` from `GET /tickets/:id`; returns JSON |
| **Tool: get_file_changes** | `src/mcp/tools/get-file-changes.ts` | Extracts `fileChanges[]` from ticket; returns structured list |
| **Tool: get_repository_context** | `src/mcp/tools/get-repository-context.ts` | Calls `GitService`; returns branch, status, tree, cwd |
| **Tool: update_ticket_status** | `src/mcp/tools/update-ticket-status.ts` | Calls `ApiService.patch('/tickets/:id', { status })`; returns success |
| **Prompt: forge_execute** | `src/mcp/prompts/forge-execute.ts` | Loads `dev-executor.md` + ticket XML; returns structured prompt message |
| **Prompt: forge_review** | `src/mcp/prompts/forge-review.ts` | Loads `dev-reviewer.md` + ticket summary; returns structured prompt message |
| **Agent Guide: dev-executor** | `src/agents/dev-executor.md` | Markdown persona for implementation agent (≤500 lines) |
| **Agent Guide: dev-reviewer** | `src/agents/dev-reviewer.md` | Markdown persona for review/question-gen agent (≤300 lines) |
| **GitService** | `src/services/git.service.ts` | `simple-git` wrapper: `getBranch()`, `getStatus()`, `getFileTree(path?)` |
| **ExecuteCommand** (replace stub) | `src/commands/execute.ts` | Start MCP, validate READY/VALIDATED, auto-assign, wait SIGINT |
| **ReviewCommand** (replace stub) | `src/commands/review.ts` | Start MCP, validate READY/VALIDATED/CREATED/DRIFTED, wait SIGINT |
| **ApiService** (extend) | `src/services/api.service.ts` | Add `patch<T>(path, body, config)` method |

### Data Models and Contracts

**MCP Tool Input Schemas (Zod):**

```typescript
// get_ticket_context
const GetTicketContextInput = z.object({
  ticketId: z.string().describe('The ticket ID (e.g., T-001)')
});

// get_file_changes
const GetFileChangesInput = z.object({
  ticketId: z.string()
});

// get_repository_context
const GetRepositoryContextInput = z.object({
  path: z.string().optional().describe('Absolute path to repo root; defaults to process.cwd()')
});

// update_ticket_status
const UpdateTicketStatusInput = z.object({
  ticketId: z.string(),
  status: z.nativeEnum(AECStatus).describe('New status value')
});
```

**MCP Tool Output Shapes:**

```typescript
// get_ticket_context → serialized as JSON string in MCP text content
interface TicketContextResult {
  id: string; title: string; description?: string;
  problemStatement?: string; solution?: string;
  acceptanceCriteria: string[];
  fileChanges: Array<{ path: string; action: 'create' | 'modify' | 'delete'; notes?: string }>;
  apiChanges?: string; testPlan?: string; designRefs?: string[];
  status: AECStatus; assignee?: string;
}

// get_repository_context
interface RepositoryContextResult {
  branch: string;
  workingDirectory: string;
  status: { modified: string[]; untracked: string[]; staged: string[] };
  fileTree: string; // output of git ls-tree --name-only -r HEAD (truncated to 200 lines)
}

// update_ticket_status
interface UpdateStatusResult {
  success: true;
  ticketId: string;
  newStatus: AECStatus;
}
```

**Prompt Output Contract (MCP PromptMessage):**

```typescript
// forge_execute: returns one user message containing XML-wrapped context
{
  messages: [{
    role: 'user',
    content: {
      type: 'text',
      text: `<agent_guide>\n${devExecutorMd}\n</agent_guide>\n<ticket_context>\n${ticketXml}\n</ticket_context>\n...`
    }
  }]
}
```

**ApiService.patch() signature (new method):**

```typescript
export async function patch<T>(
  path: string,
  body: Record<string, unknown>,
  config: ForgeConfig
): Promise<T>
// Same auth/retry pattern as get() — 401→refresh→retry, 5xx→retry after 2s
```

**Backend endpoint consumed:**
- `PATCH /tickets/:id` — body: `{ status: AECStatus }` — response: updated ticket object

### APIs and Interfaces

**MCP Tool Registration (in `ForgeMCPServer`):**

| Tool Name | Input Schema | Returns |
|-----------|-------------|---------|
| `get_ticket_context` | `{ ticketId: string }` | `TicketContextResult` as JSON string |
| `get_file_changes` | `{ ticketId: string }` | `FileChange[]` as JSON string |
| `get_repository_context` | `{ path?: string }` | `RepositoryContextResult` as JSON string |
| `update_ticket_status` | `{ ticketId: string, status: AECStatus }` | `UpdateStatusResult` as JSON string |

**MCP Prompt Registration:**

| Prompt Name | Arguments | Returns |
|-------------|-----------|---------|
| `forge_execute` | `{ ticketId: string }` | `{ messages: PromptMessage[] }` |
| `forge_review` | `{ ticketId: string }` | `{ messages: PromptMessage[] }` |

**ForgeMCPServer public interface:**

```typescript
class ForgeMCPServer {
  constructor(config: ForgeConfig)
  async start(): Promise<void>   // connects stdio transport, begins serving
  async stop(): Promise<void>    // closes transport gracefully
}
```

### Workflows and Sequencing

**`forge execute T-001` flow:**

```
Developer terminal                  CLI process              Backend API
─────────────────────────           ────────────────         ───────────
$ forge execute T-001
                           ──────► load config
                           ──────► isLoggedIn()
                           ──────► GET /tickets/T-001 ──────► ticket JSON
                           ──────► validate status ∈ {READY, VALIDATED}
                           ──────► PATCH /tickets/T-001 { assignedTo: userId }
                           ──────► new ForgeMCPServer(config).start()
"🚀 MCP server running.
 Open Claude Code and run:
 > forge_execute prompt (T-001)"
                           ──────► [blocks on SIGINT]

Claude Code (MCP client)            CLI MCP server
─────────────────────────           ──────────────
invokes forge_execute prompt  ────► load dev-executor.md
                                    GET /tickets/T-001 ────► TicketContextResult
                              ◄──── prompt message with XML context

calls get_repository_context  ────► GitService.getStatus() / getBranch()
                              ◄──── { branch, status, fileTree }

calls update_ticket_status    ────► PATCH /tickets/T-001 { status: CREATED }
                              ◄──── { success: true }

^C (Ctrl+C)                         server.stop()
                                    process.exit(0)
```

**`forge review T-001` flow (same pattern, different validation and prompt):**

```
- Validates status ∈ {READY, VALIDATED, CREATED, DRIFTED}
- Starts MCP with forge_review prompt registered
- Claude Code calls forge_review → receives dev-reviewer.md persona + ticket summary
- Claude generates 5-10 technical questions
- [Epic 7 will add: POST /tickets/:id/questions to save them]
- Ctrl+C → stop
```

## Non-Functional Requirements

### Performance

- MCP server startup (from `forge execute` to "ready" message): **< 500ms** on standard developer hardware
- `get_ticket_context` round-trip (CLI → backend → response): **< 2s** (leverages existing ApiService retry logic)
- `get_repository_context` for a typical repo (< 10k files): **< 1s** (git ls-tree is fast for indexed files)
- `forge_execute` / `forge_review` prompt generation (loads markdown guide + ticket): **< 500ms** (file read + string concat)

### Security

- Bearer token from `~/.forge/config.json` is read at MCP server startup and passed to each tool call via closure — **never logged** to stdout or stderr
- Debug logging (DEBUG=forge:\*) must explicitly redact Authorization headers
- `update_ticket_status` validates the `status` field against the `AECStatus` enum before sending — prevents injection of arbitrary string values
- Config file must be chmod 600 (enforced by `ConfigService.save()` from Epic 5)
- MCP server runs in-process — no network ports opened, no attack surface beyond the terminal session

### Reliability/Availability

- Graceful SIGINT: `process.once('SIGINT', () => server.stop().then(() => process.exit(0)))`
- Unhandled rejection in a tool handler: catch, return MCP error response (don't crash the server)
- `get_repository_context` in a non-git directory: return structured error `{ error: 'Not a git repository' }` — do not throw
- If backend unreachable during tool call: return MCP error (same "Cannot reach Forge server" message), continue serving other tool calls

### Observability

- `DEBUG=forge:*` env var enables verbose logging to stderr (not stdout — stdout is MCP protocol)
- Each tool call logs: `[forge:mcp] tool=get_ticket_context ticketId=T-001 duration=234ms`
- MCP server start/stop events logged at INFO level to stderr
- No telemetry or external reporting in this epic

## Dependencies and Integrations

| Dependency | Version | Purpose | Notes |
|-----------|---------|---------|-------|
| `@modelcontextprotocol/sdk` | `^1.0.0` | MCP server + tool/prompt registration | ⚠️ VERIFY CJS support before starting 6-1 |
| `simple-git` | `^3.27.0` | Git repository context | Pin minor version |
| `zod` | `^3.23.8` | Tool input validation | Already in Epic 5 |
| `commander` | `^12.1.0` | CLI framework | Already in Epic 5 |
| `chalk` | `^5.3.0` | Terminal formatting | Already in Epic 5 |
| `@types/node` | `^20.17.0` | Node.js type definitions | Already in Epic 5 |

**Backend integration point:**
- `PATCH /tickets/:id` — must be implemented in the NestJS backend. Currently `ApiService` has only `get<T>()`. Story 6-5 adds `patch()` to the CLI side; the backend endpoint must exist or be created in parallel.

**Existing Epic 5 modules reused:**
- `ConfigService` — load/save/clear tokens
- `AuthService` — isLoggedIn, refresh
- `ApiService.get<T>()` — fetch tickets
- `TicketDetail` type from `src/types/ticket.ts`
- `AECStatus` enum from `src/types/ticket.ts`

## Acceptance Criteria (Authoritative)

1. `ForgeMCPServer` starts with stdio transport; a connected MCP client can list available tools and prompts without error.
2. `get_ticket_context({ ticketId: 'T-001' })` returns a JSON string containing all `TicketDetail` fields including `acceptanceCriteria[]` and `fileChanges[]`.
3. `get_file_changes({ ticketId: 'T-001' })` returns a JSON array of file change objects with `path` and `action` fields.
4. `get_repository_context({})` run inside a git repo returns current branch name, git status (modified/untracked/staged), and a file tree snapshot.
5. `get_repository_context({})` run outside a git repo returns a structured error message (does not crash).
6. `update_ticket_status({ ticketId: 'T-001', status: 'CREATED' })` calls `PATCH /tickets/T-001` and returns `{ success: true, newStatus: 'CREATED' }`.
7. `forge_execute({ ticketId: 'T-001' })` returns a prompt message containing the full `dev-executor.md` persona and ticket context in XML format.
8. `forge_review({ ticketId: 'T-001' })` returns a prompt message containing the full `dev-reviewer.md` persona and ticket summary.
9. `forge execute T-001` validates status ∈ {READY, VALIDATED}, starts the MCP server, prints Claude Code setup instructions, and blocks until Ctrl+C.
10. `forge review T-001` validates status ∈ {READY, VALIDATED, CREATED, DRIFTED}, starts the MCP server, prints Claude Code setup instructions, and blocks until Ctrl+C.
11. All MCP tool errors (ticket not found, unauthorized, network failure) return structured MCP error responses — the server does not crash.
12. `tsc --noEmit` → 0 errors across all new files.
13. Integration test suite for all 4 tools passes with mocked `ApiService` and `simple-git`.
14. `dev-executor.md` is ≤ 500 lines and contains: Persona, Principles, Process, Code Quality Rules.
15. `dev-reviewer.md` is ≤ 300 lines and contains: Persona, Principles, Question Categories, Examples.

## Traceability Mapping

| AC | Spec Section | Component(s) | Test Idea |
|----|-------------|-------------|-----------|
| AC1 | Detailed Design → MCP Server | `ForgeMCPServer.start()` | Unit: mock StdioTransport; assert tools registered |
| AC2 | APIs: get_ticket_context | `get-ticket-context.ts` + `ApiService.get` | Unit: mock ApiService; assert returned JSON shape |
| AC3 | APIs: get_file_changes | `get-file-changes.ts` | Unit: mock ticket with fileChanges; assert array |
| AC4 | APIs: get_repository_context | `get-repository-context.ts` + `GitService` | Unit: mock simple-git; assert branch/status/tree |
| AC5 | Reliability: non-git dir | `get-repository-context.ts` | Unit: simple-git throws ENOENT; assert error object |
| AC6 | APIs: update_ticket_status | `update-ticket-status.ts` + `ApiService.patch` | Unit: mock patch; assert call args and return |
| AC7 | APIs: forge_execute prompt | `forge-execute.ts` | Unit: assert message contains dev-executor.md content |
| AC8 | APIs: forge_review prompt | `forge-review.ts` | Unit: assert message contains dev-reviewer.md content |
| AC9 | Workflows: forge execute | `src/commands/execute.ts` | Integration: mock MCP server; test SIGINT cleanup |
| AC10 | Workflows: forge review | `src/commands/review.ts` | Integration: mock MCP server; test SIGINT cleanup |
| AC11 | Reliability: tool errors | All tool files | Unit: each tool handles ApiService rejection gracefully |
| AC12 | NFR: TypeScript | All new files | CI: `npm run typecheck` → 0 errors |
| AC13 | Test Strategy | `__tests__/` | Integration: all 4 tools with mocked dependencies |
| AC14 | Agent Guide: executor | `src/agents/dev-executor.md` | Manual: word count ≤ 500 lines, sections present |
| AC15 | Agent Guide: reviewer | `src/agents/dev-reviewer.md` | Manual: word count ≤ 300 lines, sections present |

## Risks, Assumptions, Open Questions

**Risk: `@modelcontextprotocol/sdk` ESM-only** (Severity: HIGH)
- The SDK may export only ESM modules. The CLI is compiled to CJS by tsup.
- Mitigation options: (a) Switch CLI to ESM — change `tsup.config.ts` format to `['esm']`, update `package.json` `"type": "module"`, update all imports; (b) Use dynamic `import()` in an async factory; (c) Use `--experimental-vm-modules` in Node.js to load ESM in CJS context.
- **Action**: Verify CJS compat before starting Story 6-1. Run `node -e "require('@modelcontextprotocol/sdk')"` after install.

**Risk: Backend `PATCH /tickets/:id` not implemented** (Severity: MEDIUM)
- The CLI's `update_ticket_status` tool depends on this endpoint. Backend may not expose it yet.
- Mitigation: Build tool with mock response path; coordinate backend story in parallel. Story 6-5 should include a note to verify backend endpoint.

**Risk: `GET /auth/device/request` and `GET /auth/device/token` not yet in backend** (Severity: MEDIUM)
- `forge login` won't work end-to-end without these endpoints. Currently tested with mocks only.
- Mitigation: Out of scope for Epic 6 but must be resolved before public CLI launch.

**Assumption: stdio transport is universally supported by Claude Code, Cursor, Windsurf**
- Standard MCP protocol. All major clients support it. Configuration is client-specific (`.claude/settings.json` for Claude Code).

**Assumption: Developer runs `forge execute` from the project root**
- `get_repository_context` defaults to `process.cwd()`. If the developer is in a subdirectory, the tool may miss files. Mitigation: document this in the CLI help text.

**Open Question: Should `forge review` auto-POST questions to backend when Ctrl+C is pressed?**
- Current plan: No — just print questions to stdout. Epic 7 adds the POST endpoint and automatic submission.
- If answer changes, Story 6-12 (ticket-review-mcp-tools) would need a backend call on exit.

**Open Question: What format does the backend `PATCH /tickets/:id` accept for status?**
- Assumed: `{ status: AECStatus }` matching the Zod enum. Must be confirmed with backend team.

## Test Strategy Summary

**Unit tests** (vitest, same framework as Epic 5):
- Each MCP tool in isolation with mocked `ApiService` and `GitService`
- `forge_execute` and `forge_review` prompts: assert markdown guide content included
- `ForgeMCPServer`: mock `StdioServerTransport`; verify tools and prompts register correctly
- Error paths: ticket not found (404), unauthorized (401), network failure, non-git directory

**Integration tests** (Story 6-10):
- Start a real `ForgeMCPServer` instance (stdio replaced with in-memory transport)
- Connect a test MCP client; list tools; call each tool; verify output shapes
- Coverage: all 4 tools × success + error paths = ~8 integration scenarios

**Manual testing:**
- `forge execute T-001` → Claude Code connects via MCP settings → invokes `forge_execute` prompt → uses tools → calls `update_ticket_status` → status changes in backend
- `forge review T-001` → Claude Code invokes `forge_review` prompt → generates 5-10 questions → printed to stdout

**TypeScript coverage:** `npm run typecheck` → 0 errors (enforced before every review)

## Post-Review Follow-ups

*From Story 6.2 code review (2026-02-20)*

- Stories 6-3, 6-4, 6-5: Extract `ToolResult` and `TextContent` interfaces from `get-ticket-context.ts` into `src/mcp/types.ts` before adding new tools — avoids duplication.
- Future SDK upgrade: Remove `Promise<any>` annotation on `CallToolRequestSchema` handler in `server.ts:32` when upgrading to `@modelcontextprotocol/sdk` version compatible with Zod v4, or when migrating the project to Zod v4.

---

*From Story 6.1 code review (2026-02-20)*

- Story 6-5 must implement auto-assign (`PATCH /tickets/:id`) in `forge execute` — `// TODO(6-5)` at `execute.ts:61`
- Story 6-10 (integration tests): add `forge mcp` SIGINT integration test and `forge review` instruction block content test
- Consider `process.once` instead of `process.on` for SIGINT in `login.ts:37`
- Consider extracting `DIVIDER` constant to `src/ui/formatters.ts` (currently duplicated in `execute.ts:14` and `review.ts:16`)
