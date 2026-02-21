# Story 6.5: Status Update MCP Tool

Status: done

## Story

As a developer using Claude Code,
I want the `update_ticket_status` MCP tool to be available via the Forge MCP server,
so that Claude can mark a ticket as `CREATED` (or another valid status) after implementation without me leaving the editor.

## Acceptance Criteria

1. `update_ticket_status` appears in `tools/list` with name `"update_ticket_status"`, a meaningful description, and input schema where both `ticketId` and `status` are required strings.
2. `update_ticket_status({ ticketId: 'T-001', status: 'CREATED' })` calls `PATCH /tickets/T-001` with body `{ status: 'CREATED' }` and returns `{ content: [{ type: 'text', text: JSON.stringify({ success: true, ticketId: 'T-001', newStatus: 'CREATED' }) }] }`.
3. `ApiService.patch<T>(path, body, config)` is implemented in `api.service.ts` following the same auth/retry pattern as `get<T>()`: network error → "Cannot reach Forge server" message; 401 → refresh → retry once; 5xx → retry once after 2s; double 401 → "Session expired" message.
4. `update_ticket_status` validates inputs: missing/empty `ticketId` → `{ isError: true, content: [{ type: 'text', text: 'Missing required argument: ticketId' }] }`; `status` not a valid `AECStatus` value → `{ isError: true, content: [{ type: 'text', text: 'Invalid status: <value>. Must be one of: ...' }] }`.
5. When backend returns 404 → `{ isError: true, content: [{ type: 'text', text: 'Ticket not found: T-001' }] }`. When backend returns 401 after token refresh → auth error message.
6. `ForgeMCPServer` registers 4 tools in `ListToolsRequestSchema` handler.
7. `forge execute <ticketId>`: the `// TODO(6-5)` at `execute.ts:61` is implemented — after status validation, calls `ApiService.patch('/tickets/${ticketId}', { assignedTo: config.userId }, config)` to auto-assign. On failure, prints a dim warning and continues (does not exit 1).
8. `npm run typecheck` → 0 errors across all new and modified files.
9. Unit tests cover: `ApiService.patch()` auth/retry paths; `update_ticket_status` success, input validation errors, 404, 401; server ListTools count (4); execute auto-assign call. Total tests ≥ 137 (14+ new over 123 baseline).

## Tasks / Subtasks

- [x] Task 1: Extend `ApiService` with `patch<T>()` method (AC: 3)
  - [x] Refactor `makeRequest` in `api.service.ts` to accept optional `{ method?: string; body?: string }` — backward-compatible (defaults to `GET`, no body)
  - [x] Implement `export async function patch<T>(path, body, config): Promise<T>` following the exact same 401-refresh-retry + 5xx-retry + network-error pattern as `get<T>()`
  - [x] `patch()` passes `{ method: 'PATCH', body: JSON.stringify(body) }` to `makeRequest`

- [x] Task 2: Implement `update-ticket-status.ts` tool module (AC: 1, 2, 4, 5)
  - [x] Create `src/mcp/tools/update-ticket-status.ts`
  - [x] Export `updateTicketStatusToolDefinition`: name `'update_ticket_status'`, description, inputSchema with required `ticketId: string` and `status: string`
  - [x] Export `handleUpdateTicketStatus(args: Record<string, unknown>, config: ForgeConfig): Promise<ToolResult>`
  - [x] Validate `ticketId`: missing/empty → `{ isError: true, content: [{ type: 'text', text: 'Missing required argument: ticketId' }] }`
  - [x] Validate `status`: check `Object.values(AECStatus).includes(status)`; invalid → structured error
  - [x] Call `ApiService.patch<TicketDetail>('/tickets/${ticketId}', { status }, config)`
  - [x] On success: return `{ content: [{ type: 'text', text: JSON.stringify({ success: true, ticketId, newStatus: result.status }) }] }`
  - [x] On 404: return `{ isError: true, content: [{ type: 'text', text: 'Ticket not found: ${ticketId}' }] }`
  - [x] On other error: return `{ isError: true, content: [{ type: 'text', text: message }] }`
  - [x] Import `ToolResult` from `'../types.js'`; import `AECStatus`, `TicketDetail` from `'../../types/ticket.js'`

- [x] Task 3: Register tool in `ForgeMCPServer` (AC: 1, 6)
  - [x] Import `updateTicketStatusToolDefinition` and `handleUpdateTicketStatus` from `'./tools/update-ticket-status.js'`
  - [x] Add `updateTicketStatusToolDefinition` to the `ListToolsRequestSchema` array (now 4 tools)
  - [x] Add `case 'update_ticket_status':` to the `CallToolRequestSchema` switch dispatch

- [x] Task 4: Implement auto-assign in `execute.ts` (AC: 7)
  - [x] Replaced `// TODO(6-5): auto-assign via ApiService.patch` at `execute.ts:61` with try/catch patch call
  - [x] Failure is non-fatal — prints dim warning and continues

