# Change Record Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Change Record domain model — a structured layer on top of git that captures intent-vs-result during execution, enabling PMs to review what was built against what was specified, without reading diffs.

**Architecture:** During EXECUTING, the agent reports structured events (decisions, risks, scope changes) via MCP. On settlement, these events are aggregated into a Change Record attached to the AEC. The ticket transitions to DELIVERED with the Change Record in AWAITING_REVIEW status. The PM reviews and either accepts or requests changes. No LLM processing needed — just structured data assembly.

**Tech Stack:** NestJS, TypeScript, Firestore, Next.js/React (Radix UI Tabs), @forge/shared-types

**Prerequisite:** Plan 1 (Lifecycle Status Rename) must be complete. This plan uses new status names: APPROVED, EXECUTING, DELIVERED.

---

## Data Model

### ExecutionEvent (reported during EXECUTING)
```typescript
{
  id: string;                    // auto-generated UUID
  type: 'decision' | 'risk' | 'scope_change';
  title: string;                 // short label (e.g. "Used token bucket over sliding window")
  description: string;           // detailed explanation
  reportedAt: Date;
}
```

### ChangeRecord (assembled on settlement)
```typescript
{
  status: 'awaiting_review' | 'accepted' | 'changes_requested';
  intentSummary: string;         // from AEC description at time of settlement
  resultSummary: string;         // from agent: what was actually built
  executionSummary: string;      // from agent: overall narrative
  divergences: Array<{
    area: string;                // what part diverged (e.g. "Rate limiting algorithm")
    intended: string;            // what the spec said
    actual: string;              // what was built instead
    rationale: string;           // why the agent deviated
  }>;
  codeChanges: Array<{
    filePath: string;
    additions: number;
    deletions: number;
  }>;
  settledAt: Date;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  reviewComment: string | null;
}
```

### API Endpoints
| Method | URL | Who | Purpose |
|--------|-----|-----|---------|
| POST | `/tickets/:id/execution-events` | Agent (MCP) | Report decision/risk/scope_change |
| POST | `/tickets/:id/settle` | Agent (MCP) | Submit settlement → DELIVERED |
| POST | `/tickets/:id/change-record/review` | PM (Web) | Accept or request changes |

Change Record data is returned as part of the existing `GET /tickets/:id` response — no separate endpoint needed.

---

## File Structure

**New files (domain):**
- `backend/src/tickets/domain/value-objects/ChangeRecordStatus.ts` — enum
- `backend/src/tickets/domain/value-objects/ExecutionEvent.ts` — value object
- `backend/src/tickets/domain/value-objects/ChangeRecord.ts` — value object

**New files (application):**
- `backend/src/tickets/application/use-cases/ReportExecutionEventUseCase.ts`
- `backend/src/tickets/application/use-cases/SubmitSettlementUseCase.ts`
- `backend/src/tickets/application/use-cases/ReviewChangeRecordUseCase.ts`

**New files (presentation):**
- `backend/src/tickets/presentation/dto/ReportExecutionEventDto.ts`
- `backend/src/tickets/presentation/dto/SubmitSettlementDto.ts`
- `backend/src/tickets/presentation/dto/ReviewChangeRecordDto.ts`

**New files (tests):**
- `backend/src/tickets/domain/value-objects/ChangeRecord.spec.ts`
- `backend/src/tickets/application/use-cases/ReportExecutionEventUseCase.spec.ts`
- `backend/src/tickets/application/use-cases/SubmitSettlementUseCase.spec.ts`
- `backend/src/tickets/application/use-cases/ReviewChangeRecordUseCase.spec.ts`

**New files (frontend):**
- `client/src/tickets/components/detail/DeliveredTab.tsx`

**Modified files:**
- `backend/src/tickets/domain/aec/AEC.ts` — new fields + 4 methods
- `backend/src/tickets/infrastructure/persistence/mappers/AECMapper.ts` — new fields
- `backend/src/tickets/presentation/controllers/tickets.controller.ts` — 4 endpoints
- `backend/src/tickets/tickets.module.ts` — register new use cases
- `backend/src/app.module.ts` — if needed
- `client/src/tickets/components/detail/TicketDetailLayout.tsx` — add 4th tab
- `client/src/services/ticket.service.ts` — add API methods + response types
- `packages/shared-types/src/types/index.ts` — export new types

---

### Task 1: Create ChangeRecordStatus enum

**Files:**
- Create: `backend/src/tickets/domain/value-objects/ChangeRecordStatus.ts`

- [ ] **Step 1: Create the enum file**

```typescript
export enum ChangeRecordStatus {
  AWAITING_REVIEW = 'awaiting_review',
  ACCEPTED = 'accepted',
  CHANGES_REQUESTED = 'changes_requested',
}
```

Write to `backend/src/tickets/domain/value-objects/ChangeRecordStatus.ts`.

- [ ] **Step 2: Export from shared types**

Add to `packages/shared-types/src/types/index.ts`:

```typescript
export type ChangeRecordStatus = 'awaiting_review' | 'accepted' | 'changes_requested';
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/tickets/domain/value-objects/ChangeRecordStatus.ts \
       packages/shared-types/src/types/index.ts
git commit -m "feat: add ChangeRecordStatus enum for delivery review flow"
```

---

### Task 2: Create ExecutionEvent value object

**Files:**
- Create: `backend/src/tickets/domain/value-objects/ExecutionEvent.ts`

- [ ] **Step 1: Create the value object**

```typescript
import { randomUUID } from 'crypto';

export type ExecutionEventType = 'decision' | 'risk' | 'scope_change';

export interface ExecutionEventProps {
  type: ExecutionEventType;
  title: string;
  description: string;
}

export class ExecutionEvent {
  readonly id: string;
  readonly type: ExecutionEventType;
  readonly title: string;
  readonly description: string;
  readonly reportedAt: Date;

  private constructor(
    id: string,
    type: ExecutionEventType,
    title: string,
    description: string,
    reportedAt: Date,
  ) {
    this.id = id;
    this.type = type;
    this.title = title;
    this.description = description;
    this.reportedAt = reportedAt;
  }

  static create(props: ExecutionEventProps): ExecutionEvent {
    if (!props.title || props.title.trim().length === 0) {
      throw new Error('ExecutionEvent title cannot be empty');
    }
    if (!props.description || props.description.trim().length === 0) {
      throw new Error('ExecutionEvent description cannot be empty');
    }
    return new ExecutionEvent(
      `evt_${randomUUID()}`,
      props.type,
      props.title.trim(),
      props.description.trim(),
      new Date(),
    );
  }

  static reconstitute(
    id: string,
    type: ExecutionEventType,
    title: string,
    description: string,
    reportedAt: Date,
  ): ExecutionEvent {
    return new ExecutionEvent(id, type, title, description, reportedAt);
  }

  toPlainObject(): Record<string, any> {
    return {
      id: this.id,
      type: this.type,
      title: this.title,
      description: this.description,
      reportedAt: this.reportedAt,
    };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/tickets/domain/value-objects/ExecutionEvent.ts
git commit -m "feat: add ExecutionEvent value object for agent-reported events"
```

