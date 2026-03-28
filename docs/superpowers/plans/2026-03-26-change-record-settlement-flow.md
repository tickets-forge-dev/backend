# Change Record & Settlement Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Change Record — a post-execution review artifact that captures what was built vs what was intended, enabling PMs to review and accept/reject deliveries within the DELIVERED lifecycle state.

**Architecture:** During EXECUTING, the developer agent reports structured events (decisions, risks, scope changes) via MCP → REST endpoints. When the agent finishes, it calls `submit_settlement` which aggregates events into a Change Record and transitions the ticket to DELIVERED. The PM reviews the Change Record (intent vs result delta, divergence flags, code changes) and either accepts or requests changes. Requesting changes sends the ticket back to EXECUTING. All new domain concepts are value objects on the AEC aggregate — no new entities or Firestore subcollections.

**Tech Stack:** NestJS, TypeScript, Firestore, Next.js/React

---

## Domain Model

### ExecutionEvent (value object)
```typescript
interface ExecutionEvent {
  id: string;                                        // uuid
  type: 'decision' | 'risk' | 'scope_change';
  title: string;                                     // Short label
  description: string;                               // Full context
  createdAt: Date;
}
```

### ChangeRecord (value object)
```typescript
interface ChangeRecord {
  executionSummary: string;                          // What was actually built
  filesChanged: FileChange[];                        // Code impact
  divergences: Divergence[];                         // Intent vs result deltas
  hasDivergence: boolean;                            // Quick flag
  status: ChangeRecordStatus;                        // Review sub-status
  reviewNote: string | null;                         // PM's comment (on reject)
  reviewedAt: Date | null;                           // When PM reviewed
  submittedAt: Date;                                 // When agent delivered
}

interface FileChange {
  path: string;
  additions: number;
  deletions: number;
}

interface Divergence {
  area: string;                                      // What area diverged
  intended: string;                                  // What the spec said
  actual: string;                                    // What was built
  justification: string;                             // Why the agent diverged
}

enum ChangeRecordStatus {
  AWAITING_REVIEW = 'awaiting_review',
  ACCEPTED = 'accepted',
  CHANGES_REQUESTED = 'changes_requested',
}
```

### AEC Changes
```
New fields:
  _executionEvents: ExecutionEvent[]                 // Accumulated during EXECUTING
  _changeRecord: ChangeRecord | null                 // Created on settlement

New methods:
  recordExecutionEvent(event)                        // Append event (requires EXECUTING)
  deliver(settlement)                                // Events → ChangeRecord, EXECUTING → DELIVERED
  acceptDelivery()                                   // ChangeRecord.status = ACCEPTED (requires DELIVERED)
  requestChanges(reason)                             // ChangeRecord.status = CHANGES_REQUESTED, DELIVERED → EXECUTING

Existing method kept:
  markDelivered()                                    // Manual DRAFT/EXECUTING → DELIVERED (no Change Record)
```

### REST Endpoints (new)
```
POST /tickets/:id/execution-events     → RecordExecutionEventUseCase
POST /tickets/:id/settle               → SubmitSettlementUseCase
POST /tickets/:id/review-delivery      → ReviewDeliveryUseCase
```

---

## File Structure

**New files (domain):**
- `backend/src/tickets/domain/value-objects/ExecutionEvent.ts` — ExecutionEvent interface + factory
- `backend/src/tickets/domain/value-objects/ChangeRecord.ts` — ChangeRecord, ChangeRecordStatus, FileChange, Divergence
- `backend/src/tickets/domain/value-objects/ExecutionEvent.spec.ts` — tests
- `backend/src/tickets/domain/value-objects/ChangeRecord.spec.ts` — tests

**New files (application):**
- `backend/src/tickets/application/use-cases/RecordExecutionEventUseCase.ts`
- `backend/src/tickets/application/use-cases/RecordExecutionEventUseCase.spec.ts`
- `backend/src/tickets/application/use-cases/SubmitSettlementUseCase.ts`
- `backend/src/tickets/application/use-cases/SubmitSettlementUseCase.spec.ts`
- `backend/src/tickets/application/use-cases/ReviewDeliveryUseCase.ts`
- `backend/src/tickets/application/use-cases/ReviewDeliveryUseCase.spec.ts`

**New files (presentation):**
- `backend/src/tickets/presentation/dto/RecordExecutionEventDto.ts`
- `backend/src/tickets/presentation/dto/SubmitSettlementDto.ts`
- `backend/src/tickets/presentation/dto/ReviewDeliveryDto.ts`

**Modified files:**
- `backend/src/tickets/domain/aec/AEC.ts` — new fields + methods
- `backend/src/tickets/domain/aec/AEC.spec.ts` — new tests
- `backend/src/tickets/infrastructure/persistence/mappers/AECMapper.ts` — new fields
- `backend/src/tickets/presentation/controllers/tickets.controller.ts` — new endpoints
- `backend/src/tickets/tickets.module.ts` — register new use cases
- `client/src/services/ticket.service.ts` — add ChangeRecord to AECResponse type

**Frontend (new):**
- `client/src/tickets/components/detail/ChangeRecordTab.tsx` — the Delivered tab content
- `client/src/tickets/components/detail/DivergenceCard.tsx` — divergence display component

---

### Task 1: Create ExecutionEvent value object

**Files:**
- Create: `backend/src/tickets/domain/value-objects/ExecutionEvent.ts`
- Create: `backend/src/tickets/domain/value-objects/ExecutionEvent.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// ExecutionEvent.spec.ts
import { ExecutionEvent, ExecutionEventType, createExecutionEvent } from './ExecutionEvent';

describe('ExecutionEvent', () => {
  it('creates a decision event with all fields', () => {
    const event = createExecutionEvent({
      type: ExecutionEventType.DECISION,
      title: 'Used token bucket algorithm',
      description: 'Chose token bucket over sliding window for better burst handling',
    });

    expect(event.id).toMatch(/^evt_/);
    expect(event.type).toBe('decision');
    expect(event.title).toBe('Used token bucket algorithm');
    expect(event.description).toContain('token bucket');
    expect(event.createdAt).toBeInstanceOf(Date);
  });

  it('creates a risk event', () => {
    const event = createExecutionEvent({
      type: ExecutionEventType.RISK,
      title: 'Added Redis dependency',
      description: 'Rate limiting requires Redis, which is not in the current stack',
    });

    expect(event.type).toBe('risk');
  });

  it('creates a scope_change event', () => {
    const event = createExecutionEvent({
      type: ExecutionEventType.SCOPE_CHANGE,
      title: 'Added burst recovery',
      description: 'Added burst recovery mechanism not in original spec',
    });

    expect(event.type).toBe('scope_change');
  });

  it('throws if title is empty', () => {
    expect(() =>
      createExecutionEvent({
        type: ExecutionEventType.DECISION,
        title: '',
        description: 'Some description',
      }),
    ).toThrow('Title is required');
  });

  it('throws if description is empty', () => {
    expect(() =>
      createExecutionEvent({
        type: ExecutionEventType.DECISION,
        title: 'Some title',
        description: '',
      }),
    ).toThrow('Description is required');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest --testPathPattern='ExecutionEvent.spec' --verbose`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// ExecutionEvent.ts
import { randomUUID } from 'crypto';

export enum ExecutionEventType {
  DECISION = 'decision',
  RISK = 'risk',
  SCOPE_CHANGE = 'scope_change',
}

export interface ExecutionEvent {
  id: string;
  type: ExecutionEventType;
  title: string;
  description: string;
  createdAt: Date;
}

