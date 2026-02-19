# Story 2.2: Workspace Repository (Firestore)

**Epic:** Epic 2 - Workspace Management  
**Priority:** P0 CRITICAL  
**Effort:** 2 days  
**Status:** drafted  
**Blocked By:** 2.1 (Domain Model)

## Objective
Implement Firestore persistence for Workspace. Workspaces live under teams: `/teams/{teamId}/workspaces/{workspaceId}`.

## Acceptance Criteria
- [ ] FirestoreWorkspaceRepository CRUD operations
- [ ] Save workspace with 1-3 repo validation
- [ ] Get workspace by ID with team verification
- [ ] List workspaces for team
- [ ] Update workspace (name, repos with validation)
- [ ] Delete workspace (soft delete)
- [ ] Query by team required (no cross-team access)
- [ ] Firestore indexes configured
- [ ] All tests with mock Firestore
- [ ] 0 TypeScript errors

## Files to Create
```
backend/src/teams/infrastructure/persistence/
  ├── FirestoreWorkspaceRepository.ts
  └── mappers/
      └── WorkspacePersistenceMapper.ts
```

## Firestore Structure
```
/teams/{teamId}/workspaces/{workspaceId}
  id: string
  teamId: string
  name: string
  repositories:
    - name: string
      owner: string
      url: string
      branch: string
  createdBy: string
  createdAt: timestamp
  updatedAt: timestamp
```

## Definition of Done
- ✅ All CRUD working with team isolation
- ✅ Firestore indexes ready
- ✅ 0 TypeScript errors

