# Lifecycle Status Rename Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename AEC lifecycle status values from internal jargon (DEV_REFINING, REVIEW, FORGED, COMPLETE) to user-facing names (DEFINED, REFINED, APPROVED, DELIVERED), maintaining full Firestore backward compatibility and API backward compatibility for CLI/MCP clients.

**Architecture:** Pure rename of enum values across all layers (domain → infrastructure → application → presentation → frontend → CLI docs). No behavioral changes — same state machine transitions, just different names. The Firestore mapper gains migration entries to transparently read old status values from existing documents. The API DTO gains a `@Transform` to accept old status values from CLI clients during the transition period.

**Tech Stack:** NestJS, TypeScript, Firestore, Next.js/React, @forge/shared-types

---

## Status Mapping Reference

| Old Enum | Old DB | New Enum | New DB | Change |
|----------|--------|----------|--------|--------|
| `DRAFT` | `'draft'` | `DRAFT` | `'draft'` | — |
| `DEV_REFINING` | `'dev-refining'` | `DEFINED` | `'defined'` | Rename |
| `REVIEW` | `'review'` | `REFINED` | `'refined'` | Rename |
| `FORGED` | `'forged'` | `APPROVED` | `'approved'` | Rename |
| `EXECUTING` | `'executing'` | `EXECUTING` | `'executing'` | — |
| `COMPLETE` | `'complete'` | `DELIVERED` | `'delivered'` | Rename |
| `ARCHIVED` | `'archived'` | `ARCHIVED` | `'archived'` | — |

## Field Rename

| Old Field | New Field | Why |
|-----------|-----------|-----|
| `_forgedAt` / `forgedAt` | `_approvedAt` / `approvedAt` | Aligns with APPROVED status |

## Method Renames

| Old Method | New Method | Why |
|------------|-----------|-----|
| `forge()` | Merged into `approve()` | No more FORGED concept — `approve()` optionally accepts snapshots |
| `markComplete()` | `markDelivered()` | Aligns with DELIVERED status |

---

## File Structure

**Domain Layer (4 files):**
- `backend/src/tickets/domain/value-objects/AECStatus.ts` — enum definition
- `backend/src/tickets/domain/aec/AEC.ts` — state machine, field rename
- `backend/src/tickets/domain/aec/AEC.spec.ts` — domain tests
- `backend/src/tickets/infrastructure/services/drift-detector.service.ts` — Firestore query

**Infrastructure Layer (1 file):**
- `backend/src/tickets/infrastructure/persistence/mappers/AECMapper.ts` — migration + field mapping

**Application Layer (9 files):**
- `backend/src/tickets/application/use-cases/UpdateAECUseCase.ts`
- `backend/src/tickets/application/use-cases/ApproveTicketUseCase.ts`
- `backend/src/tickets/application/use-cases/ApproveTicketUseCase.spec.ts`
- `backend/src/tickets/application/use-cases/AssignTicketUseCase.ts`
- `backend/src/tickets/application/use-cases/AssignTicketUseCase.spec.ts`
- `backend/src/tickets/application/use-cases/StartImplementationUseCase.ts`
- `backend/src/tickets/application/use-cases/SubmitReviewSessionUseCase.spec.ts`
- `backend/src/tickets/application/use-cases/ReEnrichWithQAUseCase.spec.ts`
- `backend/src/tickets/presentation/dto/UpdateAECDto.ts`

**Presentation Layer (1 file):**
- `backend/src/tickets/presentation/controllers/tickets.controller.ts` — API response `forgedAt` → `approvedAt`

**Shared Packages (1 file):**
- `packages/shared-types/src/types/index.ts`

**Frontend (6 files):**
- `client/src/tickets/config/ticketStatusConfig.ts` — status config + lifecycle steps
- `client/src/services/ticket.service.ts` — `AECResponse` interface `forgedAt` → `approvedAt`
- `client/src/tickets/components/detail/OverviewCard.tsx` — NEXT_STEP_HINTS hardcoded keys
- `client/src/tickets/components/detail/TicketDetailLayout.tsx` — hardcoded status checks
- `client/app/(main)/tickets/[id]/page.tsx` — status transition logic
- `client/app/(main)/tickets/page.tsx` — ticket grid status checks + `getLifecycleInfo` map + `WaitBadge` prop

**Documentation (3 critical files):**
- `backend/docs/forge-cli/platform/ticket-lifecycle.md`
- `backend/docs/forge-cli/cli-and-mcp/mcp-integration.md`
- `backend/docs/forge-cli/cli-and-mcp/command-reference.md`

---

### Task 1: Update enum definitions

