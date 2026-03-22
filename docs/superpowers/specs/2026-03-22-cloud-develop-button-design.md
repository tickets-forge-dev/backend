# Cloud Develop Button — Design Spec

**Date:** 2026-03-22
**Status:** Draft
**Epic:** 17 (proposed)

## Summary

A "Develop" button on approved tickets (status `FORGED`) that generates a draft Pull Request on the team's GitHub repo — without a developer touching a terminal. The PM clicks a button, Forge reads the codebase via GitHub API, generates code via Claude API, and opens a PR. A developer reviews and merges.

**Target user:** PMs on engineering teams who want to fast-track tickets out of the backlog. The PR is a first-pass draft — not production-ready — that a developer reviews and polishes.

**Positioning shift:** Forge moves from "AI-powered ticket management" to "ship features from your browser." Competes with Lovable/Bolt but for existing codebases, not greenfield — a unique position.

---

## Architecture

### Execution model: API-only (no sandbox)

All execution runs inside the existing NestJS backend. No containers, no sandbox providers, no external compute.

- **File reads:** GitHub API (via GitHub App token)
- **Code generation:** Claude API (Sonnet) with prompt caching
- **File writes:** GitHub Git Data API (create blobs → tree → commit → branch → PR)
- **Cost per execution:** ~$0.40–0.50 (Claude API tokens only)

### Why not a sandbox?

This is a draft PR, not production code. We don't need to compile, test, or run anything. The GitHub API can read and write files without ever cloning the repo. This eliminates container costs ($0.10–0.25/execution) and infrastructure complexity entirely.

### Why not Claude Code CLI?

Solo developers already use Claude Code directly. The Develop button serves PMs who don't have a terminal. Running Claude Code in a remote container would be expensive and complex. The API-only approach produces ~80–90% equivalent quality for standard features at a fraction of the cost.

---

## User Flow

```
PM in Forge web app                    Backend                         GitHub
─────────────────                    ───────                         ──────
Ticket is FORGED (approved)
       │
       ▼
Clicks "Develop" button
       │
       ├─ Gate checks: paid plan, GitHub App
       │   installed, executions remaining
       │
       ▼
Backend creates ExecutionJob
       │
       ▼                            ┌─ Step 1: Planning call ─────┐
"Generating PR..."                  │  Claude API: spec + profile  │
 (progress shown in                 │  + file tree → file list     │
  jobs panel + detail dialog)       └──────────────────────────────┘
       │                                       │
       │                            ┌─ Step 2: Fetch files ────────┐
       │                            │  GitHub API: read requested  │
       │                            │  files (10-25 files)         │
       │                            └──────────────────────────────┘
       │                                       │
       │                            ┌─ Step 3: Generation call ────┐
       │                            │  Claude API: spec + profile  │
       │                            │  + file contents → new code  │
       │                            └──────────────────────────────┘
       │                                       │
       │                            ┌─ Step 4: Create PR ──────────┐
       │                            │  GitHub Git Data API:        │
       │                            │  branch → blobs → tree →    │
       │                            │  commit → PR                 │
       │                            └──────────────────────────────┘
       │                                       │
       ▼                                       ▼
"PR ready!" ◄──────────────────── Returns PR URL
 Link shown on ticket card
```

**Ticket state change:** The ticket stays `FORGED` during execution. Only after the PR is successfully created does the ticket transition to `EXECUTING` via a new `startCloudExecution(branch, prUrl)` method on the AEC entity (does not require `qaItems` like the developer-initiated `startImplementation`). If execution fails, the ticket remains `FORGED` — the PM can retry or a developer can implement manually. This avoids the existing state machine's limitation where `EXECUTING` has no rollback path to `FORGED`.

---

## GitHub App Integration

### Why a separate GitHub App (not expanded OAuth)

The existing OAuth flow is read-only, used for profile scanning. The Develop button needs write access (create branches, commit files, open PRs). Reasons for separation:

