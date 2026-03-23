# PM-Developer Handoff — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the dead zone between "PM approves ticket" and "developer starts coding" with three features: assignment nudge on approval, SLA visibility badges, and enhanced developer queue in CLI.

**Architecture:** All three features build on existing infrastructure — assignment, notification, and MCP list_tickets already work. We add a `forgedAt` timestamp to the AEC domain entity, a frontend dialog on approval, SLA badges in the ticket grid, and enhanced CLI output. No new services or endpoints needed.

**Tech Stack:** NestJS (backend domain + persistence), React/Next.js (frontend), Forge CLI MCP tools (TypeScript)

---

## File Structure

### Backend (domain + persistence)
- **Modify:** `backend/src/tickets/domain/aec/AEC.ts` — add `forgedAt` field, set in `approve()` AND `forge()`, add to constructor + `reconstitute()`
- **Modify:** `backend/src/tickets/infrastructure/persistence/mappers/AECMapper.ts` — persist `forgedAt`
- **Modify:** `backend/src/tickets/presentation/controllers/tickets.controller.ts` — include `forgedAt` in `mapToResponse()` (line ~1279)

### Frontend (approval nudge + SLA badges)
- **Modify:** `client/src/tickets/components/detail/TicketDetailLayout.tsx` — approval flow triggers `AssigneeSelector` via `externalOpen` prop
- **Modify:** `client/src/services/ticket.service.ts` — add `forgedAt` to `AECResponse` interface (line ~27)
- **Modify:** `client/app/(main)/tickets/page.tsx` — SLA badge in ticket grid rows

### CLI (enhanced developer queue)
- **Modify:** `forge-cli/src/mcp/tools/list-tickets.ts` — show wait time for FORGED tickets, sort by priority
- **Modify:** `forge-cli/src/types/ticket.ts` — add `forgedAt` to `TicketListItem` interface (line ~22)

### Backward compatibility note
Existing Firestore documents in FORGED status will not have a `forgedAt` field. The mapper handles this with `doc.forgedAt ? ... : null`. These tickets will show no SLA badge. This is an accepted limitation — no data migration needed.

---

## Task 1: Add `forgedAt` timestamp to AEC domain entity

**Files:**
- Modify: `backend/src/tickets/domain/aec/AEC.ts`

This is the foundation — Stories 2 and 3 depend on this field existing.

- [ ] **Step 1: Add `_forgedAt` as a constructor parameter and private field**

The AEC class uses a private constructor with positional parameters (line ~41). Add `_forgedAt` as a new parameter in the constructor, following the existing pattern. Also add the getter:

```typescript
// In constructor parameter list (after _generationJobId or similar):
private _forgedAt: Date | null = null,

// Getter (add after existing getters):
get forgedAt(): Date | null {
  return this._forgedAt;
}
```

- [ ] **Step 2: Update `createDraft()` to pass `null` for `forgedAt`**

In the `createDraft()` static factory (~line 94), pass `null` for the new `forgedAt` parameter in the `new AEC(...)` call. New tickets are never forged at creation.

- [ ] **Step 3: Update `reconstitute()` to accept and pass `forgedAt`**

In the `reconstitute()` static factory (~line 170):
- Add `forgedAt?: Date | null` to the positional parameter list (reconstitute uses positional params, not a named object)
- Pass `params.forgedAt ?? null` to the `new AEC(...)` call at the matching constructor position

- [ ] **Step 4: Set `forgedAt` in both `approve()` AND `forge()` methods**

Both methods transition tickets to FORGED status. Both must set the timestamp:

```typescript
// In approve() (~line 630):
approve(): void {
  this._status = AECStatus.FORGED;
  this._forgedAt = new Date();
  this._updatedAt = new Date();
}

// In forge() (~line 311):
forge(): void {
  // ... existing validation ...
  this._status = AECStatus.FORGED;
  this._forgedAt = new Date();
  this._updatedAt = new Date();
}
```

- [ ] **Step 5: Clear `forgedAt` in `sendBack()` and `revertToDraft()`**

`sendBack()` always moves backward from FORGED, so clear unconditionally:

```typescript
// In sendBack() (~line 477), add after status change:
this._forgedAt = null;

// In revertToDraft() (~line 387), add:
this._forgedAt = null;
```