export interface CreateExecutionEventInput {
  type: ExecutionEventType;
  title: string;
  description: string;
}

export function createExecutionEvent(input: CreateExecutionEventInput): ExecutionEvent {
  if (!input.title || input.title.trim().length === 0) {
    throw new Error('Title is required');
  }
  if (!input.description || input.description.trim().length === 0) {
    throw new Error('Description is required');
  }

  return {
    id: `evt_${randomUUID()}`,
    type: input.type,
    title: input.title.trim(),
    description: input.description.trim(),
    createdAt: new Date(),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx jest --testPathPattern='ExecutionEvent.spec' --verbose`
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/tickets/domain/value-objects/ExecutionEvent.ts \
       backend/src/tickets/domain/value-objects/ExecutionEvent.spec.ts
git commit -m "feat: add ExecutionEvent value object

Structured events reported by the developer agent during EXECUTING:
decision, risk, scope_change. Factory function with validation."
```

---

### Task 2: Create ChangeRecord value object

**Files:**
- Create: `backend/src/tickets/domain/value-objects/ChangeRecord.ts`
- Create: `backend/src/tickets/domain/value-objects/ChangeRecord.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// ChangeRecord.spec.ts
import {
  ChangeRecord,
  ChangeRecordStatus,
  FileChange,
  Divergence,
  createChangeRecord,
  acceptChangeRecord,
  requestChangesOnRecord,
} from './ChangeRecord';
import { ExecutionEvent, ExecutionEventType } from './ExecutionEvent';

describe('ChangeRecord', () => {
  const sampleEvents: ExecutionEvent[] = [
    {
      id: 'evt_1',
      type: ExecutionEventType.DECISION,
      title: 'Used token bucket',
      description: 'Better burst handling',
      createdAt: new Date(),
    },
    {
      id: 'evt_2',
      type: ExecutionEventType.RISK,
      title: 'Redis dependency',
      description: 'Requires Redis',
      createdAt: new Date(),
    },
  ];

  const sampleFiles: FileChange[] = [
    { path: 'src/auth/rate-limit.service.ts', additions: 142, deletions: 0 },
    { path: 'src/auth/auth.guard.ts', additions: 18, deletions: 8 },
  ];

  const sampleDivergences: Divergence[] = [
    {
      area: 'Rate limiting algorithm',
      intended: 'Sliding window counter',
      actual: 'Token bucket algorithm',
      justification: 'Better burst handling with same rate limit behavior',
    },
  ];

  it('creates a change record with AWAITING_REVIEW status', () => {
    const record = createChangeRecord({
      executionSummary: 'Added rate limiting to auth service',
      events: sampleEvents,
      filesChanged: sampleFiles,
      divergences: sampleDivergences,
    });

    expect(record.status).toBe(ChangeRecordStatus.AWAITING_REVIEW);
    expect(record.executionSummary).toBe('Added rate limiting to auth service');
    expect(record.filesChanged).toHaveLength(2);
    expect(record.divergences).toHaveLength(1);
    expect(record.hasDivergence).toBe(true);
    expect(record.decisions).toHaveLength(1);
    expect(record.risks).toHaveLength(1);
    expect(record.scopeChanges).toHaveLength(0);
    expect(record.reviewNote).toBeNull();
    expect(record.reviewedAt).toBeNull();
    expect(record.submittedAt).toBeInstanceOf(Date);
  });

  it('sets hasDivergence false when no divergences', () => {
    const record = createChangeRecord({
      executionSummary: 'Implemented as specified',
      events: [],
      filesChanged: sampleFiles,
      divergences: [],
    });

    expect(record.hasDivergence).toBe(false);
  });

  it('throws if executionSummary is empty', () => {
    expect(() =>
      createChangeRecord({
        executionSummary: '',
        events: [],
        filesChanged: [],
        divergences: [],
      }),
    ).toThrow('Execution summary is required');
  });

  describe('accept', () => {
    it('transitions AWAITING_REVIEW → ACCEPTED', () => {
      const record = createChangeRecord({
        executionSummary: 'Done',
        events: [],
        filesChanged: [],
        divergences: [],
      });

      const accepted = acceptChangeRecord(record);

      expect(accepted.status).toBe(ChangeRecordStatus.ACCEPTED);
      expect(accepted.reviewedAt).toBeInstanceOf(Date);
    });
  });

  describe('requestChanges', () => {
    it('transitions AWAITING_REVIEW → CHANGES_REQUESTED with note', () => {
      const record = createChangeRecord({
        executionSummary: 'Done',
        events: [],
        filesChanged: [],
        divergences: [],
      });

      const rejected = requestChangesOnRecord(record, 'Please use sliding window as specified');

      expect(rejected.status).toBe(ChangeRecordStatus.CHANGES_REQUESTED);
      expect(rejected.reviewNote).toBe('Please use sliding window as specified');
      expect(rejected.reviewedAt).toBeInstanceOf(Date);
    });

    it('throws if note is empty', () => {
      const record = createChangeRecord({
        executionSummary: 'Done',
        events: [],
        filesChanged: [],
        divergences: [],
      });

      expect(() => requestChangesOnRecord(record, '')).toThrow('Review note is required');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest --testPathPattern='ChangeRecord.spec' --verbose`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// ChangeRecord.ts
import { ExecutionEvent, ExecutionEventType } from './ExecutionEvent';

export enum ChangeRecordStatus {
  AWAITING_REVIEW = 'awaiting_review',
  ACCEPTED = 'accepted',
  CHANGES_REQUESTED = 'changes_requested',
}

export interface FileChange {
  path: string;
  additions: number;
  deletions: number;
}

export interface Divergence {
  area: string;
  intended: string;
  actual: string;
  justification: string;
}

export interface ChangeRecord {
  executionSummary: string;
  decisions: ExecutionEvent[];
  risks: ExecutionEvent[];
  scopeChanges: ExecutionEvent[];
  filesChanged: FileChange[];
  divergences: Divergence[];
  hasDivergence: boolean;
  status: ChangeRecordStatus;
  reviewNote: string | null;
  reviewedAt: Date | null;
  submittedAt: Date;
}

export interface CreateChangeRecordInput {
  executionSummary: string;
  events: ExecutionEvent[];
  filesChanged: FileChange[];
  divergences: Divergence[];
}

export function createChangeRecord(input: CreateChangeRecordInput): ChangeRecord {
  if (!input.executionSummary || input.executionSummary.trim().length === 0) {
    throw new Error('Execution summary is required');
  }

  return {
    executionSummary: input.executionSummary.trim(),
    decisions: input.events.filter((e) => e.type === ExecutionEventType.DECISION),
    risks: input.events.filter((e) => e.type === ExecutionEventType.RISK),
    scopeChanges: input.events.filter((e) => e.type === ExecutionEventType.SCOPE_CHANGE),
    filesChanged: input.filesChanged,
    divergences: input.divergences,
    hasDivergence: input.divergences.length > 0,
    status: ChangeRecordStatus.AWAITING_REVIEW,
    reviewNote: null,
    reviewedAt: null,
    submittedAt: new Date(),
  };
}

export function acceptChangeRecord(record: ChangeRecord): ChangeRecord {
  return {
    ...record,
    status: ChangeRecordStatus.ACCEPTED,
    reviewedAt: new Date(),
  };
}

export function requestChangesOnRecord(record: ChangeRecord, note: string): ChangeRecord {
  if (!note || note.trim().length === 0) {
    throw new Error('Review note is required when requesting changes');
  }

  return {
    ...record,
    status: ChangeRecordStatus.CHANGES_REQUESTED,
    reviewNote: note.trim(),
    reviewedAt: new Date(),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx jest --testPathPattern='ChangeRecord.spec' --verbose`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/tickets/domain/value-objects/ChangeRecord.ts \
       backend/src/tickets/domain/value-objects/ChangeRecord.spec.ts
git commit -m "feat: add ChangeRecord value object with review status

ChangeRecord captures: execution summary, decisions, risks, scope changes,
file diffs, divergences. Status: awaiting_review → accepted | changes_requested."
```

---

### Task 3: Add execution events + change record to AEC domain

**Files:**
- Modify: `backend/src/tickets/domain/aec/AEC.ts`
- Modify: `backend/src/tickets/domain/aec/AEC.spec.ts`

- [ ] **Step 1: Add imports to AEC.ts**

At the top of `AEC.ts`, add:
```typescript
import { ExecutionEvent, createExecutionEvent, CreateExecutionEventInput } from '../value-objects/ExecutionEvent';
import {
  ChangeRecord,
  ChangeRecordStatus,
  FileChange,
  Divergence,
  createChangeRecord,
  acceptChangeRecord,
  requestChangesOnRecord,
} from '../value-objects/ChangeRecord';
```

- [ ] **Step 2: Add new private fields to AEC constructor**

After `private _generationJobId: string | null = null,` (line 93), add:
```typescript
    private _executionEvents: ExecutionEvent[] = [],
    private _changeRecord: ChangeRecord | null = null,
```

- [ ] **Step 3: No changes needed to `createDraft`**

The new constructor fields (`_executionEvents` and `_changeRecord`) have default values (`= []` and `= null`), so `createDraft` does not need to pass them — TypeScript uses the defaults.

- [ ] **Step 4: Update `reconstitute` factory — add new parameters**

Add to the end of the `reconstitute` parameter list, **after the existing `approvedAt?: Date | null` parameter** (the last param):
```typescript
    executionEvents?: ExecutionEvent[],
    changeRecord?: ChangeRecord | null,
```

And in the `reconstitute` constructor call, add **after the existing `generationJobId ?? null` line** (the last arg passed to the constructor):
```typescript
      executionEvents ?? [],
      changeRecord ?? null,
```

Important: `_previousStatus` and `_generationJobId` come before the new fields in the constructor. The reconstitute call already passes them. The new values go at the very end of both the parameter list and the constructor call.

- [ ] **Step 5: Add `recordExecutionEvent()` domain method**

```typescript
  /**
   * Record an execution event during implementation.
   * Events accumulate and are later aggregated into a Change Record.
   */
  recordExecutionEvent(input: CreateExecutionEventInput): ExecutionEvent {
    if (this._status !== AECStatus.EXECUTING) {
      throw new InvalidStateTransitionError(
        `Cannot record execution event in ${this._status} status. Ticket must be EXECUTING.`,
      );
    }
    const event = createExecutionEvent(input);
    this._executionEvents.push(event);
    this._updatedAt = new Date();
    return event;
  }
```

- [ ] **Step 6: Add `deliver()` domain method**

```typescript
  /**
   * Deliver the ticket with a Change Record.
   * Aggregates execution events + settlement payload into a ChangeRecord.
   * Transitions EXECUTING → DELIVERED.
   */
  deliver(settlement: {
    executionSummary: string;
    filesChanged: FileChange[];
    divergences: Divergence[];
  }): void {
    if (this._status !== AECStatus.EXECUTING) {
      throw new InvalidStateTransitionError(
        `Cannot deliver from ${this._status}. Ticket must be EXECUTING.`,
      );
    }

    this._changeRecord = createChangeRecord({
      executionSummary: settlement.executionSummary,
      events: this._executionEvents,
      filesChanged: settlement.filesChanged,
      divergences: settlement.divergences,
    });
    this._status = AECStatus.DELIVERED;
    this._updatedAt = new Date();
  }
```

- [ ] **Step 7: Add `acceptDelivery()` domain method**

```typescript
  /**
   * PM accepts the delivery. Sets Change Record status to ACCEPTED.
   */
  acceptDelivery(): void {
    if (this._status !== AECStatus.DELIVERED) {
      throw new InvalidStateTransitionError(
        `Cannot accept delivery in ${this._status} status. Ticket must be DELIVERED.`,
      );
    }
    if (!this._changeRecord) {
      throw new InvalidStateTransitionError(
        'Cannot accept delivery without a Change Record.',
      );
    }
    if (this._changeRecord.status !== ChangeRecordStatus.AWAITING_REVIEW) {
      throw new InvalidStateTransitionError(
        `Cannot accept delivery — Change Record is already ${this._changeRecord.status}.`,
      );
    }
    this._changeRecord = acceptChangeRecord(this._changeRecord);
    this._updatedAt = new Date();
  }
```

- [ ] **Step 8: Add `requestChanges()` domain method**

```typescript
  /**
   * PM requests changes on the delivery. Sends ticket back to EXECUTING.
   * The Change Record is preserved with CHANGES_REQUESTED status for reference.
   */
  requestChanges(note: string): void {
    if (this._status !== AECStatus.DELIVERED) {
      throw new InvalidStateTransitionError(
        `Cannot request changes in ${this._status} status. Ticket must be DELIVERED.`,
      );
    }
    if (!this._changeRecord) {
      throw new InvalidStateTransitionError(
        'Cannot request changes without a Change Record.',
      );
    }
    if (this._changeRecord.status !== ChangeRecordStatus.AWAITING_REVIEW) {
      throw new InvalidStateTransitionError(
        `Cannot request changes — Change Record is already ${this._changeRecord.status}.`,
      );
    }
    this._changeRecord = requestChangesOnRecord(this._changeRecord, note);
    this._executionEvents = []; // Clear events for the next round
    this._status = AECStatus.EXECUTING;
    this._updatedAt = new Date();
  }
```

- [ ] **Step 9: Add getters**

```typescript
  get executionEvents(): ExecutionEvent[] {
    return [...this._executionEvents];
  }

  get changeRecord(): ChangeRecord | null {
    return this._changeRecord;
  }
```

- [ ] **Step 10: Write domain tests for new methods**

Add to `AEC.spec.ts`:

```typescript
import { ExecutionEventType } from '../value-objects/ExecutionEvent';
import { ChangeRecordStatus } from '../value-objects/ChangeRecord';

describe('AEC — Execution Events & Change Record', () => {
  describe('recordExecutionEvent()', () => {
    it('records an event when EXECUTING', () => {
      const aec = makeAEC({ status: AECStatus.EXECUTING });
      const event = aec.recordExecutionEvent({
        type: ExecutionEventType.DECISION,
        title: 'Used token bucket',
        description: 'Better burst handling',
      });

      expect(event.id).toMatch(/^evt_/);
      expect(aec.executionEvents).toHaveLength(1);
    });

    it('throws if not EXECUTING', () => {
      const aec = makeAEC({ status: AECStatus.APPROVED });
      expect(() =>
        aec.recordExecutionEvent({
          type: ExecutionEventType.DECISION,
          title: 'test',
          description: 'test',
        }),
      ).toThrow('EXECUTING');
    });
  });

  describe('deliver()', () => {
    it('creates Change Record and transitions to DELIVERED', () => {
      const aec = makeAEC({ status: AECStatus.EXECUTING });
      aec.recordExecutionEvent({
        type: ExecutionEventType.DECISION,
        title: 'Used token bucket',
        description: 'Better burst handling',
      });

      aec.deliver({
        executionSummary: 'Added rate limiting',
        filesChanged: [{ path: 'src/rate-limit.ts', additions: 100, deletions: 0 }],
        divergences: [],
      });

      expect(aec.status).toBe(AECStatus.DELIVERED);
      expect(aec.changeRecord).not.toBeNull();
      expect(aec.changeRecord!.status).toBe(ChangeRecordStatus.AWAITING_REVIEW);
      expect(aec.changeRecord!.decisions).toHaveLength(1);
      expect(aec.changeRecord!.hasDivergence).toBe(false);
    });

    it('throws if not EXECUTING', () => {
      const aec = makeAEC({ status: AECStatus.APPROVED });
      expect(() =>
        aec.deliver({
          executionSummary: 'Done',
          filesChanged: [],
          divergences: [],
        }),
      ).toThrow('EXECUTING');
    });
  });

  describe('acceptDelivery()', () => {
    it('sets Change Record to ACCEPTED', () => {
      const aec = makeAEC({ status: AECStatus.EXECUTING });
      aec.deliver({
        executionSummary: 'Done',
        filesChanged: [],
        divergences: [],
      });

      aec.acceptDelivery();

      expect(aec.changeRecord!.status).toBe(ChangeRecordStatus.ACCEPTED);
      expect(aec.changeRecord!.reviewedAt).toBeInstanceOf(Date);
      expect(aec.status).toBe(AECStatus.DELIVERED); // stays DELIVERED
    });

    it('throws if no Change Record', () => {
      const aec = makeAEC({ status: AECStatus.DELIVERED });
      expect(() => aec.acceptDelivery()).toThrow('Change Record');
    });
  });

  describe('requestChanges()', () => {
    it('sends ticket back to EXECUTING with note', () => {
      const aec = makeAEC({ status: AECStatus.EXECUTING });
      aec.deliver({
        executionSummary: 'Done',
        filesChanged: [],
        divergences: [],
      });

      aec.requestChanges('Please use sliding window as specified');

      expect(aec.status).toBe(AECStatus.EXECUTING);
      expect(aec.changeRecord!.status).toBe(ChangeRecordStatus.CHANGES_REQUESTED);
      expect(aec.changeRecord!.reviewNote).toBe('Please use sliding window as specified');
      expect(aec.executionEvents).toHaveLength(0); // events cleared
    });

    it('throws if not DELIVERED', () => {
      const aec = makeAEC({ status: AECStatus.EXECUTING });
      expect(() => aec.requestChanges('fix it')).toThrow('DELIVERED');
    });
  });
});
```

- [ ] **Step 11: Run tests**

Run: `cd backend && npx jest --testPathPattern='AEC.spec' --verbose`
Expected: All tests pass.

- [ ] **Step 12: Commit**

```bash
git add backend/src/tickets/domain/aec/AEC.ts \
       backend/src/tickets/domain/aec/AEC.spec.ts
git commit -m "feat: add execution events and Change Record to AEC domain

New methods: recordExecutionEvent(), deliver(), acceptDelivery(), requestChanges().
Events accumulate during EXECUTING, aggregated into ChangeRecord on delivery.
PM can accept or request changes (sends back to EXECUTING)."
```

---

### Task 4: Update Firestore mapper

**Files:**
- Modify: `backend/src/tickets/infrastructure/persistence/mappers/AECMapper.ts`

- [ ] **Step 1: Add ExecutionEvent and ChangeRecord types to AECDocument interface**

Add after the `forgedAt` field (around line 100):
```typescript
  executionEvents?: any[];
  changeRecord?: {
    executionSummary: string;
    decisions: any[];
    risks: any[];
    scopeChanges: any[];
    filesChanged: any[];
    divergences: any[];
    hasDivergence: boolean;
    status: string;
    reviewNote: string | null;
    reviewedAt: Timestamp | null;
    submittedAt: Timestamp;
  } | null;
```

- [ ] **Step 2: Update `toDomain()` — pass new fields to reconstitute**

At the end of the `AEC.reconstitute()` call in `toDomain()`, add the new parameters:
```typescript
      // Execution events — stored as plain objects, dates need conversion
      (doc.executionEvents || []).map((e: any) => ({
        ...e,
        createdAt: toDate(e.createdAt),
      })),
      // Change Record
      doc.changeRecord
        ? {
            ...doc.changeRecord,
            reviewedAt: doc.changeRecord.reviewedAt ? toDate(doc.changeRecord.reviewedAt) : null,
            submittedAt: toDate(doc.changeRecord.submittedAt),
          }
        : null,
```

- [ ] **Step 3: Update `toFirestore()` — persist new fields**

In the `toFirestore()` return object, add:
```typescript
      executionEvents: aec.executionEvents.map((e) => ({
        ...e,
        createdAt: Timestamp.fromDate(e.createdAt),
      })),
      changeRecord: aec.changeRecord
        ? {
            ...aec.changeRecord,
            reviewedAt: aec.changeRecord.reviewedAt
              ? Timestamp.fromDate(aec.changeRecord.reviewedAt)
              : null,
            submittedAt: Timestamp.fromDate(aec.changeRecord.submittedAt),
            // Convert event dates within the record
            decisions: aec.changeRecord.decisions.map((e) => ({
              ...e,
              createdAt: Timestamp.fromDate(e.createdAt),
            })),
            risks: aec.changeRecord.risks.map((e) => ({
              ...e,
              createdAt: Timestamp.fromDate(e.createdAt),
            })),
            scopeChanges: aec.changeRecord.scopeChanges.map((e) => ({
              ...e,
              createdAt: Timestamp.fromDate(e.createdAt),
            })),
          }
        : null,
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/tickets/infrastructure/persistence/mappers/AECMapper.ts
git commit -m "feat: add execution events and Change Record to Firestore mapper

Backward compatible — old documents without these fields get empty defaults."
```

---

### Task 5: Create RecordExecutionEventUseCase + endpoint

**Files:**
- Create: `backend/src/tickets/application/use-cases/RecordExecutionEventUseCase.ts`
- Create: `backend/src/tickets/application/use-cases/RecordExecutionEventUseCase.spec.ts`
- Create: `backend/src/tickets/presentation/dto/RecordExecutionEventDto.ts`
- Modify: `backend/src/tickets/presentation/controllers/tickets.controller.ts`
- Modify: `backend/src/tickets/tickets.module.ts`

- [ ] **Step 1: Write the DTO**

```typescript
// RecordExecutionEventDto.ts
import { IsString, IsIn, IsNotEmpty } from 'class-validator';

export class RecordExecutionEventDto {
  @IsIn(['decision', 'risk', 'scope_change'])
  type: 'decision' | 'risk' | 'scope_change';

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
```

- [ ] **Step 2: Write the failing use case test**

```typescript
// RecordExecutionEventUseCase.spec.ts
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { RecordExecutionEventUseCase } from './RecordExecutionEventUseCase';
import { AECStatus } from '../../domain/value-objects/AECStatus';

const TEAM_ID = 'team_abc';
const TICKET_ID = 'aec_001';

function makeMockAEC(overrides: { status?: AECStatus; teamId?: string } = {}) {
  return {
    id: TICKET_ID,
    teamId: overrides.teamId ?? TEAM_ID,
    status: overrides.status ?? AECStatus.EXECUTING,
    recordExecutionEvent: jest.fn().mockReturnValue({ id: 'evt_1', type: 'decision' }),
  };
}

describe('RecordExecutionEventUseCase', () => {
  let aecRepository: { findById: jest.Mock; save: jest.Mock };
  let useCase: RecordExecutionEventUseCase;

  beforeEach(() => {
    aecRepository = {
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new RecordExecutionEventUseCase(aecRepository as any);
  });

  it('records event and saves', async () => {
    const mockAEC = makeMockAEC({});
    aecRepository.findById.mockResolvedValue(mockAEC);

    const result = await useCase.execute({
      ticketId: TICKET_ID,
      teamId: TEAM_ID,
      type: 'decision',
      title: 'Used token bucket',
      description: 'Better burst handling',
    });

    expect(mockAEC.recordExecutionEvent).toHaveBeenCalledWith({
      type: 'decision',
      title: 'Used token bucket',
      description: 'Better burst handling',
    });
    expect(aecRepository.save).toHaveBeenCalledWith(mockAEC);
    expect(result.success).toBe(true);
  });

  it('throws NotFoundException when ticket not found', async () => {
    aecRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ ticketId: 'aec_xxx', teamId: TEAM_ID, type: 'risk', title: 't', description: 'd' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException on team mismatch', async () => {
    aecRepository.findById.mockResolvedValue(makeMockAEC({ teamId: 'other_team' }));

    await expect(
      useCase.execute({ ticketId: TICKET_ID, teamId: TEAM_ID, type: 'risk', title: 't', description: 'd' }),
    ).rejects.toThrow(ForbiddenException);
  });
});
```

- [ ] **Step 3: Write the use case**

```typescript
// RecordExecutionEventUseCase.ts
import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject } from '@nestjs/common';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { InvalidStateTransitionError } from '../../../shared/domain/exceptions/DomainExceptions';
import { ExecutionEventType } from '../../domain/value-objects/ExecutionEvent';

export interface RecordExecutionEventCommand {
  ticketId: string;
  teamId: string;
  type: string;
  title: string;
  description: string;
}

@Injectable()
export class RecordExecutionEventUseCase {
  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
  ) {}

  async execute(command: RecordExecutionEventCommand) {
    const aec = await this.aecRepository.findById(command.ticketId);
    if (!aec) {
      throw new NotFoundException(`Ticket ${command.ticketId} not found`);
    }

    if (aec.teamId !== command.teamId) {
      throw new ForbiddenException('Ticket does not belong to your workspace');
    }

    try {
      const event = aec.recordExecutionEvent({
        type: command.type as ExecutionEventType,
        title: command.title,
        description: command.description,
      });

      await this.aecRepository.save(aec);

      return { success: true, eventId: event.id, ticketId: aec.id };
    } catch (error) {
      if (error instanceof InvalidStateTransitionError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
```

- [ ] **Step 4: Add endpoint to tickets controller**

Add to `tickets.controller.ts`:
```typescript
  @Post(':id/execution-events')
  async recordExecutionEvent(
    @TeamId() teamId: string,
    @Param('id') id: string,
    @Body() dto: RecordExecutionEventDto,
  ) {
    const aecId = await this.resolveTicketId(id, teamId);
    return this.recordExecutionEventUseCase.execute({
      ticketId: aecId,
      teamId,
      type: dto.type,
      title: dto.title,
      description: dto.description,
    });
  }
```

- [ ] **Step 5: Register use case in tickets.module.ts**

Add `RecordExecutionEventUseCase` to providers array.

- [ ] **Step 6: Run tests**

Run: `cd backend && npx jest --testPathPattern='RecordExecutionEvent' --verbose`
Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add backend/src/tickets/application/use-cases/RecordExecutionEventUseCase.ts \
       backend/src/tickets/application/use-cases/RecordExecutionEventUseCase.spec.ts \
       backend/src/tickets/presentation/dto/RecordExecutionEventDto.ts \
       backend/src/tickets/presentation/controllers/tickets.controller.ts \
       backend/src/tickets/tickets.module.ts
git commit -m "feat: add POST /tickets/:id/execution-events endpoint

MCP tool report_decision/report_risk/report_scope_change maps to this endpoint.
Records structured execution events during EXECUTING status."
```

---

### Task 6: Create SubmitSettlementUseCase + endpoint

**Files:**
- Create: `backend/src/tickets/application/use-cases/SubmitSettlementUseCase.ts`
- Create: `backend/src/tickets/application/use-cases/SubmitSettlementUseCase.spec.ts`
- Create: `backend/src/tickets/presentation/dto/SubmitSettlementDto.ts`
- Modify: `backend/src/tickets/presentation/controllers/tickets.controller.ts`
- Modify: `backend/src/tickets/tickets.module.ts`

- [ ] **Step 1: Write the DTO**

```typescript
// SubmitSettlementDto.ts
import { IsString, IsNotEmpty, IsArray, ValidateNested, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class FileChangeDto {
  @IsString()
  @IsNotEmpty()
  path: string;

  @IsNumber()
  additions: number;

  @IsNumber()
  deletions: number;
}

export class DivergenceDto {
  @IsString()
  @IsNotEmpty()
  area: string;

  @IsString()
  @IsNotEmpty()
  intended: string;

  @IsString()
  @IsNotEmpty()
  actual: string;

  @IsString()
  @IsNotEmpty()
  justification: string;
}

export class SubmitSettlementDto {
  @IsString()
  @IsNotEmpty()
  executionSummary: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileChangeDto)
  filesChanged: FileChangeDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DivergenceDto)
  @IsOptional()
  divergences?: DivergenceDto[];
}
```

- [ ] **Step 2: Write the failing use case test**

```typescript
// SubmitSettlementUseCase.spec.ts
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { SubmitSettlementUseCase } from './SubmitSettlementUseCase';
import { AECStatus } from '../../domain/value-objects/AECStatus';

const TEAM_ID = 'team_abc';
const TICKET_ID = 'aec_001';

function makeMockAEC(overrides: { status?: AECStatus; teamId?: string } = {}) {
  return {
    id: TICKET_ID,
    teamId: overrides.teamId ?? TEAM_ID,
    status: overrides.status ?? AECStatus.EXECUTING,
    deliver: jest.fn(),
  };
}

describe('SubmitSettlementUseCase', () => {
  let aecRepository: { findById: jest.Mock; save: jest.Mock };
  let useCase: SubmitSettlementUseCase;

  beforeEach(() => {
    aecRepository = {
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new SubmitSettlementUseCase(aecRepository as any);
  });

  it('delivers ticket with settlement payload', async () => {
    const mockAEC = makeMockAEC({});
    aecRepository.findById.mockResolvedValue(mockAEC);

    const result = await useCase.execute({
      ticketId: TICKET_ID,
      teamId: TEAM_ID,
      executionSummary: 'Added rate limiting',
      filesChanged: [{ path: 'src/rate-limit.ts', additions: 100, deletions: 0 }],
      divergences: [],
    });

    expect(mockAEC.deliver).toHaveBeenCalledWith({
      executionSummary: 'Added rate limiting',
      filesChanged: [{ path: 'src/rate-limit.ts', additions: 100, deletions: 0 }],
      divergences: [],
    });
    expect(aecRepository.save).toHaveBeenCalledWith(mockAEC);
    expect(result.success).toBe(true);
  });

  it('throws NotFoundException when ticket not found', async () => {
    aecRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ ticketId: 'nope', teamId: TEAM_ID, executionSummary: 'x', filesChanged: [], divergences: [] }),
    ).rejects.toThrow(NotFoundException);
  });
});
```

- [ ] **Step 3: Write the use case**

```typescript
// SubmitSettlementUseCase.ts
import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject } from '@nestjs/common';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { InvalidStateTransitionError } from '../../../shared/domain/exceptions/DomainExceptions';
import { FileChange, Divergence } from '../../domain/value-objects/ChangeRecord';

