# Epic: Close the Onboarding Promise Gap

## Context

The onboarding dialog promises users a 4-step workflow: Connect → Analyze → Developer-Ready Output → Deploy & Track. This epic identifies every gap between what we promise and what actually works today, then closes them.

## Current State vs. Promise

| Promised Feature | Status | Gap |
|-----------------|--------|-----|
| Tech spec (Markdown) | **Built** | None |
| Acceptance criteria | **Built** | None |
| Files & APIs to change | **Partial** | File detection works; API endpoint analysis is minimal |
| Backend / client split | **Partial** | Inferred from paths, not explicit in output |
| Test plan | **Missing** | Only hints in acceptance criteria notes |
| Attach designs & assets | **Missing** | No upload or linking capability |
| Push to Linear | **Type-only** | `ExternalIssue` type exists, no API client |
| Push to Jira | **Type-only** | Same — type exists, no implementation |
| Auto-update on commit | **Built** | GitHub webhooks + drift detection work |
| Notifications | **Missing** | No email, in-app, or webhook notifications |

---

## Stories

### Story 1: Explicit API Endpoint Detection
**Priority:** High
**Layer:** Backend (domain + application)

The deep analysis and tech spec currently list files to change but don't explicitly call out API endpoints (routes, controllers, DTOs) that will be affected. For backend-heavy tasks this is critical context.

**Acceptance Criteria:**
- Given a task that involves API changes, the generated spec includes a dedicated "API Changes" section
- Each API change lists: HTTP method, route, request/response shape changes
- Frontend consumers of changed APIs are flagged

**Files likely involved:**
- `backend/src/tickets/application/services/DeepAnalysisServiceImpl.ts` — extend LLM prompt
- `backend/src/tickets/application/services/TechSpecGeneratorImpl.ts` — add apiChanges section
- `backend/src/tickets/domain/tech-spec/TechSpecGenerator.ts` — extend TechSpec type

---

### Story 2: Explicit Backend / Client Split in Output
**Priority:** High
**Layer:** Backend (domain + application), Client (presentation)

Generated specs should group changes into clear "Backend" and "Client" sections so developers immediately see the scope per layer.

**Acceptance Criteria:**
- Tech spec output has separate "Backend Changes" and "Client Changes" subsections
- Each subsection lists files, reason for change, and dependencies
- If the task only touches one layer, the other section shows "No changes"

**Files likely involved:**
- `backend/src/tickets/application/services/TechSpecGeneratorImpl.ts`
- `backend/src/tickets/domain/tech-spec/TechSpecGenerator.ts`
- `client/src/tickets/components/ticket-detail/` — display grouped changes

---

### Story 3: Test Plan Generation
**Priority:** High
**Layer:** Backend (domain + application)

Add a dedicated test plan section to generated specs. Currently only implementation hints mention testing approach.

**Acceptance Criteria:**
- Every generated spec includes a "Test Plan" section
- Test plan includes: unit tests, integration tests, and edge cases to cover
- Each test case has a description and expected behavior
- Test plan references the detected test runner (Jest, Mocha, etc.)

**Files likely involved:**
- `backend/src/tickets/application/services/TechSpecGeneratorImpl.ts` — extend generation prompt
- `backend/src/tickets/domain/tech-spec/TechSpecGenerator.ts` — add `testPlan` to TechSpec type
- New section in ticket detail UI

---

### Story 3b: Interactive API Editor (Mini Postman)
**Priority:** High
**Layer:** Backend (domain + application + presentation), Client (presentation + stores)

A mini Postman-style editor that lets users manually add, edit, or select API endpoints for their ticket. When the user adds a new API, they choose: "From existing (detected)" or "Create new". Detected APIs from Story 1 populate the selection list automatically.

**Acceptance Criteria:**
- Ticket detail page has an "API Endpoints" section with an "Add API" button
- "Add API" opens a modal with two options: "Select from detected" or "Create new"
- "Select from detected" shows a searchable list of auto-detected APIs (from Story 1)
- "Create new" shows a form with: method (GET/POST/PUT/PATCH/DELETE), URL/path, request payload (JSON editor), response shape (JSON editor), description
- Users can edit any API entry (both detected and manually added)
- Users can remove API entries from the ticket
- API entries are persisted on the AEC domain (new `apiEndpoints` field)
- API entries are included in the tech spec generation as context
- Each entry shows: method badge (colored), URL, payload preview, response preview

**UX Flow:**
```
[Add API] → Dialog: "From existing?" / "Create new"
  ├─ From existing → Searchable list of detected endpoints → Select → Pre-fills form → Edit/Confirm
  └─ Create new → Empty form → Fill URL, method, payload, response → Save
```