- [x] Task 5: Write tests + validate (AC: 8, 9)
  - [x] Updated `src/services/__tests__/api.service.test.ts` (5 new patch tests)
  - [x] Created `src/mcp/tools/__tests__/update-ticket-status.test.ts` (12 tests)
  - [x] Updated `src/mcp/__tests__/server.test.ts` (4 tools, dispatch test)
  - [x] Updated `src/commands/__tests__/execute.test.ts` (auto-assign + failure tests)
  - [x] Run `npm run typecheck` → 0 errors
  - [x] Run `npm test` → 145 tests passing (22 new over 123 baseline), 0 regressions

## Dev Notes

### `ApiService.patch()` Design

Extend `makeRequest` minimally — add optional third argument so `get()` callers are unaffected:

```typescript
// api.service.ts — refactored makeRequest
async function makeRequest(
  url: string,
  accessToken: string,
  options?: { method?: string; body?: string }
): Promise<Response> {
  return fetch(url, {
    method: options?.method ?? 'GET',
    body: options?.body,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
}
```

`patch<T>()` follows the exact same retry/refresh structure as `get<T>()`. Duplicate the flow — do not abstract prematurely. Only difference is `options: { method: 'PATCH', body: JSON.stringify(body) }` passed to every `makeRequest` call.

```typescript
export async function patch<T>(
  path: string,
  body: Record<string, unknown>,
  config: ForgeConfig,
): Promise<T> {
  const url = buildUrl(path);
  const serializedBody = JSON.stringify(body);
  // ... same 401/5xx/network handling as get(), with options: { method: 'PATCH', body: serializedBody }
}
```

### Tool Handler: Status Validation

Use `Object.values(AECStatus)` to check if the provided status string is valid. Do NOT use Zod here — keep it consistent with other tools in the codebase.

```typescript
const validStatuses = Object.values(AECStatus);
if (!validStatuses.includes(status as AECStatus)) {
  return {
    content: [{
      type: 'text',
      text: `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`,
    }],
    isError: true,
  };
}
```

### Backend PATCH Response

Backend `PATCH /tickets/:id` returns the **full updated `TicketDetail` object**. Extract `newStatus` from `result.status`:

```typescript
const result = await ApiService.patch<TicketDetail>(`/tickets/${ticketId.trim()}`, { status }, config);
return {
  content: [{
    type: 'text',
    text: JSON.stringify({ success: true, ticketId: ticketId.trim(), newStatus: result.status }),
  }],
};
```

### Auto-Assign in `execute.ts`

Replace `// TODO(6-5): auto-assign via ApiService.patch` at line 61. Auto-assign is best-effort — a failure (network issue, backend down) should not prevent the execute session from starting:

```typescript
// After status validation, before DIVIDER print
try {
  await ApiService.patch(`/tickets/${ticketId}`, { assignedTo: config!.userId }, config!);
} catch {
  process.stderr.write(chalk.dim('  Warning: Could not auto-assign ticket.\n'));
}
```

`config.userId` is guaranteed non-null at this point (guard is `isLoggedIn(config)` above).

### Tool Result Shape: UpdateStatusResult

```typescript
interface UpdateStatusResult {
  success: true;
  ticketId: string;
  newStatus: AECStatus;
}
```

This is returned as `JSON.stringify(result)` inside `content[0].text` — consistent with all other tools.

### Mocking `ApiService.patch` in Tests

```typescript
const mockPatch = vi.fn();
vi.mock('../../../services/api.service', () => ({
  patch: mockPatch,
}));
```

In `beforeEach`: `mockPatch.mockResolvedValue({ id: 'T-001', status: AECStatus.CREATED, ... })`.

For `api.service.test.ts`, use the same `vi.mock('node-fetch')` or `globalThis.fetch` approach as the existing `get()` tests.

### Project Structure Notes

