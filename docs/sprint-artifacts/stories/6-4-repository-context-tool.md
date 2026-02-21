# Story 6.4: Repository Context MCP Tool

Status: done

## Story

As a developer using Claude Code,
I want the `get_repository_context` MCP tool to be available via the Forge MCP server,
so that Claude can understand the current state of my git repository — active branch, modified files, and project structure — without me having to describe it manually.

## Acceptance Criteria

1. `get_repository_context` appears in `tools/list` with name `"get_repository_context"`, a meaningful description, and input schema where `path` is an optional string (NOT required).
2. `get_repository_context({ path? })` called inside a git repository returns `{ content: [{ type: 'text', text: JSON.stringify(result) }] }` where `result` contains: `branch` (string), `workingDirectory` (string), `status` (`{ modified: string[], untracked: string[], staged: string[] }`), and `fileTree` (string).
3. `fileTree` is the output of `git ls-tree --name-only -r HEAD`, truncated to a maximum of 200 lines.
4. When `path` is not provided, `workingDirectory` defaults to `process.cwd()`.
5. When called outside a git repository (or when git is unavailable), the tool returns `{ content: [{ type: 'text', text: JSON.stringify({ error: 'Not a git repository' }) }], isError: true }` — the MCP server does NOT crash.
6. `GitService` is implemented at `src/services/git.service.ts` as a `simple-git` wrapper with methods `getBranch(path)`, `getStatus(path)`, and `getFileTree(path)`.
7. `ForgeMCPServer` registers 3 tools in `ListToolsRequestSchema` handler.
8. `npm run typecheck` → 0 errors across all new and modified files.
9. Unit tests cover: success path (correct output shape), non-git directory error, default path behavior, fileTree truncation. Total tests ≥ 117 (14+ new over 103 baseline).

## Tasks / Subtasks

- [x] Task 1: Add `simple-git` dependency and implement `GitService` (AC: 6)
  - [x] Run `npm install simple-git` in `forge-cli/` to add the dependency
  - [x] Create `src/services/git.service.ts` with class `GitService`:
    - [x] `constructor(private repoPath: string)` — accepts path to repo root
    - [x] `async getBranch(): Promise<string>` — returns current branch name via `simpleGit(this.repoPath).branchLocal()`
    - [x] `async getStatus(): Promise<{ modified: string[]; untracked: string[]; staged: string[] }>` — returns `simpleGit(this.repoPath).status()` mapped to the output shape
    - [x] `async getFileTree(): Promise<string>` — runs `simpleGit(this.repoPath).raw(['ls-tree', '--name-only', '-r', 'HEAD'])`, returns result truncated to 200 lines joined by newline
  - [x] All three methods must propagate errors (caller handles non-git directory)

- [x] Task 2: Implement `get-repository-context.ts` tool module (AC: 1, 2, 3, 4, 5)
  - [x] Create `src/mcp/tools/get-repository-context.ts`
  - [x] Export `getRepositoryContextToolDefinition`: name `'get_repository_context'`, description, inputSchema with optional `path` property (`type: 'string'`, NOT in required array)
  - [x] Export `handleGetRepositoryContext(args: Record<string, unknown>, config: ForgeConfig): Promise<ToolResult>`
  - [x] Extract `path` from args; default to `process.cwd()` if not provided or not a string
  - [x] Instantiate `new GitService(resolvedPath)` and call `getBranch()`, `getStatus()`, `getFileTree()` in parallel via `Promise.all()`
  - [x] On success: return `{ content: [{ type: 'text', text: JSON.stringify({ branch, workingDirectory: resolvedPath, status, fileTree }) }] }`
  - [x] On error (any — including non-git dir): check if error message suggests non-git context; return `{ content: [{ type: 'text', text: JSON.stringify({ error: 'Not a git repository' }) }], isError: true }`
  - [x] For unrecognized errors: return `{ content: [{ type: 'text', text: message }], isError: true }`
  - [x] Import `ToolResult` from `'../types.js'`
  - [x] `config` parameter is accepted but not used (reserved for future auth-gated git operations)

- [x] Task 3: Register tool in `ForgeMCPServer` (AC: 1, 7)
  - [x] Import `getRepositoryContextToolDefinition` and `handleGetRepositoryContext` from `'./tools/get-repository-context.js'`
  - [x] Add `getRepositoryContextToolDefinition` to the `ListToolsRequestSchema` array (now 3 tools)
  - [x] Add `case 'get_repository_context':` to the `CallToolRequestSchema` switch dispatch

- [x] Task 4: Write tests + validate (AC: 8, 9)
  - [x] Create `src/services/__tests__/git.service.test.ts`
  - [x] Create `src/mcp/tools/__tests__/get-repository-context.test.ts`
  - [x] Update `src/mcp/__tests__/server.test.ts`
  - [x] Run `npm run typecheck` → 0 errors
  - [x] Run `npm test` → 123 tests passing (20 new over 103 baseline), 0 regressions

