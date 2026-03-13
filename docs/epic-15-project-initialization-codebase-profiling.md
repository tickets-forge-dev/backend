# Epic 15: Project Initialization & Codebase Profiling

**Priority:** P1
**Goal:** Automatically scan and document a connected repository's structure, tech stack, APIs, and patterns — then use this profile as persistent context when creating tickets for dramatically better, code-aware results.

---

## Context

Today, ticket generation relies on live Octokit API calls during the creation flow to understand the codebase. This is slow, shallow, and stateless — every ticket starts from scratch. PMs and developers don't get the benefit of deep project understanding.

This epic introduces a **one-time project initialization scan** that runs when a user first connects a repository. The scan produces a lightweight `.txt` profile document stored in Firestore (team+repo scoped), accessible to all team members. Every subsequent ticket creation for that repo feeds this profile as LLM context alongside live Octokit data — producing significantly more accurate, implementation-ready tickets.

**Key design decisions:**
- Scan is **backend-processed** (triggered from client, runs as a background job)
- Scan must be **persistent** — user can close the browser tab and come back later
- Profile is a **lightweight .txt file** — minimal storage, maximum readability
- Profile is **team-scoped** — one team member scans, everyone benefits
- **Re-scan** is manually triggerable when the project evolves

---

## Stories

### Story 15.1: Domain Model — Project Profile Entity

**Goal:** Define the domain model for storing a scanned project profile.

**Acceptance Criteria:**
- `ProjectProfile` domain entity with fields: `id`, `teamId`, `repoOwner`, `repoName`, `branch`, `profileContent` (text), `status` (pending | scanning | ready | failed), `scannedAt`, `scannedBy`, `fileCount`, `techStack` (string[]), `createdAt`, `updatedAt`
- Repository port interface (`ProjectProfileRepository`) with CRUD + `findByTeamAndRepo(teamId, owner, repo)`
- Firestore infrastructure implementation
- Status enum: `pending` → `scanning` → `ready` (or `failed` with error message)

---

### Story 15.2: Backend — Repository Scan Job (Background Processing)

**Goal:** Build the background scan job that reads a repo via Octokit and generates the project profile text document.

**Acceptance Criteria:**
- `ScanRepositoryUseCase` that accepts `teamId`, `repoOwner`, `repoName`, `branch`, `userId`
- Creates a `ProjectProfile` record with status `pending`, then transitions to `scanning`
- Uses Octokit (existing GitHub infrastructure) to:
  - Fetch repo metadata (description, default branch, language breakdown)
  - Fetch file tree (recursive, respecting depth limits for large repos)
  - Read key files: `package.json`, `tsconfig.json`, `Cargo.toml`, `go.mod`, `requirements.txt`, `Gemfile`, `pom.xml`, etc.
  - Detect API routes (scan for route files, controller files, endpoint definitions)
  - Read README.md for project context
- Generates a structured `.txt` profile document containing:
  - **Project Overview**: repo name, description, primary language, tech stack
  - **File Structure**: tree view of directories and files (depth-limited for large repos)
  - **Tech Stack**: frameworks, libraries, build tools detected from config files
  - **API Endpoints**: routes/controllers found with HTTP methods and paths
  - **Key Patterns**: testing framework, architecture style, folder conventions
  - **Dependencies Summary**: top-level dependencies from package manager files
- Saves profile text to Firestore, sets status to `ready`
- On failure: sets status to `failed` with error message, allows retry
- Handles large repos gracefully (file count limits, timeout protection)
- Job is **idempotent** — re-triggering overwrites the previous profile

---

### Story 15.3: Backend — API Endpoints for Scan & Profile

**Goal:** Expose REST endpoints to trigger scans, check status, and retrieve profiles.

**Acceptance Criteria:**
- `POST /api/teams/:teamId/project-profiles/scan` — Trigger a new scan (body: `{ repoOwner, repoName, branch }`)
  - Returns `202 Accepted` with `{ profileId, status: 'pending' }`
  - If scan already in progress for same repo, return existing status
- `GET /api/teams/:teamId/project-profiles/:profileId` — Get profile by ID (status + content when ready)
- `GET /api/teams/:teamId/project-profiles?repo=owner/name` — Find profile by repo
- `DELETE /api/teams/:teamId/project-profiles/:profileId` — Delete a profile (for re-scan from scratch)
- All endpoints team-scoped with existing auth/role guards
- Scan endpoint requires at least `member` role
- Profile content only returned when status is `ready`

---

### Story 15.4: Client — Auto-Trigger Scan on Repo Connect

**Goal:** When a user connects a repository in the Codebase step, automatically check if a profile exists and trigger a scan if not.

**Acceptance Criteria:**
- When user selects a repo in the Codebase step (wizard), client checks if a profile exists for this team+repo
- If **no profile exists**: automatically trigger a scan in the background
  - Show a subtle status indicator: "Scanning project structure..." with a spinner
  - User can proceed to next steps — scan runs in background
  - When scan completes, show a brief success toast: "Project scanned — tickets for this repo will be more accurate"
