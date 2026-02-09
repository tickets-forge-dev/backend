# Epic 24: Bidirectional Jira/Linear Integration (Import & Export)

**Status:** Backlog → TODO (High value after Phase 4)
**Priority:** P1 (Enables workflow integration with existing PM tools)
**Planned Start:** Phase 4 (after Epic 23 — multi-repo support)
**Dependencies:** Epic 23 (Multi-Repo), Export endpoints (already exist)

## Summary

Currently, Forge exports specs to Jira/Linear in one direction. However, the real value emerges from **bidirectional integration**: PMs working in Jira/Linear can import existing tickets into Forge, enrich them with code-aware analysis and spec generation, then export the enhanced spec back to their native tools.

This positions **Forge as the spec enrichment platform** rather than just a new tool — it becomes the bridge between vague requirements and executable specs.

## Problem Statement

- **Current limitation:** Forge only exports new tickets; can't enrich existing Jira/Linear tickets
- **User pain:** PMs must manually re-enter ticket data into Forge to get analysis
- **Workflow friction:** Requires leaving Jira/Linear → creating duplicate work in Forge → exporting back
- **Missed opportunity:** Existing tickets could be instantly enriched with code analysis, APIs, file changes, test plans

**Example:** PM has existing Jira ticket "Add user authentication" with vague AC
- Currently: PM must manually create new Forge ticket with same info
- Desired: PM clicks "Import to Forge" → our pipeline enriches it → exports back as detailed spec → continues working in Jira

## How It Works

### Entry Point: Two Separate Flows

