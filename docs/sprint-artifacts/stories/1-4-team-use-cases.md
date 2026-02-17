# Story 1.4: Team Use Cases

**Epic:** Epic 1 - Team Foundation  
**Priority:** P0 CRITICAL  
**Effort:** 3 days  
**Status:** drafted  
**Blocked By:** 1.1, 1.2, 1.3

## Objective
Implement business logic use cases for team operations: create, update, get, switch, list.

## Acceptance Criteria
- [ ] CreateTeamUseCase: owner creates team, auto-switches to it
- [ ] UpdateTeamUseCase: owner updates name/settings, validates slug uniqueness
- [ ] GetTeamUseCase: get team by ID with ownership verification
- [ ] GetUserTeamsUseCase: list all teams for user
- [ ] SwitchTeamUseCase: user switches current team (must own or be member)
- [ ] All use cases throw DomainException on validation failure
- [ ] All use cases have unit tests
- [ ] 0 TypeScript errors

## Files to Create
```
backend/src/teams/application/use-cases/
  ├── CreateTeamUseCase.ts
  ├── UpdateTeamUseCase.ts
  ├── GetTeamUseCase.ts
  ├── GetUserTeamsUseCase.ts
  ├── SwitchTeamUseCase.ts
  └── *.spec.ts (tests)
```

## Definition of Done
- ✅ All use cases implemented
- ✅ 100% test coverage
- ✅ Proper error handling
- ✅ 0 TypeScript errors

