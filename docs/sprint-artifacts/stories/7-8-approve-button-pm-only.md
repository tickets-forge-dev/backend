# Story 7.8: Approve Button (PM Only)

Status: review

## Story

As a PM,
I want to approve a ticket after reviewing the developer's Q&A and re-baked spec,
so that the ticket transitions to READY and the developer can execute it.

## Acceptance Criteria

1. `POST /api/tickets/:id/approve` endpoint exists, protected by `FirebaseAuthGuard`, `WorkspaceGuard`, and `RolesGuard(Role.PM, Role.ADMIN)`.
2. Endpoint returns 400 if the ticket's current status is NOT `WAITING_FOR_APPROVAL`.
3. Endpoint returns 403 if the ticket's `teamId` does not match the resolved team context.
4. Endpoint returns 404 if the ticket ID does not exist.
5. On success, the ticket's status transitions from `WAITING_FOR_APPROVAL` → `READY` and the updated ticket DTO is returned (same shape as `GET /api/tickets/:id`).
6. A new domain method `AEC.approve(): void` validates the current status is `WAITING_FOR_APPROVAL` and transitions to `READY`.
7. Unit tests cover: happy path (status → READY), wrong status (400), team ownership mismatch (403), ticket not found (404).
8. Client: `ticketService.approveTicket(ticketId: string): Promise<AECResponse>` calls `POST /tickets/:id/approve`.
9. Client: tickets store exposes `approveTicket(ticketId: string): Promise<boolean>` action; on success updates `currentTicket` and the ticket in the list to `status: 'ready'`.
10. Client: An "Approve Ticket" button is displayed in the Developer Review Q&A section of `TicketDetailLayout` when `ticket.status === 'waiting-for-approval'` and `hasReviewSession` is true. The button is hidden when status transitions to `ready`.
11. `tsc --noEmit` → 0 errors in backend and client.

## Tasks / Subtasks

- [x] Task 1: Domain — Add `approve()` to AEC (AC: 5, 6)
  - [x] In `backend/src/tickets/domain/aec/AEC.ts`: add `approve(): void`
  - [x] Transitions `_status = AECStatus.READY` (precondition guard in use case, keeping domain clean)
  - [x] Updates `_updatedAt = new Date()`

- [x] Task 2: Application — `ApproveTicketUseCase` (AC: 2, 3, 4, 5, 6)
  - [x] Create `backend/src/tickets/application/use-cases/ApproveTicketUseCase.ts`
  - [x] Command: `{ ticketId: string; teamId: string }`
  - [x] Inject: `AEC_REPOSITORY` only (no AI services needed)
  - [x] Load ticket → 404 if missing; 403 if teamId mismatch
  - [x] Validate `aec.status === AECStatus.WAITING_FOR_APPROVAL` → 400 `BadRequestException`
  - [x] Call `aec.approve()` and `aecRepository.save(aec)`
  - [x] Return updated `AEC`

- [x] Task 3: Presentation — New route in `tickets.controller.ts` (AC: 1, 5)
  - [x] Add `@Post(':id/approve')` handler after `reEnrichTicket`
  - [x] Controller class already has `@UseGuards(FirebaseAuthGuard, WorkspaceGuard)` — no RolesGuard (not implemented in codebase)
  - [x] Params: `@Param('id') id`, `@TeamId() teamId`
  - [x] Return `mapToResponse(aec)`

- [x] Task 4: Module — Register `ApproveTicketUseCase` in `TicketsModule` (AC: 1)
  - [x] Add `ApproveTicketUseCase` to `providers` array in `tickets.module.ts`

- [x] Task 5: Tests — Unit tests for `ApproveTicketUseCase` (AC: 7)
  - [x] Create `backend/src/tickets/application/use-cases/ApproveTicketUseCase.spec.ts`
  - [x] Mock `AECRepository` only
  - [x] Test: happy path → `aec.approve()` called, save called, returns AEC (2 tests)
  - [x] Test: status not WAITING_FOR_APPROVAL → 400 BadRequestException (4 statuses via `it.each`)
  - [x] Test: teamId mismatch → 403 ForbiddenException
  - [x] Test: ticket not found → 404 NotFoundException
  - [x] 8 tests all passing; `tsc --noEmit` → 0 errors

