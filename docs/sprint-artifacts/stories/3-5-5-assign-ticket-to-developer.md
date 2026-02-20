# Story 3.5.5: Assign Ticket to Developer

**Epic:** Epic 3.5 - Non-Technical PM Support
**Priority:** P0 CRITICAL
**Effort:** 2 days
**Status:** drafted

## Story

As a **Product Manager**,
I want **to assign tickets to specific team members**,
so that **developers know which tickets they are responsible for, and I can track who is working on what**.

## Acceptance Criteria

1. **Domain: AEC supports assignment**
   - `AEC` entity has `_assignedTo: string | null` (userId of assigned member)
   - `AEC.assign(userId: string)` method — sets `_assignedTo`
   - `AEC.unassign()` method — sets `_assignedTo = null`
   - `AEC.assignedTo` getter — returns `_assignedTo`
   - Assignment is allowed in any non-complete status
   - `createDraft()` and `reconstitute()` factories support `assignedTo?: string | null`

2. **Persistence: `assignedTo` stored in Firestore**
   - `AECMapper.toPersistence()` includes `assignedTo: aec.assignedTo ?? null`
   - `AECMapper.toDomain()` maps `data.assignedTo` → `reconstitute()` parameter
   - Existing tickets without `assignedTo` reconstitute with `null` (backward compatible)

3. **Backend API: assign endpoint**
   - `PATCH /tickets/:id/assign`
   - Request body: `{ userId: string | null }` (`null` = unassign)
   - `AssignTicketUseCase`: validates assigned user is active member of the workspace, calls `aec.assign()` or `aec.unassign()`
   - Response: updated ticket DTO (same shape as existing ticket response)
   - Authorization: PM role or Admin role required (not Developer, not QA)
   - Error: 404 if ticket not found, 403 if not authorized, 400 if userId not a team member

4. **Frontend: assignee selector on ticket detail**
   - PM/Admin sees an `AssigneeSelector` component in the ticket detail overview card
   - Dropdown shows active team members with name + role badge
   - Current assignee shown with avatar/name (or "Unassigned" placeholder)
   - PM selects member → fires PATCH request → UI updates optimistically
   - Option to clear assignment ("Unassign" at top or bottom of list)
   - Developers and QA: read-only display of assignee (no dropdown)

5. **Frontend: assignee shown in ticket list**
   - Ticket list row shows assignee avatar (if assigned) — small circular avatar or initials
   - Tooltip on hover: full name
   - Unassigned tickets: show no avatar (empty space — no placeholder icon needed)

6. **Frontend: state management**
   - `tickets.store.ts` action: `assignTicket(ticketId: string, userId: string | null)`
   - `ticket.service.ts` method: `assign(ticketId: string, userId: string | null)`
   - Optimistic update: update `currentTicket.assignedTo` before API response
   - Rollback on error

7. **0 TypeScript errors, build passes**

## Tasks / Subtasks

