# Epic 18 — Cloud Develop (Unified Vision)

**Date:** 2026-03-29
**Status:** Draft
**Supersedes:** Epic 17 (Cloud Develop API-Only)
**Complements:** Epic 16 (MCP Bridge — developer tier)

---

## Summary

Close the loop on Forge's ticket lifecycle. A PM clicks "Develop" on an approved ticket, and Forge runs the real Claude Code CLI in a cloud sandbox, fully autonomous. Claude reads the spec, follows acceptance criteria, implements the feature, runs tests, logs decisions, and creates a PR. A developer reviews and merges.

**Auto-flight mode**: Claude never asks questions. It makes all decisions autonomously, choosing the most standard/recommended approach, and logs every decision via MCP so the reviewing developer has full context. The user can watch the progress or walk away — they'll be notified when the PR is ready.

**Critical constraint**: This runs the REAL Claude Code CLI — not a wrapper, not our own agent. Claude's content is 100% genuine. Our layer is purely visual. The user gets the exact same quality as running `claude` in their terminal, because it IS `claude` running in a terminal.

---

## Two Entry Points, Same Engine

### 1. Ticket-First (Primary Flow)

PM writes a detailed ticket with spec and acceptance criteria → clicks "Develop" → Claude implements → PR created → developer reviews.

```
Write ticket → Refine → Approve → ⚡ Develop → PR → Dev reviews
```

### 2. Quick Change (Reverse Flow)

PM picks a repo and types what they want in plain text → Claude implements immediately → PR + ticket auto-generated for developer review.

```
Pick repo → Type change → ⚡ Start → PR + ticket auto-generated → Dev reviews
```

Both flows use the same sandbox, same CLI, same auto-flight, same monitoring UI. The only difference is the input: structured spec vs plain text.

---

## Competitive Positioning: Brownfield, Not Greenfield

Forge serves teams with **existing codebases** — not greenfield app creation.

| | Lovable/Bolt ($20/mo) | Forge ($39-199/mo) |
|---|---|---|
| Use case | "Build me a new app" | "Ship features into our existing product" |
| Codebase | Generates in a vacuum | Reads YOUR repo, follows YOUR patterns |
| Quality | Prototype | Production (real CLI) |
| Testing | None | Runs YOUR test suite |
| Review flow | None | PR → developer reviews → merge |
| Audit trail | None | Change Record with decisions/risks |

**Forge doesn't compete with Lovable.** Different market:
- Lovable = zero to one (greenfield)
- Forge = one to N (existing products, ongoing development)

### Value Proposition

Forge doesn't replace developers. It changes their role from WRITER to REVIEWER.

```
Without Forge:
  2 developers at $24,000/mo total
  Ship ~20 features/month
  Cost per feature: ~$1,200
  PM waits for dev availability

With Forge:
  2 developers at $24,000/mo total   ← same headcount
  Forge Team at $99/mo               ← tiny add-on
  Ship ~60-80 features/month         ← 3-4x throughput
  Cost per feature: ~$400
  PM triggers development anytime
```

---

## Business Model: Forge-Provided API Key

Users never see an API key. They click "Develop" and it works. Forge provides the Anthropic API key and charges through the subscription.

### Pricing

| Plan | Price | Developments/mo | Target |
|---|---|---|---|
| **Free** | $0 | 2 | Try it, get hooked |
| **Pro** | $39/mo | 20 | Solo PMs, small teams |
| **Team** | $99/mo | 50 | Growing teams |
| **Scale** | $199/mo | Unlimited (fair use 100) | Ship fast |
    
BYOK exists as advanced escape hatch in Settings → API Keys.

### Cost Control

- Session duration cap: 30 min (Pro), 60 min (Team/Scale)
- Failed/cancelled sessions don't count (only successful PRs deduct)
- Budget pre-check before starting
- Usage metering via Claude's `result` event (`cost_usd` field)

### Framing

Don't sell "sessions." Sell outcomes. Pricing page says "developments" not "sessions." Show: "Ship up to 20 features this month."