**Files:**
- Modify: `backend/src/tickets/domain/value-objects/AECStatus.ts`
- Modify: `packages/shared-types/src/types/index.ts`

- [ ] **Step 1: Update backend AECStatus enum**

Replace the enum in `backend/src/tickets/domain/value-objects/AECStatus.ts`:

```typescript
export enum AECStatus {
  DRAFT = 'draft',
  DEFINED = 'defined',
  REFINED = 'refined',
  APPROVED = 'approved',
  EXECUTING = 'executing',
  DELIVERED = 'delivered',
  ARCHIVED = 'archived',
}
```

- [ ] **Step 2: Update shared types**

Replace in `packages/shared-types/src/types/index.ts`:

```typescript
export type AECStatus =
  | 'draft'
  | 'defined'
  | 'refined'
  | 'approved'
  | 'executing'
  | 'delivered'
  | 'archived';
```

- [ ] **Step 3: Verify build breaks as expected**

Run: `cd backend && npx tsc --noEmit 2>&1 | head -30`
Expected: TypeScript errors referencing old enum values (DEV_REFINING, REVIEW, FORGED, COMPLETE). This confirms the rename propagated.

- [ ] **Step 4: Commit**

```bash
git add backend/src/tickets/domain/value-objects/AECStatus.ts packages/shared-types/src/types/index.ts
git commit -m "refactor: rename AECStatus enum values to user-facing lifecycle names

DEV_REFINING→DEFINED, REVIEW→REFINED, FORGED→APPROVED, COMPLETE→DELIVERED"
```

---

### Task 2: Update AEC domain entity

**Files:**
- Modify: `backend/src/tickets/domain/aec/AEC.ts`

All changes are mechanical renames. Apply every substitution listed below across the entire file.

- [ ] **Step 1: Rename private field `_forgedAt` → `_approvedAt`**

Line 63: `private _forgedAt: Date | null,` → `private _approvedAt: Date | null,`

- [ ] **Step 2: Update `createDraft` factory — comment on line 146**

`null, // _forgedAt` → `null, // _approvedAt`

- [ ] **Step 3: Update `reconstitute` factory — parameter + body**

Line 229: `forgedAt?: Date | null,` → `approvedAt?: Date | null,`
Line 253: `forgedAt ?? null,` → `approvedAt ?? null,`

- [ ] **Step 4: Update `startDevRefine()` — DRAFT → DEFINED**

Line 288: `if (this._status !== AECStatus.DRAFT)` stays (DRAFT unchanged)
Line 293: `this._status = AECStatus.DEV_REFINING;` → `this._status = AECStatus.DEFINED;`

- [ ] **Step 5: Delete `forge()` method and merge into `approve()`**

Remove the entire `forge()` method (lines 325-337). Its logic merges into `approve()` — see Step 13.

Any callers of `forge()` (e.g., `UpdateAECUseCase`) will call `approve()` with snapshot params instead.

- [ ] **Step 6: Update `export()` — FORGED → APPROVED**

Line 340: `AECStatus.FORGED` → `AECStatus.APPROVED`

- [ ] **Step 7: Update `startImplementation()` — FORGED → APPROVED**

Line 354: `AECStatus.FORGED` → `AECStatus.APPROVED`
Line 356: error message `FORGED` → `APPROVED`

- [ ] **Step 8: Update `markComplete()` → rename to `markDelivered()`**

Lines 391-399: rename method and update all references:
```typescript
  markDelivered(): void {
    if (this._status !== AECStatus.DRAFT && this._status !== AECStatus.EXECUTING) {
      throw new InvalidStateTransitionError(
        `Cannot mark delivered from ${this._status}. Only draft or executing tickets can be delivered.`,
      );
    }
    this._status = AECStatus.DELIVERED;
    this._updatedAt = new Date();
  }
```

- [ ] **Step 9: Update `revertToDraft()` — COMPLETE → DELIVERED**

Line 402: `AECStatus.COMPLETE` → `AECStatus.DELIVERED`
Line 404: error message `complete` → `delivered`
Line 410: `this._forgedAt` → `this._approvedAt`

- [ ] **Step 10: Update `archive()` / `assign()` — COMPLETE → DELIVERED**

`assign()` line 461: `AECStatus.COMPLETE` → `AECStatus.DELIVERED`

- [ ] **Step 11: Update `submitReviewSession()` — REVIEW → REFINED**

Line 484: `AECStatus.REVIEW` → `AECStatus.REFINED`

- [ ] **Step 12: Update `sendBack()` lifecycle ordering**

Lines 493-500:
```typescript
    const lifecycleOrder: Record<string, number> = {
      [AECStatus.DRAFT]: 0,
      [AECStatus.DEFINED]: 1,
      [AECStatus.REFINED]: 2,
      [AECStatus.APPROVED]: 3,
      [AECStatus.EXECUTING]: 4,
      [AECStatus.DELIVERED]: 5,
    };
```

