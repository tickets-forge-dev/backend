# Background Finalization & Job Cancellation

**Date:** 2026-03-19
**Status:** Approved design
**Scope:** Ticket spec finalization only (not repo analysis or question generation)

---

## Problem

Spec finalization (`/tickets/{id}/finalize`) is a long-running operation (30-180 seconds) that currently:
- Blocks the UI with no cancel option
- Loses all progress if the browser is closed or the page is refreshed
- Cannot survive server restarts
- Has no way to "send to background" and continue working

## Solution

Every finalization is a **background job from the start**. The backend spawns a detached async task, tracks progress in Firestore, and the frontend subscribes via `onSnapshot` for real-time updates. Users can watch the progress dialog, send it to background, or cancel — the job runs independently of the browser session.

---

## Data Model

### Job Document: `teams/{teamId}/jobs/{jobId}`

```typescript
interface GenerationJob {
  id: string;
  teamId: string;            // For cross-team queries (e.g. JobRecoveryService)
  ticketId: string;          // AEC being finalized
  ticketTitle: string;       // For display in jobs panel
  createdBy: string;         // userId — ownership for isolation
  status: 'running' | 'retrying' | 'completed' | 'failed' | 'cancelled';
  phase: string | null;      // e.g. "Generating acceptance criteria..."
  percent: number;           // 0-100
  attempt: number;           // 1 or 2 (auto-retry once on failure)
  previousJobId: string | null; // Links to failed job on manual retry (traceability)
  error: string | null;      // Failure reason if status === 'failed'
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt: Timestamp | null;
}
```

`GenerationJob` is a domain entity (class, not just an interface) with:
- Private state, public getters
- Status transition methods that enforce valid transitions (e.g. `running` → `completed|failed|cancelled`, never `completed` → `running`)
- Factory methods: `createNew()`, `reconstitute()`

### AEC Domain Change

```typescript
_generationJobId: string | null;  // Links to active job, prevents duplicate finalization
```

Add `setGenerationJobId(id)` and `clearGenerationJobId()` methods to AEC aggregate. Update `reconstitute()` factory method and `createDraft()` to include this field. Update Firestore mapper (`AECMapper`) to persist/hydrate it.

### Cleanup

Completed/failed/cancelled jobs are kept for 24 hours for visibility. Pruned opportunistically on job creation and on `GET /jobs` queries — no cron needed.

---

## Backend Architecture

### Layer: Presentation

The controller is a thin adapter — all business logic lives in use cases.

#### `POST /tickets/{id}/finalize-async` → `{ jobId: string }`

Controller delegates to `StartFinalizationUseCase`. Returns `{ jobId }`.

#### `POST /jobs/{jobId}/cancel` → `204 No Content`

Controller delegates to `CancelJobUseCase`.

#### `GET /jobs?teamId={teamId}` → `GenerationJob[]`

Controller delegates to `ListUserJobsUseCase`. Returns jobs where `createdBy === requestingUserId` and `createdAt > 24h ago`. Prunes expired jobs opportunistically. Used for initial page load before Firestore listener connects.

#### `POST /jobs/{jobId}/retry` → `{ jobId: string }`

Controller delegates to `RetryJobUseCase`. Returns new `{ jobId }`.

### Layer: Application — Use Cases

#### `StartFinalizationUseCase`

```
execute(ticketId, userId, teamId):
  1. Load AEC from repository
  2. Validate: AEC exists, is draft, has answers submitted
  3. Check team token budget via usageBudgetRepository.getOrCreate(teamId, month)
     - If tokensUsed >= tokenLimit → throw QuotaExceededError
  4. Check aec.generationJobId — if set, load job:
     - If job status is 'running' or 'retrying' → throw ConflictError
     - Otherwise (completed/failed/cancelled) → clear stale reference
  5. Firestore transaction (atomic):
     a. Count user's active jobs: createdBy === userId AND status in ['running', 'retrying']
     b. If count >= 3 → throw TooManyJobsError
     c. Create job document
     d. Set aec.generationJobId = jobId
  6. Return { jobId }
  7. Spawn detached async: void backgroundFinalizationService.run(jobId, aecId, teamId)
```

