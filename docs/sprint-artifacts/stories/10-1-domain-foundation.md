# Story 10.1: Domain Foundation for Developer Agent

Status: drafted

## Story

As a developer,
I want the AEC domain model to support implementation tracking (branch name, implementation Q&A, status transition),
so that the developer agent can record how implementation started.

## Acceptance Criteria

1. **Given** a FORGED AEC ticket **When** `aec.startImplementation(branchName, qaItems)` is called **Then** the ticket transitions to EXECUTING, stores the branch name and implementation session with timestamp

2. **Given** a ticket NOT in FORGED status **When** `startImplementation()` is called **Then** an `InvalidStateTransitionError` is thrown

3. **Given** an AEC with implementation data **When** persisted to Firestore and reconstituted **Then** `implementationBranch`, `implementationSession` are correctly round-tripped

4. **Given** the AEC entity **When** `implementationBranch` and `implementationSession` getters are called **Then** they return the stored values (or null if not set)

## Tasks / Subtasks

- [ ] Task 1: Add ImplementationSession type to AEC (AC: 1)
  - [ ] Define `ImplementationSession` interface: `{ qaItems: ReviewQAItem[], branchName: string, startedAt: Date }`
  - [ ] Reuse existing `ReviewQAItem` interface (`{ question: string, answer: string }`)

- [ ] Task 2: Extend AEC entity (AC: 1, 2, 4)
  - [ ] Add `_implementationBranch: string | null = null` field
  - [ ] Add `_implementationSession: ImplementationSession | null = null` field
  - [ ] Add `startImplementation(branchName: string, qaItems?: ReviewQAItem[])` method
    - Guard: throw `InvalidStateTransitionError` if status !== FORGED
    - Set `_implementationBranch = branchName`
    - Set `_implementationSession = { qaItems: qaItems ?? [], branchName, startedAt: new Date() }`
    - Transition `_status = AECStatus.EXECUTING`
    - Update `_updatedAt`
  - [ ] Add getters: `implementationBranch`, `implementationSession`
  - [ ] Wire new fields through constructor + `createDraft()` + `reconstitute()` factory methods

- [ ] Task 3: Update AECMapper (AC: 3)
  - [ ] Add `implementationBranch?: string` and `implementationSession?` to AECDocument interface
  - [ ] Update `toDomain()`: pass `doc.implementationBranch ?? null` and `doc.implementationSession ?? null` to reconstitute
  - [ ] Update `toFirestore()`: include fields when present (undefined-safe)
  - [ ] Handle Date conversion for `implementationSession.startedAt` (ISO string in Firestore)

## Dev Notes

- Add fields as the LAST constructor parameters with defaults — same pattern as `_reproductionSteps` (line 70 of AEC.ts)
- `startImplementation()` follows the same guard pattern as `forge()` (line 241) and `export()` (line 254)
- Unlike `export()`, `startImplementation()` does NOT require an ExternalIssue — the branch is local, PR comes later
- The `export()` method remains for Jira/Linear export; `startImplementation()` is the GitHub/local path

### References

- [Source: backend/src/tickets/domain/aec/AEC.ts] — AEC entity
- [Source: backend/src/tickets/infrastructure/persistence/mappers/AECMapper.ts] — Firestore mapper

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
