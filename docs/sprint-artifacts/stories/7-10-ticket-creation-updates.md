# Story 7.10: Re-bake Ticket Frontend

Status: review

## Story

As a PM,
I want to click a "Re-bake Ticket" button on a ticket that has developer review answers,
so that the AI regenerates the tech spec and acceptance criteria using those answers — giving me an updated, implementation-ready ticket to review before approving.

## Acceptance Criteria

1. `ticketService.reEnrichTicket(ticketId: string)` method exists, calling `POST /api/tickets/:id/re-enrich` and returning `AECResponse`.
2. `ticketsStore.reEnrichTicket(ticketId)` action exists — calls service, on success updates both `currentTicket` and the item in `tickets[]` list, returns `boolean`.
3. A "Re-bake Ticket" button appears in the `TicketDetailLayout` "Developer Review Q&A" section when `isWaitingForApproval && hasReviewSession` — shown above the existing "Approve Ticket" button.
4. The "Re-bake Ticket" button has an independent loading state (`isReEnriching`) separate from the approve loading state.
5. On success: `fetchTicket(ticketId)` is called to refresh the full ticket (updated techSpec + acceptanceCriteria), and a toast shows "Ticket re-baked — spec updated with developer insights".
6. On error: a toast shows the error message and the button returns to its default state.
7. The "Re-bake Ticket" button is visually distinct from the "Approve Ticket" button — use a blue/indigo color so it doesn't look like a final approval action.
8. Both pre-tech-spec and post-tech-spec layout branches in `TicketDetailLayout` include the "Re-bake Ticket" button (same both locations where the Approve button is shown).
9. `tsc --noEmit` → 0 errors in client.

## Tasks / Subtasks

- [x] Task 1: Service — Add `reEnrichTicket()` to `ticket.service.ts` (AC: 1)
  - [x] In `client/src/services/ticket.service.ts`: add `async reEnrichTicket(ticketId: string): Promise<AECResponse>`
  - [x] Calls `this.client.post<AECResponse>(\`/tickets/${ticketId}/re-enrich\`, {})`
  - [x] Returns `response.data`

- [x] Task 2: Store — Add `reEnrichTicket()` action to `tickets.store.ts` (AC: 2)
  - [x] Add `reEnrichTicket: (ticketId: string) => Promise<boolean>` to the store interface
  - [x] Implementation calls `ticketService.reEnrichTicket(ticketId)`
  - [x] On success: update `currentTicket` if `currentTicket.id === ticketId`, update list item in `tickets[]`
  - [x] Returns `true` on success, `false` on error (with `console.error`)

- [x] Task 3: UI — Add "Re-bake Ticket" button to `TicketDetailLayout` (AC: 3, 4, 5, 6, 7, 8)
  - [x] In `TicketDetailLayout.tsx`: import `{ reEnrichTicket }` from `useTicketsStore()`
  - [x] Add `isReEnriching` state: `const [isReEnriching, setIsReEnriching] = useState(false)`
  - [x] Add `handleReEnrich()` function with loading guard, success/error toast, and `fetchTicket(ticketId)` on success
  - [x] Add "Re-bake Ticket" button inside both Q&A `CollapsibleSection` blocks (pre-tech-spec and post-tech-spec):
    - Placed ABOVE the existing "Approve Ticket" button
    - `disabled={isReEnriching}` — independent from `isApproving`
    - Blue/indigo color: `bg-blue-600 hover:bg-blue-700 text-white`
    - Icon: `<RefreshCw>` from lucide-react
    - Loading text: "Re-baking..." with spinner
  - [x] Import `RefreshCw` from `'lucide-react'`

- [x] Task 4: TypeScript check (AC: 9)
  - [x] Run `tsc --noEmit` in `client/` → only 2 pre-existing workspaceId errors from story 7-2, no new errors

## Dev Notes

### What This Completes

This is the final story in Epic 7. The PM flow is now end-to-end:

```
PM creates ticket → READY
Dev: forge review → Q&A → submit_review_session → WAITING_FOR_APPROVAL
PM: opens ticket → sees Q&A panel:
  [Re-bake Ticket]  ← this story
  [Approve Ticket]  ← story 7-8
  ↓ Re-bake → AI refreshes spec with Q&A context → PM reviews updated spec
  ↓ Approve → status READY (story 7-8)
Dev: forge execute → CREATED
```

### Service Pattern

Follow the exact pattern from `approveTicket()` (Story 7-8):

```typescript
async reEnrichTicket(ticketId: string): Promise<AECResponse> {
  const response = await this.client.post<AECResponse>(`/tickets/${ticketId}/re-enrich`, {});
  return response.data;
}
```

### Store Pattern

Follow the exact pattern from `approveTicket` in `tickets.store.ts`:

```typescript
reEnrichTicket: async (ticketId: string) => {
  try {
    const updatedTicket = await ticketService.reEnrichTicket(ticketId);
    set(state => ({
      currentTicket: state.currentTicket?.id === ticketId ? updatedTicket : state.currentTicket,
      tickets: state.tickets.map(t => t.id === ticketId ? updatedTicket : t),
    }));
    return true;
  } catch (error) {
    console.error('[TicketsStore] reEnrichTicket error:', error);
    return false;
  }
},
```

### UI Pattern

The button placement goes ABOVE the Approve button in the same `border-t` section:

```tsx
{isWaitingForApproval && (
  <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-2">
    {/* Re-bake button */}
    <Button
      onClick={handleReEnrich}
      disabled={isReEnriching}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
    >
      {isReEnriching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
      {isReEnriching ? 'Re-baking...' : 'Re-bake Ticket'}
    </Button>
    {/* Existing Approve button */}
    <Button ... >Approve Ticket</Button>
  </div>
)}
```

### Pre-existing TypeScript Errors

`client/` has pre-existing TS errors: `workspaceId` property on `AECResponse` referenced in `FigmaIntegration.tsx` and `LoomIntegration.tsx` — these are from story 7-2 and unrelated to this story. Run `tsc --noEmit` and confirm only those errors remain (count should be same as before this story).

### `fetchTicket` After Re-bake

After successful re-enrich, call `fetchTicket(ticketId)` (already passed as a prop) to reload the full ticket. The re-enrich updates `techSpec` and `acceptanceCriteria` — `fetchTicket` ensures the page shows the new spec immediately.

### References

- [Source: client/src/tickets/components/detail/TicketDetailLayout.tsx] — add buttons here (both branches)
- [Source: client/src/services/ticket.service.ts:249] — `approveTicket()` is the pattern to follow
- [Source: client/src/stores/tickets.store.ts:498] — `approveTicket` store action is the pattern
- [Source: backend/src/tickets/presentation/controllers/tickets.controller.ts] — `POST /:id/re-enrich` is the endpoint (story 7-7)

### Learnings from Previous Story

**From Story 7-9 (Status: review)**

- AECStatus enum values are now lowercase hyphenated (`'ready'`, `'waiting-for-approval'`) — already correct in client
- No client TS changes needed for status — client already used string literals matching backend format
- Pre-existing 10 backend test failures (CreateTeamUseCase/GetUserTeamsUseCase) are unrelated

