# Story 7.7: Ticket Re-Enrich with Q&A

Status: ready-for-dev

## Story

As a PM,
I want to trigger AI re-enrichment of a ticket using the developer's Q&A review session,
so that the ticket's tech spec and acceptance criteria are updated with developer insights before I approve it for execution.

## Acceptance Criteria

1. `POST /api/tickets/:id/re-enrich` endpoint exists, protected by `FirebaseAuthGuard`, `WorkspaceGuard`, and `RolesGuard(Role.PM, Role.ADMIN)`.
2. Endpoint returns 400 if the ticket has no `reviewSession` or `reviewSession.qaItems` is empty.
3. Endpoint returns 403 if the ticket's `teamId` does not match the resolved team context.
4. Endpoint returns 404 if the ticket ID does not exist.
5. The use case maps `reviewSession.qaItems` → `AnswerContext[]` (using question text as `questionId`) and calls `TechSpecGenerator.generateWithAnswers()` with `context: null` when ticket has no repository, or built codebase context when `repositoryContext` is present (same pattern as `FinalizeSpecUseCase`).
6. After successful re-enrichment: ticket's `techSpec` is updated and `acceptanceCriteria` (string[]) is refreshed from the new spec's BDD criteria (mapped as `"Given {given} When {when} Then {then}"`).
7. Ticket status remains `WAITING_FOR_APPROVAL` after re-enrich — approve is handled by Story 7-8.
8. Endpoint returns the updated ticket DTO in the same shape as `GET /api/tickets/:id` (reuses `mapToResponse(aec)`).
9. A new domain method `AEC.reEnrichFromQA(techSpec: TechSpec): void` applies the content update without changing status.
10. Unit tests cover: happy path (status stays, techSpec + ACs updated), missing review session (400), empty qaItems (400), team ownership mismatch (403), ticket not found (404).
11. `tsc --noEmit` → 0 errors in backend.

## Tasks / Subtasks

- [ ] Task 1: Domain — Add `reEnrichFromQA()` to AEC (AC: 6, 7, 9)
  - [ ] In `backend/src/tickets/domain/aec/AEC.ts`: add `reEnrichFromQA(techSpec: TechSpec): void`
  - [ ] Sets `_techSpec = techSpec`
  - [ ] Refreshes `_acceptanceCriteria` from `techSpec.acceptanceCriteria.map(ac => \`Given ${ac.given} When ${ac.when} Then ${ac.then}\`)`
  - [ ] Does NOT change `_status` (intentional — stays WAITING_FOR_APPROVAL)
  - [ ] Updates `_updatedAt = new Date()`

- [ ] Task 2: Application — `ReEnrichWithQAUseCase` (AC: 2, 3, 4, 5, 6, 7)
  - [ ] Create `backend/src/tickets/application/use-cases/ReEnrichWithQAUseCase.ts`
  - [ ] Command: `{ ticketId: string; teamId: string }`
  - [ ] Inject: `AEC_REPOSITORY`, `TECH_SPEC_GENERATOR`, `GITHUB_FILE_SERVICE`, `CODEBASE_ANALYZER`, `PROJECT_STACK_DETECTOR`
  - [ ] Load ticket → 404 if missing; 403 if teamId mismatch
  - [ ] Validate `reviewSession?.qaItems` non-empty → 400 `BadRequestException('No review session found on this ticket')`
  - [ ] Map Q&A: `qaItems.map(qa => ({ questionId: qa.question, answer: qa.answer }))`
  - [ ] Build codebase context using same logic as `FinalizeSpecUseCase.buildCodebaseContext()` (copy private method or inline)
  - [ ] Call `techSpecGenerator.generateWithAnswers({ title, description, context, answers })`
  - [ ] Call `aec.reEnrichFromQA(techSpec)` and `aecRepository.save(aec)`
  - [ ] Return updated `AEC`

- [ ] Task 3: Presentation — New route in `tickets.controller.ts` (AC: 1, 8)
  - [ ] Add `@Post(':id/re-enrich')` handler in `tickets.controller.ts`
  - [ ] Guards: `@UseGuards(WorkspaceGuard, FirebaseAuthGuard)` + `@Roles(Role.PM, Role.ADMIN)`
  - [ ] Params: `@Param('id') ticketId`, `@TeamId() teamId`
  - [ ] Return `mapToResponse(aec)` (same as existing ticket handlers)

- [ ] Task 4: Module — Register `ReEnrichWithQAUseCase` in `TicketsModule` (AC: 1)
  - [ ] Add `ReEnrichWithQAUseCase` to `providers` array in `tickets.module.ts`

