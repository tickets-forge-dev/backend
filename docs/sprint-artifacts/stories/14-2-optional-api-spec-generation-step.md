# Story 14.2: Optional API Spec Generation Step

Status: drafted

## Story

As a ticket creator,
I want to choose whether API endpoint specs are generated for my ticket,
so that non-API tickets (UI-only changes, config changes, docs) don't include irrelevant endpoint definitions.

## Acceptance Criteria

1. **Given** a user on the generation options step **When** the step renders **Then** an "Include API Endpoint Spec?" toggle card is shown alongside the wireframe toggle, with smart default based on ticket type (ON for `feature`, OFF for `bug` and `task`)

2. **Given** the API toggle is ON **When** the user expands the context section **Then** they see a text field ("Describe endpoints, methods, payloads...") for optional API context hints

3. **Given** the API toggle is OFF **When** the spec is finalized **Then** `techSpec.apiChanges` is empty/null and no API endpoint definitions appear in the generated spec

4. **Given** the user provides API context text **When** the spec is finalized **Then** the LLM receives this context and produces more accurate endpoint specifications

5. **Given** both toggles are OFF **When** the user proceeds **Then** the wizard skips directly to draft generation without generating wireframes or API specs

## Tasks / Subtasks

- [ ] Task 1: Add API toggle state to generation wizard store (AC: 1, 5)
  - [ ] Add `includeApiSpec: boolean` field to `generation-wizard.store.ts`
  - [ ] Add `apiContext: string` field
  - [ ] Initialize defaults based on ticket type in `setType()` action
  - [ ] Add `setIncludeApiSpec()`, `setApiContext()` actions

- [ ] Task 2: Add API toggle card to GenerationOptionsStep (AC: 1, 2)
  - [ ] Add second toggle card to `GenerationOptionsStep.tsx` (created in 14.1)
  - [ ] Side-by-side layout on desktop, stacked on mobile
  - [ ] Progressive disclosure: show API context input only when toggle is ON
  - [ ] Text field with placeholder for API description
  - [ ] No image upload for API (text-only context)

- [ ] Task 3: Wire API preferences through wizard (AC: 3, 4, 5)
  - [ ] Pass `includeApiSpec` and `apiContext` to `confirmContextContinue()`
  - [ ] Ensure the `detect-apis` call is skipped when `includeApiSpec=false`

## Dev Notes

- This story extends the `GenerationOptionsStep` component created in 14.1. The two toggle cards share the same step.
- The `detect-apis` endpoint (`POST /tickets/{aecId}/detect-apis`) should be conditionally called only when `includeApiSpec=true`.
- API context is text-only (no image upload) since API specs are described textually.
- Smart defaults: Feature → ON, Bug → OFF, Task → OFF. Same pattern as wireframes but independently controlled.

### Project Structure Notes

- Modified: `client/src/tickets/components/wizard/GenerationOptionsStep.tsx` (add API card)
- Modified: `client/src/tickets/stores/generation-wizard.store.ts` (API state fields)
- Modified: `client/src/tickets/components/GenerationWizard.tsx` (pass API prefs)

### References

- [Source: client/src/tickets/stores/generation-wizard.store.ts] — Wizard state
- [Source: client/src/tickets/components/wizard/GenerationOptionsStep.tsx] — Created in 14.1
- [Source: backend/src/tickets/presentation/controllers/tickets.controller.ts] — detect-apis endpoint
- [Source: docs/epic-14-optional-generation-steps.md] — Epic definition

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