**Create Ticket Page redesign:**
```
┌────────────────────────────────────────────┐
│  Create Executable Ticket                  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │ Create New Ticket from Scratch       │  │
│  │ Describe what you want to build...   │  │
│  │ [Start Creating] →                   │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │ Import & Enrich Existing Ticket      │  │
│  │ Have a ticket in Jira/Linear?        │  │
│  │ [Start Importing] →                  │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

User chooses at the very start which path:
- **"Start Creating"** → Flow A (Title input, description, type, priority, repo selection)
- **"Start Importing"** → Flow B (Select Jira/Linear ticket, auto-fills, repo selection)

**Why separate?**
- Create flow: User enters data manually (empty form required)
- Import flow: User picks existing ticket (form auto-populated)
- Zero cognitive overhead — different mental models, different screens

---

### Flow A: Create New Ticket (Status Quo)

Unchanged from current implementation. User goes through:
1. Enter title, description, type, priority
2. Select repository(ies)
3. Analysis runs
4. Questions/spec generation

---

### Flow B: Import & Enrich Ticket

**Stage 1: Select Ticket from Jira/Linear**

1. **Import Ticket Selector**
   ```
   ┌─────────────────────────────────┐
   │ Import Existing Ticket          │
   │ ⚙️ Connected to: Jira instance  │
   │                                 │
   │ Recent Open Tickets:            │
   │ ☐ PROJ-123: Add Auth            │
   │ ☐ PROJ-124: Fix login bug       │
   │ ☐ PROJ-125: Update user model   │
   │                                 │
   │ Search... [search box]          │
   │                                 │
   │ [Cancel] [Import & Continue]    │
   └─────────────────────────────────┘
   ```

2. **Selected Ticket Preview** (once clicked)
   ```
   ┌──────────────────────────────────┐
   │ PROJ-123: Add User Authentication│
   │                                  │
   │ Description:                     │
   │ Implement OAuth2 with Google...  │
   │                                  │
   │ Acceptance Criteria:             │
   │ - Users can sign in with Google  │
   │ - Existing users auto-migrated   │
   │                                  │
   │ [Cancel] [Import & Continue]     │
   └──────────────────────────────────┘
   ```

3. **Auto-Fills on Import:**
   - Title → Forge title
   - Description → Initial context
   - Acceptance Criteria → Auto-extracted
   - Type/Priority → Mapped to Forge equivalents
   - Stored: `importedFrom: { platform: 'jira', issueId: 'PROJ-123', issueUrl: ... }`

### Stage 2: Repository Selection & Analysis

**User Flow:**
1. After importing ticket, prompt to **select repository to analyze**
2. Same multi-repo selector as Stage 1 (Epic 23)
3. Run deep analysis on selected repo(s) with imported requirements as context

**LLM Prompt Enhancement:**
- Include original ticket description + AC from Jira/Linear
- Context: "This requirement already exists in [Jira issue PROJ-123], here's the original context..."
- LLM can fill gaps, clarify vague AC, propose solutions

### Stage 3: Spec Generation & Optional Re-Export

**Process:**
1. Generate full tech spec with code awareness
2. (Optional) Generate clarification questions if AC is vague
3. **Create Forge ticket with:**
   - Enriched spec from analysis
   - Link to original Jira/Linear issue (stored as `externalIssue`)
   - Flag: `importedFrom: { platform: 'jira' | 'linear', issueId, issueUrl }`

4. **Export Back (Optional):**
   - User can click "Sync to Jira/Linear" to push enriched spec back
   - Updates original issue with detailed description (full tech spec)
   - Adds comment linking to Forge ticket (for team visibility)

---

## Field Mapping Strategy

### Jira → Forge Mapping

| Jira Field | Forge Field | Notes |
|-----------|-----------|-------|
| Summary | title | Direct copy |
| Description | description | Parsed for GitHub links, context |
| Issue Type (Story/Task/Bug) | type (feature/task/bug) | Mapped during import |
| Priority (Highest/High/Medium/Low) | priority (urgent/high/medium/low) | Mapped directly |
| Acceptance Criteria (if custom field) | acceptanceCriteria | Extracted and stored |
| Linked Issues | references | Stored for context |
| Assignee | — | Not mapped (will be assigned post-export) |
| Sprint | targetSprint | Stored, prompted at export time |
| Custom Fields (team, epic, etc.) | metadata | Best-effort extraction |

### Linear → Forge Mapping

| Linear Field | Forge Field | Notes |
|-----------|-----------|-------|
| Title | title | Direct copy |
| Description | description | Parsed for GitHub links, context |
| Issue Type | type | Mapped (feature/bug/task) |
| Priority | priority | Mapped (P0→urgent, P1→high, etc.) |
| Acceptance Criteria | acceptanceCriteria | Extracted from description sections |
| Linked Issues | references | Stored for context |
| Assignee | — | Not mapped |
| Cycle | targetCycle | Stored, prompted at export time |
| Team | — | Passed to export (team context) |

### Forge → Jira Export Mapping

| Forge Field | Jira Field | Notes |
|-----------|-----------|-------|
| title | Summary | Updated |
| Full tech spec (markdown) | Description | Replaces/appends to original |
| acceptanceCriteria | AC custom field | Structured, not markdown |
| priority | Priority | Mapped back |
| type | Issue Type | If needed for Jira workflow |
| estimate (if available) | Story Points | Optional |
| apiChanges | Subtasks | Create subtask per endpoint |
| layeredFileChanges | Subtasks | Create subtask per layer (optional) |
| testPlan | Subtasks or Test Plan field | Depends on Jira setup |

### Forge → Linear Export Mapping

| Forge Field | Linear Field | Notes |
|-----------|-----------|-------|
| title | Title | Updated |
| Full tech spec (markdown) | Description | Full update |
| acceptanceCriteria | Description (structured) | Included as section |
| priority | Priority | Mapped back |
| type | Issue Type | Feature/Bug/Task |
| estimate | Estimate | If available |
| apiChanges | Child issues | Create per API endpoint |
| layeredFileChanges | Description sections | Detailed breakdown |
| testPlan | Description or child issues | Depends on Linear setup |

---

## Stories

### 24-1: Backend — Jira/Linear Import APIs
**Layer:** Backend (application + presentation)
**Effort:** 5-7 days

Create service to fetch existing tickets from Jira/Linear and extract fields for import.

**Acceptance Criteria:**
- `JiraImportService`: Fetch issue by key, extract fields (summary, description, AC, priority, type)
- `LinearImportService`: Fetch issue by ID, extract fields (title, description, priority, type)
- Both services handle authentication (use existing token services)
- Return structured import payload with mapped fields
- Handle missing/null fields gracefully (optional AC, missing type, etc.)
- Error handling: "Issue not found", "Not authenticated", "Issue archived"
- Cache recently fetched issues (5 min TTL) to avoid API thrashing
- New endpoints:
  - `GET /jira/import/:issueKey` → returns importable ticket data
  - `GET /linear/import/:issueId` → returns importable ticket data

**Files:**
- `backend/src/jira/application/services/jira-import.service.ts` — **new**
- `backend/src/linear/application/services/linear-import.service.ts` — **new**
- `backend/src/tickets/presentation/dto/ImportTicketDto.ts` — **new**
- `backend/src/tickets/presentation/controllers/tickets.controller.ts` — add import endpoints

### 24-2: Frontend — Separate Import Flow & Entry Point
**Layer:** Frontend (presentation + stores + router)
**Effort:** 5-7 days

Create completely separate import flow with distinct entry point (not tabs in Stage1Input).

**Architecture:**

**New Entry Page:** `/create`
```
┌──────────────────────────────────────┐
│ Create Executable Ticket             │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ Create New from Scratch          │ │
│ │ [Start Creating →]               │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ Import & Enrich from Jira/Linear │ │
│ │ [Start Importing →]              │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