- [ ] **Step 6: Add domain unit tests for `forgedAt` behavior**

Add tests to the existing AEC test file (find it via `*.spec.ts` or `*.test.ts` near `AEC.ts`):

```typescript
describe('forgedAt', () => {
  it('should set forgedAt when approved', () => {
    // Create a ticket in REVIEW status, call approve()
    expect(aec.forgedAt).toBeInstanceOf(Date);
  });

  it('should set forgedAt when forged via forge()', () => {
    // Create a ticket in DEV_REFINING, call forge()
    expect(aec.forgedAt).toBeInstanceOf(Date);
  });

  it('should clear forgedAt on sendBack', () => {
    // Approve, then sendBack
    expect(aec.forgedAt).toBeNull();
  });

  it('should reconstitute with forgedAt', () => {
    const date = new Date('2026-03-20');
    // Reconstitute with forgedAt: date
    expect(aec.forgedAt).toEqual(date);
  });
});
```

- [ ] **Step 7: Commit**

```bash
git add backend/src/tickets/domain/aec/AEC.ts
git commit -m "feat: add forgedAt timestamp to AEC domain entity

Set when ticket is approved (REVIEW → FORGED). Cleared on revert.
Enables SLA visibility for approved tickets waiting for development."
```

---

## Task 2: Persist `forgedAt` in Firestore mapper + API response

**Files:**
- Modify: `backend/src/tickets/infrastructure/persistence/mappers/AECMapper.ts`
- Modify: `backend/src/tickets/presentation/controllers/tickets.controller.ts` (or response DTO)

- [ ] **Step 1: Add `forgedAt` to `AECDocument` interface**

In `AECMapper.ts`, add to the `AECDocument` interface:

```typescript
forgedAt?: Timestamp | null;
```

- [ ] **Step 2: Map `forgedAt` in `toDomain()`**

In the `toDomain()` method, add alongside other date fields:

```typescript
forgedAt: doc.forgedAt ? doc.forgedAt.toDate() : null,
```

- [ ] **Step 3: Map `forgedAt` in `toFirestore()`**

In the `toFirestore()` method, add:

```typescript
forgedAt: aec.forgedAt ? Timestamp.fromDate(aec.forgedAt) : null,
```

- [ ] **Step 4: Include `forgedAt` in API response**

In `tickets.controller.ts`, find the `mapToResponse()` private method (~line 1279). Add alongside other date fields:

```typescript
forgedAt: aec.forgedAt?.toISOString() ?? null,
```

- [ ] **Step 5: Add `forgedAt` to frontend `AECResponse` interface**

In `client/src/services/ticket.service.ts` (~line 27), add to the `AECResponse` interface:

```typescript
forgedAt: string | null;
```

- [ ] **Step 6: Add `forgedAt` to CLI `TicketListItem` interface**

In `forge-cli/src/types/ticket.ts` (~line 22), add to the `TicketListItem` interface:

```typescript
forgedAt?: string | null;
```

- [ ] **Step 7: Verify type-check passes**

Run: `cd backend && npx tsc --noEmit`
Expected: Clean compile, no errors.

- [ ] **Step 8: Commit**

```bash
git add backend/src/tickets/infrastructure/persistence/mappers/AECMapper.ts backend/src/tickets/presentation/ client/src/services/ticket.service.ts
git commit -m "feat: persist forgedAt in Firestore and include in API response

Add forgedAt to AECDocument, mapper, API response, frontend AECResponse type, and CLI TicketListItem type."
```

---

## Task 3: Approval-time assignment nudge (frontend)

**Files:**
- Modify: `client/src/tickets/components/detail/TicketDetailLayout.tsx` — approval flow + state control
- Modify: `client/src/tickets/components/detail/AssigneeSelector.tsx` — add "Skip" option when opened externally

Note: `AssigneeSelector` is rendered inside `OverviewCard.tsx`, which receives `assignDialogOpen`/`onAssignDialogOpenChange` props from `TicketDetailLayout`. The state flows through this existing prop chain — do NOT add a second `AssigneeSelector` instance.

When PM clicks "Approve" and the ticket has no assignee, show a dialog asking them to assign a developer. They can assign or skip.

