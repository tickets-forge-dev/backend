# Epic Technical Specification: Forge Developer Agent

Date: 2026-02-27
Author: BMad
Epic ID: 10
Status: Draft

---

## Overview

Epic 10 delivers the **Forge Developer Agent** — a BMAD agent that becomes the standard way developers start work on a Forge ticket. When a developer runs `forge develop <ticketId>`, Forgy (the same character from the review agent) guides them through a structured preparation flow: loads the full ticket context, asks 5-8 targeted implementation questions via AskUserQuestion, then automatically creates the correct `forge/<aec-id>-slug` branch and transitions the ticket to EXECUTING.

This creates **workflow lock-in** — once teams use `forge develop` as their starting ritual, Forge controls the full lifecycle from PM intent to developer execution. The developer agent is the product differentiator; PR validation can be layered on later.

### Why This Matters

The review agent (Epic 6) proved the pattern: structured Q&A via AskUserQuestion creates high-quality knowledge capture. The developer agent extends this to the implementation phase:

- **Before:** Dev reads spec, creates a random branch name, starts coding. Context is lost.
- **After:** Dev types `forge develop`, gets a guided briefing, answers implementation questions that enrich the ticket, and starts on a correctly-named branch with full context loaded.

## Objectives and Scope

**In Scope:**
- Domain model: AEC `startImplementation()` transition, implementation tracking fields
- `StartImplementationUseCase` + REST endpoint
- `forge develop <ticketId>` CLI command
- `start_implementation` MCP tool
- `forge-develop` MCP prompt + `dev-implementer.md` agent guide
- `.bmad/bmm/agents/forge-developer.md` BMAD agent (Forgy in build mode)

**Out of Scope (future epic):**
- Automatic PR validation via webhook
- GitHub PR comment posting
- PR validation display on client
- GitHub Checks API integration

## System Architecture Alignment

### Domain Layer
- `ImplementationSession` interface: `{ qaItems: ReviewQAItem[], branchName: string, startedAt: Date }`
- AEC gains `startImplementation(branchName, qaItems?)` transition (FORGED → EXECUTING)
- AEC gains `implementationBranch` and `implementationSession` fields

### Application Layer
- `StartImplementationUseCase` — validates FORGED status, calls domain method, persists

### Infrastructure Layer
- `AECMapper` updated for new fields

### Presentation Layer
- `POST /api/tickets/:id/start-implementation` endpoint

### CLI / MCP Layer
- `forge develop <ticketId>` command
- `start_implementation` MCP tool
- `forge-develop` MCP prompt

### BMAD Layer
- `.bmad/bmm/agents/forge-developer.md` — Forgy in build mode

## Branch Naming Convention

Format: `forge/<aec-id>-<slug>`
- `aec-id` = AEC entity ID (e.g., `aec_a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
- `slug` = kebab-case of first 4 words of title, max 30 chars
- Example: `forge/aec_a1b2c3d4-e5f6-7890-abcd-ef1234567890-add-user-auth`

The agent generates this automatically — no human input, no typos, no wrong format.

## Developer Agent Flow

```
Developer: forge develop <ticketId>
  → CLI validates ticket is FORGED, starts MCP server

Developer invokes Forgy (BMAD agent):
  → Phase 1 — Load:
      Call get_ticket_context + get_file_changes + get_repository_context
      Display: "Hey {name}! Let's get {title} built. {N} files to change, {M} acceptance criteria."

  → Phase 2 — Implementation Q&A (5-8 questions via AskUserQuestion):
      1. Approach & Architecture
      2. Existing Patterns to reuse
      3. Scope Boundaries (what to defer)
      4. Edge Cases & Error Handling
      5. Testing Priority
      Each question: one AskUserQuestion call → wait → acknowledge → next

  → Phase 2.5 — Wrap-Up:
      Recap all answers → AskUserQuestion: "Ready to start?"

  → Phase 3 — Branch Setup:
      Generate branch name: forge/<aec-id>-<slug>
      Run: git checkout -b <branch>
      Call MCP: start_implementation({ ticketId, branchName, qaItems })
      Backend: FORGED → EXECUTING, stores branch + Q&A
      Display: "You're set. {N} files to change, {M} tests to write."
```

## Dependency Graph

```
10.1 (Domain) → 10.2 (Use Case + API) → 10.3 (MCP + CLI) → 10.4 (BMAD Agent)
```

Strictly sequential — each story builds on the previous.

## Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Reuse ReviewQAItem for implementation Q&A | Same structure, consistent persistence |
| Forgy character (not new) | Developers build relationship with one assistant |
| AskUserQuestion (not text Q&A) | Proven pattern from forge-reviewer, structured options |
| Branch created by agent (not human) | Eliminates naming errors, guarantees linkability |
| FORGED → EXECUTING transition | Clear status signal that implementation has begun |
