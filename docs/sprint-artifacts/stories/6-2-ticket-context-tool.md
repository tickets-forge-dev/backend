# Story 6.2: Ticket Context MCP Tool

Status: done

## Story

As a developer using Claude Code,
I want the `get_ticket_context` MCP tool to be available via the Forge MCP server,
so that Claude can fetch the full ticket specification (problem, solution, ACs, file changes) directly during an execution session without me having to copy-paste anything.

## Acceptance Criteria

1. `get_ticket_context` appears in `tools/list` response with name `"get_ticket_context"`, a meaningful description, and input schema `{ ticketId: string }` (required).
2. `get_ticket_context({ ticketId })` calls `GET /tickets/:id` via `ApiService.get()` and returns an MCP text content block `{ content: [{ type: 'text', text: JSON.stringify(result) }] }` where `result` is a `TicketContextResult` containing all available ticket fields.
3. When the API returns 404 (ticket not found), the tool returns `{ content: [{ type: 'text', text: 'Ticket not found: <id>' }], isError: true }` — the MCP server does NOT crash or throw.
4. When the backend is unreachable (network error), the tool returns `{ content: [{ type: 'text', text: 'Cannot reach Forge server...' }], isError: true }` — the server does NOT crash.
5. Calling an unrecognized tool name via `CallToolRequestSchema` returns `{ content: [{ type: 'text', text: 'Unknown tool: <name>' }], isError: true }`.
6. `TicketDetail` in `src/types/ticket.ts` is extended with optional rich fields: `fileChanges?`, `problemStatement?`, `solution?`, `apiChanges?`, `testPlan?`, `designRefs?` to match what the backend returns for a full ticket.
7. `npm run typecheck` → 0 errors across all new and modified files.
8. Unit tests cover: success path (JSON shape), 404 error, network error, unknown tool dispatch. Total tests ≥ 82 (10+ new tests over the 72 baseline).

## Tasks / Subtasks

- [x] Task 1: Extend `TicketDetail` type (AC: 2, 6)
  - [x] Add optional fields to `TicketDetail` in `src/types/ticket.ts`: `fileChanges?: Array<{ path: string; action: 'create' | 'modify' | 'delete'; notes?: string }>`, `problemStatement?: string`, `solution?: string`, `apiChanges?: string`, `testPlan?: string`, `designRefs?: string[]`
  - [x] Add `TicketContextResult` type alias or interface (can be same shape or subset) to `src/types/ticket.ts` for use in tool return typing

- [x] Task 2: Implement `get-ticket-context.ts` tool module (AC: 1, 2, 3, 4)
  - [x] Create `src/mcp/tools/get-ticket-context.ts`
  - [x] Export `getTicketContextToolDefinition` object with name, description, and input schema
  - [x] Export `handleGetTicketContext(args, config)` function
  - [x] Validate `ticketId` is non-empty; return error content if missing
  - [x] Call `ApiService.get<TicketDetail>(`/tickets/${ticketId}`, config)` in a try/catch
  - [x] On success: return `{ content: [{ type: 'text', text: JSON.stringify(ticket) }] }`
  - [x] On 404: return `{ content: [{ type: 'text', text: 'Ticket not found: <id>' }], isError: true }`
  - [x] On any other error: return `{ content: [{ type: 'text', text: error.message }], isError: true }`

- [x] Task 3: Update `ForgeMCPServer` (AC: 1, 5)
  - [x] Import `CallToolRequestSchema` from `@modelcontextprotocol/sdk/types.js` in `src/mcp/server.ts`
  - [x] Import `getTicketContextToolDefinition` and `handleGetTicketContext` from `./tools/get-ticket-context.js`
  - [x] Update `ListToolsRequestSchema` handler to return `{ tools: [getTicketContextToolDefinition] }`
  - [x] Add `CallToolRequestSchema` handler with dispatch: `get_ticket_context` → `handleGetTicketContext(args, config)`, default → unknown tool error
  - [x] Config accessible via `this.config` inside handler

- [x] Task 4: Write tests + validate (AC: 7, 8)
  - [x] Create `src/mcp/tools/__tests__/get-ticket-context.test.ts` (13 tests)
  - [x] Update `src/mcp/__tests__/server.test.ts` — 3 handlers, CallTool dispatch, unknown tool
  - [x] `npm run typecheck` → 0 errors
  - [x] `npm test` → 88 passed (16 new over 72 baseline), 0 regressions

