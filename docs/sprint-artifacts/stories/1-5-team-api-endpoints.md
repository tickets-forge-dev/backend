# Story 1.5: Team API Endpoints

**Epic:** Epic 1 - Team Foundation  
**Priority:** P0 CRITICAL  
**Effort:** 2 days  
**Status:** drafted  
**Blocked By:** 1.4 (Use Cases)

## Objective
Expose team operations via REST API. Controllers handle HTTP + validation, delegate to use cases.

## Acceptance Criteria
- [ ] POST /teams - Create team (requires: name)
- [ ] GET /teams - List user's teams
- [ ] GET /teams/:id - Get team by ID
- [ ] PATCH /teams/:id - Update team (requires: owner)
- [ ] DELETE /teams/:id - Delete team (requires: owner, soft delete)
- [ ] All endpoints validate Firebase UID from auth token
- [ ] All endpoints return standardized DTO responses
- [ ] DTOs include validation (class-validator)
- [ ] Error handling: 400, 403, 404 with meaningful messages
- [ ] All endpoints tested
- [ ] 0 TypeScript errors

## Files to Create
```
backend/src/teams/presentation/
  ├── controllers/
  │   └── teams.controller.ts
  ├── dtos/
  │   ├── CreateTeamDto.ts
  │   ├── UpdateTeamDto.ts
  │   ├── TeamResponseDto.ts
  │   └── *.spec.ts
  └── guards/
      └── TeamOwnerGuard.ts
```

## Definition of Done
- ✅ All CRUD endpoints working
- ✅ Error responses standardized
- ✅ Integration tests passing
- ✅ 0 TypeScript errors

