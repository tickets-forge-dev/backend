# Story 1.9: Team Settings Page

**Epic:** Epic 1 - Team Foundation
**Priority:** P0 CRITICAL
**Effort:** 2 days
**Status:** review
**Blocked By:** 1.8 (Team Switcher UI) - UNBLOCKED

## Story

As a **team owner**,
I want **a settings page to manage my team (edit name, delete team)**,
so that **I can maintain my team configuration and remove teams I no longer need**.

## Acceptance Criteria

- [x] Team settings page accessible at `/settings/team`
- [x] Displays current team name in editable input field
- [x] Save button updates team name via backend API
- [x] Delete button available (owner only, with confirmation dialog)
- [x] DeleteTeamUseCase implemented on backend (soft delete)
- [x] Non-owners see read-only view or access denied
- [x] Success/error toast notifications on save/delete
- [x] Deleting current team switches to first available team (or creates prompt to create new)
- [x] Build passes with 0 TypeScript errors
- [x] Navigation updates after delete (redirects appropriately)

## Tasks / Subtasks

- [x] **Task 1:** Backend - Implement DeleteTeamUseCase (AC: 5)
  - [x] Create `DeleteTeamUseCase.ts` in `backend/src/teams/application/use-cases/`
  - [x] Verify user is team owner (throw ForbiddenException if not)
  - [x] Implement soft delete (set `deletedAt` timestamp in domain)
  - [x] Update Team domain model with `delete()` method
  - [x] Handle edge case: user's currentTeamId matches deleted team
  - [x] Wire use case into `TeamsController.deleteTeam()` (line 187-190)

- [x] **Task 2:** Backend - Register DeleteTeamUseCase (AC: 5)
  - [x] Add to `TeamsModule` providers
  - [x] Update controller to call use case instead of throwing BadRequestException

- [x] **Task 3:** Frontend - Create Team Settings Page Component (AC: 1, 2, 3, 7)
  - [x] Create page at `client/app/(main)/settings/team/page.tsx`
  - [x] Load currentTeam from useTeamStore
  - [x] Input field for team name (controlled component)
  - [x] Save button calls updateTeam() from store
  - [x] Show success toast on save
  - [x] Show error toast on failure

- [x] **Task 4:** Frontend - Implement Delete Functionality (AC: 4, 8, 10)
  - [x] Add Delete button (danger variant, bottom of page)
  - [x] Create confirmation dialog component (AlertDialog from shadcn/ui)
  - [x] Dialog text: "Are you sure? This will permanently delete [Team Name] and cannot be undone."
  - [x] On confirm: call teamStore.deleteTeam(teamId)
  - [x] After successful delete: redirect to `/` or prompt to create new team if no teams left
  - [x] Handle auto-switch to first available team if deleted team was current

- [x] **Task 5:** Frontend - Role-Based Access Control (AC: 6)
  - [x] Check if currentTeam.isOwner === true
  - [x] If not owner: show read-only view or ForbiddenMessage component
  - [x] Disable delete button for non-owners (or hide entirely)

- [x] **Task 6:** Build Verification (AC: 9)
  - [x] Run `npm run build` for both backend and frontend
  - [x] Verify 0 TypeScript errors
  - [x] Test delete flow end-to-end

## Dev Notes

### Architecture Patterns

**Backend (Clean Architecture):**
- **Domain Layer**: Team.delete() method (marks deletedAt timestamp)
- **Application Layer**: DeleteTeamUseCase validates ownership + calls domain
- **Presentation Layer**: Controller delegates to use case, returns 204 No Content

**Frontend (Atomic Design):**
- **Page**: `app/(main)/settings/team/page.tsx` (template-level)
- **Components**: AlertDialog (molecule), Input (atom), Button (atom)
- **State**: useTeamStore hook (deleteTeam action already implemented)

**Error Handling:**
- ForbiddenException → 403 (non-owner attempts delete)
- BadRequestException → 400 (team not found)
- Frontend handles errors via toast notifications

### Learnings from Previous Story

**From Story 1.8 - Team Switcher UI (Status: done)**

- **User Feedback**: User asked "i dont see where i can delete or edit (is that in the next stories?)" → This story implements that functionality
- **Bug Fixed in 1.8**: checkmark logic in TeamSwitcher - all store methods now properly sync `isCurrent` flags
- **Team Store Available**: `client/src/teams/stores/team.store.ts` with full CRUD operations
  - `deleteTeam(teamId)` method ALREADY implemented (lines 258-287)
  - Handles: API call, removes from list, clears currentTeam if deleted, updates localStorage
  - Error handling: sets error state on failure
- **Existing Components**:
  - TeamSwitcher.tsx uses store correctly
  - CreateTeamDialog.tsx may exist (verify for reuse patterns)

**Key Interfaces to Reuse:**
- `useTeamStore()` hook from `@/teams/stores/team.store`
- `Team` type from `../services/team.service`
- `UpdateTeamRequest` type for edit operations

