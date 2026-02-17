# Story 1.8: Team Switcher UI

**Epic:** Epic 1 - Team Foundation
**Priority:** P0 CRITICAL
**Effort:** 2 days
**Status:** done
**Blocked By:** 1.7 (Team Store Frontend State) - UNBLOCKED

## Story

As a **user**,
I want **a dropdown component to switch between my teams**,
so that **I can easily navigate between different team contexts**.

## Acceptance Criteria

- [ ] TeamSwitcher dropdown component displays current team name
- [ ] Shows role badge (Owner/Member) for current team
- [ ] Lists all available teams in dropdown
- [ ] Clicking a team switches to that team (via store)
- [ ] Current team highlighted with checkmark in list
- [ ] "Create New Team" option at bottom of list
- [ ] Works in both collapsed and expanded sidebar states
- [ ] Loading state while teams fetch
- [ ] Error state if teams fail to load
- [ ] Build passes with 0 TypeScript errors

## Tasks / Subtasks

- [ ] **Task 1:** Verify TeamSwitcher component integration (AC: 1-5)
  - [ ] Component exists at `client/src/teams/components/TeamSwitcher.tsx`
  - [ ] Integrates with useTeamStore from Story 1.7
  - [ ] Displays current team name and role badge
  - [ ] Dropdown lists all teams with checkmark on current
  - [ ] handleSwitchTeam() calls store.switchTeam()

- [ ] **Task 2:** Verify sidebar integration (AC: 6)
  - [ ] Uses useUIStore for sidebarCollapsed state
  - [ ] Shows icon-only when collapsed
  - [ ] Shows full name + badge when expanded

- [ ] **Task 3:** Verify states and error handling (AC: 7, 8)
  - [ ] Loading state: returns null while loading
  - [ ] Error state: shows "Failed to load teams" message
  - [ ] Dropdown closes after team switch

- [ ] **Task 4:** Verify CreateTeamDialog integration (AC: 6)
  - [ ] "Create New Team" menu item present
  - [ ] Opens CreateTeamDialog component
  - [ ] CreateTeamDialog component exists or needs creation

- [ ] **Task 5:** Build verification (AC: 10)
  - [ ] Run `npm run build` in client directory
  - [ ] Verify 0 TypeScript errors
  - [ ] Verify component renders without console errors

## Dev Notes

### Architecture Patterns

**Component Structure:**
- Dropdown UI with shadcn/ui components (DropdownMenu, Button, Badge)
- Integration with Zustand stores (useTeamStore, useUIStore)
- Lucide icons: Users, ChevronDown, Check, Plus
- Responsive to sidebar collapsed state

**State Management:**
- Consumes useTeamStore (from Story 1.7)
  - teams: TeamSummary[]
  - currentTeamId: string | null
  - currentTeam: Team | null
  - isLoading, error
  - loadTeams(), switchTeam()
- Consumes useUIStore for sidebarCollapsed state

**Design System:**
- Linear-inspired: Flat, calm, minimal design
- Role badge: Owner (default variant), Member (secondary variant)
- Text truncation for long team names
- Border-bottom separator
- Padding: p-3, gap-2

### Project Structure Notes

**File Locations:**
```
client/src/teams/components/
  ├── TeamSwitcher.tsx           (EXISTS - verify integration)
  └── CreateTeamDialog.tsx        (May need creation - Story 1.10)
```

**Dependencies:**
- shadcn/ui: Button, DropdownMenu, Badge
- lucide-react: Icons
- Zustand stores: useTeamStore, useUIStore

### Learnings from Previous Story

**From Story 1.7 - Team Store (Frontend State) (Status: review)**

- **Team Store Available**: `client/src/teams/stores/team.store.ts` (267 lines)
  - State: currentTeam (Team), teams (TeamSummary[]), isLoading, error, currentTeamId (computed)
  - Actions: loadTeams(), switchTeam(), createTeam(), updateTeam(), deleteTeam()
  - localStorage persistence: `forge_currentTeamId`
  - **IMPORTANT**: TeamSwitcher was mentioned as existing component that was made compatible with the store

