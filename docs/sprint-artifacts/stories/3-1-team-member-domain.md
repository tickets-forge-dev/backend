# Story 3.1: TeamMember Domain Model

**Epic:** Epic 3 - Members & Roles
**Priority:** P0 CRITICAL
**Effort:** 2 days
**Status:** in-progress
**Blocked By:** Epic 1 (Team Foundation) - UNBLOCKED

## Story

As a **system**,
I want **domain models for team members with roles and statuses**,
so that **I can represent team membership and permissions in a type-safe way**.

## Acceptance Criteria

- [ ] Create `TeamMember` entity (userId, teamId, role, status, invitedBy, invitedAt, joinedAt)
- [ ] Create `Role` enum (Admin, Developer, PM, QA)
- [ ] Create `MemberStatus` enum (Invited, Active, Removed)
- [ ] Methods: `isActive()`, `hasRole()`, `canExecuteTickets()`, `canApproveTickets()`
- [ ] TeamMember factory methods: `createInvite()`, `activate()`, `remove()`, `changeRole()`, `reconstitute()`
- [ ] Immutable domain entities (methods return new instances)
- [ ] Build passes with 0 TypeScript errors

## Tasks / Subtasks

- [ ] **Task 1:** Create Role Enum (AC: 2)
  - [ ] Create `backend/src/teams/domain/Role.ts`
  - [ ] Export enum: Admin, Developer, PM, QA
  - [ ] Add helper methods: `isAdmin()`, `canExecuteTickets()`, `canApproveTickets()`

- [ ] **Task 2:** Create MemberStatus Enum (AC: 3)
  - [ ] Create `backend/src/teams/domain/MemberStatus.ts`
  - [ ] Export enum: Invited, Active, Removed
  - [ ] Add helper methods: `isActive()`, `isPending()`, `isRemoved()`

- [ ] **Task 3:** Create TeamMember Domain Entity (AC: 1, 4, 5, 6)
  - [ ] Create `backend/src/teams/domain/TeamMember.ts`
  - [ ] Private constructor (factory pattern)
  - [ ] Fields: id, userId, teamId, email, displayName, role, status, invitedBy, invitedAt, joinedAt, removedAt
  - [ ] Factory methods:
    - `createInvite(userId, teamId, email, role, invitedBy)` - Status: Invited
    - `activate(displayName)` - Status: Active, set joinedAt
    - `remove()` - Status: Removed, set removedAt
    - `changeRole(newRole)` - Update role
    - `reconstitute(data)` - Rebuild from persistence
  - [ ] Query methods:
    - `isActive()` - Status === Active
    - `hasRole(role)` - Check specific role
    - `canExecuteTickets()` - Admin or Developer
    - `canApproveTickets()` - Admin or PM
  - [ ] Validation: userId, teamId, email required; role valid; status valid
  - [ ] Immutability: all methods return new instances

- [ ] **Task 4:** Build Verification (AC: 7)
  - [ ] Run `npm run build` for backend
  - [ ] Verify 0 TypeScript errors

## Dev Notes

### Architecture Patterns

**Domain Layer (Clean Architecture):**
- **Entities**: TeamMember (aggregate root)
- **Value Objects**: Role, MemberStatus (enums)
- **Immutability**: All methods return new instances, no state mutation
- **Factory Pattern**: Private constructor, public factory methods
- **Domain Logic**: Permission checks in domain (canExecuteTickets, canApproveTickets)

**Design Decisions:**
- Role and Status as separate enums (not inline strings) for type safety
- Separate `invitedAt` and `joinedAt` timestamps to track invite acceptance
- `removedAt` timestamp for audit trail
- Permission logic in domain (not in use cases or controllers)
- Email stored on TeamMember (denormalized) for invite flow convenience

### Learnings from Previous Stories

**From Story 1.1 - Team Domain Model:**
- Use private constructor + static factory methods
- Return new instances (immutability)
- Validate in factory methods, throw descriptive errors
- Use `toObject()` method for serialization

**From Story 1.2 - Team Repository:**
- Domain entities separate from persistence DTOs
- Mapper layer translates between domain and persistence

### Project Structure Notes

**Backend Structure:**
```
backend/src/teams/domain/
  ├── Team.ts                    (EXISTING)
  ├── TeamFactory.ts             (EXISTING)
  ├── Role.ts                    (NEW - Task 1)
  ├── MemberStatus.ts            (NEW - Task 2)
  └── TeamMember.ts              (NEW - Task 3)
```

### Role Definitions

**Admin:**
- Full permissions
- Can invite/remove members
- Can execute tickets (dev work)
- Can approve tickets (PM review)
- Cannot be removed (at least one admin required)

**Developer:**
- Can execute tickets (write code)
- Cannot approve tickets
- Can be invited/removed

**PM (Product Manager):**
- Can approve tickets (review specs)
- Cannot execute tickets
- Can be invited/removed

**QA (Quality Assurance):**
- Can view tickets
- Cannot execute or approve
- Can be invited/removed

### References

- [Epic 3 Definition: docs/SUPER-SPRINT-TEAMS-CLI-COMPLETE.md#Epic 3]
- [Team Domain: backend/src/teams/domain/Team.ts]
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
