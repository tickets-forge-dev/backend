---
title: "What is Forge?"
excerpt: "Forge turns messy ideas into verified execution contracts — so developers know exactly what to build."
category: "Getting Started"
---


A PM writes "Add auth." A developer spends two hours building the wrong thing. The ticket was clear to the PM. It was meaningless to the developer.

Forge kills that gap. It sits between the idea and the code — turning vague intent into a verified, machine-readable contract called an **Agent Execution Contract (AEC)**.

## Before and After

**Without Forge:**
```
PM: "Add user authentication"
Dev: "...to what? JWT? OAuth? Sessions? Which endpoints? What error messages?"
PM: "Uhh, use Google login I guess?"
Dev: *builds it* → *PM rejects it* → *3 days wasted*
```

**With Forge:**
```
PM: "Add user authentication" → answers 5 targeted AI questions
Dev: reviews spec, adds "we use Firebase Auth, reuse rate-limit middleware"
PM: approves → AEC locked

AEC contains:
  ✓ Acceptance Criteria: Given/When/Then (testable)
  ✓ File Changes: src/auth/auth.controller.ts (create), src/app.module.ts (modify)
  ✓ API Contract: POST /api/v1/auth/login → { token, expiresAt }
  ✓ Scope: Login/logout only. No password reset, no MFA.
  ✓ Quality Score: 87/100
```

The developer knows exactly what to build. The AI agent knows exactly what to build. No guessing.

## What's an AEC?

The AEC is the core artifact. It's not a ticket description — it's a **structured contract** that works for both humans and AI agents:

| Section | What It Contains | Why It Matters |
|---------|-----------------|----------------|
| **Acceptance Criteria** | Given/When/Then scenarios | Directly testable — no ambiguity |
| **File Changes** | Create, modify, delete with notes | Dev knows exactly where to work |
| **API Contracts** | Endpoints, payloads, error codes | Frontend and backend aligned |
| **Technical Context** | Patterns, dependencies, conventions | AI follows your codebase style |
| **Scope** | In-scope, out-of-scope, assumptions | No scope creep |
| **Quality Score** | 0–100 weighted validation | Blocks bad specs from shipping |

A ticket needs a quality score of **75+** to be forged. If the spec isn't clear enough, Forge won't let it through.

## Two Interfaces, One Contract

Forge meets each role where they already work:

**PMs use the web app** — a guided wizard that asks the right questions, generates specs, and lets you review developer feedback before approving.

**Developers use the CLI** — review specs with code context, answer technical questions the PM can't, and execute tickets with AI assistance.

Both produce and consume the same artifact: the AEC. The PM defines *what*, the developer adds *how*, and Forge validates the result.

## How It Differs from Jira/Linear

Forge is not a replacement for your project tracker. It's a **pre-execution layer** — where tickets get refined before they hit the backlog.

| | Jira / Linear | Forge |
|---|------------|-------|
| **Purpose** | Track work | Define work |
| **Output** | A task with a description | A verified contract with acceptance criteria, file changes, and API contracts |
| **Developer input** | After ticket is assigned | Before ticket is approved |
| **AI role** | Optional copilot | Core enrichment engine |
| **Quality gate** | Manual review | Automated scoring (75+ to pass) |

After a ticket is forged, export it to Jira or Linear. Forge handles the *what* and *how*. Your tracker handles the *when* and *who*.

## Two Ways to Enrich

Forge offers two paths to build an AEC:

1. **Developer enrichment** (recommended) — The developer uses the CLI to review the spec, add codebase context (which patterns to follow, which files to modify, edge cases), and submit Q&A. The PM reviews and approves. This path produces the best specs.

2. **Auto-enrichment** — During ticket creation, toggle on "Include repository context," select a repo and branch, and Forge's AI scans the codebase automatically. Faster, but less precise.

> :blue_book: Most teams use both: auto-enrichment for the first pass, then developer enrichment to add the nuance.

## Next Steps

- **PMs:** [Quickstart for PMs](/docs/getting-started/quickstart-pms) — Create your first ticket in the web app
- **Developers:** [Quickstart for Developers](/docs/getting-started/quickstart-developers) — Install the CLI and execute your first ticket