- [ ] **Step 1: Add state and modify `handleApprove`**

The existing `AssigneeSelector` component already supports `externalOpen` and `onExternalOpenChange` props — designed for exactly this case. Add state to control it:

```typescript
const [showAssignNudge, setShowAssignNudge] = useState(false);
const [pendingApproval, setPendingApproval] = useState(false);

const handleApprove = async () => {
  if (!ticket.assignedTo) {
    // Open the existing AssigneeSelector dialog programmatically
    setPendingApproval(true);
    setShowAssignNudge(true);
    return;
  }
  await executeApproval();
};

const executeApproval = async () => {
  setIsApproving(true);
  try {
    await approveTicket(ticket.id);
    await refetchTicket();
    toast.success('Ticket approved — the developer has been notified');
  } catch {
    toast.error('Failed to approve ticket');
  } finally {
    setIsApproving(false);
    setPendingApproval(false);
    setShowAssignNudge(false);
  }
};
```

- [ ] **Step 2: Wire `AssigneeSelector` with `externalOpen` for the nudge**

The `AssigneeSelector` already renders in `TicketDetailLayout`. Pass the `externalOpen` and `onExternalOpenChange` props:

```tsx
<AssigneeSelector
  assignedTo={ticket.assignedTo}
  onAssign={async (userId) => {
    const success = await assignTicket(ticket.id, userId);
    // If this was triggered by the approval nudge, approve after assigning
    if (success && pendingApproval) {
      await executeApproval();
    }
    return success;
  }}
  externalOpen={showAssignNudge}
  onExternalOpenChange={(open) => {
    setShowAssignNudge(open);
    // If dialog closed without assigning, still approve (user chose to skip)
    if (!open && pendingApproval && !ticket.assignedTo) {
      executeApproval();
    }
  }}
/>
```

This reuses the existing component with its team member fetching, role filtering, and UI — no duplication needed.

- [ ] **Step 3: Add "Skip" option to AssigneeSelector dialog**

In `AssigneeSelector.tsx`, when `externalOpen` is used, add a footer with a skip option. Check if there's a clean way to add this — the component already has a dialog footer area. Add a small text button:

```tsx
{/* Only show skip when opened externally (e.g., from approval nudge) */}
{externalOpen && (
  <button
    onClick={() => onExternalOpenChange?.(false)}
    className="w-full text-center text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] py-2 transition-colors"
  >
    Skip — approve without assigning
  </button>
)}
```

- [ ] **Step 4: Add error handling for the assign-then-approve flow**

Wrap the assign call with try/catch so a failed assignment doesn't silently proceed to approval:

```typescript
onAssign={async (userId) => {
  try {
    const success = await assignTicket(ticket.id, userId);
    if (success && pendingApproval) {
      await executeApproval();
    }
    return success;
  } catch {
    toast.error('Failed to assign — ticket not approved');
    setPendingApproval(false);
    return false;
  }
}}
```

The backend `ApproveTicketUseCase` already calls `notificationService.notifyTicketReady()` when an assignee exists, so the email fires automatically after both assign + approve succeed.

- [ ] **Step 6: Type-check**

Run: `cd client && npx tsc --noEmit`
Expected: Clean compile.

- [ ] **Step 7: Commit**

```bash
git add client/src/tickets/components/detail/TicketDetailLayout.tsx
git commit -m "feat: nudge PM to assign developer when approving unassigned ticket

Shows a dialog with team developers when PM clicks Approve on an
unassigned ticket. PM can assign (triggers notification) or skip."
```

---

## Task 4: SLA badge on ticket grid rows

**Files:**
- Modify: `client/app/(main)/tickets/page.tsx`

Show "Approved X days ago" badge on FORGED tickets in the grid. Color-coded by wait time.

- [ ] **Step 1: Verify `forgedAt` exists on the frontend ticket type**

This was already added in Task 2, Step 5 (`AECResponse` in `client/src/services/ticket.service.ts`). Verify it's available on the ticket objects used in the grid. If the grid uses a different type, add `forgedAt` there too.

- [ ] **Step 2: Create a helper function for the SLA badge**

Add near the existing cell components (`StatusCell`, `PriorityCell`, etc.):