## Dev Notes

### GitService Design

`GitService` is a thin wrapper around `simple-git`. It is NOT a singleton — instantiate per tool call with the resolved path:

```typescript
// src/services/git.service.ts
import simpleGit from 'simple-git';

export class GitService {
  constructor(private repoPath: string) {}

  async getBranch(): Promise<string> {
    const result = await simpleGit(this.repoPath).branchLocal();
    return result.current;
  }

  async getStatus(): Promise<{ modified: string[]; untracked: string[]; staged: string[] }> {
    const result = await simpleGit(this.repoPath).status();
    return {
      modified: result.modified,
      untracked: result.not_added,   // simple-git uses 'not_added' for untracked
      staged: result.staged,
    };
  }

  async getFileTree(): Promise<string> {
    const raw = await simpleGit(this.repoPath).raw(['ls-tree', '--name-only', '-r', 'HEAD']);
    const lines = raw.split('\n').filter(Boolean);
    return lines.slice(0, 200).join('\n');
  }
}
```

Key notes:
- `simple-git` `status()` uses `not_added` for untracked files (not `untracked`)
- `getFileTree()` filters blank lines before truncating so 200-line limit is accurate
- All methods let errors propagate — caller handles non-git directory

### Tool Handler: Error Detection

`simple-git` throws errors with messages like:
- `"fatal: not a git repository (or any of the parent directories): .git"`
- `"ENOENT: no such file or directory"`

The handler should catch these broadly. Strategy: if the error message contains any of `'not a git'`, `'not a Git'`, `'ENOENT'`, `'fatal'` → return the structured `{ error: 'Not a git repository' }` error. All other errors → return the raw message.

```typescript
const isNonGitError = (msg: string) =>
  msg.includes('not a git') ||
  msg.toLowerCase().includes('not a git') ||
  msg.includes('ENOENT') ||
  msg.includes('fatal');
```

### Tool Handler: Parallelism

Use `Promise.all` for the three git calls:

```typescript
const [branch, status, fileTree] = await Promise.all([
  git.getBranch(),
  git.getStatus(),
  git.getFileTree(),
]);
```

If any throws (e.g., non-git dir), the whole `Promise.all` rejects — caught by the outer try/catch.

### Tool Input Schema: Optional Path

`path` is optional — do NOT add it to `required`:

```typescript
inputSchema: {
  type: 'object' as const,
  properties: {
    path: {
      type: 'string',
      description: 'Absolute path to repo root; defaults to process.cwd()',
    },
  },
  required: [],   // or omit required entirely
}
```

### RepositoryContextResult Shape

```typescript
interface RepositoryContextResult {
  branch: string;
  workingDirectory: string;
  status: {
    modified: string[];
    untracked: string[];
    staged: string[];
  };
  fileTree: string; // max 200 lines, newline-separated
}
```

### Mocking simple-git in Tests

`simple-git` uses a fluent/builder API. Mock it with a factory:

```typescript
vi.mock('simple-git', () => ({
  default: vi.fn(() => ({
    branchLocal: vi.fn().mockResolvedValue({ current: 'main' }),
    status: vi.fn().mockResolvedValue({
      modified: ['src/foo.ts'],
      not_added: ['src/bar.ts'],
      staged: ['src/baz.ts'],
    }),
    raw: vi.fn().mockResolvedValue('src/a.ts\nsrc/b.ts\n'),
  })),
}));
```

Note: `simple-git` exports a default function, not named exports. The mock must use `default`.

### New Dependency

`simple-git` is listed in the epic tech spec as a required dependency:

```
simple-git ^3.27.0 — Git repository context (pin minor version)
```

Add to `forge-cli/package.json` dependencies (not devDependencies — needed at runtime).

### Project Structure Notes