- If **profile exists** and status is `ready`: show profile status card:
  - Green checkmark + "Project profiled · Mar 12, 2026" (formatted date of last scan)
  - Tech stack badges (e.g., `TypeScript`, `React`, `NestJS`)
  - File count: "1,247 files scanned"
  - Small "Re-scan" link button for manual refresh
- If **profile exists** and status is `scanning`: show spinner "Scan in progress..."
- If **profile exists** and status is `failed`: show warning with "Retry" button
- Scan status is polled (every 5s) until terminal state (ready/failed)
- User is NOT blocked — they can create tickets while scan runs (profile just won't be available yet)

**Profile indicator on repo selector (global):**
- Wherever the repo name appears (Codebase step, ticket detail, feed header), show a subtle inline badge:
  - Profiled: `owner/repo` ✓ Profiled · Mar 12
  - Not profiled: `owner/repo` ○ Not profiled
- This gives users confidence that their repo is indexed without opening the wizard

---

### Story 15.5: Integration — Two-Layer Context for Ticket Generation

**Goal:** When generating a ticket, combine the static project profile with targeted live Octokit reads for maximum context accuracy.

**Acceptance Criteria:**

**Layer 1 — Project Profile (static, deep):**
- During `analyzeRepository` (ticket generation), check if a `ProjectProfile` exists for the selected repo
- If profile is `ready`: include `profileContent` as foundational context in the LLM prompt
  - Add as a "Project Context" section — repo structure, tech stack, architecture patterns, API routes, dependencies
  - This gives the LLM the "big picture" of where things are and how the project is organized

**Layer 2 — Octokit Live Reads (dynamic, targeted):**
- LLM uses the project profile + user's ticket description to **decide which specific files to read live**
  - Example: user describes "add password reset" + profile shows auth logic in `src/auth/` → LLM requests live read of `src/auth/auth.service.ts`, `src/auth/auth.controller.ts`
- Octokit fetches the actual current content of those files (fresh code, not stale profile data)
- Live-read files are added as "Current Code Context" in the LLM prompt

**Combined flow:**
1. Load project profile → LLM understands repo structure, patterns, tech stack
2. LLM analyzes profile + user description → selects most relevant files to read live (max ~10 files to stay within token budget)
3. Octokit reads those specific files from the current branch
4. Full context assembled: profile + live code + user description → generate ticket

**Fallback behavior:**
- If no profile or not ready: fall back to existing behavior (Octokit-only, no profile guidance) — no degradation
- If live read fails for a file (deleted, renamed): skip gracefully, log warning
- Profile content is truncated if exceeding token budget (configurable limit, default 30KB)

**Observability:**
- Log whether profile was available for each ticket generation
- Log which files were selected for live read and why
- Track profile-assisted vs non-profile ticket quality (future analytics hook)

---

### Story 15.6: Client — Project Profile Management UI

**Goal:** Let users view, re-scan, and manage project profiles from a persistent team-level interface.

**Acceptance Criteria:**

**Team Settings — "Repositories" section:**
- New tab/section in team settings: "Connected Repositories"
- Table/list of all profiled repos for this team:
  - Repo name (`owner/repo`)
  - Status badge: ✓ Profiled (green), Scanning... (blue spinner), Failed (red), Not profiled (gray)
  - Last scanned: formatted date ("Mar 12, 2026" or "3 days ago")
  - Scanned by: user who triggered the scan
  - File count, tech stack badges
- Actions per profile: "View Profile" (opens text in read-only modal), "Re-scan", "Delete"
- "Re-scan" triggers a new scan (overwrites previous profile)
- Empty state: "No repositories scanned yet. Connect a repo when creating a ticket to get started."

**Ticket feed header (subtle):**
- If the team has a default/most-used repo with a profile, show a small status line:
  - "📂 owner/repo — profiled Mar 12" (or "not profiled" with link to scan)
- Non-intrusive — just awareness that the team's repo is indexed

---

## Technical Notes

- **Scan is Octokit-based** — no cloning, no code download, read-only API access
- **Background job pattern**: Use existing NestJS queue/job infrastructure if available, or a simple async fire-and-forget with status polling
- **Profile size**: Target ~5-20KB text file for most repos. Cap at 50KB to stay within LLM context budget
- **Rate limits**: Octokit has rate limits — scan should batch API calls efficiently and respect limits
- **Security**: Only team members with repo access can trigger scans. Profile is team-visible

---

## Dependencies

- Existing GitHub/Octokit infrastructure (Epic 3.5, used in ticket creation)
- Existing Firestore infrastructure
- Existing team-scoped auth guards (Epic 3)

---

## Future (Not in this Epic)

- Automatic re-scan on webhook (push events)
- Diff-based incremental scan (only changed files)
- Multi-branch profiles
- Profile versioning / history
- Integration with forge CLI (`forge init` command)