**Atomicity:** Steps 5a-5d (concurrency check + job creation + AEC update) use a Firestore transaction to prevent both orphaned state and TOCTOU races.

#### `CancelJobUseCase`

```
execute(jobId, userId, teamId):
  1. Load job from JobRepository
  2. Validate job.createdBy === userId (ownership)
  3. Validate job.status in ['running', 'retrying'] (can only cancel active jobs)
  4. Set job.status = 'cancelled' via domain method
  5. Save job
  6. Load AEC, clear generationJobId, save AEC
```

#### `RetryJobUseCase`

```
execute(jobId, userId, teamId):
  1. Load original job from JobRepository
  2. Validate job.createdBy === userId (ownership)
  3. Validate job.status === 'failed' (can only retry failed jobs)
  4. Check team token budget — if exhausted, throw QuotaExceededError
  5. Firestore transaction (atomic — same pattern as StartFinalizationUseCase):
     a. Count user's active jobs — if >= 3, throw TooManyJobsError
     b. Create new job via GenerationJob.createNew() with previousJobId = original jobId
     c. Update aec.generationJobId to new jobId
  6. Spawn detached async finalization
  7. Return new { jobId }
```

#### `ListUserJobsUseCase`

```
execute(userId, teamId):
  1. Query JobRepository: createdBy === userId, createdAt > 24h ago
  2. Prune any expired jobs found
  3. Return job list
```

### Layer: Application — Services

#### `BackgroundFinalizationService`

```
run(jobId, aecId, teamId):
  1. Load AEC from AECRepository
  2. Build CodebaseContext (same logic as existing FinalizeSpecUseCase):
     → Load repository analysis from AEC (already persisted during Stage 2)
     → Build generation preferences from AEC fields (wireframes, API spec, etc.)
     → Assemble question answers from AEC
     Note: BackgroundFinalizationService needs the same ports injected as
     FinalizeSpecUseCase (AECRepository, TechSpecGeneratorPort, NotificationService).
     The existing FinalizeSpecUseCase can be refactored to extract a shared
     buildContext() helper, or BackgroundFinalizationService can delegate to it directly.
  3. Create GenerationProgressCallback implementation:
     - onPhaseUpdate(phase, percent): calls jobRepository.updateProgress(jobId, teamId, phase, percent)
     - isCancelled(): calls jobRepository.getStatus(jobId, teamId), returns true if 'cancelled'
  4. Call techSpecGenerator.generateWithAnswers(aec, context, progressCallback)
  5. On success:
     → Check job status one final time — if 'cancelled', discard result and return
     → Save techSpec to AEC
     → Update AEC status
     → jobRepository.markCompleted(jobId, teamId)
     → Clear aec.generationJobId
     → Send notification via notificationService if ticket is assigned
  6. On failure:
     → Check job status — if 'cancelled', return (don't retry a cancelled job)
     → Read current attempt from jobRepository
     → If attempt === 1:
        jobRepository.markRetrying(jobId, teamId)  // sets status='retrying', attempt=2
        Re-run full finalization from beginning
     → If attempt === 2:
        jobRepository.markFailed(jobId, teamId, errorMessage)
        Clear aec.generationJobId (allow manual retry)
```

**Key:** `BackgroundFinalizationService` never reads/writes Firestore directly. All persistence goes through `JobRepository` and `AECRepository` ports. This keeps the application layer infrastructure-agnostic.

**Cancellation model:** Cooperative. The `isCancelled()` callback is checked by the tech spec generator before each LLM call phase. An in-flight LLM call will complete but its result is discarded. Worst case: one wasted call (~5-15s).

**Retry model:** Full retry from the beginning, not partial resume. LLM calls depend on each other, so partial resume would be fragile. Note: the existing per-LLM-call retry logic in `TechSpecGeneratorImpl` (3 retries with exponential backoff) is preserved. The job-level retry (attempt 1 → attempt 2) only triggers when a catastrophic failure survives the inner per-call retries.

#### `JobRecoveryService` (Bootstrap)

On application startup:
1. Query all jobs with `status in ['running', 'retrying']` across all teams (uses `teamId` field on job document for efficient querying)
2. For each orphaned job: re-spawn `backgroundFinalizationService.run()` with current attempt number
3. This covers server restart/crash mid-generation

