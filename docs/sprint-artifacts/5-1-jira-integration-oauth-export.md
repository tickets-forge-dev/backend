# Story 5.1: Jira Integration - OAuth & Export

**Epic:** Epic 5 - Export & Integrations  
**Story ID:** 5.1  
**Created:** 2026-02-03  
**Status:** Drafted  
**Priority:** P1  
**Effort Estimate:** 6-8 hours

---

## User Story

As a Product Manager,  
I want to export ready tickets to Jira,  
So that my team can work in their existing workflow tool.

---

## Acceptance Criteria

**Given** the user is a workspace admin  
**When** they navigate to Settings → Integrations → Jira  
**Then** they see:
- "Connect Jira" button
- OAuth flow explanation

**And** when they click "Connect Jira":
- Jira OAuth 2.0 flow launches
- User authorizes app access
- Backend exchanges code for access token
- Token stored securely in Firestore (encrypted)

**And** after successful authorization:
- Backend fetches user's Jira projects
- Project list displayed in UI with default project selector

**And** when a ticket has `readinessScore ≥ 75`:
- "Export to Jira" button appears in ticket detail footer
- User clicks button
- Modal opens: Select Jira project, issue type (Story/Task/Bug)
- "Export" button in modal

**And** when user clicks "Export" in modal:
- Backend creates Jira issue via REST API
- Issue contains:
  - **Summary:** AEC title
  - **Description:** AEC description + auto-generated sections
  - **Acceptance Criteria:** Formatted list
  - **Dev Appendix:** Code modules, API snapshot, estimate
  - **QA Appendix:** Validation results, assumptions, repro steps (if bug)
- AEC `status` updated to 'created'
- AEC gains `externalIssue: { platform: 'jira', issueId, issueUrl }`

**And** export success shown in UI:
- Success toast: "Ticket exported to Jira"
- Ticket detail shows link to Jira issue

**And** if export fails:
- Error message displayed
- User can retry

---

## Prerequisites

- ✅ Story 2.4: Ticket Detail View - AEC Rendering (COMPLETED)
- ✅ Story 3.1: Validation Engine - Multi-Criteria Scoring (COMPLETED)
- AEC domain model includes `readinessScore` and `externalIssue` fields
- Firestore structure supports integrations subcollection

---

## Tasks and Subtasks

### Task 1: Jira OAuth 2.0 Setup
**Layer:** Infrastructure (External Integration)

**1.1** Create Jira OAuth 2.0 app in Atlassian Developer Console
- Set up redirect URI: `{app_url}/api/integrations/jira/callback`
- Configure OAuth scopes: `read:jira-work`, `write:jira-work`
- Obtain Client ID and Client Secret
- Store credentials in environment variables

**1.2** Implement Jira integration domain entity
- File: `backend/src/integrations/domain/JiraIntegration.ts`
- Properties: `workspaceId`, `accessToken`, `refreshToken`, `projects[]`, `connectedAt`
- Validation: tokens encrypted before storage

**1.3** Create JiraIntegration repository interface
- File: `backend/src/integrations/application/ports/JiraIntegrationRepository.ts`
- Methods: `save()`, `findByWorkspace()`, `delete()`

**1.4** Implement Firestore repository
- File: `backend/src/integrations/infrastructure/persistence/FirestoreJiraIntegrationRepository.ts`
- Path: `/workspaces/{workspaceId}/integrations/jira`
- Encrypt tokens using Firebase KMS or environment secret

**Testing:**
- [ ] Unit test: JiraIntegration entity validates tokens
- [ ] Integration test: Save/load from Firestore with encryption

---

### Task 2: OAuth Flow Backend
**Layer:** Application + Infrastructure

**2.1** Create ConnectJiraUseCase
- File: `backend/src/integrations/application/use-cases/ConnectJiraUseCase.ts`
- Initiates OAuth flow, generates authorization URL
- Returns URL to frontend

**2.2** Create OAuth callback handler use case
- File: `backend/src/integrations/application/use-cases/HandleJiraCallbackUseCase.ts`
- Exchanges authorization code for access token
- Fetches user's Jira projects via Jira API
- Saves integration to Firestore
- Returns success status and project list

**2.3** Create JiraController with OAuth endpoints
- File: `backend/src/integrations/presentation/controllers/JiraController.ts`
- `GET /api/integrations/jira/connect` - Start OAuth
- `GET /api/integrations/jira/callback?code=...` - OAuth callback
- `GET /api/integrations/jira/projects` - List connected projects
- `DELETE /api/integrations/jira` - Disconnect integration