- `src/services/api.service.ts` — modified (add `patch<T>()`, refactor `makeRequest`)
- `src/mcp/tools/update-ticket-status.ts` — new tool module
- `src/mcp/server.ts` — updated (4 tools)
- `src/commands/execute.ts` — updated (auto-assign implemented)

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-6-mcp-server.md#Detailed-Design] — `update_ticket_status` tool spec, `ApiService.patch()` signature
- [Source: docs/sprint-artifacts/tech-spec-epic-6-mcp-server.md#Data-Models-and-Contracts] — `UpdateStatusResult` interface, `UpdateTicketStatusInput` schema
- [Source: forge-cli/src/services/api.service.ts] — `get<T>()` pattern to replicate in `patch<T>()`
- [Source: forge-cli/src/commands/execute.ts:61] — `// TODO(6-5)` auto-assign placeholder
- [Source: forge-cli/src/types/ticket.ts] — `AECStatus` enum values, `TicketDetail` type
- [Source: forge-cli/src/mcp/types.ts] — `ToolResult` type (import from here)
- [Source: docs/sprint-artifacts/stories/6-1-mcp-server-setup.md#Senior-Developer-Review-(AI)#Action-Items] — "Story 6-5 must implement auto-assign"

### Learnings from Previous Story

**From Story 6-4-repository-context-tool (Status: done)**

- **Shared types**: Import `ToolResult` from `'../types.js'` — do NOT define locally
- **vitest constructor mocks**: Classes used with `new` MUST use `vi.fn(function(this) {...})` NOT arrow functions
- **Error handling pattern**: `isError: true` on the returned `ToolResult` object (not thrown)
- **args type**: Always `args: Record<string, unknown>` in handler signature
- **Import paths**: `.js` extension required for ESM (e.g., `'../types.js'`, `'../../types/ticket.js'`)
- **Test baseline**: 123 tests, 0 typecheck errors
- **Server test pattern**: Mock new tool module before imports; update ListTools assertion count (now 4); add dispatch test
- **`Promise<any>` annotation on CallToolRequestSchema handler in `server.ts`**: Do NOT remove — Zod v3/v4 workaround, tracked for future SDK upgrade

[Source: stories/6-4-repository-context-tool.md#Dev-Agent-Record]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- vitest v4 hoisting: `vi.mock()` factory cannot reference outer `const mockX = vi.fn()` variables reliably. Fix: use `vi.fn()` directly in the factory, then access via `vi.mocked(importedFn)` in tests. This pattern is now standard for all new tool tests.
- `makeRequest` was refactored with an optional 3rd arg `{ method?, body? }` — fully backward-compatible; `get()` callers unaffected.
- `patch()` duplicates the retry/refresh flow from `get()` — intentional, avoids premature abstraction.
- `update-ticket-status.ts` uses `Object.values(AECStatus)` for status validation — no Zod, consistent with other tools.
- Auto-assign in `execute.ts` is best-effort (try/catch, non-fatal) — correct behavior per story spec.

### File List

- `forge-cli/src/services/api.service.ts` — modified (refactored `makeRequest`, added `patch<T>()`)
- `forge-cli/src/mcp/tools/update-ticket-status.ts` — new
- `forge-cli/src/mcp/server.ts` — updated (4 tools registered)
- `forge-cli/src/commands/execute.ts` — updated (auto-assign implemented)
- `forge-cli/src/services/__tests__/api.service.test.ts` — updated (5 new patch tests, 14 total)
- `forge-cli/src/mcp/tools/__tests__/update-ticket-status.test.ts` — new (12 tests)
- `forge-cli/src/mcp/__tests__/server.test.ts` — updated (4 tools, 13 total)
- `forge-cli/src/commands/__tests__/execute.test.ts` — updated (auto-assign tests, 7 total)

## Senior Developer Review (AI)

**Reviewer:** claude-sonnet-4-6
**Date:** 2026-02-21
**Outcome:** APPROVE

### AC Validation

| AC | Status | Evidence |
|----|--------|----------|
| AC1 — Tool in ListTools (name, description, required schema) | ✅ PASS | `updateTicketStatusToolDefinition` in `update-ticket-status.ts`; `server.test.ts:120-125` verifies 4 tools + `'update_ticket_status'` |
| AC2 — Success path returns `{success, ticketId, newStatus}` | ✅ PASS | Handler returns `JSON.stringify({success:true,ticketId,newStatus:result.status})`; `update-ticket-status.test.ts:55-78` verifies shape and `patch` call args |
| AC3 — `ApiService.patch<T>()` with full 401/5xx/network retry | ✅ PASS | `api.service.ts`: `makeRequest` refactored with optional `{method?,body?}`; `patch<T>()` duplicates retry logic from `get<T>()`; 5 patch tests at lines 153-229 cover all paths |
| AC4 — Input validation (ticketId + status) | ✅ PASS | Validates missing/empty/whitespace ticketId and `Object.values(AECStatus)` status check; 5 validation tests |
| AC5 — 404 → "Ticket not found", 401 after refresh → auth error | ✅ PASS | `message.includes('404')` guard in handler; 3 error-path tests covering 404, auth, and network errors |
| AC6 — ForgeMCPServer registers 4 tools | ✅ PASS | `server.test.ts:120` asserts `toHaveLength(4)` |
| AC7 — Auto-assign in execute.ts (non-fatal) | ✅ PASS | `execute.ts:61-65` try/catch with `ApiService.patch`; `execute.test.ts` verifies call args and failure→continues |
| AC8 — `npm run typecheck` → 0 errors | ✅ PASS | Confirmed in completion notes |
| AC9 — ≥137 tests (14+ new) | ✅ PASS | 145 tests, 22 new over 123 baseline |

### Code Quality Notes

- `patch<T>()` correctly duplicates retry logic from `get<T>()` — intentional, avoids premature abstraction per spec; backward-compatible `makeRequest` refactor has no risk to existing `get()` callers.
- `Object.values(AECStatus)` for status validation is consistent with all other tools (no Zod).
- Auto-assign is correctly best-effort — try/catch with stderr dim warning, does not `exit(1)`.
- vitest v4 hoisting fix is properly applied: `vi.fn()` inline in factory, `vi.mocked()` access in tests. This is the right pattern and should be carried into all future tool tests.
- `Promise<any>` annotation on `CallToolRequestSchema` handler in `server.ts` correctly preserved (Zod v3/v4 workaround).

### Action Items

None — no changes required.