1. **Enterprise trust:** SOC2 teams want explicit opt-in for write access, not blanket permissions.
2. **Granular control:** GitHub Apps allow per-repository permissions. The admin installs the app on specific repos only.
3. **Natural paywall gate:** Installation becomes the activation moment for the paid tier.
4. **No migration:** Existing read-only OAuth continues working unchanged.

### GitHub App permissions

- `contents: write` — create branches, commit files
- `pull_requests: write` — open PRs
- `metadata: read` — list repos

No admin access, no webhooks, no actions.

### GitHub App token lifecycle

GitHub Apps authenticate differently from OAuth. No long-lived token is stored.

1. **App private key** — stored as environment variable `GITHUB_APP_PRIVATE_KEY` (PEM format). Set once during app registration, never changes.
2. **App ID** — stored as environment variable `GITHUB_APP_ID`.
3. **JWT generation** — `GitHubAppService` signs a JWT using the private key (RS256, 10-min expiry). This authenticates AS the app.
4. **Installation token** — exchange JWT + `installationId` via `POST /app/installations/:id/access_tokens`. Returns a token valid for 1 hour with the scoped permissions.
5. **Caching** — `GitHubAppService` caches the installation token in memory with a 55-minute TTL (5-minute safety buffer before expiry). All GitHub API calls within a single execution (~30-60 seconds) reuse the same cached token.
6. **Refresh** — if a cached token is expired or missing, a new one is generated automatically before the next API call.

This is the standard GitHub App authentication pattern used by Probot, Octokit, and every major GitHub integration.

### Authorization policy

**Who can trigger the "Develop" button:** Any workspace member with access to the ticket. No role restriction beyond workspace membership. Rationale: the output is a draft PR that still requires developer review — the gate is the code review, not the button click. This follows the existing pattern where any team member can view and interact with tickets.

A `CanExecuteTicketPolicy` in the domain layer enforces the five gate conditions (ticket status, plan tier, GitHub App, remaining executions, no active job). Authorization (workspace membership) is handled by the existing `WorkspaceGuard` at the presentation layer, same as all other ticket endpoints.

### Installation flow

```
Team admin → Forge settings → "Connect for Development"
  → Redirects to github.com/apps/forge-dev/installations/new
  → Admin selects repos → GitHub redirects back with installation_id
  → Backend stores GitHubAppInstallation entity
  → "Develop" button now available for those repos
```

---

## Domain Model

### Terminology: `teamId` vs `workspaceId`

The existing codebase uses both terms. `GitHubIntegration` uses `workspaceId`; `AEC`, `GenerationJob`, and `ProjectProfile` use `teamId`. These refer to the same concept — a workspace/team is the tenant boundary. New entities in this spec use `teamId` to align with the majority of existing entities (`AEC`, `GenerationJob`, `ProjectProfile`). The lookup bridge: `ExecuteTicketUseCase` loads the ticket (has `teamId`), then queries `GitHubAppInstallation` by `teamId`. No mapping needed.

### New entity: GitHubAppInstallation

```typescript
{
  id: string;
  teamId: string;                 // aligned with AEC, GenerationJob, ProjectProfile
  installationId: number;         // GitHub's installation ID
  accountLogin: string;           // "acme-org"
  accountType: 'User' | 'Organization';
  selectedRepositories: string[]; // ["api-backend", "web-client"]
  installedBy: string;            // userId
  installedAt: Date;
}
```

Persisted in Firestore collection `github-app-installations`. One per team (can cover multiple repos).

**No token stored on this entity.** Unlike the existing `GitHubIntegration` which stores an encrypted OAuth token, GitHub App tokens are transient — generated at runtime via JWT, cached in memory, and refreshed before expiry. See the GitHub App Token Lifecycle section below.

### New entity: ExecutionJob

Tracks the lifecycle of a single "Develop" execution. Separate from `GenerationJob` rather than extending it with a `type: 'execution'` discriminator. Rationale: ExecutionJob has fields that don't exist on GenerationJob (prUrl, branch, prNumber, cost tracking, profileTier) and a different state machine (GenerationJob has `running → retrying → completed/failed/cancelled`; ExecutionJob has granular phases). Sharing an entity would mean nullable fields everywhere and conditionals in every consumer. The jobs panel UI can render both types — they just come from different repositories.

