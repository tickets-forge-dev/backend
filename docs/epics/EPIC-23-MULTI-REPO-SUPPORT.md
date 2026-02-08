# Epic 23: Multi-Repository Support for Tickets

**Status:** Backlog → TODO (Blocker for Phase 4)
**Priority:** P0 (Blocker — features span multiple repos: client + backend + shared)
**Planned Start:** Phase 3 (ASAP)
**Dependencies:** Epic 20 (Spec Quality) — builds on existing spec system

## Summary

Currently, tickets are locked to a single GitHub repository. However, real-world features span **multiple repositories** (frontend client, backend server, shared packages, infrastructure). Users need to:

1. **Select multiple repositories** when creating a ticket
2. **Assign a branch to each repo** (feature branches can differ per repo)
3. **Run analysis across all repos** to detect file changes, APIs, and tech stack per repo
4. **Display spec per-repo** in the final ticket (what files changed in client vs backend vs shared)

## Problem Statement

- **Current limitation:** One ticket = one repo. Can't track a feature that spans client + backend.
- **User impact:** PMs must create separate tickets for each repo, losing context of unified feature.
- **Dev impact:** Developers must context-switch between tickets to see full picture of a feature.
- **Blocker:** Cannot ship features that require coordinated changes across multiple repos.

**Example:** "Add user authentication"
- Currently: Must create 3 tickets (client ticket, backend ticket, shared ticket)
- Desired: Single ticket with client branch, backend branch, shared branch selected upfront

## How It Works

### Stage 1: Ticket Creation — Multi-Repo Selection

**Design:**
1. **Repository Selector** enhanced to support **multi-select** with branch selection per repo
   - Shows: Repo name + available branches
   - User can click "Add Repository" to add more repos
   - Each repo has its own branch dropdown
   - Remove option per repo
   - At least 1 repo required, max ~5 repos per ticket

2. **Selected repos stored as array:**
   ```typescript
   repos: Array<{
     owner: string;
     name: string;
     branch: string; // e.g., "feature/auth" or "main"
     role?: 'primary' | 'secondary'; // optional: marks which repo is primary
   }>
   ```

3. **Validation:** All repos must be from authenticated GitHub accounts

### Stage 2: Repository Analysis — Per-Repo Detection

**When user submits ticket input:**
1. Run deep analysis **for each repository** (in parallel)
   - Fetch repo tree for each repo
   - Detect tech stack per repo
   - Extract relevant files per repo
   - Identify patterns (API layers, component structure, etc.)

2. **Combine results** into unified context
   - "Client uses React/Next.js, Backend uses NestJS, Shared uses TypeScript/Zod"
   - File changes are tagged by repo: `client/src/...`, `backend/src/...`, `shared/...`

3. **Pass to LLM** with repo context:
   - "This feature will affect client (React), backend (NestJS), and shared (types)"
   - Better spec generation because LLM knows the architecture across repos

### Stage 3: Spec Generation — Per-Repo Sections

**Tech Spec updated to include per-repo information:**

```typescript
TechSpec {
  // ... existing fields ...

  repositories: Array<{
    owner: string;
    name: string;
    branch: string;
    stack: {
      language: string;
      framework: string;
      packageManager: string;
    };
    fileChanges: FileChange[]; // only for this repo
    apiChanges?: ApiChanges; // only if backend
    testPlan?: TestPlan; // per-repo test plan
  }>
}
```

**Ticket detail display:**
- Hero section shows **all repos** with branches (e.g., "client@feature/auth, backend@main, shared@feature/auth")
- File Changes section **grouped by repo** with colored tabs (client tab, backend tab, shared tab)
- Each repo section shows its own stack, file changes, and test plan

## Stories

### 23-1: Backend — Multi-Repo AEC Domain Model
**Layer:** Backend (domain)
**Effort:** 3-5 days

Update the AEC (Agile Execution Context) domain to support multiple repositories.

**Acceptance Criteria:**
- `AEC` aggregate has `repositories: Repository[]` field
- `Repository` type includes `owner`, `name`, `branch`
- `createDraft()` factory accepts `repositories` array (minimum 1, max ~5)
- `Repository` is immutable (use value object pattern)
- Domain validates: all repos exist, authenticated, different branches allowed per repo
- Mapper updates to persist/restore repositories from Firestore

