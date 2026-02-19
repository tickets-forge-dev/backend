# Forge Turns "Add Auth" Into a Complete Engineering Spec—In 2 Minutes

## I built it because I was tired of wasting 3 days on 5-word tickets.

---

## What Is Forge?

**Forge reads your GitHub repo and turns a PM's simple idea into a complete, developer-ready spec.**

Not a vague ticket. A **full execution plan** with everything a developer needs to start coding immediately.

---

## Before vs. After

### ❌ Before Forge:

**Ticket:** "Add user authentication"

**Developer:**
- *"Which APIs?"*
- *"What about sessions?"*
- *"OAuth or JWT?"*

**Result:** 17 Slack messages, 3 days wasted, wrong solution built.

---

### ✅ After Forge:

**Ticket:** "Add user authentication"

**Forge Output:**
- Files to modify: `auth.service.ts`, `user.controller.ts`
- Files to create: `jwt.strategy.ts`
- API endpoints: `POST /auth/login`, `POST /auth/refresh`
- 8 acceptance criteria (BDD format)
- 12 unit tests defined

**Result:** Developer starts coding. Zero questions.

---

## See It In Action (90 seconds)

[VIDEO EMBED HERE]

*Watch a PM go from "add password reset" to a complete, Jira-ready spec—no technical knowledge required.*

---

## How It Works (Quick Version)

**1. PM describes the feature** → "Add password reset"

**2. Forge asks clarifying questions** (plain English)
- "Time-limited link or code?"
- "Expire after one use?"

**3. Forge reads your codebase** (secure, no cloning)
- Scans GitHub repo (read-only)
- Detects your tech stack
- Finds existing patterns
- Identifies file changes needed
- Understands your API structure
- Pulls Figma design metadata (if attached)

**4. Generates complete spec**
- Problem + Solution
- Acceptance criteria
- Exact files to change
- API endpoints
- Test plan

**5. Exports to Jira/Linear**
- Markdown spec
- AEC XML (for AI agents)
- Link back to Forge

---

## What Forge Connects To

**✅ GitHub** - Reads your codebase (currently supported)

**✅ Jira** - Export complete specs directly to Jira issues

**✅ Linear** - Export and sync tickets automatically

**✅ Figma** - Attach design files and extract metadata

**✅ Your APIs** - Auto-detects and understands your API structure

**All integrations are secure and read-only.** Your code stays on GitHub.

---

## "Why Not Just Use ChatGPT?"

**ChatGPT doesn't know your codebase.**

You say "add password reset." It gives you generic code.

But it doesn't know:
- Your app uses JWT, not sessions
- You already have half a reset flow
- Your API patterns
- Your email service setup

**ChatGPT guesses. Forge knows.**

---

## "What About Cursor or Copilot?"

**Those are amazing for developers who know what to build.**

But they require:
- VS Code (most PMs don't use it)
- Git knowledge (most PMs don't have it)
- Coding skills (not the PM's job)

**90% of PMs are non-technical. That's fine.**

Forge bridges the gap.

---

## Forge Works With Your Tools

**Forge doesn't replace Jira or Linear.** It makes your tickets actually useful.

**Workflow:**
1. Create spec in Forge (2 min)
2. Export to Jira/Linear (1 click)
3. Developer gets complete context
4. No questions, just code

**Same tools. Better inputs.**

All your tickets include:
- Complete markdown spec
- Attachments (tech-spec.md, aec.xml, tech-spec.json)
- Link back to Forge for full context

---

## The Real Problem

In 2026, we have:
- AI that writes code
- AI that reviews PRs
- AI that generates tests

**But we still have bad tickets.**

Why? Because PMs and developers speak different languages.

- **ChatGPT** = Doesn't know your project
- **Cursor/Copilot** = Requires coding knowledge
- **Forge** = Translates PM → Developer

**You need all three. But only Forge fixes bad tickets at the source.**

---

## Why This Matters

Bad tickets don't just waste time—they destroy momentum.

Every "quick question" means:
- Lost developer flow
- Context switching
- Repeated PM explanations
- Missed edge cases
- Unexpected rework

**Forge eliminates the ping-pong before it starts.**

---

## Who Is Forge For?

**✅ For You If:**
- You've sent a ticket and gotten 5 questions back
- Developers spend more time asking than coding
- "Simple features" always need unexpected backend work

**❌ Not For You If:**
- You're a technical PM who codes
- Your team has no communication issues
- You love 17-message Slack threads

---

## Try It

**Forge:** [forge-ai.dev](https://forge-ai.dev)

Great PMs shouldn't need to be great developers.

They just need great tools.

---

> *"The best teams don't move fast because they code faster. They move fast because they waste less time on confusion."*

---

**Built by a developer who was tired of bad tickets.**

**Tags:** #ProductManagement #AI #Productivity #Jira #DeveloperTools
