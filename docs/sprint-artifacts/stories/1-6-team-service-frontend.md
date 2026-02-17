# Story 1.6: Team Service (Frontend)

**Epic:** Epic 1 - Team Foundation
**Priority:** P0 CRITICAL
**Effort:** 1 day
**Status:** done
**Blocked By:** 1.5 (Team API Endpoints)

## Story

As a **frontend developer**,
I want **a team service that wraps all team API calls**,
so that **UI components have a clean abstraction for team operations**.

## Acceptance Criteria

- [ ] `TeamService` class implements all team API calls
- [ ] `createTeam(name: string)` - POST /teams
- [ ] `getTeams()` - GET /teams (user's teams)
- [ ] `getTeam(teamId: string)` - GET /teams/:id
- [ ] `updateTeam(teamId, updates)` - PATCH /teams/:id
- [ ] `deleteTeam(teamId)` - DELETE /teams/:id
- [ ] All methods return typed responses (TeamDto)
- [ ] Error handling with user-friendly messages
- [ ] Service integrated with useServices() hook
- [ ] TypeScript errors = 0

## Tasks / Subtasks

- [ ] **Task 1:** Create TeamService class (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Define `TeamService` interface with all CRUD methods
  - [ ] Implement `createTeam()` - POST request with validation
  - [ ] Implement `getTeams()` - GET request with auth token
  - [ ] Implement `getTeam(teamId)` - GET by ID with error handling
  - [ ] Implement `updateTeam(teamId, updates)` - PATCH with ownership check
  - [ ] Implement `deleteTeam(teamId)` - DELETE with confirmation

- [ ] **Task 2:** Add TypeScript types (AC: 7)
  - [ ] Create `types/team.ts` with TeamDto, CreateTeamRequest, UpdateTeamRequest
  - [ ] Ensure all service methods return typed responses
  - [ ] Export types for use in components

- [ ] **Task 3:** Error handling (AC: 8)
  - [ ] Wrap API calls in try-catch blocks
  - [ ] Map backend errors to user-friendly messages
  - [ ] Handle 400 (validation), 403 (forbidden), 404 (not found) cases
  - [ ] Return consistent error format: `{ error: string }`

- [ ] **Task 4:** Service registration (AC: 9)
  - [ ] Register TeamService in `core/services/index.ts`
  - [ ] Ensure singleton pattern via useServices() hook
  - [ ] Add JSDoc comments for IDE autocomplete

- [ ] **Task 5:** Build verification (AC: 10)
  - [ ] Run `npm run build` in client directory
  - [ ] Fix any TypeScript errors
  - [ ] Verify no new ESLint warnings

## Dev Notes

### Architecture Patterns

**Service Layer Pattern:**
- Follow existing service pattern from `AuthService`, `TicketService`
- Singleton registration in `core/services/index.ts`
- All HTTP calls use `fetch()` with `NEXT_PUBLIC_API_URL` base
- Return typed responses using shared types from `@repo/shared-types` (if available)

**Error Handling:**
- Use consistent error mapping: `{ error: string }` format
- Log errors to console in development
- Never expose sensitive error details to UI

**API Client Configuration:**
- Base URL: `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'`
- Include credentials: `{ credentials: 'include' }` for cookie-based auth
- Firebase auth token: Add `Authorization: Bearer ${token}` header

### Project Structure Notes

**File Locations (follow existing patterns):**
```
client/src/teams/
  └── services/
      └── team.service.ts       (NEW)

client/src/teams/types/
  └── team.ts                   (NEW - or use @repo/shared-types)

client/src/core/services/
  └── index.ts                  (MODIFIED - register TeamService)
```

**Naming Conventions:**
- Class name: `TeamService` (PascalCase)
- File name: `team.service.ts` (kebab-case)
- Methods: camelCase (createTeam, getTeams, etc.)

### Learnings from Previous Story

**From Story 1.5 - Team API Endpoints (Status: drafted)**

The backend API endpoints are now available at:
- `POST /teams` - Create team
- `GET /teams` - List user's teams
- `GET /teams/:id` - Get team by ID
- `PATCH /teams/:id` - Update team
- `DELETE /teams/:id` - Delete team (soft delete)

**DTOs created in backend:**
- `CreateTeamDto` - Validates team name
- `UpdateTeamDto` - Validates updates
- `TeamResponseDto` - Standardized response format

**Error codes to handle:**
- `400` - Validation errors (missing name, invalid format)
- `403` - Forbidden (not team owner for update/delete)
- `404` - Team not found
- `500` - Server errors

**Auth requirements:**
- All endpoints require Firebase auth token
- Token passed via Authorization header: `Bearer ${token}`
- Frontend should use Firebase Auth SDK to get current user token

[Source: stories/1-5-team-api-endpoints.md]

### Testing Guidance

**Manual Testing:**
1. Create team via service → Verify response includes teamId
2. List teams → Verify user's teams returned
3. Get team by ID → Verify correct team returned
4. Update team name → Verify changes persisted
5. Delete team → Verify soft delete (not visible in list)
6. Test error cases → Verify user-friendly error messages

**Integration Tests (Phase 2):**
- Mock API responses using MSW (Mock Service Worker)
- Test success paths for all CRUD operations
- Test error handling for 400/403/404 responses
- Verify auth token is included in requests

### References

- [Epic 1 Definition: docs/IMPLEMENTATION-PLAN.md#EPIC 1: Team Foundation]
- [API Endpoints: stories/1-5-team-api-endpoints.md]
- [Service Pattern: client/src/core/services/auth.service.ts]
- [Type Definitions: client/src/core/types/]

## Dev Agent Record

### Context Reference

- [Story Context XML](1-6-team-service-frontend.context.xml)

⚠️ **IMPORTANT DISCOVERY:** The implementation file `client/src/teams/services/team.service.ts` ALREADY EXISTS with complete functionality! This story appears to be done. Context file generated for reference and verification.

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

No debugging required - implementation already existed

### Completion Notes List

1. **Implementation Discovery:** TeamService already fully implemented at `client/src/teams/services/team.service.ts` (208 lines)
2. **Service Registration:** Added TeamService to `useServices()` hook in `client/src/services/index.ts` for consistency with CLAUDE.md requirements
3. **Build Verification:** Confirmed 0 TypeScript errors after integration (compiled successfully in 6.6s)
4. **All Acceptance Criteria Met:**
   - ✅ AC1: TeamService class implements all team API calls
   - ✅ AC2: createTeam(name: string) - POST /teams
   - ✅ AC3: getTeams() - GET /teams (implemented as getUserTeams())
   - ✅ AC4: getTeam(teamId: string) - GET /teams/:id
   - ✅ AC5: updateTeam(teamId, updates) - PATCH /teams/:id
   - ✅ AC6: deleteTeam(teamId) - DELETE /teams/:id
   - ✅ AC7: All methods return typed responses (Team, TeamSummary)
   - ✅ AC8: Error handling with user-friendly messages
   - ✅ AC9: Service integrated with useServices() hook
   - ✅ AC10: TypeScript errors = 0

### File List

**Modified:**
- `client/src/services/index.ts` - Added TeamService import and registration

**Already Existed (No changes needed):**
- `client/src/teams/services/team.service.ts` - Complete implementation (208 lines)
  - All 6 CRUD methods (createTeam, getUserTeams, getTeam, updateTeam, switchTeam, deleteTeam)
  - TypeScript types (Team, TeamSummary, CreateTeamRequest, UpdateTeamRequest, SwitchTeamRequest)
  - Firebase auth integration (getAuthToken() helper)
  - Comprehensive error handling
  - Singleton export pattern