**Files:**
- `backend/src/tickets/domain/aec/Repository.ts` — **new** value object
- `backend/src/tickets/domain/aec/AEC.ts` — add `_repositories` field, update methods
- `backend/src/tickets/infrastructure/persistence/mappers/AECMapper.ts` — update to map repositories

### 23-2: Backend — Multi-Repo Deep Analysis
**Layer:** Backend (application)
**Effort:** 1 week

Enhance `DeepAnalysisServiceImpl` to analyze each repository independently and combine results.

**Acceptance Criteria:**
- `DeepAnalysisServiceImpl.analyze()` accepts `repositories: Repository[]`
- For each repo: run fingerprinting, file selection, LLM analysis in parallel
- Aggregate results: combine tech stacks, tag file changes by repo
- Pass aggregated context to LLM with clear repo boundaries
- Results include `analysisPerRepo: Map<string, AnalysisResult>`
- Performance: parallel analysis ~same speed as single-repo (N repos ≈ 1 repo time)

**Files:**
- `backend/src/tickets/application/services/DeepAnalysisServiceImpl.ts` — update
- `backend/src/tickets/domain/deep-analysis/DeepAnalysisResult.ts` — add per-repo structure

### 23-3: Backend — Update API Endpoint & DTOs
**Layer:** Backend (presentation + application)
**Effort:** 3-5 days

Update `/tickets/analyze-repo` to accept multiple repositories and update Create Ticket endpoint.

**Acceptance Criteria:**
- `AnalyzeRepositoryDto` accepts `repositories: Array<{ owner, name, branch }>`
- `CreateTicketDto` accepts `repositories` array instead of single repo
- Both endpoints validate min 1 repo, max ~5 repos per ticket
- Validation error messages are clear: "Select at least one repository"
- Backward compatibility: if user provides old single-repo format, map to array automatically
- Store in AEC and return in ticket response

**Files:**
- `backend/src/tickets/presentation/dto/AnalyzeRepositoryDto.ts` — update to accept repositories array
- `backend/src/tickets/presentation/dto/CreateTicketDto.ts` — update to accept repositories array
- `backend/src/tickets/presentation/controllers/tickets.controller.ts` — update endpoint handlers
- `backend/src/tickets/application/use-cases/AnalyzeRepositoryUseCase.ts` — new or update

### 23-4: Frontend — Multi-Repo Repository Selector UI
**Layer:** Frontend (presentation + stores)
**Effort:** 1 week

Complete redesign of repository selector for multi-select with branch selection per repo.

**Acceptance Criteria:**
- `RepositorySelector` component rewritten for multi-select
- **UI Layout:**
  - List of selected repos with remove buttons
  - Each repo row shows: `[repo-icon] owner/name [branch dropdown] [×]`
  - "Add Repository" button to add more repos
  - Dropdown to select repos from authenticated account
  - Branch dropdown for each repo (populated dynamically)
  - Validation error message: "Select at least one repository"
- **Behavior:**
  - Users can add up to 5 repos
  - Removing all repos shows validation error (disabled submit)
  - Branch selection persists per repo (if user adds repo A@main, then A@feature, then removes feature, re-adding A shows main again)
  - Selected repos appear in order (drag-to-reorder optional, v1: just list order)
- **Styling:** Consistent with ticket creation wizard (Linear-inspired, calm)

**Files:**
- `client/src/tickets/components/RepositorySelector.tsx` — rewrite for multi-select
- `client/src/tickets/components/RepositoryItem.tsx` — **new** component for each repo row
- `client/src/stores/tickets.store.ts` — update to store `repositories` array

### 23-5: Frontend — Wizard Update & Validation
**Layer:** Frontend (presentation + stores)
**Effort:** 3-5 days

Update the ticket creation wizard to handle multi-repo selection and validation.

**Acceptance Criteria:**
- `Stage1Input` component updated to use new multi-repo selector
- Form validation checks: at least 1 repo selected
- Submit button disabled if no repos selected (error message: "Select at least one repository")
- On submit, send `repositories` array to backend
- `generation-wizard.store.ts` tracks `repositories: Repository[]` state
- Progress updates include repo count (e.g., "Analyzing 2 repositories...")
- Errors per-repo displayed clearly (if one repo fails, others can still succeed)