[Source: stories/7-9-status-sync-web-cli.md#Dev-Agent-Record]

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/stories/7-10-ticket-creation-updates.context.xml

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Followed `approveTicket()` pattern exactly for both service and store — identical structure, just different endpoint `/re-enrich`
- Both layout branches (pre-tech-spec and post-tech-spec) updated together — they share the same `isWaitingForApproval` condition
- `isReEnriching` state is independent from `isApproving` — the two buttons can't interfere
- After successful re-enrich, `fetchTicket(ticketId)` is called to reload the ticket with the new techSpec and acceptanceCriteria
- Pre-existing client TS errors (2x `workspaceId` on AECResponse in FigmaIntegration/LoomIntegration) confirmed pre-existing from story 7-2, no new errors introduced

### File List

- `client/src/services/ticket.service.ts` — MODIFIED: added `reEnrichTicket()` method
- `client/src/stores/tickets.store.ts` — MODIFIED: added `reEnrichTicket` interface + action
- `client/src/tickets/components/detail/TicketDetailLayout.tsx` — MODIFIED: added RefreshCw import, isReEnriching state, handleReEnrich(), Re-bake button in both layout branches

---

## Senior Developer Review (AI)

- **Reviewer:** BMad
- **Date:** 2026-02-21
- **Outcome:** Approve

### Summary

All 9 ACs implemented and verified. Service method, store action, and UI button are all correct. Both layout branches (pre-tech-spec and post-tech-spec) include the Re-bake button. Independent loading state, `fetchTicket` refresh on success, success/error toasts, blue color distinguishing it from the green Approve button. No new TypeScript errors introduced.

### Key Findings

No blocking issues. No MEDIUM issues.

**LOW (Informational)**
- The story notes call 2 pre-existing `workspaceId` TypeScript errors "pre-existing" — they were introduced by story 7-2 (which removed `workspaceId` from `AECResponse`). These are tracked as a Changes Requested item in the story 7-2 review.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC1 | `ticketService.reEnrichTicket()` calls POST /re-enrich | IMPLEMENTED | `ticket.service.ts:255-258` |
| AC2 | `ticketsStore.reEnrichTicket()` updates currentTicket + list, returns boolean | IMPLEMENTED | `tickets.store.ts:520-535` |
| AC3 | Re-bake button shown when isWaitingForApproval && hasReviewSession, above Approve | IMPLEMENTED | `TicketDetailLayout.tsx:273,285-312` |
| AC4 | Independent `isReEnriching` state | IMPLEMENTED | `TicketDetailLayout.tsx:91` — separate from `isApproving` |
| AC5 | On success: fetchTicket called + toast success | IMPLEMENTED | `TicketDetailLayout.tsx:175-176` |
| AC6 | On error: toast error + button resets | IMPLEMENTED | `TicketDetailLayout.tsx:178`; `finally` block line 181 |
| AC7 | Blue/indigo color (not green) | IMPLEMENTED | `TicketDetailLayout.tsx:290` `bg-blue-600 hover:bg-blue-700` |
| AC8 | Both layout branches have Re-bake button | IMPLEMENTED | `TicketDetailLayout.tsx:284-312` (pre-spec) + `359-387` (post-spec) |
| AC9 | tsc → 0 new errors in client | IMPLEMENTED | 2 pre-existing workspaceId errors confirmed pre-existing |

**Summary: 9 of 9 ACs implemented**

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| Task 1: Service `reEnrichTicket()` | ✅ | VERIFIED | `ticket.service.ts:255-258` |
| Task 2: Store `reEnrichTicket()` action | ✅ | VERIFIED | `tickets.store.ts:519-535` |
| Task 3: UI Re-bake button (both branches) | ✅ | VERIFIED | `TicketDetailLayout.tsx:14,89,91,170,290,365` |
| Task 4: TypeScript check | ✅ | VERIFIED | 0 new errors; 2 pre-existing confirmed |

**Summary: 4 of 4 tasks verified**

### Test Coverage and Gaps

No unit tests for the service method or store action (consistent with pattern across ticket service/store). The UI button behavior relies on store mocking in integration tests. No test coverage gap specific to this story.

### Architectural Alignment

Follows established service/store/UI patterns exactly. `reEnrichTicket` mirrors `approveTicket` structure precisely. Button placement respects the existing component structure.

### Action Items

**Advisory Notes:**
- Note: The 2 pre-existing workspaceId TS errors (FigmaIntegration.tsx, LoomIntegration.tsx) will be resolved when story 7-2 changes are addressed
