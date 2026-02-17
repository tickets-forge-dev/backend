# Story 1.10: Create Team Dialog

**Epic:** Epic 1 - Team Foundation
**Priority:** P0 CRITICAL
**Effort:** 1 day
**Status:** in-progress
**Blocked By:** 1.9 (Team Settings Page) - UNBLOCKED

## Story

As a **user**,
I want **a dialog to create a new team**,
so that **I can create additional teams and switch between them**.

## Acceptance Criteria

- [ ] Modal dialog with form: team name input
- [ ] Validate name (3-50 chars, required)
- [ ] Submit → call createTeam() → auto-switch to new team
- [ ] Success toast: "Team created! You are the Admin."
- [ ] Error handling with toast on failure
- [ ] Dialog accessible from Settings or Team Switcher
- [ ] Build passes with 0 TypeScript errors

## Tasks / Subtasks

- [ ] **Task 1:** Create CreateTeamDialog Component (AC: 1, 2, 3, 4, 5)
  - [ ] Create `client/src/teams/components/CreateTeamDialog.tsx`
  - [ ] Use shadcn/ui Dialog component
  - [ ] Form with single input: team name
  - [ ] Client-side validation: 3-50 characters, required, trim whitespace
  - [ ] Submit button disabled while creating (loading state)
  - [ ] Call teamStore.createTeam(name)
  - [ ] On success: close dialog, show success toast, auto-switch to new team
  - [ ] On error: show error toast, keep dialog open

- [ ] **Task 2:** Integrate Dialog into UI (AC: 6)
  - [ ] Option A: Add "+ Create Team" button in TeamSwitcher dropdown
  - [ ] Option B: Add "+ Create Team" button in Settings page
  - [ ] Option C: Both locations
  - [ ] Pass open/onOpenChange props to control dialog state

- [ ] **Task 3:** Build Verification (AC: 7)
  - [ ] Run `npm run build` for frontend
  - [ ] Verify 0 TypeScript errors
  - [ ] Test create flow end-to-end

## Dev Notes

### Architecture Patterns

**Frontend (Atomic Design):**
- **Component**: CreateTeamDialog.tsx (organism)
- **Atoms**: Dialog, DialogTrigger, DialogContent, Input, Button (shadcn/ui)
- **State**: useTeamStore hook (createTeam action already implemented)

**Error Handling:**
- BadRequestException → 400 (invalid name, duplicate name)
- Frontend handles errors via toast notifications

### Learnings from Previous Story

**From Story 1.9 - Team Settings Page (Status: done)**

- Team store already has `createTeam(name)` method implemented
- Store handles: API call, adds to list, sets as current, updates localStorage
- Success/error handling via store error state
- Toast notifications using sonner

**From Story 1.8 - Team Switcher UI (Status: done)**

- TeamSwitcher component exists and working
- Could add "+ Create Team" button at bottom of dropdown
- Dropdown already uses Popover component from shadcn/ui

**Key Interfaces to Reuse:**
- `useTeamStore()` hook from `@/teams/stores/team.store`
- `Team` type from `@/teams/services/team.service`
- Dialog component from `@/core/components/ui/dialog` (if not exists, will need to create)

### Project Structure Notes

**Frontend Structure:**
```
client/src/teams/components/
  ├── TeamSwitcher.tsx              (EXISTING - modify for Task 2)
  └── CreateTeamDialog.tsx          (NEW - Task 1)

client/app/(main)/settings/team/
  └── page.tsx                      (EXISTING - optional integration point)
```

**Design System:**
- Linear-inspired: Flat, calm, minimal
- Primary action: Purple button
- Dialog: shadcn/ui Dialog component
- Toast notifications: sonner (useToast() hook)
- Form validation: Show error message below input on blur

### Implementation Options for Task 2

**Option A: TeamSwitcher Integration (Recommended)**
- Add "+ Create Team" button at bottom of dropdown
- Opens dialog on click
- Most discoverable location
- Minimal code change

**Option B: Settings Page Integration**
- Add "+ Create Team" button on Team Settings page
- Secondary location for team management
- Less discoverable

**Option C: Both Locations**
- Best UX but more integration work
- Use same CreateTeamDialog component
- Pass trigger prop or use Dialog composition

### References

- [Epic 1 Definition: docs/SUPER-SPRINT-TEAMS-CLI-COMPLETE.md#Epic 1]
- [Team Store: client/src/teams/stores/team.store.ts]
- [Team Switcher: client/src/teams/components/TeamSwitcher.tsx]
- [Previous Story: stories/1-9-team-settings-page.md]
- [CLAUDE.md: Clean Architecture + Atomic Design]

## Dev Agent Record

### Context Reference

- Story Context XML: TBD

### Agent Model Used

TBD

### Debug Log References

TBD

### Completion Notes List

TBD

### File List

TBD
