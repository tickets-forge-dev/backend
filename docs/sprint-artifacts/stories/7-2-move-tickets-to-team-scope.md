# Story 7.2: Move Tickets to Team Scope

Status: review

## Story

As a team member (PM or developer),
I want tickets to be explicitly scoped to a team using a direct `teamId` field,
so that ticket lists are reliably isolated per-team and the CLI can request tickets for a specific team without relying on server-side user document state.

## Acceptance Criteria

1. The `AEC` domain model has a `teamId` field (replacing the opaque derived `workspaceId`). The `workspaceId` field is removed from the domain model and all downstream layers.
2. Firestore storage path changes from `workspaces/{workspaceId}/aecs/{aecId}` to `teams/{teamId}/aecs/{aecId}`. All repository read/write operations use this new path.
3. The backend accepts an `x-team-id` request header for explicit team context. `WorkspaceGuard` is replaced or updated to read `teamId` from this header (preferred) or fall back to `user.getCurrentTeamId()` from the Firestore user document.
4. `GET /api/tickets` returns only tickets where `teamId` matches the resolved team from AC3. No tickets from other teams are returned.
5. `POST /api/tickets` sets `teamId` on the new ticket from the resolved team (AC3). Creating a ticket outside a team context returns 400.
6. The frontend sends `x-team-id: {currentTeam.id}` as a default header on all API requests (via the Axios client interceptor). The `useEffect` reload-on-team-change in `TicketsListPage` remains and continues to work.
7. The CLI sends `x-team-id: {config.teamId}` as a header on all API requests via `ApiService`. No change to CLI commands is needed.
8. `npm run test` in `backend` → all ticket-related tests pass at 0 failures.
9. `npm run typecheck` in `forge-cli` → 0 errors (only ApiService header change needed).

## Tasks / Subtasks

- [x] Task 1: Backend — Update AEC domain model (AC: 1)
  - [x] In `backend/src/tickets/domain/aec/AEC.ts`: replace `workspaceId` parameter with `teamId` in constructor and all factory/create methods
  - [x] In `backend/src/tickets/application/ports/AECRepository.ts`: rename `findByWorkspace(workspaceId)` → `findByTeam(teamId)`, `countByWorkspace` → `countByTeam`, `countByWorkspaceAndCreator` → `countByTeamAndCreator`
  - [x] Update all use cases that receive or pass `workspaceId` → `teamId` (25+ use cases updated via bulk rename)

- [x] Task 2: Backend — Update Firestore repository (AC: 2)
  - [x] In `FirestoreAECRepository.ts`: change collection path from `workspaces/${workspaceId}/aecs/${aecId}` → `teams/${teamId}/aecs/${aecId}`
  - [x] `findById` now uses `collectionGroup('aecs').where('id', '==', id).limit(1)` for efficiency
  - [x] Update `AECMapper.ts`: replaced `workspaceId` field with `teamId` in `AECDocument` interface and all toDocument/toDomain mappings

- [x] Task 3: Backend — Update team context resolution (AC: 3, 4, 5)
  - [x] `WorkspaceGuard.ts` updated: reads `x-team-id` header first (priority 1), falls back to user's Firestore current team (priority 2); also sets `request.workspaceId` for backward-compat with GitHub/Jira/Linear integration repositories
  - [x] NEW: `TeamId.decorator.ts` — param decorator that reads `request.teamId`
  - [x] `tickets.controller.ts`: all 30+ route handlers updated to `@TeamId() teamId`; `mapToResponse` returns `teamId`
  - [x] Special cases handled: `AssignTicketUseCase` merged `workspaceId`+`teamId` into single `teamId`; `ExportToLinearUseCase` renamed to `forgeTeamId`/`linearTeamId`

- [x] Task 4: Frontend — Send x-team-id header (AC: 6)
  - [x] `client/src/services/ticket.service.ts`: Axios interceptor extended to read `useTeamStore.getState().currentTeam?.id` and set `x-team-id` header
  - [x] `AECResponse.workspaceId` renamed to `teamId` in TicketService types

- [x] Task 5: CLI — Send x-team-id header (AC: 7, 9)
  - [x] `forge-cli/src/services/api.service.ts`: `makeRequest()` adds `x-team-id: config.teamId` header; all `get()`, `post()`, `patch()` pass `teamId`
  - [x] `npm run typecheck` in `forge-cli` → 0 errors ✓

