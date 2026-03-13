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

**Story context generated: 2026-03-10**

#### Architecture Context

This story is a **presentation-layer-only** change. All modifications live in `client/` — no backend, domain, or infrastructure changes required. The story builds the UX shell for Epic 14's optional generation toggles; stories 14.1/14.2 handle the functional state wiring, and 14.3 handles backend conditional generation.

**Layer:** Presentation (UI components + wizard step integration)

#### Codebase Analysis

**Wizard Stage Flow (current):**
- Stage 1: `Stage1Input.tsx` — title, type, priority, folder, repo, branch, file uploads
- Stage 2: `Stage2ReproSteps.tsx` — bug-only reproduction steps
- Stage 3: `Stage3Draft.tsx` — draft review, Q&A, spec finalization

The new "Generation Options" step needs to be inserted between Stage 1 (or Stage 2 for bugs) and Stage 3. The `GenerationWizard.tsx` container renders stages via `currentStage` number (`{currentStage === 1 && <Stage1Input />}` pattern). The `StageIndicator.tsx` component maps stage numbers to display labels, with separate maps for bug vs non-bug flows.

**Key integration points:**
1. `GenerationWizard.tsx` (line 222-228): Stage rendering switch — add new stage for generation options
2. `StageIndicator.tsx` (line 20-34): Stage map and label arrays — add "Options" step
3. `generation-wizard.store.ts` (line 147-206): `WizardState` interface — will need `includeWireframes`, `includeApiSpec`, `wireframeContext`, `apiContext` fields (from 14.1/14.2, but this story should read them)
4. `GenerationWizard.tsx` (line 124-181): `getNextButton()` — add navigation for the new stage

**Wizard Store State (relevant fields):**
- `type: string` — ticket type ('feature' | 'bug' | 'task'), used for smart defaults
- `currentStage: number` — controls which stage renders
- `pendingFiles: File[]` — existing file upload infrastructure
- `includeRepository: boolean` — pattern for toggle flags
- `WizardActions` interface at line 220+ defines all store actions

**Design System Tokens (from globals.css):**
- Borders: `border-[var(--border-subtle)]` (rgba(255,255,255,0.06) dark / rgba(0,0,0,0.08) light)
- Backgrounds: `bg-[var(--bg-subtle)]` (#18181b dark / #fafafa light), `bg-[var(--bg-hover)]`
- Text: `text-[var(--text)]`, `text-[var(--text-secondary)]`, `text-[var(--text-tertiary)]`
- Spacing: 8px grid system (`--space-2: 8px` base unit)
- Radius: `--radius-md: 8px` for cards, `--radius: 6px` standard
- Green semantic: `--green: #10b981` (for ON state accent)
- Animations: `transition-all duration-200` pattern used throughout

**Existing Component Patterns to Follow:**
- `WizardFileUpload.tsx`: Drag-and-drop zone with preview, file validation, remove button — reuse for image upload within wireframe card
- `Stage1Input.tsx`: Form layout patterns — `space-y-5` container, `space-y-1.5` label groups, `text-xs font-medium uppercase tracking-wide` labels
- `RepositoryToggle` component: Toggle on/off pattern already used in Stage 1

**Responsive Breakpoints:**
- Mobile default: single column
- `sm` (640px+): multi-column layouts begin
- Desktop grid pattern: `grid grid-cols-2 gap-4` (used in Stage1Input for type/priority)

#### File Manifest

**New files:**
- `client/src/tickets/components/wizard/ToggleOptionCard.tsx` — Reusable toggle card with: title, description, icon prop, toggle switch, expandable content slot via `children`, smooth height animation (CSS `grid-rows` trick or `max-height`), ON=green accent / OFF=muted border

**Modified files:**
- `client/src/tickets/components/wizard/GenerationOptionsStep.tsx` — New step component composing two `ToggleOptionCard` instances in a responsive grid, reading `type` from wizard store for smart defaults, "Continue with defaults" link
- `client/src/tickets/components/GenerationWizard.tsx` — Add stage rendering for generation options step, update `getNextButton()` for new stage navigation (Back/Continue/Continue with defaults)
- `client/src/tickets/components/wizard/StageIndicator.tsx` — Add "Options" step to stage maps (both bug and non-bug flows)
- `client/src/tickets/stores/generation-wizard.store.ts` — Add `includeWireframes`, `includeApiSpec`, `wireframeContext`, `apiContext`, `wireframeImage` state fields and corresponding actions (setIncludeWireframes, setIncludeApiSpec, etc.)

**Reference files (read-only):**
- `client/src/tickets/components/wizard/WizardFileUpload.tsx` — Pattern for drag-and-drop + preview
- `client/src/tickets/components/wizard/Stage1Input.tsx` — Layout and form patterns
- `client/app/globals.css` — Design tokens

#### Implementation Guidance

1. **ToggleOptionCard component:** Accept props `{ title, description, icon, enabled, onToggle, hint?, children }`. Render a card with `border border-[var(--border-subtle)]` and `rounded-lg`. Toggle switch in top-right. When `enabled=true`, show green left border accent (`border-l-2 border-l-[var(--green)]`), expand children with CSS `grid-template-rows: 0fr → 1fr` transition. When `enabled=false`, collapse children, muted styling.

2. **GenerationOptionsStep:** Read `type` from `useWizardStore()`. Compute defaults: `feature` → both ON, `bug`/`task` → both OFF. Show hint text below cards. Desktop: `grid grid-cols-1 sm:grid-cols-2 gap-4`. Wireframe card children: text area + image upload zone (reuse WizardFileUpload pattern but image-only). API card children: text area only.

3. **Wizard integration:** The generation options step should be a new stage number. Current flow: Stage 1 → Stage 2 (bug only) → Stage 3. New flow: Stage 1 → Stage 1.5/2 (bug repro) → Stage 2/3 (generation options) → Stage 3/4 (draft). Simplest approach: insert as a new stage number and update the stage maps in StageIndicator.

4. **Image upload in wireframe card:** Restrict accepted types to `image/png, image/jpeg, image/webp, image/svg+xml`. Show thumbnail preview at max 120px height using `URL.createObjectURL()`. Add X button overlay on thumbnail. Min 44px tap target for the drop zone.

5. **"Continue with defaults" UX:** Place as a secondary text link below the Continue button: `text-xs text-[var(--text-secondary)] underline`. Both Continue and "Continue with defaults" do the same action — proceed to next stage with current toggle values.

### Agent Model Used
claude-opus-4-6

### Debug Log References

### Completion Notes List
- Story context generated from source file analysis on 2026-03-10
- All referenced source files verified to exist (except GenerationOptionsStep.tsx which is new)
- Design system tokens documented from globals.css
- Wizard store state shape and action patterns documented
- Responsive breakpoints and component patterns cataloged

### File List
- client/src/tickets/components/wizard/ToggleOptionCard.tsx (new)
- client/src/tickets/components/wizard/GenerationOptionsStep.tsx (new/modified)
- client/src/tickets/components/GenerationWizard.tsx (modified)
- client/src/tickets/components/wizard/StageIndicator.tsx (modified)
- client/src/tickets/stores/generation-wizard.store.ts (modified)
- client/src/tickets/components/wizard/WizardFileUpload.tsx (reference)
- client/src/tickets/components/wizard/Stage1Input.tsx (reference)
- client/app/globals.css (reference)
