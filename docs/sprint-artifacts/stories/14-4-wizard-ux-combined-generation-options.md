# Story 14.4: Wizard UX — Combined Generation Options Step

Status: ready-for-dev

## Story

As a ticket creator,
I want the generation options step to be fast, clean, and not slow down my workflow,
so that optional wireframe/API controls add value without adding friction.

## Acceptance Criteria

1. **Given** a user reaches the generation options step **When** the step renders **Then** two toggle cards are shown side by side on desktop (stacked on mobile): "UI/Wireframe Guidance" and "API Endpoints"

2. **Given** the user's ticket type is `feature` **When** the step renders **Then** both toggles default to ON with a subtle indicator showing "Recommended for features"

3. **Given** the user's ticket type is `bug` or `task` **When** the step renders **Then** both toggles default to OFF with a subtle indicator showing "Usually not needed for [type]"

4. **Given** the user does not interact with the step **When** they click "Continue" or "Continue with defaults" **Then** the wizard proceeds using the type-based defaults in under 2 seconds of user time

5. **Given** the wireframe toggle is ON **When** the user clicks on the card **Then** the card expands to reveal context inputs (text field + image upload) with smooth animation

6. **Given** the API toggle is ON **When** the user clicks on the card **Then** the card expands to reveal the API context text field with smooth animation

7. **Given** a mobile screen **When** the step renders **Then** cards stack vertically, inputs are full-width, image upload area has 44px minimum tap target, and the layout has no horizontal overflow

8. **Given** the user uploads a wireframe image **When** the upload completes **Then** a thumbnail preview appears inline within the card, with a remove button

## Tasks / Subtasks

- [ ] Task 1: Design toggle card component (AC: 1, 5, 6)
  - [ ] Create `ToggleOptionCard` reusable component with: title, description, icon, toggle, expandable content slot
  - [ ] Smooth expand/collapse animation (height transition + opacity)
  - [ ] Toggle visual: ON = green accent, OFF = muted/gray
  - [ ] Card border: subtle, no heavy visual weight

- [ ] Task 2: Layout and responsive behavior (AC: 1, 7)
  - [ ] Desktop: `grid grid-cols-2 gap-4` for side-by-side cards
  - [ ] Mobile (<640px): `grid grid-cols-1 gap-3` stacked
  - [ ] All inputs full-width within card
  - [ ] Image upload area: min 44px tap target, supports drag-and-drop

- [ ] Task 3: Smart defaults with type indicators (AC: 2, 3, 4)
  - [ ] Read ticket type from wizard store
  - [ ] Set toggle defaults: feature → both ON, bug/task → both OFF
  - [ ] Show type-specific hint text below toggles: "Recommended for features" / "Usually not needed for bugs"
  - [ ] "Continue with defaults" link/button prominently placed

- [ ] Task 4: Image upload within card (AC: 8)
  - [ ] Inline drag-and-drop zone within wireframe card's expanded area
  - [ ] Show thumbnail preview (max 120px height) after upload
  - [ ] Remove button (X) on thumbnail to clear
  - [ ] Loading spinner during upload
  - [ ] Accept image types: PNG, JPG, WebP, SVG

- [ ] Task 5: Step navigation and integration (AC: 4)
  - [ ] "Continue" primary button at bottom of step
  - [ ] "Continue with defaults" secondary link (same action, different labeling for clarity)
  - [ ] "Back" button to return to Stage 1 / Stage 2
  - [ ] Ensure step is skippable in under 2 seconds — no mandatory interaction required

## Dev Notes

- The `ToggleOptionCard` component could be reusable for future optional generation steps (test plan depth, deployment notes, etc.).
- Use Tailwind `transition-all duration-200` for expand/collapse. Consider `max-height` transition or `grid-rows` animation trick.
- Image upload: reuse existing `onUploadAttachment` from ticket detail infrastructure, but render inline (not in a modal).
- This story is the polish/UX layer on top of 14.1 and 14.2's functional work. It can be developed in parallel with 14.3 (backend).
- Follow the design system: `border-[var(--border-subtle)]`, `bg-[var(--bg-subtle)]`, 8px spacing grid.

### Project Structure Notes

- New: `client/src/tickets/components/wizard/ToggleOptionCard.tsx` (reusable)
- Modified: `client/src/tickets/components/wizard/GenerationOptionsStep.tsx` (use ToggleOptionCard)
- Modified: `client/src/tickets/components/GenerationWizard.tsx` (step integration)

### References

- [Source: client/src/tickets/components/GenerationWizard.tsx] — Wizard stage management
- [Source: client/src/tickets/components/wizard/Stage1Input.tsx] — Input stage patterns
- [Source: client/app/globals.css] — Design tokens and spacing system
- [Source: docs/epic-14-optional-generation-steps.md] — Epic definition
- [Source: CLAUDE.md#4a] — Design system governance rules

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