- [x] Task 6: Tests (AC: 8)
  - [x] `AssignTicketUseCase.spec.ts` fully rewritten: all fixtures use `teamId`, mock repo uses `findByTeam`, error messages updated
  - [x] `npm run test` in `backend` → 23/23 ticket tests pass; 10 pre-existing failures in `CreateTeamUseCase`/`GetUserTeamsUseCase` are unrelated to this story (confirmed by reproducing them on clean `main`)

## Dev Notes

### Why This Change?

The current `workspaceId` is an opaque derived key: `ws_team_${teamId.substring(5, 17)}`. This made tickets team-scoped in practice but obscured the relationship — you can't directly query "tickets for team X" from the AEC document without re-deriving the workspace key. Replacing it with a direct `teamId` field:

1. Makes team ownership explicit and queryable
2. Aligns the Firestore path with the team domain (`teams/{teamId}/aecs/`)
3. Enables the CLI (and other API clients) to specify team without relying on server-side user state
4. Simplifies the backend guard logic (no more `ws_team_*` string construction)

### Architecture — Backend Layers Touched

| Layer | File | Change |
|---|---|---|
| Domain | `backend/src/tickets/domain/aec/AEC.ts` | `workspaceId` → `teamId` field |
| Port | `backend/src/tickets/application/ports/AECRepository.ts` | Rename methods |
| Use Cases | Multiple in `application/use-cases/` | `workspaceId` → `teamId` param |
| Infrastructure | `FirestoreAECRepository.ts` | Collection path + all queries |
| Infrastructure | `AECMapper.ts` | `AECDocument.workspaceId` → `teamId` |
| Presentation | `WorkspaceGuard.ts` → `TeamGuard.ts` | Read `x-team-id` header |
| Presentation | `TeamId.decorator.ts` (NEW) | Extract `request.teamId` |
| Presentation | `tickets.controller.ts` | Swap decorator everywhere |

### Architecture — Frontend & CLI

- **Frontend Axios interceptor**: location is in `client/src/services/` — find the file that creates the base Axios instance and adds the Authorization header. Add `x-team-id` to the same interceptor.
- **CLI ApiService**: `forge-cli/src/services/api.service.ts` — the `get()`, `patch()`, and `post()` methods all take a `config: ForgeConfig`. `config.teamId` is available — add it to headers.

### No Data Migration Needed

This is a development environment. The `teams/{teamId}/aecs/` path is new — no existing data at `workspaces/{workspaceId}/aecs/` needs migration for dev. If there is test data, it will need to be recreated.

### Guard Precedence Pattern

The `x-team-id` header approach mirrors how many multi-tenant APIs work. The precedence order in `TeamGuard`:
1. `request.headers['x-team-id']` — explicit caller intent (used by CLI and web)
2. `user.getCurrentTeamId()` from Firestore — fallback for requests without header

This ensures backwards compatibility while enabling explicit control.

### References

- [Source: backend/src/shared/presentation/guards/WorkspaceGuard.ts] — current guard to replace
- [Source: backend/src/shared/presentation/decorators/WorkspaceId.decorator.ts] — pattern for new TeamId.decorator.ts
- [Source: backend/src/tickets/infrastructure/persistence/FirestoreAECRepository.ts] — path change target
- [Source: backend/src/tickets/domain/aec/AEC.ts] — domain model field rename
- [Source: forge-cli/src/services/api.service.ts] — add x-team-id header
- [Source: client/app/(main)/tickets/page.tsx] — team-change re-fetch already implemented

### Learnings from Previous Story

**From Story 7-1-extend-aec-status-enum (Status: done)**

- The AECStatus enum was extended with new statuses for the review/approval lifecycle
- No story file exists for 7-1 (completed outside story workflow)
- The `AECStatus` enum in the backend and any shared-types package were updated
- Follow the same layer discipline: domain change first, then propagate outward

[Source: docs/sprint-artifacts/sprint-status.yaml — `7-1-extend-aec-status-enum: done`]

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/stories/7-2-move-tickets-to-team-scope.context.xml

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None

### Completion Notes List

1. Bulk use-case rename handled with `sed` across 25 files. Two special cases required manual fixes:
   - `AssignTicketUseCase`: had both `workspaceId` (ownership) and `teamId` (member lookup) — merged into single `teamId` field
   - `ExportToLinearUseCase`: had forge `workspaceId` AND Linear destination `teamId` — renamed to `forgeTeamId` / `linearTeamId` to avoid collision
