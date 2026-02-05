# Story 9.6: Cleanup - Complete Legacy System Removal

Status: ready-for-dev

## Story

As a maintainer,
I want to remove ALL legacy ticket generation code that will be replaced by BMAD tech-spec integration,
so that the codebase has no dead code, reduced maintenance burden, and a clean foundation for Epic 9 implementation.

## Acceptance Criteria

1. **AC-1: Indexing Module Deleted** - The entire `backend/src/indexing/` directory (19 files) is deleted, including module registration in AppModule and TicketsModule.

2. **AC-2: GenerationOrchestrator Deleted** - `backend/src/tickets/application/services/GenerationOrchestrator.ts` (419 lines) is deleted and removed from TicketsModule providers.

3. **AC-3: MastraContentGenerator Deleted** - `backend/src/shared/infrastructure/mastra/MastraContentGenerator.ts` (259 lines) is deleted along with its port interface `backend/src/shared/application/ports/ILLMContentGenerator.ts` (68 lines).

4. **AC-4: Frontend Generation Components Deleted** - The following client components are deleted:
   - `client/src/tickets/components/GenerationProgress.tsx` (298 lines)
   - `client/src/tickets/components/GenerationProgress.test.tsx` (313 lines)
   - `client/src/tickets/components/FindingsSection.tsx` (198 lines)

5. **AC-5: Module Imports Updated** - All NestJS module files that import deleted code are updated:
   - `backend/src/app.module.ts` - Remove `IndexingModule` import
   - `backend/src/tickets/tickets.module.ts` - Remove `IndexingModule` import and `GenerationOrchestrator` provider

6. **AC-6: No Orphaned References** - No file in the codebase imports, references, or depends on any deleted file. TypeScript compiles with zero errors.

7. **AC-7: Validators Preserved** - All 7 validators in `backend/src/tickets/infrastructure/services/validators/` are kept intact (they will be repurposed for BMAD post-generation validation).

8. **AC-8: Integration Tests Updated** - `backend/src/__tests__/integration/validation-system.integration.spec.ts` is updated to remove references to deleted services, or deleted if entirely dependent on them.

## Tasks / Subtasks

### Phase 1: Backend Indexing Module Removal

