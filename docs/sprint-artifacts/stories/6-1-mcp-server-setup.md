# Story 6.1: MCP Server Foundation & One-Time Setup

Status: drafted

## Story

As a developer using the Forge CLI,
I want to run `forge mcp install` once to register Forge as a persistent MCP server in my project,
so that Claude Code automatically connects to it on startup and I can invoke `forge_execute` or `forge_review` prompts for any ticket without reconfiguring anything.

## Acceptance Criteria

1. `@modelcontextprotocol/sdk` and `simple-git` are installed and importable; `node --input-type=module -e "import('@modelcontextprotocol/sdk/server/index.js')"` exits 0.
2. `ForgeMCPServer` class exists at `src/mcp/server.ts` with public `async start(): Promise<void>` and `async stop(): Promise<void>` methods.
3. `ForgeMCPServer.start()` connects a `StdioServerTransport` and begins serving the MCP protocol. A connected client can call `listTools` and `listPrompts` without a protocol error (empty lists are fine at this stage).
4. `ForgeMCPServer.stop()` closes the transport gracefully without throwing, including when called before `start()`.
5. After a successful `forge login`, the CLI automatically attempts to register Forge as a user-scoped MCP server via `claude mcp add --transport stdio --scope user forge -- forge mcp`. If the `claude` CLI is not found, the step is silently skipped and a tip is printed instead. Login itself must not fail due to MCP setup errors.
6. `forge mcp install` writes a `.mcp.json` file to the current working directory (project root) with config `{ "mcpServers": { "forge": { "type": "stdio", "command": "forge", "args": ["mcp"] } } }`, merging with any existing entries rather than overwriting.
7. `forge mcp install` also attempts `claude mcp add --transport stdio --scope project forge -- forge mcp` and prints success/skip based on `claude` CLI availability.
8. `forge mcp` (the persistent daemon command) starts `ForgeMCPServer` and blocks indefinitely — Claude Code spawns this process from config.
9. `forge execute <id>` (for a valid READY/VALIDATED ticket): validates status, auto-assigns ticket via `PATCH /tickets/:id`, prints instruction block, then exits cleanly.
10. `forge review <id>` (for a valid READY/VALIDATED/CREATED/DRIFTED ticket): validates status, prints instruction block for `forge_review` prompt, exits cleanly.
11. `npm run typecheck` → 0 errors across all new and modified files.
12. Unit tests: `ForgeMCPServer` start/stop lifecycle; `forge mcp install` `.mcp.json` write/merge logic; post-login MCP setup (success and `claude` not found paths); `forge execute` instruction output.
13. Directory scaffolding created: `src/mcp/`, `src/mcp/tools/`, `src/mcp/prompts/`, `src/agents/`.

## Tasks / Subtasks

- [ ] Task 1: Install SDK dependencies (AC: 1)
  - [ ] `npm install @modelcontextprotocol/sdk simple-git` in `forge-cli/`
  - [ ] Verify ESM import: `node --input-type=module -e "import('@modelcontextprotocol/sdk/server/index.js').then(() => console.log('ok'))"`
  - [ ] Pin `simple-git` to `^3.27.0`

- [ ] Task 2: Create directory structure (AC: 12)
  - [ ] Create `src/mcp/`, `src/mcp/tools/`, `src/mcp/prompts/`, `src/agents/` directories
  - [ ] Add placeholder `.gitkeep` files so directories are tracked in git

- [ ] Task 3: Implement `ForgeMCPServer` class (AC: 2, 3, 4)
  - [ ] Create `src/mcp/server.ts`
  - [ ] Constructor accepts `ForgeConfig` (stored for tool use in later stories)
  - [ ] `start()`: instantiate `Server` from SDK with server info, create `StdioServerTransport`, call `server.connect(transport)` — all debug output to `stderr` only
  - [ ] `stop()`: close transport gracefully; safe noop if not yet started
  - [ ] Empty tool/prompt registration — `listTools` and `listPrompts` return `[]`, not errors

- [ ] Task 4: Implement `forge mcp` persistent daemon command (AC: 8)
  - [ ] Create `src/commands/mcp.ts` with `mcpCommand`
  - [ ] Load config, check `isLoggedIn()`, then instantiate and `start()` `ForgeMCPServer`
  - [ ] Block indefinitely (server serves until Claude Code kills the process)
  - [ ] Register `process.once('SIGINT', () => server.stop().then(() => process.exit(0)))`
  - [ ] Register command in `src/index.ts`

