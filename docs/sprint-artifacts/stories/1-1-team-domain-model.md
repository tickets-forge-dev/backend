# Story 1.1: Team Domain Model

**Epic:** Epic 1 - Team Foundation  
**Priority:** P0 CRITICAL  
**Effort:** 2 days  
**Status:** drafted  

## Objective
Implement Team as a domain entity with validation, factory, and business logic. This is the foundation for multi-team support.

## Acceptance Criteria
- [ ] `Team` domain entity created with: id, name, slug, ownerId, settings, createdAt, updatedAt
- [ ] Team validation: name required, 3-50 chars, slug auto-generated & unique
- [ ] `TeamFactory` creates valid Team instances
- [ ] `InvalidTeamException` thrown for validation failures
- [ ] Team slug generation: lowercase, kebab-case, auto-increment on collision
- [ ] Settings value object with: defaultWorkspaceId, allowMemberInvites
- [ ] 100% domain test coverage
- [ ] 0 TypeScript errors

## Technical Details

### Files to Create
```
backend/src/teams/domain/
  ├── Team.ts                    (entity)
  ├── TeamId.ts                  (value object)
  ├── TeamSettings.ts            (value object)
  ├── TeamFactory.ts             (factory)
  ├── exceptions/
  │   └── InvalidTeamException.ts
  └── Team.spec.ts               (tests)
```

### Team Entity Properties
```typescript
interface Team {
  id: TeamId;
  name: string;           // 3-50 chars
  slug: string;           // unique, auto-generated
  ownerId: string;        // Firebase UID
  settings: TeamSettings;
  createdAt: Date;
  updatedAt: Date;
}
```

### Dependencies
- Clean Architecture: domain must not depend on NestJS/Firebase
- Use factory pattern for construction
- Immutable value objects

## Definition of Done
- ✅ Code written with no hidden side effects
- ✅ All tests passing
- ✅ Code review approved
- ✅ 0 TypeScript errors
- ✅ Committed with co-author tag