Update comment at line 490:
```
   * Lifecycle order: draft(0) → defined(1) → refined(2) → approved(3) → executing(4) → delivered(5)
```

Line 524 comment: `// Reverting to dev-refining:` → `// Reverting to defined:`
Line 530: `this._forgedAt` → `this._approvedAt`

- [ ] **Step 13: Rewrite `approve()` — merge old `forge()` logic, set APPROVED**

Replace the existing `approve()` method (line 647-651) with:

```typescript
  /**
   * Approve the ticket — transitions to APPROVED.
   * Called by PM (no snapshots) or by automated pipeline (with snapshots).
   * When called with snapshots, validates readiness score >= 75.
   */
  approve(codeSnapshot?: CodeSnapshot, apiSnapshot?: ApiSnapshot): void {
    if (codeSnapshot) {
      // Automated path: requires DEFINED status and readiness threshold
      if (this._status !== AECStatus.DEFINED) {
        throw new InvalidStateTransitionError(`Cannot approve with snapshot from ${this._status}`);
      }
      if (this._readinessScore < 75) {
        throw new InsufficientReadinessError(`Score ${this._readinessScore} < 75`);
      }
      this._codeSnapshot = codeSnapshot;
      this._apiSnapshot = apiSnapshot ?? null;
    }
    this._status = AECStatus.APPROVED;
    this._approvedAt = new Date();
    this._updatedAt = new Date();
  }
```

This replaces both the old `forge()` and `approve()` methods with a single unified method.

- [ ] **Step 14: Update `detectDrift()` and `markDrifted()` — FORGED → APPROVED**

Line 536: `AECStatus.FORGED` → `AECStatus.APPROVED`
Line 700: `AECStatus.FORGED` → `AECStatus.APPROVED`

- [ ] **Step 15: Rename getter `forgedAt` → `approvedAt`**

Line 773-775:
```typescript
  get approvedAt(): Date | null {
    return this._approvedAt;
  }
```

- [ ] **Step 16: Commit**

```bash
git add backend/src/tickets/domain/aec/AEC.ts
git commit -m "refactor: update AEC domain entity for new lifecycle status names

Renames: forgedAt→approvedAt, markComplete→markDelivered.
All status refs updated: DEFINED/REFINED/APPROVED/DELIVERED."
```

---

### Task 3: Update AEC domain tests

**Files:**
- Modify: `backend/src/tickets/domain/aec/AEC.spec.ts`

- [ ] **Step 1: Replace all enum references**

Global replacements in the file:
- `AECStatus.FORGED` → `AECStatus.APPROVED`
- `AECStatus.REVIEW` → `AECStatus.REFINED`
- `AECStatus.DEV_REFINING` → `AECStatus.DEFINED`
- `AECStatus.COMPLETE` → `AECStatus.DELIVERED`

- [ ] **Step 2: Replace all `forgedAt` references**

- `aec.forgedAt` → `aec.approvedAt` (all occurrences)
- `forgedAt:` → `approvedAt:` (in `makeAEC` overrides)

- [ ] **Step 3: Update test descriptions**

- `'AEC — forgedAt timestamp'` → `'AEC — approvedAt timestamp'`
- `'sets forgedAt when'` → `'sets approvedAt when'`
- `'clears forgedAt when'` → `'clears approvedAt when'`
- `'REVIEW → FORGED'` → `'REFINED → APPROVED'`
- `'DEV_REFINING → FORGED'` → `'DEFINED → APPROVED'` (test now calls `approve(snapshot)` instead of `forge(snapshot)`)
- `'COMPLETE → DRAFT'` → `'DELIVERED → DRAFT'`
- `'FORGED to DRAFT'` → `'APPROVED to DRAFT'`
- `'REVIEW to DEV_REFINING'` → `'REFINED to DEFINED'`
- `'EXECUTING to DRAFT'` → same (EXECUTING unchanged)

- [ ] **Step 4: Run domain tests**

