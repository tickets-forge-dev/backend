# Story 6.6: Execute Prompt (forge_execute)

Status: done

## Story

As a developer using Claude Code,
I want the `forge_execute` MCP prompt to be available via the Forge MCP server,
so that Claude receives the full `dev-executor.md` persona and ticket XML context when I invoke the prompt, enabling precise, ticket-driven implementation.

## Acceptance Criteria

1. `forge_execute` appears in `prompts/list` with name `"forge_execute"`, a meaningful description, and an arguments schema requiring `ticketId` as a string.
2. `forge_execute({ ticketId: 'T-001' })` fetches the full ticket via `GET /tickets/T-001`, then returns `{ messages: [{ role: 'user', content: { type: 'text', text: '<agent_guide>...\n</agent_guide>\n<ticket_context>...\n</ticket_context>' } }] }` where the agent_guide section contains the full `dev-executor.md` content and the ticket_context section contains the ticket serialized as XML.
3. The ticket XML produced by `forge_execute` includes at minimum: `id`, `status`, `title`, `description`, `problemStatement`, `solution`, `acceptanceCriteria` (as `<item>` children), and `fileChanges` (as `<change path action>` children with notes).
4. Input validation: missing/empty `ticketId` → `{ isError: true, content: [{ type: 'text', text: 'Missing required argument: ticketId' }] }`. Backend 404 → `{ isError: true, content: [{ type: 'text', text: 'Ticket not found: T-001' }] }`. Auth/network error → `{ isError: true, content: [{ type: 'text', text: <message> }] }`.
5. `dev-executor.md` is ≤ 500 lines and contains four named sections: **Persona**, **Principles**, **Process**, and **Code Quality Rules**. It is stored at `src/agents/dev-executor.md` and bundled at build time via tsup's text loader.
6. `ForgeMCPServer` registers `forge_execute` in the `ListPromptsRequestSchema` handler (returns 1 prompt). A new `GetPromptRequestSchema` handler dispatches prompt calls by name to `handleForgeExecute`.
7. `npm run typecheck` → 0 errors across all new and modified files.
8. Unit tests cover: prompt definition (name, description, required args); success path (agent_guide present, ticket XML present, role='user'); input validation (missing/empty ticketId, 404, auth error, network error); server ListPrompts count (1); GetPrompt dispatch. Total tests ≥ 158 (13+ new over 145 baseline).

## Tasks / Subtasks

- [x] Task 1: Create `dev-executor.md` agent guide (AC: 5)
  - [x] Create `forge-cli/src/agents/dev-executor.md` with sections: Persona, Principles, Process, Code Quality Rules
  - [x] Ensure ≤ 500 lines (186 lines)
  - [x] Content should guide an AI implementation agent to: read the ticket XML, call `get_repository_context`, write code following the spec, call `update_ticket_status` when done

- [x] Task 2: Configure tsup to bundle markdown files (AC: 5)
  - [x] Update `forge-cli/tsup.config.ts`: add `loader: { '.md': 'text' }` option
  - [x] Create `forge-cli/src/types/markdown.d.ts`: `declare module '*.md' { const content: string; export default content; }`
  - [x] Create `forge-cli/vitest.config.ts` with inline `md-to-string` Vite plugin (mirrors tsup loader for test runner)

- [x] Task 3: Implement `forge-execute.ts` prompt module (AC: 1, 2, 3, 4)
  - [x] Created `forge-cli/src/mcp/prompts/forge-execute.ts`
  - [x] Import `devExecutorMd` from `'../../agents/dev-executor.md'` (text import via tsup loader)
  - [x] Export `forgeExecutePromptDefinition` with required `ticketId` argument
  - [x] Export `handleForgeExecute(args: Record<string, unknown>, config: ForgeConfig): Promise<PromptResult>`
  - [x] Validate `ticketId`: missing/empty/whitespace → isError response
  - [x] Fetch ticket: `ApiService.get<TicketDetail>('/tickets/${ticketId.trim()}', config)`
  - [x] On 404: return ticket-not-found error; other errors: return raw message
  - [x] Serialize ticket to XML using `serializeTicketXml()` + `escapeXml()` helpers (in same file)
  - [x] Return messages with agent_guide + ticket_context XML
  - [x] Added `PromptResult` and `PromptMessage` types to `src/mcp/types.ts`

