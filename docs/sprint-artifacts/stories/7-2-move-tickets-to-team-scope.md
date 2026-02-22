# Story 7.2: Move Tickets to Team Scope

Status: ready-for-dev

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

- [ ] Task 1: Backend — Update AEC domain model (AC: 1)
  - [ ] In `backend/src/tickets/domain/aec/AEC.ts`: replace `workspaceId` parameter with `teamId` in constructor and all factory/create methods
  - [ ] In `backend/src/tickets/application/ports/AECRepository.ts`: rename `findByWorkspace(workspaceId)` → `findByTeam(teamId)`, `countByWorkspace` → `countByTeam`
  - [ ] Update all use cases that receive or pass `workspaceId` → `teamId` (CreateTicketUseCase, ListTicketsUseCase, GetTicketUseCase, etc.)

- [ ] Task 2: Backend — Update Firestore repository (AC: 2)
  - [ ] In `FirestoreAECRepository.ts`: change collection path from `workspaces/${workspaceId}/aecs/${aecId}` → `teams/${teamId}/aecs/${aecId}`
  - [ ] Update `findByTeam(teamId)`, `save(aec)`, `findById(id, teamId)` to use new path
  - [ ] Update `AECMapper.ts`: replace `workspaceId` field with `teamId` in `AECDocument` interface and all toDocument/toDomain mappings

- [ ] Task 3: Backend — Update team context resolution (AC: 3, 4, 5)
  - [ ] In `WorkspaceGuard` (or replace with `TeamGuard`): read `teamId` from `request.headers['x-team-id']` first; fall back to `user.getCurrentTeamId()`; attach as `request.teamId`
  - [ ] Add `@TeamId()` param decorator at `backend/src/shared/presentation/decorators/TeamId.decorator.ts` (mirrors WorkspaceId.decorator.ts pattern)
  - [ ] Update `tickets.controller.ts`: replace `@WorkspaceId() workspaceId` with `@TeamId() teamId` in all route handlers (list, create, get, update, delete, review-session, etc.)
  - [ ] Remove (or repurpose) the `workspaceId` derivation logic from WorkspaceGuard — the `ws_team_*` prefix is no longer needed

- [ ] Task 4: Frontend — Send x-team-id header (AC: 6)
  - [ ] In `client/src/services/api.client.ts` (or equivalent Axios instance): add request interceptor that reads `useTeamStore.getState().currentTeam?.id` and sets `x-team-id` header when present
  - [ ] Verify `TicketsListPage` useEffect dependency on `currentTeam?.id` still causes re-fetch (no change needed — confirm it works with new backend)

- [ ] Task 5: CLI — Send x-team-id header (AC: 7, 9)
  - [ ] In `forge-cli/src/services/api.service.ts`: add `'x-team-id': config.teamId` to the default headers in `get()`, `patch()`, and `post()` methods
  - [ ] Run `npm run typecheck` in `forge-cli` → 0 errors

- [ ] Task 6: Tests (AC: 8)
  - [ ] Update backend unit tests for AEC domain model: replace `workspaceId` → `teamId` in all fixtures
  - [ ] Update integration/controller tests: pass `x-team-id` header instead of relying on WorkspaceGuard workspace derivation
  - [ ] Verify all existing ticket tests pass with updated paths

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

### Completion Notes List

### File List