Run: `cd backend && npx jest --testPathPattern='AEC.spec' --verbose`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/src/tickets/domain/aec/AEC.spec.ts
git commit -m "test: update AEC domain tests for new lifecycle status names"
```

---

### Task 4: Update Firestore mapper

**Files:**
- Modify: `backend/src/tickets/infrastructure/persistence/mappers/AECMapper.ts`

- [ ] **Step 1: Update STATUS_MIGRATION map**

Replace lines 107-113 with:
```typescript
const STATUS_MIGRATION: Record<string, string> = {
  // Legacy v1 status names
  'validated': 'defined',
  'waiting-for-approval': 'refined',
  'ready': 'approved',
  'created': 'executing',
  // v2 → v3 lifecycle rename
  'dev-refining': 'defined',
  'review': 'refined',
  'forged': 'approved',
  'complete': 'delivered',
  // 'drifted' handled separately below (depends on externalIssue)
};
```

- [ ] **Step 2: Update drifted migration — line 198**

`migratedStatus = doc.externalIssue ? 'executing' : 'forged';`
→ `migratedStatus = doc.externalIssue ? 'executing' : 'approved';`

- [ ] **Step 3: Add `approvedAt` to AECDocument interface**

After line 99 (`forgedAt`), add:
```typescript
  approvedAt?: Timestamp | null;
```

Keep `forgedAt` in the interface — old documents still have it.

- [ ] **Step 4: Update toDomain() — read approvedAt with forgedAt fallback**

Line 268:
```typescript
// Old:
doc.forgedAt ? toDate(doc.forgedAt) : null,
// New:
(doc.approvedAt ?? doc.forgedAt) ? toDate((doc.approvedAt ?? doc.forgedAt)!) : null,
```

- [ ] **Step 5: Update toFirestore() — write approvedAt**

Line 354:
```typescript
// Old:
forgedAt: aec.forgedAt ? Timestamp.fromDate(aec.forgedAt) : null,
// New:
approvedAt: aec.approvedAt ? Timestamp.fromDate(aec.approvedAt) : null,
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/tickets/infrastructure/persistence/mappers/AECMapper.ts
git commit -m "refactor: update Firestore mapper with lifecycle migration entries

Backward compat: dev-refining→defined, review→refined, forged→approved,
complete→delivered. Renames forgedAt→approvedAt with fallback read."
```

---

### Task 5: Update drift detector service

**Files:**
- Modify: `backend/src/tickets/infrastructure/services/drift-detector.service.ts`

- [ ] **Step 1: Update Firestore query status values**

Line 95:
```typescript
// Old:
.where('status', 'in', [AECStatus.FORGED, AECStatus.EXECUTING, 'ready', 'created'])
// New:
.where('status', 'in', [AECStatus.APPROVED, AECStatus.EXECUTING, 'ready', 'created', 'forged'])
```

Note: keep `'forged'` in the legacy list since existing Firestore docs may still have the old value until the mapper migrates them on read.

- [ ] **Step 2: Commit**

```bash
git add backend/src/tickets/infrastructure/services/drift-detector.service.ts
git commit -m "refactor: update drift detector for APPROVED status name"
```

---

### Task 6: Update use cases

**Files:**
- Modify: `backend/src/tickets/application/use-cases/UpdateAECUseCase.ts`
- Modify: `backend/src/tickets/application/use-cases/ApproveTicketUseCase.ts`
- Modify: `backend/src/tickets/application/use-cases/AssignTicketUseCase.ts`
- Modify: `backend/src/tickets/application/use-cases/StartImplementationUseCase.ts`

- [ ] **Step 1: Update UpdateAECUseCase lifecycle ordering**

Lines 70-77:
```typescript
    const lifecycleOrder: Record<string, number> = {
      [AECStatus.DRAFT]: 0,
      [AECStatus.DEFINED]: 1,
      [AECStatus.REFINED]: 2,
      [AECStatus.APPROVED]: 3,
      [AECStatus.EXECUTING]: 4,
      [AECStatus.DELIVERED]: 5,
    };
```

- [ ] **Step 2: Update UpdateAECUseCase switch cases**

Lines 92-135 — replace all old enum values:
- `case AECStatus.EXECUTING:` → keep (unchanged)
  - Line 98: `AECStatus.FORGED` → `AECStatus.APPROVED`
  - Line 99: `aec.startImplementation('manual');` stays
  - Line 102: error message `forged` → `approved`
- `case AECStatus.COMPLETE:` → `case AECStatus.DELIVERED:`
  - Line 108: `AECStatus.FORGED` → `AECStatus.APPROVED`
  - Line 111: `aec.markComplete()` → `aec.markDelivered()`
- `case AECStatus.DEV_REFINING:` → `case AECStatus.DEFINED:`
- `case AECStatus.REVIEW:` → `case AECStatus.REFINED:`
- `case AECStatus.FORGED:` → `case AECStatus.APPROVED:`
  - Line 125: `AECStatus.REVIEW` → `AECStatus.REFINED`
  - Line 128: `aec.forge(...)` → `aec.approve({ commitSha: 'manual', indexId: 'manual' })` (pass snapshot as first arg)

- [ ] **Step 3: Update ApproveTicketUseCase**

Line 49:
```typescript
    const approvableStatuses = [AECStatus.REFINED, AECStatus.DEFINED, AECStatus.DRAFT];