- [x] Task 4: Register prompt in `ForgeMCPServer` (AC: 1, 6)
  - [x] Import `GetPromptRequestSchema` from `'@modelcontextprotocol/sdk/types.js'`
  - [x] Import `forgeExecutePromptDefinition` and `handleForgeExecute` from `'./prompts/forge-execute.js'`
  - [x] Update `ListPromptsRequestSchema` handler: return `{ prompts: [forgeExecutePromptDefinition] }`
  - [x] Add `GetPromptRequestSchema` handler with `forge_execute` dispatch + unknown prompt error
  - [x] Handler annotation: `Promise<any>` (same Zod v3/v4 workaround as CallToolRequestSchema)

- [x] Task 5: Write tests + validate (AC: 7, 8)
  - [x] Created `forge-cli/src/mcp/prompts/__tests__/forge-execute.test.ts` (16 tests)
  - [x] Updated `forge-cli/src/mcp/__tests__/server.test.ts`: mocked `forge-execute.js`; ListPrompts asserts `toHaveLength(1)`; added 3 GetPrompt tests; updated CallTool handler index 2→3
  - [x] Run `npm run typecheck` → 0 errors
  - [x] Run `npm test` → 164 tests passing (19 new over 145 baseline), 0 regressions

## Dev Notes

### Markdown Loading via tsup Loader

The `dev-executor.md` is stored as a source file and bundled inline at build time using tsup's text loader. This avoids runtime file path resolution and makes the prompt testable without filesystem mocks.

**tsup.config.ts update:**
```typescript
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  sourcemap: true,
  clean: true,
  dts: true,
  banner: { js: '#!/usr/bin/env node' },
  loader: { '.md': 'text' },  // Bundle .md files as string literals
});
```

**Type declaration (`src/types/markdown.d.ts`):**
```typescript
declare module '*.md' {
  const content: string;
  export default content;
}
```

**Import in prompt handler:**
```typescript
import devExecutorMd from '../../agents/dev-executor.md';
// At runtime, devExecutorMd is the full string content of the file
```

### `PromptResult` and `PromptMessage` Types

Add to `src/mcp/types.ts` (do NOT redefine locally in prompt modules):

```typescript
export interface PromptMessage {
  role: 'user' | 'assistant';
  content: TextContent;
}

export interface PromptResult {
  messages?: PromptMessage[];
  isError?: boolean;
  content?: TextContent[];
}
```

### Prompt Definition Shape

MCP prompts require an `arguments` array (not `inputSchema` like tools):

```typescript
export const forgeExecutePromptDefinition = {
  name: 'forge_execute',
  description: 'Load the Forge executor persona and ticket context for implementation',
  arguments: [
    {
      name: 'ticketId',
      description: 'The ticket ID to implement (e.g., T-001)',
      required: true,
    },
  ],
};
```

### Ticket XML Serialization

Simple template-literal XML — no library needed:

```typescript
function serializeTicketXml(ticket: TicketDetail): string {
  const acItems = (ticket.acceptanceCriteria ?? [])
    .map((ac) => `    <item>${escapeXml(ac)}</item>`)
    .join('\n');
  const fcItems = (ticket.fileChanges ?? [])
    .map((fc) => `    <change path="${escapeXml(fc.path)}" action="${escapeXml(fc.action)}">${fc.notes ? escapeXml(fc.notes) : ''}</change>`)
    .join('\n');

  return `<ticket id="${escapeXml(ticket.id)}" status="${ticket.status}">
  <title>${escapeXml(ticket.title)}</title>
  <description>${escapeXml(ticket.description ?? '')}</description>
  <problemStatement>${escapeXml(ticket.problemStatement ?? '')}</problemStatement>
  <solution>${escapeXml(ticket.solution ?? '')}</solution>
  <acceptanceCriteria>
${acItems}
  </acceptanceCriteria>
  <fileChanges>
${fcItems}
  </fileChanges>
</ticket>`;
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
```

### Handler Return Shape (Success)

```typescript
return {
  messages: [{
    role: 'user' as const,
    content: {
      type: 'text' as const,
      text: `<agent_guide>\n${devExecutorMd}\n</agent_guide>\n<ticket_context>\n${ticketXml}\n</ticket_context>`,
    },
  }],
};
```