```typescript
{
  id: string;
  teamId: string;
  ticketId: string;
  ticketTitle: string;
  triggeredBy: string;            // userId (the PM)
  status: 'queued' | 'planning' | 'reading_files' | 'generating' |
          'committing' | 'completed' | 'failed' | 'cancelled';
  phase: string;                  // human-readable phase description
  percent: number;                // 0-100 progress

  // Input context
  profileTier: 'standard' | 'code-gen';
  repoOwner: string;
  repoName: string;
  baseBranch: string;

  // Output
  branch?: string;                // "feat/aec-2437-webhook-retry"
  prUrl?: string;                 // "https://github.com/acme/api/pull/42"
  prNumber?: number;
  filesChanged?: number;

  // Cost tracking
  inputTokens?: number;
  outputTokens?: number;
  estimatedCost?: number;         // in cents

  // Error handling
  error?: string;
  attempt: number;                // for retry logic (max 2)

  createdAt: Date;
  completedAt?: Date;
}
```

**Progress phases:**

| Phase | Percent | Description |
|---|---|---|
| `queued` | 0% | Job created, waiting to start |
| `planning` | 15% | Claude planning call — identifying files to read |
| `reading_files` | 35% | Fetching files from GitHub API |
| `generating` | 60% | Claude generation call — writing code |
| `committing` | 85% | Creating branch, committing files, opening PR |
| `completed` | 100% | PR created successfully |
| `failed` | — | Error occurred, message in `error` field |
| `cancelled` | — | User cancelled, execution stopped |

**Cancellation:** User can cancel an in-progress execution via a "Cancel" button in the detail dialog. `BackgroundExecutionService` checks a `cancelled` flag before each phase transition. If cancelled mid-generation, any partial work is discarded (no branch/PR created). The ticket remains `FORGED` since status transition only happens on success.

**Failure handling:** On failure, the ExecutionJob moves to `failed` with an error message. The ticket stays `FORGED` — the PM can retry (creates a new ExecutionJob) or a developer can implement manually via CLI. No ticket state gets wedged.

### New subcollection: ExecutionEvents

Real-time activity log for the execution detail dialog. Stored as Firestore subcollection `executionJobs/{jobId}/events/{eventId}`.

```typescript
interface ExecutionEvent {
  timestamp: Date;
  type: 'phase_change' | 'file_read' | 'file_generated' | 'log' | 'error';
  message: string;
  data?: {
    filePath?: string;
    diff?: string;                // unified diff for file changes panel
    phase?: string;
    percent?: number;
  };
}
```

Frontend subscribes via Firestore `onSnapshot` — same real-time pattern the jobs panel already uses.

### Profile entity update

Epic 16 adds `source: 'github' | 'local'` to `ProjectProfile`. No additional `profileTier` field is needed — the tier is derived from the source:

- `source: 'github'` → Tier 1 (standard): tech stack, file tree, configs, AI instructions
- `source: 'local'` → Tier 2 (code-gen): all of Tier 1 + code patterns, shared types, import conventions, test patterns, dependency map

The `ExecutionJob.profileTier` field is a snapshot of which tier was used for that execution (for analytics/debugging), not a stored field on the profile itself.

### Entity relationship

```
Workspace
  ├── GitHubIntegration (existing, read-only OAuth)
  ├── GitHubAppInstallation (NEW, write access)
  ├── ProjectProfile (existing, enhanced with profileTier)
  └── AEC (ticket)
        └── ExecutionJob (NEW, 0 or 1 active per ticket)
              └── ExecutionEvents (NEW, subcollection)
```

---

## Enhanced Project Profile (Prerequisite)

The current profile is built for spec generation (understand WHAT the project does). Code generation requires understanding HOW code is written in the project.

### Tier 1 — GitHub API scan (enhanced from current)

```
=== PROJECT PROFILE ===          repo, branch, SHA
=== TECH STACK ===               languages, frameworks
=== FILE STRUCTURE ===           full recursive tree (not just 2 levels deep)
=== KEY CONFIG FILES ===         package.json, tsconfig, etc.
=== AI INSTRUCTIONS ===          CLAUDE.md, .cursorrules, AGENTS.md,
                                 .github/copilot-instructions.md, .clinerules
=== README ===                   first 2000 chars
```