2. `WorkspaceGuard` was updated rather than replaced to preserve `request.workspaceId` for GitHub/Jira/Linear integration repositories that still query `findByWorkspaceId()`. This is intentional backward-compatibility.
3. `findById` in `FirestoreAECRepository` switched from scanning all workspace sub-collections to using Firestore `collectionGroup('aecs')` query — more efficient and works with new path.
4. `AssignTicketUseCase.spec.ts` needed full rewrite after bash bulk-rename script inserted duplicate `const teamId` declarations in every test case.
5. 10 pre-existing test failures in `CreateTeamUseCase.spec.ts` and `GetUserTeamsUseCase.spec.ts` were confirmed by reproducing them on the unmodified base branch — not introduced by this story.

### File List

**Backend — Domain**
- `backend/src/tickets/domain/aec/AEC.ts` — `workspaceId` → `teamId` field

**Backend — Application (Port)**
- `backend/src/tickets/application/ports/AECRepository.ts` — renamed all methods

**Backend — Application (Use Cases, 25+ files)**
- `backend/src/tickets/application/use-cases/CreateTicketUseCase.ts`
- `backend/src/tickets/application/use-cases/AssignTicketUseCase.ts` (manual — merged fields)
- `backend/src/tickets/application/use-cases/ExportToLinearUseCase.ts` (manual — renamed to forgeTeamId/linearTeamId)
- `backend/src/tickets/application/use-cases/DeleteAECUseCase.ts`
- `backend/src/tickets/application/use-cases/EnrichMultipleTicketsUseCase.ts`
- `backend/src/tickets/application/use-cases/EstimateEffortUseCase.ts`
- `backend/src/tickets/application/use-cases/ExportToJiraUseCase.ts`
- `backend/src/tickets/application/use-cases/FetchDesignMetadataUseCase.ts`
- `backend/src/tickets/application/use-cases/FinalizeMultipleTicketsUseCase.ts`
- `backend/src/tickets/application/use-cases/FinalizeSpecUseCase.ts`
- `backend/src/tickets/application/use-cases/GenerateQuestionsUseCase.ts`
- `backend/src/tickets/application/use-cases/GetImportAvailabilityUseCase.ts`
- `backend/src/tickets/application/use-cases/ImportFromJiraUseCase.ts`
- `backend/src/tickets/application/use-cases/ImportFromLinearUseCase.ts`
- `backend/src/tickets/application/use-cases/LoadBreakdownDraftUseCase.ts`
- `backend/src/tickets/application/use-cases/PRDBreakdownUseCase.ts`
- `backend/src/tickets/application/use-cases/RefreshDesignMetadataUseCase.ts`
- `backend/src/tickets/application/use-cases/RemoveDesignReferenceUseCase.ts`
- `backend/src/tickets/application/use-cases/StartQuestionRoundUseCase.ts`
- `backend/src/tickets/application/use-cases/SubmitAnswersUseCase.ts`
- `backend/src/tickets/application/use-cases/SubmitQuestionAnswersUseCase.ts`
- `backend/src/tickets/application/use-cases/SubmitReviewSessionUseCase.ts`
- `backend/src/tickets/application/use-cases/AddDesignReferenceUseCase.ts`
- `backend/src/tickets/application/use-cases/BulkCreateFromBreakdownUseCase.ts`
- `backend/src/tickets/application/services/AECSerializer.ts`
- `backend/src/tickets/application/services/validation/ValidationEngine.ts`

**Backend — Application (Tests)**
- `backend/src/tickets/application/use-cases/AssignTicketUseCase.spec.ts` — full rewrite

**Backend — Infrastructure**
- `backend/src/tickets/infrastructure/persistence/FirestoreAECRepository.ts` — path + collectionGroup
- `backend/src/tickets/infrastructure/persistence/mappers/AECMapper.ts` — `workspaceId` → `teamId`

**Backend — Presentation**
- `backend/src/shared/presentation/guards/WorkspaceGuard.ts` — reads `x-team-id` header
- `backend/src/shared/presentation/decorators/TeamId.decorator.ts` — NEW
- `backend/src/tickets/presentation/controllers/tickets.controller.ts` — all handlers updated

**Frontend**
- `client/src/services/ticket.service.ts` — Axios interceptor + `AECResponse.teamId`

**CLI**
- `forge-cli/src/services/api.service.ts` — `x-team-id` header in all methods

**Docs**
- `docs/sprint-artifacts/sprint-status.yaml` — `in-progress` → `review`