---

## Auto-Flight: Claude Never Asks, Always Decides

This is the core UX principle. Claude runs fully autonomously in every session.

### System Prompt

```
You are implementing a ticket on an existing codebase.

RULES:
- NEVER ask the user questions. Make all decisions autonomously.
- When facing multiple approaches, choose the one that:
  1. Follows existing patterns in the codebase (read CLAUDE.md first)
  2. Is the most standard/recommended approach
  3. Requires the least change surface
- Log every significant decision via MCP record_execution_event
  so the reviewing developer understands your choices.
- Use TDD: write failing tests first, then implement, then verify.
- Verify your work before claiming completion.
- Run the full test suite after making changes. Fix failures.
- When done, commit, push, and call MCP submit_settlement.
- If a Superpowers skill applies (TDD, debugging, verification),
  follow its guidelines but NEVER pause for user input.

{TICKET CONTEXT via MCP OR USER'S PLAIN TEXT}
```

### Why Auto-Flight

1. **PMs can't answer technical questions.** "Bull queue or inline retry?" — they don't know. Claude should pick.
2. **Faster sessions.** No human waiting = Claude runs at full speed. 5-15 min instead of 30 min.
3. **True click-and-forget.** PM clicks Develop, gets notified when PR is ready.
4. **Decisions are tracked.** Claude logs every choice via MCP `record_execution_event`. The developer sees the full decision trail in the Change Record.
5. **Simpler architecture.** One-way stream, no stdin, no chat input, no permission UI.

### Decision Trail (Change Record)

Even though the user doesn't interact, every decision is captured:

```
Change Record (auto-generated):
├── Decision: Used Bull queue pattern (matches BackgroundFinalizationService)
├── Decision: Exponential backoff 1s/2s/4s/8s (industry standard)
├── Decision: Max 5 retries (matches project's existing configs)
├── Risk: No dead-letter queue yet — logged for future ticket
├── Files: 3 modified, 1 created
├── Tests: 18 passed, 0 failed
└── PR #42 created on feat/aec-2437-webhook-retry
```

---

## How It Works: The Enforced Workflow

The cloud sandbox runs Claude Code with Forge's MCP tools pre-configured. These tools enforce the ticket lifecycle automatically.

### The Full Loop

```
PM in Forge:
  1. Writes ticket (AI-assisted spec generation)        ← already built
  2. Reviews & refines with AI Q&A                       ← already built
  3. Approves ticket                                     ← already built
  4. Clicks "Develop"                                    ← THIS FEATURE
     │
     │  Inside the sandbox (auto-flight):
     ├─ MCP: get_ticket_context         ← reads spec + acceptance criteria
     ├─ MCP: get_repository_context     ← reads project profile + CLAUDE.md
     ├─ MCP: get_file_changes           ← knows which files to touch
     ├─ MCP: start_implementation       ← ticket → EXECUTING
     ├─ (Reads, edits, creates files)   ← actual coding, no questions asked
     ├─ (Runs tests, fixes failures)    ← quality assurance
     ├─ MCP: record_execution_event     ← logs decisions/risks (auto, not asked)
     ├─ (Commits and pushes)            ← git operations
     ├─ MCP: submit_settlement          ← Change Record created
     └─ ticket → DELIVERED
     │
  5. PR created on GitHub                                ← automatic
  6. Developer reviews PR + Change Record                ← existing flows
  7. Done.
```

### Quick Change Flow

```
PM in Forge:
  1. Clicks "Quick Change"
  2. Selects project/branch from dropdown
  3. Types: "Add rate limiting to /api/users. Max 100 req/min per API key."
  4. Clicks "Start"
     │
     │  Inside the sandbox (auto-flight):
     ├─ MCP: get_repository_context     ← reads project profile + CLAUDE.md
     ├─ (Reads codebase, implements)    ← no spec, just user's text
     ├─ (Runs tests, fixes failures)
     ├─ MCP: record_execution_event     ← logs all decisions
     ├─ (Commits and pushes)
     └─ MCP: submit_settlement          ← Change Record created
     │
  5. PR created on GitHub
  6. Ticket auto-generated in Forge with:
     - Title derived from user's text
     - Spec reverse-engineered from what Claude did
     - Change Record attached
     - Status: DELIVERED (ready for review)
  7. Developer reviews PR + ticket
```