**2.4** Implement Jira API client
- File: `backend/src/integrations/infrastructure/clients/JiraApiClient.ts`
- Uses `axios` or `jira-client` npm package
- Methods: `exchangeCodeForToken()`, `getProjects()`, `createIssue()`
- Error handling for Jira API failures

**Testing:**
- [ ] Unit test: ConnectJiraUseCase generates valid OAuth URL
- [ ] Unit test: HandleJiraCallbackUseCase stores tokens correctly
- [ ] Integration test: Full OAuth flow with mock Jira API
- [ ] E2E test: OAuth flow redirects properly

---

### Task 3: Frontend OAuth UI
**Layer:** Client (Presentation)

**3.1** Create Jira integration settings page
- File: `client/src/integrations/components/JiraIntegrationSettings.tsx`
- Navigate to: Settings → Integrations → Jira
- Shows "Connect Jira" button if not connected
- Shows connected status with project selector if connected
- OAuth flow explanation text

**3.2** Implement OAuth flow handling
- Click "Connect Jira" → Opens OAuth popup or redirects
- After callback, shows loading state
- Fetches projects and displays list
- Default project selector with dropdown

**3.3** Add Zustand store for integrations
- File: `client/src/stores/integrations.store.ts`
- State: `jiraIntegration`, `isConnected`, `projects[]`
- Actions: `connectJira()`, `disconnectJira()`, `selectDefaultProject()`

**Testing:**
- [ ] Component test: Render connect button when disconnected
- [ ] Component test: Render project selector when connected
- [ ] E2E test: Complete OAuth flow in browser

---

### Task 4: Export to Jira Use Case
**Layer:** Application + Infrastructure

**4.1** Create ExportToJiraUseCase
- File: `backend/src/tickets/application/use-cases/ExportToJiraUseCase.ts`
- Validates AEC `readinessScore ≥ 75`
- Loads Jira integration for workspace
- Formats AEC as Jira issue (Summary, Description, fields)
- Calls JiraApiClient.createIssue()
- Updates AEC `status` to 'created'
- Adds `externalIssue` metadata to AEC
- Returns Jira issue URL

**4.2** Implement Jira issue formatter
- File: `backend/src/integrations/infrastructure/formatters/JiraIssueFormatter.ts`
- Converts AEC to Jira format
- Uses Markdown for description (Jira supports limited Markdown)
- Includes Dev Appendix and QA Appendix (from Story 5.3 - will be simple for now)

**4.3** Create export controller endpoint
- File: `backend/src/tickets/presentation/controllers/TicketsController.ts`
- `POST /api/tickets/:aecId/export/jira`
- Body: `{ projectKey: string, issueType: 'Story' | 'Task' | 'Bug' }`
- Returns: `{ success: boolean, issueUrl: string }`

**Testing:**
- [ ] Unit test: ExportToJiraUseCase validates readiness score
- [ ] Unit test: JiraIssueFormatter produces valid Jira format
- [ ] Integration test: Export updates AEC with externalIssue
- [ ] Integration test: Export fails if readiness < 75

---

### Task 5: Frontend Export UI
**Layer:** Client (Presentation)

**5.1** Add "Export to Jira" button to ticket detail
- File: `client/src/tickets/components/TicketDetail.tsx`
- Show button only if `readinessScore ≥ 75` and Jira connected
- Button location: Footer below acceptance criteria

**5.2** Create export modal component
- File: `client/src/tickets/components/ExportModal.tsx`
- Modal with form: Select Jira project (dropdown), issue type (radio: Story/Task/Bug)
- "Export" primary button
- "Cancel" ghost button

**5.3** Implement export flow
- User clicks "Export to Jira" → Modal opens
- User selects project and type → Clicks "Export"
- Shows loading spinner
- On success: Toast "Ticket exported to Jira" + Link to issue
- On failure: Error message + "Retry" button

**5.4** Update ticket detail to show exported status
- If AEC has `externalIssue.platform === 'jira'`:
  - Show badge: "Exported to Jira" with link icon
  - Link to Jira issue URL

**Testing:**
- [ ] Component test: Export button hidden if readiness < 75
- [ ] Component test: Modal renders with project options
- [ ] E2E test: Complete export flow and verify Jira link appears

---

