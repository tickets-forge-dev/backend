---
title: "Team Workflows"
excerpt: "How PMs and developers collaborate in Forge — and the different ways to configure it for your team."
category: "Core Concepts"
---


Forge is built for teamwork. The PM brings the vision. The developer brings the technical reality. Forge guides the conversation between them and produces a contract both sides trust.

This page explains the collaboration flow, the roles involved, and the different configurations you can choose depending on how your team works.

## The PM–Developer Flow

Here's what a typical ticket looks like when both PM and developer are involved:

```
PM creates ticket
  "Users should be able to filter by tags"
        │
        ▼
Forge asks clarification questions
  PM answers in plain language
        │
        ▼
Spec is generated (Draft)
  Acceptance criteria, file changes, wireframes
        │
        ▼
PM assigns a developer
        │
        ▼
Developer reviews via CLI
  Adds technical context:
  "Use the existing Zustand store pattern"
  "Filter server-side for performance"
  "Reuse the TagBadge component"
        │
        ▼
PM reads developer feedback
  Optionally re-bakes the spec
        │
        ▼
PM approves → AEC is forged
  Both sides agreed. Contract is locked.
        │
        ▼
Developer (or AI agent) executes
  Full context. No ambiguity.
```

This is the **full lifecycle** — and it produces the best results. But Forge is flexible. Not every team works this way, and not every ticket needs the full cycle.

## Configuration Options

Forge adapts to your team's constraints. Here are the main ways to use it:

### At a Glance

| Configuration | Codebase connected | Developer review | AI agent execution | Best for |
|---|---|---|---|---|
| **Full lifecycle** | Yes | Yes | Yes | Teams that want maximum spec quality and AI-assisted implementation |
| **Full lifecycle, no agent** | Yes | Yes | No | Teams where developers implement manually but want verified specs |
| **PM + Developer, no codebase** | No | Yes | No | Companies that can't connect GitHub (security policies, air-gapped repos) |
| **PM only** | Optional | No | No | Solo PMs, early-stage teams, or quick drafts that don't need developer review |

### Full Lifecycle (Recommended)

The complete experience. Connect a GitHub repo, generate code-aware specs, have the developer review, and execute with AI assistance.

**Who does what:**

| Step | Who | What happens |
|------|-----|-------------|
| Create ticket | PM | Describes the feature, connects a repo, answers clarification questions |
| Generate spec | Forge | Produces acceptance criteria, file changes, API contracts, wireframes — all referencing real code |
| Review | Developer | Reviews the spec via CLI, adds technical context and codebase knowledge |
| Re-bake | Forge | Updates the spec with the developer's input |
| Approve | PM | Locks the contract — both sides agree on what "done" means |
| Execute | Developer + AI | Developer runs `forge develop`, AI agent implements with full context |

**Result:** The highest quality specs. The developer's real-world knowledge is baked into the contract. The AI agent builds the right thing first time.

### Full Lifecycle, No Agent

Same as above, but the developer implements manually instead of using an AI agent. The spec is still code-aware and developer-reviewed — the developer just writes the code themselves.

**When to use:** Teams where AI coding agents aren't adopted yet, or for complex work that needs a human touch.

### PM + Developer, No Codebase

Some companies can't connect their GitHub repositories — security policies, compliance requirements, private infrastructure, or non-GitHub hosting (GitLab, Bitbucket, self-hosted).

Forge still works. The PM creates the ticket without connecting a repo. The spec is generated from the description and clarification answers alone — it won't reference specific files, but it still produces structured acceptance criteria, scope boundaries, and a clear contract.

**The developer makes it real:** When the developer reviews via the CLI, they add the codebase context manually — which files to touch, which patterns to follow, which code to reuse. The re-baked spec then incorporates this knowledge.

**Who does what:**

| Step | Who | What happens |
|------|-----|-------------|
| Create ticket | PM | Describes the feature, answers clarification questions (no repo connected) |
| Generate spec | Forge | Produces acceptance criteria, scope, API contracts — without file-level references |
| Review | Developer | Adds the missing codebase context: file paths, patterns, edge cases |
| Re-bake | Forge | Updates the spec with the developer's codebase knowledge |
| Approve | PM | Locks the contract |
| Execute | Developer | Implements using the verified spec as their guide |

**Result:** You still get the structured protocol, the mutual agreement, and the scope boundaries. The spec is less precise on file changes, but the developer review fills that gap.

### PM Only

For quick drafts, solo PMs, or early-stage teams without a dedicated developer review process. The PM creates and enriches the ticket entirely from the web app.

**When to use:**
- Early exploration — drafting specs before a developer is assigned
- Small teams where the PM has technical context
- Quick tickets that don't justify the full review cycle

The developer can always be brought in later. A PM-only ticket can transition to the full lifecycle at any point.

## The Developer's Perspective

For developers, Forge changes the experience from "figure out what the PM meant" to "review a clear proposal and add your expertise."

### What developers do in Forge

1. **Review the spec** — Read the generated acceptance criteria, file changes, and scope. Is anything missing? Unrealistic? Overcomplicated?

2. **Add technical context** — Answer questions from the AI:
   - "Which existing components should be reused?"
   - "What's the best approach for state management here?"
   - "Are there edge cases the PM might not know about?"

3. **Sign off** — The developer's review is visible to the PM. Once the PM re-bakes and approves, the developer has a contract they trust.

4. **Execute** — With the full contract loaded via CLI or MCP, the developer (or AI agent) implements with complete context. No Slack threads. No guessing.

### Why developers adopt it

- Specs reference their actual codebase — not generic descriptions
- They have a voice BEFORE work begins — not after the PM "finalizes" the ticket
- The contract is clear — no "that's not what I meant" after three days of work
- AI agents execute better with Forge contracts — less rework, fewer corrections

## Choosing Your Configuration

Start simple and evolve:

1. **Starting out?** Use **PM only** to get familiar with ticket creation and the AEC format
2. **Ready for collaboration?** Add **developer review** — even without a codebase connection, the review step dramatically improves spec quality
3. **GitHub connected?** Enable **codebase context** for file-level precision in your specs
4. **AI agents in your workflow?** Add **`forge develop`** for the complete pipeline from spec to implementation

You can mix configurations across tickets. A quick bug fix might be PM-only. A major feature gets the full lifecycle. Forge adapts to each ticket's needs.
