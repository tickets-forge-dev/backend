# Epic 24: Bidirectional Jira/Linear Integration — Wireframe Guide

**Status:** Complete
**Date:** 2026-02-09
**Files:**
- `EPIC-24-Bidirectional-Integration.excalidraw` (Screens 1-3)
- `EPIC-24-Export-Dialogs.excalidraw` (Screens 4-6)

---

## Overview

This wireframe set covers the **complete bidirectional integration flow** for Epic 24. The UX separates two distinct paths at entry:
- **Create Path:** User-driven ticket creation (existing flow, unchanged)
- **Import Path:** Enriching existing Jira/Linear tickets through Forge analysis

---

## Screen 1: Entry Point — Creation Choice Modal

**File:** `EPIC-24-Bidirectional-Integration.excalidraw`

**Purpose:** User chooses between creating a new ticket from scratch or importing an existing one.

**Key Elements:**
- **Two prominent cards** with icons, titles, descriptions, and action buttons
- **"Create New from Scratch"** (left)
  - Icon: ✏️
  - CTA: "Start Creating →" (blue button)
  - Description: Leads to `/create?mode=new`

- **"Import & Enrich from Jira/Linear"** (right)
  - Icon: 📥
  - CTA: "Start Importing →" (green button)
  - Description: Leads to `/create?mode=import`

**Routing:**
- Create path → `/create?mode=new` → Existing GenerationWizard
- Import path → `/create?mode=import` → New ImportWizard

**Design Notes:**
- Clean separation — no tabs, no cognitive overhead
- Each card is self-contained and describes the path clearly
- Linear-inspired: calm, minimal styling
- Responsive: Cards stack on mobile

---

## Screen 2: Import Wizard — Stage 1: Ticket Selector

**File:** `EPIC-24-Bidirectional-Integration.excalidraw`

**Purpose:** User selects which Jira/Linear ticket to import.

**Key Elements:**
- **Platform selector** (dropdown)
  - Shows connected platform (🔷 Jira, ✓ Linear)
  - Allows switching if multiple platforms connected

- **Search box** with placeholder "Search tickets by name, key, or number..."

- **Recent open tickets list**
  - Each ticket shows: Issue key, Title
  - Clickable rows
  - Example: PROJ-123 "Add User Authentication with OAuth2"

- **Pagination** (20 tickets per page, implied)

- **Action buttons**
  - Cancel (left, secondary)
  - Import & Continue (right, green primary)

**Data Flow:**
- User selects ticket → Fetch full details from backend
- Auto-populate Stage 2 preview screen

**State Management:**
- `ImportWizardStore.selectedTicket` = ticket object
- `ImportWizardStore.importedFrom` = { platform, issueId, issueUrl }

---

## Screen 3: Import Wizard — Stage 2: Preview & Confirmation

**File:** `EPIC-24-Bidirectional-Integration.excalidraw`

**Purpose:** Show imported ticket data before proceeding. User can edit fields or go back.

**Key Elements:**
- **Imported source badge**
  - "🔷 Imported from Jira" (blue)
  - Shows original issue key and URL

- **Preview card** with auto-filled fields
  - Issue key (e.g., PROJ-123) — blue, clickable
  - Title (inherited from Jira/Linear)
  - Description (snippet from Jira/Linear)
  - Acceptance Criteria (if present)
  - Type (e.g., "Feature")
  - Priority (e.g., "High")

- **"Edit before continuing" option** (optional)
  - Users can modify title, description, etc. before proceeding

- **Action buttons**
  - Back (secondary) — Return to ticket selector
  - Continue (green primary) — Proceed to Stage 3 (repo selection)

**Design Notes:**
- Read-only preview of imported data
- Clear visual that this came from Jira/Linear
- All fields shown at a glance
- Option to edit without re-importing (improves UX)

---

## Screen 4: Import Wizard — Stage 3: Repository Selection

**File:** `EPIC-24-Export-Dialogs.excalidraw`

**Purpose:** User selects which repository (or multiple repos) to analyze for the imported ticket.

**Key Elements:**
- **Title with context**
  - "Select Repository for Analysis"
  - Subtitle: "Analyzing repo for: Add User Authentication with OAuth2"

- **Selected repositories list** (multi-repo support)
  - Each repo shows:
    - Icon: 📁
    - Repository name (e.g., "idana/forge-client")
    - Branch dropdown (e.g., "feature/auth ▼")
    - Remove button (×)

- **"Add Repository" button**
  - Allows adding up to 5 repos
  - Future multi-repo capability

- **"Analyze" button** (blue primary)
  - Triggers deep analysis on selected repos with imported ticket context