---

### Task 3: Create ChangeRecord value object

**Files:**
- Create: `backend/src/tickets/domain/value-objects/ChangeRecord.ts`
- Create: `backend/src/tickets/domain/value-objects/ChangeRecord.spec.ts`

- [ ] **Step 1: Write failing test**

```typescript
import { ChangeRecord } from './ChangeRecord';
import { ChangeRecordStatus } from './ChangeRecordStatus';

describe('ChangeRecord', () => {
  const validProps = {
    intentSummary: 'Add rate limiting to auth service',
    resultSummary: 'Implemented rate limiting with token bucket',
    executionSummary: 'Rate limiting added using Redis-backed token bucket.',
    divergences: [
      {
        area: 'Algorithm choice',
        intended: 'Sliding window counter',
        actual: 'Token bucket',
        rationale: 'Better burst handling',
      },
    ],
    codeChanges: [
      { filePath: 'src/auth/rate-limit.service.ts', additions: 142, deletions: 0 },
    ],
  };

  describe('create()', () => {
    it('creates a ChangeRecord with AWAITING_REVIEW status', () => {
      const record = ChangeRecord.create(validProps);

      expect(record.status).toBe(ChangeRecordStatus.AWAITING_REVIEW);
      expect(record.intentSummary).toBe(validProps.intentSummary);
      expect(record.resultSummary).toBe(validProps.resultSummary);
      expect(record.executionSummary).toBe(validProps.executionSummary);
      expect(record.divergences).toHaveLength(1);
      expect(record.codeChanges).toHaveLength(1);
      expect(record.settledAt).toBeInstanceOf(Date);
      expect(record.reviewedAt).toBeNull();
      expect(record.reviewedBy).toBeNull();
    });
  });

  describe('accept()', () => {
    it('transitions to ACCEPTED', () => {
      const record = ChangeRecord.create(validProps);
      record.accept('user_pm1');

      expect(record.status).toBe(ChangeRecordStatus.ACCEPTED);
      expect(record.reviewedAt).toBeInstanceOf(Date);
      expect(record.reviewedBy).toBe('user_pm1');
    });

    it('throws if already accepted', () => {
      const record = ChangeRecord.create(validProps);
      record.accept('user_pm1');

      expect(() => record.accept('user_pm2')).toThrow();
    });
  });

  describe('requestChanges()', () => {
    it('transitions to CHANGES_REQUESTED', () => {
      const record = ChangeRecord.create(validProps);
      record.requestChanges('user_pm1', 'Use sliding window instead');

      expect(record.status).toBe(ChangeRecordStatus.CHANGES_REQUESTED);
      expect(record.reviewComment).toBe('Use sliding window instead');
      expect(record.reviewedBy).toBe('user_pm1');
    });
  });
});
```

Write to `backend/src/tickets/domain/value-objects/ChangeRecord.spec.ts`.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest --testPathPattern='ChangeRecord.spec' --verbose`
Expected: FAIL — ChangeRecord module not found.

- [ ] **Step 3: Implement ChangeRecord**

```typescript
import { ChangeRecordStatus } from './ChangeRecordStatus';

export interface Divergence {
  area: string;
  intended: string;
  actual: string;
  rationale: string;
}

export interface CodeChange {
  filePath: string;
  additions: number;
  deletions: number;
}

export interface ChangeRecordCreateProps {
  intentSummary: string;
  resultSummary: string;
  executionSummary: string;
  divergences: Divergence[];
  codeChanges: CodeChange[];
}

export class ChangeRecord {
  private _status: ChangeRecordStatus;
  private _reviewedAt: Date | null;
  private _reviewedBy: string | null;
  private _reviewComment: string | null;

  readonly intentSummary: string;
  readonly resultSummary: string;
  readonly executionSummary: string;
  readonly divergences: Divergence[];
  readonly codeChanges: CodeChange[];
  readonly settledAt: Date;

  private constructor(
    status: ChangeRecordStatus,
    intentSummary: string,
    resultSummary: string,
    executionSummary: string,
    divergences: Divergence[],
    codeChanges: CodeChange[],
    settledAt: Date,
    reviewedAt: Date | null,
    reviewedBy: string | null,
    reviewComment: string | null,
  ) {
    this._status = status;
    this.intentSummary = intentSummary;
    this.resultSummary = resultSummary;
    this.executionSummary = executionSummary;
    this.divergences = divergences;
    this.codeChanges = codeChanges;
    this.settledAt = settledAt;
    this._reviewedAt = reviewedAt;
    this._reviewedBy = reviewedBy;
    this._reviewComment = reviewComment;
  }

  static create(props: ChangeRecordCreateProps): ChangeRecord {
    return new ChangeRecord(
      ChangeRecordStatus.AWAITING_REVIEW,
      props.intentSummary,
      props.resultSummary,
      props.executionSummary,
      props.divergences,
      props.codeChanges,
      new Date(),
      null,
      null,
      null,
    );
  }

  static reconstitute(
    status: ChangeRecordStatus,
    intentSummary: string,
    resultSummary: string,
    executionSummary: string,
    divergences: Divergence[],
    codeChanges: CodeChange[],
    settledAt: Date,
    reviewedAt: Date | null,
    reviewedBy: string | null,
    reviewComment: string | null,
  ): ChangeRecord {
    return new ChangeRecord(
      status,
      intentSummary,
      resultSummary,
      executionSummary,
      divergences,
      codeChanges,
      settledAt,
      reviewedAt,
      reviewedBy,
      reviewComment,
    );
  }

  accept(reviewerId: string): void {
    if (this._status !== ChangeRecordStatus.AWAITING_REVIEW) {
      throw new Error(`Cannot accept Change Record in ${this._status} status`);
    }
    this._status = ChangeRecordStatus.ACCEPTED;
    this._reviewedAt = new Date();
    this._reviewedBy = reviewerId;
  }

  requestChanges(reviewerId: string, comment: string): void {
    if (this._status !== ChangeRecordStatus.AWAITING_REVIEW) {
      throw new Error(`Cannot request changes on Change Record in ${this._status} status`);
    }
    this._status = ChangeRecordStatus.CHANGES_REQUESTED;
    this._reviewedAt = new Date();
    this._reviewedBy = reviewerId;
    this._reviewComment = comment;
  }

  get status(): ChangeRecordStatus { return this._status; }
  get reviewedAt(): Date | null { return this._reviewedAt; }
  get reviewedBy(): string | null { return this._reviewedBy; }
  get reviewComment(): string | null { return this._reviewComment; }

  get hasDivergences(): boolean { return this.divergences.length > 0; }

  get totalAdditions(): number {
    return this.codeChanges.reduce((sum, c) => sum + c.additions, 0);
  }

  get totalDeletions(): number {
    return this.codeChanges.reduce((sum, c) => sum + c.deletions, 0);
  }