```

Update JSDoc lines 23-24:
```
 * Allowed from REFINED (after developer refine) or DEFINED (skip developer review).
```

- [ ] **Step 4: Update AssignTicketUseCase**

Line 65:
```typescript
      const devDependentStatuses = [AECStatus.DEFINED, AECStatus.REFINED];
```

- [ ] **Step 5: Update StartImplementationUseCase comments**

Line 33 JSDoc: `FORGED → EXECUTING` → `APPROVED → EXECUTING`
Line 53 comment: `transitions FORGED → EXECUTING` → `transitions APPROVED → EXECUTING`

- [ ] **Step 6: Commit**

```bash
git add backend/src/tickets/application/use-cases/UpdateAECUseCase.ts \
       backend/src/tickets/application/use-cases/ApproveTicketUseCase.ts \
       backend/src/tickets/application/use-cases/AssignTicketUseCase.ts \
       backend/src/tickets/application/use-cases/StartImplementationUseCase.ts
git commit -m "refactor: update use cases for new lifecycle status names"
```

---

### Task 7: Update use case tests

**Files:**
- Modify: `backend/src/tickets/application/use-cases/ApproveTicketUseCase.spec.ts`
- Modify: `backend/src/tickets/application/use-cases/AssignTicketUseCase.spec.ts`
- Modify: `backend/src/tickets/application/use-cases/SubmitReviewSessionUseCase.spec.ts`
- Modify: `backend/src/tickets/application/use-cases/ReEnrichWithQAUseCase.spec.ts`

- [ ] **Step 1: Update ApproveTicketUseCase.spec.ts**

Global replacements:
- `AECStatus.REVIEW` → `AECStatus.REFINED`
- `AECStatus.FORGED` → `AECStatus.APPROVED`
- `AECStatus.DEV_REFINING` → `AECStatus.DEFINED`
- `AECStatus.EXECUTING` stays (unchanged)

- [ ] **Step 2: Update AssignTicketUseCase.spec.ts**

Same global replacements as step 1, plus:
- Line 575: `mockAec.markComplete()` → `mockAec.markDelivered()`

- [ ] **Step 3: Update SubmitReviewSessionUseCase.spec.ts**

- `AECStatus.DEV_REFINING` → `AECStatus.DEFINED`
- `AECStatus.REVIEW` → `AECStatus.REFINED`

- [ ] **Step 4: Update ReEnrichWithQAUseCase.spec.ts**

- `AECStatus.REVIEW` → `AECStatus.REFINED`

- [ ] **Step 5: Run all use case tests**

Run: `cd backend && npx jest --testPathPattern='use-cases/' --verbose`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add backend/src/tickets/application/use-cases/ApproveTicketUseCase.spec.ts \
       backend/src/tickets/application/use-cases/AssignTicketUseCase.spec.ts \
       backend/src/tickets/application/use-cases/SubmitReviewSessionUseCase.spec.ts \
       backend/src/tickets/application/use-cases/ReEnrichWithQAUseCase.spec.ts
git commit -m "test: update use case tests for new lifecycle status names"
```

---

### Task 8: Update presentation layer (API backward compat + response field)

**Files:**
- Modify: `backend/src/tickets/presentation/dto/UpdateAECDto.ts`
- Modify: `backend/src/tickets/presentation/controllers/tickets.controller.ts`

- [ ] **Step 1: Add @Transform for backward-compatible status values**

CLI/MCP clients may still send old status values. Add a transform that migrates old values before validation:

```typescript
import { IsArray, IsString, IsOptional, IsIn, IsObject } from 'class-validator';
import { Transform } from 'class-transformer';
import { AECStatus } from '../../domain/value-objects/AECStatus';

/** Migrate old status strings sent by CLI/MCP clients */
const STATUS_COMPAT: Record<string, string> = {
  'dev-refining': 'defined',
  'review': 'refined',
  'forged': 'approved',
  'complete': 'delivered',
};

export class UpdateAECDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  acceptanceCriteria?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  assumptions?: string[];

  @Transform(({ value }) => STATUS_COMPAT[value] ?? value)
  @IsIn(Object.values(AECStatus))
  @IsOptional()
  status?: AECStatus;

  @IsObject()
  @IsOptional()
  techSpec?: Record<string, any>;
}
```

- [ ] **Step 2: Update controller API response — `forgedAt` → `approvedAt`**

In `tickets.controller.ts`, find the `toAECResponse` helper (around line 1433):
```typescript
// Old:
forgedAt: aec.forgedAt?.toISOString() ?? null,
// New:
approvedAt: aec.approvedAt?.toISOString() ?? null,
```