- [ ] **Update AEC domain** (AC: #1)
  - [ ] `backend/src/tickets/domain/aec/AEC.ts`: add `_assignedTo: string | null`
  - [ ] Add `assign(userId: string): void` method
  - [ ] Add `unassign(): void` method
  - [ ] Add `get assignedTo(): string | null` getter
  - [ ] Update `createDraft()`: accept `assignedTo?: string | null`
  - [ ] Update `reconstitute()`: accept `assignedTo?: string | null`

- [ ] **Update AECMapper** (AC: #2)
  - [ ] `backend/src/tickets/infrastructure/persistence/mappers/AECMapper.ts`
  - [ ] `toPersistence()`: add `assignedTo: aec.assignedTo ?? null`
  - [ ] `toDomain()`: pass `data.assignedTo ?? null` to `reconstitute()`
  - [ ] Ensure null is handled (Firestore field may be absent on old tickets)

- [ ] **Create `AssignTicketUseCase`** (AC: #3)
  - [ ] File: `backend/src/tickets/application/use-cases/AssignTicketUseCase.ts`
  - [ ] Command: `{ ticketId: string, userId: string | null, requestingUserId: string, workspaceId: string }`
  - [ ] Load ticket, verify workspace ownership
  - [ ] If `userId !== null`: verify userId is active team member (lookup via TeamMemberRepository or WorkspaceMemberRepository)
  - [ ] Call `aec.assign(userId)` or `aec.unassign()`
  - [ ] Save and return updated AEC

- [ ] **Create `AssignTicketDto`** (AC: #3)
  - [ ] File: `backend/src/tickets/presentation/dtos/AssignTicketDto.ts`
  - [ ] `userId: string | null` — `@IsString() @IsOptional()` or allow null explicitly
  - [ ] Validate: either a non-empty string or null

- [ ] **Add API endpoint** (AC: #3)
  - [ ] `backend/src/tickets/presentation/controllers/tickets.controller.ts`
  - [ ] `@Patch(':id/assign')` handler
  - [ ] Extract `userId` from Firebase auth header
  - [ ] Inject and call `AssignTicketUseCase`
  - [ ] Apply PM/Admin role guard (use existing `RoleGuard` + `@RequireRole`)

- [ ] **Register in TicketsModule** (AC: #3)
  - [ ] `backend/src/tickets/tickets.module.ts`: add `AssignTicketUseCase` to providers

- [ ] **Create `AssigneeSelector.tsx` component** (AC: #4)
  - [ ] File: `client/src/tickets/components/AssigneeSelector.tsx`
  - [ ] Props: `currentAssigneeId: string | null`, `members: TeamMember[]`, `onAssign: (userId: string | null) => void`, `readOnly?: boolean`
  - [ ] Uses shadcn `Select` or `Popover` + `Command` for searchable dropdown
  - [ ] Shows: member avatar/initials + displayName + role badge
  - [ ] First option: "Unassigned" (value: null)
  - [ ] Shows current assignee name or "Unassigned" as trigger label

- [ ] **Integrate AssigneeSelector into ticket detail** (AC: #4)
  - [ ] `client/app/(main)/tickets/[id]/page.tsx` or `OverviewCard.tsx`
  - [ ] Render `AssigneeSelector` in overview card metadata section
  - [ ] Pass `readOnly={!canAssign}` based on user role (PM/Admin = editable)
  - [ ] On assign: call `ticketsStore.assignTicket(ticketId, userId)`

- [ ] **Update ticket list to show assignee** (AC: #5)
  - [ ] `client/app/(main)/tickets/page.tsx` (or ticket list row component)
  - [ ] Show assignee avatar (initials in circle) when `ticket.assignedTo` is set
  - [ ] Tooltip: member's display name

- [ ] **Add service + store actions** (AC: #6)
  - [ ] `client/src/tickets/services/ticket.service.ts`: `assign(ticketId, userId)` → `PATCH /tickets/:id/assign`
  - [ ] `client/src/tickets/stores/tickets.store.ts`: `assignTicket(ticketId, userId)` action with optimistic update

- [ ] **TypeScript + build verification** (AC: #7)
  - [ ] `pnpm tsc --noEmit` in backend: 0 errors
  - [ ] `pnpm build` in client: 0 errors

## Dev Notes

### Member Lookup for Assignment Validation

To validate that the `userId` being assigned is an active team member, use the existing `TeamMemberRepository` (from Epic 3):

```typescript
// In AssignTicketUseCase:
const member = await this.teamMemberRepository.findByUserAndTeam(
  command.userId,
  command.teamId
);
if (!member || !member.isActive()) {
  throw new BadRequestException('User is not an active team member');
}
```

If `TeamMemberRepository` is not accessible from `TicketsModule`, use workspace-level member lookup (existing pattern from Epic 3).

[Source: docs/CLI/FORGE-TEAMS-CLI-ARCHITECTURE.md#team-management]

### Role Guard Application

Epic 3 (done) implemented `RoleGuard` and `@RequireRole` decorator:

```typescript
// Apply to PATCH /tickets/:id/assign
@Patch(':id/assign')
@RequireRole('admin', 'pm')  // Only Admin and PM can assign
async assignTicket(@Param('id') id: string, @Body() dto: AssignTicketDto, ...) {
  // ...
}
```

[Source: docs/sprint-artifacts/stories/3-6-role-guards.md]

### Frontend: Member Data

Members must be loaded to populate the `AssigneeSelector`. The team members list is already available via the team store (Epic 3 complete):

```typescript
// Access team members from existing store:
const { members } = useTeamStore();
// Pass to AssigneeSelector
```

If members aren't in the team store yet, load via existing `GET /teams/:id/members` endpoint.

### AssigneeSelector UI Sketch

```
┌────────────────────────────────┐
│ Assigned to                    │
│ ┌──────────────────────────┐  │
│ │ 💻 John Doe (Developer)  ▼│  │
│ └──────────────────────────┘  │
│                                │
│   Dropdown options:            │
│   ── Unassigned ──             │
│   👑 Sarah Kim (Admin)        │
│   💻 John Doe (Developer)     │
│   📋 Alice Wong (PM)          │
└────────────────────────────────┘
```

### Project Structure Notes

**Backend (Clean Architecture):**
- Domain: `backend/src/tickets/domain/aec/AEC.ts` (layer: domain)
- Use case: `backend/src/tickets/application/use-cases/AssignTicketUseCase.ts` (layer: application)
- DTO: `backend/src/tickets/presentation/dtos/AssignTicketDto.ts` (layer: presentation)
- Controller update: `backend/src/tickets/presentation/controllers/tickets.controller.ts` (layer: presentation)

**Frontend (Feature-by-Structure):**
- Service: `client/src/tickets/services/ticket.service.ts`
- Store: `client/src/tickets/stores/tickets.store.ts`
- Component: `client/src/tickets/components/AssigneeSelector.tsx`
- Integration: `client/app/(main)/tickets/[id]/page.tsx` or `OverviewCard.tsx`

### References

- [Architecture: Team Management RBAC](docs/CLI/FORGE-TEAMS-CLI-ARCHITECTURE.md#role-based-access-control)
- [Story 3-6: Role Guards (done)](docs/sprint-artifacts/stories/) — reuse `RoleGuard` pattern
- [Session 10 Memory: OverviewCard component](~/.claude/projects/-Users-Idana-Documents-GitHub-forge/memory/MEMORY.md#Session-10)
- [Domain: AEC.ts](backend/src/tickets/domain/aec/AEC.ts)
- [Mapper: AECMapper](backend/src/tickets/infrastructure/persistence/mappers/AECMapper.ts)
- [Store: tickets.store.ts](client/src/tickets/stores/tickets.store.ts)

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

_Not yet implemented_

### Debug Log References

_Not yet implemented_

### Completion Notes List

_Not yet implemented_

### File List

_Not yet implemented_
