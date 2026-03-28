# Forge — Investor Pitch Deck Source Document

**Company:** Forge (forgeaec.com)
**Category:** AI-powered developer workflow platform
**Stage:** Early access, working product, early users
**Tagline:** Complete tickets. Zero guesswork.
**One-liner:** Forge lets anyone — no technical background — produce engineering-grade, code-aware specs in minutes.

---

## SLIDE 1: Title Slide

**Headline:** Forge
**Subheadline:** The bridge between product vision and engineering execution
**Tagline:** Complete tickets. Zero guesswork.
**Visual suggestion:** Clean, dark-themed product screenshot showing the Forge UI with a completed ticket spec. The Forge logo prominent. Minimal text. Let the product speak.

---

## SLIDE 2: The Problem

**Headline:** Two worlds. No bridge.

**Key narrative:** In every software company, there are two sides:
- **The business side** (product managers, designers, founders) — they know exactly WHAT the product should do
- **The engineering side** (developers, architects) — they know exactly HOW to build it

Between them? Chaos.

**The current reality (show these as pain points):**
- PM writes a one-line ticket: "Add tag filtering"
- Developer asks 12 clarifying questions over 3 days in Slack
- Requirements get lost in threads, meetings, and docs
- Developer starts building based on assumptions
- PM reviews and says "that's not what I meant"
- Rework cycle begins

**Stat to display:** Teams spend 30-40% of engineering time on non-coding activities — reading specs, asking clarifying questions, context-switching between tools.

**Stat to display:** For a 50-person engineering team at $200K avg comp, this translation gap costs **$3-4M per year** in wasted cycles.

**Visual suggestion:** A split visual — clean "Product" side on the left, clean "Engineering" side on the right, and a chaotic mess in the middle (Slack threads, question marks, crossed-out requirements, meeting invites). Make the gap feel visceral.

---

## SLIDE 3: The Tooling Asymmetry

**Headline:** Engineers got AI superpowers. PMs got a blank text box.

