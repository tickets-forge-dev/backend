# Story 3.2: TeamMember Repository

**Epic:** Epic 3 - Members & Roles
**Priority:** P0 CRITICAL
**Effort:** 1 day
**Status:** in-progress
**Blocked By:** 3.1 (TeamMember Domain Model) - UNBLOCKED

## Story

As a **system**,
I want **a repository to persist and retrieve team members**,
so that **I can store team membership data in Firestore**.

## Acceptance Criteria

- [ ] Create `TeamMemberRepository` port interface
- [ ] Implement `FirestoreTeamMemberRepository`
- [ ] Store at path: `/teams/{teamId}/members/{userId}`
- [ ] Methods: save, findByTeam, findByUser, findByUserAndTeam, update, delete
- [ ] Create `TeamMemberMapper` for domain ↔ persistence translation
- [ ] Handle Firestore Timestamp conversion (invitedAt, joinedAt, removedAt)
- [ ] Register repository in TeamsModule
- [ ] Build passes with 0 TypeScript errors

## Tasks / Subtasks

- [ ] **Task 1:** Create TeamMemberRepository Port (AC: 1)
  - [ ] Create `backend/src/teams/application/ports/TeamMemberRepository.ts`
  - [ ] Define interface with methods:
    - `save(member: TeamMember): Promise<void>`
    - `findByTeam(teamId: string): Promise<TeamMember[]>`
    - `findByUser(userId: string): Promise<TeamMember[]>`
    - `findByUserAndTeam(userId: string, teamId: string): Promise<TeamMember | null>`
    - `update(member: TeamMember): Promise<void>`
    - `delete(teamId: string, userId: string): Promise<void>`

- [ ] **Task 2:** Create TeamMemberMapper (AC: 5, 6)
  - [ ] Create `backend/src/teams/infrastructure/persistence/TeamMemberMapper.ts`
  - [ ] Method: `toPersistence(member: TeamMember): FirestoreTeamMemberDoc`
    - Convert domain TeamMember to Firestore document
    - Convert Date to Firestore Timestamp
  - [ ] Method: `toDomain(doc: FirestoreTeamMemberDoc): TeamMember`
    - Convert Firestore document to domain TeamMember
    - Convert Firestore Timestamp to Date
    - Use TeamMember.reconstitute()

- [ ] **Task 3:** Implement FirestoreTeamMemberRepository (AC: 2, 3, 4)
  - [ ] Create `backend/src/teams/infrastructure/persistence/FirestoreTeamMemberRepository.ts`
  - [ ] Inject Firestore via constructor
  - [ ] Collection path: `/teams/{teamId}/members/{userId}`
  - [ ] Implement all port methods using TeamMemberMapper
  - [ ] Handle not found cases (return null for findByUserAndTeam)
  - [ ] Error handling with descriptive messages

- [ ] **Task 4:** Register Repository in TeamsModule (AC: 7)
  - [ ] Add to `backend/src/teams/teams.module.ts` providers
  - [ ] Bind interface to implementation

- [ ] **Task 5:** Build Verification (AC: 8)
  - [ ] Run `npm run build` for backend
  - [ ] Verify 0 TypeScript errors

## Dev Notes

### Architecture Patterns

**Ports & Adapters (Hexagonal Architecture):**
- **Port**: TeamMemberRepository interface (application layer)
- **Adapter**: FirestoreTeamMemberRepository (infrastructure layer)
- **Domain**: TeamMember entity (no Firestore dependencies)

**Mapper Pattern:**
- Separate domain models from persistence DTOs
- Handle type conversions (Date ↔ Timestamp)
- Keep domain pure (no Firestore imports in domain)

### Firestore Schema

**Collection Path:**
```
/teams/{teamId}/members/{userId}
```

**Document Structure:**
```typescript
{
  id: string;                // Composite: {teamId}_{userId}
  userId: string;            // Firebase Auth UID
  teamId: string;            // Team ID
  email: string;             // User email (lowercase)
  displayName?: string;      // User display name (after activation)
  role: string;              // "admin" | "developer" | "pm" | "qa"
  status: string;            // "invited" | "active" | "removed"
  invitedBy: string;         // User ID who sent invite
  invitedAt: Timestamp;      // Firestore Timestamp
  joinedAt?: Timestamp;      // Firestore Timestamp (when accepted)
  removedAt?: Timestamp;     // Firestore Timestamp (when removed)
}
```

### Learnings from Previous Stories

**From Story 1.2 - Team Repository:**
- Use Firestore Timestamp for dates
- Mapper pattern separates domain from persistence
- Handle null/undefined for optional fields
- Error handling: descriptive messages on Firestore errors

**From Story 3.1 - TeamMember Domain:**
- TeamMember.reconstitute() rebuilds from persistence
- Role and MemberStatus are enums (need string conversion)
- Dates: invitedAt (required), joinedAt (optional), removedAt (optional)

### Project Structure Notes

**Backend Structure:**
```
backend/src/teams/
  ├── application/ports/
  │   ├── TeamRepository.ts           (EXISTING)
  │   └── TeamMemberRepository.ts     (NEW - Task 1)
  ├── domain/
  │   ├── Team.ts                     (EXISTING)
  │   ├── TeamMember.ts               (EXISTING)
  │   ├── Role.ts                     (EXISTING)
  │   └── MemberStatus.ts             (EXISTING)
  └── infrastructure/persistence/
      ├── FirestoreTeamRepository.ts  (EXISTING)
      ├── TeamMapper.ts               (EXISTING)
      ├── FirestoreTeamMemberRepository.ts (NEW - Task 3)
      └── TeamMemberMapper.ts         (NEW - Task 2)
```

### Query Patterns

**findByTeam(teamId):**
- Returns all members for a team
- Use case: Display team members list

**findByUser(userId):**
- Returns all teams user is a member of
- Use case: Check user's team memberships

**findByUserAndTeam(userId, teamId):**
- Returns single member or null
- Use case: Check if user is member of specific team

### References

- [Epic 3 Definition: docs/SUPER-SPRINT-TEAMS-CLI-COMPLETE.md#Epic 3]
- [TeamMember Domain: backend/src/teams/domain/TeamMember.ts]
- [Team Repository: backend/src/teams/infrastructure/persistence/FirestoreTeamRepository.ts]
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