**New: AI Instructions section.** If the project has a `CLAUDE.md` or equivalent, it contains developer-written rules for how AI should write code in this project — architecture rules, forbidden patterns, naming conventions. This is injected as top-level context in the code generation prompt.

Files to check: `CLAUDE.md`, `.cursorrules`, `AGENTS.md`, `.github/copilot-instructions.md`, `.clinerules`.

### Tier 2 — CLI scan (new, deep)

All of Tier 1, plus:

```
=== CODE PATTERNS ===            sampled files per architectural role
                                 (controller, use case, repository, component)
=== SHARED TYPES ===             exported interfaces, DTOs, enums
=== IMPORT CONVENTIONS ===       alias paths, barrel exports, relative vs absolute
=== TEST PATTERNS ===            sample test file showing framework + mocking style
=== DEPENDENCY MAP ===           which modules import from which
```

The CLI has filesystem access — no rate limits, no 1MB file caps. It can parse import statements, sample representative files, and build a dependency map. This profile is uploaded via `forge profile` (Epic 16, stories 16.1–16.4).

### Quality impact

| Profile tier | Code quality vs Claude Code CLI |
|---|---|
| Tier 1 (GitHub scan) | ~70-75% — knows structure but not patterns |
| Tier 2 (CLI scan) | ~85-90% — knows patterns, types, conventions |

When only Tier 1 is available, the UI shows a nudge: "For better code quality, ask a developer to run `forge profile` in this repo."

---

## Code Generation Pipeline

### Two-step approach: plan → generate

**Step 1 — Planning call** (~$0.02)

Claude receives the TechSpec + project profile + full file tree. Returns a JSON list of files it needs to read before implementing (max 30 files). This simulates Claude Code's exploration phase. If Claude requests more than 30 files, the backend takes the first 30 (prioritizing files in `techSpec.fileChanges[]` plus Claude's ordering). For cross-cutting features that truly need more context, the prompt instructs Claude to prioritize type definitions and interfaces over implementation files.

**TechSpec input:** The prompt includes `problemStatement` (narrative, context, assumptions, constraints), `solution` (overview, steps, fileChanges), and `acceptanceCriteria` (given/when/then). Wireframes, API snapshots, and code snapshots are excluded — they add tokens without helping code generation.

System prompt contains the project profile and AI instructions (CLAUDE.md). This prefix is cached by Anthropic's prompt caching for reuse in Step 3.

**Step 2 — Fetch files** ($0.00)

Backend reads all requested files via GitHub API using the GitHub App installation token. Typically 10-25 files, each a single API call. Well within the 5000 req/hr rate limit.

**Step 3 — Generation call** (~$0.30–0.45)

Claude receives the same cached system prompt + TechSpec + all file contents. Returns a JSON array of file operations: `[{ path, action: "create"|"modify", content }]`.

Rules in the prompt:
- Return COMPLETE file contents, not diffs
- Follow existing patterns exactly (reference the code patterns section)
- Match import style, naming conventions, error handling patterns
- Include tests if a test file was provided as reference

**Total cost per execution: ~$0.40–0.50**

### Prompt caching strategy

The system prompt (~15-20K tokens) is identical between Step 1 and Step 3. Anthropic caches it automatically when the prefix matches, giving a ~90% discount on those tokens in Step 3. Cache TTL is 5 minutes — since Steps 1-2 typically complete in 10-30 seconds, the cache will be warm for Step 3. If the gap exceeds 5 minutes (due to retries or queuing), the cache miss is acceptable — it adds ~$0.05 to the cost.

### File commit flow (GitHub Git Data API)

No files touch the backend filesystem. Everything stays as strings in memory:

1. **Create blobs** — `POST /repos/:owner/:repo/git/blobs` for each generated file
2. **Create tree** — `POST /repos/:owner/:repo/git/trees` referencing all blobs + base tree
3. **Create commit** — `POST /repos/:owner/:repo/git/commits` with tree + parent
4. **Create branch** — `POST /repos/:owner/:repo/git/refs` pointing to commit
5. **Create PR** — `POST /repos/:owner/:repo/pulls` with ticket spec as body