This is the API contract between backend and frontend. The frontend `AECResponse` interface must be updated in sync (Task 9a).

- [ ] **Step 3: Verify class-transformer is available**

Run: `grep 'class-transformer' backend/package.json`
Expected: Should already be a dependency (NestJS uses it). If not, install it.

- [ ] **Step 4: Commit**

```bash
git add backend/src/tickets/presentation/dto/UpdateAECDto.ts \
       backend/src/tickets/presentation/controllers/tickets.controller.ts
git commit -m "refactor: update presentation layer for lifecycle rename

Adds backward-compat @Transform for old CLI status values.
Renames forgedAt→approvedAt in API response."
```

---

### Task 9a: Update frontend AECResponse type

**Files:**
- Modify: `client/src/services/ticket.service.ts`

- [ ] **Step 1: Rename `forgedAt` → `approvedAt` in AECResponse interface**

Line 84:
```typescript
// Old:
forgedAt: string | null;
// New:
approvedAt: string | null;
```

- [ ] **Step 2: Search for any other `forgedAt` references in client services**

Run: `grep -rn 'forgedAt' client/src/services/ --include="*.ts"`
Expected: No remaining matches after the rename.

- [ ] **Step 3: Commit**

```bash
git add client/src/services/ticket.service.ts
git commit -m "refactor: rename forgedAt→approvedAt in frontend AECResponse type"
```

---

### Task 9b: Update frontend status config

**Files:**
- Modify: `client/src/tickets/config/ticketStatusConfig.ts`

- [ ] **Step 1: Update TICKET_STATUS_CONFIG**

Replace the full object (lines 15-64):
```typescript
export const TICKET_STATUS_CONFIG: Record<string, StatusConfig> = {
  draft: {
    label: 'Draft',
    description: 'PM creates the ticket',
    badgeClass: 'bg-[var(--bg-hover)] text-[var(--text-secondary)]',
    dotClass: 'bg-[var(--text-tertiary)]/50',
    textClass: 'text-[var(--text-tertiary)]',
    cliIcon: '⬜',
  },
  defined: {
    label: 'Defined',
    description: 'Developer reviews and refines the spec',
    badgeClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
    dotClass: 'bg-purple-500',
    textClass: 'text-purple-500',
    cliIcon: '🔧',
  },
  refined: {
    label: 'Refined',
    description: "PM reviews the developer's changes",
    badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    dotClass: 'bg-amber-500',
    textClass: 'text-amber-500',
    cliIcon: '⏳',
  },
  approved: {
    label: 'Approved',
    description: 'Approved — ready for the developer to pick up',
    badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    dotClass: 'bg-emerald-500',
    textClass: 'text-emerald-500',
    cliIcon: '✅',
  },
  executing: {
    label: 'Executing',
    description: 'Being built or sent to issue tracker',
    badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    dotClass: 'bg-blue-500',
    textClass: 'text-blue-500',
    cliIcon: '🚀',
  },
  delivered: {
    label: 'Delivered',
    description: 'Implementation delivered — awaiting review',
    badgeClass: 'bg-green-500/15 text-green-600 dark:text-green-400',
    dotClass: 'bg-green-500',
    textClass: 'text-green-500',
    cliIcon: '📦',
  },
};
```

- [ ] **Step 2: Update LIFECYCLE_STEPS**

Replace lines 67-74:
```typescript
export const LIFECYCLE_STEPS: Array<{ key: string; label: string; description: string; note?: string; optional?: boolean }> = [
  { key: 'draft', label: 'Draft', description: 'PM creates the ticket' },
  { key: 'defined', label: 'Defined', description: 'Developer reviews and refines the spec', note: 'Optional — skip if no developer needed', optional: true },
  { key: 'refined', label: 'Refined', description: "PM reviews the developer's changes", note: 'Only when a developer submits changes', optional: true },
  { key: 'approved', label: 'Approved', description: 'Approved — ready for the developer to pick up' },
  { key: 'executing', label: 'Executing', description: 'Developer or AI agent is implementing' },
  { key: 'delivered', label: 'Delivered', description: 'Implementation delivered — awaiting review' },
];
```

- [ ] **Step 3: Update EXECUTE_STATUSES**

Line 77:
```typescript
export const EXECUTE_STATUSES = new Set(['approved', 'executing', 'delivered']);
```

- [ ] **Step 4: Commit**

```bash
git add client/src/tickets/config/ticketStatusConfig.ts
git commit -m "refactor: update frontend status config for new lifecycle names

draft→Draft, defined→Defined, refined→Refined, approved→Approved,
executing→Executing, delivered→Delivered"
```

