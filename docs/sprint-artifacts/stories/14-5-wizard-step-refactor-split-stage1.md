# Story 14.5: Wizard Step Refactor — Split Stage 1 into Separate Steps

Status: ready-for-dev

## Story

As a ticket creator,
I want the wizard steps broken into focused, single-purpose screens (Details, Codebase, References),
so that each step is less overwhelming and I can skip sections that don't apply to my ticket.

## Acceptance Criteria

1. **Given** a non-bug ticket **When** the user starts the wizard **Then** the flow is: Details → Codebase → References → Options → Generate (5 steps)

2. **Given** a bug ticket **When** the user starts the wizard **Then** the flow is: Details → Reproduce → Codebase → References → Options → Generate (6 steps)

3. **Given** the user is on the Details step **When** it renders **Then** it shows only: Type dropdown, Priority dropdown, Folder dropdown (if folders exist), and Description markdown input — no repository or file upload sections

4. **Given** the user is on the Codebase step **When** it renders **Then** it shows the repository toggle, repository selector, branch selector, and info box — matching the existing RepositoryToggle + repo/branch UI from Stage1Input

5. **Given** the user is on the References step **When** it renders **Then** it shows file attachments upload zone and design links input — matching the existing "Reference Materials" tab content from Stage1Input

6. **Given** any step **When** the user clicks Back **Then** they return to the previous step; when they click Next **Then** they advance to the next step

7. **Given** the StageIndicator **When** it renders **Then** it shows the correct number of steps (5 or 6) with labels matching the new flow, completed steps show checkmarks, current step is highlighted

8. **Given** the user has a saved snapshot from a previous session **When** they resume **Then** the wizard restores to the correct step in the new flow without data loss

9. **Given** the existing Stage1Input component **When** the refactor is complete **Then** it is decomposed into DetailsStep, CodebaseStep, and ReferencesStep — each self-contained and independently testable

## Tasks / Subtasks

- [ ] Task 1: Refactor generation-wizard.store.ts stage management (AC: 1, 2, 6, 8)
  - [ ] Replace numeric `currentStage` (1-4) with named stage enum: `details`, `reproduce`, `codebase`, `references`, `options`, `generate`
  - [ ] Add `getStageOrder()` helper that returns ordered stages based on ticket type
  - [ ] Add `nextStage()` and `prevStage()` navigation actions using the stage order
  - [ ] Update snapshot persistence to use named stages (backward-compatible: map old numeric stages to new names)
  - [ ] Update `goBackToInput()` → `goToStage('details')`, `goToReproSteps()` → `goToStage('reproduce')`, etc.

- [ ] Task 2: Create DetailsStep component (AC: 3)
  - [ ] Extract Type selector, Priority selector, Folder selector, Description input from Stage1Input
  - [ ] Create `client/src/tickets/components/wizard/DetailsStep.tsx`
  - [ ] Validation: type required, description >= 2 words
  - [ ] Footer: [Next →] button right-aligned

- [ ] Task 3: Create CodebaseStep component (AC: 4)
  - [ ] Extract RepositoryToggle, RepoSelector, BranchSelector from Stage1Input
  - [ ] Create `client/src/tickets/components/wizard/CodebaseStep.tsx`
  - [ ] Repository toggle checked by default if GitHub connected
  - [ ] When unchecked: show "You can create tickets without a repository" message
  - [ ] Footer: [← Back] left, [Next →] right

- [ ] Task 4: Create ReferencesStep component (AC: 5)
  - [ ] Extract file upload zone and design links from Stage1Input
  - [ ] Create `client/src/tickets/components/wizard/ReferencesStep.tsx`
  - [ ] "No references? Skip to next step →" subtle link
  - [ ] Footer: [← Back] left, [Next →] right

- [ ] Task 5: Update StageIndicator for new flow (AC: 7)
  - [ ] Accept stage names instead of numeric indices
  - [ ] Render correct labels: "Details", "Reproduce" (bug only), "Codebase", "References", "Options", "Generate"
  - [ ] 5 circles for non-bug, 6 circles for bug
  - [ ] Connecting lines between circles

- [ ] Task 6: Update GenerationWizard.tsx routing (AC: 1, 2, 6)
  - [ ] Replace stage number switch with named stage routing
  - [ ] Render DetailsStep, CodebaseStep, ReferencesStep, Stage2ReproSteps, GenerationOptionsStep, DraftStage based on current stage name
  - [ ] Ensure loading overlay and recovery banner still work

- [ ] Task 7: Remove or deprecate Stage1Input (AC: 9)
  - [ ] Verify all functionality is covered by new step components
  - [ ] Remove Stage1Input.tsx or mark deprecated
  - [ ] Update any imports referencing Stage1Input

- [ ] Task 8: Snapshot backward compatibility (AC: 8)
  - [ ] Migration logic: if snapshot has numeric `currentStage`, map to named stage
  - [ ] Test: old snapshot with `currentStage: 1` → restores to `details`
  - [ ] Test: old snapshot with `currentStage: 2` on bug type → restores to `reproduce`

## Dev Notes

- The current `currentStage` is numeric (1-4). Switching to a named enum prevents fragile numeric offsets when stages are added/removed.
- Stage1Input.tsx (~400 lines) contains repository selection, file uploads, type/priority/folder selectors, and description. Splitting it into 3 focused components improves maintainability.
- The `analyzeRepository()` SSE call should trigger on the Codebase step (not Details), since that's where the user commits to including a repo.
- The existing GenerationOptionsStep (Story 14.4) stays as-is — it becomes step 4 (non-bug) or step 5 (bug).
- Stage2ReproSteps (bug-only) also stays as-is — just renumbered in the flow.
- Mobile layout: all new steps should be single-column full-width, matching existing responsive behavior.

### Project Structure Notes

- New: `client/src/tickets/components/wizard/DetailsStep.tsx`
- New: `client/src/tickets/components/wizard/CodebaseStep.tsx`
- New: `client/src/tickets/components/wizard/ReferencesStep.tsx`
- Modified: `client/src/tickets/components/wizard/StageIndicator.tsx`
- Modified: `client/src/tickets/components/GenerationWizard.tsx`
- Modified: `client/src/tickets/stores/generation-wizard.store.ts`
- Deprecated: `client/src/tickets/components/wizard/Stage1Input.tsx`

### References

- [Source: client/src/tickets/components/GenerationWizard.tsx] — Main wizard orchestrator
- [Source: client/src/tickets/stores/generation-wizard.store.ts] — Wizard state
- [Source: client/src/tickets/components/wizard/Stage1Input.tsx] — Current monolithic input stage (to be split)
- [Source: client/src/tickets/components/wizard/StageIndicator.tsx] — Step progress indicator
- [Source: client/src/tickets/components/wizard/GenerationOptionsStep.tsx] — Options step (unchanged)
- [Source: docs/wireframes/wireframe-wizard-step-refactor.excalidraw] — Wireframes for new steps
- [Source: docs/epic-14-optional-generation-steps.md] — Parent epic

## Dev Agent Record

### Context Reference
- [docs/sprint-artifacts/stories/14-5-wizard-step-refactor-split-stage1.context.xml](docs/sprint-artifacts/stories/14-5-wizard-step-refactor-split-stage1.context.xml)

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
