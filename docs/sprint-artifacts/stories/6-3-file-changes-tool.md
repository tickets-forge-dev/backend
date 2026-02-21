# Story 6.3: File Changes MCP Tool

Status: done

## Story

As a developer using Claude Code,
I want the `get_file_changes` MCP tool to be available via the Forge MCP server,
so that Claude can quickly retrieve the precise list of files to create, modify, or delete for a ticket without having to parse the entire ticket context.

## Acceptance Criteria

1. `get_file_changes` appears in `tools/list` response with name `"get_file_changes"`, a meaningful description, and input schema `{ ticketId: string }` (required).
2. `get_file_changes({ ticketId })` fetches the ticket via `GET /tickets/:id` and returns `{ content: [{ type: 'text', text: JSON.stringify(fileChanges) }] }` where `fileChanges` is the `FileChange[]` array from the ticket.
3. When the ticket has no `fileChanges` field (undefined) or an empty array, the tool returns `{ content: [{ type: 'text', text: '[]' }] }` — this is NOT an error.
4. When the API returns 404 (ticket not found), the tool returns `{ content: [{ type: 'text', text: 'Ticket not found: <id>' }], isError: true }` — the server does NOT crash.
5. When the backend is unreachable, the tool returns `{ content: [{ type: 'text', text: '<error message>' }], isError: true }` — the server does NOT crash.
6. `TextContent` and `ToolResult` interfaces are extracted from `get-ticket-context.ts` into `src/mcp/types.ts`; both tool modules import from this shared file.
7. `ForgeMCPServer` now registers `get_file_changes` in ListTools (2 tools total) and dispatches it in the CallTool handler.
8. `npm run typecheck` → 0 errors across all new and modified files.
9. Unit tests cover: success with fileChanges populated, success with undefined/empty fileChanges, 404 error, network error, missing/empty ticketId. Total tests ≥ 99 (11+ new over 88 baseline).

## Tasks / Subtasks

- [x] Task 1: Extract shared MCP types to `src/mcp/types.ts` (AC: 6)
  - [x] Create `src/mcp/types.ts` — export `TextContent` and `ToolResult` interfaces
  - [x] Update `src/mcp/tools/get-ticket-context.ts` — remove local definitions; import from `'../types.js'`
  - [x] Run `npm run typecheck` → 0 errors after refactor
  - [x] Run `npm test` → 88 tests passing, 0 regressions

- [x] Task 2: Implement `get-file-changes.ts` tool module (AC: 1, 2, 3, 4, 5)
  - [x] Create `src/mcp/tools/get-file-changes.ts`
  - [x] Export `getFileChangesToolDefinition` with name, description, inputSchema
  - [x] Export `handleGetFileChanges(args: Record<string, unknown>, config: ForgeConfig): Promise<ToolResult>`
  - [x] Validate `ticketId` is non-empty string; return error content if missing/whitespace
  - [x] Call `ApiService.get<TicketDetail>('/tickets/${ticketId.trim()}', config)` in try/catch
  - [x] On success: return `{ content: [{ type: 'text', text: JSON.stringify(ticket.fileChanges ?? []) }] }`
  - [x] On 404: return `{ content: [{ type: 'text', text: 'Ticket not found: ${ticketId}' }], isError: true }`
  - [x] On any other error: return `{ content: [{ type: 'text', text: error.message }], isError: true }`

- [x] Task 3: Register tool in `ForgeMCPServer` (AC: 1, 7)
  - [x] Import `getFileChangesToolDefinition` and `handleGetFileChanges` from `'./tools/get-file-changes.js'`
  - [x] Add `getFileChangesToolDefinition` to ListTools array (now 2 tools)
  - [x] Add `case 'get_file_changes':` to CallTool switch dispatch

- [x] Task 4: Write tests + validate (AC: 8, 9)
  - [x] Create `src/mcp/tools/__tests__/get-file-changes.test.ts` (14 tests)
  - [x] Update `src/mcp/__tests__/server.test.ts` — 2 tools in ListTools, get_file_changes dispatch test
  - [x] Run `npm run typecheck` → 0 errors
  - [x] Run `npm test` → 103 passed (15 net new over 88 baseline), 0 regressions

