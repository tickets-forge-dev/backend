# Story 14.3: Backend — Conditional Spec Generation

Status: ready-for-dev

## Story

As a system,
I want the spec generation pipeline to conditionally include or exclude wireframe and API sections based on user preferences,
so that generated specs are focused and relevant to what the ticket actually needs.

## Acceptance Criteria

1. **Given** `CreateTicketDto` receives `includeWireframes=false` **When** the spec is finalized **Then** the LLM prompt explicitly instructs "Do NOT generate UI wireframes, visual QA expectations, or layout guidance" and `techSpec.visualQaExpectations` is null/empty

2. **Given** `CreateTicketDto` receives `includeApiSpec=false` **When** the spec is finalized **Then** the LLM prompt explicitly instructs "Do NOT generate API endpoint specifications" and `techSpec.apiChanges` is null/empty

3. **Given** `wireframeContext` is provided in the DTO **When** the spec is finalized **Then** the wireframe context text is injected into the LLM prompt as additional design context

4. **Given** `wireframeImageAttachmentIds` are provided **When** the spec is finalized **Then** the image attachments are included in the LLM context (as base64 or URL references depending on model capability)

5. **Given** `apiContext` is provided in the DTO **When** the spec is finalized **Then** the API context text is injected into the LLM prompt as additional API design context

6. **Given** `includeWireframes=false` and `includeApiSpec=false` **When** the quality score is computed **Then** the score does NOT penalize for missing wireframe or API sections (adjusted rubric)

7. **Given** an existing ticket created before this feature **When** it is loaded **Then** it defaults to `includeWireframes=true` and `includeApiSpec=true` for backward compatibility

## Tasks / Subtasks

- [ ] Task 1: Extend CreateTicketDto (AC: 1, 2, 3, 4, 5, 7)
  - [ ] Add `includeWireframes?: boolean` (default: true for backward compat)
  - [ ] Add `includeApiSpec?: boolean` (default: true)
  - [ ] Add `wireframeContext?: string`
  - [ ] Add `wireframeImageAttachmentIds?: string[]`
  - [ ] Add `apiContext?: string`
  - [ ] Add class-validator decorators: `@IsOptional()`, `@IsBoolean()`, `@IsString()`, `@IsArray()`

- [ ] Task 2: Extend AEC domain entity (AC: 1, 2, 7)
  - [ ] Add `_includeWireframes: boolean` and `_includeApiSpec: boolean` to AEC entity
  - [ ] Wire through constructor, `createDraft()`, and `reconstitute()` factory methods
  - [ ] Default to `true` in `reconstitute()` when fields are missing (backward compat)

- [ ] Task 3: Update AECMapper (AC: 7)
  - [ ] Add `includeWireframes` and `includeApiSpec` to AECDocument interface
  - [ ] Map in `toDomain()` and `toFirestore()`

- [ ] Task 4: Modify TechSpecGenerator LLM prompts (AC: 1, 2, 3, 4, 5)
  - [ ] In `generateQuestionsWithContext()`: skip wireframe/API-related questions when disabled
  - [ ] In spec finalization prompt: add conditional exclusion instructions
  - [ ] When `includeWireframes=true` + wireframeContext provided: inject context into design section of prompt
  - [ ] When `includeApiSpec=true` + apiContext provided: inject context into API section of prompt
  - [ ] Handle wireframe image attachments: load from storage, include as image context in LLM call

- [ ] Task 5: Adjust quality score calculation (AC: 6)
  - [ ] Modify quality score rubric to skip wireframe/API criteria when those sections are disabled
  - [ ] Ensure score reflects completeness of what was requested, not of all possible sections

- [ ] Task 6: Pass preferences through CreateTicketUseCase (AC: 1, 2)
  - [ ] Thread `includeWireframes` and `includeApiSpec` from DTO through use case to AEC creation
  - [ ] Store wireframeContext and apiContext on AEC for use during finalization

## Dev Notes

- **Clean Architecture compliance**: The DTO changes are in presentation layer, AEC changes in domain, mapper in infrastructure. No boundary crossings.
- The LLM prompt is the critical piece. Explicitly excluding sections produces better specs than generating everything and filtering. The prompt should say something like: "This ticket does NOT require API endpoint specifications. Focus on [file changes, test plan, acceptance criteria] only."
- For wireframe images: if the LLM model supports vision (Claude does), pass images directly. Otherwise, describe them textually.
- Quality score adjustment: current rubric likely has weights for API completeness and design coverage. When disabled, redistribute those weights to remaining sections.

### Project Structure Notes

- Modified: `backend/src/tickets/presentation/dtos/CreateTicketDto.ts`
- Modified: `backend/src/tickets/domain/aec/AEC.ts`
- Modified: `backend/src/tickets/infrastructure/persistence/mappers/AECMapper.ts`
- Modified: `backend/src/tickets/domain/tech-spec/TechSpecGenerator.ts`
- Modified: `backend/src/tickets/application/use-cases/CreateTicketUseCase.ts`
- Modified: `backend/src/tickets/application/use-cases/FinalizeSpecUseCase.ts`

### References

- [Source: backend/src/tickets/presentation/dtos/CreateTicketDto.ts] — Ticket creation DTO
- [Source: backend/src/tickets/domain/aec/AEC.ts] — AEC domain entity
- [Source: backend/src/tickets/infrastructure/persistence/mappers/AECMapper.ts] — Firestore mapper
- [Source: backend/src/tickets/domain/tech-spec/TechSpecGenerator.ts] — LLM prompt construction
- [Source: backend/src/tickets/application/use-cases/FinalizeSpecUseCase.ts] — Spec finalization
- [Source: docs/epic-14-optional-generation-steps.md] — Epic definition

## Dev Agent Record

### Context Reference
- docs/sprint-artifacts/stories/14-3-backend-conditional-spec-generation.context.xml

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
