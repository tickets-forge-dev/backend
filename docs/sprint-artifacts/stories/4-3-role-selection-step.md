# Story 4.3: Role Selection Step

**Epic:** Epic 4 - Enhanced Onboarding
**Priority:** P0 CRITICAL
**Effort:** 2 days
**Status:** review

## Story

As a **new user who just created a team**,
I want **to select my role on the team**,
so that **the system can customize my experience and permissions accordingly**.

## Acceptance Criteria

1. **Screen displays "What's your role?" heading** with descriptive copy
2. **Four role cards displayed**: Admin, Developer, PM, QA
3. **Each card has**:
   - Role icon
   - Role name
   - Brief description of what this role does
   - Selectable (radio-style, only one selected at a time)
4. **Submit button** enabled only when a role is selected
5. **On submit**:
   - Call onboarding store's `selectRole()` method
   - State transitions from `team_created` → `role_selected` or `github_setup`
6. **Conditional routing after submit**:
   - Developer → Navigate to GitHub setup page
   - Admin/PM/QA → Skip GitHub, onboarding complete, redirect to /tickets
7. **Loading state** during submission
8. **Error handling** for API failures
9. **0 TypeScript errors**

## Tasks / Subtasks

- [x] **Create RoleSelectionStep component** (AC: #1, #2, #3, #7, #9)
  - [x] Add heading "What's your role?" with subtitle
  - [x] Create RoleCard sub-component (icon, name, description, selected state)
  - [x] Render 4 role cards (Admin, Developer, PM, QA)
  - [x] Implement radio-style selection (one at a time)
  - [x] Add loading state UI

- [x] **Wire to onboarding store** (AC: #4, #5, #6)
  - [x] Import `useOnboardingStore`
  - [x] Call `selectRole(role)` on submit
  - [x] Handle state transition
  - [x] Implement conditional navigation based on role

- [x] **Role definitions** (AC: #3)
  - [x] Admin: "Team owner with full permissions"
  - [x] Developer: "Build and execute tickets via CLI"
  - [x] PM: "Create tickets, approve specs, answer questions"
  - [x] QA: "Test features and verify quality"

- [x] **Error handling** (AC: #8)
  - [x] Handle API errors gracefully
  - [x] Show error message if submission fails
  - [x] Allow retry

- [x] **Add route configuration** (AC: #6)
  - [x] Create `/onboarding/role-selection` route
  - [x] Create `/onboarding/github-setup` route (placeholder)
  - [x] Implement navigation logic

- [x] **Testing** (AC: #9)
  - [x] Verify role selection works
  - [x] Verify conditional routing (Developer vs non-Developer)
  - [x] Verify 0 TypeScript errors

## Dev Notes

### Dependencies

- Story 4-1: Onboarding store with `selectRole()` method
- Story 4-2: User comes from team name step

### Role Routing Logic

```typescript
// From onboarding.store.ts
selectRole: (role) => {
  const nextState = role === 'developer' ? 'github_setup' : 'complete';
  // ...
}
```

- **Developer** → `github_setup` state → Navigate to `/onboarding/github-setup`
- **Admin/PM/QA** → `complete` state → Navigate to `/tickets`

### Design Notes

- Cards should be large, clickable, with clear visual selection
- Use icons for each role (optional, can use emoji as fallback)
- Minimal, clean design (Linear-inspired)
- Mobile-responsive (stack cards on small screens)

### Files to Create

```
client/src/onboarding/components/
  └── RoleSelectionStep.tsx

client/app/(auth)/onboarding/role-selection/
  └── page.tsx

client/app/(auth)/onboarding/github-setup/
  └── page.tsx (placeholder)
```

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

No debug logs - implementation was straightforward

### Completion Notes List

✅ **Implemented role selection step with card-based UI**

**Files Created:**
1. `client/src/onboarding/components/RoleSelectionStep.tsx` - Role selection component with card UI
2. `client/app/(auth)/onboarding/role-selection/page.tsx` - Next.js route
3. `client/app/(auth)/onboarding/github-setup/page.tsx` - GitHub setup placeholder (auto-completes for now)

**Component Implementation:**
- Four role cards: Admin (👑), Developer (💻), PM (📋), QA (🧪)
- Each card shows icon, name, and description
- Radio-style selection (only one selected at a time)
- Visual selection indicator (checkmark in corner)
- Hover states and disabled states during submission
- Responsive grid (2 columns on desktop, stack on mobile)

**Role Routing Logic:**
- Developer → Navigates to `/onboarding/github-setup`
- Admin/PM/QA → Skip GitHub, navigate to `/tickets` (complete)
- Uses onboarding store's `selectRole()` method
- State transitions handled by store (team_created → role_selected or github_setup)

**GitHub Setup Placeholder:**
- Created placeholder page that auto-completes
- Calls `setupGitHub()` method
- Redirects to /tickets after 1 second
- TODO: Implement actual GitHub OAuth in future story

**Key Design Decisions:**
- Card-based UI instead of simple radio buttons (better UX)
- Emoji icons for visual appeal (no icon library needed)
- Inline role descriptions (helps users choose correctly)
- Auto-complete GitHub setup (deferred to future work)
- Clean, minimal design matching onboarding flow

**Build Status:**
- ✅ 0 TypeScript errors
- ✅ Routes created: `/onboarding/role-selection` (3.71 kB), `/onboarding/github-setup` (2.58 kB)
- ✅ All 9 acceptance criteria met

### File List

- NEW: `client/src/onboarding/components/RoleSelectionStep.tsx`
- NEW: `client/app/(auth)/onboarding/role-selection/page.tsx`
- NEW: `client/app/(auth)/onboarding/github-setup/page.tsx`
