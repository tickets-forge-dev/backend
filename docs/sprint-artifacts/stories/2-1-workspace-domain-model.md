# Story 2.1: Workspace Domain Model

**Epic:** Epic 2 - Workspace Management  
**Priority:** P0 CRITICAL  
**Effort:** 2 days  
**Status:** drafted  

## Objective
Implement Workspace as a domain entity supporting 1-3 repositories per workspace. Workspaces belong to teams and represent logical groupings of related repositories.

## Acceptance Criteria
- [ ] `Workspace` entity: id, teamId, name, repositories[], createdBy, createdAt, updatedAt
- [ ] `Repository` value object: name, owner, url, branch
- [ ] Max 3 repositories per workspace (validated)
- [ ] Min 1 repository required
- [ ] Repository uniqueness per workspace (no duplicate URLs)
- [ ] `WorkspaceFactory` creates valid instances
- [ ] `InvalidWorkspaceException` for validation
- [ ] 100% domain test coverage
- [ ] 0 TypeScript errors

## Technical Details

### Files to Create
```
backend/src/teams/domain/
  ├── Workspace.ts              (entity)
  ├── WorkspaceId.ts            (value object)
  ├── Repository.ts             (value object)
  ├── WorkspaceFactory.ts       (factory)
  ├── exceptions/
  │   └── InvalidWorkspaceException.ts
  └── Workspace.spec.ts         (tests)
```

### Repository Value Object
```typescript
interface Repository {
  name: string;        // e.g., 'forge', 'api-server'
  owner: string;       // GitHub org/user
  url: string;         // https://github.com/owner/repo
  branch: string;      // main, develop, etc.
}
```

## Definition of Done
- ✅ Domain logic tested
- ✅ Factory pattern working
- ✅ Validation comprehensive
- ✅ 0 TypeScript errors