- `src/services/git.service.ts` — new service (alongside `api.service.ts`, `auth.service.ts`, `config.service.ts`)
- `src/services/__tests__/git.service.test.ts` — new test (alongside existing service tests)
- `src/mcp/tools/get-repository-context.ts` — new tool module
- `src/mcp/tools/__tests__/get-repository-context.test.ts` — new tests
- All imports use `.js` extension for ESM compatibility

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-6-mcp-server.md#Detailed-Design] — `get_repository_context` tool spec, `GitService` module
- [Source: docs/sprint-artifacts/tech-spec-epic-6-mcp-server.md#Data-Models-and-Contracts] — `RepositoryContextResult` interface
- [Source: docs/sprint-artifacts/tech-spec-epic-6-mcp-server.md#Reliability] — non-git dir returns structured error, does not crash
- [Source: docs/sprint-artifacts/tech-spec-epic-6-mcp-server.md#Performance] — < 1s for typical repo
- [Source: forge-cli/src/mcp/server.ts] — add to ListTools + CallTool dispatch
- [Source: forge-cli/src/mcp/types.ts] — import `ToolResult` from here

### Learnings from Previous Story

**From Story 6-3-file-changes-tool (Status: done)**

- **Shared types**: Import `ToolResult` from `'../types.js'` (not from SDK or local definition)
- **args type**: Always `args: Record<string, unknown>` in handler signature
- **Import paths**: `.js` extension required (e.g., `'../types.js'`, `'./tools/get-repository-context.js'`)
- **CallTool handler**: `Promise<any>` annotation required on server.ts handler (Zod v3/v4 workaround — do not remove)
- **Test baseline**: 103 tests, 0 typecheck errors
- **Server test pattern**: Mock new tool module before imports; update ListTools assertion count; add dispatch test

[Source: stories/6-3-file-changes-tool.md#Dev-Agent-Record]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- `simple-git` was already in `package.json` at `^3.31.1` — no install needed
- `simple-git` status result uses `not_added` (not `untracked`) for untracked files; mapped in `GitService.getStatus()`
- vitest constructor mock pattern: classes used with `new` MUST use `vi.fn(function(this) {...})` NOT arrow functions — learned from `GitService` mock failure
- Whitespace-only path string (`'   '`) is treated the same as empty string — trimmed and falls back to `process.cwd()`
- `isNonGitError` checks lowercase for robustness; `'fatal'` alone catches most git error prefixes

### File List

- `forge-cli/src/services/git.service.ts` — new
- `forge-cli/src/services/__tests__/git.service.test.ts` — new (7 tests)
- `forge-cli/src/mcp/tools/get-repository-context.ts` — new
- `forge-cli/src/mcp/tools/__tests__/get-repository-context.test.ts` — new (12 tests)
- `forge-cli/src/mcp/__tests__/server.test.ts` — updated (1 new mock, 3 new assertions → 12 tests)
- `forge-cli/src/mcp/server.ts` — updated (3 tools registered)

---

## Senior Developer Review (AI)

**Reviewer:** BMad
**Date:** 2026-02-20
**Outcome:** ✅ APPROVE

### Summary

Story 6-4 delivers the `get_repository_context` MCP tool and the `GitService` dependency cleanly and completely. All 9 acceptance criteria are satisfied with verifiable evidence. Tests are comprehensive (123 total, 20 new), typecheck is clean, and the implementation is well-structured. No high or medium severity findings.

---

### Key Findings

**HIGH severity:** None.

**MEDIUM severity:** None.

**LOW severity:**

- **Redundant pattern in `isNonGitError`** (`get-repository-context.ts:28-31`): `'not a git repository'` is a subset of `'not a git'`, making the last OR clause unreachable. Not a bug, just minor dead code. No action required.
- **Unused `config` parameter suppressed with eslint-disable** (`get-repository-context.ts:42-43`): The `@typescript-eslint/no-unused-vars` disable is appropriate for a reserved-for-future-use parameter. Well-documented in the story notes.

---

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC1 | Tool appears in tools/list; `path` is optional (not in `required`) | ✅ IMPLEMENTED | `get-repository-context.ts:6-21`; `server.ts:33`; `server.test.ts:108-112` |
| AC2 | Returns JSON with `branch`, `workingDirectory`, `status`, `fileTree` | ✅ IMPLEMENTED | `get-repository-context.ts:60-72`; `get-repository-context.test.ts:79-83` |
| AC3 | `fileTree` is `git ls-tree --name-only -r HEAD`, truncated to 200 lines | ✅ IMPLEMENTED | `git.service.ts:32-39`; `git.service.test.ts:82-91` (truncation), `94-104` (correct args) |
| AC4 | `path` not provided → `workingDirectory` defaults to `process.cwd()` | ✅ IMPLEMENTED | `get-repository-context.ts:45-49`; `get-repository-context.test.ts:92-105, 107-112` |
| AC5 | Non-git directory → returns `{ error: 'Not a git repository' }` with `isError: true`, server does not crash | ✅ IMPLEMENTED | `get-repository-context.ts:76-86`; `get-repository-context.test.ts:116-138` |
| AC6 | `GitService` at `src/services/git.service.ts`, wraps `simple-git`, has `getBranch`, `getStatus`, `getFileTree` | ✅ IMPLEMENTED | `git.service.ts:1-41` (all 3 methods); `git.service.test.ts:17-107` (7 tests) |
| AC7 | `ForgeMCPServer` registers 3 tools in `ListToolsRequestSchema` handler | ✅ IMPLEMENTED | `server.ts:32-34` (3-item array); `server.test.ts:108` (`toHaveLength(3)`) |
| AC8 | `npm run typecheck` → 0 errors | ✅ IMPLEMENTED | Verified above: `tsc --noEmit` exits 0 |
| AC9 | Tests: success path, non-git error, default path, fileTree truncation; ≥ 117 total | ✅ IMPLEMENTED | 123 total (20 new over 103 baseline); all 4 coverage areas verified |

**AC Coverage: 9 of 9 acceptance criteria fully implemented.**

---

### Task Completion Validation

| Task | Marked | Verified | Evidence |
|------|--------|----------|----------|
| Task 1: GitService + simple-git dep | [x] | ✅ VERIFIED | `git.service.ts:1-41`; `simple-git` was already at `^3.31.1` in `package.json` |
| Task 2: `get-repository-context.ts` tool module | [x] | ✅ VERIFIED | `get-repository-context.ts:1-93`; all sub-tasks confirmed (path default, Promise.all, error branches, ToolResult import) |
| Task 3: Register in `ForgeMCPServer` | [x] | ✅ VERIFIED | `server.ts:17-20` (imports), `server.ts:33` (ListTools), `server.ts:55-59` (CallTool switch) |
| Task 4: Tests + validate | [x] | ✅ VERIFIED | `git.service.test.ts` (7 tests), `get-repository-context.test.ts` (12 tests), `server.test.ts` updated (12 tests); 123 passing |

**Task Completion Summary: 4 of 4 completed tasks verified, 0 questionable, 0 false completions.**

---

### Test Coverage and Gaps

Tests are well-structured and cover all required paths:

| Area | Tests | Coverage |
|------|-------|----------|
| `GitService.getBranch()` | 2 (happy path + error propagation) | ✅ |
| `GitService.getStatus()` | 2 (with files + empty) | ✅ |
| `GitService.getFileTree()` | 3 (normal, truncation to 200, correct args) | ✅ |
| Tool definition metadata | 4 (name, required length, path property, description) | ✅ |
| Handler success path | 5 (shape, custom path, default cwd, empty string, whitespace) | ✅ |
| Handler error paths | 3 (non-git, ENOENT, unexpected error) | ✅ |
| Server dispatch | 3 (ListTools count, dispatch test, tool names) | ✅ |

**Gap noted (low priority):** No test for the `GitService` instantiation receiving the resolved path when `path` is whitespace-only. However, `get-repository-context.test.ts:107-111` covers the output shape in that case, and `git.service.test.ts:86-89` instantiates `new GitService('/repo')` directly. Coverage is sufficient for the story's AC.

---

### Architectural Alignment

The implementation respects the architectural layering from the tech spec:

- **Service layer** (`git.service.ts`): Pure `simple-git` wrapper, no MCP SDK imports. Errors propagate to caller. ✅
- **Tool layer** (`get-repository-context.ts`): Uses service via constructor instantiation per call; handles all error cases; returns `ToolResult` type from `src/mcp/types.ts`. ✅
- **Server layer** (`server.ts`): Tool registered in `ListToolsRequestSchema` and dispatched in `CallToolRequestSchema`. `Promise<any>` workaround for Zod v3/v4 SDK incompatibility is documented and contained. ✅
- **No cross-boundary violations.** Domain stays clean.

Minor note: The tech spec (`tech-spec-epic-6-mcp-server.md:66`) describes `getFileTree(path?)` as a method parameter, while the implementation correctly uses `constructor(repoPath)` per the dev notes design. The constructor pattern is idiomatic and matches the detailed dev notes spec — not a finding.

---

### Security Notes

No security concerns. The `config` parameter (which carries auth tokens) is correctly not used in this tool. No token logging. The tool reads from the local filesystem via `simple-git` only — no network calls. Error messages returned in `isError` responses don't leak sensitive information.

---

### Best Practices and References

- `simple-git` v3 API (`branchLocal()`, `status().not_added`) is used correctly. [Docs](https://github.com/steveukx/git-js)
- `Promise.all` for parallel git calls is the correct pattern — fail-fast behavior is what's needed (one failure = non-git dir).
- vitest constructor mock pattern (`vi.fn(function(this) {...})`) is well-documented in the completion notes for future stories.

---

### Action Items

**Code Changes Required:** None.

**Advisory Notes:**
- Note: Remove redundant `lower.includes('not a git repository')` in `isNonGitError` (`get-repository-context.ts:31`) at next convenient refactor — it's unreachable since `lower.includes('not a git')` already catches it.
- Note: The `Promise<any>` annotation on the `CallToolRequestSchema` handler in `server.ts` is a tracked follow-up in the tech spec (Post-Review Follow-ups section). Address when upgrading to MCP SDK with Zod v4 compatibility.
