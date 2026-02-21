# Story 6.13: BMAD Forge-Reviewer Agent

Status: ready-for-dev

## Story

As a developer using Claude Code with BMAD installed,
I want to invoke a `forge-reviewer` BMAD agent that orchestrates the full Forge review session interactively,
so that Claude guides me through fetching the ticket, asking clarifying questions, collecting my answers, and submitting the review session to Forge — all without leaving my editor.

## Acceptance Criteria

1. A BMAD-format agent file exists at `.bmad/bmm/agents/forge-reviewer.md` following the established BMAD agent conventions (YAML frontmatter, activation steps, persona, menu with `*` triggers).
2. The agent can be invoked in Claude Code via `/bmad:bmm:agents:forge-reviewer` (or via the BMAD Skill tool), and Claude immediately loads the Forge Reviewer persona — asking for a `ticketId` before proceeding.
3. On receiving a `ticketId`, the agent instructs Claude to call the `get_ticket_context` MCP tool and use the returned ticket data as the basis for generating 5–10 targeted clarifying questions, exactly as the `dev-reviewer.md` guide specifies.
4. The agent structures the session in three explicit phases: **Phase 1 — Load** (fetch ticket), **Phase 2 — Review** (Q&A dialogue), **Phase 3 — Submit** (compile and submit when developer signals done).
5. Phase 3: when the developer signals completion (e.g., "done", "submit", "send it back"), the agent instructs Claude to call `submit_review_session({ ticketId, qaItems: [{ question, answer }, ...] })` using all Q&A pairs collected in Phase 2.
6. On successful submission, the agent confirms: *"✅ Review session submitted to Forge. The PM will see your answers and can re-bake the ticket. You're done."*
7. The agent file is ≤ 200 lines, focused, and contains four sections: **Persona**, **Activation**, **Workflow**, and **Menu**.
8. `npm run typecheck` in `forge-cli` → 0 errors (no new CLI source files required for this story — agent file is plain Markdown in the monorepo root).

## Tasks / Subtasks

- [ ] Task 1: Create `.bmad/bmm/agents/forge-reviewer.md` BMAD agent (AC: 1, 2, 3, 4, 5, 6, 7)
  - [ ] Write YAML frontmatter: `name: forge-reviewer`, `description: "Forge review session orchestrator"`
  - [ ] Write **Activation** section:
    - Load `.bmad/bmm/config.yaml` for `{user_name}` and `{communication_language}`
    - Greet user and ask for `ticketId` immediately
    - Confirm forge MCP server is running (`forge review <ticketId>` must be active in terminal)
  - [ ] Write **Persona** section:
    - Role: Forge Review Orchestrator — guides the review session from ticket load to Q&A submission
    - Communicates concisely; labels each phase; stays in role until session submitted or aborted
    - Does NOT generate questions without first fetching the ticket via MCP
  - [ ] Write **Workflow** section (3 phases):
    - *Phase 1 — Load*: call `get_ticket_context({ ticketId })` → display ticket title and AC count → confirm ready for review
    - *Phase 2 — Review*: generate 5–10 questions using `dev-reviewer.md` guidelines → present numbered list → wait for developer to answer each → collect as `qaItems` array
    - *Phase 3 — Submit*: on developer signal ("done", "submit", "send it back") → call `submit_review_session({ ticketId, qaItems })` → display confirmation message from AC6
  - [ ] Write **Menu** section with commands:
    - `*review <ticketId>` — start new review session (Phase 1)
    - `*submit` — manually trigger Phase 3 (if developer types it explicitly)
    - `*abort` — exit without submitting; confirm with developer first
    - `*help` — show menu
  - [ ] Verify agent file is ≤ 200 lines
  - [ ] Verify file follows BMAD YAML frontmatter convention (matches `dev.md`, `sm.md` patterns)

- [ ] Task 2: Validate (AC: 8)
  - [ ] Run `npm run typecheck` in `forge-cli` → 0 errors (no new TS files)
  - [ ] Manually verify agent can be invoked in Claude Code via BMAD skill system
  - [ ] Manually walk through Phase 1 → Phase 2 → Phase 3 with a real ticket to confirm flow

## Dev Notes

### Why a BMAD Agent (Not Just the MCP Prompt)?

The `forge_review` MCP prompt (Story 6-7) returns a **static prompt message** to the MCP client — Claude reads it and then acts autonomously. The BMAD agent provides an **interactive orchestration layer** that:

- Explicitly structures the three-phase flow (Load → Review → Submit)
- Keeps Claude in a defined role throughout a multi-turn conversation
- Enables the `*submit` / `*abort` escape hatches that wouldn't exist in a one-shot prompt
- Provides a familiar BMAD entry point for developers already using the BMAD agent system

Both work: a developer can use *either* `forge_review` MCP prompt (headless, quick) or the `forge-reviewer` BMAD agent (guided, interactive). The BMAD agent is supplemental, not a replacement.

### BMAD Agent Format Reference

All BMAD agents follow this structure (from `.bmad/bmm/agents/dev.md` and `sm.md`):

```yaml
---
name: "agent-name"
description: "One-sentence description"
---

You must fully embody this agent's persona...

\`\`\`xml
<agent id=".bmad/bmm/agents/forge-reviewer.md" name="Forge Reviewer" title="Review Orchestrator" icon="🔍">
<activation critical="MANDATORY">
  <step n="1">Load persona from this file</step>
  <step n="2">Load {project-root}/.bmad/bmm/config.yaml → store {user_name}, {communication_language}</step>
  <step n="3">Confirm forge MCP server is running (developer must have run `forge review <ticketId>`)</step>
  <step n="4">Greet user, ask for ticketId if not provided</step>
  <step n="5">WAIT for user input before executing any phase</step>
</activation>
```

### Q&A Collection Pattern

During Phase 2, Claude should maintain a running `qaItems` array in working memory:

```
qaItems = [
  { question: "What is the expected rate limit threshold?", answer: "5 per minute per IP" },
  { question: "Should 429 include a Retry-After header?", answer: "Yes, 60 seconds" },
  ...
]
```

Each answer is recorded as the developer responds. When Phase 3 triggers, the full `qaItems` is passed to `submit_review_session`.

### MCP Tools Available During Session

The forge MCP server (started by `forge review <ticketId>`) exposes:
- `get_ticket_context({ ticketId })` — Phase 1 ticket load
- `submit_review_session({ ticketId, qaItems })` — Phase 3 submission
- `get_repository_context({})` — optional: if developer wants to reference current git state

### Question Generation Guidelines

The agent should instruct Claude to generate questions using the same categories as `dev-reviewer.md`:
1. Scope / boundary questions
2. Acceptance criteria edge cases
3. Technical constraints
4. UX / PM intent
5. Risk / dependencies

Questions must be answerable by a PM (not a developer). Avoid "how should I implement X?" — prefer "what is the expected behavior when X?"

### Project Structure Notes

- `.bmad/bmm/agents/forge-reviewer.md` — NEW (plain Markdown + YAML frontmatter, no build step)
- No changes to `forge-cli/` source files
- No changes to backend or client
- No test files required (agent is a markdown persona, not compiled code)

### Alignment With Prior Work

| Component | Status | Notes |
|-----------|--------|-------|
| `forge-cli/src/mcp/tools/submit-review-session.ts` | ✅ done (6-12) | Phase 3 MCP call target |
| `forge-cli/src/agents/dev-reviewer.md` | ✅ done (6-7+) | Question generation guidelines to inherit |
| `forge-cli/src/mcp/server.ts` | ✅ done | 5 tools + 2 prompts registered |
| `forge review <ticketId>` CLI command | ✅ done (6-11) | Must be running before agent activation |

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-6-mcp-server.md#Out-of-Scope] — "BMAD-specific multi-agent review orchestration → separate story (6-13)"
- [Source: docs/sprint-artifacts/tech-spec-epic-6-mcp-server.md#Workflows] — `forge review` flow and Epic 7 deferred steps
- [Source: .bmad/bmm/agents/dev.md] — BMAD agent format and activation pattern to mirror
- [Source: forge-cli/src/agents/dev-reviewer.md] — question generation persona and guidelines to inherit
- [Source: forge-cli/src/mcp/tools/submit-review-session.ts] — Phase 3 MCP tool: `submit_review_session`

### Learnings from Previous Story

**From Story 6-7-review-prompt (Status: done)**

- **`dev-reviewer.md` is the authoritative guide**: question categories, formatting, and the `[BLOCKING]` annotation pattern are already established — the BMAD agent should delegate to these guidelines, not reinvent them.
- **`submit_review_session` is ready**: added in Stories 6-12 (done). Phase 3 of the agent simply calls this MCP tool.
- **`forge_review` MCP prompt is complementary, not replaced**: the BMAD agent provides interactive orchestration on top, not instead of, the prompt.
- **Test baseline**: 217 tests (18 files) — this story adds no new test files (agent is markdown only).

[Source: stories/6-7-review-prompt.md#Dev-Agent-Record]

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/stories/6-13-bmad-review-agent.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