### Layer: Domain

#### `GenerationJob` Entity

Domain class with:
- Private fields, public getters
- Status transition methods: `markRetrying()`, `markCompleted()`, `markFailed(error)`, `markCancelled()`
- Factory: `static createNew(teamId, ticketId, ticketTitle, createdBy, previousJobId?)`
- Factory: `static reconstitute(props)` for hydration from persistence

**Status transition matrix (enforced by domain entity):**

```
             → running  → retrying  → completed  → failed  → cancelled
running      |    -     |    ✓      |     ✓      |   ✓     |    ✓
retrying     |    -     |    -      |     ✓      |   ✓     |    ✓
completed    |    -     |    -      |     -      |   -     |    -
failed       |    -     |    -      |     -      |   -     |    -
cancelled    |    -     |    -      |     -      |   -     |    -
```

**Critical rule:** `markCompleted()` and `markFailed()` must check current status first. If the job has been cancelled (status is `cancelled`), these methods are no-ops — they return without modifying state. This prevents the race where `BackgroundFinalizationService` completes successfully just after `CancelJobUseCase` sets status to `cancelled`. The cancelled state always wins.

#### `AEC` Aggregate Updates

- Add private `_generationJobId: string | null` with getter
- Add `setGenerationJobId(id: string)` and `clearGenerationJobId()` methods
- Update `reconstitute()` factory to include `generationJobId` parameter
- `createDraft()` initializes `generationJobId` to `null`

### Layer: Application — Ports

#### `GenerationProgressCallback` (Application Layer)

```typescript
interface GenerationProgressCallback {
  onPhaseUpdate(phase: string, percent: number): Promise<void>;
  isCancelled(): Promise<boolean>;
}
```

Defined in the application layer alongside `TechSpecGeneratorPort`. The `TechSpecGeneratorPort.generateWithAnswers()` method accepts an optional `progressCallback` parameter. The Firestore-backed implementation lives in infrastructure.

#### `JobRepository` Port

```typescript
interface JobRepository {
  save(job: GenerationJob): Promise<void>;
  findById(jobId: string, teamId: string): Promise<GenerationJob | null>;
  findActiveByUser(userId: string, teamId: string): Promise<GenerationJob[]>;
  findByTicketId(ticketId: string, teamId: string): Promise<GenerationJob | null>;
  findOrphaned(): Promise<GenerationJob[]>;  // status in ['running', 'retrying'] across all teams
  updateProgress(jobId: string, teamId: string, phase: string, percent: number): Promise<void>;
  getStatus(jobId: string, teamId: string): Promise<string>;
  markCompleted(jobId: string, teamId: string): Promise<void>;
  markRetrying(jobId: string, teamId: string): Promise<void>;
  markFailed(jobId: string, teamId: string, error: string): Promise<void>;
  markCancelled(jobId: string, teamId: string): Promise<void>;
  pruneExpired(teamId: string): Promise<void>;
}
```

### Layer: Infrastructure

#### `FirestoreJobRepository`

Implements `JobRepository` port. Maps between `GenerationJob` domain entity and Firestore documents using a `JobMapper`. Firestore path: `teams/{teamId}/jobs/{jobId}`.

**Note on `findOrphaned()`:** This method queries for running/retrying jobs across all teams. Since jobs are in team-scoped subcollections, this requires a Firestore **collection group query** on `jobs`. A collection group index must be created for the `status` field. The `teamId` field on the job document allows the recovery service to know which team context to use without needing to parse the document path.

#### `JobMapper`

Translates between `GenerationJob` domain entity and Firestore document shape (DTO ↔ Domain ↔ Persistence boundary translation per CLAUDE.md rule 2).

#### `TechSpecGeneratorImpl` Changes

Accept optional `GenerationProgressCallback` in `generateWithAnswers()`. Call `progressCallback.onPhaseUpdate()` between LLM phases. Call `progressCallback.isCancelled()` before each phase — if true, throw a `GenerationCancelledError` that `BackgroundFinalizationService` catches cleanly.

### Migration Plan