## Dev Notes

### Shared MCP Types Pattern (New in This Story)

The code review for Story 6-2 flagged that `TextContent` and `ToolResult` are defined locally in `get-ticket-context.ts`. This story introduces `src/mcp/types.ts` as the shared home for all MCP protocol types:

```typescript
// src/mcp/types.ts
export interface TextContent {
  type: 'text';
  text: string;
}

export interface ToolResult {
  content: TextContent[];
  isError?: boolean;
}
```

Both `get-ticket-context.ts` and `get-file-changes.ts` (and all future tool modules) import from `'../types.js'`.

### Tool Module Pattern (Established in Story 6-2)

Each tool module exports:
- `toolDefinition` — JSON schema descriptor for ListTools
- `handler` — async function for CallTool dispatch

```typescript
// Signature to follow
export async function handleGetFileChanges(
  args: Record<string, unknown>,
  config: ForgeConfig
): Promise<ToolResult>
```

`args` is typed as `Record<string, unknown>` — NOT `{ ticketId?: string }` — because that's what the SDK passes from the `CallToolRequestSchema` handler. Extract and validate ticketId inside the function.

### Tool Output Contract

```typescript
// Success (ticket has fileChanges)
{ content: [{ type: 'text', text: '[{"path":"src/auth.ts","action":"modify","notes":"..."}]' }] }

// Success (ticket has no fileChanges or empty array)
{ content: [{ type: 'text', text: '[]' }] }

// Error
{ content: [{ type: 'text', text: 'Ticket not found: T-999' }], isError: true }
```

The key difference from `get_ticket_context`: this tool returns ONLY the `fileChanges[]` array — not the full ticket. Claude uses this for a quick "what files do I need to touch?" query.

### ApiService.get() Error Behavior

From `src/services/api.service.ts`:
- 404 → throws `"API error 404: Not Found"` (check `"404"` in message)
- Network failure → throws `"Cannot reach Forge server..."`
- 401 after refresh fail → throws `"Session expired..."`

### ForgeMCPServer CallTool Handler

The `CallToolRequestSchema` handler has `Promise<any>` return type (Zod v4/v3 SDK incompatibility workaround — established in Story 6-2). No change needed to this annotation:

```typescript
// server.ts — add after the get_ticket_context case:
case 'get_file_changes':
  return handleGetFileChanges(args as Record<string, unknown>, this.config);
```

### Test Mock Pattern (Established in Story 6-2)

```typescript
vi.mock('../../../services/api.service', () => ({
  get: vi.fn(),
}));
import { get } from '../../../services/api.service';

// In tests:
vi.mocked(get).mockResolvedValue(mockTicket);        // success
vi.mocked(get).mockRejectedValue(new Error('...'));  // error
```

`mockTicket` for this tool should use `TicketDetail` with a populated `fileChanges` array.

### Server Test Update Pattern

```typescript
// server.test.ts — ListTools handler now returns 2 tools
const handler = vi.mocked(instance.setRequestHandler).mock.calls[0][1];
const result = await handler({});
expect(result.tools).toHaveLength(2);
expect(result.tools.map(t => t.name)).toContain('get_file_changes');
```

The mock for `get-file-changes.js` follows the same pattern as the existing `get-ticket-context.js` mock.

### Project Structure Notes