  toPlainObject(): Record<string, any> {
    return {
      status: this._status,
      intentSummary: this.intentSummary,
      resultSummary: this.resultSummary,
      executionSummary: this.executionSummary,
      divergences: this.divergences,
      codeChanges: this.codeChanges,
      settledAt: this.settledAt,
      reviewedAt: this._reviewedAt,
      reviewedBy: this._reviewedBy,
      reviewComment: this._reviewComment,
    };
  }
}
```

Write to `backend/src/tickets/domain/value-objects/ChangeRecord.ts`.

- [ ] **Step 4: Run tests**

Run: `cd backend && npx jest --testPathPattern='ChangeRecord.spec' --verbose`
Expected: All 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/src/tickets/domain/value-objects/ChangeRecord.ts \
       backend/src/tickets/domain/value-objects/ChangeRecord.spec.ts
git commit -m "feat: add ChangeRecord value object with review state machine"
```

---

### Task 4: Update AEC domain entity

**Files:**
- Modify: `backend/src/tickets/domain/aec/AEC.ts`

- [ ] **Step 1: Add imports**

At the top of AEC.ts, add:
```typescript
import { ExecutionEvent, ExecutionEventProps } from '../value-objects/ExecutionEvent';
import { ChangeRecord, ChangeRecordCreateProps } from '../value-objects/ChangeRecord';
import { ChangeRecordStatus } from '../value-objects/ChangeRecordStatus';
```

- [ ] **Step 2: Add private fields to constructor**

At the very end of the constructor parameter list (after `_generationJobId` which is the last field — note: after Plan 1 is applied, `_approvedAt` is positioned earlier in the list, so `_generationJobId` remains the true last positional param), add:
```typescript
    private _executionEvents: ExecutionEvent[] = [],
    private _changeRecord: ChangeRecord | null = null,
```

- [ ] **Step 3: Update `createDraft` factory — add trailing args**

After the last constructor arg in `createDraft` (around line 173), add to the `new AEC(...)` call:
```typescript
      [], // _executionEvents
      null, // _changeRecord
```

- [ ] **Step 4: Update `reconstitute` factory — add params and pass-through**

Add new optional params at the very end of `reconstitute`'s parameter list (after `approvedAt` — the last param after Plan 1 is applied):
```typescript
    executionEvents?: ExecutionEvent[],
    changeRecord?: ChangeRecord | null,
```

Pass them at the very end of the `new AEC(...)` call inside `reconstitute`:
```typescript
      executionEvents ?? [],
      changeRecord ?? null,
```

- [ ] **Step 5: Add `recordExecutionEvent()` method**

```typescript
  /**
   * Record an execution event reported by the agent during EXECUTING.
   * Events are accumulated and later assembled into the Change Record.
   */
  recordExecutionEvent(props: ExecutionEventProps): ExecutionEvent {
    if (this._status !== AECStatus.EXECUTING) {
      throw new InvalidStateTransitionError(
        `Cannot record execution events in ${this._status} status. Ticket must be EXECUTING.`,
      );
    }
    const event = ExecutionEvent.create(props);
    this._executionEvents.push(event);
    this._updatedAt = new Date();
    return event;
  }
```

- [ ] **Step 6: Add `submitSettlement()` method**

```typescript
  /**
   * Submit settlement — transitions EXECUTING → DELIVERED.
   * Assembles a Change Record from the agent's submission + AEC intent.
   * The Change Record starts in AWAITING_REVIEW status.
   */
  submitSettlement(submission: {
    resultSummary: string;
    executionSummary: string;
    divergences: ChangeRecordCreateProps['divergences'];
    codeChanges: ChangeRecordCreateProps['codeChanges'];
  }): void {
    if (this._status !== AECStatus.EXECUTING) {
      throw new InvalidStateTransitionError(
        `Cannot submit settlement from ${this._status}. Ticket must be EXECUTING.`,
      );
    }
    this._changeRecord = ChangeRecord.create({
      intentSummary: this._description ?? this._title,
      resultSummary: submission.resultSummary,
      executionSummary: submission.executionSummary,
      divergences: submission.divergences,
      codeChanges: submission.codeChanges,
    });
    this._status = AECStatus.DELIVERED;
    this._updatedAt = new Date();
  }
```

- [ ] **Step 7: Add `acceptChangeRecord()` method**

```typescript
  /**
   * PM accepts the Change Record — delivery is approved.
   */
  acceptChangeRecord(reviewerId: string): void {
    if (this._status !== AECStatus.DELIVERED) {
      throw new InvalidStateTransitionError(
        `Cannot review Change Record in ${this._status} status.`,
      );
    }
    if (!this._changeRecord) {
      throw new InvalidStateTransitionError('No Change Record to review.');
    }
    this._changeRecord.accept(reviewerId);
    this._updatedAt = new Date();
  }
```

- [ ] **Step 8: Add `requestChangeRecordChanges()` method**

```typescript
  /**
   * PM requests changes — ticket returns to EXECUTING.
   */
  requestChangeRecordChanges(reviewerId: string, comment: string): void {
    if (this._status !== AECStatus.DELIVERED) {
      throw new InvalidStateTransitionError(
        `Cannot review Change Record in ${this._status} status.`,
      );
    }
    if (!this._changeRecord) {
      throw new InvalidStateTransitionError('No Change Record to review.');
    }
    this._changeRecord.requestChanges(reviewerId, comment);
    this._status = AECStatus.EXECUTING;
    this._changeRecord = null;
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

- [ ] **Step 10: Commit**

```bash
git add backend/src/tickets/domain/aec/AEC.ts
git commit -m "feat: add execution events + Change Record to AEC domain entity