- [ ] Task 1: Delete entire `backend/src/indexing/` directory (AC: #1)
  - [ ] 1.1: Delete `application/services/index-query.service.ts`
  - [ ] 1.2: Delete `application/services/repo-indexer.service.ts`
  - [ ] 1.3: Delete `application/services/file-parser.service.ts`
  - [ ] 1.4: Delete `application/services/api-spec-indexer.interface.ts`
  - [ ] 1.5: Delete `application/jobs/indexing.processor.ts`
  - [ ] 1.6: Delete `domain/` (ApiSpecRepository, IndexRepository, FileMetadata, Index, entities/, __tests__/)
  - [ ] 1.7: Delete `infrastructure/persistence/` (firestore-index.repository, firestore-api-spec.repository)
  - [ ] 1.8: Delete `infrastructure/services/` (api-spec-indexer.service, __tests__/)
  - [ ] 1.9: Delete `presentation/` (controllers/indexing.controller, dto/indexing.dto)
  - [ ] 1.10: Delete `indexing.module.ts`

- [ ] Task 2: Update module imports for indexing removal (AC: #1, #5)
  - [ ] 2.1: Remove `IndexingModule` import from `backend/src/app.module.ts` (line 7, 19)
  - [ ] 2.2: Remove `IndexingModule` import from `backend/src/tickets/tickets.module.ts` (line 23, 27)

### Phase 2: Backend Service Removal

- [ ] Task 3: Delete GenerationOrchestrator (AC: #2)
  - [ ] 3.1: Delete `backend/src/tickets/application/services/GenerationOrchestrator.ts`
  - [ ] 3.2: Remove `GenerationOrchestrator` from `tickets.module.ts` providers (line 34) and import (line 7)

- [ ] Task 4: Delete MastraContentGenerator and interface (AC: #3)
  - [ ] 4.1: Delete `backend/src/shared/infrastructure/mastra/MastraContentGenerator.ts`
  - [ ] 4.2: Delete `backend/src/shared/application/ports/ILLMContentGenerator.ts`
  - [ ] 4.3: Search for and remove any imports of these files across the codebase

### Phase 3: Frontend Component Removal

- [ ] Task 5: Delete old generation UI components (AC: #4)
  - [ ] 5.1: Delete `client/src/tickets/components/GenerationProgress.tsx`
  - [ ] 5.2: Delete `client/src/tickets/components/GenerationProgress.test.tsx`
  - [ ] 5.3: Delete `client/src/tickets/components/FindingsSection.tsx`
  - [ ] 5.4: Search for and remove any imports of these components in pages/layouts

### Phase 4: Verification

- [ ] Task 6: Verify no orphaned references (AC: #6)
  - [ ] 6.1: Run `grep -r` for all deleted file names across codebase
  - [ ] 6.2: Run `grep -r` for all deleted class/function names
  - [ ] 6.3: Fix any remaining references

- [ ] Task 7: Update integration tests (AC: #8)
  - [ ] 7.1: Review `backend/src/__tests__/integration/validation-system.integration.spec.ts`
  - [ ] 7.2: Remove or update test cases that depend on deleted services

- [ ] Task 8: Build and test (AC: #6)
  - [ ] 8.1: Run TypeScript compilation on backend (`tsc --noEmit`)
  - [ ] 8.2: Run TypeScript compilation on client (`tsc --noEmit`)
  - [ ] 8.3: Run existing test suite
  - [ ] 8.4: Verify validators still function (AC: #7)

## Dev Notes

### What Gets Deleted (Verified)

| File/Directory | Lines | Reason |
|----------------|-------|--------|
| `backend/src/indexing/` (19 files) | ~2,400 | Replaced by GitHub API file reading |
| `backend/src/tickets/application/services/GenerationOrchestrator.ts` | 419 | Replaced by BMAD tech-spec workflow |
| `backend/src/shared/infrastructure/mastra/MastraContentGenerator.ts` | 259 | Replaced by TechSpecGenerator |
| `backend/src/shared/application/ports/ILLMContentGenerator.ts` | 68 | Interface for deleted implementation |
| `client/src/tickets/components/GenerationProgress.tsx` | 298 | Replaced by 4-stage wizard |
| `client/src/tickets/components/GenerationProgress.test.tsx` | 313 | Tests for deleted component |
| `client/src/tickets/components/FindingsSection.tsx` | 198 | Integrated into BMAD draft review |
| **TOTAL** | **~3,955** | |

### What Gets Preserved

- **All 7 validators** in `backend/src/tickets/infrastructure/services/validators/` - will be repurposed for BMAD post-generation validation
- **ValidationEngine** in `backend/src/tickets/application/services/validation/` - still needed
- **Use cases** (CreateTicketUseCase, UpdateAECUseCase, etc.) - still needed
- **AEC domain model** - still the core entity
- **FirestoreAECRepository** - persistence layer stays
- **GitHubModule** - actively needed for BMAD integration

### Architecture Constraints

- Clean Architecture: Only delete files, never move domain logic into infrastructure [Source: docs/architecture.md#Architecture-Rules]
- Module boundaries: Each deletion must update the owning module's imports/providers [Source: CLAUDE.md#Architecture-Rules]
- Feature-based structure: Respect module boundaries when removing cross-module imports [Source: CLAUDE.md#Architecture-Rules]

### Deletion Order Matters

Delete in this order to avoid cascading compile errors:
1. **Indexing module** first (self-contained, only imported by app.module and tickets.module)
2. **GenerationOrchestrator** next (depends on indexing)
3. **MastraContentGenerator + ILLMContentGenerator** (may be used by orchestrator)
4. **Frontend components** last (independent of backend)

### Project Structure Notes

- Backend follows NestJS module pattern: each module has its own `*.module.ts` registering providers
- `app.module.ts` is the root module importing all feature modules
- `tickets.module.ts` imports `IndexingModule` as a dependency - this import must be removed
- `GenerationOrchestrator` is registered as a provider in `tickets.module.ts`

### References

- [Source: docs/epics.md#Story-9.6] - Complete deletion inventory
- [Source: docs/architecture.md#BMAD-Tech-Spec-Integration] - What replaces deleted code
- [Source: docs/sprint-artifacts/8-4-bmad-migration-plan.md] - Migration phases
- [Source: docs/sprint-artifacts/8-0-bmad-integration-overview.md] - Overview of changes

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/stories/9-6-cleanup-complete-legacy-system-removal.context.xml

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-02-04 | Story drafted from Epic 9.6 with verified file inventory | Claude Opus 4.5 |
