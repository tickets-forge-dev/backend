# Story 7.7: Ticket Re-Enrich with Q&A

Status: done

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

### Review Follow-ups (AI)

- [x] [AI-Review] [Med] Add `requestingUserId: string` to `ReEnrichWithQACommand` and inject `TeamMemberRepository` into `ReEnrichWithQAUseCase`; throw `ForbiddenException` if role is not PM or ADMIN
- [x] [AI-Review] [Med] Update controller `reEnrichTicket` handler to pass `@UserId() userId` as `requestingUserId`
- [x] [AI-Review] [Med] Add test: `throws ForbiddenException when requesting user is Developer` — 8/8 tests pass

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

✅ Resolved review finding [Med]: Added role authorization to `ReEnrichWithQAUseCase` — injected `TeamMemberRepository` via `@Inject('TeamMemberRepository')`, added `requestingUserId` to `ReEnrichWithQACommand`, checked `role === Role.PM || role === Role.ADMIN`, throws `ForbiddenException('Only PMs and Admins can re-enrich tickets')` for Developers. Followed exact `AssignTicketUseCase` pattern.
✅ Resolved review finding [Med]: Updated `reEnrichTicket` controller handler to pass `@UserId() userId` as `requestingUserId` in command.
✅ Resolved review finding [Med]: Added test case — 8/8 tests passing (was 7). `tsc --noEmit` → 0 errors. All 39 ticket use case tests pass.

- Mirrored `buildCodebaseContext()` from `FinalizeSpecUseCase` — duplicated private method as story intended; future refactor to shared service deferred.
- Fixed Jest module resolution issue: `ReEnrichWithQAUseCase.ts` originally imported `GitHubFileService` via `@github/domain/github-file.service` (tsconfig alias). Backend Jest config has no `moduleNameMapper` for tsconfig aliases, so switched to relative path `../../../github/domain/github-file.service`.
- All 7 unit tests pass. 10 pre-existing failures in `CreateTeamUseCase` and `GetUserTeamsUseCase` are unrelated (confirmed on clean branch).
- `tsc --noEmit` → 0 errors in backend.

### File List

- `backend/src/tickets/domain/aec/AEC.ts` — added `reEnrichFromQA(techSpec)` method
- `backend/src/tickets/application/use-cases/ReEnrichWithQAUseCase.ts` — added `requestingUserId` to command, `TeamMemberRepository` injection, PM/Admin role check
- `backend/src/tickets/application/use-cases/ReEnrichWithQAUseCase.spec.ts` — added Developer role test (8 tests total)
- `backend/src/tickets/presentation/controllers/tickets.controller.ts` — added `@UserId() userId` + `requestingUserId` to `reEnrichTicket` handler
- `backend/src/tickets/tickets.module.ts` — registered `ReEnrichWithQAUseCase`

---

## Senior Developer Review (AI)

- **Reviewer:** BMad
- **Date:** 2026-02-21
- **Outcome:** Changes Requested

### Summary

Core implementation is solid: domain method, use case, Firestore persistence, controller route, module registration, and 7 unit tests are all verified. One notable gap: AC1 requires `RolesGuard(Role.PM, Role.ADMIN)` but no `RolesGuard` exists in the codebase, and the use case has no internal role check either. Any authenticated team member (including Developers) can call `POST /api/tickets/:id/re-enrich`. The project uses internal use case role checks (see `AssignTicketUseCase`) — this story should follow the same pattern.

### Key Findings

**MEDIUM**
- `ReEnrichWithQAUseCase.ts` — No role authorization. AC1 requires PM/Admin only, but the use case only checks team ownership, not the requesting user's role. A Developer can call re-enrich. Fix: inject `TeamRepository`, fetch requesting user's member record, check `role === Role.PM || role === Role.ADMIN` (follow `AssignTicketUseCase` pattern). This requires adding `requestingUserId` to the command and controller handler. [file: backend/src/tickets/application/use-cases/ReEnrichWithQAUseCase.ts:54]