### Task 6: Error Handling and Edge Cases

**6.1** Handle Jira API errors
- Network failures → Retry logic with exponential backoff
- Invalid token → Prompt user to reconnect Jira
- Rate limiting → Show friendly error with retry suggestion

**6.2** Handle duplicate exports
- Check if AEC already has `externalIssue` for Jira
- If exists, show confirmation: "This ticket was already exported. Export again?"
- Create new Jira issue if confirmed (don't update existing)

**6.3** Token refresh logic
- If access token expired, use refresh token to get new token
- Update stored tokens in Firestore
- Retry failed request

**Testing:**
- [ ] Unit test: Token refresh works on 401 response
- [ ] Integration test: Duplicate export creates new issue
- [ ] Integration test: Rate limit error shows friendly message

---

## Dev Notes

### Architecture Context

**Clean Architecture Layers:**
- **Presentation:** Controllers handle HTTP requests, DTOs for request/response
- **Application:** Use cases orchestrate business logic (ConnectJira, ExportToJira)
- **Domain:** JiraIntegration entity, validation rules
- **Infrastructure:** Firestore repository, Jira API client

**Module:** Integrations (new module)
- Path: `backend/src/integrations/`
- Follows same structure as tickets module
- Domain entities: JiraIntegration, LinearIntegration (future)
- Application ports: JiraIntegrationRepository, ExternalIssueTracker (interface)

### Security Considerations

**Token Storage:**
- Encrypt tokens before storing in Firestore
- Use Firebase KMS or environment-based encryption key
- Never log tokens (use `[REDACTED]` in logs)

**OAuth Security:**
- Use PKCE (Proof Key for Code Exchange) if supported by Jira
- Validate redirect URI matches configured URI
- Generate secure state parameter to prevent CSRF

**Access Control:**
- Only workspace admins can connect integrations
- Export requires user to be in the workspace
- Workspace isolation enforced at controller level

### External Dependencies

**New NPM Packages:**
- `jira-client` or `axios` for Jira API calls
- `crypto` (built-in) for token encryption

**Jira API Reference:**
- OAuth 2.0: https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/
- REST API v3: https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/

### Learnings from Previous Story

**From Story 4.5: Effort Estimation (Status: done)**

**New Services Created:**
- `EstimationEngine.service.ts` - Calculate effort based on multiple factors (modules, APIs, DB, auth, similar tickets)
- Pattern: Rule-based estimation with future ML upgrade path
- Location: `backend/src/tickets/application/services/estimation-engine.service.ts`

**Architectural Patterns Established:**
- **Historical data query:** Firestore query for similar AECs by `repoPaths` or `type`
- **Multi-factor scoring:** Base effort + per-factor additions (similar to validation scoring in 3.1)
- **Confidence calculation:** Based on data availability (Low/Medium/High)

**Technical Context:**
- AEC entity includes `estimate: { min, max, confidence, drivers }` field
- Estimation runs at generation step 8 (after validation)
- UI displays estimate badge in ticket detail expandable section

**Key Insights:**
- Similar pattern to validation scoring - weighted factors produce final score
- Estimation service is deterministic (no LLM calls) for consistency
- Historical data improves over time as more tickets completed

**Reusable Patterns for This Story:**
- Weighted scoring/calculation pattern (can apply to export priority)
- Firestore query patterns for historical data
- Domain value objects for complex types (similar to Estimate, use ExternalIssue value object)
- Service-based calculation with multiple factors

[Source: stories/4-5-effort-estimation-multi-factor-calculation.md#Dev-Agent-Record]

---

## Change Log

| Date       | Author | Change Description |
|------------|--------|--------------------|
| 2026-02-03 | BMad   | Initial story creation from Epic 5.1 requirements |

---

## Functional Requirements Coverage

**FR7:** System exports ready tickets to Jira/Linear with dev/QA appendix ✅

---

## Dev Agent Record

### Completion Notes
- [ ] Jira OAuth 2.0 app configured in Atlassian Developer Console
- [ ] All use cases implemented and tested
- [ ] Frontend OAuth flow works end-to-end
- [ ] Export creates Jira issues with proper formatting
- [ ] Tokens encrypted in Firestore
- [ ] Error handling covers edge cases

### Context Reference
- [To be generated after story draft approved]

### File List
- [To be populated by dev agent during implementation]

---

## Senior Developer Review (AI)
- [To be completed after implementation by code-review workflow]
