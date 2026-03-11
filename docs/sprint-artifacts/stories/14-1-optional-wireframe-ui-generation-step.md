# Story 14.1: Optional Wireframe/UI Generation Step

Status: drafted

## Story

As a ticket creator,
I want to choose whether wireframe/UI guidance is generated for my ticket,
so that backend-only or non-UI tickets don't get cluttered with irrelevant design specs.

## Acceptance Criteria

1. **Given** a user in the creation wizard at Stage 1 **When** they proceed to the generation options step **Then** a "Include UI/Wireframe Guidance?" toggle card is shown with smart default based on ticket type (ON for `feature`, OFF for `bug` and `task`)

2. **Given** the wireframe toggle is ON **When** the user expands the context section **Then** they see a text field ("Describe the layout, components, interactions...") and an image upload area (drag-and-drop or click) — both optional

3. **Given** the wireframe toggle is OFF **When** the spec is finalized **Then** `techSpec.visualQaExpectations` is empty/null and no wireframe guidance appears in the generated spec

4. **Given** the user uploads a mockup image **When** the image is accepted **Then** a thumbnail preview appears, and the image attachment ID is stored for passing to the LLM during spec generation

5. **Given** the user provides wireframe context text and/or image **When** the spec is finalized **Then** the LLM receives this context and produces more targeted wireframe/UI guidance

6. **Given** a user who wants to skip this step entirely **When** they click "Continue with defaults" **Then** the wizard proceeds using type-based defaults without requiring interaction

## Tasks / Subtasks

- [ ] Task 1: Add wireframe toggle state to generation wizard store (AC: 1, 6)
  - [ ] Add `includeWireframes: boolean` field to `generation-wizard.store.ts`
  - [ ] Add `wireframeContext: string` field
  - [ ] Add `wireframeImageIds: string[]` field
  - [ ] Initialize defaults based on ticket type in `setType()` action
  - [ ] Add `setIncludeWireframes()`, `setWireframeContext()`, `addWireframeImage()` actions

- [ ] Task 2: Create GenerationOptionsStep component (AC: 1, 2, 6)
  - [ ] Create `client/src/tickets/components/wizard/GenerationOptionsStep.tsx`
  - [ ] Render toggle card for wireframe with ON/OFF state
  - [ ] Progressive disclosure: show context inputs only when toggle is ON
  - [ ] Text field with placeholder text for wireframe description
  - [ ] Image upload area using existing attachment upload infrastructure
  - [ ] "Continue with defaults" skip link at bottom
  - [ ] Mobile-responsive: single column on small screens

- [ ] Task 3: Integrate image upload (AC: 4)
  - [ ] Reuse existing `onUploadAttachment` infrastructure from ticket detail
  - [ ] Show thumbnail preview after upload
  - [ ] Store attachment IDs in wizard store for later use
  - [ ] Support drag-and-drop and click-to-upload

- [ ] Task 4: Wire step into GenerationWizard flow (AC: 1, 6)
  - [ ] Add new stage between Stage 1 (Input) and Stage 3 (Draft) in `GenerationWizard.tsx`
  - [ ] Pass wireframe preferences to `confirmContextContinue()` call
  - [ ] Ensure Back button from this step returns to Stage 1

## Dev Notes

- The `GenerationWizard.tsx` manages stages as a numeric state. New step inserts as Stage 2 for Feature/Task (Stage 3 for Bug after repro steps).
- Image upload can reuse the attachment infrastructure from `ImageAttachmentsGrid` component and `ticketService.uploadAttachment()`.
- The actual LLM prompt modification is in Story 14.3 (backend). This story only handles the frontend UI and state.
- "Design" here means AI-generated wireframe guidance in the spec — NOT the Figma/Loom design references tab.

### Project Structure Notes

- New component: `client/src/tickets/components/wizard/GenerationOptionsStep.tsx`
- Modified: `client/src/tickets/components/GenerationWizard.tsx` (stage routing)
- Modified: `client/src/tickets/stores/generation-wizard.store.ts` (new state fields)

### References

- [Source: client/src/tickets/components/GenerationWizard.tsx] — Main wizard orchestrator
- [Source: client/src/tickets/stores/generation-wizard.store.ts] — Wizard state
- [Source: client/src/tickets/components/wizard/Stage1Input.tsx] — Input stage (precedes this step)
- [Source: docs/epic-14-optional-generation-steps.md] — Epic definition

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