**State Management:**
- `ImportWizardStore.repositories` = Array of { owner, name, branch }
- Analysis runs with context: "This feature imported from Jira PROJ-123"

**Design Notes:**
- Same multi-repo UI as Create flow (Story 23-4 integration)
- Branch selector per repo (allows different branches per repo)
- Matches future multi-repo support in Epic 23

---

## Screen 5: Ticket Detail Page — Imported & Exported Tracking

**File:** `EPIC-24-Export-Dialogs.excalidraw`

**Purpose:** Show finalized ticket with clear tracking of import source and any exports.

**Key Elements:**
- **Hero header**
  - Ticket title (large, bold)
  - Status badges (imported + exported)

- **Import source badge**
  - 🔷 "Imported from Jira PROJ-123"
  - Blue, clickable → opens original Jira issue

- **Export status badges** (if exported)
  - ✓ "Exported to Linear TEAM-456"
  - Green, clickable → opens Linear issue
  - Can show multiple if exported to both platforms

- **Technical Specification section**
  - Problem Statement
  - Solution
  - (Other spec sections below, not shown)

- **Export buttons** (bottom right)
  - 🔷 "Export to Jira" (blue) — Opens export dialog
  - ✓ "Export to Linear" (green) — Opens export dialog

**Data Display:**
- Shows which platforms the ticket is linked to
- Clear relationship: "Imported from Jira" + "Exported to Linear"
- User can see the full flow at a glance

**Smart Update Logic:**
- If imported from Jira and user clicks "Export to Jira" → Shows UPDATE dialog
- If imported from Jira and user clicks "Export to Linear" → Shows CREATE dialog
- If created in Forge (no import) → Both show CREATE dialogs

---

## Screen 6: Export Dialog — Jira (UPDATE Mode)

**File:** `EPIC-24-Export-Dialogs.excalidraw`

**Purpose:** Allow user to update existing Jira issue with enriched spec.

**Key Elements:**
- **Dialog title & context**
  - "Update Jira Issue"
  - Subtitle: "Updating existing Jira issue PROJ-123 with enriched specification"

- **Sprint selector**
  - Dropdown showing available sprints
  - User can change target sprint
  - Default: last sprint or current sprint

- **Assignee selector**
  - Dropdown to assign ticket
  - Optional (can keep unassigned)

- **Options checkboxes**
  - ☐ Create subtasks for API endpoints
  - ✓ Create subtasks for file changes (checked by default)

- **Preview section**
  - Shows what will be updated:
    - Summary: [title]
    - Description: [full tech spec markdown]
    - Sprint: [selected sprint]
    - Subtasks: [count and types]

- **Action buttons**
  - Cancel (secondary)
  - Update Issue (blue primary)

**Smart Logic Notes:**
- **UPDATE mode** because ticket was imported from PROJ-123
- Project selector is hidden (locked to source project)
- Sprint can be changed (common use case: moving between sprints)
- Idempotent: Re-exporting updates the same issue, no dupes

**Success Flow:**
- Shows confirmation: "Issue PROJ-123 updated successfully"
- Displays link to updated Jira issue
- "Copy link" button
- "Sync again" button for re-exports

---

## Screen 7: Export Dialog — Linear (CREATE Mode)

**Purpose:** Create new Linear issue from Forge ticket.

**Hypothetical Screen** (not shown in wireframes, but parallels Jira):
- **Dialog title & context**
  - "Create new Linear issue"
  - Subtitle: "Creating new issue in Linear"

- **Team selector**
  - Dropdown of available teams
  - Preselected if only one team

- **Cycle selector**
  - Dropdown of available cycles

- **Assignee selector**
  - Optional

- **Options checkboxes**
  - ☐ Create child issues for APIs
  - ☐ Create child issues for tests

- **Preview section**
  - Shows new issue structure

- **Action buttons**
  - Cancel
  - Create Issue (green primary)

**Different from Jira dialog:**
- No project selector (Linear team = "project")
- Cycle instead of Sprint
- Child issues instead of subtasks

---

## Flow Diagram: Complete User Journey

```
[Entry: /create]
    ↓
[Screen 1: Choice Modal]
    ├─→ "Start Creating" → /create?mode=new → GenerationWizard (unchanged)
    │
    └─→ "Start Importing" → /create?mode=import → ImportWizard
         ↓
      [Screen 2: Ticket Selector]
         ↓
      [Screen 3: Preview Confirmation]
         ↓
      [Screen 4: Repository Selection]
         ↓
      [Analysis + Questions]
         ↓
      [Create Ticket]
         ↓
      [Screen 5: Ticket Detail]
         ├─→ Click "Export to Jira"
         │    ↓
         │  [Screen 6: Jira Dialog - UPDATE Mode]
         │    ↓
         │  Update PROJ-123 + create subtasks
         │    ↓
         │  Show success badge on ticket
         │
         └─→ Click "Export to Linear"
              ↓
           [Screen 7: Linear Dialog - CREATE Mode]
              ↓
           Create new Linear issue
              ↓
           Show export badge on ticket
```

