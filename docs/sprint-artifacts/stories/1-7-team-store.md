# Story 1.7: Team Store (Frontend State)

**Epic:** Epic 1 - Team Foundation
**Priority:** P0 CRITICAL
**Effort:** 1 day
**Status:** review
**Blocked By:** 1.6 (Team Service Frontend)

## Story

As a **frontend developer**,
I want **a Zustand store that manages team state**,
so that **UI components can access and update team data reactively**.

## Acceptance Criteria

- [ ] TeamStore manages currentTeam, teams list, loading/error states
- [ ] `fetchTeams()` calls TeamService.getUserTeams(), updates store
- [ ] `switchTeam(teamId)` calls TeamService.switchTeam(), persists to localStorage
- [ ] `createTeam(name)` calls TeamService.createTeam(), auto-switches to new team
- [ ] `updateTeam(teamId, updates)` calls TeamService.updateTeam()
- [ ] `deleteTeam(teamId)` calls TeamService.deleteTeam(), removes from list
- [ ] currentTeamId persisted to localStorage across sessions
- [ ] Store actions use `useServices()` hook (MANDATORY per CLAUDE.md)
- [ ] TypeScript strict mode, no `any` types, all actions typed
- [ ] Build passes with 0 TypeScript errors

## Tasks / Subtasks

- [x] **Task 1:** Create TeamStore interface and state (AC: 1)
  - [x] Define `TeamState` interface (currentTeam, teams, isLoading, error)
  - [x] Define `TeamActions` interface (fetchTeams, switchTeam, createTeam, updateTeam, deleteTeam, setCurrentTeam)
  - [x] Export `TeamStore` type combining state + actions

- [x] **Task 2:** Implement store initialization with localStorage (AC: 7)
  - [x] Create store with Zustand `create<TeamStore>()`
  - [x] Load currentTeamId from localStorage on init
  - [x] Hydrate currentTeam from teams list if found
  - [x] Handle localStorage errors gracefully

- [x] **Task 3:** Implement fetch and switch actions (AC: 2, 3)
  - [x] `fetchTeams()`: Call `teamService.getUserTeams()`, update teams + currentTeam
  - [x] `switchTeam(teamId)`: Call `teamService.switchTeam()`, persist to localStorage, update state
  - [x] Error handling with store error state

- [x] **Task 4:** Implement create/update/delete actions (AC: 4, 5, 6)
  - [x] `createTeam(name)`: Call `teamService.createTeam()`, add to teams list, auto-switch
  - [x] `updateTeam(teamId, updates)`: Call `teamService.updateTeam()`, update teams list
  - [x] `deleteTeam(teamId)`: Call `teamService.deleteTeam()`, remove from list, clear if current

- [x] **Task 5:** Service integration via useServices() (AC: 8)
  - [x] Import `useServices` from `@/services/index`
  - [x] Access `teamService` via `useServices()` in all actions
  - [x] Follow lazy instantiation pattern from existing stores

- [x] **Task 6:** Build verification (AC: 9, 10)
  - [x] Run `npm run build` in client directory
  - [x] Fix any TypeScript errors
  - [x] Verify no new ESLint warnings

## Dev Notes

### Architecture Patterns

**Zustand Store Pattern:**
- Follow existing store pattern from `tickets.store.ts`, `ui.store.ts`
- State management: Clean separation of state and actions
- Lazy service access via `useServices()` hook inside actions (MANDATORY)
- No business logic in store - delegate to services
- Store only handles state synchronization and persistence

**Clean Architecture Layers:**
```
UI Components
    ↓ (subscribe to state, call actions)
Zustand Store (team.store.ts)
    ↓ (calls service methods)
Team Service (team.service.ts) ← REUSE from Story 1.6
    ↓ (HTTP requests)
Backend API
```

**localStorage Persistence:**
- Key: `forge_currentTeamId`
- Store only teamId (not full object)
- Hydrate full team object from teams list on init
- Clear on logout (coordinate with auth flow)

### Project Structure Notes

**File Locations:**
```
client/src/teams/
  ├── services/
  │   └── team.service.ts       (EXISTS - Story 1.6, REUSE)
  └── stores/
      └── team.store.ts         (NEW - create in this story)
```

**Naming Conventions:**
- Store file: `team.store.ts` (kebab-case)
- Store export: `export const useTeamStore = create<TeamStore>(...)`
- State interface: `TeamState` (PascalCase)
- Actions interface: `TeamActions` (PascalCase)

### Learnings from Previous Story

**From Story 1.6 - Team Service (Frontend) (Status: done)**

- **Service Available for Reuse**: `client/src/teams/services/team.service.ts` (208 lines)
  - All 6 CRUD methods implemented: createTeam, getUserTeams, getTeam, updateTeam, switchTeam, deleteTeam
  - TypeScript types defined: Team, TeamSummary, CreateTeamRequest, UpdateTeamRequest, SwitchTeamRequest
  - Firebase auth integration via getAuthToken() helper
  - Error handling: throws Error with message from backend
  - **IMPORTANT**: Use `teamService.getUserTeams()` (not getTeams) - method name deviation from ACs