**Files:**
- `client/src/tickets/components/wizard/Stage1Input.tsx` — update to use multi-repo selector
- `client/src/tickets/stores/generation-wizard.store.ts` — add repositories array state
- `client/src/tickets/services/question-round.service.ts` — update to send repositories

### 23-6: Frontend — Ticket Detail Display per Repo
**Layer:** Frontend (presentation)
**Effort:** 5-7 days

Update ticket detail page to display specs per repository with repo-specific sections.

**Acceptance Criteria:**
- **Hero section:** Shows all repos with branches (e.g., "🔀 client@feature/auth, backend@main, shared@feature/auth")
- **File Changes section:** Tabbed interface with repo tabs (client, backend, shared)
  - Each tab shows files changed in that repo only
  - Tab header includes file count (e.g., "Client (12 files)")
- **Tech Stack section:** Shows stack per repo (if multiple repos have different stacks)
- **API Endpoints:** Marked with repo origin (backend repo)
- **Test Plan:** Grouped by repo if different strategies per repo
- **Scope/Assumptions:** Apply to whole ticket (not per-repo)
- Mobile: Tabs collapse to dropdown selector (repo name)

**Files:**
- `client/app/(main)/tickets/[id]/page.tsx` — add repo tabs for file changes, update sections
- `client/src/tickets/components/FileChangesWithTabs.tsx` — **new** tabbed file changes view
- `client/src/tickets/components/RepositoryBadges.tsx` — **new** display all repos+branches in header

### 23-7: Backend — Tests & Validation
**Layer:** Backend (test)
**Effort:** 3-5 days

Add comprehensive tests for multi-repo support across domain, use cases, and API.

**Acceptance Criteria:**
- Domain tests: Repository value object creation, validation
- Use case tests: analyzing multiple repos, error handling per repo
- API tests: CreateTicket with multi-repo, AnalyzeRepository with multi-repo
- Edge cases: 1 repo (should still work), max repos, invalid branch per repo
- Performance tests: parallel analysis of 3-5 repos
- Error scenarios: one repo fails, others succeed (partial success)

**Files:**
- `backend/src/tickets/domain/aec/__tests__/Repository.spec.ts` — **new**
- `backend/src/tickets/application/services/__tests__/DeepAnalysisServiceImpl.spec.ts` — update
- `backend/src/tickets/presentation/controllers/__tests__/tickets.controller.spec.ts` — update

### 23-8: Frontend — Tests & E2E
**Layer:** Frontend (test)
**Effort:** 3-5 days

Add tests for multi-repo UI and E2E flow.

**Acceptance Criteria:**
- Unit tests: RepositorySelector multi-select behavior, branch selection
- Store tests: adding/removing repos, validation
- E2E tests: full flow — select 2 repos, different branches, create ticket
- Error scenarios: removing all repos, invalid repos

**Files:**
- `client/src/tickets/components/__tests__/RepositorySelector.spec.ts` — **new**
- `client/src/tickets/stores/__tests__/generation-wizard.store.spec.ts` — update
- `client/__tests__/e2e/multi-repo-ticket-creation.spec.ts` — **new** E2E test

## Success Metrics

- ✅ Users can select 2-5 repos when creating a ticket
- ✅ Each repo can have its own branch selected
- ✅ Spec generation works across multiple repos
- ✅ File changes are properly attributed to repos
- ✅ Ticket detail page clearly displays repo boundaries
- ✅ API analysis per-repo (no cross-repo API contamination)
- ✅ Zero regression: single-repo tickets still work perfectly
- ✅ Performance: 3-5 repos analyzed in ~same time as 1 repo (parallel)

## Notes

- **Backward compatibility:** Old tickets with single repo should still display/work
- **Branch validation:** GitHub API validates branch exists before ticket creation
- **Max repos:** Set to 5 initially, can increase later if needed
- **Future enhancement:** Drag-to-reorder repos, marking primary vs secondary repos
- **Integration:** Works seamlessly with existing Epic 20 (Spec Quality) features

---

**Owner:** PM/Architecture
**Last Updated:** 2026-02-08