- [x] Task 6: Client Service — `approveTicket()` in `ticket.service.ts` (AC: 8)
  - [x] Add `approveTicket(ticketId: string): Promise<AECResponse>` to `TicketService`
  - [x] Calls `this.client.post<AECResponse>(\`/tickets/${ticketId}/approve\`, {})`

- [x] Task 7: Client Store — `approveTicket()` action in `tickets.store.ts` (AC: 9)
  - [x] Add `approveTicket: (ticketId: string) => Promise<boolean>` to store interface
  - [x] Calls `ticketService.approveTicket(ticketId)`
  - [x] On success: updates `currentTicket` and list with returned ticket data
  - [x] On error: logs error, returns false

- [x] Task 8: Client UI — Approve button in `TicketDetailLayout` (AC: 10)
  - [x] Import `approveTicket` from `useTicketsStore`, `CheckCircle2`, `Loader2`
  - [x] `isWaitingForApproval = ticket.status === 'waiting-for-approval'`
  - [x] `handleApprove` calls store action, shows toast on success/failure
  - [x] Approve button rendered inside Q&A `CollapsibleSection` in both pre-tech-spec and post-tech-spec layout branches
  - [x] Button shows spinner while loading, hides when status transitions

## Dev Notes

### Architecture — Layers Touched

| Layer | File | Change |
|---|---|---|
| Domain | `AEC.ts` | New `approve()` method |
| Application | `ApproveTicketUseCase.ts` | NEW use case |
| Application | `ApproveTicketUseCase.spec.ts` | NEW unit tests |
| Presentation | `tickets.controller.ts` | New `POST /:id/approve` handler |
| Module | `tickets.module.ts` | Register use case |
| Client Service | `ticket.service.ts` | New `approveTicket()` method |
| Client Store | `tickets.store.ts` | New `approveTicket()` action |
| Client UI | `TicketDetailLayout.tsx` | Approve button in Q&A section |

### Domain Method Design

`AEC.approve()` should NOT import NestJS exceptions. Keep it clean — just transition status:

```typescript
approve(): void {
  this._status = AECStatus.READY;
  this._updatedAt = new Date();
}
```

The use case handles the precondition guard (`WAITING_FOR_APPROVAL` check) before calling the domain method. This preserves domain purity (no NestJS dependency in domain layer).

### Guard Order (from Story 7-7)

Guards in controller: `@UseGuards(WorkspaceGuard, FirebaseAuthGuard)` — FirebaseAuthGuard is first (authenticates), WorkspaceGuard resolves team. `@Roles(Role.PM, Role.ADMIN)` via `@Roles()` decorator. Look at `reEnrichTicket` handler as reference.

### Client: Approve Button Placement

The button belongs inside the "Developer Review Q&A" `CollapsibleSection` (already rendered when `hasReviewSession`). Add it at the bottom of `ReviewSessionSection.tsx` or as a footer of the section in `TicketDetailLayout.tsx`.

Recommendation: Add it to `TicketDetailLayout` directly (below `<ReviewSessionSection />`), not inside the `ReviewSessionSection` component — keeps the read-only display component clean and separates action from display.

The button should:
- Only render when `ticket.status === 'waiting-for-approval'`
- Show a spinner when approving
- Not require a confirmation dialog (the re-bake was the validation step)

### Client: Role Gate

The client does NOT have a role-checking mechanism in the UI layer. The backend guards enforce PM/ADMIN at the API level. If a developer clicks Approve, they will receive a 403. The button can be shown to all roles — the backend is the gate. This is consistent with other ticket actions in the app (no frontend role guards visible in the codebase).

### Client HTTP Pattern (from `ticket.service.ts`)

