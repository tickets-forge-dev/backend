# Story 10.3: MCP & CLI — forge develop Command

Status: drafted

## Story

As a developer using Claude Code,
I want a `forge develop <ticketId>` CLI command and a `start_implementation` MCP tool,
so that the BMAD developer agent can create my branch and start implementation programmatically.

## Acceptance Criteria

1. **Given** a FORGED ticket **When** the developer runs `forge develop <ticketId>` **Then** the CLI validates the ticket status, starts the MCP server, and outputs instructions for invoking the developer agent

2. **Given** the MCP server is running from `forge develop` **When** the AI calls `start_implementation({ ticketId, branchName, qaItems })` **Then** the tool calls `POST /api/tickets/:id/start-implementation` and returns `{ success, ticketId, branchName, status }`

3. **Given** a new `forge-develop` MCP prompt **When** invoked **Then** it loads the dev-implementer persona, fetches ticket context + file changes + repo context, and returns a structured prompt message

4. **Given** a ticket NOT in FORGED status **When** `forge develop <ticketId>` is run **Then** the CLI shows an error: "Ticket must be in FORGED status to start implementation"

5. **Given** the `start_implementation` tool fails **When** the backend rejects it **Then** the tool returns `isError: true` with a descriptive message

## Tasks / Subtasks

- [ ] Task 1: Create start_implementation MCP tool (AC: 2, 5)
  - [ ] Create `forge-cli/src/mcp/tools/start-implementation.ts`
  - [ ] Input schema (Zod): `{ ticketId: string, branchName: string, qaItems?: Array<{ question: string, answer: string }> }`
  - [ ] Call `ApiService.post('/tickets/${ticketId}/start-implementation', { branchName, qaItems })`
  - [ ] Return structured result or error
  - [ ] Add `ApiService.post()` method if not already present (same auth/retry pattern as `get()` and `patch()`)

- [ ] Task 2: Create dev-implementer agent guide (AC: 3)
  - [ ] Create `forge-cli/src/agents/dev-implementer.md` (≤300 lines)
  - [ ] Persona: implementation preparation specialist
  - [ ] Principles: spec is truth, ask before assuming, create correct branch
  - [ ] Branch naming convention: `forge/<aec-id>-<slug>`
  - [ ] Q&A categories: approach, patterns, scope, edge cases, testing

- [ ] Task 3: Create forge-develop MCP prompt (AC: 3)
  - [ ] Create `forge-cli/src/mcp/prompts/forge-develop.ts`
  - [ ] Mirror `forge-execute.ts` structure
  - [ ] Load `dev-implementer.md` agent guide
  - [ ] Fetch ticket context + file changes + repo context
  - [ ] Return prompt message with XML-wrapped context

- [ ] Task 4: Create forge develop CLI command (AC: 1, 4)
  - [ ] Create `forge-cli/src/commands/develop.ts`
  - [ ] Mirror `review.ts` pattern: fetch ticket, validate status ∈ {FORGED}, start MCP, wait SIGINT
  - [ ] Output: "Run the forge-developer BMAD agent in Claude Code to start"

- [ ] Task 5: Register everything (AC: all)
  - [ ] Register `start_implementation` tool in `forge-cli/src/mcp/server.ts`
  - [ ] Register `forge-develop` prompt in `forge-cli/src/mcp/server.ts`
  - [ ] Register `develop` command in CLI command registry

## Dev Notes

- Mirror exact patterns from Epic 6:
  - Tool: follow `submit-review-session.ts`
  - Prompt: follow `forge-execute.ts`
  - Command: follow `review.ts`
  - Agent guide: follow `dev-reviewer.md`
- Check if `ApiService` has a `post()` method. It has `get()` and `patch()`. If missing, add it with the same auth/retry pattern.
- The dev-implementer.md should explain:
  - The branch naming convention and WHY it matters
  - How to use AskUserQuestion for Q&A (one at a time)
  - The 5 question categories with example questions

### Prerequisites

- Story 10.2 (backend endpoint must exist)

### References

- [Source: forge-cli/src/mcp/tools/submit-review-session.ts] — MCP tool pattern
- [Source: forge-cli/src/mcp/prompts/forge-execute.ts] — MCP prompt pattern
- [Source: forge-cli/src/commands/review.ts] — CLI command pattern
- [Source: forge-cli/src/agents/dev-reviewer.md] — agent guide pattern

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
