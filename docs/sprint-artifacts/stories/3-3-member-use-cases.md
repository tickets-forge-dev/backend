# Story 3.3: Member Management Use Cases

**Epic:** Epic 3 - Members & Roles
**Priority:** P0 CRITICAL
**Effort:** 3 days
**Status:** in-progress
**Blocked By:** 3.2 (TeamMember Repository) - UNBLOCKED

## Story

As a **team owner/member**,
I want **use cases to manage team membership**,
so that **I can invite members, accept invites, change roles, and remove members**.

## Acceptance Criteria

- [ ] InviteMemberUseCase - Validate email, role, create invite
- [ ] AcceptInviteUseCase - Validate token, activate member
- [ ] RemoveMemberUseCase - Validate not owner, soft delete member
- [ ] ChangeMemberRoleUseCase - Validate permissions, change role
- [ ] ListTeamMembersUseCase - Return active members for a team
- [ ] All use cases handle authorization (owner/member checks)
- [ ] Error handling with domain exceptions
- [ ] Build passes with 0 TypeScript errors

## Tasks / Subtasks

- [ ] **Task 1:** Create InviteMemberUseCase (AC: 1, 6, 7)
  - [ ] Create `backend/src/teams/application/use-cases/InviteMemberUseCase.ts`
  - [ ] Validate: email format, role (not Admin), team exists, user doesn't exist
  - [ ] Check: inviter is team owner or (member with allowMemberInvites)
  - [ ] Create TeamMember.createInvite()
  - [ ] Save to TeamMemberRepository
  - [ ] Return: memberId (for invite token generation in Story 3.4)
  - [ ] Errors: BadRequestException, ForbiddenException

- [ ] **Task 2:** Create AcceptInviteUseCase (AC: 2, 6, 7)
  - [ ] Create `backend/src/teams/application/use-cases/AcceptInviteUseCase.ts`
  - [ ] Find member by userId + teamId
  - [ ] Validate: member exists, status is INVITED
  - [ ] Call member.activate(displayName)
  - [ ] Update via TeamMemberRepository
  - [ ] Errors: NotFoundException, BadRequestException

- [ ] **Task 3:** Create RemoveMemberUseCase (AC: 3, 6, 7)
  - [ ] Create `backend/src/teams/application/use-cases/RemoveMemberUseCase.ts`
  - [ ] Validate: remover is team owner
  - [ ] Find member by userId + teamId
  - [ ] Validate: member exists, not owner
  - [ ] Call member.remove()
  - [ ] Update via TeamMemberRepository
  - [ ] Errors: NotFoundException, ForbiddenException

- [ ] **Task 4:** Create ChangeMemberRoleUseCase (AC: 4, 6, 7)
  - [ ] Create `backend/src/teams/application/use-cases/ChangeMemberRoleUseCase.ts`
  - [ ] Validate: requester is team owner
  - [ ] Find member by userId + teamId
  - [ ] Validate: member exists, is active, not owner
  - [ ] Call member.changeRole(newRole)
  - [ ] Update via TeamMemberRepository
  - [ ] Errors: NotFoundException, ForbiddenException, BadRequestException

- [ ] **Task 5:** Create ListTeamMembersUseCase (AC: 5, 6)
  - [ ] Create `backend/src/teams/application/use-cases/ListTeamMembersUseCase.ts`
  - [ ] Validate: requester is team member
  - [ ] Call TeamMemberRepository.findByTeam(teamId)
  - [ ] Filter by status (optional): active, invited, removed
  - [ ] Return: TeamMember[]
  - [ ] Errors: ForbiddenException

- [ ] **Task 6:** Build Verification (AC: 8)
  - [ ] Run `npm run build` for backend
  - [ ] Verify 0 TypeScript errors

## Dev Notes

### Architecture Patterns

**Use Case Structure:**
- Command object (input parameters)
- Execute method (business logic)
- Repository injection (persistence)
- Domain method calls (state transitions)
- Exception handling (domain errors → HTTP errors)

**Authorization Patterns:**
- Owner checks: Verify team.ownerId === userId
- Member checks: Verify member exists in team
- Permission checks: Verify role allows action

### Business Rules

**InviteMember:**
- Only owners or members (if allowMemberInvites=true) can invite
- Cannot invite as Admin role
- Cannot invite existing member
- Email must be valid format

**AcceptInvite:**
- Only user being invited can accept
- Member must be in INVITED status
- Requires displayName from user profile

**RemoveMember:**
- Only owners can remove members
- Cannot remove owner (must transfer ownership first)
- Soft delete (status → REMOVED, set removedAt)

**ChangeMemberRole:**
- Only owners can change roles
- Cannot change owner's role
- Cannot promote to Admin (use ownership transfer)
- Member must be ACTIVE

**ListTeamMembers:**
- Any team member can list members
- Optional filter by status
- Returns all statuses by default

### Error Handling

**Exception Types:**
- `NotFoundException` → 404 (team/member not found)
- `ForbiddenException` → 403 (insufficient permissions)
- `BadRequestException` → 400 (invalid input, business rule violation)
- `ConflictException` → 409 (duplicate member)

### Learnings from Previous Stories

**From Story 1.4 - Team Use Cases:**
- Use case pattern: Command → Execute → Repository
- Inject repositories via constructor
- Domain exceptions → HTTP exceptions in controller

**From Story 3.1 - TeamMember Domain:**
- Use factory methods for state creation
- Use domain methods for state transitions
- Immutable entities return new instances

**From Story 3.2 - TeamMember Repository:**
- findByUserAndTeam() returns null if not found
- save() for new entities, update() for modifications

### Project Structure Notes

**Backend Structure:**
```
backend/src/teams/application/use-cases/
  ├── CreateTeamUseCase.ts           (EXISTING)
  ├── UpdateTeamUseCase.ts           (EXISTING)
  ├── DeleteTeamUseCase.ts           (EXISTING)
  ├── InviteMemberUseCase.ts         (NEW - Task 1)
  ├── AcceptInviteUseCase.ts         (NEW - Task 2)
  ├── RemoveMemberUseCase.ts         (NEW - Task 3)
  ├── ChangeMemberRoleUseCase.ts     (NEW - Task 4)
  └── ListTeamMembersUseCase.ts      (NEW - Task 5)
```

### References

- [Epic 3 Definition: docs/SUPER-SPRINT-TEAMS-CLI-COMPLETE.md#Epic 3]
- [TeamMember Domain: backend/src/teams/domain/TeamMember.ts]
- [TeamMember Repository: backend/src/teams/application/ports/TeamMemberRepository.ts]
- [Clean Architecture: CLAUDE.md]

## Dev Agent Record

### Context Reference

- Story Context XML: TBD

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

TBD

### Completion Notes List

TBD

### File List

TBD