**Files likely involved:**
- `backend/src/tickets/domain/aec/AEC.ts` — add `apiEndpoints: ApiEndpoint[]` field
- `backend/src/tickets/domain/value-objects/ApiEndpoint.ts` — **new** value object (method, url, requestPayload, responseShape, description, source: 'detected' | 'manual')
- `backend/src/tickets/presentation/dto/UpdateAECDto.ts` — add apiEndpoints field
- `backend/src/tickets/application/use-cases/UpdateAECUseCase.ts` — handle apiEndpoints updates
- `client/src/tickets/components/ApiEndpointEditor.tsx` — **new** mini Postman form component
- `client/src/tickets/components/ApiEndpointList.tsx` — **new** list with method badges
- `client/app/(main)/tickets/[id]/page.tsx` — "API Endpoints" section
- `backend/src/tickets/application/services/TechSpecGeneratorImpl.ts` — include apiEndpoints in prompts

**Dependencies:**
- Story 1 (API Detection) provides the "detected" endpoints list
- Can be built in parallel with Stories 2 and 3

---

### Story 4: Linear Integration
**Priority:** High
**Layer:** Backend (infrastructure + application), Client (presentation)

Export generated tickets to Linear as issues. The domain already has `ExternalIssue` with `platform: 'linear'` — needs actual API implementation.

**Acceptance Criteria:**
- User can connect their Linear workspace (OAuth or API key) in Settings
- "Export to Linear" button on a completed ticket creates a Linear issue
- Issue includes: title, description (from tech spec), acceptance criteria, labels
- `ExternalIssue` reference is saved on the AEC with the Linear issue URL
- Subsequent exports update the existing issue rather than creating duplicates

**Files likely involved:**
- New: `backend/src/integrations/linear/` — Linear API client
- New: `client/src/settings/components/LinearIntegration.tsx`
- `backend/src/tickets/domain/value-objects/ExternalIssue.ts` — already exists
- `backend/src/tickets/presentation/controllers/tickets.controller.ts` — export endpoint

---

### Story 5: Jira Integration
**Priority:** Medium
**Layer:** Backend (infrastructure + application), Client (presentation)

Same as Linear but for Jira Cloud. Many enterprise teams use Jira.

**Acceptance Criteria:**
- User can connect Jira workspace (OAuth 2.0) in Settings
- "Export to Jira" button creates a Jira issue with proper fields
- Maps acceptance criteria to Jira checklist or subtasks
- Saves `ExternalIssue` reference with Jira issue URL
- Handles Jira custom fields (story points, sprint, etc.)

**Files likely involved:**
- New: `backend/src/integrations/jira/` — Jira API client
- New: `client/src/settings/components/JiraIntegration.tsx`
- Shared export logic with Linear (abstract export port)

---

### Story 6: Design & Asset Attachments
**Priority:** Medium
**Layer:** Backend (infrastructure), Client (presentation)

Allow users to attach design mockups, screenshots, or asset files to tickets. These get included in the exported Linear/Jira issue.

**Acceptance Criteria:**
- Upload zone in the ticket creation wizard (Stage 1 or Stage 2)
- Supports images (PNG, JPG, SVG), PDFs, and Figma links
- Uploaded assets are stored (Firebase Storage or S3)
- Assets appear in the ticket detail view
- When exporting to Linear/Jira, assets are attached to the issue

**Files likely involved:**
- New: `backend/src/tickets/infrastructure/storage/` — file storage service
- `client/src/tickets/components/wizard/` — upload component in wizard
- `client/src/tickets/components/ticket-detail/` — asset gallery

---

### Story 6b: Rich Input with File Uploads
**Priority:** High
**Layer:** Backend (application), Frontend (presentation)

Enhance Stage 1 (ticket input) to support Markdown editing and file uploads (`.md`, `.txt`, `.pdf`). Users can paste requirements as markdown, upload a spec document, or paste a PRD — extracted content populates the problem statement field.

**Acceptance Criteria:**
- Stage 1 input replaces plain `<textarea>` with MarkdownEditor component
- Editor supports: syntax highlighting, live preview pane (tabs on mobile)
- File upload zone (drag-drop or file picker) for `.md`, `.txt`, `.pdf` files
- `.md` and `.txt` files auto-populate editor on upload
- `.pdf` files trigger backend extraction (see below)
- PDF text extracted server-side and inserted into editor
- Extracted content can be edited before form submission
- All markdown formatting preserved when saved to store
- Error handling: unsupported file type, file too large (>5MB), extraction timeout
- Mobile-friendly: edit/preview tabs instead of side-by-side panes

