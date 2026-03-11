# Epic 14: Optional Wireframe & API Generation in Ticket Creation

**Priority:** P1
**Goal:** Give users control over what gets auto-generated during ticket creation. Not every ticket needs wireframes or API specs — forcing them adds noise and reduces spec quality. Make both optional with context input for better results.

---

## Context

The ticket creation wizard currently auto-generates everything in the tech spec: wireframes/UI design guidance, API endpoint specs, file changes, test plans, and acceptance criteria. For many tickets (backend refactors, config changes, documentation, simple bug fixes), wireframes and API specs are irrelevant noise. This epic adds explicit opt-in steps so the LLM focuses on what matters.

**Important:** "Design" in this epic means **AI-generated wireframe/UI guidance in the tech spec** — NOT the Figma/Loom design reference integration (that's a separate feature in the Design tab).

---

## Stories

### Story 14.1: Optional Wireframe/UI Generation Step

**Goal:** Add an optional step in the creation wizard that lets users opt-in to wireframe/UI design generation with context input.

**Acceptance Criteria:**
- New step in wizard between input (Stage 1) and draft (Stage 3): "Include UI/Wireframe Guidance?"
- Toggle: Yes/No (default: No for `task` and `bug` types, Yes for `feature` type)
- When Yes is selected, show optional context input:
  - Text field: describe the UI you envision (placeholder: "Describe the layout, components, interactions...")
  - Image upload: drag-and-drop or click to upload a mockup/sketch (uses existing attachment infrastructure)
  - Either or both are accepted — both are optional context hints
- When No is selected, the LLM prompt for spec generation explicitly excludes wireframe/UI sections
- Context input (text/image) is passed to the LLM as additional design context during spec finalization
- The `techSpec` output conditionally includes or omits `visualQaExpectations` and wireframe guidance based on this toggle
- Step is skippable — user can proceed without making a choice (defaults to type-based default)

---

### Story 14.2: Optional API Spec Generation Step

**Goal:** Add an optional step that lets users opt-in to API endpoint generation with context input.

**Acceptance Criteria:**
- New step in wizard (can be combined with 14.1 as a single "Generation Options" step or separate): "Include API Endpoint Spec?"
- Toggle: Yes/No (default: No for `bug` type, Yes for `feature` and `task` types)
- When Yes is selected, show optional context input:
  - Text field: describe the API you need (placeholder: "Describe endpoints, methods, payloads...")
  - Can reference existing API patterns or external API docs
- When No is selected, the LLM prompt for spec generation explicitly excludes `apiChanges` section
- Context input is passed as additional API context during spec finalization
- The `techSpec` output conditionally includes or omits `apiChanges.endpoints` based on this toggle
- Step is skippable — defaults to type-based default

---

### Story 14.3: Backend — Conditional Spec Generation

**Goal:** Modify the spec generation pipeline to conditionally include/exclude wireframe and API sections based on user preferences.

**Acceptance Criteria:**
- `CreateTicketDto` extended with: `includeWireframes: boolean`, `includeApiSpec: boolean`
- `wireframeContext?: string` and `apiContext?: string` fields for user-provided hints
- `wireframeImageAttachmentIds?: string[]` for uploaded reference images
- `FinalizeSpecUseCase` / `TechSpecGenerator` LLM prompts modified:
  - When `includeWireframes=false`: prompt explicitly instructs "Do NOT generate UI wireframes, visual QA expectations, or layout guidance"
  - When `includeApiSpec=false`: prompt explicitly instructs "Do NOT generate API endpoint specifications"
  - When context is provided: inject user context into relevant prompt sections
- Quality score calculation adjusted — don't penalize tickets that intentionally skip wireframes/API
- Existing tickets (pre-migration) continue to work as before (both default to true for backward compatibility)

---

### Story 14.4: Wizard UX — Combined Generation Options Step

**Goal:** Design the combined "Generation Options" step as a clean, minimal UI that doesn't slow down the wizard for users who want defaults.

**Acceptance Criteria:**
- Single step with two toggle cards side by side (or stacked on mobile):
  - Card 1: "UI/Wireframe Guidance" with toggle, expandable context input
  - Card 2: "API Endpoints" with toggle, expandable context input
- Smart defaults based on ticket type:
  - Feature: both ON by default
  - Bug: both OFF by default
  - Task: wireframes OFF, API OFF by default
- "Continue with defaults" skip link — lets power users bypass this step entirely
- Context inputs only appear when toggle is ON (progressive disclosure)
- Image upload area supports drag-and-drop, shows preview thumbnail
- Step fits mobile layout (single column, stacked cards)
- Total time added to wizard: <5 seconds for users who accept defaults

---

## Dependencies

- Existing ticket creation wizard (Epic 7)
- Existing attachment upload infrastructure
- Existing LLM tech spec generation pipeline

## Implementation Notes

- The wizard store (`generation-wizard.store.ts`) needs new state fields for the toggles and context
- The backend `CreateTicketDto` and `FinalizeSpecUseCase` need conditional prompt logic
- LLM prompt engineering is critical — explicitly excluding sections produces better focused specs than generating everything and hiding unwanted parts

---

## Future (Not in this Epic)

- Per-team default preferences (always skip wireframes for backend teams)
- AI auto-detection: analyze title/description to suggest whether wireframes/API are needed
- Additional optional sections: test plan depth, deployment notes, migration scripts
