# Product Brief: Forge Ticket Folders

**Date:** 2026-03-01
**Author:** BMad
**Context:** Product Feature (Existing Platform Enhancement)

---

## Executive Summary

Forge's ticket feed currently presents all tickets in a flat, unorganized list. As teams scale and ticket volume grows, this becomes difficult to navigate. Ticket Folders introduces a lightweight, team-scoped folder hierarchy to the ticket feed, enabling teams to organize tickets into logical groups (e.g., by epic, sprint, feature area). The hierarchy is capped at two levels (root → folder → tickets) to maintain simplicity. Folders render as collapsible inline sections in the existing feed — no new panels, no drill-in navigation. A future companion feature — Firebase Real-time Sync — may add live updates but is gated on cost analysis.

---

## Core Vision

### Problem Statement

As Forge teams accumulate tickets, the flat ticket feed becomes increasingly difficult to navigate. All tickets — across epics, sprints, bug fixes, and feature areas — sit at the same level with no organizational structure. Users have no way to group related tickets, making it hard to find what they need and see the big picture of their work. This friction grows linearly with ticket count and team size.

### Problem Impact

- **Reduced productivity**: Users spend more time scanning the feed to find relevant tickets
- **Lost context**: Related tickets (e.g., all tickets for a feature) aren't visually grouped, making it harder to track progress on a body of work
- **Scaling barrier**: As Forge attracts larger teams with more tickets, the flat feed becomes a usability bottleneck that could drive users to competing tools with better organization

### Why Existing Solutions Fall Short

Currently, the only way to manage ticket visibility is through status filters and search. This helps find specific tickets but doesn't provide persistent organization. Users cannot create their own logical groupings, and there's no way to declutter the root feed by tucking related tickets into named containers.

### Proposed Solution

Add a folder system directly into the existing ticket feed. Folders appear as collapsible inline sections at the top of the feed, above unfiled tickets. Any team member can create, rename, and delete folders. Tickets can be moved into and out of folders. The folder structure is team-scoped (all team members see the same folders), while each user's collapsed/expanded preferences are stored privately.

### Key Differentiators

- **Inline collapsible design** — No new panels, sidebars, or navigation. Folders live in the feed itself.
- **File-system mental model** — A ticket lives in one place (root or a folder). Moving it to a folder removes it from root, reducing noise.
- **Team-scoped structure, user-scoped preferences** — Everyone sees the same organization, but each user controls their own expanded/collapsed view.
- **Intentionally generic** — Folders are free-form containers with no enforced semantics. Users organize however they want — by epic, sprint, priority, feature, or any scheme that fits their workflow.

---

## Target Users

### Primary Users

**Forge team members (PMs and Developers)** who work with a growing number of tickets and need to impose structure on their feed. These are users who:

- Belong to a team with 10+ active tickets
- Work across multiple epics or feature areas simultaneously
- Want to reduce visual noise and find relevant tickets faster
- May think in terms of epics, sprints, or custom groupings — the system doesn't prescribe

### User Journey

1. User opens ticket feed → sees flat list of tickets (current state, no folders yet)
2. User clicks "+ New Folder" → names it (e.g., "Epic 2") → folder appears at top of feed
3. User moves tickets into the folder (drag-and-drop or context menu "Move to...")
4. Tickets disappear from root level, now live inside the folder
5. User clicks folder chevron to expand/collapse → sees tickets inside
6. Collapsed/expanded state persists across sessions for that user only
7. Other team members see the same folders but control their own expand/collapse state
8. Users in other teams see nothing — strict team isolation

---

## MVP Scope

### Core Features

**Feature A: Folder CRUD**
- Create a folder: Small "+ Folder" button near the top of the feed
- Rename a folder: Inline edit or context menu
- Delete a folder: Context menu with confirmation. Tickets inside move back to root (unfiled)
- Any team member can create/rename/delete folders (no role restrictions for MVP)

**Feature B: Folder Display — Inline Collapsible**
- Folders render as collapsible rows at the top of the ticket feed
- Visual treatment: folder icon, name, ticket count badge, expand/collapse chevron
- Sorted alphabetically among themselves
- Below all folders: unfiled tickets in their existing sort order
- Click chevron to expand → shows tickets inside, indented
- Click chevron to collapse → hides tickets, shows only folder row with count

**Feature C: Ticket Organization**
- Move ticket into a folder via right-click → "Move to folder..." submenu
- **Drag-and-drop**: Drag ticket rows to folder headers or "Unfiled" drop zone (grab cursor, ghost preview, blue ring highlight on targets)
- Move ticket out of a folder back to root
- Create a new ticket directly inside a folder
- A ticket lives in exactly one place: root OR one folder (file-system model)
- Moving a ticket to a folder removes it from root view

