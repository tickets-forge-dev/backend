# Story 3.5.4: Repository Checkbox Messaging

**Epic:** Epic 3.5 - Non-Technical PM Support **Priority:** P1 HIGH **Effort:** 1 day **Status:** drafted

## Story

As a **Product Manager creating a ticket**,
I want **clear, contextual messaging throughout the ticket creation flow and ticket detail view about the impact of not using a repository**,
so that **I and my team understand what the resulting spec contains and what developers need to determine themselves**.

## Acceptance Criteria

1. **Tooltip on repository checkbox (from Story 3-5-1)**
   - Tooltip text (final copy): "Repository analysis enables AI to suggest specific files and APIs to modify. Without it, you'll get a high-level spec that developers can determine implementation details for."
   - Tooltip positioned: right of checkbox label
   - Uses existing Tooltip component from `@/core/components/ui/`
   - Icon: `InfoCircle` or similar (16px, muted color)

2. **Dismissible warning banner when repository unchecked**
   - Banner appears below `RepositoryToggle` when `includeRepository = false`
   - Copy: "This ticket will not include code-aware suggestions. Developers will need to determine implementation details."
   - Dismissible: close button (×) hides banner
   - Dismissed state persisted in `sessionStorage` (key: `forge_repo_banner_dismissed`)
   - Banner NOT shown again in same session after dismissal
   - Banner re-appears in a new session
   - Styling: amber/warning tone, consistent with design system (no harsh borders)

3. **Ticket detail: "No code analysis" indicator**
   - On ticket detail page: if ticket was created without repository, show indicator in overview card
   - Indicator: small badge or text — "No code analysis" with muted styling
   - Placed in the metadata row (alongside type, priority, status)
   - Only shown when `ticket.repositoryOwner` is null/absent

4. **Spec sections: placeholder copy for code-missing sections**
   - In ticket detail, if no repository context:
     - File Changes section: show "No repository provided — developer should identify files to modify"
     - API Changes section: show "No repository provided — developer should identify API changes"
     - Layer breakdown section: show "No repository provided"
   - Placeholder text styled with muted color (`text-[var(--text-secondary)]`)
   - Placeholder does NOT appear if sections contain actual data

5. **Tooltip and banner copy is final** — matches the approved copy above exactly, no placeholder text in production

6. **0 TypeScript errors**

## Tasks / Subtasks

- [ ] **Finalize tooltip implementation on `RepositoryToggle`** (AC: #1)
  - [ ] Import `Tooltip`, `TooltipContent`, `TooltipTrigger` from `@/core/components/ui/tooltip`
  - [ ] Wrap info icon next to checkbox label in tooltip
  - [ ] Set tooltip content to approved copy
  - [ ] File: `client/src/tickets/components/RepositoryToggle.tsx` (from Story 3-5-1)

- [ ] **Build dismissible warning banner** (AC: #2)
  - [ ] Create inline banner component (or inline JSX in `RepositoryToggle`)
  - [ ] Condition: show when `includeRepository === false && !isDismissed`
  - [ ] `isDismissed` state: read from `sessionStorage.getItem('forge_repo_banner_dismissed')`
  - [ ] On dismiss: `sessionStorage.setItem('forge_repo_banner_dismissed', 'true')` + hide banner
  - [ ] Styling: `bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400`

- [ ] **Add "No code analysis" badge to ticket detail** (AC: #3)
  - [ ] In `OverviewCard.tsx` (or ticket detail metadata row): check `!ticket.repositoryOwner`
  - [ ] Render badge: `<span className="text-xs text-[var(--text-secondary)]">No code analysis</span>`
  - [ ] File: `client/src/tickets/components/detail/OverviewCard.tsx`

- [ ] **Add placeholder text to empty code sections** (AC: #4)
  - [ ] In `ImplementationTab.tsx`: check if `fileChanges`, `apiChanges`, `layeredFileChanges` are empty AND `!ticket.repositoryOwner`
  - [ ] Render placeholder text instead of empty state
  - [ ] File: `client/src/tickets/components/detail/ImplementationTab.tsx`

- [ ] **Verify and test** (AC: #5, #6)
  - [ ] Tooltip appears on hover with correct copy
  - [ ] Banner appears when unchecked, hides on dismiss, stays hidden in session
  - [ ] Ticket detail badge appears for no-repo tickets
  - [ ] Placeholder text appears in empty code sections
  - [ ] No regressions for tickets WITH repository
  - [ ] 0 TypeScript errors

## Dev Notes

### Context from Story 3-5-1

Story 3-5-1 created the `RepositoryToggle.tsx` component and `includeRepository` store flag. This story (3-5-4) polishes the messaging within and around that toggle, and extends messaging to the ticket detail view.

**Key store flag:** `generation-wizard.store.ts` — `includeRepository: boolean`
**Key component:** `client/src/tickets/components/RepositoryToggle.tsx`

### Design System — Existing Tooltip Component

```tsx
// Pattern from existing codebase
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/core/components/ui/tooltip';

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <InfoIcon className="h-4 w-4 text-[var(--text-secondary)]" />
    </TooltipTrigger>
    <TooltipContent>
      <p>Repository analysis enables AI to suggest specific files...</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

[Source: client/src/core/components/ui/]

### Warning Banner Design

```
┌──────────────────────────────────────────────────────┐
│ ⚠  This ticket will not include code-aware           │
│    suggestions. Developers will need to determine    │
│    implementation details.                      [×]  │
└──────────────────────────────────────────────────────┘
```

- Uses amber tones (warning, not error)
- Subtle background — not alarming
- Consistent with Linear-inspired design (calm)

### Ticket Detail — Affected Files

- `OverviewCard.tsx` — Add "No code analysis" badge to metadata row
- `ImplementationTab.tsx` — Add placeholder text to empty code sections

These files already exist from Session 10 (Tabbed Ticket Detail Page).
[Source: MEMORY.md#Session-10]

### Project Structure Notes

- No new files required — all changes are additions to existing components
- Banner logic can live inline in `RepositoryToggle.tsx` (no separate component needed for MVP)
- `sessionStorage` chosen over `localStorage` for banner dismiss: user should be re-informed each new session

### References

- [Story 3-5-1: Repository Optional Flag](docs/sprint-artifacts/stories/3-5-1-repository-optional-flag.md)
- [Session 10 Memory: Tabbed Ticket Detail Page](~/.claude/projects/-Users-Idana-Documents-GitHub-forge/memory/MEMORY.md#Session-10)
- [Component: OverviewCard](client/src/tickets/components/detail/OverviewCard.tsx)
- [Component: ImplementationTab](client/src/tickets/components/detail/ImplementationTab.tsx)
- [UI: Tooltip](client/src/core/components/ui/tooltip.tsx)

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
