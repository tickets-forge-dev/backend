# Story 1.2: Team Repository (Firestore Persistence)

**Epic:** Epic 1 - Team Foundation  
**Priority:** P0 CRITICAL  
**Effort:** 2 days  
**Status:** drafted  
**Blocked By:** 1.1 (Team Domain Model)

## Objective
Implement Firestore persistence for Team entity. This is the data access layer that enforces team ownership and isolation.

## Acceptance Criteria
- [ ] `FirestoreTeamRepository` implements `TeamRepository` interface
- [ ] Save team: create at `/teams/{teamId}` with validation
- [ ] Get team by ID with ownership check
- [ ] List teams for user (from User.teams[])
- [ ] Update team (name, settings) with validation
- [ ] Delete team (owner only)
- [ ] Query by slug (unique index)
- [ ] Soft delete support (flag, not physical deletion)
- [ ] All operations include Firestore indexes
- [ ] 100% test coverage (mock Firestore)
- [ ] 0 TypeScript errors

## Technical Details

### Files to Create
```
backend/src/teams/infrastructure/persistence/
  ├── FirestoreTeamRepository.ts
  ├── mappers/
  │   └── TeamPersistenceMapper.ts
  └── FirestoreTeamRepository.spec.ts
```

### Firestore Collection Structure
```yaml
/teams/{teamId}
  id: string
  name: string
  slug: string (indexed)
  ownerId: string (indexed for queries)
  settings:
    defaultWorkspaceId: string
    allowMemberInvites: boolean
  createdAt: timestamp
  updatedAt: timestamp
  isDeleted: boolean (soft delete flag)
```

### Required Firestore Indexes
```
Collection: teams
Fields: slug (Ascending), ownerId (Ascending)
```

## Definition of Done
- ✅ All CRUD operations working
- ✅ Firestore indexes configured
- ✅ Tests using mock Firestore
- ✅ 0 TypeScript errors

