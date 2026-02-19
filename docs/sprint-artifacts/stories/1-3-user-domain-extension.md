# Story 1.3: User Domain Extension

**Epic:** Epic 1 - Team Foundation  
**Priority:** P0 CRITICAL  
**Effort:** 1 day  
**Status:** drafted  
**Blocked By:** 1.1 (Team Domain Model)

## Objective
Extend User domain entity to support multi-team context. Users can belong to multiple teams and have a current team.

## Acceptance Criteria
- [ ] User adds: currentTeamId (string, nullable), teams (TeamId[])
- [ ] Default team set on first team creation
- [ ] Team switching updates currentTeamId
- [ ] User validation: at least 1 team required after onboarding
- [ ] Firestore: /users/{userId} includes new fields
- [ ] Mapper updated for persistence
- [ ] All tests passing
- [ ] 0 TypeScript errors

## Files to Modify
```
backend/src/users/domain/User.ts
  - Add currentTeamId: TeamId | null
  - Add teams: TeamId[]
  - Methods: addTeam(teamId), switchTeam(teamId)

backend/src/users/infrastructure/persistence/
  - Update mapper for new fields

backend/src/users/domain/User.spec.ts
  - Test team operations
```

## Definition of Done
- ✅ User can have multiple teams
- ✅ Team switching working
- ✅ Persistence mapped correctly
- ✅ 0 TypeScript errors

