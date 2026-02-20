# Story 3.5.2: Conditional Deep Analysis

**Epic:** Epic 3.5 - Non-Technical PM Support
**Priority:** P0 CRITICAL
**Effort:** 2 days
**Status:** in-progress

## Story

As a **Product Manager without GitHub access**,
I want **ticket spec generation to succeed without a repository**,
so that **I can create high-level specs for developers without needing code access or triggering analysis errors**.

## Acceptance Criteria

1. **Backend: Skip deep analysis when no repository provided**
   - `CreateTicketUseCase` checks if `repositoryOwner`, `repositoryName`, and `branch` are all present
   - If any are absent: skip `deepAnalysisService.analyze()` call entirely — set `repositoryContext = null`
   - If all are present: proceed with full deep analysis as normal

2. **TechSpecGenerator handles null context gracefully**
   - `TechSpecGeneratorImpl.generate()` accepts `null` for `repositoryContext`
   - Prompt adapts: omits code-specific instructions when no context provided
   - Generates high-level spec covering: problem statement, solution, acceptance criteria, scope
   - Code-specific fields (`fileChanges`, `apiChanges`, `layeredFileChanges`) set to empty arrays or omitted
   - No runtime errors, no TypeScript `any` casts

3. **Quality scoring adapts to missing repository context**
   - Quality score calculation excludes repo-dependent sections when `repositoryContext = null`
   - Score re-normalized across remaining sections (problem, solution, AC, ambiguity, test plan)
   - Score never artificially penalized for intentionally skipped sections

4. **AEC domain: `_repositoryContext` accepts null**
   - `AEC._repositoryContext` typed as `RepositoryContext | null`
   - `createDraft()` factory supports `repositoryContext: null`
   - `reconstitute()` supports `repositoryContext: null` from Firestore
   - AECMapper correctly serializes/deserializes null repository context

5. **Spec generation completes without errors**
   - Full flow: ticket created without repo → spec generated → ticket saved → 0 errors
   - Spec contains meaningful content (not empty) for non-code sections
   - Build passes: 0 TypeScript errors

6. **Existing behavior unchanged**
   - Tickets created WITH repository: full deep analysis runs as before
   - No regression in code-aware spec quality
   - All existing tests pass

## Tasks / Subtasks