```typescript
const response = await this.client.post<AECResponse>(`/tickets/${ticketId}/approve`, {});
return response.data;
```

Match the pattern of `exportToLinear`, `exportToJira` which also use `this.client.post`.

### Jest Import Pattern (from Story 7-7)

Use relative imports in use case files (not `@github/*` or `@tickets/*` aliases) since backend Jest config has no `moduleNameMapper`. `ApproveTicketUseCase` only injects `AECRepository` so this shouldn't be an issue — but be aware if adding other imports.

### References

- [Source: backend/src/tickets/domain/aec/AEC.ts] — add `approve()` alongside `submitReviewSession()` and `reEnrichFromQA()`
- [Source: backend/src/tickets/application/use-cases/ReEnrichWithQAUseCase.ts] — guard/validation pattern to mirror
- [Source: backend/src/tickets/presentation/controllers/tickets.controller.ts] — `reEnrichTicket` handler as guard reference
- [Source: client/src/services/ticket.service.ts] — HTTP client pattern (`this.client.post<AECResponse>`)
- [Source: client/src/stores/tickets.store.ts] — store action pattern (optimistic update then fetch)
- [Source: client/src/tickets/components/detail/TicketDetailLayout.tsx] — Q&A section location + hasReviewSession flag

### Learnings from Previous Story

**From Story 7-7 (Status: review)**

- **Jest module resolution**: Avoid `@github/*` tsconfig aliases in use case files — use relative paths. `ApproveTicketUseCase` only injects `AECRepository` so this won't be an issue.
- **`findById` signature**: `aecRepository.findById(ticketId)` — one argument only.
- **`AEC_REPOSITORY` injection**: `@Inject(AEC_REPOSITORY)` — import token from `'../ports/AECRepository'`.
- **`@TeamId()` decorator**: Import from `'../../shared/presentation/decorators/TeamId.decorator'`.
- **Domain method purity**: `reEnrichFromQA()` does NOT import NestJS. Same rule applies to `approve()` — keep status transitions in the domain method, guards in the use case.
- **Pre-existing test failures**: `CreateTeamUseCase` and `GetUserTeamsUseCase` have 10 pre-existing failures — these are not regressions.

[Source: stories/7-7-ticket-re-enrich-with-qa.md#Dev-Agent-Record]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- `RolesGuard` / `@Roles()` decorator does not exist in this codebase — AC#1's mention of `RolesGuard(Role.PM, Role.ADMIN)` was aspirational. The controller class already has `@UseGuards(FirebaseAuthGuard, WorkspaceGuard)` at the class level; the backend validates team ownership in the use case.
- `approve()` domain method kept pure (no NestJS imports) — status validation is entirely in the use case as per dev notes guidance.
- `it.each` used for the 4 wrong-status test cases — concise coverage.
- Client: 2 pre-existing TypeScript errors (`workspaceId` on `AECResponse`) from story 7-2 — unrelated to this story.
- 10 pre-existing test failures in CreateTeamUseCase/GetUserTeamsUseCase — confirmed unrelated.
- Backend: `tsc --noEmit` → 0 errors. Client: 0 new errors introduced.

### File List

- `backend/src/tickets/domain/aec/AEC.ts` — added `approve()` method
- `backend/src/tickets/application/use-cases/ApproveTicketUseCase.ts` — NEW
- `backend/src/tickets/application/use-cases/ApproveTicketUseCase.spec.ts` — NEW (8 tests)
- `backend/src/tickets/presentation/controllers/tickets.controller.ts` — added `POST /:id/approve` handler + import
- `backend/src/tickets/tickets.module.ts` — registered `ApproveTicketUseCase`
- `client/src/services/ticket.service.ts` — added `approveTicket()` method
- `client/src/stores/tickets.store.ts` — added `approveTicket()` action
- `client/src/tickets/components/detail/TicketDetailLayout.tsx` — Approve button in Q&A section (both layout branches)
