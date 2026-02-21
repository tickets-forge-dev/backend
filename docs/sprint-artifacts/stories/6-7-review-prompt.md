# Story 6.7: Review Prompt (forge_review)

Status: done

## Story

As a developer using Claude Code,
I want the `forge_review` MCP prompt to be available via the Forge MCP server,
so that Claude receives the full `dev-reviewer.md` persona and ticket summary context when I invoke the prompt, enabling it to generate precise, ticket-grounded clarifying questions for the PM.

## Acceptance Criteria

1. `forge_review` appears in `prompts/list` alongside `forge_execute` — the server now returns **2 prompts**. `forge_review` has `name: "forge_review"`, a meaningful description, and an `arguments` schema with `ticketId` as a required string.
2. `forge_review({ ticketId: 'T-001' })` fetches the full ticket via `GET /tickets/T-001`, then returns `{ messages: [{ role: 'user', content: { type: 'text', text: '<agent_guide>...\n</agent_guide>\n<ticket_context>...\n</ticket_context>' } }] }` where the `agent_guide` section contains the full `dev-reviewer.md` content and the `ticket_context` section contains the ticket serialized as a summary XML.
3. The ticket summary XML produced by `forge_review` includes: `id`, `status`, `title`, `description`, `problemStatement`, `solution`, and `acceptanceCriteria` (as `<item>` children). `fileChanges` is intentionally omitted — reviewers need business context, not implementation targets.
4. Input validation: missing/empty `ticketId` → `{ isError: true, content: [{ type: 'text', text: 'Missing required argument: ticketId' }] }`. Backend 404 → `{ isError: true, content: [{ type: 'text', text: 'Ticket not found: T-001' }] }`. Auth/network error → `{ isError: true, content: [{ type: 'text', text: <message> }] }`.
5. `dev-reviewer.md` is ≤ 300 lines and contains four named sections: **Persona**, **Principles**, **Question Categories**, and **Examples**. It is stored at `src/agents/dev-reviewer.md` and bundled at build time via tsup's text loader (already configured in 6-6 — no `tsup.config.ts` changes needed).
6. `ForgeMCPServer` `ListPromptsRequestSchema` handler now returns **2 prompts** (`[forgeExecutePromptDefinition, forgeReviewPromptDefinition]`). The existing `GetPromptRequestSchema` handler adds a `case 'forge_review':` dispatch to `handleForgeReview`.
7. `npm run typecheck` → 0 errors across all new and modified files.
8. Unit tests cover: prompt definition (name, description, required args); success path (agent_guide present, ticket summary XML present, role='user', fileChanges absent); input validation (missing/empty/whitespace ticketId); error paths (404, auth, network); server ListPrompts count (2); GetPrompt dispatch for `forge_review`. Total tests ≥ 177 (13+ new over 164 baseline).

## Tasks / Subtasks

- [x] Task 1: Create `dev-reviewer.md` agent guide (AC: 5)
  - [x] Create `forge-cli/src/agents/dev-reviewer.md` with sections: Persona, Principles, Question Categories, Examples
  - [x] Ensure ≤ 300 lines (177 lines)
  - [x] Persona: expert technical reviewer who generates clarifying questions from ticket context — NOT an implementer
  - [x] Principles: question quality over quantity, anchor every question in ticket text, surface ambiguities the dev team needs resolved before starting
  - [x] Question Categories: Scope clarification, Acceptance criteria edge cases, Technical constraints, UX/PM intent, Dependencies/risks
  - [x] Examples: 3-5 annotated example questions demonstrating the expected format and depth