Branch naming: `feat/{ticket-slug}` (e.g., `feat/aec-2437-webhook-retry`). If the branch already exists (from a previous failed attempt or manual creation), append a suffix: `feat/{ticket-slug}-2`, `-3`, etc. Check via `GET /repos/:owner/:repo/git/refs/heads/feat/{slug}` before creating.

PR body template:
```markdown
## {ticket.title}

{techSpec.problemStatement.narrative}

### Acceptance Criteria
{techSpec.acceptanceCriteria mapped to checklist}

### Files Changed
{list of created/modified files}

---
Generated by [Forge](https://forge-ai.dev) from ticket [{ticket.slug}]({forge ticket URL})
```

### Error handling

| Failure | Response |
|---|---|
| Claude returns malformed JSON | Retry once with stricter prompt |
| Claude requests non-existent file | Skip it, log warning, continue |
| File exceeds 1 MB or is binary | Skip it, add a comment in the generation prompt noting the file was too large to read |
| GitHub API rate limit | Queue and retry with backoff |
| Generated file is empty | Exclude from commit, log error |
| All files fail generation | Mark ExecutionJob as `failed`, show error in dialog |
| Token budget exceeded | Block before starting, show upgrade prompt |
| Branch already exists | Append numeric suffix (`-2`, `-3`) |
| User cancels mid-execution | Stop at next phase boundary, discard partial work |

---

## Real-Time Execution UI

### Jobs panel card

Execution jobs appear in the existing right-side jobs panel alongside spec generation jobs:

```
┌─────────────────────────────────┐
│ ⚡ Implementing AEC-2437        │
│ ░░░░░░░░░░░█████░░░  60%       │
│ Generating code...              │
│                          View → │
└─────────────────────────────────┘
```

### Execution detail dialog

Clicking "View" opens a two-panel dialog:

**Left panel — Activity log:** Real-time stream of events (files being read, phases changing, files being generated). Powered by Firestore `onSnapshot` on the ExecutionEvents subcollection.

**Right panel — File changes:** As files are generated, shows diffs (unified diff format). Uses a lightweight diff rendering library. Files appear incrementally as they're generated.

### Final state

When execution completes, the dialog shows the PR link, branch name, files changed count, and token usage. The ticket card gets a persistent "View PR #42" badge.

---

## Billing & Gating

### Plan tiers

| | Free | Pro ($19/mo) | Team ($49/mo) |
|---|---|---|---|
| Tickets | Unlimited | Unlimited | Unlimited |
| Spec generation | 10/mo | Unlimited | Unlimited |
| **Develop (PR generation)** | **—** | **15/mo** | **50/mo** |
| GitHub App install | — | ✔ | ✔ |
| CLI profile (Tier 2) | ✔ | ✔ | ✔ |
| Extra executions | — | $2 each | $1.50 each |

### Margins

- Pro: 15 × $0.40 = $6 cost → $19 revenue = **68% margin**
- Team: 50 × $0.40 = $20 cost → $49 revenue = **59% margin**

### Gate logic

The "Develop" button checks five conditions in order:

1. Ticket status is `FORGED` (approved)
2. User is on a paid plan (Pro or Team)
3. GitHub App is installed for the ticket's repo (resolved from the ticket's `ProjectProfile` which has `repoOwner` + `repoName`)
4. Executions remaining > 0 for the billing period
5. No active execution already running for this ticket

If any check fails, the button is disabled with a contextual CTA (upgrade, connect GitHub, etc.).

### Button states

| State | Button | Action |
|---|---|---|
| Free plan | `⚡ Develop` (grayed) | Shows "Upgrade to Pro" |
| No GitHub App | `⚡ Develop` (grayed) | Shows "Connect GitHub" |
| Ready | `⚡ Develop` (active) | Triggers execution |
| In progress | `● Running...` | Opens detail dialog |
| PR created | `View PR #42` | Links to GitHub |

