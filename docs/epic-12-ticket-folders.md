# Epic 12: Ticket Folders

**Priority:** P1
**Product Brief:** `docs/product-brief-forge-ticket-folders-2026-03-01.md`
**Goal:** Add inline collapsible folder organization to the ticket feed, enabling teams to group tickets into named folders with a max 2-level hierarchy (root → folder → tickets).

---

## Context

The ticket feed is currently flat — all tickets at the same level regardless of team size or ticket count. This epic introduces team-scoped folders that appear as collapsible sections at the top of the feed, with unfiled tickets below. Folder structure is shared across the team; expand/collapse UI state is private per user.

---

## Stories

### Story 12.1: Folder Domain Model & Backend API

**Goal:** Create the Folder entity, repository, and CRUD API endpoints.

**Acceptance Criteria:**
- Folder entity with fields: `id`, `teamId`, `name`, `createdBy`, `createdAt`, `updatedAt`
- Folder scoped to team — all queries filter by `teamId`
- API endpoints:
  - `POST /api/teams/:teamId/folders` — Create folder (name required, must be unique within team)
  - `GET /api/teams/:teamId/folders` — List all folders for team (alphabetical)
  - `PATCH /api/teams/:teamId/folders/:folderId` — Rename folder
  - `DELETE /api/teams/:teamId/folders/:folderId` — Delete folder (tickets inside move to root/unfiled)
- Team isolation enforced at query level — no cross-team folder access
- Input validation: folder name required, reasonable max length
- Returns folder with ticket count in list endpoint

---

### Story 12.2: Ticket-Folder Relationship & Move API

**Goal:** Add optional `folderId` to tickets and API endpoints to move tickets between folders and root.

**Acceptance Criteria:**
- Add optional `folderId` field to ticket entity (null = unfiled/root)
- API endpoints:
  - `PATCH /api/teams/:teamId/tickets/:ticketId/move` — Move ticket to a folder (`{ folderId }`) or back to root (`{ folderId: null }`)
- When a folder is deleted, all tickets inside have `folderId` set to null (returned to root)
- Ticket queries support filtering by `folderId` (for rendering folder contents)
- Existing tickets without `folderId` are backward-compatible (appear as unfiled)
- Validate that target folder belongs to same team as ticket

---

### Story 12.3: Folder UI — Inline Collapsible Feed

**Goal:** Render folders as collapsible sections at the top of the ticket feed.

**Acceptance Criteria:**
- Folders render above unfiled tickets in the feed
- Each folder row shows: chevron (expand/collapse), folder icon, folder name, ticket count badge
- Folders sorted alphabetically
- Click chevron to expand → shows folder's tickets indented below
- Click chevron to collapse → hides tickets, shows only folder row
- Unfiled tickets (no `folderId`) render below all folders in existing sort order
- Visual separator between folders section and unfiled tickets
- Empty folders display with count of 0, still expandable (shows empty state)
- Responsive — works on existing supported screen sizes

---

### Story 12.4: Folder CRUD UI

**Goal:** Frontend controls for creating, renaming, and deleting folders.

**Acceptance Criteria:**
- "+ New Folder" button near the top of the feed (small, unobtrusive)
- Click → inline input field or modal to enter folder name → creates folder
- Folder context menu (right-click or three-dot icon):
  - Rename — inline edit of folder name
  - Delete — confirmation dialog: "Delete folder? X tickets will be moved to the feed."
- Optimistic UI updates where appropriate
- Error handling for duplicate names, network failures
- Any team member can perform all CRUD operations (no role restrictions)

---

### Story 12.5: Ticket Move UX

**Goal:** Enable users to move tickets into and out of folders.

**Acceptance Criteria:**
- Context menu on ticket: "Move to..." → shows list of team's folders + "Root (unfiled)" option
- **Drag-and-drop**: Drag ticket row to folder header or "Unfiled" drop zone to move
- Ticket moved into a folder disappears from root view (file-system model)
- Ticket moved out of a folder reappears in root view
- When creating a new ticket while a folder is expanded, offer option to create inside that folder
- Visual feedback on successful move (toast notification)
- Drag feedback: grab cursor on hover, ghost preview while dragging, blue ring on valid drop targets
- Works for tickets at root level and tickets already inside a folder (move between folders)

---

### Story 12.6: User Expand/Collapse State Persistence

**Goal:** Store each user's folder collapsed/expanded preferences privately, persisting across sessions.

**Acceptance Criteria:**
- Each user's expand/collapse state per folder stored privately (not visible to other team members)
- State persists across sessions and page reloads
- Storage: lightweight key-value map `{ [folderId]: boolean }` per user
- Default state for newly created folders: collapsed
- When a folder is deleted, its state entry is cleaned up
- State stored efficiently — local storage with Firestore backup, or small Firestore document per user
- Does not affect other team members' expand/collapse state in any way

---

## Dependencies

- Existing team infrastructure (Epic 1, Epic 3)
- Existing ticket CRUD and feed UI (Epic 7)

## Implementation Notes (2026-03-02)

All 6 stories implemented on branch `feat/epic-12-ticket-folders`.

**Beyond-MVP additions:**
- **Drag-and-drop tickets to folders** — HTML5 Drag and Drop API. Ticket rows are draggable; folder headers and an "Unfiled" drop zone are drop targets. Visual feedback: grab cursor on hover, ghost preview while dragging, blue ring highlight on valid drop targets.
- **Nested ticket visual hierarchy** — Tickets inside folders render with indented title cell (`pl-6`), horizontal dash connector, and subtle background tint to visually connect them to the parent folder.

**Backend fixes discovered during implementation:**
- NestJS route ordering: literal `move-ticket/:ticketId` route declared before generic `:folderId` parameterized route
- Firestore Timestamp conversion: duck-typed `toDate()` helper instead of `instanceof Timestamp` (fails across package versions)
- Added `folderId` to ticket API response mapping

---

## Future (Not in this Epic)

- Firebase real-time sync (separate gated epic — pending cost analysis)
- Bulk move operations
- Folder colors, icons, or emoji customization
- Custom folder ordering (non-alphabetical)
- Nested folders (intentionally excluded — max 2 levels)