**Key narrative:** Over the past 2 years, developers received incredible AI tools:
- GitHub Copilot (1.8M+ paid subscribers)
- Claude Code (Anthropic's AI coding agent)
- Cursor (AI-native code editor)
- Windsurf (AI development environment)

These tools can write entire features, refactor codebases, generate tests.

**But the input to all of these tools?** Still a half-baked ticket written by a PM staring at a blank text box in Jira.

**The punchline:** The AI agent is only as good as its instructions. Garbage in, garbage out. And right now, the instruction layer is completely unserved.

**Visual suggestion:** Left side shows a stack of modern AI developer tool logos (Copilot, Claude Code, Cursor, Windsurf) — sleek, powerful. Right side shows a sad, empty Jira ticket text box with a blinking cursor. The contrast should be stark and almost funny.

---

## SLIDE 4: The Solution — Forge

**Headline:** One sentence in. Complete spec out. No technical knowledge required.

**The Forge flow (show as a clean pipeline/funnel):**

1. **PM types one sentence** — "Users should be able to filter tickets by tags"
   - No technical knowledge needed. Just describe what you want in plain language.

2. **Forge reads the actual codebase** — Connects to GitHub, analyzes real code
   - Detects framework (Next.js, React, NestJS)
   - Maps file structure and architecture patterns
   - Understands existing components, state management, API routes
   - This is NOT a generic analysis — it reads YOUR real code

3. **Smart clarification in plain language** — Forge asks 5-8 targeted questions
   - "Should tag filters persist when the user navigates away?"
   - "Do you want single-select or multi-select filtering?"
   - "Should this work on mobile?"
   - Questions are informed by the codebase but asked in language any PM can understand
   - Like having a senior engineer interview the PM — but friendlier

4. **The execution contract is produced** — A complete, verified spec containing:
   - Problem statement with context and constraints
   - Step-by-step solution approach
   - Acceptance criteria in BDD format (Given/When/Then)
   - Exact file paths to modify (real files in the repo)
   - API contracts and data models
   - Test plan
   - Optional: generated wireframes showing the UI

5. **Developer reviews and agrees** — Structured review, not a Slack thread
   - Developer adds technical context, flags risks
   - Both sides sign off before work begins
   - The ticket becomes a CONTRACT, not a wish list

6. **AI agent or developer executes** — Full context, zero ambiguity
   - Developer types `/forge:develop` in Claude Code
   - Agent receives the complete contract via MCP protocol
   - Creates the correct branch, knows which files to touch
   - Starts implementing with perfect instructions

**Key stat:** From one sentence to developer coding: **under 3 minutes**

**Visual suggestion:** A clean left-to-right pipeline. Each step is a card/node. The input is tiny (one sentence). The output is rich (full spec document). Make the transformation feel magical but grounded. Use the actual Forge UI screenshots if possible.

---

## SLIDE 5: The Product — Key Screens

**Headline:** Built for PMs. Loved by developers.

**Show these product capabilities with screenshots or mockups:**

**For Product Managers:**
- **Ticket creation wizard** — Guided step-by-step experience. No blank page syndrome. The PM is walked through every decision.
- **Smart Q&A interface** — Questions appear in plain language. Multiple choice, text input, toggles. Feels like a conversation, not a form.
- **Generated spec view** — Beautiful, structured output. Problem statement, solution, acceptance criteria, file changes. The PM can see exactly what engineering will build.
- **Wireframe generation** — Forge generates HTML wireframes from the description alone. The PM sees what they're getting visually before engineering starts.

**For Developers:**
- **Developer review panel** — Structured review with ability to add context, flag risks, ask follow-ups. Not a comment thread — a formal review.
- **CLI integration** — `forge develop <ticket>` loads full context into Claude Code. Developer never leaves their editor.
- **MCP protocol** — Works with Claude Code, Cursor, Windsurf. The AI agent receives the complete contract and starts implementing.

**For Teams:**
- **Ticket grid** — Visual overview of all tickets with status, priority, tags, assignees
- **Folder organization** — Organize tickets into projects and categories
- **Jira/Linear sync** — Import issues, enrich with Forge, export back. One-click integration.

**Visual suggestion:** Product screenshots in a clean grid or feature showcase layout. Show the actual UI — it's polished and Linear-inspired. Dark mode preferred for modern feel.

---

## SLIDE 6: The Protocol — Define. Clarify. Agree. Build.

**Headline:** Not just better tickets. A better process.

**Key narrative:** Forge doesn't just produce better output — it enforces a protocol that changes how teams work:

**Stage 1: DEFINE** — PM describes intent in plain language
- One sentence is enough. Forge handles the rest.
- No technical knowledge barrier. PMs feel empowered, not intimidated.

**Stage 2: CLARIFY** — AI-guided Q&A informed by the actual codebase
- Questions a senior engineer would ask, in language a PM understands
- Multiple rounds if needed — each round gets deeper
- The codebase informs the questions: "Your TicketGrid uses Zustand for state — should filters persist across sessions?"

**Stage 3: AGREE** — Both PM and developer sign off
- Developer reviews the generated contract
- Adds technical context, flags concerns
- PM and developer explicitly agree on scope, acceptance criteria, and definition of done
- THIS is the moment that kills misunderstandings — before any code is written

**Stage 4: BUILD** — Execute with full context
- Developer or AI agent picks up the verified contract
- Every file path, every acceptance criterion, every architectural decision is documented
- No ambiguity. No rework. No "that's not what I meant."

**The insight:** You can't skip steps. The PM MUST clarify. The developer MUST review. That's not friction — that's the quality gate that eliminates the $3-4M/year waste.

**Visual suggestion:** A clean 4-step horizontal flow diagram. Each step has an icon and a brief description. An arrow connects them left to right. Below the flow, show the status progression: DRAFT → APPROVED → REFINED → EXECUTING → DELIVERED. Make it feel like a state machine — structured and inevitable.

---

## SLIDE 7: AI Agent Integration — The Multiplier

**Headline:** We don't compete with AI agents. We make them 10x better.

**Key narrative:** AI coding agents (Claude Code, Cursor, Windsurf) are transforming how code gets written. But they all share one weakness: they need high-quality instructions.

**Without Forge:**
- Developer tells Claude Code: "Add tag filtering to the ticket grid"
- Claude guesses the file structure, invents component names, misses edge cases
- Developer spends 30 minutes correcting AI assumptions
- Result: mediocre code that needs heavy revision

**With Forge:**
- Claude Code receives a complete Forge contract via MCP:
  - Exact files to modify: `TicketGrid.tsx`, `tags.store.ts`, `ticket.service.ts`
  - Acceptance criteria: "Given a user selects 'urgent' tag, when the grid refreshes, then only tickets with 'urgent' tag are shown"
  - Architecture: "Use Zustand store action, filter in the selector, persist to URL params"
  - Test plan: "Unit test the store action, integration test the grid filtering"
- Claude builds the RIGHT thing, first time
- Developer reviews clean code that matches the spec exactly

**How it works technically:**
- Forge exposes a **Model Context Protocol (MCP) server**
- Any MCP-compatible tool can read Forge tickets natively
- Currently works with: Claude Code, Cursor, Windsurf
- Developer types `/forge:develop` → full context loaded → branch created → implementation begins

**The key line:** "Claude Code with Forge is a developer with perfect instructions. Claude Code without Forge is a developer with a Post-it note."

**Visual suggestion:** Split screen comparison. Left: "Without Forge" — messy, wrong assumptions, red X marks. Right: "With Forge" — clean, precise, green checkmarks. Below: logos of supported AI tools (Claude Code, Cursor, Windsurf) connected to the Forge logo via MCP.

---

## SLIDE 8: Market Opportunity

**Headline:** The input layer for the $45B AI developer tools market.

**Market context:**
- AI developer tools market projected to reach **$45B by 2028** (growing 25%+ annually)
- GitHub Copilot: **$2B ARR** (fastest-growing developer product ever)
- Cursor: **$100M ARR** in under 2 years
- Developer productivity platforms: **$7B market**, growing 13% annually
- Every company with 10+ engineers needs structured spec creation — that's **500,000+ companies** globally

**Our position in the ecosystem:**
- **Project management tools** (Jira, Linear, Asana) → store and track tasks → $7B market
- **AI coding tools** (Copilot, Cursor, Claude Code) → write code from instructions → $45B market
- **Forge** → produce the instructions → the missing layer between them

**Nobody else occupies this position.** Jira can't read your codebase. Copilot can't negotiate requirements. Notion AI generates generic text. Forge is the only product that translates human intent into verified, code-aware execution contracts.

**TAM calculation:**
- 500K+ companies with 10+ developers
- Average deal size: $10K ARR (40 seats at $25/month)
- Serviceable market (English-speaking, tech-forward): 150K companies
- **SAM: $1.5B**
- 1% penetration = $15M ARR
- 5% penetration = $75M ARR

**Visual suggestion:** An ecosystem diagram showing three layers — Project Management (bottom), Forge (middle, highlighted), AI Coding Tools (top). Arrows flow upward: Jira/Linear → Forge → Claude Code/Cursor/Windsurf. Forge is the glue layer. Include market size numbers next to each layer.

---

## SLIDE 9: Business Model

**Headline:** Land with PMs. Expand to every developer.

**Pricing model: Per-seat SaaS**

| Tier | Who | Price | What they get |
|------|-----|-------|---------------|
| **Free** | Individual developers & PMs | $0 | 5 tickets/month, basic codebase analysis, Forge CLI |
| **Pro** | Small teams (5-20 people) | $25/user/month | Unlimited tickets, Jira/Linear integration, full MCP, wireframe generation, team folders |
| **Enterprise** | Organizations (50+ devs) | Custom pricing | SSO/SAML, audit logs, CLI-only mode (no GitHub OAuth needed), dedicated support, SLA |

**Revenue math:**
- A 50-person engineering org at $25/seat = **$15K ARR per customer**
- 100 customers = $1.5M ARR
- 1,000 customers = $15M ARR

**Expansion motion:**
1. **Land with PMs** — they create the first tickets and experience the magic
2. **Pull in developers** — developers see their first Forge-generated spec and never want to go back to vague tickets
3. **Team-wide adoption** — the protocol becomes the standard. Every team member needs a seat.
4. **Enterprise expansion** — one team adopts → adjacent teams see the quality difference → org-wide rollout

**Unit economics:**
- LLM cost per ticket: $0.10-0.30
- Average tickets per user per month: 15-20
- LLM cost per user per month: ~$3-5
- Gross margin at $25/seat: **80%+**
- Models get cheaper every quarter → margins improve automatically

**Visual suggestion:** Clean pricing table on the left. Expansion funnel on the right showing: PM adopts → Developer joins → Team standard → Org rollout. Below: unit economics showing healthy margins.

---

## SLIDE 10: Competitive Landscape

**Headline:** The layer nobody else is building.

**Competitive positioning matrix:**

| | Reads your codebase | Guided PM experience | Enforces protocol | Feeds AI agents | Integrates with Jira/Linear |
|---|---|---|---|---|---|
| **Forge** | Yes | Yes | Yes | Yes (MCP) | Yes |
| **Jira/Linear** | No | No | No | No | N/A (they ARE the tracker) |
| **Copilot/Cursor** | Yes (code only) | No (developer only) | No | N/A (they ARE the agent) | No |
| **Notion AI/Coda AI** | No | No | No | No | No |
| **Internal templates** | No | No | Partially | No | Varies |

**Key competitive one-liners:**
- "Jira stores tickets. We produce them."
- "Copilot writes code. We tell it what to write."
- "Linear is beautiful task management. Forge is intelligent task creation."
- "Notion AI generates generic text. Forge generates code-aware specs that reference your actual repo."
- "We're the layer nobody else is building — between product intent and code execution."

**Why competitors can't just add this:**
- **Jira/Linear** would need to build: GitHub integration, code analysis engine, LLM pipeline, MCP server, PM-friendly UX. That's a new product, not a feature.
- **Copilot/Cursor** are developer tools — they'd need to build: PM experience, requirement negotiation, approval workflows. Completely different user persona.
- **Notion AI** has no code understanding — generic text generation can't produce file-specific, architecture-aware specs.

**Visual suggestion:** A 2x2 matrix or comparison grid. Forge stands alone in the top-right quadrant (high code awareness + high PM accessibility). Everyone else is in other quadrants. Clean, modern, data-driven.

---

## SLIDE 11: The Moat

**Headline:** Workflow product. Not a model capability.

**Three compounding moats:**

**1. Codebase understanding compounds**
- Every ticket Forge creates deepens understanding of the team's codebase
- Project profiles capture architecture patterns, naming conventions, testing approaches
- Over time, Forge becomes uniquely tuned to YOUR repo — a new competitor starts from zero

**2. Team workflow lock-in**
- Once "define → clarify → agree → build" becomes the team's standard, switching costs are enormous
- Ticket history, codebase profiles, team preferences — all locked into Forge
- PMs learn the clarification flow; developers learn the review process; the protocol becomes muscle memory

**3. Process innovation, not model dependence**
- This is a WORKFLOW product, not a thin AI wrapper
- You don't solve structured negotiation between PMs and engineers by making the LLM smarter
- The value is in the PROCESS: guided clarification, mutual agreement, verified contracts
- If Claude gets 10x better tomorrow, Forge gets 10x better too — we use AI, we don't compete with it

**The key insight for investors:** "Every AI wrapper company dies when the model improves. Forge gets BETTER when the model improves. We're a workflow layer, not an intelligence layer."

**Visual suggestion:** Three concentric circles or three pillars. Each moat is one layer/pillar. Center: "Forge Protocol." Clean, architectural feel. Maybe show a timeline: Month 1 (basic) → Month 6 (tuned) → Month 12 (essential) — showing how the moat deepens over time.

---

## SLIDE 12: Traction & Validation

**Headline:** Early access. Strong signals.

**Fill in with your real numbers. Frame quality over quantity.**

**Key metrics to show:**
- Teams in early access: [X]
- Tickets created: [X]
- Average time from idea to complete spec: ~3 minutes
- User retention signal: "Once a team uses Forge for one sprint, the PM stops writing tickets any other way"

**Qualitative signals:**
- [User quote about time savings]
- [User quote about spec quality]
- [User quote about developer satisfaction]

**Product maturity signal:**
- 111,000 lines of production TypeScript code
- 46K backend (NestJS, clean architecture) + 46K frontend (Next.js, React 19)
- 316 backend files, 211 frontend components
- Full integrations: GitHub, Jira, Linear, MCP standard
- This is not a prototype. This is production-grade software built by an engineer who lived this problem.

**Visual suggestion:** Big numbers in the center. User quotes in styled callout cards below. Product stats as a subtle footer. Clean, confident, not cluttered. If you have a screenshot of a real Forge-generated spec, show it here as proof of quality.

---

## SLIDE 13: Technology & Architecture

**Headline:** Production-grade. Not a weekend hack.

**Tech stack:**
- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, Zustand
- **Backend:** NestJS 10, TypeScript, Clean Architecture (Domain-Driven Design)
- **AI:** Anthropic Claude via Vercel AI SDK
- **Database:** Firebase Firestore
- **Auth:** Firebase Authentication (Google, GitHub OAuth)
- **CLI:** Standalone TypeScript CLI with embedded MCP server
- **Integrations:** GitHub API (Octokit), Jira REST API, Linear GraphQL API
- **Background jobs:** Bull queue (Redis-backed)

**Architecture highlights:**
- **Clean Architecture:** Presentation → Application → Domain ← Infrastructure. Domain has zero framework dependencies.
- **Agent Execution Contract (AEC):** Core domain entity with explicit state machine lifecycle: DRAFT → DEFINED → REFINED → APPROVED → EXECUTING → DELIVERED
- **Two-layer codebase analysis:** Static project profile (big picture) + dynamic file reads (ticket-specific context)
- **MCP standard:** Any compatible AI tool can consume Forge tickets natively

**Why this matters to investors:** This isn't an API wrapper or a prompt template. It's a full-stack product with proper architecture, separation of concerns, and production-grade infrastructure. The 111K LOC isn't bloat — it's depth.

**Visual suggestion:** A clean architecture diagram showing the layers. Or a tech stack grid with logos. Keep it simple — this slide is for technical investors who want to verify depth. Don't over-design it.

---

## SLIDE 14: The Team

**Headline:** [Your name and story]

**Key points to convey:**
- Founder-market fit: "I've lived this problem as a [PM/developer/tech lead] for [X] years"
- Technical credibility: solo-built 111K lines of production code with clean architecture
- Speed of execution: shipped a complete platform including backend, frontend, CLI, and integrations
- Dogfooding: "We use Forge to build Forge" — the product builds itself

**Visual suggestion:** Founder photo. Brief bio. Key credential highlights. Maybe a quote: "I built Forge because I was tired of watching great ideas turn into terrible tickets."

---

## SLIDE 15: The Ask

**Headline:** Raising [amount] to [goal]

**Use of funds:**
| Category | Allocation | What it enables |
|----------|------------|----------------|
| **Product** | 50% | Enterprise features (SSO, audit logs), AI quality improvements, expanded MCP integrations, PRD breakdown feature |
| **Growth** | 30% | Product Hunt launch, developer community presence, content marketing, first 100 paying teams |
| **Team** | 20% | First engineering hire(s), developer advocate |

**Milestones this funding unlocks:**
- Launch publicly on Product Hunt and Hacker News
- Reach 100 paying teams within 6 months
- Ship enterprise tier (SSO, audit, CLI-only mode)
- Establish Forge as the standard input layer for AI coding agents

**Visual suggestion:** Clean use-of-funds pie chart or bar. Milestone timeline below showing quarterly targets. Forward-looking but grounded.

---

## SLIDE 16: Vision / Closing Slide

**Headline:** The standard for how humans tell AI what to build.

**Closing narrative:**
> "The future of software development is structured collaboration between human intent and AI execution. AI agents will write most of the code. But someone has to define what 'done' looks like. Someone has to translate the PM's vision into verified instructions the agent can execute.
>
> That's Forge. We believe the best software gets built when everyone agrees on what 'done' means before anyone starts building. We're building the protocol that makes that inevitable."

**Visual suggestion:** The Forge logo, large and centered. The tagline below. Clean, confident, memorable. Maybe a subtle visual of the pipeline: Human intent → Forge → AI execution. End on strength.

---

## APPENDIX: Ammunition Quick Reference

### 10-Second Pitches
- "Forge lets anyone — no technical background — produce engineering-grade specs in minutes."
- "We're the bridge between 'I want this feature' and 'the developer starts building.'"
- "Jira is a filing cabinet. Forge is the intelligent conversation that happens before you file anything."
- "We close the most expensive gap in software — the translation between what product wants and what engineering builds."
- "PMs answer 6 plain-language questions. Out comes a complete technical spec with file paths, acceptance criteria, and architecture decisions."

### 30-Second Elevator Pitches

**Business Gap:** "In every software company, product managers know WHAT to build, and engineers know HOW. But between them is chaos — Slack threads, misunderstandings, rework. No tool serves that gap. Forge does. A PM types one sentence, Forge guides them through a smart clarification, and produces a complete code-aware spec that both sides agree to. The chaos disappears because the process won't allow it."

**PM Empowerment:** "Product managers have been abandoned by tooling. Engineers got Copilot, Claude Code, Cursor — incredible AI. PMs got a blank text box in Jira. Forge is the first tool that makes PMs dangerous. They describe what they want, Forge translates it into an engineering-grade execution contract — no technical knowledge required. Suddenly the PM's output is as precise as a senior engineer's spec."

**Protocol:** "Most teams have no shared standard for what a ticket should look like before work begins. So every ticket is different quality, every handoff is a negotiation. Forge enforces a protocol: define, clarify, agree, build. Both PM and developer sign off on a verified contract before a single line of code is written. Teams that adopt it can't go back."

**AI Agent:** "AI coding agents are the biggest wave in dev tools — but they have a garbage-in-garbage-out problem. Ask Claude Code to 'add dark mode' and it guesses everything. Feed it a Forge contract — with exact file paths, acceptance criteria, architecture decisions — and it builds the right thing first time. We're the input layer that makes every AI agent actually work."

**Market Timing:** "Three things just converged: LLMs are good enough to generate real technical specs. MCP created a standard protocol so any AI tool can read our output. And agentic coding went mainstream — but agents need instructions. PMs still have a blank text box. That asymmetry is our entire market."

**Cost:** "For a 50-person engineering team at $200K average comp, the translation gap between product and engineering costs $3-4M per year in wasted cycles. Forge eliminates it for $25 per seat per month."

### Objection Killers

**"Can't teams just write better tickets?"** — They've been trying for 20 years. The problem isn't effort — it's that PMs don't have the technical context to write complete specs. Forge provides that context automatically.

**"Why can't Jira/Linear just add AI?"** — They could add AI descriptions. But they can't read your codebase — that requires deep GitHub integration and code analysis. And even if they did, they'd bolt it onto a filing system. Our entire product is the spec workflow. It's not a feature for us — it's the whole product.

**"But Claude Code already reads my codebase"** — Reading code and understanding intent are two different things. Claude Code can see your entire house — but without a work order, it doesn't know what to renovate. Forge produces the work order by talking to the PM and reading the blueprints simultaneously.

**"What if AI replaces PMs entirely?"** — AI will write more code, not less specs. The more autonomous the agent, the MORE important the instructions are. Someone has to define what 'done' looks like. Forge makes that definition rigorous.

**"This seems like a feature, not a product"** — Structured negotiation between two groups of people with different vocabularies, enforced by a protocol, producing verified contracts — that's not a feature. That's a platform.

**"Why would developers adopt this?"** — Developers hate one thing more than new tools: vague tickets. Forge is the first tool where adoption actually reduces their pain.

**"What's the moat?"** — Three layers. Codebase understanding compounds. Team workflow lock-in. And this is a workflow product, not a model capability — you don't solve it by making the AI smarter.

**"Why now?"** — LLMs just got good enough. MCP just created a universal protocol. AI coding went mainstream but agents need instructions. Three tailwinds, one product.

### Vision Statements
- "The future of software is structured collaboration between human intent and AI execution. Forge is the standard."
- "We're building the protocol for how teams go from idea to code — with AI as the accelerant, not the replacement."
- "Every team deserves the clarity that used to require a senior engineering manager in the room. Forge puts that in the product."
- "We believe the best software gets built when everyone agrees on what 'done' means before anyone starts building."