## Dev Notes

### MCP Tool Registration Pattern

Tools are registered in `ForgeMCPServer` constructor via two handlers:

```typescript
// 1. ListTools — returns tool definitions for Claude Code to discover
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [getTicketContextToolDefinition, /* future tools */],
}));

// 2. CallTool — dispatches to individual tool handlers
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  switch (name) {
    case 'get_ticket_context':
      return handleGetTicketContext(args as { ticketId?: string }, this.config);
    default:
      return {
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
        isError: true,
      };
  }
});
```

Each tool module exports:
- `toolDefinition` — the JSON schema descriptor for ListTools
- `handler` — the async function implementing the tool logic

### Tool Output Contract

```typescript
// Success
{
  content: [{ type: 'text', text: JSON.stringify(ticketContextResult) }]
}

// Error
{
  content: [{ type: 'text', text: 'Human-readable error message' }],
  isError: true
}
```

Return type: `CallToolResult` from `@modelcontextprotocol/sdk/types.js` (or compatible inline type).

### TicketDetail Type Extension

Current `TicketDetail` (src/types/ticket.ts):
```typescript
interface TicketDetail extends TicketListItem {
  description?: string;
  acceptanceCriteria: string[];
  createdAt: string;
  updatedAt: string;
}
```

Add optional rich fields the backend returns for full ticket view:
```typescript
  fileChanges?: Array<{ path: string; action: 'create' | 'modify' | 'delete'; notes?: string }>;
  problemStatement?: string;
  solution?: string;
  apiChanges?: string;
  testPlan?: string;
  designRefs?: string[];
```

`TicketContextResult` can be defined as `TicketDetail` (they are the same shape after extension) or as a pick/type alias. Keep it simple — don't create a separate interface unless the shapes diverge.

### ApiService.get() Error Behavior

From `src/services/api.service.ts`:
- 404 → throws `"API error 404: Not Found"` (check for `"404"` in message)
- Network failure → throws `"Cannot reach Forge server..."`
- 401 after refresh fail → throws `"Session expired..."`
- 5xx → throws `"Forge server error (5xx)..."`

The tool handler must catch ALL errors and return `isError: true` content — never propagate.

### SDK Import Path for CallToolRequestSchema

```typescript
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
```

This is the same pattern as `ListToolsRequestSchema` already in `server.ts`.

### Test Pattern (constructor mock)

`server.test.ts` currently mocks `setRequestHandler` and counts calls (expects 2: ListTools + ListPrompts). After this story, it expects **3** calls (ListTools + ListPrompts + CallTool). Update the existing assertion:

```typescript
// Before (story 6-1): 2 handlers
expect(instance.setRequestHandler).toHaveBeenCalledTimes(2);

// After (story 6-2): 3 handlers
expect(instance.setRequestHandler).toHaveBeenCalledTimes(3);
```

For the tool tests, mock pattern from execute.test.ts:
```typescript
vi.mock('../../services/api.service', () => ({
  get: vi.fn(),
}));
```

### Project Structure Notes

