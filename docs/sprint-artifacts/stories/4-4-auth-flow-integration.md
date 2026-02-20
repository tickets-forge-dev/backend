# Story 4.4: Auth Flow Integration

**Epic:** Epic 4 - Enhanced Onboarding
**Priority:** P0 CRITICAL
**Effort:** 1 day
**Status:** drafted

## Story

As a **new user signing in for the first time**,
I want **the system to automatically guide me through onboarding if I don't have a team**,
so that **I can start using the platform immediately after authentication**.

## Acceptance Criteria

1. **After successful OAuth sign-in**:
   - Check if user has any teams
   - If NO teams → Redirect to `/onboarding/team-name`
   - If HAS teams → Redirect to `/tickets`

2. **Backend `/auth/init` endpoint**:
   - Should NOT auto-create a team anymore
   - Just initialize user record
   - Return user info + team count

3. **Frontend auth callback**:
   - Call `/auth/init` after Firebase auth
   - Check response for team existence
   - Route user based on team status

4. **Onboarding resume**:
   - If user has incomplete onboarding (localStorage), resume from saved state
   - Otherwise, start fresh from team name step

5. **0 TypeScript errors**

## Tasks / Subtasks

- [ ] **Update backend `/auth/init` endpoint** (AC: #2)
  - [ ] Remove auto-team-creation logic
  - [ ] Return user info + teams array
  - [ ] Add hasTeams boolean to response

- [ ] **Update frontend SignInUseCase** (AC: #1, #3)
  - [ ] Call `/auth/init` after OAuth success
  - [ ] Check if user has teams
  - [ ] Route to `/onboarding/team-name` if no teams
  - [ ] Route to `/tickets` if has teams

- [ ] **Add onboarding resume logic** (AC: #4)
  - [ ] Check localStorage for incomplete onboarding on app init
  - [ ] Resume from saved state if found
  - [ ] Otherwise start fresh

- [ ] **Testing** (AC: #5)
  - [ ] Test new user flow (no teams → onboarding)
  - [ ] Test existing user flow (has teams → tickets)
  - [ ] Verify 0 TypeScript errors

## Dev Notes

### Current Auth Flow

```
User clicks "Sign in with Google"
  ↓
Firebase OAuth
  ↓
POST /auth/init (creates workspace + team automatically) ← CHANGE THIS
  ↓
Redirect to /tickets
```

### New Auth Flow

```
User clicks "Sign in with Google"
  ↓
Firebase OAuth
  ↓
POST /auth/init (just initializes user, NO auto-team-creation)
  ↓
Check response.hasTeams:
  - true → Redirect to /tickets
  - false → Redirect to /onboarding/team-name
```

### Files to Modify

**Backend:**
- `backend/src/workspaces/presentation/controllers/auth.controller.ts`
- `backend/src/workspaces/application/use-cases/InitializeWorkspaceUseCase.ts`

**Frontend:**
- `client/src/auth/application/sign-in.use-case.ts`
- `client/app/(auth)/login/page.tsx` (if needed)

### Implementation Notes

- The `/auth/init` endpoint currently creates a workspace and team automatically
- We need to remove that auto-creation logic
- Instead, just return whether user has teams
- Frontend decides where to route based on team existence

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

_Not yet implemented_

### Debug Log References

_Not yet implemented_

### Completion Notes List

_Not yet implemented_

### File List

_Not yet implemented_