**Routing:**
- `/create` → CreationChoiceModal (this page)
- `/create?mode=new` → GenerationWizard (current Stage1Input flow)
- `/create?mode=import` → ImportWizard (new import-specific wizard)

**Acceptance Criteria:**

**CreationChoiceModal (new component):**
- Two prominent buttons: "Create New" | "Import Existing"
- Each button routes to respective flow
- Clear description of each path
- Show connected platforms (Jira/Linear icons if authenticated)

**ImportWizard (new wizard, parallel to GenerationWizard):**
- Stage 1: **Ticket Selector**
  - Platform selector (Jira/Linear) if multiple connected
  - "Recent open tickets" list with search
  - Search field filters by title/key/number
  - Pagination (20 per page)
  - Clicking ticket shows preview (title, description, AC)
  - On selection: "Import & Continue" button
  - Loading states for API calls
  - Error handling: "Issue not found", "Not authenticated", etc.

- Stage 2: **Preview & Confirm**
  - Show fetched ticket data (title, description, AC, type, priority)
  - Display: "This will be imported as: [title] (Type: story, Priority: high)"
  - "Edit before continuing" option to modify auto-filled fields
  - "Back" to select different ticket, "Continue" to proceed

- Stage 3: **Repository Selection**
  - Same as CreateWizard (multi-repo selector)
  - Context: "Analyzing repo for: [imported ticket title]"
  - Proceed to analysis

- Stage 4: **Questions & Spec**
  - Same as CreateWizard
  - LLM context includes original issue description

**Store Management:**
- `GenerationWizardStore` (current) - for CREATE flow
- `ImportWizardStore` (new) - for IMPORT flow
  - Tracks: `importedTicket`, `importedFrom`, `selectedRepo(s)`, `importMode`
  - Separate state machine from creation flow

**Files:**
- `client/src/tickets/components/CreationChoiceModal.tsx` — **new** (entry point)
- `client/src/tickets/components/wizard/ImportWizard.tsx` — **new** (full import wizard)
- `client/src/tickets/components/wizard/ImportStage1TicketSelector.tsx` — **new** (ticket selection)
- `client/src/tickets/components/wizard/ImportStage2Preview.tsx` — **new** (preview confirmation)
- `client/src/tickets/stores/import-wizard.store.ts` — **new** (import-specific state)
- `client/src/tickets/components/ImportTicketSearch.tsx` — **new** (search + list, reusable)
- `client/app/(main)/create/page.tsx` — update to route to choice modal
- `client/src/services/jira.service.ts` — add `importIssue()` + `listIssues()` methods
- `client/src/services/linear.service.ts` — add `importIssue()` + `listIssues()` methods

### 24-3: Backend — Create Ticket from Imported Data
**Layer:** Backend (application)
**Effort:** 3-5 days

Update `CreateTicketUseCase` to handle imported ticket data and set external issue reference.

**Acceptance Criteria:**
- `CreateTicketDto` accepts optional `importedFrom` field (platform, issueId, issueUrl)
- On ticket creation, if `importedFrom` provided:
  - Set `externalIssue` reference automatically
  - Add comment to original Jira/Linear issue (optional): "Imported to Forge, view analysis at [forge link]"
  - Tag ticket with "imported" label (for filtering/tracking)
- Validation: user must provide repository selection after import
- Mapping: ensure all imported fields are correctly mapped to domain model