- **Store Methods for TeamSwitcher**:
  - `loadTeams()` - Fetch all teams (called in useEffect on mount)
  - `switchTeam(teamId)` - Switch to different team, updates currentTeam + localStorage
  - `currentTeamId` - Computed getter from currentTeam?.id
  - `teams` - Array of TeamSummary (id, name, slug, isOwner, isCurrent)
  - `currentTeam` - Full Team object with settings

- **Integration Pattern**:
  - Component already uses store via `useTeamStore()` hook
  - Calls `loadTeams()` in useEffect on mount
  - Calls `switchTeam(teamId)` on team selection
  - Shows loading/error states from store

[Source: stories/1-7-team-store.md#Completion-Notes-List]

### Testing Guidance

**Manual Testing:**
1. Open app → Verify TeamSwitcher renders in sidebar
2. Check current team name displays correctly
3. Check role badge shows "Owner" or "Member"
4. Click dropdown → Verify all teams listed
5. Verify current team has checkmark
6. Click different team → Verify switch works, dropdown closes
7. Refresh page → Verify team persists (localStorage)
8. Collapse sidebar → Verify shows icon-only
9. Expand sidebar → Verify shows full UI
10. Test with 0 teams → Verify error/empty state
11. Test "Create New Team" button (if dialog exists)

**Integration Tests (Phase 2 - Epic 8):**
- Mock useTeamStore methods
- Test component renders with teams
- Test team switching calls store.switchTeam()
- Test loading state
- Test error state
- Test sidebar collapsed vs expanded

### References

- [Epic 1 Definition: docs/IMPLEMENTATION-PLAN.md#EPIC 1: Team Foundation]
- [Team Store: client/src/teams/stores/team.store.ts]
- [TeamSwitcher Implementation: client/src/teams/components/TeamSwitcher.tsx]
- [shadcn/ui DropdownMenu: client/src/core/components/ui/dropdown-menu.tsx]
- [CLAUDE.md: Atomic Design + Design System]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

⚠️ **IMPORTANT DISCOVERY:** The TeamSwitcher component already exists at `client/src/teams/components/TeamSwitcher.tsx` (5362 bytes, fully implemented)! This story appears to be done. The component was made compatible with the Team Store in Story 1.7.

### Agent Model Used

claude-haiku-4-5-20251001

### Debug Log References

N/A - Bug fix only

### Completion Notes List

**Bug Fixed: Checkmarks showing on all teams instead of only current team**

**Issue:** User reported that after creating two teams, both teams showed checkmarks in the dropdown menu. Only the current team should show a checkmark.

**Root Cause:** The `isCurrent` property on TeamSummary objects in the teams array was not being updated correctly after fetching teams or switching teams. The store methods were not synchronizing the `isCurrent` flags with the actual `currentTeamId`.

**Solution (3 methods fixed in team.store.ts):**

1. **fetchTeams()** (lines 98-134):
   - Added logic to map through teams and set `isCurrent` based on `team.id === teamIdToUse`
   - Now correctly marks only the current team after initial load

2. **switchTeam()** (lines 167-196):
   - Added logic to update all teams' `isCurrent` flags after switching
   - Maps through teams array and sets `isCurrent: t.id === teamId`
   - Ensures only the newly selected team shows checkmark

3. **createTeam()** (lines 201-234):
   - Added logic to mark all existing teams as `isCurrent: false` before adding new team
   - New team added with `isCurrent: true`
   - Ensures checkmark only on newly created team

**Verification:**
- ✅ Build successful: 0 TypeScript errors
- ✅ TeamSwitcher component renders checkmark conditionally (line 127: `{team.isCurrent && <Check />}`)
- ✅ All store methods now maintain correct `isCurrent` state

**User Question Answered:**
User asked: "i dont see where i can delete or edit (is that in the next stories?)"
Answer: Yes, delete/edit functionality is in Story 1.9 (Team Settings Page).

### File List

**Modified:**
- `client/src/teams/stores/team.store.ts` (3 methods updated, 15 lines added)
  - fetchTeams(): Added isCurrent flag synchronization on team list load
  - switchTeam(): Added isCurrent flag update after team switch
  - createTeam(): Added isCurrent flag reset on existing teams before adding new

**No changes needed:**
- `client/src/teams/components/TeamSwitcher.tsx` (already correct - uses team.isCurrent conditionally)