The existing synchronous `POST /tickets/{id}/finalize` endpoint is **removed** and replaced by `POST /tickets/{id}/finalize-async`. Since the frontend and backend are deployed together (monorepo), this is a clean swap with no deprecation period needed. The frontend's wizard store replaces its `finalize` call with `finalize-async` + job subscription in the same deploy.

---

## Frontend Architecture

### Jobs Store: `jobs.store.ts`

```typescript
interface JobsState {
  jobs: GenerationJob[];
  isSubscribed: boolean;
  subscribe: (teamId: string, userId: string) => () => void;
  cancelJob: (jobId: string) => Promise<void>;
  retryJob: (jobId: string) => Promise<void>;
}
```

- `subscribe()` sets up Firestore `onSnapshot` on `teams/{teamId}/jobs`
  - Filtered: `where('createdBy', '==', userId)`
  - Filtered: `where('createdAt', '>', 24h ago)`
  - Returns unsubscribe function
- Called once when app shell mounts (after auth), lives for the session

### Jobs Panel: Tickets Page

- Right-side panel (~240px) on `/tickets`, visible only when jobs exist
- Positioned to the left of any existing sidebar; no z-index conflict with the collapsible nav sidebar
- Each job card shows:
  - Ticket title (truncated)
  - Status indicator: spinning dot (running/retrying), checkmark (completed), X (failed), — (cancelled)
  - Phase text: "Generating test plan..."
  - Progress percentage
  - Elapsed time (computed from `createdAt`)
  - Actions per status:
    - Running → "Cancel" button
    - Failed → "Retry" button
    - Completed → "View" link (navigates to ticket detail)
    - Cancelled → fades out after a few seconds
- Styled with existing design tokens: `border-[var(--border-subtle)]`, `var(--text-secondary)`, etc.
- Mobile: collapses to floating badge with count, tap to expand as bottom sheet

### Wizard Flow Changes

1. **"Generate Spec" button click:**
   - Calls `POST /finalize-async`, receives `{ jobId }`
   - Opens progress dialog (same AnalysisProgressDialog UX)
   - Dialog subscribes to `onSnapshot(teams/{teamId}/jobs/{jobId})` for progress

2. **Progress dialog buttons:**
   - "Send to Background" → `router.push('/tickets')`, job continues in background
   - "Cancel" → `POST /jobs/{jobId}/cancel`, returns to wizard draft stage

3. **Completion while watching:**
   - Dialog shows "Done!" with "View Spec" button → navigates to ticket detail

4. **Error while watching:**
   - If attempt 1 fails: dialog shows "Retrying..." (auto-retry)
   - If attempt 2 fails: dialog shows error with "Retry" and "Cancel" buttons

### App Shell Integration

- Firestore `onSnapshot` subscription starts in the authenticated layout (global)
- Jobs panel only renders on `/tickets` page
- Navigation to `/tickets` shows current state immediately (no loading delay)

---

## User Isolation & Concurrency Guarantees

### Per-User Isolation

1. **Job ownership:** Every job has `createdBy: userId`, set at creation, immutable
2. **Query isolation:** All Firestore queries filter by `createdBy === currentUserId`
3. **Concurrency limit:** 3 max per user, not per team. One user's jobs never block another
4. **Cancel authorization:** Backend validates `job.createdBy === requestingUserId` via use case
5. **Panel isolation:** Jobs panel shows only the current user's jobs

### Per-Team Isolation

6. **Team scoping:** Jobs live under `teams/{teamId}/jobs/`. A user from Team A cannot query Team B's collection
7. **Backend authorization:** All endpoints validate team membership via auth middleware

### Concurrent Multi-User Guarantees

8. **No global locks:** Job creation writes to individual documents, no shared counters
9. **Atomic concurrency check:** Per-user job count and job creation happen in a single Firestore transaction, preventing TOCTOU races
10. **Stateless processing:** Each `runFinalization()` operates on its own AEC and job document. No shared in-memory state. 10 users x 3 jobs = 30 independent async tasks
11. **Firestore handles concurrent writes natively:** Each job writes to its own document path

### Duplicate Prevention

12. **AEC-level guard:** `generationJobId` on AEC prevents two jobs for the same ticket
13. **Two-tab safety:** Second finalization attempt for same ticket returns `409 Conflict`

---

## Phase Mapping