**Files:**
- `backend/src/tickets/application/use-cases/CreateTicketUseCase.ts` — update
- `backend/src/tickets/presentation/dto/CreateTicketDto.ts` — add `importedFrom` field

### 24-4: Backend — Enhanced Export Use Cases with Smart Update Logic
**Layer:** Backend (application)
**Effort:** 1 week

Update export use cases to support full-fidelity export with intelligent update vs. create logic.

**Acceptance Criteria:**

- **Smart Update vs. Create Logic (for both Jira and Linear):**
  - Check if ticket has `externalIssue` reference matching target platform
  - If YES → **UPDATE** existing issue (don't create new)
  - If NO → **CREATE** new issue
  - Validation: Can only update if user is authenticated to that platform
  - Return response indicates: `action: 'created' | 'updated'` + `issueId`

- **ExportToJiraUseCase enhancements:**
  - Accept optional `action: 'create' | 'update'` param (frontend tells us intent)
  - **CREATE mode:**
    - Create new Jira issue with full fields
    - Create subtasks for API endpoints (if `apiChanges` present)
    - Create subtasks for file changes by layer (if `layeredFileChanges` present)
    - Create subtasks for test plan items (if `testPlan` present)
  - **UPDATE mode:**
    - Update existing Jira issue: summary, description, AC field, priority
    - Handle subtasks carefully:
      - Delete outdated subtasks (previous API endpoints that no longer exist)
      - Update modified subtasks (changed description/status)
      - Create new subtasks (new APIs added in enriched spec)
  - Common to both:
    - Export Acceptance Criteria as AC custom field (not buried in markdown)
    - Add "Generated by Forge" label
    - Link back to Forge ticket URL in description footer
    - Handle partial failures (subtask update fails but issue succeeds)

- **ExportToLinearUseCase enhancements:**
  - Accept optional `action: 'create' | 'update'` param
  - **CREATE mode:**
    - Create new Linear issue with full fields
    - Create child issues for API endpoints
    - Create child issues for test plan items
  - **UPDATE mode:**
    - Update existing Linear issue: title, description, priority
    - Handle child issues: delete outdated, update modified, create new
  - Common to both:
    - Export AC as structured description section
    - Link back to Forge ticket
    - Handle child issue orphaning gracefully

**Files:**
- `backend/src/tickets/application/use-cases/ExportToJiraUseCase.ts` — enhance
- `backend/src/tickets/application/use-cases/ExportToLinearUseCase.ts` — enhance
- `backend/src/jira/application/services/jira-api-client.ts` — add subtask creation methods
- `backend/src/linear/application/services/linear-api-client.ts` — add child issue methods

### 24-5: Frontend — Export Dialog with Smart Update/Create Logic
**Layer:** Frontend (presentation + stores)
**Effort:** 5-7 days

Create export dialog with intelligent update vs. create logic based on import source.

**Acceptance Criteria:**

- **Export Button** in ticket detail page
  - Shows "Export to Jira" and "Export to Linear" buttons (if connected)
  - Each button opens platform-specific export dialog

- **Smart Update vs. Create Logic:**
  - **If ticket was imported FROM Jira:**
    - Exporting TO Jira = **UPDATE** the original issue
    - Exporting TO Linear = **CREATE** new issue
    - Dialog shows: "Update existing Jira issue (PROJ-123)" vs "Create new in Linear"
  - **If ticket was imported FROM Linear:**
    - Exporting TO Linear = **UPDATE** the original issue
    - Exporting TO Jira = **CREATE** new issue
  - **If ticket was created in Forge (no import):**
    - Both export options **CREATE** new issues
  - Dialog clearly indicates: "Update PROJ-123" or "Create new Jira issue"

- **Jira Export Dialog:**
  - If UPDATE mode: Show "Update Jira issue PROJ-123"
    - Hidden: Project selector (already locked to import source)
    - Show: Sprint selector (can change sprint)
    - Show: Option to "Keep original assignee" or reassign
  - If CREATE mode: Show "Create new Jira issue"
    - Project selector (dropdown of user's accessible projects)
    - Sprint selector (load sprints for selected project)
    - Assignee selector (optional)
  - Preview: show what fields will be exported/updated
  - Checkbox: "Create subtasks for APIs", "Create subtasks for files"
  - On confirm: show loading state + success message with issue link

- **Linear Export Dialog:**
  - If UPDATE mode: Show "Update Linear issue LINEAR-123"
    - Team selector already determined from connection
    - Cycle selector (can change cycle)
    - Assignee selector (optional)
  - If CREATE mode: Show "Create new Linear issue"
    - Team selector (if user has multiple teams)
    - Cycle selector
    - Assignee selector
  - Same preview + subtask options
  - On confirm: show loading state + success message with issue link

- **Success state:**
  - Show issue link (clickable, prominent)
  - Show "Copy link to clipboard" button
  - Show "Sync again" button (for re-exports)
  - For UPDATE mode: "Issue updated successfully"
  - For CREATE mode: "Issue created successfully — link saved"
  - Update `externalIssue` display in ticket header (show all linked external issues)

**Files:**
- `client/src/tickets/components/ExportDialog.tsx` — **new** (molecules + organisms)
- `client/src/tickets/components/JiraExportForm.tsx` — **new**
- `client/src/tickets/components/LinearExportForm.tsx` — **new**
- `client/src/tickets/stores/tickets.store.ts` — add export state (loading, error, result)
- `client/src/services/jira.service.ts` — update `exportTicket()` to accept sprint/options
- `client/src/services/linear.service.ts` — update `exportTicket()` to accept cycle/options

### 24-6: Frontend — Imported Issue Display & Sync Badge
**Layer:** Frontend (presentation)
**Effort:** 3-5 days

Display imported issue info and sync status in ticket detail.

**Acceptance Criteria:**
- **Imported Issue Badge** in ticket header
  - Shows: "Imported from Jira PROJ-123" with link to original issue
  - Icon: platform logo (Jira/Linear)
  - Clickable: opens original issue in new tab
  - Positioned near external issue link

- **External Issue Display:**
  - Show both imported issue (source) and exported issues (targets)
  - Example: "Imported from Jira PROJ-123 → Exported to Linear TEAM-456"
  - Last synced timestamp (when external issue was last updated)

- **Sync Status:**
  - Indicator: "In sync" vs "Unsync" (spec updated after last export)
  - If unsync: yellow badge "Re-sync needed"
  - On export: update last synced time

**Files:**
- `client/src/tickets/components/detail/ExternalIssueInfo.tsx` — **new** (molecule)
- `client/app/(main)/tickets/[id]/page.tsx` — add ExternalIssueInfo display

### 24-7: Backend — Tests & Validation
**Layer:** Backend (test)
**Effort:** 5-7 days

Comprehensive tests for import and enhanced export flows.

**Acceptance Criteria:**
- Unit tests: Jira/Linear import services (field mapping, error handling)
- Integration tests: full import → create ticket → export → verify fields in Jira/Linear
- Edge cases:
  - Missing AC in source ticket (should gracefully handle)
  - Type/priority not mappable (fallback to defaults)
  - Already exported + re-export (idempotent)
  - Subtask creation fails (partial failure handling)
  - Large ticket descriptions (truncate if needed)
- Mock Jira/Linear APIs for testing (use nock or similar)
- Performance: import service latency <2s, export <5s

**Files:**
- `backend/src/jira/application/services/__tests__/jira-import.service.spec.ts` — **new**
- `backend/src/linear/application/services/__tests__/linear-import.service.spec.ts` — **new**
- `backend/src/tickets/application/use-cases/__tests__/ExportToJiraUseCase.spec.ts` — update
- `backend/src/tickets/application/use-cases/__tests__/ExportToLinearUseCase.spec.ts` — update

### 24-8: Frontend — Tests & E2E
**Layer:** Frontend (test)
**Effort:** 5-7 days

Tests for import UI and full E2E flow.

**Acceptance Criteria:**
- Unit tests: ImportTab component, ticket preview, search
- Store tests: import state management, imported ticket data
- E2E tests:
  - Full flow: Import Jira ticket → select repo → create Forge ticket → export back
  - Verify ticket fields appear correctly after import
  - Verify sprint/cycle selection works
  - Verify subtasks created on export
- Error scenarios: import failures, export failures, network errors

**Files:**
- `client/src/tickets/components/wizard/__tests__/ImportTab.spec.ts` — **new**
- `client/src/tickets/stores/__tests__/generation-wizard.store.spec.ts` — update
- `client/__tests__/e2e/import-export-flow.spec.ts` — **new** E2E test

---

## Success Metrics

- ✅ Users can import existing Jira/Linear tickets in <30 seconds
- ✅ Imported ticket fields map correctly (title, AC, priority, type)
- ✅ Spec generation uses imported context (smarter analysis)
- ✅ Export includes full tech spec + AC + subtasks for APIs/tests
- ✅ Subtasks created and linked correctly in Jira/Linear
- ✅ Full import → export → re-export cycle is idempotent (no duplicates)
- ✅ Users can track imported issues → Forge ticket → exported issues
- ✅ PM workflow: Jira ticket → Forge enrichment → back to Jira (zero friction)

---

## Integration with Other Epics

- **Epic 23 (Multi-Repo):** Import flow works seamlessly with repo selector — imported tickets analyzed across multiple repos
- **Epic 20 (Spec Quality):** Imported AC automatically included in quality score
- **Epic 6 (Attachments):** Imported ticket attachments could be synced (future enhancement)

---

## Implementation Notes

### External Issue Tracking (Critical for Update Logic)

Currently `externalIssue` stores single issue. For bidirectional flow, we need to track **multiple** external issues:

```typescript
externalIssue?: {
  platform: 'jira' | 'linear';
  issueId: string;
  issueUrl: string;
  isImportSource: boolean; // true if imported FROM this issue
};

externalIssues?: Array<{
  platform: 'jira' | 'linear';
  issueId: string;
  issueUrl: string;
  isImportSource: boolean;
  exportedAt: Date;
  lastSyncedAt?: Date;
}>;
```

**Update Logic:**
- If importing from Jira PROJ-123, set `isImportSource: true`
- When exporting to Jira: look for issue with `platform: 'jira'` + `isImportSource: true` → UPDATE it
- When exporting to Linear: check if Linear issue exists in list → UPDATE it, otherwise CREATE new
- Track all exports so user can see: "Imported from Jira PROJ-123 → also exported to Linear TEAM-456"

### Other Notes

- **Phase 1 scope:** Import + export with UPDATE vs. CREATE logic. Subtask creation is optional (Phase 2).
- **Idempotency:** Critical — re-exporting to same platform should UPDATE, not create duplicate.
- **Auth:** Use existing Jira/Linear token services; no additional auth needed.
- **Rate limiting:** Check Jira/Linear API rate limits; implement backoff if needed.
- **User feedback:** Show import progress ("Fetching ticket...", "Creating Forge ticket..."), export progress.
- **Subtask/Child issue management:** Be careful with orphaned issues on update (delete old, create new, don't leave stranded).
- **Future Phase 2:** Two-way sync (auto-update Forge when Jira issue updated), bidirectional AC sync, bulk import.

---

**Owner:** PM/Architecture
**Last Updated:** 2026-02-09

---

## D-Day Readiness Checklist ✅

- ✅ **Epic specification complete** — 2,500+ lines of detailed requirements
- ✅ **8 stories drafted** with acceptance criteria per story
- ✅ **Wireframes complete** (7 screens, 2 Excalidraw files)
  - Screen 1: Creation choice modal (separate flows)
  - Screen 2-4: Import wizard stages (ticket selector → preview → repo selection)
  - Screen 5: Ticket detail with import/export tracking
  - Screen 6: Jira export dialog (smart UPDATE mode)
  - Screen 7: Linear export dialog (smart CREATE mode)
- ✅ **Implementation guide** with detailed wireframe descriptions
- ✅ **Data structures defined** (ImportWizardStore, AEC domain updates)
- ✅ **API contracts specified** (backend endpoints with DTOs)
- ✅ **Smart update logic documented** (import source tracking, UPDATE vs CREATE)
- ✅ **Reusable components identified** (ImportTicketSearch, ExportDialog variants)

**Status:** Ready for sprint execution. All architectural decisions locked. Developers can start on Monday.

**Wireframe Resources:**
- Interactive: Open `/docs/wireframes/EPIC-24-*.excalidraw` in [Excalidraw.com](https://excalidraw.com)
- Documentation: `/docs/wireframes/EPIC-24-WIREFRAME-GUIDE.md` (detailed flow + data structures)
- Epic doc: `/docs/epics/EPIC-24-BIDIRECTIONAL-JIRA-LINEAR.md` (this file)