---

## Impact on Ticket Lifecycle

### Current State Machine (No Changes)

The existing status progression stays the same:

```
DRAFT → DEFINED → REFINED → APPROVED → EXECUTING → DELIVERED → (ARCHIVED)
```

What changes is **how** a ticket moves from APPROVED → EXECUTING and who does what.

### Before vs After Cloud Develop

| Phase | Before (Manual) | After (Cloud Develop) |
|---|---|---|
| APPROVED → EXECUTING | Developer runs `forge develop` locally | PM clicks "Develop" button in browser |
| During EXECUTING | Developer writes code on their machine | Claude writes code in sandbox (auto-flight) |
| EXECUTING → DELIVERED | Developer calls `submit_settlement` via CLI | Claude calls `submit_settlement` via MCP |
| DELIVERED review | PM/dev reviews Change Record | Same — PM/dev reviews Change Record + PR |

### The "Assign" Field: Writer → Reviewer

Currently, the "Assignee" on a ticket means "who will write the code." With Cloud Develop, it means "who will review the PR."

| Ticket State | Current Meaning | New Meaning |
|---|---|---|
| APPROVED | "Who will implement this?" | "Who should review?" (optional before Develop) |
| EXECUTING | "Developer is coding" | "Claude is coding (auto-flight)" |
| DELIVERED | "Developer implemented this" | "Claude implemented. Reviewer checks PR." |

**The assignment is optional before clicking Develop.** The PM can:
- Assign a reviewer first, then click Develop → reviewer gets notified when PR is ready
- Click Develop first, assign reviewer after → reviewer assigned on the DELIVERED ticket

### New Ticket Fields

```typescript
// Existing (unchanged)
assignedTo?: string;        // userId — now means "reviewer"
status: TicketStatus;

// New
implementedBy: 'developer' | 'cloud';  // who wrote the code
sessionId?: string;         // links to the Session entity (if cloud)
prUrl?: string;             // GitHub PR URL (set on DELIVERED)
prNumber?: number;          // GitHub PR number
```

### Quick Change: Reverse Lifecycle

Quick Change tickets are born at DELIVERED:

```
Normal ticket:     DRAFT → DEFINED → REFINED → APPROVED → EXECUTING → DELIVERED
Quick Change:      (created at DELIVERED, status = DELIVERED, Change Record attached)
```

The ticket auto-generated from Quick Change includes:
- Title derived from user's plain text input
- Description reverse-engineered from what Claude did
- Change Record with decisions/risks/files
- PR link
- Status: DELIVERED (ready for review)
- `implementedBy: 'cloud'`

---

## UX Changes to Existing Screens

### OverviewCard (Ticket Metadata Bar)

The existing metadata bar on the ticket detail page needs minor updates:

```
CURRENT:
  ┌─────────────────────────────────────────────────────────┐
  │ ● approved  │ Assignee: @john  │ Priority: high  │ ... │
  └─────────────────────────────────────────────────────────┘

AFTER (APPROVED, before Develop):
  ┌─────────────────────────────────────────────────────────┐
  │ ● approved  │ Reviewer: @john  │ Priority: high  │ ... │
  └─────────────────────────────────────────────────────────┘
  Label changes from "Assignee" to "Reviewer"

AFTER (EXECUTING, Cloud Develop running):
  ┌─────────────────────────────────────────────────────────┐
  │ ● executing │ By: Claude ⚡     │ Reviewer: @john │ ... │
  └─────────────────────────────────────────────────────────┘
  Shows "By: Claude ⚡" to indicate auto-flight implementation

AFTER (DELIVERED):
  ┌─────────────────────────────────────────────────────────┐
  │ ● delivered │ By: Claude ⚡     │ Reviewer: @john │ PR #42 ↗ │
  └─────────────────────────────────────────────────────────┘
  Shows PR link inline, reviewer clearly labeled
```