- [x] Task 2: Implement `forge-review.ts` prompt module (AC: 1, 2, 3, 4)
  - [x] Create `forge-cli/src/mcp/prompts/forge-review.ts`
  - [x] Import `devReviewerMd` from `'../../agents/dev-reviewer.md'` (text import via tsup loader)
  - [x] Export `forgeReviewPromptDefinition` with required `ticketId` argument
  - [x] Export `handleForgeReview(args: Record<string, unknown>, config: ForgeConfig): Promise<PromptResult>`
  - [x] Validate `ticketId`: missing/empty/whitespace → isError response (same pattern as `forge-execute.ts`)
  - [x] Fetch ticket: `ApiService.get<TicketDetail>('/tickets/${ticketId.trim()}', config)`
  - [x] On 404: return ticket-not-found error; other errors: return raw message
  - [x] Serialize ticket to **summary** XML using private `serializeTicketSummaryXml()` + `escapeXml()` helpers (omit `fileChanges`)
  - [x] Return messages with `agent_guide` + `ticket_context` XML
  - [x] Reuse `PromptResult` and `PromptMessage` types from `'../types.js'` (already defined in 6-6 — do NOT redefine)

- [x] Task 3: Register `forge_review` in `ForgeMCPServer` (AC: 1, 6)
  - [x] Import `forgeReviewPromptDefinition` and `handleForgeReview` from `'./prompts/forge-review.js'`
  - [x] Update `ListPromptsRequestSchema` handler: return `{ prompts: [forgeExecutePromptDefinition, forgeReviewPromptDefinition] }`
  - [x] Add `case 'forge_review':` dispatch to existing `GetPromptRequestSchema` switch

- [x] Task 4: Write tests + validate (AC: 7, 8)
  - [x] Create `forge-cli/src/mcp/prompts/__tests__/forge-review.test.ts`
    - [x] Mock `'../../agents/dev-reviewer.md'` → `{ default: '# Dev Reviewer Agent\n...' }` (ESM default mock)
    - [x] Mock `'../../../services/api.service'` → `{ get: vi.fn() }`
    - [x] Test prompt definition (3 tests): name, description length, ticketId required
    - [x] Test success path (7 tests): user role, agent_guide section present + content, ticket_context section present, AC items as `<item>`, fileChanges NOT in output, API call with whitespace trim, XML escaping
    - [x] Test input validation (3 tests): missing, empty string, whitespace-only
    - [x] Test error paths (3 tests): 404, auth error, network error
  - [x] Update `forge-cli/src/mcp/__tests__/server.test.ts`
    - [x] Add mock for `'../prompts/forge-review.js'`
    - [x] Update ListPrompts test: `toHaveLength(2)`, assert both `forge_execute` and `forge_review` present
    - [x] Add GetPrompt dispatch test for `forge_review` (handler index [2])
  - [x] Run `npm run typecheck` → 0 errors
  - [x] Run `npm test` → 181 tests passing (17 new over 164 baseline), 0 regressions

## Dev Notes

### Implementation Pattern

Story 6-7 is a near-parallel implementation of Story 6-6 (`forge_execute`). The key differences are:

1. **Agent guide**: `dev-reviewer.md` (≤300 lines) vs `dev-executor.md` (≤500 lines)
2. **Ticket serialization**: `serializeTicketSummaryXml()` omits `<fileChanges>` — reviewers don't need implementation targets
3. **ListPrompts**: now returns 2 prompts (extend, don't replace)
4. **No tsup/vitest config changes**: already configured in 6-6

### Ticket Summary XML Format

```typescript
function serializeTicketSummaryXml(ticket: TicketDetail): string {
  const acItems = (ticket.acceptanceCriteria ?? [])
    .map((ac) => `    <item>${escapeXml(ac)}</item>`)
    .join('\n');

  return `<ticket id="${escapeXml(ticket.id)}" status="${ticket.status}">
  <title>${escapeXml(ticket.title)}</title>
  <description>${escapeXml(ticket.description ?? '')}</description>
  <problemStatement>${escapeXml(ticket.problemStatement ?? '')}</problemStatement>
  <solution>${escapeXml(ticket.solution ?? '')}</solution>
  <acceptanceCriteria>
${acItems}
  </acceptanceCriteria>
</ticket>`;
}
```

`escapeXml()` is the same 4-entity replacement as in `forge-execute.ts` — reimplement as a private helper (do not attempt to import from `forge-execute.ts`, which is a sibling module with private helpers).

### `forge_review` Prompt Definition Shape

```typescript
export const forgeReviewPromptDefinition = {
  name: 'forge_review',
  description: 'Load the Forge dev-reviewer persona and ticket summary to generate clarifying questions for the PM.',
  arguments: [
    {
      name: 'ticketId',
      description: 'The ticket ID to review (e.g., T-001)',
      required: true,
    },
  ],
};
```

### Handler Return Shape (Success)

```typescript
return {
  messages: [{
    role: 'user' as const,
    content: {
      type: 'text' as const,
      text: `<agent_guide>\n${devReviewerMd}\n</agent_guide>\n<ticket_context>\n${ticketSummaryXml}\n</ticket_context>`,
    },
  }],
};
```

### Server Update

```typescript
// ListPromptsRequestSchema — update to return both prompts
this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [forgeExecutePromptDefinition, forgeReviewPromptDefinition],
}));

// GetPromptRequestSchema — add forge_review case
case 'forge_review':
  return handleForgeReview(args as Record<string, unknown>, this.config);
```

### Server Test Updates

```typescript
// Add mock for forge-review.js (alongside forge-execute.js mock)
vi.mock('../prompts/forge-review.js', () => ({
  forgeReviewPromptDefinition: {
    name: 'forge_review',
    description: 'Load reviewer persona',
    arguments: [{ name: 'ticketId', required: true }],
  },
  handleForgeReview: vi.fn().mockResolvedValue({
    messages: [{ role: 'user', content: { type: 'text', text: '<agent_guide>...</agent_guide>' } }],
  }),
}));

// ListPrompts test: toHaveLength(2) + check both names
expect(result.prompts).toHaveLength(2);
expect(result.prompts.map((p: { name: string }) => p.name)).toContain('forge_review');
```

GetPrompt dispatch tests remain at handler index `[2]` (unchanged from 6-6).

### `dev-reviewer.md` Content Structure

The reviewer agent guide should instruct Claude to:
1. Read the `<ticket_context>` XML (no fileChanges — focus on requirements)
2. Call `get_ticket_context` for additional structured detail if needed
3. Generate 5-10 high-quality clarifying questions organized by category
4. Format questions as a numbered list with one-sentence rationale each
5. Do NOT attempt to answer the questions — only generate them

**Required sections:**
- **Persona**: Technical reviewer embedded in Forge, focused on surfacing ambiguities before implementation starts
- **Principles**: Question quality over quantity, anchor to ticket text, one question per concern
- **Question Categories**: Scope/boundaries, AC edge cases, Technical constraints, UX/PM intent, Risk/dependencies
- **Examples**: 3-5 annotated sample questions showing depth and format expected

### `dev-reviewer.md` content guideline (key points)

Unlike `dev-executor.md`, this guide should:
- Emphasize "what is unclear" not "how to implement"
- Reference the PM ticket spec as the source of truth for questions
- Avoid implementation-language — questions should be answerable by a PM, not just a developer
- Close with a reminder to NOT implement — only generate questions and present them

### Vitest Mock for Markdown (already established)

```typescript
vi.mock('../../agents/dev-reviewer.md', () => ({
  default: '# Dev Reviewer Agent\n## Persona\nYou are a Forge dev reviewer.\n## Principles\n## Question Categories\n## Examples\n',
}));
```

The `vitest.config.ts` md-to-string plugin from 6-6 handles the actual file at test time — the `vi.mock()` above intercepts and returns a predictable string for assertions.

### `forge-review.test.ts` — fileChanges absent test

```typescript
it('does not include fileChanges in ticket summary XML', async () => {
  const result = await handleForgeReview({ ticketId: 'T-001' }, mockConfig);
  const text = result.messages![0].content.text;
  expect(text).not.toContain('<fileChanges>');
  expect(text).not.toContain('<change ');
});
```

### Project Structure Notes

- `forge-cli/src/agents/dev-reviewer.md` — NEW (agent guide, ≤300 lines)
- `forge-cli/src/mcp/prompts/forge-review.ts` — NEW
- `forge-cli/src/mcp/server.ts` — MODIFIED (ListPrompts now 2, GetPrompt adds forge_review case)
- `forge-cli/src/mcp/prompts/__tests__/forge-review.test.ts` — NEW (~14 tests)
- `forge-cli/src/mcp/__tests__/server.test.ts` — UPDATED (ListPrompts count 1→2, add forge_review dispatch test, add forge-review.js mock)

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-6-mcp-server.md#Detailed-Design] — `forge_review` prompt spec, `dev-reviewer.md` content requirements (AC8, AC15)
- [Source: docs/sprint-artifacts/tech-spec-epic-6-mcp-server.md#Workflows] — `forge review T-001` flow (question generation, Epic 7 deferred POST)
- [Source: forge-cli/src/mcp/prompts/forge-execute.ts] — implementation pattern to mirror
- [Source: forge-cli/src/mcp/server.ts] — current server (ListPrompts returns 1; extend to 2)
- [Source: forge-cli/src/mcp/types.ts] — `PromptResult`, `PromptMessage` types to reuse

### Learnings from Previous Story

**From Story 6-6-execute-prompt (Status: done)**

- **New infrastructure in place**: `vitest.config.ts` md-to-string plugin — `.md` files load correctly in tests via `vi.mock('...md', () => ({ default: '...' }))` — no changes needed
- **Reuse types**: `PromptResult` and `PromptMessage` already in `src/mcp/types.ts:15-24` — import, do NOT redeclare
- **Handler indices locked**: ListTools=0, ListPrompts=1, GetPrompt=2, CallTool=3 — do not shift
- **ESM default mock**: `vi.mock('../../agents/dev-reviewer.md', () => ({ default: '...' }))` — the `default` key is critical for ESM import interop
- **`Promise<any>` on GetPromptRequestSchema handler**: keep as-is (Zod v3/v4 workaround, documented with eslint-disable comment)
- **Test baseline**: 164 tests — new story must reach ≥ 177

[Source: stories/6-6-execute-prompt.md#Dev-Agent-Record]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- `serializeTicketSummaryXml()` omits `<fileChanges>` by design — the reviewer persona only needs business context (title, description, problemStatement, solution, acceptanceCriteria) to generate PM-answerable questions.
- `escapeXml()` reimplemented as a private helper in `forge-review.ts` (same 4-entity replacement as `forge-execute.ts`). Not extracted to a shared util — both files keep their helpers private to avoid coupling sibling modules.
- `dev-reviewer.md` includes a `[BLOCKING]` annotation pattern for high-priority questions — this gives the LLM a signal to surface the most critical ambiguities first.
- Server `ListPromptsRequestSchema` now returns 2 prompts ordered as `[forge_execute, forge_review]` — execute first as it's the primary workflow.
- Test count: 181 (17 new over 164 baseline). `forge-review.test.ts` has 16 tests; `server.test.ts` gained 1 (forge_review dispatch) and updated the ListPrompts count assertion (1→2).
- `vitest.config.ts` and `tsup.config.ts` required no changes — markdown loading infrastructure from 6-6 covers both agents automatically.

### File List

- `forge-cli/src/agents/dev-reviewer.md` — NEW (177 lines, 4 required sections)
- `forge-cli/src/mcp/prompts/forge-review.ts` — NEW
- `forge-cli/src/mcp/server.ts` — MODIFIED (ListPrompts returns 2 prompts; GetPrompt adds forge_review dispatch)
- `forge-cli/src/mcp/prompts/__tests__/forge-review.test.ts` — NEW (16 tests)
- `forge-cli/src/mcp/__tests__/server.test.ts` — UPDATED (forge-review.js mock, ListPrompts count 1→2, forge_review dispatch test)

---

## Senior Developer Review (AI)

**Reviewer:** claude-sonnet-4-6
**Date:** 2026-02-21
**Verdict:** APPROVE

### Systematic AC Validation

| AC | Description | Status | Evidence |
|---|---|---|---|
| AC1 | `forge_review` in prompts/list, 2 total, name/description/required args | ✅ IMPLEMENTED | `forge-review.ts:7-18` (definition); `server.ts:49-51` (ListPrompts 2-element array); `server.test.ts` `toHaveLength(2)` |
| AC2 | Fetches ticket, returns `messages[{role:'user',…}]` with agent_guide + ticket_context | ✅ IMPLEMENTED | `forge-review.ts:60` (API call); `forge-review.ts:77-87` (messages shape); `forge-review.test.ts:69-95` (role, sections) |
| AC3 | XML includes required fields; `fileChanges` intentionally absent | ✅ IMPLEMENTED | `forge-review.ts:28-42` (`serializeTicketSummaryXml` — no `<fileChanges>` block); `forge-review.test.ts:105-111` (explicit `not.toContain` assertions) |
| AC4 | Input validation: missing/empty/whitespace → isError; 404 → "Ticket not found"; others → raw | ✅ IMPLEMENTED | `forge-review.ts:48-72`; 6 tests at `forge-review.test.ts:136-188` |
| AC5 | `dev-reviewer.md` ≤300 lines, 4 sections, bundled via tsup loader | ✅ IMPLEMENTED | 177 lines; Persona (L3), Principles (L17), Question Categories (L57), Examples (L90); `forge-review.ts:1` (import) |
| AC6 | ListPrompts returns 2; GetPrompt adds `forge_review` dispatch case | ✅ IMPLEMENTED | `server.ts:49-51` (2 prompts); `server.ts:59-60` (`case 'forge_review'`); server test dispatch assertion |
| AC7 | `npm run typecheck` → 0 errors | ✅ IMPLEMENTED | Confirmed: `tsc --noEmit` exits 0 |
| AC8 | 181 tests (≥177); all coverage areas present | ✅ IMPLEMENTED | 16 tests in `forge-review.test.ts`; +1 in `server.test.ts`; 181 total |

**AC Coverage: 8 of 8 fully implemented.**

### Task Completion Validation

| Task | Marked | Verified | Evidence |
|---|---|---|---|
| Task 1: Create `dev-reviewer.md` (4 sections, ≤300 lines) | [x] | VERIFIED | File exists, 177 lines, all 4 sections present |
| Task 2: Implement `forge-review.ts` (definition, handler, XML, types) | [x] | VERIFIED | `forge-review.ts` 89 lines; reuses `PromptResult` from `types.js`; no redeclaration |
| Task 3: Register in server (ListPrompts 2, GetPrompt case) | [x] | VERIFIED | `server.ts:49-51`, `server.ts:59-60` |
| Task 4: Tests + typecheck + test run | [x] | VERIFIED | 16-test file; server.test.ts updated; 181 passing; 0 typecheck errors |

**Task Verification: 4 of 4 completed tasks verified. 0 false completions.**

### Code Quality Observations

**Strengths:**
- The `serializeTicketSummaryXml()` / `escapeXml()` pattern is correct as private helpers — same 4-entity escaping (`&`, `<`, `>`, `"`) as `forge-execute.ts`. Keeping them private avoids premature abstraction for just two files.
- The `[BLOCKING]` annotation pattern in `dev-reviewer.md` is a well-chosen affordance — it signals priority to the LLM without requiring structural changes to the output format.
- `fileChanges` omission is correctly scoped: the reviewer persona generates PM-answerable questions, not implementation plans. The explicit `not.toContain` test locks this in.
- Mock pattern for `dev-reviewer.md` correctly uses `{ default: '...' }` (ESM default export). The mock string includes all 4 required section headers, making the test's assertion about 'Dev Reviewer Agent' meaningful.
- Handler registration order (execute → review in both ListPrompts and the GetPrompt switch) is consistent and mirrors the primary → secondary workflow importance.

**No issues found.** Implementation is clean, exactly scoped, and follows all established patterns from 6-6.