---

### Task 10: Update frontend hardcoded status strings

**Files:**
- Modify: `client/src/tickets/components/detail/OverviewCard.tsx`
- Modify: `client/src/tickets/components/detail/TicketDetailLayout.tsx`
- Modify: `client/app/(main)/tickets/[id]/page.tsx`
- Modify: `client/app/(main)/tickets/page.tsx`

- [ ] **Step 1: Update OverviewCard.tsx — NEXT_STEP_HINTS object**

Lines 23-48: Replace hardcoded status keys in the `NEXT_STEP_HINTS` object:
- `'draft'` key stays (unchanged)
- `'dev-refining'` → `'defined'`
- `'review'` → `'refined'`
- `'forged'` → `'approved'`
- `'executing'` key stays (unchanged)
- `'complete'` → `'delivered'`

- [ ] **Step 2: Update TicketDetailLayout.tsx — status checks**

Line 178: `ticket.status === 'review'` → `ticket.status === 'refined'`
Line 179: `ticket.status === 'dev-refining'` → `ticket.status === 'defined'`
Line 180: `ticket.status === 'draft'` stays (unchanged)
Line 544: `ticket.status === 'draft'` stays (unchanged)

- [ ] **Step 3: Update [id]/page.tsx — transition logic**

Line 711: `'forged'` → `'approved'` (approval status target)
Line 719: `'dev-refining'` → `'defined'` (assignee check)

- [ ] **Step 4: Update tickets/page.tsx — grid status checks**

Line 1405: `ticket.status === 'complete'` → `ticket.status === 'delivered'`
Line 1406: `ticket.status === 'executing'` stays (unchanged)
Line 1407: `ticket.status === 'draft'` stays (unchanged)

Also check lines 1410-1411 for any `'draft'` references (unchanged).

- [ ] **Step 5: Update tickets/page.tsx — WaitBadge component + usage**

Line 1609: Rename `WaitBadge` prop and internals:
```typescript
// Old:
function WaitBadge({ forgedAt }: { forgedAt: string | null }) {
  if (!forgedAt) return null;
  const days = Math.floor((Date.now() - new Date(forgedAt).getTime()) / ...);
// New:
function WaitBadge({ approvedAt }: { approvedAt: string | null }) {
  if (!approvedAt) return null;
  const days = Math.floor((Date.now() - new Date(approvedAt).getTime()) / ...);
```

Line 1798: Update status check AND prop name:
```typescript
// Old:
{ticket.status === 'forged' && <WaitBadge forgedAt={ticket.forgedAt} />}
// New:
{ticket.status === 'approved' && <WaitBadge approvedAt={ticket.approvedAt} />}
```

- [ ] **Step 6: Update tickets/page.tsx — `getLifecycleInfo` function map**

Lines 2013-2020: Replace all status keys in the map:
```typescript
  const map: Record<string, { label: string; colorClass: string; dot: string; next: string }> = {
    delivered:             { label: 'Delivered',         colorClass: 'text-green-500',              dot: 'bg-green-500',              next: 'Review the delivery report' },
    approved:              { label: 'Approved',          colorClass: 'text-amber-500',              dot: 'bg-amber-500',              next: 'Run forge execute to implement' },
    refined:               { label: 'Refined',           colorClass: 'text-amber-500',              dot: 'bg-amber-500',              next: 'PM needs to review and approve' },
    executing:             { label: 'Executing',         colorClass: 'text-blue-500',               dot: 'bg-blue-500',               next: 'Review and merge the implementation' },
    defined:               { label: 'Defined',           colorClass: 'text-purple-500',             dot: 'bg-purple-500',             next: 'Developer reviews and refines the spec' },
    draft:                 { label: 'Draft',             colorClass: 'text-[var(--text-tertiary)]', dot: 'bg-[var(--text-tertiary)]', next: 'Complete the ticket enrichment flow' },
  };
```

- [ ] **Step 7: Search for any remaining old status strings and forgedAt in client**

Run: `grep -rn "'dev-refining'\|'review'\|'forged'\|'complete'\|forgedAt" client/src/ client/app/ --include="*.ts" --include="*.tsx" | grep -v node_modules`
Expected: No matches. Fix any remaining references.

- [ ] **Step 8: Commit**

```bash
git add client/src/tickets/components/detail/OverviewCard.tsx \
       client/src/tickets/components/detail/TicketDetailLayout.tsx \
       client/app/\(main\)/tickets/\[id\]/page.tsx \
       client/app/\(main\)/tickets/page.tsx
git commit -m "refactor: update frontend hardcoded status strings to new lifecycle names

Updates: NEXT_STEP_HINTS, status checks, WaitBadge prop, getLifecycleInfo map"
```