### Alert Banner on APPROVED Ticket

Replace the current "assign a developer" CTA with the Develop button:

```
CURRENT:
  ┌─────────────────────────────────────────────────────┐
  │ ℹ This ticket is approved and ready for development.│
  │   Assign a developer to start implementation.       │
  └─────────────────────────────────────────────────────┘

NEW:
  ┌─────────────────────────────────────────────────────┐
  │ ⚡ This ticket is approved and ready.               │
  │   [Start Development]  or  assign a reviewer first  │
  └─────────────────────────────────────────────────────┘
```

### JobsPanel Integration

Active Cloud Develop sessions should appear in the existing JobsPanel (right side strip), alongside spec generation jobs:

```
┌─ Jobs Panel ────────────┐
│                         │
│ ⚡ AEC-2437             │
│ ░░░░░░░████░░  65%      │
│ Running tests...        │
│                         │
│ ✓ AEC-2401 (spec)       │
│ Completed 3 min ago     │
│                         │
└─────────────────────────┘
```

Clicking the job card navigates to the Execute tab on that ticket.

### Notification Behavior

| Event | Who Gets Notified | How |
|---|---|---|
| PM clicks "Develop" | Nobody (PM sees progress) | — |
| Session completes (PR created) | Assigned reviewer + PM | Email: "PR ready for review" |
| Session fails | PM who triggered | Email: "Development failed, ticket returned to APPROVED" |
| Developer accepts delivery | PM | Email: "Ticket accepted" (existing flow) |
| Developer requests changes | PM | Email: "Changes requested" (existing flow) |

### Ticket Status Config Updates

The existing `ticketStatusConfig.ts` needs updates for the EXECUTING state:

```typescript
// Current
executing: {
  label: 'Executing',
  description: 'Developer or AI agent implementing',
  color: 'blue',
}

// Updated
executing: {
  label: 'In Development',
  description: 'Claude is implementing this ticket',
  color: 'blue',
  subLabel: (ticket) => ticket.implementedBy === 'cloud'
    ? 'Auto-flight'
    : 'Developer',
}
```

### Handling "Request Changes" After Cloud Develop

When a developer reviews the PR and requests changes via Forge (existing flow), the ticket returns to APPROVED. The PM can:

1. **Click "Develop" again** — starts a new session. Claude sees the previous PR + review comments and addresses them.
2. **Assign to developer** — developer manually fixes the remaining issues.

The system should include the review feedback in the next session's prompt:

```
Previous attempt: PR #42 had changes requested.
Reviewer feedback: "The retry logic doesn't handle network timeouts separately from HTTP 500s."
Please address this feedback in your implementation.
```

---

## Architecture

```
User (Browser)                Forge Backend              E2B Sandbox
     │                           │                            │
     │◄──── SSE / WebSocket ────►│◄──── E2B SDK ────────────►│
     │      (one-way stream)     │                            │
     │                           │                            │
     │  Execute tab:             │  SessionGateway            │  Claude Code CLI
     │  monitoring view          │  (stream orchestrator)     │  -p "implement..."
     │  (messages + tool cards)  │                            │  --output-format stream-json
     │                           │  EventTranslator           │  --dangerously-skip-permissions
     │  No input area.           │  (visual only)             │
     │  Just watch + cancel.     │                            │  Forge MCP Server
     │                           │  SessionOrchestrator       │  (enforces lifecycle)
     │                           │  (lifecycle + billing)     │
     │                           │                            │  User's repo (git clone)
```

### Key Simplification: One-Way Stream

Auto-flight means no user input goes to Claude. The communication is one-directional:
- Claude's stdout → EventTranslator → SSE/WebSocket → browser
- User can only: watch, or cancel

This means we could use **SSE instead of WebSocket** — simpler, no upgrade handshake, works through all proxies. Same pattern as the existing `analyzeRepository` SSE endpoint.

