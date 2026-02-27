# Story 10.4: BMAD Forge Developer Agent

Status: drafted

## Story

As a developer using Claude Code with BMAD installed,
I want to invoke a `forge-developer` BMAD agent that guides me through implementation preparation — loading the ticket, asking targeted questions, and automatically creating the correct branch,
so that I start every implementation with the right context and a properly named branch.

## Acceptance Criteria

1. A BMAD-format agent file exists at `.bmad/bmm/agents/forge-developer.md` following established BMAD conventions (YAML frontmatter, XML activation block, persona, menu with `*` triggers).

2. **Given** the developer invokes the forge-developer agent with a ticketId **When** Phase 1 completes **Then** the agent has called `get_ticket_context` and `get_file_changes` via MCP, and displays a summary: title, AC count, file changes count

3. **Given** the ticket is loaded in Phase 1 **When** Phase 2 begins **Then** the agent generates 5-8 implementation questions using AskUserQuestion (one at a time, never as text output), covering: approach & architecture, existing patterns, scope boundaries, edge cases, testing priority

4. **Given** all Phase 2 questions are answered **When** the developer confirms in Phase 2.5 **Then** Phase 3 auto-generates the branch name `forge/<aec-id>-<slug>`, runs `git checkout -b <branch>`, calls `start_implementation` MCP tool, and displays "You're set."

5. **Given** the developer selects `*start` **When** Phase 2 is skipped **Then** the agent goes straight to branch creation (Phase 3) with empty qaItems

6. The agent file is ≤ 200 lines. Forgy persona is consistent with forge-reviewer (same character, build mode).

7. `npm run typecheck` in `forge-cli` → 0 errors (no new CLI source files — agent is Markdown only).

## Tasks / Subtasks

- [ ] Task 1: Create `.bmad/bmm/agents/forge-developer.md` (AC: 1, 2, 3, 4, 5, 6)
  - [ ] YAML frontmatter: `name: forge-developer`, `description: "Forgy — interactive implementation preparation agent"`
  - [ ] **Activation** section (steps 1-8):
    - Step 1: Load persona
    - Step 2: Load `.bmad/bmm/config.yaml` → `{user_name}`, `{communication_language}`
    - Step 3: Remember user_name
    - Step 4: Confirm MCP server running (`forge develop <ticketId>` must be active)
    - Step 5: Greet user, ask for ticketId
    - Step 6: WAIT for ticketId
    - Step 7: On ticketId received → Phase 1
    - Step 8: Menu handling
  - [ ] **Persona** section:
    - Role: Implementation Preparation Orchestrator (Forgy in build mode)
    - Identity: Guides developer through structured 3-phase prep before coding
    - Communication: Same warm, sharp, ultra-concise as forge-reviewer
    - Principles: Spec is truth. One AskUserQuestion per question (non-negotiable). Never pre-fill answers. Branch creation is automatic.
  - [ ] **Workflow** section (3+1 phases):
    - **Phase 1 — Load**: `get_ticket_context` + `get_file_changes` + `get_repository_context` → display summary
    - **Phase 2 — Implementation Q&A**: 5-8 questions via AskUserQuestion, one at a time
      - Categories: Approach & Architecture, Existing Patterns, Scope Boundaries, Edge Cases, Testing Priority
      - Each question: structured options (2-4), header = "Q1", "Q2 BLOCKING", etc.
      - Acknowledge each answer in ~5 words, then next question
    - **Phase 2.5 — Wrap-Up**: Bullet recap of answers → AskUserQuestion: "Ready to start building?"
      - Options: "Create branch & start", "Revisit a question", "Add more context"
    - **Phase 3 — Branch Setup**:
      - Generate: `forge/<aec-id>-<slug>` (slug = kebab-case first 4 words of title, max 30 chars)
      - Run: `git checkout -b <branch>`
      - Call MCP: `start_implementation({ ticketId, branchName, qaItems })`
      - Display: "You're set. {N} files to change, {M} tests to write. The spec is your guide."
  - [ ] **Menu** section:
    - `*help` — Show this menu
    - `*develop` — Start full flow (asks for ticketId, runs Phase 1)
    - `*start` — Skip Q&A, go straight to branch creation (Phase 3)
    - `*abort` — Exit without creating branch (confirm first)
  - [ ] Verify ≤ 200 lines

- [ ] Task 2: Validate (AC: 7)
  - [ ] `npm run typecheck` in `forge-cli` → 0 errors
  - [ ] Manual walk-through: invoke agent → Phase 1 → Phase 2 Q&A → Phase 3 branch creation

## Dev Notes

### Phase 2 Question Categories (with examples)

1. **Approach & Architecture**
   - "The spec creates a new service. Should it live in the existing tickets module or a separate module?"
2. **Existing Patterns**
   - "I see `SubmitReviewSessionUseCase` follows a specific pattern. Should we mirror that exactly?"
3. **Scope Boundaries**
   - "The spec lists {N} file changes. Anything you'd defer to a follow-up PR?"
4. **Edge Cases & Error Handling**
   - "What should happen when the GitHub API is unreachable during validation?"
5. **Testing Priority**
   - "The test plan has {N} tests. Which are most critical for this PR?"

### Why Forgy (Same Character)

The forge-reviewer is Forgy in review mode. The forge-developer is Forgy in build mode. Same character, different phase. Developers build a relationship with one assistant.

### MCP Tools Used

- `get_ticket_context({ ticketId })` — Phase 1
- `get_file_changes({ ticketId })` — Phase 1
- `get_repository_context({})` — Phase 1
- `start_implementation({ ticketId, branchName, qaItems })` — Phase 3

### Prerequisites

- Story 10.3 (MCP tool and CLI command must exist)

### References

- [Source: .bmad/bmm/agents/forge-reviewer.md] — BMAD agent format to mirror (103 lines)
- [Source: forge-cli/src/agents/dev-reviewer.md] — question category pattern
- [Source: docs/sprint-artifacts/stories/6-13-bmad-review-agent.md] — story pattern for BMAD agents

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