---

### Task 11: Update CLI/MCP documentation

**Files:**
- Modify: `backend/docs/forge-cli/platform/ticket-lifecycle.md`
- Modify: `backend/docs/forge-cli/cli-and-mcp/mcp-integration.md`
- Modify: `backend/docs/forge-cli/cli-and-mcp/command-reference.md`

- [ ] **Step 1: Update ticket-lifecycle.md**

Replace all status references:
- `dev-refining` / `DEV_REFINING` → `defined` / `DEFINED`
- `review` / `REVIEW` → `refined` / `REFINED`
- `forged` / `FORGED` → `approved` / `APPROVED`
- `complete` / `COMPLETE` → `delivered` / `DELIVERED`

Update the lifecycle flow diagram to show:
`Draft → Defined → Refined → Approved → Executing → Delivered`

- [ ] **Step 2: Update mcp-integration.md**

Replace all status value references in tool schemas and descriptions.
Update the `update_ticket_status` tool's valid values list.

- [ ] **Step 3: Update command-reference.md**

Replace all status references in command descriptions:
- `forge review` requires `defined` status (was `dev-refining`)
- `forge develop` requires `approved` status (was `forged`)

- [ ] **Step 4: Commit**

```bash
git add backend/docs/forge-cli/
git commit -m "docs: update CLI/MCP documentation for new lifecycle status names"
```

---

### Task 12: Update sprint artifact docs (sweep)

**Files:** ~30 docs files with old status references

- [ ] **Step 1: Identify all docs with old references**

Run: `grep -rn "dev-refining\|FORGED\|DEV_REFINING\|COMPLETE\b" docs/ --include="*.md" | grep -v node_modules | grep -v superpowers/plans/`

- [ ] **Step 2: Update epic and story docs**

For each file found, replace:
- `dev-refining` → `defined`
- `DEV_REFINING` → `DEFINED`
- `REVIEW` (as status) → `REFINED`
- `FORGED` → `APPROVED`
- `COMPLETE` → `DELIVERED`

Be careful to only replace status references, not general English words like "review" or "complete" in prose.

- [ ] **Step 3: Commit**

```bash
git add docs/
git commit -m "docs: update sprint artifacts for new lifecycle status names"
```

---

### Task 13: Final verification sweep

- [ ] **Step 1: Search backend for any remaining old enum references**

Run: `grep -rn "DEV_REFINING\|\.REVIEW\b\|\.FORGED\b\|\.COMPLETE\b" backend/src/ --include="*.ts" | grep -v node_modules`
Expected: No matches.

- [ ] **Step 2: Search backend for old status string literals**

Run: `grep -rn "'dev-refining'\|'forged'\|'complete'" backend/src/ --include="*.ts" | grep -v node_modules | grep -v AECMapper | grep -v drift-detector`
Expected: No matches outside the migration map and drift detector legacy list.

- [ ] **Step 3: Search frontend for old status strings and forgedAt**

Run: `grep -rn "'dev-refining'\|'review'\|'forged'\|'complete'\|forgedAt" client/ --include="*.ts" --include="*.tsx" | grep -v node_modules`
Expected: No matches.

- [ ] **Step 4: Run full backend test suite**

Run: `cd backend && npx jest --verbose`
Expected: All tests pass.

- [ ] **Step 5: Run TypeScript build check**

Run: `cd backend && npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 6: Run frontend build check**

Run: `cd client && npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 7: Fix any remaining issues found in steps 1-6**

- [ ] **Step 8: Final commit (if any fixes needed)**

```bash
git commit -m "fix: resolve remaining lifecycle rename references"
```

---

## Notes

### Firestore Data Migration
No Firestore data migration script is needed. The AECMapper handles old status values transparently — when a document with `status: 'forged'` is read, it's migrated to `'approved'` in memory. When the document is next saved, it will be persisted with the new value. This is a lazy migration.

### API Backward Compatibility
The `@Transform` in `UpdateAECDto` ensures CLI/MCP clients sending old status values (`'forged'`, `'dev-refining'`, etc.) are automatically migrated to new values before validation. This can be removed once all CLI clients are updated.

### Controller SSE Events
The `phase: 'complete'` and `type: 'complete'` references in `tickets.controller.ts` are SSE event signaling (generation process completion), NOT ticket status values. These should NOT be changed.

### Pre-existing Test Issue
`ApproveTicketUseCase.spec.ts` tests that `DRAFT` is not approvable, but the production code includes DRAFT in `approvableStatuses` (PM-only workflow). This is a pre-existing mismatch — not caused by this rename. Do not change the behavior.
