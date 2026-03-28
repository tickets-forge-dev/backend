# Ticket Lifecycle on Develop — Design Spec

**Date:** 2026-03-27
**Status:** Approved

## Problem

When a developer starts implementation via `forge develop` (MCP `start_implementation`), the ticket transitions APPROVED → EXECUTING on the backend, but:

1. **The UI doesn't refresh** — the ticket detail page fetches once on mount and never polls, so the PM sees "Ready" indefinitely
2. **No notification** — the ticket creator (PM) has no idea work has started
3. **No way to deliver** — when the developer finishes coding, there's no MCP tool to call `submit_settlement`, so the ticket stays stuck at EXECUTING forever
4. **No execution event recording** — the developer agent can't log decisions, risks, or scope changes during implementation

The backend endpoints for settlement (`POST /tickets/:id/settle`) and execution events (`POST /tickets/:id/execution-events`) already exist. The MCP tool wrappers in forge-cli were never created.

## Solution

Eight changes across three layers:

### 1. Backend — Notification on Implementation Start

**File:** `backend/src/notifications/notification.service.ts`

Add `notifyImplementationStarted(ticketId, creatorUserId, ticketTitle)`:
- Looks up the **creator's** email (not assignee — this is the PM who wrote the ticket)
- Sends email: "[Forge] Development started: {title}"
- Body: "{title} is now being implemented. You'll be notified when it's ready for review."
- Fire-and-forget pattern (errors logged, not thrown) — same as existing notification methods

### 2. Backend — Wire Notification into StartImplementationUseCase

**File:** `backend/src/tickets/application/use-cases/StartImplementationUseCase.ts`

- Inject `NotificationService`
- After persisting, notify the ticket creator:
  ```
  if (aec.createdBy) {
    void this.notificationService
      .notifyImplementationStarted(command.ticketId, aec.createdBy, aec.title)
      .catch(err => this.logger.warn('Notification failed', err));
  }
  ```

### 3. Backend — Email Templates

**File:** `backend/src/notifications/templates/notification-email.template.ts`

Add `generateImplementationStartedEmailHtml()` and `generateImplementationStartedEmailText()`:
- Follow existing template pattern (emailShell wrapper, escapeHtml, emailButton)
- Subject: "[Forge] Development started: {title}"
- CTA button: "View Ticket" linking to ticket URL

### 4. Frontend — Ticket Detail Page Polling

**File:** `client/app/(main)/tickets/[id]/page.tsx`

Add a polling `useEffect` that silently refreshes the ticket every 15 seconds:
- Uses existing `refreshTicket(ticketId)` from Zustand store (silent fetch, no loader)
- Only polls when `document.visibilityState === 'visible'` (no wasted requests on background tabs)
- Cleans up interval on unmount or ticketId change
- Status badge already derives from `currentTicket.status`, so it re-renders automatically

### 5. MCP Tool — `submit_settlement`

**File:** `forge-cli/src/mcp/tools/submit-settlement.ts` (new)

Tool definition:
- **Name:** `submit_settlement`
- **Parameters:** `ticketId` (string), `executionSummary` (string), `filesChanged` (array of `{path, additions, deletions}`), `divergences` (optional array of `{area, intended, actual, justification}`)
- **Handler:** Validates inputs, calls `POST /tickets/:id/settle` via ApiService
- **Returns:** Success message with ticketId and new status ("delivered")

This is what transitions EXECUTING → DELIVERED and creates the Change Record.

### 6. MCP Tool — `record_execution_event`

**File:** `forge-cli/src/mcp/tools/record-execution-event.ts` (new)

Tool definition:
- **Name:** `record_execution_event`
- **Parameters:** `ticketId` (string), `type` ("decision" | "risk" | "scope_change"), `title` (string), `description` (string)
- **Handler:** Validates inputs, calls `POST /tickets/:id/execution-events` via ApiService
- **Returns:** Success message with event ID

Called during implementation to accumulate events that get bundled into the Change Record on delivery.

### 7. Backend — Notification on Settlement Delivery

**File:** `backend/src/tickets/application/use-cases/SubmitSettlementUseCase.ts`

`SubmitSettlementUseCase` currently has no notification. When the developer delivers, the PM should be notified that the Change Record is ready for review.

- Inject `NotificationService`
- After persisting, call existing `notifyTicketReadyForReview(ticketId, createdBy, title)`
- Same fire-and-forget pattern

### 8. MCP Server — Register New Tools

**File:** `forge-cli/src/mcp/server.ts`

- Import new tool definitions and handlers
- Add to `ListToolsRequestSchema` handler (tool list)
- Add cases to `CallToolRequestSchema` handler (tool dispatch)

## What's NOT Changed

- **Domain entity** (`AEC.ts`) — `startImplementation()`, `deliver()`, `recordExecutionEvent()` all work correctly
- **Change Record model** — no new statuses; record is created at delivery (EXECUTING → DELIVERED) as designed
- **Backend REST endpoints** — `/settle`, `/execution-events`, `/review-delivery` all exist
- **DTOs and validation** — already implemented
- **Records page UI** — already displays Change Records with filtering and review actions

## Lifecycle After This Fix

```
APPROVED  →  EXECUTING  →  DELIVERED  →  (PM reviews)
   ↑            ↑              ↑
   │         start_impl     submit_settlement
   │         + notify PM    + create ChangeRecord
   │         + UI polls     + notify PM (ready for review)
   │
   │         During EXECUTING:
   │         record_execution_event (decisions, risks, scope changes)
   │
   └── requestChanges sends back to EXECUTING
```