- [ ] Task 5: Tests — Unit tests for `ReEnrichWithQAUseCase` (AC: 10, 11)
  - [ ] Create `backend/src/tickets/application/use-cases/ReEnrichWithQAUseCase.spec.ts`
  - [ ] Mock `AECRepository`, `TechSpecGenerator` (and optional ports for codebase analysis)
  - [ ] Test: happy path → techSpec set, ACs refreshed, status stays WAITING_FOR_APPROVAL, save called
  - [ ] Test: no reviewSession → 400 BadRequestException
  - [ ] Test: empty qaItems array → 400 BadRequestException
  - [ ] Test: teamId mismatch → 403 ForbiddenException
  - [ ] Test: ticket not found → 404 NotFoundException
  - [ ] Run `tsc --noEmit` → 0 errors

## Dev Notes

### Architecture — Layers Touched

| Layer | File | Change |
|---|---|---|
| Domain | `AEC.ts` | New `reEnrichFromQA(techSpec)` method |
| Application | `ReEnrichWithQAUseCase.ts` | NEW use case |
| Application | `ReEnrichWithQAUseCase.spec.ts` | NEW unit tests |
| Presentation | `tickets.controller.ts` | New `POST /:id/re-enrich` handler |
| Module | `tickets.module.ts` | Register new use case |

### Codebase Context Pattern

Reuse the same `buildCodebaseContext()` pattern from `FinalizeSpecUseCase.ts`. For now, duplicate the private method into `ReEnrichWithQAUseCase` — a future story can extract it to a shared service. The pattern:

```typescript
// No repository → return minimal null-equivalent CodebaseContext
if (!aec.repositoryContext) {
  return { stack: { ... }, analysis: { ... }, fileTree: { ... }, files: new Map() };
}
// Has repository → fetch file tree + analyze stack
const [owner, repo] = aec.repositoryContext.repositoryFullName.split('/');
const fileTree = await this.githubFileService.getTree(owner, repo, branch);
// ... analyze, return full CodebaseContext
```

### AnswerContext Mapping

`ReviewQAItem.question` (string) maps to `AnswerContext.questionId` — the generator uses it for tracking context, not UUID lookup. This is the same pattern used elsewhere in the question-answer flow.

### AcceptanceCriteria Refresh

`TechSpec.acceptanceCriteria` is `AcceptanceCriterion[]` where each has `{ given, when, then }` BDD fields. Map to `string[]` for the AEC domain:

```typescript
techSpec.acceptanceCriteria.map(
  ac => `Given ${ac.given} When ${ac.when} Then ${ac.then}`
)
```

### Guard Order

Controller handler must use guards in this order: `FirebaseAuthGuard` first (authenticates user), then `WorkspaceGuard` (needs authenticated user to resolve team). `RolesGuard` checks after authentication. Look at existing PM-only endpoints in `tickets.controller.ts` for reference.

### Status Intentionally Unchanged

The `reEnrichFromQA()` domain method MUST NOT transition status. The ticket stays in `WAITING_FOR_APPROVAL`. Story 7-8 adds the PM "Approve" button which calls a separate endpoint to transition → `READY`. This separation allows the PM to re-bake multiple times before approving.

### Module Registration

`TicketsModule` at `backend/src/tickets/tickets.module.ts` lists all use cases as providers. `ReEnrichWithQAUseCase` requires the same AI service ports that `FinalizeSpecUseCase` uses — verify they're already registered (`TECH_SPEC_GENERATOR`, `GITHUB_FILE_SERVICE`, `CODEBASE_ANALYZER`, `PROJECT_STACK_DETECTOR`).

### References

- [Source: backend/src/tickets/application/use-cases/FinalizeSpecUseCase.ts] — closest analogue; reuse buildCodebaseContext pattern
- [Source: backend/src/tickets/domain/aec/AEC.ts] — add `reEnrichFromQA()` alongside `setTechSpec()`
- [Source: backend/src/tickets/application/use-cases/SubmitReviewSessionUseCase.ts] — shows how reviewSession is stored
- [Source: backend/src/tickets/presentation/controllers/tickets.controller.ts] — guard/role pattern for PM-only routes
- [Source: backend/src/tickets/domain/tech-spec/TechSpecGenerator.ts] — `generateWithAnswers()` and `AnswerContext` types

### Learnings from Previous Story

**From Story 7-2 (Status: review)**

- **`findById` signature**: `aecRepository.findById(ticketId)` — takes only one argument (no teamId). Team ownership is validated separately via `aec.teamId !== command.teamId`.
- **`AEC_REPOSITORY` injection**: Use `@Inject(AEC_REPOSITORY)` and import `AEC_REPOSITORY` from `'../ports/AECRepository'`.
- **Error message pattern**: `ForbiddenException('Ticket does not belong to your team')` (updated from workspace in 7-2).
- **`@TeamId()` decorator**: Use `@TeamId() teamId` in controller handlers; import from `'../../shared/presentation/decorators/TeamId.decorator'`.

[Source: stories/7-2-move-tickets-to-team-scope.md#Dev-Agent-Record]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