### Container Runtime: E2B

| Why E2B | |
|---|---|
| Cold start | ~150ms from snapshot |
| Bidirectional I/O | Native SDK (only need stdout for auto-flight) |
| Isolation | Firecracker microVM (hardware-level) |
| Pricing | ~$0.10/hr (~$0.05 per 30-min session) |
| Scale to zero | Pay per second |

Vendor lock-in mitigation: `SandboxPort` abstraction. Fly Machines adapter as backup.

### Container Image

Custom E2B template (`forge-dev`) with Claude Code + Superpowers MCP pre-installed:

```dockerfile
FROM e2b/base:latest
RUN apt-get update && apt-get install -y git curl
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs
RUN npm install -g @anthropic-ai/claude-code@1.0.34  # pinned version

# Superpowers MCP — gives Claude TDD, verification, code review skills
COPY superpowers/ /root/.claude/plugins/superpowers/
COPY claude-settings.json /root/.claude/settings.json
COPY bootstrap.sh /root/bootstrap.sh
```

**Superpowers in the sandbox:** Claude Code gets access to quality skills (TDD, verification-before-completion, simplify, code review) that improve output quality. The auto-flight system prompt overrides any interactive behavior — Claude uses skill guidelines without asking questions. Skills like brainstorming are skipped since auto-flight doesn't need them.

**Useful skills in auto-flight:**
- `test-driven-development` — write tests first, then implement
- `verification-before-completion` — verify before claiming done
- `simplify` — review code for reuse and quality
- `systematic-debugging` — diagnose failures methodically

**Skipped in auto-flight** (interactive, not applicable):
- `brainstorming` — requires user input
- `writing-plans` — planning already done via ticket spec

Weekly GitHub Actions workflow bumps CLI version and rebuilds the template.

---

## Session Flow

### Step 1 — Backend creates session

- Auth check (Firebase token)
- Load ticket (ticket-first) or create ephemeral context (Quick Change)
- Load ProjectProfile, GitHubAppInstallation
- Generate short-lived GitHub installation token (1hr TTL, repo-scoped)
- Budget pre-check (developments remaining?)
- Create Session entity in Firestore (status: PROVISIONING)

### Step 2 — Provision sandbox