export interface SubmitSettlementCommand {
  ticketId: string;
  teamId: string;
  executionSummary: string;
  filesChanged: FileChange[];
  divergences: Divergence[];
}

@Injectable()
export class SubmitSettlementUseCase {
  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
  ) {}

  async execute(command: SubmitSettlementCommand) {
    const aec = await this.aecRepository.findById(command.ticketId);
    if (!aec) {
      throw new NotFoundException(`Ticket ${command.ticketId} not found`);
    }

    if (aec.teamId !== command.teamId) {
      throw new ForbiddenException('Ticket does not belong to your workspace');
    }

    try {
      aec.deliver({
        executionSummary: command.executionSummary,
        filesChanged: command.filesChanged,
        divergences: command.divergences,
      });

      await this.aecRepository.save(aec);

      return { success: true, ticketId: aec.id, status: aec.status };
    } catch (error) {
      if (error instanceof InvalidStateTransitionError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
```

- [ ] **Step 4: Add endpoint to tickets controller**

```typescript
  @Post(':id/settle')
  async submitSettlement(
    @TeamId() teamId: string,
    @Param('id') id: string,
    @Body() dto: SubmitSettlementDto,
  ) {
    const aecId = await this.resolveTicketId(id, teamId);
    return this.submitSettlementUseCase.execute({
      ticketId: aecId,
      teamId,
      executionSummary: dto.executionSummary,
      filesChanged: dto.filesChanged,
      divergences: dto.divergences ?? [],
    });
  }
```

- [ ] **Step 5: Register use case in tickets.module.ts**

- [ ] **Step 6: Run tests**

Run: `cd backend && npx jest --testPathPattern='SubmitSettlement' --verbose`
Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add backend/src/tickets/application/use-cases/SubmitSettlementUseCase.ts \
       backend/src/tickets/application/use-cases/SubmitSettlementUseCase.spec.ts \
       backend/src/tickets/presentation/dto/SubmitSettlementDto.ts \
       backend/src/tickets/presentation/controllers/tickets.controller.ts \
       backend/src/tickets/tickets.module.ts
git commit -m "feat: add POST /tickets/:id/settle endpoint

MCP tool submit_settlement maps to this. Aggregates execution events into
a Change Record, transitions EXECUTING → DELIVERED."
```

---

### Task 7: Create ReviewDeliveryUseCase + endpoint

**Files:**
- Create: `backend/src/tickets/application/use-cases/ReviewDeliveryUseCase.ts`
- Create: `backend/src/tickets/application/use-cases/ReviewDeliveryUseCase.spec.ts`
- Create: `backend/src/tickets/presentation/dto/ReviewDeliveryDto.ts`
- Modify: `backend/src/tickets/presentation/controllers/tickets.controller.ts`
- Modify: `backend/src/tickets/tickets.module.ts`

- [ ] **Step 1: Write the DTO**

```typescript
// ReviewDeliveryDto.ts
import { IsString, IsIn, IsNotEmpty, ValidateIf } from 'class-validator';

export class ReviewDeliveryDto {
  @IsIn(['accept', 'request_changes'])
  action: 'accept' | 'request_changes';

  @ValidateIf((o) => o.action === 'request_changes')
  @IsString()
  @IsNotEmpty({ message: 'Note is required when requesting changes' })
  note?: string;
}
```

- [ ] **Step 2: Write the failing use case test**

```typescript
// ReviewDeliveryUseCase.spec.ts
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ReviewDeliveryUseCase } from './ReviewDeliveryUseCase';
import { AECStatus } from '../../domain/value-objects/AECStatus';

const TEAM_ID = 'team_abc';
const TICKET_ID = 'aec_001';

function makeMockAEC(overrides: { status?: AECStatus; teamId?: string } = {}) {
  return {
    id: TICKET_ID,
    teamId: overrides.teamId ?? TEAM_ID,
    status: overrides.status ?? AECStatus.DELIVERED,
    acceptDelivery: jest.fn(),
    requestChanges: jest.fn(),
  };
}

describe('ReviewDeliveryUseCase', () => {
  let aecRepository: { findById: jest.Mock; save: jest.Mock };
  let useCase: ReviewDeliveryUseCase;

  beforeEach(() => {
    aecRepository = {
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new ReviewDeliveryUseCase(aecRepository as any);
  });

  it('accepts delivery', async () => {
    const mockAEC = makeMockAEC({});
    aecRepository.findById.mockResolvedValue(mockAEC);

    const result = await useCase.execute({
      ticketId: TICKET_ID,
      teamId: TEAM_ID,
      action: 'accept',
    });

    expect(mockAEC.acceptDelivery).toHaveBeenCalledTimes(1);
    expect(mockAEC.requestChanges).not.toHaveBeenCalled();
    expect(aecRepository.save).toHaveBeenCalledWith(mockAEC);
    expect(result.success).toBe(true);
  });

  it('requests changes with note', async () => {
    const mockAEC = makeMockAEC({});
    aecRepository.findById.mockResolvedValue(mockAEC);

    const result = await useCase.execute({
      ticketId: TICKET_ID,
      teamId: TEAM_ID,
      action: 'request_changes',
      note: 'Use sliding window as specified',
    });

    expect(mockAEC.requestChanges).toHaveBeenCalledWith('Use sliding window as specified');
    expect(mockAEC.acceptDelivery).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  it('throws NotFoundException when ticket not found', async () => {
    aecRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ ticketId: 'nope', teamId: TEAM_ID, action: 'accept' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException on team mismatch', async () => {
    aecRepository.findById.mockResolvedValue(makeMockAEC({ teamId: 'other' }));

    await expect(
      useCase.execute({ ticketId: TICKET_ID, teamId: TEAM_ID, action: 'accept' }),
    ).rejects.toThrow(ForbiddenException);
  });
});
```

- [ ] **Step 3: Write the use case**

```typescript
// ReviewDeliveryUseCase.ts
import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject } from '@nestjs/common';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { InvalidStateTransitionError } from '../../../shared/domain/exceptions/DomainExceptions';

export interface ReviewDeliveryCommand {
  ticketId: string;
  teamId: string;
  action: 'accept' | 'request_changes';
  note?: string;
}

@Injectable()
export class ReviewDeliveryUseCase {
  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
  ) {}

  async execute(command: ReviewDeliveryCommand) {
    const aec = await this.aecRepository.findById(command.ticketId);
    if (!aec) {
      throw new NotFoundException(`Ticket ${command.ticketId} not found`);
    }

    if (aec.teamId !== command.teamId) {
      throw new ForbiddenException('Ticket does not belong to your workspace');
    }

    try {
      if (command.action === 'accept') {
        aec.acceptDelivery();
      } else {
        aec.requestChanges(command.note ?? '');
      }

      await this.aecRepository.save(aec);

      return { success: true, ticketId: aec.id, status: aec.status };
    } catch (error) {
      if (error instanceof InvalidStateTransitionError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
```

- [ ] **Step 4: Add endpoint to tickets controller**

```typescript
  @Post(':id/review-delivery')
  async reviewDelivery(
    @TeamId() teamId: string,
    @Param('id') id: string,
    @Body() dto: ReviewDeliveryDto,
  ) {
    const aecId = await this.resolveTicketId(id, teamId);
    return this.reviewDeliveryUseCase.execute({
      ticketId: aecId,
      teamId,
      action: dto.action,
      note: dto.note,
    });
  }
```

- [ ] **Step 5: Register use case in tickets.module.ts**

- [ ] **Step 6: Run tests**

Run: `cd backend && npx jest --testPathPattern='ReviewDelivery' --verbose`
Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add backend/src/tickets/application/use-cases/ReviewDeliveryUseCase.ts \
       backend/src/tickets/application/use-cases/ReviewDeliveryUseCase.spec.ts \
       backend/src/tickets/presentation/dto/ReviewDeliveryDto.ts \
       backend/src/tickets/presentation/controllers/tickets.controller.ts \
       backend/src/tickets/tickets.module.ts
git commit -m "feat: add POST /tickets/:id/review-delivery endpoint

PM can accept delivery or request changes. Accept sets ChangeRecord
to ACCEPTED. Request changes sends ticket back to EXECUTING."
```

---

### Task 8: Update frontend AECResponse type

**Files:**
- Modify: `client/src/services/ticket.service.ts`

- [ ] **Step 1: Add ChangeRecord types and fields to AECResponse**

Add new types:
```typescript
export interface FileChange {
  path: string;
  additions: number;
  deletions: number;
}

export interface Divergence {
  area: string;
  intended: string;
  actual: string;
  justification: string;
}

export interface ExecutionEventResponse {
  id: string;
  type: 'decision' | 'risk' | 'scope_change';
  title: string;
  description: string;
  createdAt: string;
}

export interface ChangeRecordResponse {
  executionSummary: string;
  decisions: ExecutionEventResponse[];
  risks: ExecutionEventResponse[];
  scopeChanges: ExecutionEventResponse[];
  filesChanged: FileChange[];
  divergences: Divergence[];
  hasDivergence: boolean;
  status: 'awaiting_review' | 'accepted' | 'changes_requested';
  reviewNote: string | null;
  reviewedAt: string | null;
  submittedAt: string;
}
```

Add to `AECResponse` interface:
```typescript
  executionEvents: ExecutionEventResponse[];
  changeRecord: ChangeRecordResponse | null;
```

- [ ] **Step 2: Add `reviewDelivery` API function**

```typescript
export async function reviewDelivery(
  ticketId: string,
  action: 'accept' | 'request_changes',
  note?: string,
): Promise<{ success: boolean }> {
  const response = await apiClient.post(`/tickets/${ticketId}/review-delivery`, {
    action,
    note,
  });
  return response.data;
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/services/ticket.service.ts
git commit -m "feat: add ChangeRecord types and reviewDelivery API to frontend service"
```

---

### Task 9: Create frontend ChangeRecord tab

**Files:**
- Create: `client/src/tickets/components/detail/ChangeRecordTab.tsx`
- Create: `client/src/tickets/components/detail/DivergenceCard.tsx`

- [ ] **Step 1: Create DivergenceCard component**

```tsx
// DivergenceCard.tsx
import type { Divergence } from '@/services/ticket.service';

export function DivergenceCard({ divergence }: { divergence: Divergence }) {
  return (
    <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3.5">
      <div className="flex items-start gap-2">
        <span className="text-amber-500 text-sm mt-0.5">⚡</span>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-[var(--text-primary)] mb-1">
            {divergence.area}
          </div>
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
                Intended
              </div>
              <div className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                {divergence.intended}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
                Actual
              </div>
              <div className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                {divergence.actual}
              </div>
            </div>
          </div>
          <div className="text-[12px] text-[var(--text-tertiary)] italic">
            {divergence.justification}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create ChangeRecordTab component**

```tsx
// ChangeRecordTab.tsx
'use client';

import { useState } from 'react';
import type { ChangeRecordResponse } from '@/services/ticket.service';
import { reviewDelivery } from '@/services/ticket.service';
import { DivergenceCard } from './DivergenceCard';

interface ChangeRecordTabProps {
  ticketId: string;
  changeRecord: ChangeRecordResponse;
  onUpdated: () => void;
}

export function ChangeRecordTab({ ticketId, changeRecord, onUpdated }: ChangeRecordTabProps) {
  const [loading, setLoading] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      await reviewDelivery(ticketId, 'accept');
      onUpdated();
    } finally {
      setLoading(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!rejectNote.trim()) return;
    setLoading(true);
    try {
      await reviewDelivery(ticketId, 'request_changes', rejectNote);
      onUpdated();
    } finally {
      setLoading(false);
    }
  };

  const isAwaitingReview = changeRecord.status === 'awaiting_review';

  return (
    <div className="space-y-5">
      {/* Status Banner */}
      <div className={`rounded-lg p-3.5 flex items-center justify-between border ${
        isAwaitingReview
          ? 'bg-amber-500/5 border-amber-500/15'
          : changeRecord.status === 'accepted'
            ? 'bg-green-500/5 border-green-500/15'
            : 'bg-red-500/5 border-red-500/15'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full ${
            isAwaitingReview ? 'bg-amber-500' : changeRecord.status === 'accepted' ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-sm text-[var(--text-secondary)]">
            {isAwaitingReview ? 'Awaiting PM review' : changeRecord.status === 'accepted' ? 'Accepted' : 'Changes requested'}
          </span>
        </div>
        {isAwaitingReview && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowRejectForm(!showRejectForm)}
              disabled={loading}
              className="bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] px-3 py-1.5 rounded-md text-[13px] hover:bg-[var(--bg-active)] transition-colors"
            >
              Request Changes
            </button>
            <button
              onClick={handleAccept}
              disabled={loading}
              className="bg-green-600 text-white px-3 py-1.5 rounded-md text-[13px] font-medium hover:bg-green-700 transition-colors"
            >
              Accept
            </button>
          </div>
        )}
      </div>

      {/* Reject form */}
      {showRejectForm && isAwaitingReview && (
        <div className="border border-[var(--border-subtle)] rounded-lg p-3.5 space-y-2.5">
          <textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="What needs to change?"
            className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-md p-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] resize-none"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowRejectForm(false)}
              className="text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            >
              Cancel
            </button>
            <button
              onClick={handleRequestChanges}
              disabled={loading || !rejectNote.trim()}
              className="bg-red-600 text-white px-3 py-1.5 rounded-md text-[13px] font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              Send Back
            </button>
          </div>
        </div>
      )}

      {/* Review note (if changes were requested) */}
      {changeRecord.reviewNote && (
        <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-3.5">
          <div className="text-[12px] uppercase tracking-wider text-red-500/60 mb-1">Changes Requested</div>
          <div className="text-[13px] text-[var(--text-secondary)]">{changeRecord.reviewNote}</div>
        </div>
      )}

      {/* Execution Summary */}
      <div className="border border-[var(--border-subtle)] rounded-lg p-4">
        <div className="text-sm font-semibold text-[var(--text-primary)] mb-2">Execution Summary</div>
        <div className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
          {changeRecord.executionSummary}
        </div>
      </div>

      {/* Divergences */}
      {changeRecord.divergences.length > 0 && (
        <div className="space-y-2.5">
          <div className="text-sm font-semibold text-[var(--text-primary)]">
            Divergences ({changeRecord.divergences.length})
          </div>
          {changeRecord.divergences.map((d, i) => (
            <DivergenceCard key={i} divergence={d} />
          ))}
        </div>
      )}

      {/* Decisions / Risks / Scope Changes */}
      {(changeRecord.decisions.length > 0 || changeRecord.risks.length > 0 || changeRecord.scopeChanges.length > 0) && (
        <div className="border border-[var(--border-subtle)] rounded-lg p-4 space-y-3">
          <div className="text-sm font-semibold text-[var(--text-primary)]">Execution Events</div>
          {changeRecord.decisions.map((e) => (
            <div key={e.id} className="flex gap-2 text-[13px]">
              <span className="text-purple-500 shrink-0">💡</span>
              <div>
                <span className="font-medium text-[var(--text-primary)]">{e.title}</span>
                <span className="text-[var(--text-tertiary)]"> — {e.description}</span>
              </div>
            </div>
          ))}
          {changeRecord.risks.map((e) => (
            <div key={e.id} className="flex gap-2 text-[13px]">
              <span className="text-amber-500 shrink-0">⚠️</span>
              <div>
                <span className="font-medium text-[var(--text-primary)]">{e.title}</span>
                <span className="text-[var(--text-tertiary)]"> — {e.description}</span>
              </div>
            </div>
          ))}
          {changeRecord.scopeChanges.map((e) => (
            <div key={e.id} className="flex gap-2 text-[13px]">
              <span className="text-blue-500 shrink-0">📐</span>
              <div>
                <span className="font-medium text-[var(--text-primary)]">{e.title}</span>
                <span className="text-[var(--text-tertiary)]"> — {e.description}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File Changes */}
      {changeRecord.filesChanged.length > 0 && (
        <div className="border border-[var(--border-subtle)] rounded-lg overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-[var(--text-primary)]">Code Changes</div>
            <span className="text-[12px] text-[var(--text-tertiary)] bg-[var(--bg-hover)] px-2 py-0.5 rounded-full">
              {changeRecord.filesChanged.length} files
            </span>
          </div>
          <div className="border-t border-[var(--border-subtle)] px-4 py-2 space-y-1">
            {changeRecord.filesChanged.map((f, i) => (
              <div key={i} className="flex justify-between items-center text-[12px] font-mono">
                <span className="text-[var(--text-tertiary)] truncate">{f.path}</span>
                <span className="shrink-0 ml-3">
                  {f.additions > 0 && <span className="text-green-500">+{f.additions}</span>}
                  {f.deletions > 0 && <span className="text-red-500 ml-1.5">-{f.deletions}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/tickets/components/detail/ChangeRecordTab.tsx \
       client/src/tickets/components/detail/DivergenceCard.tsx
git commit -m "feat: add ChangeRecordTab and DivergenceCard frontend components

Displays execution summary, divergences, events, file changes.
PM can accept or request changes from the status banner."
```

---

### Task 10: Wire ChangeRecordTab into ticket detail page

**Files:**
- Modify: `client/app/(main)/tickets/[id]/page.tsx`

- [ ] **Step 1: Import ChangeRecordTab**

Add import:
```typescript
import { ChangeRecordTab } from '@/tickets/components/detail/ChangeRecordTab';
```

- [ ] **Step 2: Add Delivered tab to the tab bar**

Find the existing tab bar (Spec, Design, Technical tabs). Add a conditional 4th tab that appears when the ticket has a Change Record:

```tsx
{ticket.changeRecord && (
  <button
    onClick={() => setActiveTab('delivered')}
    className={`px-4 py-2.5 text-sm border-b-2 transition-colors ${
      activeTab === 'delivered'
        ? 'border-purple-500 text-purple-500 font-semibold'
        : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
    }`}
  >
    📋 Delivered
    {ticket.changeRecord.hasDivergence && (
      <span className="ml-1.5 text-[11px] bg-amber-500/15 text-amber-500 px-1.5 py-0.5 rounded">⚡</span>
    )}
  </button>
)}
```

- [ ] **Step 3: Add tab content panel**

In the tab content area, add:
```tsx
{activeTab === 'delivered' && ticket.changeRecord && (
  <ChangeRecordTab
    ticketId={ticket.id}
    changeRecord={ticket.changeRecord}
    onUpdated={() => fetchTicket()}
  />
)}
```

- [ ] **Step 4: Commit**

```bash
git add client/app/\(main\)/tickets/\[id\]/page.tsx
git commit -m "feat: wire ChangeRecordTab into ticket detail page

Delivered tab appears when ticket has a Change Record.
Shows divergence badge on tab when divergences detected."
```

---

### Task 11: Update controller API response

**Files:**
- Modify: `backend/src/tickets/presentation/controllers/tickets.controller.ts`

- [ ] **Step 1: Add execution events and change record to API response**

Find the `toAECResponse` helper function. Add:
```typescript
      executionEvents: aec.executionEvents.map((e) => ({
        id: e.id,
        type: e.type,
        title: e.title,
        description: e.description,
        createdAt: e.createdAt.toISOString(),
      })),
      changeRecord: aec.changeRecord
        ? {
            executionSummary: aec.changeRecord.executionSummary,
            decisions: aec.changeRecord.decisions.map((e) => ({
              id: e.id, type: e.type, title: e.title, description: e.description,
              createdAt: e.createdAt.toISOString(),
            })),
            risks: aec.changeRecord.risks.map((e) => ({
              id: e.id, type: e.type, title: e.title, description: e.description,
              createdAt: e.createdAt.toISOString(),
            })),
            scopeChanges: aec.changeRecord.scopeChanges.map((e) => ({
              id: e.id, type: e.type, title: e.title, description: e.description,
              createdAt: e.createdAt.toISOString(),
            })),
            filesChanged: aec.changeRecord.filesChanged,
            divergences: aec.changeRecord.divergences,
            hasDivergence: aec.changeRecord.hasDivergence,
            status: aec.changeRecord.status,
            reviewNote: aec.changeRecord.reviewNote,
            reviewedAt: aec.changeRecord.reviewedAt?.toISOString() ?? null,
            submittedAt: aec.changeRecord.submittedAt.toISOString(),
          }
        : null,
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/tickets/presentation/controllers/tickets.controller.ts
git commit -m "feat: add execution events and Change Record to ticket API response"
```

---

### Task 12: Final verification

- [ ] **Step 1: Run full backend test suite**

Run: `cd backend && npx jest --verbose`
Expected: All tests pass.

- [ ] **Step 2: Run TypeScript build check (backend)**

Run: `cd backend && npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 3: Run TypeScript build check (frontend)**

Run: `cd client && npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 4: Search for any TODOs or incomplete wiring**

Run: `grep -rn 'TODO\|FIXME\|HACK' backend/src/tickets/ --include="*.ts" | grep -i 'change.record\|execution.event\|settle'`
Expected: No matches.

- [ ] **Step 5: Fix any remaining issues**

- [ ] **Step 6: Final commit (if needed)**

---

## Notes

### `markDelivered()` vs `deliver()`
Both methods transition to DELIVERED, but they serve different purposes:
- `deliver(settlement)` — normal flow via settlement (creates Change Record)
- `markDelivered()` — manual skip (PATCH endpoint, no Change Record)

Both are valid. A ticket can be DELIVERED with or without a Change Record.

### Execution Events During Re-execution
When a PM requests changes and the ticket goes back to EXECUTING:
- Old execution events are cleared (fresh start for new round)
- Old Change Record is preserved with CHANGES_REQUESTED status + review note
- On re-delivery, a new Change Record replaces the old one

### MCP Tool Mapping
The new endpoints map to MCP tools as follows:
- `report_decision` → POST `/tickets/:id/execution-events` with `type: 'decision'`
- `report_risk` → POST `/tickets/:id/execution-events` with `type: 'risk'`
- `report_scope_change` → POST `/tickets/:id/execution-events` with `type: 'scope_change'`
- `submit_settlement` → POST `/tickets/:id/settle`

The MCP server needs to add these tool definitions (separate from this plan — MCP server is in the CLI repo).

### Frontend Scope
This plan includes the Delivered tab on the ticket detail page. The project-level "Settlements overview" page (timeline feed showing all deliveries across tickets) is a separate plan.
