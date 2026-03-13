# Epic 13: Mobile Support & Ticket UI Simplification

**Priority:** P1
**Goal:** Make the ticket experience fully functional on mobile devices and radically simplify the ticket UI to be intuitive and impossible to get lost in.

---

## Context

The ticket feed uses a hardcoded `70vw` centered layout and a 7-column CSS grid that doesn't adapt to screen size. On mobile, ticket titles are invisible, columns overlap, and the UI is unusable. This epic fixes mobile support end-to-end and simplifies the ticket UI across all screen sizes.

---

## Stories

### Story 13.1: Mobile-First Ticket Feed Layout

**Goal:** Remove the hardcoded `70vw` width constraint and make the feed responsive across all screen sizes.

**Acceptance Criteria:**
- Feed uses `w-full max-w-5xl mx-auto` with light padding (`px-3` mobile, `px-6` desktop)
- Grid columns adapt by breakpoint:
  - Mobile (<640px): Title + Score + Actions (3 columns)
  - sm (640px+): Add Status + Priority (5 columns)
  - md (768px+): Add Assignee + Updated (7 columns)
- Ticket titles always visible and readable on mobile
- Search bar, sort, and filter controls stack properly on small screens
- No horizontal overflow or scroll on any screen size
- Action menus (three-dot) always visible on mobile (no hover requirement)

**Status:** Done (implemented in this epic's initial commit)

---

### Story 13.2: Simplified Ticket Card Design

**Goal:** Redesign the ticket card for clarity — surface only essentials on first glance.

**Acceptance Criteria:**
- Ticket row shows: type icon, title (truncated), score ring, actions menu
- Status and priority visible at sm+ breakpoints only
- Secondary info (technical notes, acceptance criteria) only on detail page
- Clear visual hierarchy: title is the dominant element
- Reduce visual noise — fewer badges, simpler layout

---

### Story 13.3: Touch-Friendly Interactions

**Goal:** Ensure all interactive elements work well on touch devices.

**Acceptance Criteria:**
- All tap targets minimum 44px (Apple HIG guideline)
- Context menus (three-dot, folder actions) always visible on mobile — no hover gate
- Swipe-to-move-to-folder gesture on ticket cards (stretch goal)
- Drag handles hidden on mobile (use context menu "Move to..." instead)
- Folder expand/collapse has generous tap target

---

### Story 13.4: Mobile Ticket Creation Flow

**Goal:** Simplify the creation wizard for mobile — single-column, large inputs, clear steps.

**Acceptance Criteria:**
- Single-column layout on mobile for all creation wizard steps
- Larger input fields and buttons (min 44px touch targets)
- Clear step indicator showing progress through creation flow
- Default to "New Ticket" mode — type selection (feature/bug/task) as first step
- Import mode accessible but not competing with primary flow
- Form doesn't overflow or require horizontal scroll

---

### Story 13.5: Mobile Ticket Detail View

**Goal:** Make the ticket detail page usable on mobile screens.

**Acceptance Criteria:**
- Tab bar scrollable horizontally on mobile (Overview, Spec, Implementation, Design)
- Content sections stack vertically in single column
- Review Q&A panel readable and scrollable
- Action buttons (Approve, Re-bake) thumb-reachable — bottom of screen or sticky footer
- Assignee selector works on mobile
- No horizontal overflow on any tab

---

### Story 13.6: Responsive Navigation Polish

**Goal:** Improve mobile navigation UX for the sidebar and page transitions.

**Acceptance Criteria:**
- Sidebar auto-closes on navigation (selecting a page)
- Active page indicator always visible in mobile header
- Swipe-from-left-edge to open sidebar (stretch goal)
- Mobile header shows current page name for orientation
- Back navigation works intuitively from detail pages

---

## Dependencies

- Existing sidebar infrastructure (CLAUDE.md protected components)
- Existing ticket CRUD and feed UI (Epic 7, Epic 12)

---

## Future (Not in this Epic)

- Bottom tab navigation (native app pattern)
- PWA offline support
- Pull-to-refresh
- Native mobile app