- [ ] Task 5: Implement `forge mcp install` subcommand (AC: 6, 7)
  - [ ] Add `install` subcommand to `mcpCommand`
  - [ ] Read existing `.mcp.json` if present and merge `forge` entry; create if absent
  - [ ] Run `claude mcp add --transport stdio --scope project forge -- forge mcp` via `child_process.execSync`; catch `ENOENT` / non-zero exit and print skip notice
  - [ ] Print success output (see Dev Notes for format)

- [ ] Task 6: Auto-configure MCP on successful login (AC: 5)
  - [ ] Extract MCP setup into a shared helper `src/mcp/install.ts` → `tryRegisterMcpServer(scope: 'user' | 'project'): Promise<'registered' | 'skipped'>`
  - [ ] In `src/commands/login.ts`, after `spinner.succeed(...)`, call `tryRegisterMcpServer('user')`
  - [ ] If registered: print `chalk.dim('  ✓ Forge MCP server registered (user scope)')`
  - [ ] If skipped (claude CLI not found): print `chalk.dim('  ℹ  Run \`forge mcp install\` to enable MCP in Claude Code')`
  - [ ] Wrap in try/catch — any error must NOT cause login to fail or exit non-zero

- [ ] Task 7: Update `execute.ts` — replace stub with instruction output (AC: 9)
  - [ ] After status validation, defer auto-assign to story 6-5 (`ApiService.patch` not yet available); add `// TODO(6-5): auto-assign via ApiService.patch`
  - [ ] Print instruction block to stderr (see Dev Notes for format)
  - [ ] Remove "Coming in Epic 6" stub; command exits 0

- [ ] Task 8: Update `review.ts` — replace stub with instruction output (AC: 10)
  - [ ] Same pattern as Task 7 but for `forge_review` prompt
  - [ ] Valid statuses: `READY`, `VALIDATED`, `CREATED`, `DRIFTED`

- [ ] Task 9: Tests + typecheck (AC: 11, 12)
  - [ ] `src/mcp/__tests__/server.test.ts` — mock `StdioServerTransport`; test `start()`, `stop()`, safe noop stop
  - [ ] `src/mcp/__tests__/install.test.ts` — mock `child_process.execSync` and `fs`; test registered/skipped paths; test `.mcp.json` merge logic
  - [ ] `src/commands/__tests__/login.test.ts` — assert MCP setup runs after success; assert login exits 0 even when MCP setup throws
  - [ ] `src/commands/__tests__/execute.test.ts` — assert instruction block printed to stderr, exits 0
  - [ ] `npm run typecheck` → 0 errors
  - [ ] `npm test` → all tests pass (no regressions on existing 48)

## Dev Notes

### Architecture: Persistent Server + Zero-Friction Setup

Claude Code **spawns the MCP server process itself** from config — the developer never runs it manually. Full flow:

```
forge login  (once, ever)
  → auth succeeds
  → auto-runs: claude mcp add --transport stdio --scope user forge -- forge mcp
  → writes to ~/.claude.json (user scope — works across ALL projects)
  → prints: "✓ Forge MCP server registered"

forge mcp install  (optional, per-project)
  → writes .mcp.json to project root (team-shared, checked into git)
  → runs: claude mcp add --transport stdio --scope project forge -- forge mcp

Per-ticket (zero friction after login):
  forge execute T-001
  → validates status, marks assigned
  → prints: "Invoke forge_execute prompt with ticketId: T-001"
  → exits

Claude Code (already running forge mcp daemon from user config):
  → developer invokes forge_execute prompt → ticketId: T-001
  → MCP tools called: get_ticket_context, get_repository_context, etc.
  → update_ticket_status called when done
```

### Two-Scope Strategy: User vs Project

| Scope | Triggered by | Config file | Benefit |
|-------|-------------|-------------|---------|
| **User** | `forge login` (automatic) | `~/.claude.json` | Works across all projects instantly |
| **Project** | `forge mcp install` (optional) | `.mcp.json` in project root | Team-shared, checked into git |

The login auto-registers user scope so the developer gets MCP immediately without any extra step. Project scope is additive — useful for teams where not everyone has done `forge login` yet.