- `src/mcp/types.ts` — new shared types file (NEW)
- `src/mcp/tools/get-file-changes.ts` — new tool module (NEW)
- `src/mcp/tools/__tests__/get-file-changes.test.ts` — new tests (NEW)
- `src/mcp/tools/get-ticket-context.ts` — refactor local types → import from `../types.js` (MODIFIED)
- `src/mcp/server.ts` — add import + tool registration (MODIFIED)
- `src/mcp/__tests__/server.test.ts` — update ListTools assertion, add get_file_changes mock + test (MODIFIED)

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-6-mcp-server.md#Detailed-Design] — `get_file_changes` tool spec
- [Source: docs/sprint-artifacts/tech-spec-epic-6-mcp-server.md#Data-Models-and-Contracts] — `FileChange[]` output shape
- [Source: docs/sprint-artifacts/tech-spec-epic-6-mcp-server.md#Post-Review-Follow-ups] — Advisory: extract to `src/mcp/types.ts` before Story 6-3
- [Source: forge-cli/src/mcp/server.ts] — ForgeMCPServer; add to ListTools array and CallTool switch
- [Source: forge-cli/src/mcp/tools/get-ticket-context.ts] — Tool module pattern to follow; refactor types out
- [Source: forge-cli/src/types/ticket.ts] — `FileChange` interface, `TicketDetail` type

### Learnings from Previous Story

**From Story 6-2-ticket-context-tool (Status: done)**

- **Shared Type Extraction Pending**: `TextContent` and `ToolResult` are currently defined locally in `get-ticket-context.ts`. Task 1 of THIS story must extract them to `src/mcp/types.ts` first — this is a prerequisite to avoid duplication.
- **args Type**: Always use `args: Record<string, unknown>` in handler signatures — the MCP SDK passes arguments as an untyped map.
- **SDK Zod Workaround**: `CallToolRequestSchema` handler in `server.ts` has `Promise<any>` return type annotation. Do NOT remove — it's load-bearing for TypeScript compilation with MCP SDK v1.26.0 + Zod v3.
- **Tool Definition Shape**: inputSchema requires `type: 'object' as const` (const assertion on the string literal).
- **Import paths**: Always use `.js` extension in imports (e.g., `'../types.js'`, `'./tools/get-file-changes.js'`).
- **Test baseline**: 88 tests, 0 typecheck errors — must not regress after type refactor in Task 1.

[Source: stories/6-2-ticket-context-tool.md#Dev-Agent-Record]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- All 9 ACs satisfied. 103 tests passing (15 net new: 14 in get-file-changes.test.ts, +1 in server.test.ts for get_file_changes dispatch).
- Task 1 (type extraction) was a pure refactor — 0 behavior changes, 88 tests still passed after.
- `ticket.fileChanges ?? []` handles both undefined and empty array cleanly — no special case needed.
- `get-file-changes.ts` follows identical structure to `get-ticket-context.ts` — same arg validation, same error handling, same import paths.
- Server test mock for `get-file-changes.js` follows exact pattern of `get-ticket-context.js` mock.

### File List

- `forge-cli/src/mcp/types.ts` — new shared MCP types file (TextContent, ToolResult)
- `forge-cli/src/mcp/tools/get-ticket-context.ts` — removed local type defs; now imports from `../types.js`
- `forge-cli/src/mcp/tools/get-file-changes.ts` — new tool module (definition + handler)
- `forge-cli/src/mcp/server.ts` — added get-file-changes import + ListTools entry + CallTool case
- `forge-cli/src/mcp/__tests__/server.test.ts` — updated ListTools assertion (2 tools), added get_file_changes mock + dispatch test
- `forge-cli/src/mcp/tools/__tests__/get-file-changes.test.ts` — new: 14 tests for tool module

## Senior Developer Review (AI)

- **Reviewer:** BMad
- **Date:** 2026-02-20
- **Outcome:** APPROVE

### Summary

Story 6-3 cleanly delivers the `get_file_changes` MCP tool and the shared types extraction. All 9 ACs satisfied with evidence. All 16 tasks verified complete. 103 tests passing (15 net new). 0 typecheck errors. No significant findings — the story is a textbook execution of the established tool module pattern.

### Key Findings

**HIGH:** None.

**MEDIUM:** None.

**LOW:**
- Both tool modules import only `ToolResult` from `src/mcp/types.ts`, relying on TypeScript to infer `TextContent` through the `ToolResult` definition. This works correctly and is consistent across both files — no action required, but future tool authors should be aware they can import `TextContent` explicitly if they need to reference it by name.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC1 | `get_file_changes` in tools/list with name, description, required ticketId | **IMPLEMENTED** | `get-file-changes.ts:7-19`; `server.ts:25`; `server.test.ts:79-86` |
| AC2 | Fetches ticket, returns `JSON.stringify(fileChanges)` | **IMPLEMENTED** | `get-file-changes.ts:50-53`; `get-file-changes.test.ts:68-91` |
| AC3 | undefined/empty fileChanges → `'[]'`, not error | **IMPLEMENTED** | `get-file-changes.ts:52` (`?? []`); `get-file-changes.test.ts:93-110` |
| AC4 | 404 → isError with "Ticket not found: <id>" | **IMPLEMENTED** | `get-file-changes.ts:57-61`; `get-file-changes.test.ts:116-124` |
| AC5 | Network error → isError, no crash | **IMPLEMENTED** | `get-file-changes.ts:63-66`; `get-file-changes.test.ts:126-133` |
| AC6 | Shared types in `src/mcp/types.ts`, both tools import from it | **IMPLEMENTED** | `types.ts:1-11`; `get-ticket-context.ts:4`; `get-file-changes.ts:4` |
| AC7 | ForgeMCPServer: 2 tools in ListTools, get_file_changes in CallTool | **IMPLEMENTED** | `server.ts:25`, `server.ts:42-46`; `server.test.ts:88-99` |
| AC8 | `npm run typecheck` → 0 errors | **IMPLEMENTED** | Confirmed: exit 0 |
| AC9 | ≥ 99 tests (11+ new) | **IMPLEMENTED** | 103 tests passing (15 net new) |

**AC Coverage: 9 of 9 acceptance criteria fully implemented.**

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|---------|
| Task 1: Extract shared types | [x] | VERIFIED | `types.ts` exists; `get-ticket-context.ts:4` imports; 88 tests still passed post-refactor |
| Task 2: Implement `get-file-changes.ts` | [x] | VERIFIED | `get-file-changes.ts:1-67` — all paths implemented |
| Task 3: Register in ForgeMCPServer | [x] | VERIFIED | `server.ts:9-12, 25, 42-46` |
| Task 4: Tests + validate | [x] | VERIFIED | 14 new tests; server.test.ts updated; 103/103 passing |

**Task Completion: 16 of 16 completed tasks verified. 0 questionable. 0 falsely marked complete.**

### Test Coverage and Gaps

- Tool definition: 3 tests (name, required field, description) ✓
- Success with populated fileChanges: shape + API call args + ticketId trim ✓
- Success with undefined fileChanges: returns `'[]'` ✓
- Success with empty fileChanges array: returns `'[]'` ✓
- Error paths: 404, network, unexpected, missing/empty/whitespace ticketId ✓
- Server dispatch: get_file_changes routes correctly ✓
- No gaps.

### Architectural Alignment

- Shared types extraction follows the advisory from Story 6-2 code review ✓
- Tool module pattern is consistent with `get-ticket-context.ts` ✓
- No cross-boundary violations — tool only calls ApiService ✓
- `ticket.fileChanges ?? []` correctly handles optional field from `TicketDetail` ✓

### Security Notes

- No credentials in any output ✓
- ticketId validated + trimmed before URL construction ✓
- Error messages contain only what ApiService throws — no internal details exposed ✓

### Best-Practices and References

- MCP tool output shapes: https://modelcontextprotocol.io/docs/concepts/tools
- Nullish coalescing for optional arrays: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing

### Action Items

**Code Changes Required:**
None.

**Advisory Notes:**
- Note: Consider explicitly importing `TextContent` in tool modules when needing to reference it by name (e.g., for type assertions). Current implicit inference via `ToolResult` is valid but less discoverable.

## Change Log

| Date | Change |
|------|--------|
| 2026-02-20 | Story implemented — all tasks complete |
| 2026-02-20 | Senior Developer Review notes appended — APPROVE |