```typescript
function WaitBadge({ forgedAt }: { forgedAt: string | null }) {
  if (!forgedAt) return null;

  const days = Math.floor((Date.now() - new Date(forgedAt).getTime()) / (1000 * 60 * 60 * 24));

  if (days === 0) return null; // approved today, no badge needed

  const color = days <= 1
    ? 'text-emerald-400/70'
    : days <= 3
      ? 'text-amber-400/70'
      : 'text-red-400/70';

  const label = days === 1 ? '1 day' : `${days} days`;

  return (
    <span className={`text-[10px] ${color}`}>
      {label}
    </span>
  );
}
```

- [ ] **Step 3: Add the badge to FORGED ticket rows**

In the ticket grid row rendering (~line 1179-1183, after the StatusCell), add the wait badge for FORGED tickets:

```tsx
{/* Status cell */}
<StatusCell status={ticket.status} />
{ticket.status === 'forged' && (
  <WaitBadge forgedAt={ticket.forgedAt} />
)}
```

Or integrate it into the StatusCell itself — append the wait time after the status text for FORGED tickets only.

- [ ] **Step 4: Type-check**

Run: `cd client && npx tsc --noEmit`
Expected: Clean compile.

- [ ] **Step 5: Commit**

```bash
git add client/app/\(main\)/tickets/page.tsx
git commit -m "feat: show SLA wait-time badge on approved tickets in grid

Color-coded: green (≤1 day), amber (2-3 days), red (>3 days).
Helps PMs spot tickets stuck in approved status."
```

---

## Task 5: Enhanced CLI developer queue with wait time

**Files:**
- Modify: `forge-cli/src/mcp/tools/list-tickets.ts`

When using `filter: 'mine'`, show wait time for FORGED tickets and sort by priority.

- [ ] **Step 1: Add wait time column to the table output**

In `list-tickets.ts`, update the table headers and row rendering. Add a "Waiting" column for FORGED tickets:

```typescript
const headers = ['ID', 'Title', 'Status', 'Priority', 'Waiting'];

const rows = tickets.map((t) => {
  const waiting = t.status === 'forged' && t.forgedAt
    ? formatWaitTime(new Date(t.forgedAt))
    : '—';
  return [
    t.slug ?? t.id.slice(0, 8),
    truncate(t.title, 40),
    t.status,
    t.priority ?? '—',
    waiting,
  ];
});
```

- [ ] **Step 2: Add the `formatWaitTime` helper**

```typescript
function formatWaitTime(forgedAt: Date): string {
  const days = Math.floor((Date.now() - forgedAt.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return '1 day';
  return `${days} days`;
}
```

- [ ] **Step 3: Sort by priority when using `filter: 'mine'`**

Add priority sorting so urgent/high tickets appear first:

```typescript
const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

if (filter === 'mine') {
  tickets.sort((a, b) => {
    const pa = priorityOrder[a.priority ?? 'medium'] ?? 2;
    const pb = priorityOrder[b.priority ?? 'medium'] ?? 2;
    return pa - pb;
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add forge-cli/src/mcp/tools/list-tickets.ts
git commit -m "feat: show wait time and priority sort in /forge:list mine

FORGED tickets show 'waiting X days' column. Results sorted by
priority (urgent first) when using filter: mine."
```

---

## Task 6: Final verification

- [ ] **Step 1: Backend type-check**

Run: `cd backend && npx tsc --noEmit`
Expected: Clean compile.

- [ ] **Step 2: Client type-check**

Run: `cd client && npx tsc --noEmit`
Expected: Clean compile.

- [ ] **Step 3: Verify the full flow mentally**

1. PM creates ticket → refines → spec generates → status: REVIEW
2. PM clicks "Approve" → unassigned → nudge dialog appears
3. PM picks a developer → assign fires → approve fires → `forgedAt` set → email sent
4. Ticket grid shows "Approved" badge with "2 days" in amber
5. Developer runs `/forge:list` with `filter: mine` → sees ticket with "2 days" waiting, sorted by priority
6. Developer picks ticket → starts implementation

- [ ] **Step 4: Commit any remaining changes (if any)**

Stage specific files only — do not use `git add -A`. Check `git status` and add only the files that changed.