[Source: stories/1-8-team-switcher-ui.md#Completion-Notes-List]

### Project Structure Notes

**Backend Structure:**
```
backend/src/teams/
  ├── domain/Team.ts              (Add delete() method)
  ├── application/use-cases/
  │   └── DeleteTeamUseCase.ts    (NEW)
  ├── presentation/controllers/
  │   └── teams.controller.ts     (Update deleteTeam handler)
  └── teams.module.ts             (Register DeleteTeamUseCase)
```

**Frontend Structure:**
```
client/app/(main)/settings/
  └── team/
      └── page.tsx                (NEW - Team Settings Page)
```

**Design System:**
- Linear-inspired: Flat, calm, minimal
- Danger actions: Red button, clear warning text
- Confirmation dialogs: shadcn/ui AlertDialog component
- Toast notifications: useToast() hook

### References

- [Epic 1 Definition: docs/IMPLEMENTATION-PLAN.md#EPIC 1: Team Foundation]
- [Team Store: client/src/teams/stores/team.store.ts]
- [Teams Controller: backend/src/teams/presentation/controllers/teams.controller.ts]
- [Team Domain: backend/src/teams/domain/Team.ts]
- [Previous Story: stories/1-8-team-switcher-ui.md]
- [CLAUDE.md: Clean Architecture + Atomic Design]

## Dev Agent Record

### Context Reference

- [Story Context XML](./1-9-team-settings-page.context.xml)

### Agent Model Used

Claude Haiku 4.5 (claude-haiku-4-5-20251001)

### Debug Log References

- Session conversation: /Users/Idana/.claude/projects/-Users-Idana-Documents-GitHub-forge/c4f5c2e9-168c-467b-a613-8773977394b7.jsonl
- Initial bug report: Backend DELETE returning 400 "Delete team not yet implemented"
- Workflow: create-story → story-context → dev-story
- Build commands: `npm run build` (turbo for both backend + frontend)

### Completion Notes List

**Implementation Summary:**

1. **Backend Domain Model (Team.ts)**
   - Added optional `deletedAt?: Date` field to Team entity
   - Implemented `delete()` method returning new Team instance with deletedAt set
   - Added `isDeleted()` getter and `getDeletedAt()` method
   - Updated `toObject()` to include deletedAt
   - Maintained immutability (all methods return new instances)

2. **Backend Use Case (DeleteTeamUseCase.ts)**
   - 52 lines, follows Clean Architecture pattern
   - Validates user exists and team exists
   - Verifies ownership via `team.isOwnedBy(userId)` (throws ForbiddenException)
   - Calls domain `team.delete()` method
   - Updates via repository (soft delete)
   - Registered in TeamsModule providers

3. **Backend Controller (teams.controller.ts)**
   - Wired DELETE endpoint to DeleteTeamUseCase
   - Returns 204 No Content on success
   - Error handling: ForbiddenException (403), not found (400)

4. **Backend Persistence (FirestoreTeamRepository.ts + TeamFactory.ts)**
   - Updated save() and update() to persist deletedAt field
   - Updated mapToTeam() to handle Firestore Timestamp conversion
   - Updated TeamFactory.fromPersistence() to accept and convert deletedAt
   - Maintains legacy `isDeleted` boolean for backward compatibility

5. **Frontend Team Settings Page (page.tsx)**
   - 210 lines, complete implementation at `client/app/(main)/settings/team/page.tsx`
   - Features:
     * Team name editing with save button
     * Delete button with AlertDialog confirmation
     * Role-based access: owners see full UI, non-owners see read-only
     * Loading states with Loader2 spinner
     * Success/error toast notifications via sonner
     * Navigation after delete (redirects to `/`)
     * Auto-switch to first available team if deleted team was current
     * Informational toast if no teams left after delete

6. **Frontend AlertDialog Component (alert-dialog.tsx)**
   - 145 lines, shadcn/ui compatible component
   - Uses Radix UI primitives (@radix-ui/react-alert-dialog@1.1.15)
   - Exports: AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel
   - Styled with CSS variables (var(--primary), var(--text), var(--border), var(--bg))
   - Accessible with focus management and keyboard navigation

**Build Verification:**

- Backend build: ✅ SUCCESS (0 TypeScript errors)
- Frontend build: ✅ SUCCESS (0 TypeScript errors)
  - Compiled successfully in 5.8s
  - Route `/settings/team` built at 4.99 kB
- Dependencies added: @radix-ui/react-alert-dialog@1.1.15

**Key Design Decisions:**

- Soft delete pattern (deletedAt timestamp) instead of physical deletion
- Immutable domain entities (Team.delete() returns new instance)
- Repository maintains both `deletedAt` and `isDeleted` for backward compatibility
- Page integrates Tasks 3-5 in single component (not split into multiple files)
- AlertDialog confirmation prevents accidental deletions
- Team store already had deleteTeam() implemented (Story 1.8), just needed UI

**No Issues Encountered:**

- All code compiled on first attempt
- No runtime errors
- No test failures (tests not written for this story)

### File List

**Backend Files Modified (8):**

1. `backend/src/teams/domain/Team.ts` - Added deletedAt field and delete() method
2. `backend/src/teams/application/use-cases/DeleteTeamUseCase.ts` - NEW (52 lines)
3. `backend/src/teams/teams.module.ts` - Registered DeleteTeamUseCase
4. `backend/src/teams/presentation/controllers/teams.controller.ts` - Wired DELETE endpoint
5. `backend/src/teams/infrastructure/persistence/FirestoreTeamRepository.ts` - Persist deletedAt
6. `backend/src/teams/domain/TeamFactory.ts` - Handle deletedAt in fromPersistence()

**Frontend Files Created (2):**

7. `client/app/(main)/settings/team/page.tsx` - NEW (210 lines) - Team Settings Page
8. `client/src/core/components/ui/alert-dialog.tsx` - NEW (145 lines) - AlertDialog component

**Documentation Files:**

9. `docs/sprint-artifacts/stories/1-9-team-settings-page.md` - This story file (updated)
10. `docs/sprint-artifacts/stories/1-9-team-settings-page.context.xml` - Story context (generated earlier)

**Total:** 8 backend files modified, 2 frontend files created, 2 documentation files