**Backend Requirements:**
- New endpoint: `POST /tickets/extract-pdf` accepts multipart file
- Uses pdf extraction library to extract text from PDF
- Returns plain text or structured fields (problem, requirements, assumptions)
- Rate limiting: 1 extraction per user per minute
- Timeout: max 10 seconds for extraction

**Frontend Requirements:**
- New component: `MarkdownEditor.tsx` in `client/src/core/components/editors/`
- New component: `FileUploadZone.tsx` in `client/src/core/components/editors/`
- Keyboard shortcuts: Ctrl+B (bold), Ctrl+I (italic), Ctrl+⇧K (link), Ctrl+⇧C (code block)
- Preview rendering uses same styles as ticket descriptions (consistency)
- Reusable for Notes field and other markdown inputs across app

**Files likely involved:**
- `client/src/core/components/editors/MarkdownEditor.tsx` — **new** component
- `client/src/core/components/editors/FileUploadZone.tsx` — **new** component
- `client/src/core/utils/file.ts` — **new** helper functions for file reading/validation
- `client/src/tickets/components/wizard/Stage1Input.tsx` — integrate editor + upload
- `client/src/tickets/stores/generation-wizard.store.ts` — preserve markdown in state
- `backend/src/tickets/application/services/PdfExtractorService.ts` — **new** service
- `backend/src/tickets/presentation/controllers/tickets.controller.ts` — add `/extract-pdf` endpoint
- `backend/src/tickets/presentation/dto/ExtractPdfDto.ts` — **new** DTO
- `package.json` — add: `remark`, `react-markdown`, `highlight.js` (frontend), `pdf-parse` (backend)

**Dependencies:**
- No hard dependencies; works standalone
- Can optionally integrate with Story 4 (Linear Integration) for pre-filled exports
- Shares PDF extraction logic with Story 6 (Design Assets) — coordinate service creation

**Notes:**
- Plain text input still supported (backward compatible)
- Markdown formatting is preserved but not required — users can paste plain text
- Consider Monaco Editor as upgrade path (heavier, more features) if users request advanced editing
- PDF extraction is best-effort — corrupted/image-heavy PDFs may have limited results

---

### Story 7: In-App Notifications
**Priority:** Medium
**Layer:** Backend (infrastructure + application), Client (presentation + stores)

Notify users when important events happen: spec ready, drift detected, export completed.

**Acceptance Criteria:**
- Notification bell icon in sidebar header with unread count badge
- Notifications list (dropdown or page) showing recent events
- Event types: spec_ready, drift_detected, export_completed, round_complete
- Notifications marked as read on click
- Persisted in Firestore per workspace

**Files likely involved:**
- New: `backend/src/notifications/` — notification domain + infrastructure
- New: `client/src/notifications/` — notification store + components
- `client/src/core/components/sidebar/SidebarHeader.tsx` — notification bell

---

### Story 8: Email Notifications
**Priority:** Low
**Layer:** Backend (infrastructure)

Optional email notifications for key events. Depends on Story 7 (shares event types).

**Acceptance Criteria:**
- User can enable/disable email notifications in Settings
- Emails sent for: spec ready, drift detected
- Uses transactional email provider (SendGrid, Resend, or SES)
- Unsubscribe link in every email
- Rate-limited to prevent spam

**Files likely involved:**
- New: `backend/src/notifications/infrastructure/email/` — email service
- Settings page: email notification preferences toggle

---

## Dependency Graph

```
Story 1 (API Detection) ──┐
Story 2 (BE/FE Split)  ───┤── can be done in parallel
Story 3 (Test Plan)    ───┘

Story 6b (Rich Input)  ──── independent (enhances user data quality)

Story 4 (Linear)  ─────┐── can be done in parallel
Story 5 (Jira)    ─────┤── both depend on export infra
                       │
Story 6 (Assets) ──────┴─── depends on storage infra, enhances exports
                            (can share PdfExtractorService with Story 6b)

Story 7 (In-App Notif) ──── standalone
Story 8 (Email Notif)  ──── depends on Story 7
```

## Suggested Execution Order

1. **Sprint 1:** Stories 1 + 2 + 3 (spec quality — immediate user value)
2. **Sprint 2:** Story 6b (rich input — better data from users) + Stories 4 + 5 (export integrations)
3. **Sprint 3:** Story 6 (design attachments) + Story 7 (notifications) — share PdfExtractorService
4. **Sprint 4:** Story 8 (email — nice-to-have)

## Success Metric

Every feature mentioned in the onboarding Step 2 ("How It Works") is functional and demo-able. A user who completes onboarding can experience the full Connect → Analyze → Output → Deploy → Track loop end-to-end.