The finalization pipeline reports these phases to the job document. These phases correspond to the sequential stages within `TechSpecGeneratorImpl.generateWithAnswers()`. The existing method will be instrumented to call `progressCallback.onPhaseUpdate()` between each stage. Some stages run LLM calls in parallel (e.g., acceptance criteria + file changes) — the phase reports when the group starts, and the percent advances when the group completes.

| Phase | Percent | Description |
|-------|---------|-------------|
| `preparing` | 5 | Loading AEC and context |
| `problem_statement` | 15 | Generating problem statement |
| `solution` | 25 | Generating solution approach |
| `acceptance_criteria` | 40 | Generating acceptance criteria |
| `file_changes` | 55 | Identifying file changes |
| `dependencies` | 65 | Detecting dependencies and scope |
| `test_plan` | 75 | Generating test plan |
| `visual_expectations` | 85 | Generating visual expectations |
| `saving` | 95 | Persisting tech spec to AEC |
| `complete` | 100 | Done |

---

## Files to Create/Modify

### Backend — New Files

| File | Purpose |
|------|---------|
| `backend/src/jobs/domain/GenerationJob.ts` | Domain entity with status state machine |
| `backend/src/jobs/application/ports/JobRepository.port.ts` | Repository port |
| `backend/src/jobs/application/ports/GenerationProgressCallback.ts` | Progress callback interface |
| `backend/src/jobs/application/use-cases/StartFinalizationUseCase.ts` | Validates, creates job, spawns async task |
| `backend/src/jobs/application/use-cases/CancelJobUseCase.ts` | Ownership-checked cancellation |
| `backend/src/jobs/application/use-cases/RetryJobUseCase.ts` | Creates new job from failed one |
| `backend/src/jobs/application/use-cases/ListUserJobsUseCase.ts` | Filtered job listing |
| `backend/src/jobs/application/services/BackgroundFinalizationService.ts` | Core job runner |
| `backend/src/jobs/application/services/JobRecoveryService.ts` | Startup recovery |
| `backend/src/jobs/infrastructure/persistence/FirestoreJobRepository.ts` | Firestore adapter |
| `backend/src/jobs/infrastructure/mappers/JobMapper.ts` | Domain ↔ Persistence mapper |
| `backend/src/jobs/presentation/controllers/jobs.controller.ts` | REST endpoints (thin adapter) |
| `backend/src/jobs/presentation/dto/` | Request/response DTOs |
| `backend/src/jobs/jobs.module.ts` | NestJS module |

### Backend — Modified Files

| File | Change |
|------|--------|
| `backend/src/tickets/domain/aec/AEC.ts` | Add `generationJobId` field, getter, setter, update `reconstitute()` and `createDraft()` |
| `backend/src/tickets/infrastructure/mappers/AECMapper.ts` | Map `generationJobId` to/from Firestore |
| `backend/src/tickets/application/services/TechSpecGeneratorImpl.ts` | Accept `GenerationProgressCallback`, call between phases, check `isCancelled()` |
| `backend/src/tickets/application/ports/TechSpecGeneratorPort.ts` | Add optional `progressCallback` parameter to `generateWithAnswers()` |
| `backend/src/app.module.ts` | Import `JobsModule` |

### Frontend — New Files

| File | Purpose |
|------|---------|
| `client/src/stores/jobs.store.ts` | Zustand store with Firestore `onSnapshot` subscription |
| `client/src/tickets/components/JobsPanel.tsx` | Jobs panel component for `/tickets` page |
| `client/src/tickets/components/JobCard.tsx` | Individual job card with status/actions |

### Frontend — Modified Files

| File | Change |
|------|--------|
| `client/src/tickets/stores/generation-wizard.store.ts` | Replace `finalize` with `finalize-async`, subscribe to job progress via `onSnapshot` |
| `client/src/tickets/components/GenerationWizard.tsx` | Add "Send to Background" + "Cancel" buttons to progress dialog |
| `client/src/tickets/components/wizard/AnalysisProgressDialog.tsx` | Accept job-based progress props, add action buttons |
| `client/app/(main)/tickets/page.tsx` | Render `JobsPanel` alongside tickets list |
| `client/app/(main)/layout.tsx` | Initialize jobs store Firestore subscription on auth |