---

## Key Design Principles

1. **Clear Path Separation**
   - Create and Import are distinct flows from the start
   - No tabs or cognitive overhead
   - Each path optimized for its use case

2. **Smart Update Logic**
   - If imported from Jira → Exporting to Jira = UPDATE
   - If imported from Linear → Exporting to Linear = UPDATE
   - Cross-platform exports = CREATE new
   - No duplicate issues

3. **Transparency**
   - Show what was imported and from where
   - Show all external issues linked (imported + exported)
   - Preview what will be updated before confirming

4. **Linear-Inspired Design**
   - Calm, minimal UI
   - Plenty of whitespace
   - Clear typography hierarchy
   - Consistent color coding:
     - Blue (#3b82f6) for Jira
     - Green (#10b981) for Linear
     - Gray for secondary/disabled states

5. **Multi-Repo Ready**
   - Repository selector (Screen 4) uses same UI as Epic 23
   - Ready for multi-repo support integration
   - Future-proof

---

## Component Reusability

These screens share components:

- **ImportTicketSearch.tsx** (Screen 2)
  - Reusable: ticket list with search, pagination

- **RepositorySelector.tsx** (Screen 4)
  - Shared with CreateWizard (Epic 23)
  - Multi-repo capable

- **ExportDialog.tsx** (Screens 6-7)
  - Smart UPDATE vs CREATE logic
  - Jira-specific and Linear-specific variants

- **ExternalIssueInfo.tsx** (Screen 5)
  - Display imported + exported issues
  - Links to original/synced issues

---

## Data Structures

### ImportWizardStore State

```typescript
{
  currentStage: 1 | 2 | 3 | 4 | 5;
  selectedTicket: {
    platform: 'jira' | 'linear';
    issueId: string;
    issueKey?: string;
    title: string;
    description: string;
    acceptanceCriteria: string[];
    type: 'feature' | 'bug' | 'task';
    priority: 'urgent' | 'high' | 'medium' | 'low';
  };
  repositories: Array<{
    owner: string;
    name: string;
    branch: string;
  }>;
  importedFrom: {
    platform: 'jira' | 'linear';
    issueId: string;
    issueUrl: string;
  };
}
```

### AEC Domain Updates

```typescript
{
  importedFrom?: {
    platform: 'jira' | 'linear';
    issueId: string;
    issueUrl: string;
    importedAt: Date;
  };
  externalIssues?: Array<{
    platform: 'jira' | 'linear';
    issueId: string;
    issueUrl: string;
    isImportSource: boolean;
    exportedAt: Date;
    lastSyncedAt?: Date;
  }>;
}
```

---

## Implementation Notes

1. **Backend API Endpoints** (Story 24-1)
   - `GET /jira/import/:issueKey` → Returns importable ticket
   - `GET /linear/import/:issueId` → Returns importable ticket
   - `POST /tickets/:id/export/jira` with `action: 'update'` → Updates existing
   - `POST /tickets/:id/export/linear` with `action: 'update'` → Updates existing

2. **Frontend Store** (New: ImportWizardStore)
   - Parallel to GenerationWizardStore
   - Separate state management for import flow
   - Syncs with AEC domain on ticket creation

3. **Export Dialog Logic** (Story 24-5)
   - Check `aec.importedFrom.platform` and `aec.externalIssues`
   - Determine UPDATE vs CREATE automatically
   - Show appropriate dialog variant

4. **Subtask Management** (Story 24-4)
   - On UPDATE: Delete orphaned subtasks, create new ones
   - On CREATE: Create all subtasks fresh
   - Handle Jira subtasks vs Linear child issues differently

---

## Next Steps

1. **Review & Approve** — Gather feedback on wireframe flow
2. **Story 24-2 Development** — Implement ImportWizard component
3. **Story 24-1 Development** — Build import API endpoints
4. **Story 24-4 Development** — Enhance export with smart logic
5. **Story 24-5 Development** — Build export dialogs with smart detection

---

**Total Wireframes:** 7 screens
**Total Files:** 2 Excalidraw files
**Design System:** Linear-inspired, calm, minimal
**Status:** Ready for development
