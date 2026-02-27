# Story 10.2: Start Implementation Use Case

Status: drafted

## Story

As a developer,
I want a backend endpoint that records my implementation branch and transitions the ticket to EXECUTING,
so that the developer agent can programmatically start implementation.

## Acceptance Criteria

1. **Given** a FORGED ticket **When** `POST /api/tickets/:id/start-implementation` is called with `{ branchName, qaItems? }` **Then** the ticket transitions to EXECUTING, the branch name and Q&A are stored, and the response includes `{ success, ticketId, branchName, status }`

2. **Given** a ticket NOT in FORGED status **When** start-implementation is called **Then** a 400 error is returned with a descriptive message

3. **Given** valid input **When** the use case executes **Then** team ownership is verified via `x-team-id` header

4. **Given** a branchName that doesn't start with `forge/` **When** start-implementation is called **Then** a 400 validation error is returned

## Tasks / Subtasks

- [ ] Task 1: Create StartImplementationUseCase (AC: 1, 2, 3)
  - [ ] Create `backend/src/tickets/application/use-cases/StartImplementationUseCase.ts`
  - [ ] Inject `AEC_REPOSITORY`
  - [ ] Implement execute(): load AEC via `findByIdInTeam`, call `aec.startImplementation()`, save
  - [ ] Catch `InvalidStateTransitionError` → rethrow as BadRequestException
  - [ ] Return `{ success: true, ticketId, branchName, status }`

- [ ] Task 2: Create StartImplementationDto (AC: 4)
  - [ ] Create `backend/src/tickets/presentation/dto/StartImplementationDto.ts`
  - [ ] `branchName`: `@IsString()`, `@Matches(/^forge\//)` — must start with `forge/`
  - [ ] `qaItems`: `@IsOptional()`, `@IsArray()` of `{ question: string, answer: string }`

- [ ] Task 3: Add controller endpoint (AC: 1, 3)
  - [ ] Add `@Post(':id/start-implementation')` to tickets.controller.ts
  - [ ] Guard with `@UseGuards(FirebaseAuthGuard)`
  - [ ] Extract teamId from `x-team-id` header
  - [ ] Map DTO to command, call use case, return response

- [ ] Task 4: Register in module (AC: 1)
  - [ ] Add `StartImplementationUseCase` to tickets.module.ts providers
  - [ ] Export it (needed by MCP tool via CLI)

## Dev Notes

- Follow exact pattern of `SubmitReviewSessionUseCase`:
  - Same injection: `@Inject(AEC_REPOSITORY) private readonly aecRepository: AECRepository`
  - Same team verification: `findByIdInTeam(ticketId, teamId)`
  - Same error handling: NotFoundException if not found, ForbiddenException if wrong team

### Prerequisites

- Story 10.1 (domain `startImplementation()` method)

### References

- [Source: backend/src/tickets/application/use-cases/SubmitReviewSessionUseCase.ts] — pattern to follow
- [Source: backend/src/tickets/presentation/controllers/tickets.controller.ts] — controller to extend

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