- `src/mcp/tools/.gitkeep` → replace by creating real `get-ticket-context.ts` in same dir
- `src/mcp/tools/__tests__/` → create new directory for tool tests
- All imports use `.js` extension for ESM bundler compatibility (e.g., `'./tools/get-ticket-context.js'`)
- `tsconfig.json` `"moduleResolution": "bundler"` means TypeScript resolves without `.js` at compile time; tsup adds extensions in output

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-6-mcp-server.md#Detailed-Design] — `get_ticket_context` tool spec, TicketContextResult interface
- [Source: docs/sprint-artifacts/tech-spec-epic-6-mcp-server.md#Data-Models-and-Contracts] — Tool input schemas, output shapes
- [Source: docs/sprint-artifacts/tech-spec-epic-6-mcp-server.md#Reliability] — error handling requirements (never crash server)
- [Source: forge-cli/src/mcp/server.ts] — ForgeMCPServer constructor; update setRequestHandler calls from 2→3
- [Source: forge-cli/src/services/api.service.ts] — `get<T>(path, config)` signature and error messages
- [Source: forge-cli/src/types/ticket.ts] — TicketDetail (extend here)

### Learnings from Previous Story

**From Story 6-1-mcp-server-setup (Status: done)**

- **ForgeMCPServer** at `forge-cli/src/mcp/server.ts` — registers ListTools (empty) + ListPrompts. This story replaces the empty ListTools and adds CallTool handler. Config is stored as `this.config` in constructor.
- **MCP SDK import paths**: `@modelcontextprotocol/sdk/server/index.js`, `@modelcontextprotocol/sdk/server/stdio.js`, `@modelcontextprotocol/sdk/types.js` — all `.js` suffix required
- **Constructor mock pattern**: `vi.fn(function(this) {...})` for vitest when mocking classes used with `new`
- **Baseline**: 72 tests passing, 0 typecheck errors — must not regress
- **`src/mcp/tools/.gitkeep`** exists — safe to create `get-ticket-context.ts` alongside it (gitkeep just keeps dir tracked)
- **tsconfig**: `"module": "ESNext"` + `"moduleResolution": "bundler"` — required for SDK exports field
- **`ApiService.get<T>()`** signature: `(path: string, config: ForgeConfig, params?: Record<string, string>) => Promise<T>`
- **server.test.ts** asserts `setRequestHandler` called exactly 2 times — update to 3 in this story

[Source: stories/6-1-mcp-server-setup.md#Dev-Agent-Record]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- TypeScript error in `server.ts`: `Promise<ToolResult>` not assignable to SDK `setRequestHandler` expected type due to Zod v4/v3 incompatibility in MCP SDK v1.26.0. Fix: added explicit `Promise<any>` return type annotation on the `CallToolRequestSchema` handler. This is intentional — the protocol shape is correct; the type mismatch is an SDK internal Zod version boundary issue.

### Completion Notes List

- All 8 ACs satisfied. 88 tests passing (16 net new: 13 in get-ticket-context.test.ts, +3 in server.test.ts for CallTool dispatch).
- Local `TextContent` and `ToolResult` interfaces defined in `get-ticket-context.ts` instead of using SDK types — avoids Zod v3/v4 incompatibility.
- `FileChange` extracted as a named interface in `ticket.ts` (cleaner than inline array type).
- `TicketContextResult = TicketDetail` type alias — kept as simple alias since shapes are identical.
- `handleGetTicketContext` takes `args: Record<string, unknown>` (not `{ ticketId?: string }`) to match MCP `arguments` parameter type from SDK.

### File List

- `forge-cli/src/types/ticket.ts` — extended TicketDetail, added FileChange interface, TicketContextResult alias
- `forge-cli/src/mcp/tools/get-ticket-context.ts` — new tool module (tool definition + handler)
- `forge-cli/src/mcp/server.ts` — added CallToolRequestSchema handler + real ListTools with 1 tool
- `forge-cli/src/mcp/__tests__/server.test.ts` — updated: 3 handlers, CallTool dispatch tests
- `forge-cli/src/mcp/tools/__tests__/get-ticket-context.test.ts` — new: 13 tests for tool module

## Senior Developer Review (AI)

- **Reviewer:** BMad
- **Date:** 2026-02-20
- **Outcome:** APPROVE

### Summary

Story 6-2 delivers a clean, well-tested `get_ticket_context` MCP tool. All 8 acceptance criteria are fully satisfied, all 20 tasks/subtasks verified complete with file:line evidence. 88 tests passing (16 net new), 0 typecheck errors. The SDK/Zod v3/v4 type mismatch is handled pragmatically and correctly. Three LOW advisory notes below — none require code changes before merge.

### Key Findings

**HIGH:** None.

**MEDIUM:** None.

**LOW:**
- `ToolResult` and `TextContent` interfaces are defined locally in `get-ticket-context.ts`. When additional tools are added (Stories 6-3, 6-4, 6-5), these should be extracted to a shared `src/mcp/types.ts` to avoid duplication.
- `Promise<any>` on the `CallToolRequestSchema` handler (`server.ts:32`) is a valid workaround for SDK Zod v4/v3 type boundary. This should be revisited when upgrading `@modelcontextprotocol/sdk` or migrating the project to Zod v4.
- `args` cast `as Record<string, unknown>` in `server.ts:38` is correct for the current SDK dispatch shape; the cast can be removed if the SDK provides typed argument access in future versions.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC1 | `get_ticket_context` in tools/list with name, description, `{ ticketId: string }` required | **IMPLEMENTED** | `get-ticket-context.ts:6-19`; `server.ts:24-26`; `server.test.ts:82-85` |
| AC2 | `ApiService.get()` called; returns `{ content: [{ type:'text', text: JSON.stringify(result) }] }` | **IMPLEMENTED** | `get-ticket-context.ts:52-58`; test lines 58-79, 73-78 |
| AC3 | 404 → `{ content: [{ text: 'Ticket not found: <id>' }], isError: true }`, no crash | **IMPLEMENTED** | `get-ticket-context.ts:62-67`; test lines 102-111 |
| AC4 | Network error → isError: true with server error message, no crash | **IMPLEMENTED** | `get-ticket-context.ts:69-72`; test lines 113-122 |
| AC5 | Unknown tool → `{ content: [{ text: 'Unknown tool: <name>' }], isError: true }` | **IMPLEMENTED** | `server.ts:42-46`; `server.test.ts:117-128` |
| AC6 | `TicketDetail` extended with `fileChanges?`, `problemStatement?`, `solution?`, `apiChanges?`, `testPlan?`, `designRefs?` | **IMPLEMENTED** | `ticket.ts:28-50` |
| AC7 | `npm run typecheck` → 0 errors | **IMPLEMENTED** | Confirmed: exit 0 |
| AC8 | ≥ 82 tests; success, 404, network error, unknown tool covered | **IMPLEMENTED** | 88 tests passing; all error paths covered |

**AC Coverage: 8 of 8 acceptance criteria fully implemented.**

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|---------|
| Task 1: Extend TicketDetail type | [x] | VERIFIED | `ticket.ts:28-50` — FileChange interface, all optional fields, TicketContextResult alias |
| Task 2: Implement get-ticket-context.ts | [x] | VERIFIED | `get-ticket-context.ts:1-74` — all subtasks present: definition, handler, validation, API call, error paths |
| Task 3: Update ForgeMCPServer | [x] | VERIFIED | `server.ts:4-47` — CallToolRequestSchema imported/registered, ListTools returns 1 tool, dispatch works |
| Task 4: Write tests + validate | [x] | VERIFIED | `get-ticket-context.test.ts` (13 tests), `server.test.ts` (10 tests), typecheck clean, 88 total |

**Task Completion: 20 of 20 completed tasks verified. 0 questionable. 0 falsely marked complete.**

### Test Coverage and Gaps

- Tool definition: 3 tests (name, required field, description) ✓
- Success path: 4 tests (shape, API call args, rich fields, ticketId trim) ✓
- Error paths: 6 tests (404, network error, unexpected error, missing/empty/whitespace ticketId) ✓
- Server integration: 3 new tests (3 handlers registered, CallTool dispatch, unknown tool) ✓
- No gaps — all story-relevant branches exercised.

### Architectural Alignment

- Tool module is standalone with no cross-boundary imports (no NestJS, no Firestore) ✓
- `handleGetTicketContext` correctly uses `ApiService` (infrastructure adapter) via config injection ✓
- `ForgeMCPServer` remains the single registration point for all tools ✓
- Epic Tech Spec's `TicketContextResult` shape is satisfied; optional `fileChanges?` aligns with defensive typing for backend variability ✓

### Security Notes

- No credentials or tokens in any output path ✓
- ticketId validated before URL construction ✓
- Error messages expose only what the API returned — no internal stack traces surfaced ✓

### Best-Practices and References

- MCP SDK stdio transport pattern: https://modelcontextprotocol.io/docs/concepts/transports
- Zod v3 vs v4 breaking changes (relevant for future SDK upgrade): https://zod.dev/v4/changelog
- vitest mocking patterns for ESM: https://vitest.dev/guide/mocking

### Action Items

**Code Changes Required:**
None.

**Advisory Notes:**
- Note: Extract `ToolResult` and `TextContent` interfaces to `src/mcp/types.ts` when adding Story 6-3/6-4 tools to avoid duplication across tool modules.
- Note: Revisit `Promise<any>` on `CallToolRequestSchema` handler when upgrading `@modelcontextprotocol/sdk` or moving project to Zod v4.

## Change Log

| Date | Change |
|------|--------|
| 2026-02-20 | Story implemented — all tasks complete |
| 2026-02-20 | Senior Developer Review notes appended — APPROVE |