### `GetPromptRequestSchema` in server.ts

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
this.server.setRequestHandler(GetPromptRequestSchema, async (request): Promise<any> => {
  const { name, arguments: args = {} } = request.params;
  switch (name) {
    case 'forge_execute':
      return handleForgeExecute(args as Record<string, unknown>, this.config);
    default:
      return {
        content: [{ type: 'text' as const, text: `Unknown prompt: ${name}` }],
        isError: true,
      };
  }
});
```

### Test Mocking Pattern for Markdown Import

Since `dev-executor.md` is bundled as a string, mock it in tests:

```typescript
vi.mock('../../agents/dev-executor.md', () => ({
  default: '# Dev Executor Agent\n## Persona\nYou are a Forge dev executor.',
}));
```

This avoids any filesystem dependency. Mock `ApiService.get` the same way as other tool tests:

```typescript
vi.mock('../../../services/api.service', () => ({
  get: vi.fn(),
}));
import { get } from '../../../services/api.service';
// In beforeEach: vi.mocked(get).mockResolvedValue(mockTicket)
```

### Server Test Updates

```typescript
vi.mock('../prompts/forge-execute.js', () => ({
  forgeExecutePromptDefinition: {
    name: 'forge_execute',
    description: 'Load executor persona',
    arguments: [{ name: 'ticketId', required: true }],
  },
  handleForgeExecute: vi.fn().mockResolvedValue({
    messages: [{ role: 'user', content: { type: 'text', text: '<agent_guide>...</agent_guide>' } }],
  }),
}));
```

Update `ListPromptsRequestSchema` handler test: `expect(result.prompts).toHaveLength(1)`.
Add GetPrompt dispatch test (handler index: 3 — after ListTools, ListPrompts, CallTool).

### `dev-executor.md` Content Structure

The agent guide should instruct Claude to:
1. Read the ticket XML from `<ticket_context>`
2. Call `get_repository_context` to understand the codebase
3. Call `get_ticket_context` if additional ticket detail is needed
4. Implement changes per acceptance criteria and `<fileChanges>`
5. Call `update_ticket_status({ ticketId, status: 'CREATED' })` when done

Sections (must be present per AC5):
- **Persona**: Who the agent is (a Forge-integrated implementation expert)
- **Principles**: Core rules (spec-driven, no scope creep, test-first, etc.)
- **Process**: Step-by-step workflow (read ticket → explore codebase → implement → update status)
- **Code Quality Rules**: Typing, error handling, testing standards

### Project Structure Notes

- `forge-cli/src/agents/dev-executor.md` — NEW (agent guide)
- `forge-cli/src/types/markdown.d.ts` — NEW (type declaration for `.md` imports)
- `forge-cli/tsup.config.ts` — MODIFIED (add `loader: { '.md': 'text' }`)
- `forge-cli/src/mcp/types.ts` — MODIFIED (add `PromptResult`, `PromptMessage`)
- `forge-cli/src/mcp/prompts/forge-execute.ts` — NEW
- `forge-cli/src/mcp/server.ts` — MODIFIED (1 prompt in ListPrompts, GetPromptRequestSchema handler)
- `forge-cli/src/mcp/prompts/__tests__/forge-execute.test.ts` — NEW (~12 tests)
- `forge-cli/src/mcp/__tests__/server.test.ts` — UPDATED

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-6-mcp-server.md#Detailed-Design] — `forge_execute` prompt spec, `dev-executor.md` content requirements
- [Source: docs/sprint-artifacts/tech-spec-epic-6-mcp-server.md#Data-Models-and-Contracts] — Prompt Output Contract (MCP PromptMessage shape)
- [Source: docs/sprint-artifacts/tech-spec-epic-6-mcp-server.md#Acceptance-Criteria] — AC7 (forge_execute), AC14 (dev-executor.md)
- [Source: forge-cli/src/mcp/server.ts] — Current ForgeMCPServer (ListPromptsRequestSchema returns empty array to update)
- [Source: forge-cli/src/mcp/types.ts] — ToolResult/TextContent types to extend
- [Source: forge-cli/tsup.config.ts] — Current build config to extend with loader

### Learnings from Previous Story

**From Story 6-5-status-update-tool (Status: done)**

- **vitest v4 hoisting**: `vi.fn()` inline in `vi.mock()` factory — NOT outer variable references. Access via `vi.mocked(importedFn)`. This is the standard pattern for ALL new tests.
- **Error handling pattern**: `isError: true` on the returned object; error message in `content[0].text`
- **args type**: Always `args: Record<string, unknown>` in handler signature
- **Import paths**: `.js` extension required for all local ESM imports (e.g., `'../types.js'`, `'../../agents/dev-executor.md'`)
- **`Promise<any>` annotation**: Do NOT remove from `CallToolRequestSchema` handler or the new `GetPromptRequestSchema` handler (Zod v3/v4 workaround)
- **Server test pattern**: Mock the new module BEFORE imports; add new handler index (GetPrompt = handler index 3)
- **Test baseline**: 145 tests, 0 typecheck errors

[Source: stories/6-5-status-update-tool.md#Dev-Agent-Record]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- vitest `md-to-string` Vite plugin required: tsup's `loader: { '.md': 'text' }` handles the build but vitest uses Vite for module transforms. Added `vitest.config.ts` with an inline plugin that exports `.md` file contents as JSON-stringified strings. This mirrors tsup's text loader behavior exactly.
- `vi.mock('../../agents/dev-executor.md', () => ({ default: '...' }))` — mock pattern for markdown imports in tests. The `default` key is critical (ESM default export).
- `GetPromptRequestSchema` handler uses handler index `[2]` in server tests (ListTools=0, ListPrompts=1, GetPrompt=2, CallTool=3). All CallTool dispatch tests updated to index `[3]`.
- `PromptResult` deliberately has both `messages?` and `content?` fields — error responses use `content` (same as `ToolResult`), success responses use `messages`. This allows the same type for both paths.
- `serializeTicketXml()` and `escapeXml()` are module-private helpers (not exported) — they are implementation details of the prompt handler.

### File List

- `forge-cli/src/agents/dev-executor.md` — NEW (186 lines, 4 required sections)
- `forge-cli/src/types/markdown.d.ts` — NEW (type declaration for .md text imports)
- `forge-cli/tsup.config.ts` — MODIFIED (added `loader: { '.md': 'text' }`)
- `forge-cli/vitest.config.ts` — NEW (md-to-string Vite plugin for test runner)
- `forge-cli/src/mcp/types.ts` — MODIFIED (added PromptMessage, PromptResult interfaces)
- `forge-cli/src/mcp/prompts/forge-execute.ts` — NEW
- `forge-cli/src/mcp/server.ts` — MODIFIED (GetPromptRequestSchema + forge_execute dispatch; ListPrompts returns 1 prompt)
- `forge-cli/src/mcp/prompts/__tests__/forge-execute.test.ts` — NEW (16 tests)
- `forge-cli/src/mcp/__tests__/server.test.ts` — UPDATED (4 handlers, GetPrompt dispatch tests, CallTool index 2→3)

---

## Senior Developer Review (AI)

**Reviewer:** claude-sonnet-4-6
**Date:** 2026-02-21
**Verdict:** APPROVE

### Systematic AC Validation

**AC1** — `forge_execute` appears in `prompts/list` with correct name, description, and required `ticketId` argument
- `forge-execute.ts:7-18` — `forgeExecutePromptDefinition` exports `name: 'forge_execute'`, non-empty description (95 chars), `arguments: [{ name: 'ticketId', required: true }]`
- `server.ts:45-47` — `ListPromptsRequestSchema` returns `{ prompts: [forgeExecutePromptDefinition] }`
- `server.test.ts:141-150` — test asserts `prompts.toHaveLength(1)` and `prompts[0].name === 'forge_execute'`
- **IMPLEMENTED** ✅

**AC2** — Success path fetches ticket via `GET /tickets/{id}`, returns correct `{ messages: [...] }` shape with `agent_guide` and `ticket_context` sections
- `forge-execute.ts:71-72` — `ApiService.get<TicketDetail>('/tickets/${ticketId}', config)`
- `forge-execute.ts:89-99` — returns `messages: [{ role: 'user', content: { type: 'text', text: '<agent_guide>\n...\n</agent_guide>\n<ticket_context>\n...\n</ticket_context>' } }]`
- `forge-execute.test.ts:69-95` — tests verify user role, agent_guide content (includes 'Dev Executor Agent'), ticket_context with `<ticket id="T-001">`
- **IMPLEMENTED** ✅

**AC3** — Ticket XML includes all required fields: `id`, `status`, `title`, `description`, `problemStatement`, `solution`, `<item>` ACs, `<change path action>` fileChanges
- `forge-execute.ts:42-53` — `serializeTicketXml` template includes all 8 required elements
- `forge-execute.ts:29-40` — `<item>` mapping for acceptanceCriteria, `<change path action notes?>` mapping for fileChanges
- `forge-execute.test.ts:97-111` — tests assert `<item>Auth header validated</item>`, `<change path="src/auth.ts" action="create">New auth module</change>`
- **IMPLEMENTED** ✅

**AC4** — Input validation: missing/empty → standard error; 404 → "Ticket not found: {id}"; other errors → raw message
- `forge-execute.ts:60-65` — `typeof rawId !== 'string' || rawId.trim() === ''` gate with consistent error text
- `forge-execute.ts:73-84` — `message.includes('404')` → `Ticket not found: ${ticketId}`; all other errors → `message`
- `forge-execute.test.ts:136-188` — 6 tests: missing, empty string, whitespace-only, 404, auth error, network error
- **IMPLEMENTED** ✅

**AC5** — `dev-executor.md` ≤ 500 lines, four required sections, stored at `src/agents/dev-executor.md`, bundled via tsup loader
- `dev-executor.md` — 187 lines; sections at lines 3 (Persona), 17 (Principles), 51 (Process), 118 (Code Quality Rules)
- `tsup.config.ts` — `loader: { '.md': 'text' }` added
- `forge-execute.ts:1` — `import devExecutorMd from '../../agents/dev-executor.md'`
- **IMPLEMENTED** ✅

**AC6** — `ForgeMCPServer` registers `ListPromptsRequestSchema` (1 prompt) and new `GetPromptRequestSchema` handler dispatching to `handleForgeExecute`
- `server.ts:45-47` — ListPrompts returns 1 prompt
- `server.ts:50-61` — `GetPromptRequestSchema` handler with switch/case dispatch; unknown prompt → `isError: true`
- `server.test.ts:153-193` — 3 tests: `forge_execute` dispatch, unknown prompt error, missing args defaults to `{}`
- **IMPLEMENTED** ✅

**AC7** — `npm run typecheck` → 0 errors
- Confirmed in completion notes. All handler signatures use `Promise<any>` (documented Zod v3/v4 workaround). `PromptResult` and `PromptMessage` properly typed in `types.ts:15-24`. No bare `as string` casts in implementation.
- **IMPLEMENTED** ✅

**AC8** — Tests ≥ 158 total; 13+ new over 145 baseline covering all specified scenarios
- `forge-execute.test.ts` — 16 tests: 3 definition, 7 success path (including XML escaping and whitespace trim), 3 input validation, 3 error paths
- `server.test.ts` — 3 new GetPrompt dispatch tests; ListPrompts count updated to 1; CallTool indices shifted to [3]
- Total: **164 tests** (19 new over 145 baseline — exceeds minimum by 6)
- **IMPLEMENTED** ✅

### Code Quality Observations

**Strengths:**
- `vitest.config.ts` `md-to-string` plugin is an elegant, minimal solution for the tsup/Vite bundler mismatch. The inline approach avoids a runtime file dependency.
- `PromptResult` dual-purpose type (`messages?` for success, `content?` for errors) cleanly unifies the return type without duplication.
- `serializeTicketXml` and `escapeXml` correctly remain module-private. The XML escaping covers all four entities (`&`, `<`, `>`, `"`) matching the AC spec exactly.
- `rawId.trim()` applied both for validation and for the API call path — consistent whitespace handling.
- Handler registration order (ListTools=0, ListPrompts=1, GetPrompt=2, CallTool=3) is clear and the server test comments document this explicitly.

**No issues found.** Implementation is clean, minimal, and exactly scoped to the story requirements.