New methods: recordExecutionEvent, submitSettlement,
acceptChangeRecord, requestChangeRecordChanges"
```

---

### Task 5: AEC domain tests for Change Record

**Files:**
- Modify: `backend/src/tickets/domain/aec/AEC.spec.ts`

- [ ] **Step 1: Add new test suite for execution events**

Append to the existing test file:

```typescript
describe('AEC — Execution Events & Change Record', () => {
  describe('recordExecutionEvent()', () => {
    it('records event when ticket is EXECUTING', () => {
      const aec = makeAEC({ status: AECStatus.EXECUTING });

      const event = aec.recordExecutionEvent({
        type: 'decision',
        title: 'Used token bucket',
        description: 'Better burst handling than sliding window',
      });

      expect(event.id).toMatch(/^evt_/);
      expect(event.type).toBe('decision');
      expect(aec.executionEvents).toHaveLength(1);
    });

    it('throws when not EXECUTING', () => {
      const aec = makeAEC({ status: AECStatus.APPROVED });

      expect(() =>
        aec.recordExecutionEvent({
          type: 'risk',
          title: 'Redis dependency',
          description: 'Adds new infra requirement',
        }),
      ).toThrow('must be EXECUTING');
    });

    it('accumulates multiple events', () => {
      const aec = makeAEC({ status: AECStatus.EXECUTING });

      aec.recordExecutionEvent({ type: 'decision', title: 'A', description: 'a' });
      aec.recordExecutionEvent({ type: 'risk', title: 'B', description: 'b' });
      aec.recordExecutionEvent({ type: 'scope_change', title: 'C', description: 'c' });

      expect(aec.executionEvents).toHaveLength(3);
    });
  });

  describe('submitSettlement()', () => {
    it('transitions EXECUTING → DELIVERED with Change Record', () => {
      const aec = makeAEC({ status: AECStatus.EXECUTING });

      aec.submitSettlement({
        resultSummary: 'Implemented rate limiting',
        executionSummary: 'Added Redis-backed token bucket',
        divergences: [{
          area: 'Algorithm',
          intended: 'Sliding window',
          actual: 'Token bucket',
          rationale: 'Better burst handling',
        }],
        codeChanges: [
          { filePath: 'src/rate-limit.ts', additions: 142, deletions: 0 },
        ],
      });

      expect(aec.status).toBe(AECStatus.DELIVERED);
      expect(aec.changeRecord).not.toBeNull();
      expect(aec.changeRecord!.status).toBe('awaiting_review');
      expect(aec.changeRecord!.divergences).toHaveLength(1);
    });

    it('throws when not EXECUTING', () => {
      const aec = makeAEC({ status: AECStatus.APPROVED });

      expect(() =>
        aec.submitSettlement({
          resultSummary: 'x',
          executionSummary: 'x',
          divergences: [],
          codeChanges: [],
        }),
      ).toThrow('must be EXECUTING');
    });
  });

  describe('acceptChangeRecord()', () => {
    it('marks Change Record as ACCEPTED', () => {
      const aec = makeAEC({ status: AECStatus.EXECUTING });
      aec.submitSettlement({
        resultSummary: 'Done',
        executionSummary: 'Done',
        divergences: [],
        codeChanges: [],
      });

      aec.acceptChangeRecord('user_pm1');

      expect(aec.changeRecord!.status).toBe('accepted');
      expect(aec.changeRecord!.reviewedBy).toBe('user_pm1');
      expect(aec.status).toBe(AECStatus.DELIVERED);
    });
  });

  describe('requestChangeRecordChanges()', () => {
    it('returns ticket to EXECUTING and clears Change Record', () => {
      const aec = makeAEC({ status: AECStatus.EXECUTING });
      aec.submitSettlement({
        resultSummary: 'Done',
        executionSummary: 'Done',
        divergences: [],
        codeChanges: [],
      });

      aec.requestChangeRecordChanges('user_pm1', 'Use sliding window instead');

      expect(aec.status).toBe(AECStatus.EXECUTING);
      expect(aec.changeRecord).toBeNull();
    });
  });
});
```

Note: The `makeAEC` helper at the top of the file already supports `status` override via `AEC.reconstitute()`. If the new `reconstitute` params (executionEvents, changeRecord) are optional, no changes to `makeAEC` are needed.

- [ ] **Step 2: Run tests**

Run: `cd backend && npx jest --testPathPattern='AEC.spec' --verbose`
Expected: All new and existing tests pass.

- [ ] **Step 3: Commit**

```bash
git add backend/src/tickets/domain/aec/AEC.spec.ts
git commit -m "test: add AEC domain tests for execution events and Change Record"
```

---

### Task 6: Update Firestore mapper

**Files:**
- Modify: `backend/src/tickets/infrastructure/persistence/mappers/AECMapper.ts`

- [ ] **Step 1: Add imports**

```typescript
import { ExecutionEvent, ExecutionEventType } from '../../../domain/value-objects/ExecutionEvent';
import { ChangeRecord, Divergence, CodeChange } from '../../../domain/value-objects/ChangeRecord';
import { ChangeRecordStatus } from '../../../domain/value-objects/ChangeRecordStatus';
```

- [ ] **Step 2: Add fields to AECDocument interface**

After `generationJobId` field, add:
```typescript
  executionEvents?: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    reportedAt: Timestamp;
  }>;
  changeRecord?: {
    status: string;
    intentSummary: string;
    resultSummary: string;
    executionSummary: string;
    divergences: Divergence[];
    codeChanges: CodeChange[];
    settledAt: Timestamp;
    reviewedAt: Timestamp | null;
    reviewedBy: string | null;
    reviewComment: string | null;
  } | null;
```

- [ ] **Step 3: Update toDomain() — reconstitute execution events**

Before the `AEC.reconstitute(...)` call, add:
```typescript
    // Reconstitute execution events
    const executionEvents = (doc.executionEvents || []).map((evt: any) =>
      ExecutionEvent.reconstitute(
        evt.id,
        evt.type as ExecutionEventType,
        evt.title,
        evt.description,
        toDate(evt.reportedAt),
      ),
    );

    // Reconstitute change record
    const changeRecord = doc.changeRecord
      ? ChangeRecord.reconstitute(
          doc.changeRecord.status as ChangeRecordStatus,
          doc.changeRecord.intentSummary,
          doc.changeRecord.resultSummary,
          doc.changeRecord.executionSummary,
          doc.changeRecord.divergences,
          doc.changeRecord.codeChanges,
          toDate(doc.changeRecord.settledAt),
          doc.changeRecord.reviewedAt ? toDate(doc.changeRecord.reviewedAt) : null,
          doc.changeRecord.reviewedBy ?? null,
          doc.changeRecord.reviewComment ?? null,
        )
      : null;
```

Then pass `executionEvents` and `changeRecord` as the last two args to `AEC.reconstitute(...)`.

- [ ] **Step 4: Update toFirestore() — serialize new fields**

In the return object of `toFirestore()`, add:
```typescript
      executionEvents: aec.executionEvents.map((evt) => ({
        ...evt.toPlainObject(),
        reportedAt: Timestamp.fromDate(evt.reportedAt),
      })),
      changeRecord: aec.changeRecord
        ? {
            ...aec.changeRecord.toPlainObject(),
            settledAt: Timestamp.fromDate(aec.changeRecord.settledAt),
            reviewedAt: aec.changeRecord.reviewedAt
              ? Timestamp.fromDate(aec.changeRecord.reviewedAt)
              : null,
          }
        : null,
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/tickets/infrastructure/persistence/mappers/AECMapper.ts
git commit -m "feat: add execution events + Change Record to Firestore mapper"
```

---

### Task 7: ReportExecutionEventUseCase

**Files:**
- Create: `backend/src/tickets/application/use-cases/ReportExecutionEventUseCase.ts`
- Create: `backend/src/tickets/presentation/dto/ReportExecutionEventDto.ts`
- Create: `backend/src/tickets/application/use-cases/ReportExecutionEventUseCase.spec.ts`

- [ ] **Step 1: Write failing test**

```typescript
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ReportExecutionEventUseCase } from './ReportExecutionEventUseCase';
import { AECStatus } from '../../domain/value-objects/AECStatus';

const TEAM_ID = 'team_abc';
const TICKET_ID = 'aec_001';

function makeMockAEC(overrides: { status?: AECStatus; teamId?: string } = {}) {
  return {
    id: TICKET_ID,
    teamId: overrides.teamId ?? TEAM_ID,
    status: overrides.status ?? AECStatus.EXECUTING,
    recordExecutionEvent: jest.fn().mockReturnValue({ id: 'evt_123', type: 'decision' }),
  };
}