**Implementation note for user-scope:** `claude mcp add --transport stdio --scope user forge -- forge mcp`

**Implementation note for project-scope:** `claude mcp add --transport stdio --scope project forge -- forge mcp` + write `.mcp.json`

If `.mcp.json` already exists, the install command must **merge** the `forge` entry rather than overwrite the file.

### stdout vs stderr Rule (Critical)

The `forge mcp` daemon communicates MCP protocol over `stdin`/`stdout`. Any logging must go to `stderr`.

```typescript
// Correct
process.stderr.write(`[forge:mcp] server started\n`);

// Wrong — corrupts MCP framing
console.log('server started');
```

`forge execute` and `forge review` also print their instruction blocks to `stderr` for consistency (and to keep stdout clean for future scripting use).

### Post-Login MCP Output (inline, concise)

Appended after `spinner.succeed(...)` in `login.ts`:

```
 ✓ Logged in as jane@example.com | Team: acme
 ✓ Forge MCP server registered (user scope)
   Claude Code will connect automatically on next start.
```

Or if `claude` CLI not found:

```
 ✓ Logged in as jane@example.com | Team: acme
 ℹ  Run `forge mcp install` to enable MCP in Claude Code
```

### `forge mcp install` Output Format (project scope)

```
────────────────────────────────────────────────────────────────────────
 Forge MCP Server — Project Setup
────────────────────────────────────────────────────────────────────────

 ✅  Written .mcp.json (project scope — commit this file for your team)
 ✅  Registered via: claude mcp add --scope project ...

 Restart Claude Code to apply. Per-ticket usage:
   forge execute T-001   → invoke forge_execute prompt in Claude Code
   forge review T-001    → invoke forge_review prompt in Claude Code

────────────────────────────────────────────────────────────────────────
```

### `forge execute` Output Format (after this story)

```
────────────────────────────────────────────────────────────────────────
 Ticket: [T-001] Fix authentication timeout
 Status: ✅ READY  →  auto-assigned to you

 Ready to execute. In Claude Code, invoke:

   forge_execute prompt  →  ticketId: T-001

 (Forge MCP server is running in the background via .mcp.json)
 If not set up yet, run: forge mcp install
────────────────────────────────────────────────────────────────────────
```

### Auto-Assign in execute.ts (Task 6 note)

`ApiService.patch()` doesn't exist yet (added in story 6-5). For this story, either:
- Use a raw `fetch` inline for the PATCH, or
- Skip auto-assign and add a `// TODO(6-5): auto-assign via ApiService.patch` comment

Defer to implementer's judgement — don't block story 6-1 on this.

### ESM: Already Resolved

`forge-cli/package.json` has `"type": "module"` — the CLI is already native ESM. The tech spec's HIGH risk about SDK ESM-only compatibility is a non-issue. Just `npm install` and import.

### Learnings from Previous Story

**From Story 5-8-error-handling-offline (Status: done)**

- **`ApiService.get<T>()`** at `forge-cli/src/services/api.service.ts` — network error + 5xx retry + 401 refresh; MCP tools in later stories use this
- **Test infrastructure**: vitest, 48 tests passing — do not regress; follow `src/services/__tests__/` patterns
- **Fake timer gotcha**: store `const assertion = expect(...).rejects.toThrow(...)` *before* `vi.advanceTimersByTimeAsync()` to avoid `PromiseRejectionHandledWarning`
- **`execute.ts` and `review.ts`** are stubs that print "Coming in Epic 6" and `process.exit(0)` — Tasks 6 and 7 replace this

[Source: stories/5-8-error-handling-offline.md#Dev-Agent-Record]

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-6-mcp-server.md#Detailed-Design] — `ForgeMCPServer` class, tool schemas (all take `ticketId` as param), module paths
- [Source: docs/sprint-artifacts/tech-spec-epic-6-mcp-server.md#Risks] — ESM risk (resolved)
- [Source: docs/sprint-artifacts/tech-spec-epic-6-mcp-server.md#Non-Functional-Requirements] — startup < 500ms; stdout reserved for MCP protocol
- [Source: docs/CLI/FORGE-TEAMS-CLI-ARCHITECTURE.md#MCP-Server-Architecture] — stdio transport, embedded in CLI, stateless per-call design

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
