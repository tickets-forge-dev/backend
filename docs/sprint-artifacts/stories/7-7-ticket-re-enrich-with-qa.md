# Story 7.7: Ticket Re-Enrich with Q&A

Status: review

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

- [x] Task 1: Domain — Add `reEnrichFromQA()` to AEC (AC: 6, 7, 9)
  - [x] In `backend/src/tickets/domain/aec/AEC.ts`: add `reEnrichFromQA(techSpec: TechSpec): void`
  - [x] Sets `_techSpec = techSpec`
  - [x] Refreshes `_acceptanceCriteria` from `techSpec.acceptanceCriteria.map(ac => \`Given ${ac.given} When ${ac.when} Then ${ac.then}\`)`
  - [x] Does NOT change `_status` (intentional — stays WAITING_FOR_APPROVAL)
  - [x] Updates `_updatedAt = new Date()`

- [x] Task 2: Application — `ReEnrichWithQAUseCase` (AC: 2, 3, 4, 5, 6, 7)
  - [x] Create `backend/src/tickets/application/use-cases/ReEnrichWithQAUseCase.ts`
  - [x] Command: `{ ticketId: string; teamId: string }`
  - [x] Inject: `AEC_REPOSITORY`, `TECH_SPEC_GENERATOR`, `GITHUB_FILE_SERVICE`, `CODEBASE_ANALYZER`, `PROJECT_STACK_DETECTOR`
  - [x] Load ticket → 404 if missing; 403 if teamId mismatch
  - [x] Validate `reviewSession?.qaItems` non-empty → 400 `BadRequestException('No review session found on this ticket')`
  - [x] Map Q&A: `qaItems.map(qa => ({ questionId: qa.question, answer: qa.answer }))`
  - [x] Build codebase context using same logic as `FinalizeSpecUseCase.buildCodebaseContext()` (copy private method or inline)
  - [x] Call `techSpecGenerator.generateWithAnswers({ title, description, context, answers })`
  - [x] Call `aec.reEnrichFromQA(techSpec)` and `aecRepository.save(aec)`
  - [x] Return updated `AEC`

- [x] Task 3: Presentation — New route in `tickets.controller.ts` (AC: 1, 8)
  - [x] Add `@Post(':id/re-enrich')` handler in `tickets.controller.ts`
  - [x] Guards: `@UseGuards(WorkspaceGuard, FirebaseAuthGuard)` + `@Roles(Role.PM, Role.ADMIN)`
  - [x] Params: `@Param('id') ticketId`, `@TeamId() teamId`
  - [x] Return `mapToResponse(aec)` (same as existing ticket handlers)

- [x] Task 4: Module — Register `ReEnrichWithQAUseCase` in `TicketsModule` (AC: 1)
  - [x] Add `ReEnrichWithQAUseCase` to `providers` array in `tickets.module.ts`

- [x] Task 5: Tests — Unit tests for `ReEnrichWithQAUseCase` (AC: 10, 11)
  - [x] Create `backend/src/tickets/application/use-cases/ReEnrichWithQAUseCase.spec.ts`
  - [x] Mock `AECRepository`, `TechSpecGenerator` (and optional ports for codebase analysis)
  - [x] Test: happy path → techSpec set, ACs refreshed, status stays WAITING_FOR_APPROVAL, save called
  - [x] Test: no reviewSession → 400 BadRequestException
  - [x] Test: empty qaItems array → 400 BadRequestException
  - [x] Test: teamId mismatch → 403 ForbiddenException
  - [x] Test: ticket not found → 404 NotFoundException
  - [x] Run `tsc --noEmit` → 0 errors (confirmed)

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

- Mirrored `buildCodebaseContext()` from `FinalizeSpecUseCase` — duplicated private method as story intended; future refactor to shared service deferred.
- Fixed Jest module resolution issue: `ReEnrichWithQAUseCase.ts` originally imported `GitHubFileService` via `@github/domain/github-file.service` (tsconfig alias). Backend Jest config has no `moduleNameMapper` for tsconfig aliases, so switched to relative path `../../../github/domain/github-file.service`.
- All 7 unit tests pass. 10 pre-existing failures in `CreateTeamUseCase` and `GetUserTeamsUseCase` are unrelated (confirmed on clean branch).
- `tsc --noEmit` → 0 errors in backend.

### File List

- `backend/src/tickets/domain/aec/AEC.ts` — added `reEnrichFromQA(techSpec)` method
- `backend/src/tickets/application/use-cases/ReEnrichWithQAUseCase.ts` — NEW
- `backend/src/tickets/application/use-cases/ReEnrichWithQAUseCase.spec.ts` — NEW (7 tests)
- `backend/src/tickets/presentation/controllers/tickets.controller.ts` — added `POST /:id/re-enrich` handler
- `backend/src/tickets/tickets.module.ts` — registered `ReEnrichWithQAUseCase`