describe('ReportExecutionEventUseCase', () => {
  let aecRepository: { findById: jest.Mock; save: jest.Mock };
  let useCase: ReportExecutionEventUseCase;

  beforeEach(() => {
    aecRepository = {
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new ReportExecutionEventUseCase(aecRepository as any);
  });

  it('reports event and saves', async () => {
    const mockAEC = makeMockAEC();
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
      useCase.execute({
        ticketId: 'aec_nonexistent',
        teamId: TEAM_ID,
        type: 'risk',
        title: 'x',
        description: 'x',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException for wrong team', async () => {
    const mockAEC = makeMockAEC({ teamId: 'team_other' });
    aecRepository.findById.mockResolvedValue(mockAEC);

    await expect(
      useCase.execute({
        ticketId: TICKET_ID,
        teamId: TEAM_ID,
        type: 'decision',
        title: 'x',
        description: 'x',
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
```

Write to `backend/src/tickets/application/use-cases/ReportExecutionEventUseCase.spec.ts`.

- [ ] **Step 2: Run test — should fail**

Run: `cd backend && npx jest --testPathPattern='ReportExecutionEventUseCase.spec' --verbose`
Expected: FAIL — module not found.

- [ ] **Step 3: Create DTO**

```typescript
import { IsString, IsIn } from 'class-validator';

export class ReportExecutionEventDto {
  @IsIn(['decision', 'risk', 'scope_change'])
  type: 'decision' | 'risk' | 'scope_change';

  @IsString()
  title: string;

  @IsString()
  description: string;
}
```

Write to `backend/src/tickets/presentation/dto/ReportExecutionEventDto.ts`.

- [ ] **Step 4: Create use case**

```typescript
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { InvalidStateTransitionError } from '../../../shared/domain/exceptions/DomainExceptions';
import { ExecutionEventType } from '../../domain/value-objects/ExecutionEvent';

export interface ReportExecutionEventCommand {
  ticketId: string;
  teamId: string;
  type: ExecutionEventType;
  title: string;
  description: string;
}

@Injectable()
export class ReportExecutionEventUseCase {
  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
  ) {}

  async execute(command: ReportExecutionEventCommand) {
    const aec = await this.aecRepository.findById(command.ticketId);
    if (!aec) {
      throw new NotFoundException(`Ticket ${command.ticketId} not found`);
    }
    if (aec.teamId !== command.teamId) {
      throw new ForbiddenException('Ticket does not belong to your workspace');
    }

    try {
      aec.recordExecutionEvent({
        type: command.type,
        title: command.title,
        description: command.description,
      });
    } catch (error) {
      if (error instanceof InvalidStateTransitionError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }

    await this.aecRepository.save(aec);

    return { success: true, ticketId: aec.id };
  }
}
```

Write to `backend/src/tickets/application/use-cases/ReportExecutionEventUseCase.ts`.

- [ ] **Step 5: Run tests**

Run: `cd backend && npx jest --testPathPattern='ReportExecutionEventUseCase.spec' --verbose`
Expected: All 3 tests pass.

- [ ] **Step 6: Commit**

```bash
git add backend/src/tickets/application/use-cases/ReportExecutionEventUseCase.ts \
       backend/src/tickets/application/use-cases/ReportExecutionEventUseCase.spec.ts \
       backend/src/tickets/presentation/dto/ReportExecutionEventDto.ts
git commit -m "feat: add ReportExecutionEventUseCase for agent-reported events"
```

---

### Task 8: SubmitSettlementUseCase

**Files:**
- Create: `backend/src/tickets/application/use-cases/SubmitSettlementUseCase.ts`
- Create: `backend/src/tickets/presentation/dto/SubmitSettlementDto.ts`
- Create: `backend/src/tickets/application/use-cases/SubmitSettlementUseCase.spec.ts`

- [ ] **Step 1: Write failing test**

```typescript
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
    submitSettlement: jest.fn(),
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

  it('submits settlement and saves', async () => {
    const mockAEC = makeMockAEC();
    aecRepository.findById.mockResolvedValue(mockAEC);

    const result = await useCase.execute({
      ticketId: TICKET_ID,
      teamId: TEAM_ID,
      resultSummary: 'Implemented rate limiting',
      executionSummary: 'Used token bucket approach',
      divergences: [],
      codeChanges: [{ filePath: 'src/a.ts', additions: 10, deletions: 0 }],
    });

    expect(mockAEC.submitSettlement).toHaveBeenCalledWith({
      resultSummary: 'Implemented rate limiting',
      executionSummary: 'Used token bucket approach',
      divergences: [],
      codeChanges: [{ filePath: 'src/a.ts', additions: 10, deletions: 0 }],
    });
    expect(aecRepository.save).toHaveBeenCalledWith(mockAEC);
    expect(result.success).toBe(true);
  });

  it('throws NotFoundException when ticket not found', async () => {
    aecRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        ticketId: 'aec_gone',
        teamId: TEAM_ID,
        resultSummary: 'x',
        executionSummary: 'x',
        divergences: [],
        codeChanges: [],
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
```

Write to `backend/src/tickets/application/use-cases/SubmitSettlementUseCase.spec.ts`.

- [ ] **Step 2: Create DTO**

```typescript
import { IsString, IsArray, ValidateNested, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class DivergenceDto {
  @IsString()
  area: string;

  @IsString()
  intended: string;

  @IsString()
  actual: string;

  @IsString()
  rationale: string;
}

class CodeChangeDto {
  @IsString()
  filePath: string;

  @IsNumber()
  additions: number;

  @IsNumber()
  deletions: number;
}

export class SubmitSettlementDto {
  @IsString()
  resultSummary: string;

  @IsString()
  executionSummary: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DivergenceDto)
  @IsOptional()
  divergences?: DivergenceDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CodeChangeDto)
  @IsOptional()
  codeChanges?: CodeChangeDto[];
}
```

Write to `backend/src/tickets/presentation/dto/SubmitSettlementDto.ts`.

- [ ] **Step 3: Create use case**

```typescript
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { InvalidStateTransitionError } from '../../../shared/domain/exceptions/DomainExceptions';
import { Divergence, CodeChange } from '../../domain/value-objects/ChangeRecord';

export interface SubmitSettlementCommand {
  ticketId: string;
  teamId: string;
  resultSummary: string;
  executionSummary: string;
  divergences: Divergence[];
  codeChanges: CodeChange[];
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
      aec.submitSettlement({
        resultSummary: command.resultSummary,
        executionSummary: command.executionSummary,
        divergences: command.divergences,
        codeChanges: command.codeChanges,
      });
    } catch (error) {
      if (error instanceof InvalidStateTransitionError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }

    await this.aecRepository.save(aec);

    return { success: true, ticketId: aec.id, status: aec.status };
  }
}
```

Write to `backend/src/tickets/application/use-cases/SubmitSettlementUseCase.ts`.

- [ ] **Step 4: Run tests**

Run: `cd backend && npx jest --testPathPattern='SubmitSettlementUseCase.spec' --verbose`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/src/tickets/application/use-cases/SubmitSettlementUseCase.ts \
       backend/src/tickets/application/use-cases/SubmitSettlementUseCase.spec.ts \
       backend/src/tickets/presentation/dto/SubmitSettlementDto.ts
git commit -m "feat: add SubmitSettlementUseCase — EXECUTING → DELIVERED transition"
```

---

### Task 9: ReviewChangeRecordUseCase

**Files:**
- Create: `backend/src/tickets/application/use-cases/ReviewChangeRecordUseCase.ts`
- Create: `backend/src/tickets/presentation/dto/ReviewChangeRecordDto.ts`
- Create: `backend/src/tickets/application/use-cases/ReviewChangeRecordUseCase.spec.ts`

- [ ] **Step 1: Write failing test**

```typescript
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ReviewChangeRecordUseCase } from './ReviewChangeRecordUseCase';
import { AECStatus } from '../../domain/value-objects/AECStatus';

const TEAM_ID = 'team_abc';
const TICKET_ID = 'aec_001';

function makeMockAEC(overrides: { status?: AECStatus; teamId?: string } = {}) {
  return {
    id: TICKET_ID,
    teamId: overrides.teamId ?? TEAM_ID,
    status: overrides.status ?? AECStatus.DELIVERED,
    acceptChangeRecord: jest.fn(),
    requestChangeRecordChanges: jest.fn(),
  };
}

describe('ReviewChangeRecordUseCase', () => {
  let aecRepository: { findById: jest.Mock; save: jest.Mock };
  let useCase: ReviewChangeRecordUseCase;

  beforeEach(() => {
    aecRepository = {
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new ReviewChangeRecordUseCase(aecRepository as any);
  });

  it('accepts Change Record', async () => {
    const mockAEC = makeMockAEC();
    aecRepository.findById.mockResolvedValue(mockAEC);

    await useCase.execute({
      ticketId: TICKET_ID,
      teamId: TEAM_ID,
      reviewerId: 'user_pm1',
      action: 'accept',
    });

    expect(mockAEC.acceptChangeRecord).toHaveBeenCalledWith('user_pm1');
    expect(aecRepository.save).toHaveBeenCalledWith(mockAEC);
  });

  it('requests changes with comment', async () => {
    const mockAEC = makeMockAEC();
    aecRepository.findById.mockResolvedValue(mockAEC);

    await useCase.execute({
      ticketId: TICKET_ID,
      teamId: TEAM_ID,
      reviewerId: 'user_pm1',
      action: 'request_changes',
      comment: 'Use sliding window instead',
    });

    expect(mockAEC.requestChangeRecordChanges).toHaveBeenCalledWith(
      'user_pm1',
      'Use sliding window instead',
    );
  });

  it('throws BadRequestException for request_changes without comment', async () => {
    const mockAEC = makeMockAEC();
    aecRepository.findById.mockResolvedValue(mockAEC);

    await expect(
      useCase.execute({
        ticketId: TICKET_ID,
        teamId: TEAM_ID,
        reviewerId: 'user_pm1',
        action: 'request_changes',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
```

Write to `backend/src/tickets/application/use-cases/ReviewChangeRecordUseCase.spec.ts`.

- [ ] **Step 2: Create DTO**

```typescript
import { IsString, IsIn, IsOptional } from 'class-validator';

export class ReviewChangeRecordDto {
  @IsIn(['accept', 'request_changes'])
  action: 'accept' | 'request_changes';

  @IsString()
  @IsOptional()
  comment?: string;
}
```

Write to `backend/src/tickets/presentation/dto/ReviewChangeRecordDto.ts`.

- [ ] **Step 3: Create use case**

```typescript
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { InvalidStateTransitionError } from '../../../shared/domain/exceptions/DomainExceptions';

export interface ReviewChangeRecordCommand {
  ticketId: string;
  teamId: string;
  reviewerId: string;
  action: 'accept' | 'request_changes';
  comment?: string;
}

@Injectable()
export class ReviewChangeRecordUseCase {
  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
  ) {}

  async execute(command: ReviewChangeRecordCommand) {
    const aec = await this.aecRepository.findById(command.ticketId);
    if (!aec) {
      throw new NotFoundException(`Ticket ${command.ticketId} not found`);
    }
    if (aec.teamId !== command.teamId) {
      throw new ForbiddenException('Ticket does not belong to your workspace');
    }

    try {
      if (command.action === 'accept') {
        aec.acceptChangeRecord(command.reviewerId);
      } else {
        if (!command.comment) {
          throw new BadRequestException('Comment is required when requesting changes');
        }
        aec.requestChangeRecordChanges(command.reviewerId, command.comment);
      }
    } catch (error) {
      if (error instanceof InvalidStateTransitionError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }

    await this.aecRepository.save(aec);

    return { success: true, ticketId: aec.id, status: aec.status };
  }
}
```

Write to `backend/src/tickets/application/use-cases/ReviewChangeRecordUseCase.ts`.

- [ ] **Step 4: Run tests**

Run: `cd backend && npx jest --testPathPattern='ReviewChangeRecordUseCase.spec' --verbose`
Expected: All 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/src/tickets/application/use-cases/ReviewChangeRecordUseCase.ts \
       backend/src/tickets/application/use-cases/ReviewChangeRecordUseCase.spec.ts \
       backend/src/tickets/presentation/dto/ReviewChangeRecordDto.ts
git commit -m "feat: add ReviewChangeRecordUseCase — PM accept/request-changes flow"
```

---

### Task 10: Add REST endpoints to controller

**Files:**
- Modify: `backend/src/tickets/presentation/controllers/tickets.controller.ts`

- [ ] **Step 1: Add imports**

```typescript
import { ReportExecutionEventUseCase } from '../../application/use-cases/ReportExecutionEventUseCase';
import { SubmitSettlementUseCase } from '../../application/use-cases/SubmitSettlementUseCase';
import { ReviewChangeRecordUseCase } from '../../application/use-cases/ReviewChangeRecordUseCase';
import { ReportExecutionEventDto } from '../dto/ReportExecutionEventDto';
import { SubmitSettlementDto } from '../dto/SubmitSettlementDto';
import { ReviewChangeRecordDto } from '../dto/ReviewChangeRecordDto';
```

- [ ] **Step 2: Inject new use cases in constructor**

Add to the controller constructor params:
```typescript
    private readonly reportExecutionEventUseCase: ReportExecutionEventUseCase,
    private readonly submitSettlementUseCase: SubmitSettlementUseCase,
    private readonly reviewChangeRecordUseCase: ReviewChangeRecordUseCase,
```

- [ ] **Step 3: Add POST /tickets/:id/execution-events endpoint**

```typescript
  @Post(':id/execution-events')
  async reportExecutionEvent(
    @Param('id') idOrSlug: string,
    @TeamId() teamId: string,
    @Body() dto: ReportExecutionEventDto,
  ) {
    const ticketId = await this.resolveTicketId(idOrSlug, teamId);
    return this.reportExecutionEventUseCase.execute({
      ticketId,
      teamId,
      type: dto.type,
      title: dto.title,
      description: dto.description,
    });
  }
```

- [ ] **Step 4: Add POST /tickets/:id/settle endpoint**

```typescript
  @Post(':id/settle')
  async submitSettlement(
    @Param('id') idOrSlug: string,
    @TeamId() teamId: string,
    @Body() dto: SubmitSettlementDto,
  ) {
    const ticketId = await this.resolveTicketId(idOrSlug, teamId);
    return this.submitSettlementUseCase.execute({
      ticketId,
      teamId,
      resultSummary: dto.resultSummary,
      executionSummary: dto.executionSummary,
      divergences: dto.divergences ?? [],
      codeChanges: dto.codeChanges ?? [],
    });
  }
```

- [ ] **Step 5: Add POST /tickets/:id/change-record/review endpoint**

```typescript
  @Post(':id/change-record/review')
  async reviewChangeRecord(
    @Param('id') idOrSlug: string,
    @TeamId() teamId: string,
    @UserId() userId: string,
    @Body() dto: ReviewChangeRecordDto,
  ) {
    const ticketId = await this.resolveTicketId(idOrSlug, teamId);
    return this.reviewChangeRecordUseCase.execute({
      ticketId,
      teamId,
      reviewerId: userId,
      action: dto.action,
      comment: dto.comment,
    });
  }
```

- [ ] **Step 6: Add Change Record to mapToResponse**

The `mapToResponse` helper (around line 1378) receives the domain AEC entity. Add these fields to its return object:
```typescript
      executionEvents: aec.executionEvents.map((evt: any) => evt.toPlainObject()),
      changeRecord: aec.changeRecord ? aec.changeRecord.toPlainObject() : null,
```

- [ ] **Step 7: Commit**

```bash
git add backend/src/tickets/presentation/controllers/tickets.controller.ts
git commit -m "feat: add REST endpoints for execution events, settlement, and Change Record review"
```

---

### Task 11: Register use cases in tickets module

**Files:**
- Modify: `backend/src/tickets/tickets.module.ts`

- [ ] **Step 1: Add imports and providers**

Import the 3 new use cases:
```typescript
import { ReportExecutionEventUseCase } from './application/use-cases/ReportExecutionEventUseCase';
import { SubmitSettlementUseCase } from './application/use-cases/SubmitSettlementUseCase';
import { ReviewChangeRecordUseCase } from './application/use-cases/ReviewChangeRecordUseCase';
```

Add all three to the `providers` array in `@Module({})`.

- [ ] **Step 2: Verify backend compiles**

Run: `cd backend && npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add backend/src/tickets/tickets.module.ts
git commit -m "feat: register Change Record use cases in tickets module"
```

---

### Task 12: Update frontend ticket service

**Files:**
- Modify: `client/src/services/ticket.service.ts`

- [ ] **Step 1: Add Change Record types to AECResponse interface**

```typescript
  executionEvents: Array<{
    id: string;
    type: 'decision' | 'risk' | 'scope_change';
    title: string;
    description: string;
    reportedAt: string;
  }>;
  changeRecord: {
    status: 'awaiting_review' | 'accepted' | 'changes_requested';
    intentSummary: string;
    resultSummary: string;
    executionSummary: string;
    divergences: Array<{
      area: string;
      intended: string;
      actual: string;
      rationale: string;
    }>;
    codeChanges: Array<{
      filePath: string;
      additions: number;
      deletions: number;
    }>;
    settledAt: string;
    reviewedAt: string | null;
    reviewedBy: string | null;
    reviewComment: string | null;
  } | null;
```

- [ ] **Step 2: Add API methods**

```typescript
export async function reviewChangeRecord(
  ticketId: string,
  action: 'accept' | 'request_changes',
  comment?: string,
): Promise<{ success: boolean }> {
  const res = await apiFetch(`/tickets/${ticketId}/change-record/review`, {
    method: 'POST',
    body: JSON.stringify({ action, comment }),
  });
  return res.json();
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/services/ticket.service.ts
git commit -m "feat: add Change Record types and API methods to frontend service"
```

---

### Task 13: Create DeliveredTab component

**Files:**
- Create: `client/src/tickets/components/detail/DeliveredTab.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client';

import { formatDistanceToNow } from 'date-fns';

interface DeliveredTabProps {
  ticket: any;
  onAccept: () => void;
  onRequestChanges: (comment: string) => void;
  isReviewing: boolean;
}

export function DeliveredTab({ ticket, onAccept, onRequestChanges, isReviewing }: DeliveredTabProps) {
  const cr = ticket.changeRecord;

  if (!cr) {
    return (
      <div className="text-center py-12 text-[var(--text-tertiary)]">
        No Change Record yet. The agent will submit one after execution.
      </div>
    );
  }

  const isAwaiting = cr.status === 'awaiting_review';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Status Banner */}
      {isAwaiting && (
        <div className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-amber-500/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-sm text-[var(--text-secondary)]">Awaiting PM review</span>
            <span className="text-xs text-[var(--text-tertiary)]">
              · Delivered {formatDistanceToNow(new Date(cr.settledAt))} ago
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const comment = prompt('What changes are needed?');
                if (comment) onRequestChanges(comment);
              }}
              disabled={isReviewing}
              className="px-3 py-1.5 text-xs rounded-md border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] disabled:opacity-50"
            >
              Request Changes
            </button>
            <button
              onClick={onAccept}
              disabled={isReviewing}
              className="px-3 py-1.5 text-xs rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Accept
            </button>
          </div>
        </div>
      )}

      {cr.status === 'accepted' && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-sm text-emerald-600 dark:text-emerald-400">Accepted</span>
          {cr.reviewedBy && (
            <span className="text-xs text-[var(--text-tertiary)]">
              · Reviewed {formatDistanceToNow(new Date(cr.reviewedAt!))} ago
            </span>
          )}
        </div>
      )}

      {/* Delta Section */}
      <div className="rounded-lg border border-[var(--border-subtle)] p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-purple-500/15 text-purple-500">Delta</span>
          <span className="text-sm font-semibold text-[var(--text-primary)]">Intent vs. Execution</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-[var(--bg-hover)] p-4">
            <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Intent (Original)</div>
            <div className="text-sm text-[var(--text-secondary)] leading-relaxed">{cr.intentSummary}</div>
          </div>
          <div className="rounded-lg bg-[var(--bg-hover)] p-4">
            <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-2">What Was Done</div>
            <div className="text-sm text-[var(--text-secondary)] leading-relaxed">{cr.resultSummary}</div>
          </div>
        </div>

        {/* Divergences */}
        {cr.divergences.length > 0 && (
          <div className="mt-4 space-y-2">
            {cr.divergences.map((d: any, i: number) => (
              <div key={i} className="flex items-start gap-2 rounded-lg border border-amber-500/15 bg-amber-500/5 p-3">
                <span className="text-amber-500 text-sm mt-0.5">&#9889;</span>
                <div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">{d.area}</div>
                  <div className="text-xs text-[var(--text-tertiary)] mt-1">
                    Spec: {d.intended} &rarr; Built: <span className="text-amber-500">{d.actual}</span>
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)] mt-0.5">Rationale: {d.rationale}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Execution Summary */}
      <div className="rounded-lg border border-[var(--border-subtle)] p-5">
        <div className="text-sm font-semibold text-[var(--text-primary)] mb-3">Execution Summary</div>
        <div className="text-sm text-[var(--text-secondary)] leading-relaxed">{cr.executionSummary}</div>
      </div>

      {/* Code Changes */}
      {cr.codeChanges.length > 0 && (
        <div className="rounded-lg border border-[var(--border-subtle)] overflow-hidden">
          <div className="px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--text-primary)]">Code Changes</span>
              <span className="text-xs text-[var(--text-tertiary)] bg-[var(--bg-hover)] px-2 py-0.5 rounded-full">
                {cr.codeChanges.length} files · +{cr.codeChanges.reduce((s: number, c: any) => s + c.additions, 0)} −{cr.codeChanges.reduce((s: number, c: any) => s + c.deletions, 0)}
              </span>
            </div>
          </div>
          <div className="border-t border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
            {cr.codeChanges.map((c: any, i: number) => (
              <div key={i} className="px-5 py-2 flex justify-between items-center text-xs font-mono">
                <span className="text-[var(--text-tertiary)]">{c.filePath}</span>
                <span>
                  {c.additions > 0 && <span className="text-emerald-500">+{c.additions}</span>}
                  {c.deletions > 0 && <span className="text-red-400 ml-2">−{c.deletions}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Execution Events */}
      {ticket.executionEvents?.length > 0 && (
        <div className="rounded-lg border border-[var(--border-subtle)] p-5">
          <div className="text-sm font-semibold text-[var(--text-primary)] mb-3">Decisions & Events</div>
          <div className="space-y-3">
            {ticket.executionEvents.map((evt: any) => (
              <div key={evt.id} className="flex items-start gap-3">
                <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-tertiary)] uppercase mt-0.5">
                  {evt.type === 'scope_change' ? 'scope' : evt.type}
                </span>
                <div>
                  <div className="text-sm text-[var(--text-primary)]">{evt.title}</div>
                  <div className="text-xs text-[var(--text-tertiary)] mt-0.5">{evt.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

Write to `client/src/tickets/components/detail/DeliveredTab.tsx`.

- [ ] **Step 2: Commit**

```bash
git add client/src/tickets/components/detail/DeliveredTab.tsx
git commit -m "feat: add DeliveredTab component for Change Record display and review"
```

---

### Task 14: Add Delivered tab to TicketDetailLayout

**Files:**
- Modify: `client/src/tickets/components/detail/TicketDetailLayout.tsx`

- [ ] **Step 1: Import DeliveredTab and reviewChangeRecord**

```typescript
import { DeliveredTab } from './DeliveredTab';
import { reviewChangeRecord } from '../../../services/ticket.service';
```

- [ ] **Step 2: Add "Delivered" tab trigger after Technical tab**

After the Technical `<TabsTrigger>` (around line 622), add:

```tsx
{ticket.status === 'delivered' && (
  <TabsTrigger value="delivered" className="...same classes as other tabs...">
    <ClipboardCheck className="h-3.5 w-3.5" />
    Delivered
  </TabsTrigger>
)}
```

Import `ClipboardCheck` from `lucide-react`.

- [ ] **Step 3: Add Delivered tab content**

After the last `<TabsContent>`, add:

```tsx
{ticket.status === 'delivered' && (
  <TabsContent value="delivered" className="mt-6">
    <DeliveredTab
      ticket={ticket}
      onAccept={async () => {
        await reviewChangeRecord(ticketId, 'accept');
        fetchTicket(ticketId);
      }}
      onRequestChanges={async (comment: string) => {
        await reviewChangeRecord(ticketId, 'request_changes', comment);
        fetchTicket(ticketId);
      }}
      isReviewing={false}
    />
  </TabsContent>
)}
```

- [ ] **Step 4: Auto-switch to Delivered tab when ticket is delivered**

In the tab initialization logic (around line 117), update:
```typescript
const initialTab = ticket.status === 'delivered'
  ? 'delivered'
  : searchParams.get('tab') === 'technical'
    ? 'technical'
    : 'spec';
```

- [ ] **Step 5: Commit**

```bash
git add client/src/tickets/components/detail/TicketDetailLayout.tsx
git commit -m "feat: add Delivered tab to ticket detail layout

Shows Change Record with delta, divergences, code changes.
PM can accept or request changes directly from the tab."
```

---

### Task 15: Final verification

- [ ] **Step 1: Run full backend test suite**

Run: `cd backend && npx jest --verbose`
Expected: All tests pass.

- [ ] **Step 2: Run TypeScript build check (backend)**

Run: `cd backend && npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 3: Run TypeScript build check (frontend)**

Run: `cd client && npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 4: Verify new endpoints manually (optional)**

Use the NestJS app or curl to verify:
- `POST /tickets/:id/execution-events` with `{ type: "decision", title: "x", description: "y" }` on an EXECUTING ticket
- `POST /tickets/:id/settle` with `{ resultSummary: "...", executionSummary: "...", divergences: [], codeChanges: [] }` on an EXECUTING ticket
- `POST /tickets/:id/change-record/review` with `{ action: "accept" }` on a DELIVERED ticket

- [ ] **Step 5: Fix any remaining issues**

- [ ] **Step 6: Final commit if needed**

---

## Notes

### No LLM Processing
The Change Record is assembled from structured data only. The `intentSummary` is taken directly from the AEC's description. No LLM calls are needed during settlement.

### Execution Events Are Lightweight
3-5 small JSON payloads per ticket execution. Stored as an array on the AEC document — no subcollection needed at this scale.

### Change Record Lifecycle
```
EXECUTING (events accumulate)
    → submit_settlement
DELIVERED (Change Record: awaiting_review)
    → PM accepts → stays DELIVERED (Change Record: accepted)
    → PM requests changes → back to EXECUTING (Change Record cleared)
```

### requestChanges Clears the Change Record
When PM requests changes, the ticket goes back to EXECUTING and the Change Record is cleared. The agent must re-execute and submit a new settlement. Execution events are preserved — they accumulate across settlement attempts.

### MCP Tool Documentation
This plan creates the backend endpoints. The actual MCP tool definitions (in the CLI repo) need separate updates to add:
- `report_decision` → POST /tickets/:id/execution-events { type: "decision" }
- `report_risk` → POST /tickets/:id/execution-events { type: "risk" }
- `report_scope_change` → POST /tickets/:id/execution-events { type: "scope_change" }
- `submit_settlement` → POST /tickets/:id/settle

### Future Work (Not in This Plan)
- Project-level settlements overview page (Timeline Feed or Surface-Grouped)
- Email/Slack notifications when settlement is submitted
- Auto-accept for clean settlements (no divergences)
- Settlement SLA badges
