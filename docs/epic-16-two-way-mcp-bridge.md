# Epic 16: Two-Way MCP Bridge — Local Codebase Integration

**Priority:** P1
**Goal:** Enable developers to connect local codebases to Forge via the CLI/MCP — no GitHub OAuth required. This unlocks enterprise adoption (SOC2-compliant) and supports non-GitHub repos (GitLab, Bitbucket, local-only).

---

## Context

Today, Forge requires GitHub OAuth integration to access user codebases. Enterprise customers with strict security policies (SOC2, no third-party OAuth apps) cannot integrate. This is a hard adoption blocker.

The Forge CLI/MCP server already runs locally on the developer's machine and has `simple-git` + filesystem access. By making it a two-way bridge — not just reading tickets from Forge, but also **uploading codebase profiles** and **creating tickets** — we bypass the enterprise security objection entirely. No GitHub tokens ever leave the developer's machine.

**Key insight:** The MCP currently has 7 tools (all read/update). Adding `create_ticket` + profile upload makes it fully two-way — a complete developer interface.

**Design decisions:**
- **CLI-first:** All new capabilities are CLI/MCP commands, not web UI
- **Profile-based:** Local codebases are represented as project profiles (same format as Epic 15's GitHub-scanned profiles)
- **No web brainstorm UI:** Brainstorming happens in Claude Code via MCP prompts (BMAD-style agents). The web app stays focused on ticket management and spec generation
- **Pure function extraction:** `ProfileTextBuilder` and `RepositoryFingerprintService` are copied to CLI (both are pure functions with zero NestJS deps)

---

## Architecture

```
Developer's Machine                    Forge Backend
┌──────────────────────┐              ┌─────────────────────┐
│  forge profile       │──POST───────>│  /project-profiles/ │
│  (scan local repo)   │  upload      │  upload             │
│                      │              │                     │
│  forge create        │──POST───────>│  /tickets/          │
│  (create ticket)     │  create-cli  │  create-from-cli    │
│                      │              │                     │
│  MCP: create_ticket  │──POST───────>│  (same endpoint)    │
│  MCP: brainstorm     │  (prompt)    │                     │
└──────────────────────┘              └─────────────────────┘
     │                                        │
     │ reads local files                      │ stores profile
     │ via git + fs                           │ in Firestore
     ▼                                        ▼
  Local Codebase                    ProjectProfile entity
  (no GitHub needed)                (source: 'local')
```

---

## Stories

### Story 16.1: GitService Expansion — Structured File Tree + Commit SHA

**Goal:** Expand the CLI's `GitService` to return structured file tree data compatible with `ProfileBuildInput.fileTree` format.

**Acceptance Criteria:**
- New `getStructuredFileTree()` method returns `Array<{ path, type, size? }>` via `git ls-tree -r -l HEAD`
- No 200-file limit (unlike current `getFileTree()`)
- New `getCommitSha()` method returns HEAD SHA via `git rev-parse HEAD`
- Existing methods unchanged (backward compatible)
- Unit tests for both new methods

**File:** `forge-cli/src/services/git.service.ts`

---

### Story 16.2: Local Profile Scanner Service

**Goal:** Extract pure profile-building logic from the backend and create a CLI-side service that scans local codebases.

**Acceptance Criteria:**
- New `forge-cli/src/services/profile.service.ts` with `scanLocalRepo(repoPath) → ProfileResult`
- Extracts and adapts `extractFingerprint()` from `RepositoryFingerprintService` (pure function, regex-based)
- Extracts and adapts `ProfileTextBuilder.build()` (pure static method, no deps)
- Reads config files from disk: `package.json`, `tsconfig.json`, `Cargo.toml`, `go.mod`, `requirements.txt`, `pyproject.toml`, `Gemfile`, `pom.xml`, `build.gradle`, `.eslintrc.json`, `.prettierrc`, `docker-compose.yml`, `Dockerfile`
- Reads `README.md` (capped at 2000 chars)
- Returns `{ profileContent, fileCount, techStack, commitSha, branch, repoName }`
- Profile text follows same `=== TECH STACK ===`, `=== FILE STRUCTURE ===` format as backend
- Profile size capped at 50KB (same as `MAX_PROFILE_SIZE` in backend)
- Unit tests

**Key files to reference:**
- `backend/src/tickets/application/services/RepositoryFingerprintService.ts`
- `backend/src/project-profiles/application/services/ProfileTextBuilder.ts`
- `backend/src/project-profiles/application/services/BackgroundScanService.ts` (CONFIG_FILES list)

---

### Story 16.3: Backend — Profile Upload Endpoint + Domain Changes

**Goal:** Add a `POST /project-profiles/upload` endpoint for CLI-sourced profiles, and add `source` field to the `ProjectProfile` domain entity.

**Acceptance Criteria:**
- New endpoint: `POST /project-profiles/upload` accepts `{ repoPath, branch, commitSha, profileContent, fileCount, techStack }`
- Validates: `profileContent.length ≤ 50,000`, required fields present
- Derives `repoOwner = 'local'`, `repoName` from `repoPath`
- Creates or updates `ProjectProfile` entity (upsert by `teamId + 'local' + repoName`)
- New `source` field on `ProjectProfile`: `'github' | 'local'` (default `'github'`)
- `source` field persisted in Firestore mapper
- Returns `{ profileId, status: 'ready', repoName }`
- New `UploadProfileUseCase` in application layer
- Guarded by `FirebaseAuthGuard` + `WorkspaceGuard`
- Existing endpoints unchanged

**Files:**
- `backend/src/project-profiles/domain/ProjectProfile.ts` — add `source` field
- `backend/src/project-profiles/infrastructure/persistence/FirestoreProjectProfileRepository.ts` — map `source`
- `backend/src/project-profiles/presentation/controllers/project-profiles.controller.ts` — new endpoint
- `backend/src/project-profiles/application/use-cases/UploadProfileUseCase.ts` — new use case

---

### Story 16.4: CLI Command — `forge profile`

**Goal:** New CLI command that scans the local codebase and uploads the profile to Forge.

**Acceptance Criteria:**
- `forge profile` — scans current directory, uploads profile
- `forge profile /path/to/repo` — scans specific path
- `forge profile --status` — checks if profile exists for current repo
- Verifies directory is a git repo (checks `.git/` exists)
- Shows spinner: "Scanning codebase..."
- Shows detected stack: "Detected: TypeScript, React, Next.js (1,247 files)"
- Uploads via `POST /api/project-profiles/upload`
- Shows success: "Profile uploaded. Create tickets at forge-ai.dev"
- Handles errors gracefully (not a git repo, auth expired, server unreachable)
- Registered in `forge-cli/src/index.ts`

**File:** `forge-cli/src/commands/profile.ts`

---

### Story 16.5: CLI Command — `forge create`

**Goal:** New CLI command that creates tickets from the terminal with local codebase context.

**Acceptance Criteria:**
- `forge create "Add Apple Sign In"` — creates ticket with title
- `forge create "Add Apple Sign In" -d "Use Firebase Auth"` — with description
- `forge create "Fix login redirect" -t bug` — with type (feature|bug|task, default: feature)
- If in a git repo, automatically looks up existing local profile (or prompts to run `forge profile` first)
- Calls `POST /api/tickets/create-from-cli` with title, description, type, repoOwner, repoName, profileId
- Backend creates AEC and starts background spec generation
- Shows: "Ticket created: Add Apple Sign In → forge-ai.dev/tickets/{slug}"
- Registered in `forge-cli/src/index.ts`

**Backend endpoint:** `POST /tickets/create-from-cli`
- Creates AEC with provided fields
- Attaches local profile context if profileId provided
- Starts background spec gen job (same as web app's auto-finalize for maxRounds=0)
- Returns `{ ticketId, slug, url }`

**Files:**
- `forge-cli/src/commands/create.ts` — new CLI command
- `backend/src/tickets/presentation/controllers/tickets.controller.ts` — new endpoint

---

### Story 16.6: MCP Tool — `create_ticket`

**Goal:** New MCP tool that allows Claude Code to create Forge tickets programmatically.

**Acceptance Criteria:**
- Tool name: `create_ticket`
- Input: `{ title (required), description, type, repoPath }`
- Resolves repo path (input or cwd), scans for local profile
- Calls `POST /tickets/create-from-cli` via ApiService
- Returns ticket ID + URL as text content
- Registered in MCP server's `ListToolsRequestSchema` and `CallToolRequestSchema`
- Unit tests

**File:** `forge-cli/src/mcp/tools/create-ticket.ts`

---

### Story 16.7: MCP Prompt — `brainstorm`

**Goal:** New MCP prompt that gives Claude Code codebase context for brainstorming.

**Acceptance Criteria:**
- Prompt name: `brainstorm`
- Arguments: `{ topic? }` (optional brainstorming topic)
- Loads agent guide from `forge-cli/src/agents/dev-brainstormer.md`
- Gets local repo context via GitService
- Looks up project profile via API
- Injects profile text into system context
- Returns multi-message prompt with agent guide + profile + topic
- Agent guide is focused: "Help developer explore feature ideas and architecture decisions grounded in codebase. Always reference existing patterns. Every brainstorm should lead toward a concrete ticket."
- Registered in MCP server's `ListPromptsRequestSchema` and `GetPromptRequestSchema`

**Files:**
- `forge-cli/src/mcp/prompts/forge-brainstorm.ts` — prompt handler
- `forge-cli/src/agents/dev-brainstormer.md` — agent guide

---

## Dependencies

- **Epic 15 (Project Profiles):** Reuses `ProjectProfile` entity, `ProjectProfileRepository`, `ProfileTextBuilder`. Epic 15's backend work (stories 15.1-15.3) should be complete or concurrent.
- **Epic 6 (MCP Server):** Stories 16.6 and 16.7 extend the existing MCP server. All 13 stories complete.
- **Epic 5 (CLI Foundation):** Stories 16.4 and 16.5 extend the existing CLI. All 8 stories complete.

## Story Ordering

```
16.1 (GitService) → 16.2 (Profile Scanner) → 16.3 (Backend Upload) → 16.4 (forge profile)
                                                                    → 16.5 (forge create)
                                                                    → 16.6 (MCP create_ticket)
                                                                    → 16.7 (MCP brainstorm)
```

Stories 16.4-16.7 can be worked in parallel after 16.1-16.3 are done.

## Future Considerations (Parked)

- **WebSocket tunnel:** For on-demand file reads during deep analysis of local repos (Phase 2)
- **Forgy (AI assistant):** Contextual AI assistance in the web app — needs separate product design session
- **Web brainstorm UI:** Parked — brainstorming happens in Claude Code via MCP, not in the web app
- **Auto-refresh profiles:** CLI could watch for git changes and re-upload profiles automatically