- Create E2B sandbox from `forge-dev` template (~150ms)
- Inject env vars: `ANTHROPIC_API_KEY` (Forge's), `GITHUB_TOKEN`, `FORGE_API_URL`, `FORGE_SESSION_JWT`, `TICKET_ID`
- Bootstrap: `git clone`, `git checkout -b feat/...`, configure MCP

### Step 3 — Start Claude Code (auto-flight)

```bash
claude \
  -p "${SYSTEM_PROMPT_WITH_TICKET_CONTEXT}" \
  --output-format stream-json \
  --allowedTools "Read,Edit,Write,Bash,Glob,Grep,mcp__forge__*" \
  --dangerously-skip-permissions \
  --mcp-config /root/.forge-mcp.json
```

The `-p` flag makes it one-shot: Claude executes the prompt and exits. No REPL, no waiting for input.

### Step 4 — Stream events to browser

- Claude's stdout (NDJSON) → EventTranslator → SSE → React UI
- One-way only. User watches.

### Step 5 — Session completes

- Claude calls `submit_settlement` via MCP → Change Record created
- Backend creates PR via GitHub App token
- For Quick Change: auto-generate ticket from Claude's work
- Sandbox destroyed (all credentials die)
- Session entity updated (status: COMPLETED, cost, duration)
- Developer notified via email
- Successful completion deducts 1 from user's quota

---

## Event Translation (Visual Only)

Translation is purely cosmetic — Claude's words rendered as-is. We're a visual terminal, not a content filter.

| CLI Event | UI Component |
|---|---|
| `assistant` text | Message block with markdown (Claude's exact words) |
| `tool_use: Read` | File read card (collapsible) |
| `tool_use: Edit` | Diff viewer card (green/red lines) |
| `tool_use: Write` | File create card with preview |
| `tool_use: Bash` | Command card with expandable output |
| `tool_use: Glob/Grep` | Search card (collapsible) |
| `tool_result` | Appended to matching tool card |
| `result` | Summary card with PR link |
| Unknown event | Generic "Working..." card (fallback) |
| Consecutive tools | Grouped: "Explored 5 files" |

---

## UI Design

### Location: Execute Tab

New tab on ticket detail page:

```
Spec → Design → Technical → Execute → Record
```

Tab appears when ticket is APPROVED or later.

### Monitoring View (Not Chat)

Since Claude runs in auto-flight, the UI is a **monitoring view** — not a two-way chat. The user watches Claude work, like watching a CI pipeline.

### Screens (4 total — simplified from 6)

**Screen 1: Develop CTA**
Execute tab before session. Purple button, quota counter.
```
┌─────────────────────────────────────────────┐
│  ⚡ Start Development                        │
│                                             │
│  Claude will implement this ticket,         │
│  run tests, and create a pull request.      │
│                                             │
│  18 of 20 developments remaining · Pro      │
└─────────────────────────────────────────────┘
```

**Screen 2: Provisioning**
Three-step checklist (sandbox → clone → start Claude).

**Screen 3: Active (Monitoring)**
Claude's messages + tool cards scrolling. Status header with elapsed time. Cancel link. No input area.
```
┌─────────────────────────────────────────────┐
│  ● Claude is working · 3:42 · Cancel       │
│─────────────────────────────────────────────│
│                                             │
│  ✦ I'll implement webhook retry using the   │
│    Bull queue pattern, matching the          │
│    existing BackgroundFinalizationService.   │
│                                             │
│  ┌ Explored 4 files ──────────────── ✓ ▸ ┐ │
│                                             │
│  ✦ Adding a dedicated processor with        │
│    exponential backoff (1s, 2s, 4s, 8s).   │
│                                             │
│  ┌ Created webhook-retry.processor.ts ✓ ▸ ┐│
│  ┌ Modified webhooks.module.ts ────── ✓ ▸ ┐│
│  ┌ $ npm test ── 18 passed ───────── ✓ ▸ ┐ │
│                                             │
│  ● Committing changes...                    │
└─────────────────────────────────────────────┘
```

**Screen 4: Complete**
Summary card with PR link, files changed, tests passed. Action buttons.
```
┌─────────────────────────────────────────────┐
│  ✓ Development complete · 5:17              │
│─────────────────────────────────────────────│
│                                             │
│  Files Changed: 4    Lines: +287 -14        │
│  Tests: 18 passed    Branch: feat/aec-2437  │
│                                             │
│  ┌ PR #42 ─────────────────────────────┐   │
│  │ feat: add webhook retry with backoff │   │
│  └─────────────────────────────── ↗ ───┘   │
│                                             │
│  ▸ Session transcript (8 messages, 4 files) │
│                                             │
│  [View PR ↗]    [View Change Record]        │
└─────────────────────────────────────────────┘
```

### Quick Change Page

Separate page accessible from sidebar or dashboard:
```
┌─────────────────────────────────────────────┐
│  ⚡ Quick Change                             │
│                                             │
│  Project:  [acme/api-backend ▾]             │
│  Branch:   [main ▾]                         │
│                                             │
│  What do you need?                          │
│  ┌─────────────────────────────────────┐    │
│  │ Add rate limiting to the /api/users │    │
│  │ endpoint. Max 100 requests per      │    │
│  │ minute per API key.                 │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [⚡ Start Development]                     │
│                                             │
│  17 of 20 developments remaining            │
└─────────────────────────────────────────────┘
```

After clicking Start, shows the same monitoring view (Screen 3/4). When complete, a ticket is auto-generated with the Change Record attached.

---

## Backend Module Structure

### Sessions Module (new)

```
backend/src/sessions/
  domain/
    Session.ts                    # Entity: PROVISIONING → RUNNING → COMPLETED/FAILED/CANCELLED
    SessionEvent.ts               # Value object for persisted events
  application/
    ports/
      SessionRepository.port.ts
      SandboxPort.ts              # Container runtime abstraction
    services/
      EventTranslator.ts          # CLI JSON → UI events (visual only)
      SessionOrchestrator.ts      # Lifecycle: create → run → cleanup
      UsageMeterService.ts        # Track cost per session
    use-cases/
      StartSessionUseCase.ts      # Budget check → provision → start (auto-flight)
      CancelSessionUseCase.ts
      StartQuickChangeUseCase.ts  # Quick Change: plain text → session
  infrastructure/
    persistence/
      FirestoreSessionRepository.ts
    sandbox/
      E2BSandboxAdapter.ts
    container/
      forge-sandbox.Dockerfile
      bootstrap.sh
  presentation/
    controllers/
      SessionController.ts        # SSE endpoint for streaming events
    dto/
      StartSessionDto.ts
      StartQuickChangeDto.ts
  sessions.module.ts
```

### Billing Module (shared)

```
backend/src/billing/
  domain/
    UsageQuota.ts
    UsageRecord.ts
  application/
    use-cases/
      CheckQuotaUseCase.ts
      RecordUsageUseCase.ts
  infrastructure/
    FirestoreUsageRepository.ts
```

### Frontend Components (new)

```
client/src/sessions/
  stores/
    session.store.ts              # SSE connection + event stream state
  components/
    SessionMonitorView.tsx        # Main monitoring view (messages + tool cards)
    SessionMessage.tsx            # Claude's message blocks (markdown)
    SessionToolCard.tsx           # Collapsible tool card
    SessionToolGroup.tsx          # Grouped consecutive tools
    SessionDiffViewer.tsx         # Inline diff display
    SessionSummary.tsx            # Completion card with PR link
    SessionProvisioningView.tsx   # Three-step setup checklist
    DevelopButton.tsx             # CTA with quota check
    QuickChangePage.tsx           # Quick Change form (repo + branch + text)
```

---

## Security

1. **Firecracker microVM** — hardware-level isolation per session
2. **Network egress restricted** — only `api.anthropic.com`, `github.com`, Forge API
3. **GitHub token** — installation token, repo-scoped, 1hr TTL, env var only
4. **Anthropic key** — Forge's key, env var only, never exposed
5. **Session JWT** — short-lived, scoped to session/ticket
6. **`--dangerously-skip-permissions`** — safe because the container IS the security boundary
7. **`-p` flag** — one-shot execution, no REPL, no stdin attack surface
8. **Sandbox destruction** — all credentials, code, and logs gone when session ends

---

## Cost Analysis

### Per-Development Cost to Forge

| Component | Cost |
|---|---|
| E2B sandbox (15 min avg — faster with auto-flight) | $0.025 |
| Claude API (Forge's key) | ~$1.50 avg |
| Firestore writes | ~$0.001 |
| **Total** | **~$1.53** |

Note: auto-flight sessions are faster (no human wait time), reducing E2B cost.

### Infrastructure at Scale

| Users | Monthly Devs | API Cost | Infra | Revenue | Margin |
|---|---|---|---|---|---|
| 100 | ~900 | $1,377 | $72 | $3,900 | **63%** |
| 500 | ~4,500 | $6,885 | $200 | $19,500 | **64%** |
| 1,000 | ~9,000 | $13,770 | $400 | $39,000 | **64%** |

---

## Durability

| Risk | Level | Mitigation |
|---|---|---|
| `stream-json` format changes | Medium | Pin CLI version; fallback renderer |
| Anthropic builds competing web product | Medium | Moat is ticket lifecycle + MCP enforcement |
| E2B dependency | Medium | `SandboxPort` abstraction; Fly Machines backup |
| Session cost overrun | Medium | Duration caps, quotas, budget pre-checks |
| Claude Code CLI breaking changes | Low | Pinned version; weekly CI rebuild |

### Why This Is Durable

1. **Users don't see the engine** — they see "Develop" → PR
2. **The moat is the workflow** — spec → execute → deliver → Change Record + MCP enforcement
3. **Brownfield focus** — competitors can't clone repos and follow CLAUDE.md
4. **Developer stays in the loop** — accelerating, not replacing
5. **Auto-flight = simpler architecture** — less to break, less to maintain

---

## Relationship to Existing Epics

| Epic | Relationship |
|---|---|
| Epic 15 (Project Profiles) | Prerequisite — profile provides context |
| Epic 16 (MCP Bridge) | **Merged** — MCP runs in sandbox |
| Epic 17 (Cloud Develop, API-only) | **Superseded** — real CLI replaces API-only |
| Epic 6 (MCP Server) | Foundation — tool definitions reused |

---

## MVP Scope (4-6 weeks)

1. E2B integration with `forge-dev` container template
2. SSE endpoint for streaming session events (simpler than WebSocket)
3. Session lifecycle: start → stream → end (auto-flight, no user input)
4. Auto-flight system prompt (never ask questions, log decisions via MCP)
5. EventTranslator for all tool types + fallback for unknowns
6. Forge-provided API key with session quota (2 free, 20 Pro)
7. Usage metering (track cost per session)
8. Execute tab: monitoring view with messages + tool cards
9. MCP tools pre-configured in sandbox (enforce ticket lifecycle)
10. GitHub App integration (clone, push, create PR)
11. Developer notification on PR creation
12. Container image with pinned Claude Code + weekly CI rebuild

**MVP skips**: Quick Change flow, session persistence, Stripe billing (manual quota), BYOK UI, container pooling, concurrent sessions, session history.

---

## Post-MVP Phases

### Phase 2 (weeks 5-8): Quick Change
- Quick Change page (repo selector + text input)
- Auto-generate ticket from Claude's output
- Reverse flow: PR + ticket created for dev review

### Phase 3 (months 2-3): Scale
- Stripe billing with plan tiers
- BYOK option in Settings
- Session persistence + history
- Concurrent sessions (Team/Scale)
- Slack/Teams notifications

### Phase 4 (months 3-6): Polish
- `SandboxPort` abstraction + Fly Machines adapter
- Pre-warmed container pool
- Collaborative viewing (team watches session)
- Custom sandbox images per team

---

## Verification Plan

1. **E2B PoC**: Run `claude -p "create hello world" --output-format stream-json` in E2B, capture stdout
2. **Auto-flight test**: Verify Claude never asks questions, always decides and logs via MCP
3. **MCP enforcement**: Verify `get_ticket_context`, `start_implementation`, `submit_settlement` called automatically
4. **SSE streaming**: Verify events stream to browser in real-time
5. **Ticket lifecycle**: Verify APPROVED → EXECUTING → DELIVERED transitions
6. **Cost metering**: Verify `result` event has accurate `cost_usd`
7. **GitHub flow**: Verify clone → branch → commit → push → PR end-to-end
8. **Load test**: 10 concurrent sessions on E2B

---

## Story Breakdown

```
18.1  E2B sandbox integration + forge-dev container template
      ↓
18.2  SSE streaming endpoint + Session domain entity
      ↓
18.3  EventTranslator (stream-json parsing + UI event mapping)
      ↓
18.4  SessionOrchestrator (provision → auto-flight → cleanup)
      ↓
18.5  MCP server in sandbox (ticket context + execution events + settlement)
      ↓
18.6  GitHub App integration (clone, push, PR creation)
      ↓
18.7  Frontend: Execute tab + monitoring view + tool card components
      ↓
18.8  Frontend: Develop CTA + provisioning + completion screens
      ↓
18.9  Billing: UsageQuota + quota check + metering
      ↓
18.10 Developer notification + quota enforcement UI

Phase 2:
18.11 Quick Change page (repo selector + text input)
18.12 Auto-generate ticket from session output (reverse flow)
```

Stories 18.1-18.3 can run in parallel. Stories 18.7-18.8 can start with mocked data.