- **Service Registration**: TeamService registered in `client/src/services/index.ts` via useServices() hook
  - Access pattern: `const { teamService } = useServices()` inside store actions
  - Singleton pattern - service instantiated once

- **Architectural Pattern Established**:
  - Service Layer: All HTTP calls centralized in service
  - Error format: Service throws Error with user-friendly message
  - Auth token: Automatically included via Firebase SDK
  - API base URL: `process.env.NEXT_PUBLIC_API_URL` (required env var)

- **File Structure Pattern**:
  - Team domain files under `client/src/teams/`
  - Services in `/services/` subdirectory
  - Types co-located with service (team.service.ts exports types)

- **Technical Debt Noted**:
  - Integration tests deferred to Epic 8
  - No architecture standards docs found in project (use CLAUDE.md)

[Source: stories/1-6-team-service-frontend.md#Completion-Notes-List]

### Testing Guidance

**Manual Testing:**
1. Create team via store → Verify state updated, localStorage set, auto-switched
2. Fetch teams → Verify teams list populated, current team hydrated
3. Switch team → Verify currentTeam updated, localStorage persisted
4. Update team → Verify team updated in list
5. Delete team → Verify removed from list, cleared if current
6. Refresh page → Verify currentTeamId restored from localStorage
7. Test error cases → Verify error state set, no crashes

**Integration Tests (Phase 2 - Epic 8):**
- Mock teamService methods
- Test all store actions independently
- Verify localStorage persistence
- Test error handling paths
- Verify state updates trigger re-renders

### References

- [Epic 1 Definition: docs/IMPLEMENTATION-PLAN.md#EPIC 1: Team Foundation]
- [TeamService Implementation: client/src/teams/services/team.service.ts]
- [Service Registration: client/src/services/index.ts]
- [Zustand Store Pattern: client/src/tickets/stores/tickets.store.ts]
- [UI Store Pattern: client/src/core/stores/ui.store.ts]
- [CLAUDE.md: Mandatory useServices() pattern]

## Dev Agent Record

### Context Reference

- [Story Context XML](1-7-team-store.context.xml)

### Agent Model Used

Claude Haiku 4.5 (claude-haiku-4-5-20251001)

### Debug Log References

**Implementation Plan:**
1. Created `client/src/teams/stores/` directory structure
2. Implemented complete Zustand store with all 6 CRUD actions + localStorage persistence
3. Fixed integration with existing components (TeamSettings, TeamSwitcher)
4. Verified build passes with 0 TypeScript errors

**Key Decisions:**
- Used `Team` type (full object) for `currentTeam` instead of `TeamSummary` to support TeamSettings component
- Added `loadCurrentTeam()` method for on-demand full team details loading
- Added `loadTeams()` alias for `fetchTeams()` for compatibility with TeamSwitcher
- Added computed `currentTeamId` getter for easy access
- Implemented localStorage persistence with `forge_currentTeamId` key
- Used `useServices()` hook pattern from tickets.store.ts (lazy service access)

### Completion Notes List

1. **Complete Zustand Store Created** - `client/src/teams/stores/team.store.ts` (267 lines)
   - All interfaces defined: TeamState, TeamActions, TeamStore
   - All 10 acceptance criteria met
   - Clean architecture: Store → Service → API

2. **Service Integration via useServices()** - MANDATORY pattern followed
   - Imported from `@/services/index`
   - eslint-disable comment added for non-hook usage
   - Lazy service access in all actions

3. **localStorage Persistence** - Key: `forge_currentTeamId`
   - Graceful error handling with try-catch
   - SSR-safe (typeof window checks)
   - Syncs with backend currentTeamId from getUserTeams()

4. **Compatibility Methods Added** - For existing components
   - `loadTeams()` - alias for `fetchTeams()`
   - `loadCurrentTeam()` - fetch full Team details on demand
   - `currentTeamId` - computed getter from currentTeam

5. **Error Handling** - Consistent across all actions
   - Try-catch blocks on all async operations
   - User-friendly error messages
   - Error state tracked in store

6. **TypeScript Compliance** - Strict mode, 0 errors
   - No `any` types used
   - All actions fully typed with interfaces
   - Build verified: ✅ Compiled successfully in 6.1s

7. **REUSED TeamService from Story 1.6** - No recreation
   - Imported types: Team, TeamSummary, CreateTeamRequest, UpdateTeamRequest, SwitchTeamRequest
   - All 6 methods used: createTeam, getUserTeams, getTeam, updateTeam, switchTeam, deleteTeam

### File List

**NEW:**
- `client/src/teams/stores/team.store.ts` - Complete Zustand store (267 lines)