- [ ] **Update `CreateTicketUseCase`** (AC: #1)
  - [ ] Check: `const hasRepository = command.repositoryOwner && command.repositoryName && command.branch`
  - [ ] If `hasRepository`: call `deepAnalysisService.analyze()` as before
  - [ ] If `!hasRepository`: set `repositoryContext = null`, skip deep analysis
  - [ ] Pass `repositoryContext` (possibly null) to `TechSpecGenerator`

- [ ] **Update `TechSpecGeneratorImpl`** (AC: #2)
  - [ ] Modify `generate()` signature: `repositoryContext: RepositoryContext | null`
  - [ ] Add null-guard: if `!repositoryContext`, use simplified prompt (no file/code references)
  - [ ] Simplified prompt: focus on problem, solution, AC, assumptions — no file change lists
  - [ ] Set `fileChanges = []`, `apiChanges = { new: [], modified: [], deleted: [] }`, `layeredFileChanges = null` when null context
  - [ ] Update `generateWithAnswers()` similarly

- [ ] **Update quality scoring** (AC: #3)
  - [ ] In quality score calculator: detect `repositoryContext === null`
  - [ ] Skip `fileChanges`, `apiChanges`, `layeredFileChanges` scoring when no repo
  - [ ] Re-normalize remaining section scores to produce 0-100 result

- [ ] **Update AEC domain** (AC: #4)
  - [ ] `backend/src/tickets/domain/aec/AEC.ts`: type `_repositoryContext` as `RepositoryContext | null`
  - [ ] Update `createDraft()` factory to accept optional/null repositoryContext
  - [ ] Update `reconstitute()` factory similarly
  - [ ] Update `AECMapper.ts`: handle null `repositoryContext` in toDomain and toPersistence

- [ ] **Integration verification** (AC: #5, #6)
  - [ ] Test: create ticket without repo → spec generated successfully
  - [ ] Test: create ticket with repo → full deep analysis still runs
  - [ ] Verify spec content is non-trivial for no-repo path
  - [ ] Verify 0 TypeScript errors: `pnpm tsc --noEmit` in backend

## Dev Notes

### Context from Story 3-5-1 (Previous Story)

Story 3-5-1 (`ready-for-dev`) makes repository fields optional in `CreateTicketDto` and adds frontend `includeRepository` flag. This story (3-5-2) implements the backend conditional logic that 3-5-1 depends on.

**Critical dependency:** 3-5-1 must be complete (or in-progress) before 3-5-2 goes to dev. The DTOs from 3-5-1 (`@IsOptional()` on repository fields) are required for this story's backend changes.

### Pattern from Session 18 (PRD Breakdown & Bulk Enrichment)

Repository is already optional in `PRDBreakdownUseCase` and `EnrichMultipleTicketsUseCase`:

```typescript
// Pattern to follow (from PRDBreakdownUseCase):
const hasRepository = command.repositoryOwner && command.repositoryName;

if (hasRepository) {
  this.logger.log(`Repository: ${command.repositoryOwner}/${command.repositoryName}`);
  // ... deep analysis
} else {
  this.logger.log('No repository provided — generating content-only spec');
  repositoryContext = null;
}
```

[Source: MEMORY.md#Session-18]

### Files to Modify

**Backend:**
- `backend/src/tickets/application/use-cases/CreateTicketUseCase.ts` — Conditional deep analysis
- `backend/src/tickets/application/services/TechSpecGeneratorImpl.ts` — Null context handling
- `backend/src/tickets/domain/aec/AEC.ts` — Null `_repositoryContext` type
- `backend/src/tickets/infrastructure/persistence/mappers/AECMapper.ts` — Null serialization

### Null-Safe Prompt Template

When `repositoryContext === null`, replace code-specific prompt with:

```
This ticket has no repository context. Generate a high-level specification that:
- Describes the problem and solution clearly
- Lists acceptance criteria that developers can validate
- Identifies scope boundaries and assumptions
- Does NOT include specific file paths, function names, or code snippets
- Leaves implementation details for the developer to determine
```

### Architecture Notes

- Domain: `AEC._repositoryContext: RepositoryContext | null` — no domain violation
- Use case: business decision to skip analysis — appropriate layer for this logic
- Mapper: handle null at persistence boundary — serialize as `null` in Firestore
- Generator: adapt prompt based on available context — clean strategy

### Testing Strategy

```typescript
// Unit test: CreateTicketUseCase
it('skips deep analysis when no repository provided', async () => {
  const command = { title: 'Test', description: '...', /* no repo fields */ };
  await useCase.execute(command);
  expect(deepAnalysisService.analyze).not.toHaveBeenCalled();
});

it('runs deep analysis when repository provided', async () => {
  const command = { ..., repositoryOwner: 'org', repositoryName: 'repo', branch: 'main' };
  await useCase.execute(command);
  expect(deepAnalysisService.analyze).toHaveBeenCalled();
});
```

### References

- [Story 3-5-1: Repository Optional Flag](docs/sprint-artifacts/stories/3-5-1-repository-optional-flag.md)
- [Session 18 Memory: Repository Optional Pattern](~/.claude/projects/-Users-Idana-Documents-GitHub-forge/memory/MEMORY.md#Session-18)
- [Use Case: CreateTicketUseCase](backend/src/tickets/application/use-cases/CreateTicketUseCase.ts)
- [Service: TechSpecGeneratorImpl](backend/src/tickets/application/services/TechSpecGeneratorImpl.ts)
- [Domain: AEC.ts](backend/src/tickets/domain/aec/AEC.ts)

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