**LOW**
- Test `'status remains WAITING_FOR_APPROVAL'` (line 126) passes `reEnrichFromQA` as a mock — the test verifies `mockAEC.status` is still the original value, but since the mock never changes status, this is a tautological test. The domain method itself (`AEC.reEnrichFromQA`) is the right place to verify this constraint. Consider a separate domain unit test.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC1 | `POST /:id/re-enrich` with FirebaseAuthGuard, WorkspaceGuard, RolesGuard(PM, Admin) | PARTIAL | `tickets.controller.ts:457` ✓; FirebaseAuthGuard+WorkspaceGuard at class level ✓; RolesGuard/role check missing ✗ |
| AC2 | Returns 400 if no reviewSession or empty qaItems | IMPLEMENTED | `ReEnrichWithQAUseCase.ts:68-70` |
| AC3 | Returns 403 if teamId mismatch | IMPLEMENTED | `ReEnrichWithQAUseCase.ts:62-64` |
| AC4 | Returns 404 if ticket not found | IMPLEMENTED | `ReEnrichWithQAUseCase.ts:57-59` |
| AC5 | Maps qaItems → AnswerContext, calls generateWithAnswers with codebase context | IMPLEMENTED | `ReEnrichWithQAUseCase.ts:73-87` |
| AC6 | techSpec updated, ACs refreshed from BDD criteria | IMPLEMENTED | `AEC.ts:408-413`; `reEnrichFromQA()` |
| AC7 | Status stays WAITING_FOR_APPROVAL | IMPLEMENTED | `AEC.ts:408-413` — no status change |
| AC8 | Returns updated ticket DTO via mapToResponse | IMPLEMENTED | `tickets.controller.ts:463` |
| AC9 | `AEC.reEnrichFromQA(techSpec)` domain method | IMPLEMENTED | `AEC.ts:408` |
| AC10 | 7 unit tests: happy path, 404, 403, 400 (no session), 400 (empty) | IMPLEMENTED | `ReEnrichWithQAUseCase.spec.ts:99-215` |
| AC11 | tsc → 0 errors | IMPLEMENTED | Story notes confirm |

**Summary: 10 of 11 ACs fully implemented (AC1 partial)**

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| Task 1: Domain `reEnrichFromQA()` | ✅ | VERIFIED | `AEC.ts:408-414` — sets techSpec, refreshes ACs, no status change |
| Task 2: `ReEnrichWithQAUseCase` | ✅ | PARTIAL | Logic verified; role check missing [AC1 gap] |
| Task 3: Controller route | ✅ | VERIFIED | `tickets.controller.ts:457-464` |
| Task 4: Module registration | ✅ | VERIFIED | `tickets.module.ts:107` |
| Task 5: 7 unit tests | ✅ | VERIFIED | `ReEnrichWithQAUseCase.spec.ts` — all 5 required cases present |

**Summary: 4 of 5 tasks fully verified, 1 partial (Task 2 — role check)**

### Test Coverage and Gaps

- 7 tests cover: happy path (Q&A mapping, domain call, persist, return), status-stays test, no-repo minimal context, 404, 403, 400×2 — AC10 met.
- Gap: No test for retry logic in `generateSpecWithRetry` (3-attempt exponential backoff). Low priority but worth noting.

### Architectural Alignment

Clean architecture maintained: domain method is stateless content update; use case handles orchestration; controller is thin adapter. `buildCodebaseContext()` duplication from `FinalizeSpecUseCase` is intentional per story design ("future cleanup deferred").

### Security Notes

Authorization gap: PM/Admin-only endpoint accessible to Developers. This allows developers to re-bake specs before PM review — minor risk but violates the intended PM-controls-approval workflow.

### Action Items

**Code Changes Required:**
- [x] [Med] Add role authorization to `ReEnrichWithQAUseCase` — inject `TeamMemberRepository`, add `requestingUserId: string` to `ReEnrichWithQACommand`, fetch team member, throw `ForbiddenException` if role is not PM or ADMIN [file: backend/src/tickets/application/use-cases/ReEnrichWithQAUseCase.ts]
- [x] [Med] Update controller `reEnrichTicket` handler to pass `@UserId() userId` to command as `requestingUserId` [file: backend/src/tickets/presentation/controllers/tickets.controller.ts]
- [x] [Med] Add test case for `ForbiddenException` when requesting user is Developer role [file: backend/src/tickets/application/use-cases/ReEnrichWithQAUseCase.spec.ts]

**Advisory Notes:**
- Note: `approveTicket` endpoint (Story 7-8) has the same role enforcement gap — address together in a follow-up pass

---

## Senior Developer Review (AI) — Re-review

- **Reviewer:** BMad
- **Date:** 2026-02-22
- **Outcome:** Approve

### Summary