**Feature D: User Preference — Expand/Collapse State**
- Each user's collapsed/expanded state per folder is stored privately
- Persists across sessions and page reloads
- Does not affect other team members' views
- Storage: simple key-value map per user (e.g., `{ folderId: boolean }`)
- Default for newly created folders: collapsed

**Feature E: Team Isolation**
- Folders are scoped to a team — only visible to team members
- Strict isolation: Team A's folders and tickets never leak to Team B
- Consistent with existing Forge team isolation model

### Hierarchy Constraints

- **Maximum 2 levels**: Root (Level 0) → Folder (Level 1) → Tickets
- Folders CANNOT contain other folders (no nesting)
- Tickets can exist at root level (unfiled) or inside one folder

### Out of Scope for MVP

- **Nested folders** — Intentionally excluded. Max 2-level hierarchy keeps it simple.
- **Firebase Real-time Sync** — Live updates when another team member creates/moves folders or tickets. Gated on cost analysis (see Future Vision). MVP uses refresh-based updates.
- **Folder permissions/roles** — Any team member can manage any folder. Role-based restrictions may come later.
- **Drag-and-drop reordering of folders** — Alphabetical sort for MVP. Custom ordering is a future enhancement.
- **Bulk ticket operations** — Moving multiple tickets at once. Single-ticket moves for MVP.
- **Folder colors or icons** — Plain folder icon for MVP. Customization later.

> **Note (2026-03-02):** Drag-and-drop for moving tickets into folders was implemented as part of the MVP delivery, exceeding the original scope. Folder reordering via drag-and-drop remains out of scope.

### MVP Success Criteria

- Users can create folders, move tickets into them, and collapse/expand to manage feed clutter
- Folder structure is consistent across all team members
- Expand/collapse state is private to each user and persists across sessions
- No data leakage between teams
- Feed performance is not degraded with folders present

---

## Future Vision

- **Firebase Real-time Sync**: Evaluate Firestore onSnapshot listeners or Firebase Realtime Database for live folder/ticket updates across team members without refresh. Designed as a general-purpose real-time layer that future features (notifications, presence indicators, live collaboration) can reuse. Gated on cost projection: Firebase charges per connection and per read — N team members x always-on listeners x every mutation must be modeled before committing.
- **Bulk operations**: Select multiple tickets and move to a folder in one action
- **Folder customization**: Colors, icons, or emoji for visual differentiation
- **Custom folder ordering**: Drag-and-drop to reorder folders instead of alphabetical
- **Smart folders**: Auto-populated folders based on filters (e.g., "All READY tickets")
- **Folder-level actions**: Archive all tickets in a folder, bulk status change

---

## Technical Preferences

### Platform & Stack

- **Backend**: Existing Forge backend (Node.js/Express, Firebase ecosystem)
- **Frontend**: Existing Forge web app (React)
- **Database**: Firebase Firestore (consistent with existing data layer)
- **Team isolation**: Leverage existing team-scoped data patterns (teamId-based queries)

### Data Model Considerations

- **Folder entity**: `{ id, teamId, name, createdBy, createdAt, updatedAt, sortOrder }`
- **Ticket-to-folder relationship**: Add optional `folderId` field to ticket (null = unfiled/root)
- **User preference**: `{ userId, folderStates: { [folderId]: boolean } }` — stored per-user, not per-team
- **Queries**: Tickets filtered by `teamId` + optionally by `folderId`. Folders filtered by `teamId` only.

### Key Technical Constraints

- Updates are refresh-based for MVP (no WebSockets or Firebase listeners)
- Folder operations must maintain team isolation at the database query level
- Expand/collapse state should be lightweight — local storage or a small Firestore document per user
- Backward compatible: existing tickets with no `folderId` appear as unfiled at root

---

## Risks and Assumptions

### Assumptions

- Teams will have a manageable number of folders (< 20). No pagination of folders needed for MVP.
- Alphabetical sorting is sufficient for MVP. Users won't need custom ordering immediately.
- The existing ticket feed component can be extended with collapsible sections without a major rewrite.
- Refresh-based updates are acceptable for MVP — teams will adopt real-time sync later if justified.

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Feed performance with many expanded folders | Sluggish UI | Lazy-render tickets inside collapsed folders; only load when expanded |
| Conflicting folder edits (two users rename/delete same folder simultaneously) | Data inconsistency | Last-write-wins for MVP; real-time sync would solve in future |
| Users expecting nested folders | Feature requests / confusion | Clear UI affordance (no "new folder" button inside folders); document limitation |
| Firebase real-time costs higher than expected | Feature delay | Gated as separate epic; folder MVP works without it |

---

_This Product Brief captures the vision and requirements for Forge Ticket Folders._

_It was created through collaborative discovery and reflects the unique needs of this product feature enhancement._

_Next: Use the PRD workflow to create detailed product requirements from this brief._
