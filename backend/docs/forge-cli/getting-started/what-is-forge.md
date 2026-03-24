---
title: "What is Forge?"
excerpt: "The bridge between product vision and engineering execution — complete tickets, zero guesswork."
category: "Getting Started"
---


In every software company, there are two worlds. Product managers know **what** to build. Engineers know **how** to build it. Between them? Slack threads, misunderstandings, and rework.

Forge closes that gap. A PM describes what they want in one sentence. Forge reads the actual codebase, asks the right clarification questions in plain language, and produces a complete, code-aware execution contract — with acceptance criteria, file paths, architecture decisions, and a test plan.

No technical knowledge required. No blank text boxes. No guessing.

## The Problem Forge Solves

Engineers got AI superpowers — Copilot, Claude Code, Cursor, Windsurf. These tools can write entire features.

PMs got a blank text box in Jira.

The AI agent is only as good as its instructions. And right now, those instructions are a one-line ticket and a prayer. The result: wasted sprints, rework cycles, and the most expensive gap in software — the translation between what product wants and what engineering builds.

## How Forge Works

Forge replaces chaos with a structured protocol: **Define → Clarify → Agree → Build.**

### 1. Define

The PM types one sentence: *"Users should be able to filter tickets by tags."*

That's it. No technical knowledge needed. Just describe the outcome in plain language. Optionally dictate it with voice — press **S** and speak.

### 2. Clarify

Forge connects to your GitHub repo and reads your actual code — framework, file structure, architecture patterns, existing components. Then it asks 5–8 targeted questions in plain language:

- *"Should tag filters persist when the user navigates away?"*
- *"Do you want single-select or multi-select filtering?"*
- *"Should this work on mobile?"*

These aren't generic questions. They're informed by your codebase — like having a senior engineer interview you, but friendlier.

### 3. Agree

Out comes a complete **Agent Execution Contract (AEC)**:

```
✓ Problem statement with context and constraints
✓ Acceptance criteria: Given/When/Then (testable)
✓ File changes: TicketGrid.tsx (modify), tags.store.ts (create)
✓ API contracts: GET /api/tickets?tags=urgent → filtered results
✓ Scope: In (tag filtering, multi-select) / Out (tag management admin)
✓ Quality score: 87/100
✓ HTML wireframe of the proposed UI
```

The developer reviews the contract, adds technical context, and both sides sign off. This is the moment misunderstandings die — before any code is written.

### 4. Build

The developer opens Claude Code, types `/forge:develop`, and the AI agent receives the full contract. It knows exactly which files to touch, what acceptance criteria to hit, and what "done" looks like. It creates the branch and starts implementing.

**One sentence → codebase analysis → smart clarification → verified contract → agent implements. Minutes, not days.**

## The AEC: Not a Ticket — A Contract

The AEC is the core artifact in Forge. It's not a task description. It's a structured, validated contract that both humans and AI agents can execute against.

| Section | What It Contains | Why It Matters |
|---------|-----------------|----------------|
| **Acceptance Criteria** | Given/When/Then scenarios | Directly testable — no ambiguity |
| **File Changes** | Exact paths to create, modify, delete | Developer knows exactly where to work |
| **API Contracts** | Endpoints, payloads, error codes | Frontend and backend aligned |
| **Technical Context** | Patterns, dependencies, conventions | AI follows your codebase style |
| **Scope** | In-scope, out-of-scope, assumptions | No scope creep |
| **Wireframes** | AI-generated HTML preview of the UI | PM and developer see the same picture |
| **Quality Score** | 0–100 weighted validation | Blocks bad specs from shipping |

A ticket needs a quality score of **75+** to be forged. If the spec isn't clear enough, Forge won't let it through.

## Two Interfaces, One Contract

Forge meets each role where they work:

**PMs use the web app** — a guided wizard that asks the right questions in plain language, generates specs and wireframes, and lets you review developer feedback before approving.

**Developers use the CLI** — review specs with code context, answer technical questions the PM can't, and execute tickets with AI assistance directly in Claude Code, Cursor, or Windsurf.

Both produce and consume the same artifact: the AEC. The PM defines *what*, the developer adds *how*, and Forge validates the result.

## Stay Organized as You Scale

Forge isn't just for creating tickets — it's where your team manages the full picture.

### Folders

Group related tickets into **folders** — collapsible sections in your feed. Create a folder for each project, epic, or sprint. Drag tickets in and out. Keep folders **team-visible** for shared projects or **private** for your own workspace.

### Tags

Add **colored tags** to any ticket — "urgent", "backend", "v2", whatever fits your workflow. Filter your dashboard by tags to focus on what matters right now. Tags are shared across the team, so everyone uses the same vocabulary.

### Scope Control

Every AEC includes a clear **scope** section that defines what's in and what's out:

- **In scope** — What this ticket covers (e.g., "Tag filtering on the grid, multi-select, URL persistence")
- **Out of scope** — What it explicitly does NOT cover (e.g., "Tag management admin panel, bulk tag operations")
- **Assumptions** — What we're taking for granted (e.g., "Existing API supports tag queries")

This is one of the most powerful parts of Forge. Scope boundaries are set *before* work begins, so there's no scope creep, no "can you also add..." surprises, and no wasted effort on things that weren't agreed upon.

---

## How Forge Fits Your Stack

Forge is not a replacement for your project tracker. It's the intelligence layer that sits before it.

| | Jira / Linear | Forge |
|---|------------|-------|
| **Purpose** | Track work | Define work |
| **Input** | Blank text box | Guided AI wizard |
| **Output** | Task with a description | Verified contract with criteria, file paths, API specs, wireframes |
| **Developer input** | After ticket is assigned | Before ticket is approved |
| **AI role** | Optional copilot | Core enrichment engine |
| **Quality gate** | Manual review | Automated scoring (75+ to pass) |

After a ticket is forged, export it to Jira or Linear with one click. Forge handles the *what* and *how*. Your tracker handles the *when* and *who*.

## AI Agent Integration

Forge plugs into AI coding agents via the **Model Context Protocol (MCP)**:

- **Claude Code** — `/forge:develop` loads the full contract
- **Cursor** — MCP server provides ticket context natively
- **Windsurf** — Same MCP integration

The agent doesn't guess your file structure or invent component names. It gets verified instructions: exact files, acceptance criteria, architecture decisions. The result: the right code, first time.

## Two Ways to Enrich

1. **Developer enrichment** (recommended) — The developer uses the CLI to review the spec, add codebase context (which patterns to follow, which files to modify, edge cases), and submit Q&A. The PM reviews and approves. This path produces the best specs.

2. **Auto-enrichment** — During ticket creation, connect a GitHub repo and Forge's AI scans the codebase automatically. Faster, but less precise.

> :blue_book: Most teams use both: auto-enrichment for the first pass, then developer enrichment to add the nuance.

## Next Steps

- **PMs:** [Quickstart for PMs](/docs/getting-started/quickstart-pms) — Create your first ticket in the web app
- **Developers:** [Quickstart for Developers](/docs/getting-started/quickstart-developers) — Install the CLI and execute your first ticket
- **Team setup:** [Team Workflows](/docs/core-concepts/team-workflows) — See the different ways to configure Forge for your team
- **Deep dive:** [The AEC](/docs/core-concepts/aec) — Understand every section of the execution contract