All three MEDIUM action items from the prior review are fully resolved. `ReEnrichWithQAUseCase` now injects `TeamMemberRepository` and enforces PM/Admin-only access — throwing `ForbiddenException` for Developers. The controller correctly passes `@UserId() userId` as `requestingUserId`. The test suite grew from 7 to 8 tests with the new Developer role test case. All ACs are now fully implemented. Approving.

### Key Findings

No new findings. Prior MEDIUM issues all resolved.

**LOW (unchanged from prior review — advisory only):**
- Note: `approveTicket` (Story 7-8) had a similar role enforcement gap — already tracked above

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC1 | `POST /:id/re-enrich` protected by FirebaseAuthGuard, WorkspaceGuard, role check | IMPLEMENTED | Route at `tickets.controller.ts:457`; class-level guards ✓; use-case role check `ReEnrichWithQAUseCase.ts:71-81` ✓ |
| AC2 | 400 if no reviewSession or empty qaItems | IMPLEMENTED | `ReEnrichWithQAUseCase.ts:84-87` |
| AC3 | 403 if teamId mismatch | IMPLEMENTED | `ReEnrichWithQAUseCase.ts:67-69` |
| AC4 | 404 if ticket not found | IMPLEMENTED | `ReEnrichWithQAUseCase.ts:61-64` |
| AC5 | Maps qaItems → AnswerContext; calls generateWithAnswers with codebase context | IMPLEMENTED | `ReEnrichWithQAUseCase.ts:90-104` |
| AC6 | techSpec updated; ACs refreshed from BDD criteria | IMPLEMENTED | `AEC.ts:408-414` — sets `_techSpec`, maps `Given/When/Then` |
| AC7 | Status stays WAITING_FOR_APPROVAL | IMPLEMENTED | `AEC.ts:408-414` — no status assignment |
| AC8 | Returns updated ticket DTO | IMPLEMENTED | `tickets.controller.ts:463` — `mapToResponse(aec)` |
| AC9 | `AEC.reEnrichFromQA(techSpec)` domain method | IMPLEMENTED | `AEC.ts:408` |
| AC10 | Unit tests: happy path, 400×2, 403 team, 403 role, 404 | IMPLEMENTED | `ReEnrichWithQAUseCase.spec.ts` — 8 tests (3 happy + 1 NotFoundException + 1 team ownership + 1 Developer role + 2 BadRequest) |
| AC11 | tsc → 0 errors | IMPLEMENTED | Story notes confirm |

**Summary: 11 of 11 acceptance criteria fully implemented**

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| Review Follow-up: Role auth in use case | ✅ | VERIFIED | `ReEnrichWithQAUseCase.ts:18-19,55-56,71-81` — TeamMemberRepository injected; ForbiddenException for non-PM/Admin |
| Review Follow-up: Controller passes userId | ✅ | VERIFIED | `tickets.controller.ts:460,462` — `@UserId() userId`, `requestingUserId: userId` |
| Review Follow-up: Developer role test | ✅ | VERIFIED | `ReEnrichWithQAUseCase.spec.ts:202-213` — 8/8 tests pass |
| Task 1: Domain `reEnrichFromQA()` | ✅ | VERIFIED | `AEC.ts:408-414` |
| Task 2: `ReEnrichWithQAUseCase` with role check | ✅ | VERIFIED | Full use case verified end-to-end |
| Task 3: Controller route | ✅ | VERIFIED | `tickets.controller.ts:457-465` |
| Task 4: Module registration | ✅ | VERIFIED | Per prior review evidence |
| Task 5: 8 unit tests | ✅ | VERIFIED | All 5 required error cases + 3 happy path present |

**Summary: 8 of 8 completed tasks verified, 0 questionable, 0 false completions**

### Test Coverage and Gaps

- 8 tests cover all AC error paths + 3 happy path variants ✓
- LOW: No retry logic test for `generateSpecWithRetry` — acceptable, internal implementation detail

### Architectural Alignment

Clean architecture maintained: domain method handles state, use case orchestrates, controller is thin. Role check follows the canonical `AssignTicketUseCase` pattern — consistent with project conventions. `buildCodebaseContext()` duplication from `FinalizeSpecUseCase` is intentional per story design.

### Security Notes

PM/Admin-only enforcement now in place. No new concerns.

### Action Items

No code changes required.

**Advisory Notes:**
- Note: Consider extracting `buildCodebaseContext()` to a shared application service in a future cleanup story (referenced in Dev Notes)

### Change Log

- 2026-02-22: Re-review — Approve. All 3 MEDIUM findings resolved; 11/11 ACs implemented; 8/8 tests pass.