---

## Backend Layer Map

All new code follows existing Clean Architecture patterns.

### Domain layer
- `ExecutionJob` entity (new) — `backend/src/execution/domain/ExecutionJob.ts`
- `GitHubAppInstallation` entity (new) — `backend/src/github/domain/GitHubAppInstallation.ts`

### Application layer
- `ExecuteTicketUseCase` (new) — loads ticket, profile, installation; creates job; fires background service
- `BackgroundExecutionService` (new) — orchestrates the 4-phase pipeline (plan → read → generate → commit)
- `CodeGenerationService` (new) — wraps Claude API calls with prompt caching, structured output, retry
- `GitHubAppInstallationRepository` port (new)
- `ExecutionJobRepository` port (new)

### Infrastructure layer
- `FirestoreExecutionJobRepository` (new) — persistence for ExecutionJob + ExecutionEvents subcollection
- `FirestoreGitHubAppInstallationRepository` (new)
- `GitHubAppService` (new) — GitHub App authentication (JWT + installation token), Git Data API operations (blobs, trees, commits, refs, PRs)
- `ClaudeCodeGenAdapter` (new) — Anthropic SDK wrapper for the two-step pipeline with prompt caching

### Presentation layer
- `POST /tickets/:ticketId/develop` — triggers ExecuteTicketUseCase (RESTful, consistent with existing ticket endpoints)
- `GET /execution/:jobId` — get execution status
- `DELETE /execution/:jobId` — cancel an in-progress execution
- `POST /github-app/callback` — GitHub App installation callback
- `GET /github-app/status/:repo` — check if app is installed for a repo

Note: ExecutionEvents are read directly from Firestore via `onSnapshot` on the client — no REST endpoint needed for real-time events.

**Concurrency:** A user can trigger executions on multiple tickets concurrently (different tickets, different PRs). The "no active execution" gate is per-ticket, not per-user. Rate limiting at the workspace level prevents abuse — max 3 concurrent executions per workspace.

---

## Dependencies

- **Epic 15 (Project Profiles):** Profile entity and scanning infrastructure. Must be complete.
- **Epic 16 stories 16.1–16.4 (CLI Profile):** Tier 2 profile scanning and upload. Strongly recommended before launch for code quality, but not a hard blocker — Tier 1 profiles work with reduced quality.
- **Enhanced profile scanning:** AI instructions ingestion (CLAUDE.md, .cursorrules) should be added to both GitHub API scan (Tier 1) and CLI scan (Tier 2) before this feature ships.

---

## Story Breakdown (Proposed)

```
17.1 Enhanced profile: AI instructions + deeper file tree
     ↓
17.2 GitHubAppInstallation entity + installation flow
     ↓
17.3 ExecutionJob entity + repository + events subcollection
     ↓
17.4 CodeGenerationService (two-step Claude pipeline)
     ↓
17.5 GitHubAppService (Git Data API: blobs → tree → commit → branch → PR)
     ↓
17.6 BackgroundExecutionService (orchestrator) + ExecuteTicketUseCase
     ↓
17.7 "Develop" button UI + execution detail dialog + gate logic
     ↓
17.8 Billing metering + plan enforcement
```

Stories 17.2 and 17.3 can run in parallel. Stories 17.4 and 17.5 can run in parallel. Story 17.7 (UI) can start early with mocked data.

---

## Future Considerations (Parked)

- **Agentic loop (multi-turn):** 3-5 Claude calls per execution for complex features. Higher quality, higher cost. Potential "Deep" mode for Team plan.
- **Sandbox execution tier:** E2B or Fly Machines for features that need compilation/test validation. Premium add-on.
- **Auto-profile refresh:** CLI watches for git changes and re-uploads profiles automatically.
- **PR feedback loop:** If developer leaves review comments, Forge could auto-generate a follow-up commit addressing them.
- **Non-GitHub support:** GitLab/Bitbucket App equivalents for the same flow.
- **ExecutionEvents retention:** Define TTL or cleanup policy for event subcollections. Not needed for v1 (low volume), but should be addressed before scale.
