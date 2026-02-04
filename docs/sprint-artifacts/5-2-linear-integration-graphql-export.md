# Story 5.2: Linear Integration - GraphQL Export

**Epic:** Epic 5 - Export & Integrations
**Story ID:** 5.2
**Created:** 2026-02-04
**Status:** Drafted
**Priority:** P1
**Effort Estimate:** 6-8 hours

---

## User Story

As a Product Manager,
I want to export ready tickets to Linear,
So that my team can work in their existing workflow tool.

---

## Acceptance Criteria

**Given** the user is a workspace admin
**When** they navigate to Settings → Integrations → Linear
**Then** they see:
- "Connect Linear" button
- OAuth flow explanation

**And** when they click "Connect Linear":
- Linear OAuth 2.0 flow launches
- User authorizes app access
- Backend exchanges code for access token
- Token stored securely in Firestore (encrypted)

**And** after successful authorization:
- Backend fetches user's Linear teams
- Team list displayed in UI with default team selector

**And** when a ticket has `readinessScore ≥ 75`:
- "Export to Linear" button appears in ticket detail footer
- User clicks button
- Modal opens: Select Linear team, project (optional), priority
- "Export" button in modal

**And** when user clicks "Export" in modal:
- Backend creates Linear issue via GraphQL API
- Issue contains:
  - **Title:** AEC title
  - **Description:** AEC description + auto-generated sections (Markdown)
  - **Acceptance Criteria:** Formatted checklist
  - **Dev Notes:** Code modules, API snapshot, estimate
  - **QA Notes:** Validation results, assumptions
- AEC `status` updated to 'created'
- AEC gains `externalIssue: { platform: 'linear', issueId, issueUrl }`

**And** export success shown in UI:
- Success toast: "Ticket exported to Linear"
- Ticket detail shows link to Linear issue

**And** if export fails:
- Error message displayed
- User can retry

**And** Linear's markdown format supported:
- Checklists for acceptance criteria
- Code blocks for technical details
- Links to code files (GitHub URLs)

---

## Prerequisites

- ✅ Story 2.4: Ticket Detail View - AEC Rendering (COMPLETED)
- ✅ Story 3.1: Validation Engine - Multi-Criteria Scoring (COMPLETED)
- AEC domain model includes `readinessScore` and `externalIssue` fields
- Firestore structure supports integrations subcollection

---

## Tasks and Subtasks

### Task 1: Linear OAuth 2.0 Setup
**Layer:** Infrastructure (External Integration)
**Acceptance Criteria:** AC1-4 (OAuth flow)

**1.1** Create Linear OAuth 2.0 app in Linear Developer Settings
- Set up redirect URI: `{app_url}/api/integrations/linear/callback`
- Configure OAuth scopes: `read`, `write`, `issues:create`
- Obtain Client ID and Client Secret
- Store credentials in environment variables

**1.2** Implement Linear integration domain entity
- File: `backend/src/integrations/domain/LinearIntegration.ts`
- Properties: `workspaceId`, `accessToken`, `refreshToken`, `teams[]`, `connectedAt`
- Validation: tokens encrypted before storage
- Pattern: Similar to JiraIntegration (Story 5.1)

**1.3** Create LinearIntegration repository interface
- File: `backend/src/integrations/application/ports/LinearIntegrationRepository.ts`
- Methods: `save()`, `findByWorkspace()`, `delete()`

**1.4** Implement Firestore repository
- File: `backend/src/integrations/infrastructure/persistence/FirestoreLinearIntegrationRepository.ts`
- Path: `/workspaces/{workspaceId}/integrations/linear`
- Encrypt tokens using Firebase KMS or environment secret
- Reuse encryption pattern from JiraIntegration

**Testing:**
- [ ] Unit test: LinearIntegration entity validates tokens
- [ ] Integration test: Save/load from Firestore with encryption

---

### Task 2: OAuth Flow Backend
**Layer:** Application + Infrastructure
**Acceptance Criteria:** AC1-4 (OAuth flow + team fetching)

**2.1** Create ConnectLinearUseCase
- File: `backend/src/integrations/application/use-cases/ConnectLinearUseCase.ts`
- Initiates OAuth flow, generates authorization URL
- Returns URL to frontend
- Pattern: Similar to ConnectJiraUseCase

**2.2** Create OAuth callback handler use case
- File: `backend/src/integrations/application/use-cases/HandleLinearCallbackUseCase.ts`
- Exchanges authorization code for access token
- Fetches user's Linear teams via GraphQL API
- Saves integration to Firestore
- Returns success status and team list

**2.3** Create LinearController with OAuth endpoints
- File: `backend/src/integrations/presentation/controllers/LinearController.ts`
- `GET /api/integrations/linear/connect` - Start OAuth
- `GET /api/integrations/linear/callback?code=...` - OAuth callback
- `GET /api/integrations/linear/teams` - List connected teams
- `DELETE /api/integrations/linear` - Disconnect integration

**2.4** Implement Linear GraphQL client
- File: `backend/src/integrations/infrastructure/clients/LinearApiClient.ts`
- Uses `@linear/sdk` npm package
- Methods: `exchangeCodeForToken()`, `getTeams()`, `createIssue()`
- Error handling for Linear API failures
- GraphQL query construction for team/project fetching

**Testing:**
- [ ] Unit test: ConnectLinearUseCase generates valid OAuth URL
- [ ] Unit test: HandleLinearCallbackUseCase stores tokens correctly
- [ ] Integration test: Full OAuth flow with mock Linear API
- [ ] E2E test: OAuth flow redirects properly

---

### Task 3: Frontend OAuth UI
**Layer:** Client (Presentation)
**Acceptance Criteria:** AC1-3 (OAuth UI)

**3.1** Create Linear integration settings page
- File: `client/src/integrations/components/LinearIntegrationSettings.tsx`
- Navigate to: Settings → Integrations → Linear
- Shows "Connect Linear" button if not connected
- Shows connected status with team selector if connected
- OAuth flow explanation text

**3.2** Implement OAuth flow handling
- Click "Connect Linear" → Opens OAuth popup or redirects
- After callback, shows loading state
- Fetches teams and displays list
- Default team selector with dropdown

**3.3** Update integrations Zustand store
- File: `client/src/stores/integrations.store.ts` (extend existing)
- State: `linearIntegration`, `isLinearConnected`, `teams[]`
- Actions: `connectLinear()`, `disconnectLinear()`, `selectDefaultTeam()`
- Pattern: Similar to Jira integration store structure

**Testing:**
- [ ] Component test: Render connect button when disconnected
- [ ] Component test: Render team selector when connected
- [ ] E2E test: Complete OAuth flow in browser

---

### Task 4: Export to Linear Use Case
**Layer:** Application + Infrastructure
**Acceptance Criteria:** AC5-7 (Export functionality)

**4.1** Create ExportToLinearUseCase
- File: `backend/src/tickets/application/use-cases/ExportToLinearUseCase.ts`
- Validates AEC `readinessScore ≥ 75`
- Loads Linear integration for workspace
- Formats AEC as Linear issue (Title, Description, Markdown)
- Calls LinearApiClient.createIssue() via GraphQL mutation
- Updates AEC `status` to 'created'
- Adds `externalIssue` metadata to AEC
- Returns Linear issue URL

**4.2** Implement Linear issue formatter
- File: `backend/src/integrations/infrastructure/formatters/LinearIssueFormatter.ts`
- Converts AEC to Linear GraphQL mutation format
- Uses Linear Markdown format (full markdown support)
- Formats acceptance criteria as checklist (`- [ ] item`)
- Includes Dev Notes and QA Notes sections
- Creates clickable GitHub links for code references

**4.3** Create export controller endpoint
- File: `backend/src/tickets/presentation/controllers/TicketsController.ts` (extend)
- `POST /api/tickets/:aecId/export/linear`
- Body: `{ teamId: string, projectId?: string, priority?: number }`
- Returns: `{ success: boolean, issueUrl: string }`

**Testing:**
- [ ] Unit test: ExportToLinearUseCase validates readiness score
- [ ] Unit test: LinearIssueFormatter produces valid GraphQL mutation
- [ ] Integration test: Export updates AEC with externalIssue
- [ ] Integration test: Export fails if readiness < 75

---

### Task 5: Frontend Export UI
**Layer:** Client (Presentation)
**Acceptance Criteria:** AC5, AC7-9 (Export UI)

**5.1** Add "Export to Linear" button to ticket detail
- File: `client/src/tickets/components/TicketDetail.tsx` (extend)
- Show button only if `readinessScore ≥ 75` and Linear connected
- Button location: Footer below acceptance criteria, next to Jira export button

**5.2** Update export modal component to support Linear
- File: `client/src/tickets/components/ExportModal.tsx` (extend existing)
- Add platform prop: `'jira' | 'linear'`
- Conditional form fields based on platform:
  - Linear: Team selector (dropdown), Project selector (optional), Priority (1-5)
  - Reuse modal structure from Jira export (Story 5.1)

**5.3** Implement Linear export flow
- User clicks "Export to Linear" → Modal opens with platform='linear'
- User selects team, project (optional), priority → Clicks "Export"
- Shows loading spinner
- On success: Toast "Ticket exported to Linear" + Link to issue
- On failure: Error message + "Retry" button

**5.4** Update ticket detail to show exported status
- If AEC has `externalIssue.platform === 'linear'`:
  - Show badge: "Exported to Linear" with link icon
  - Link to Linear issue URL
- Support multiple exports (both Jira and Linear badges shown if exported to both)

**Testing:**
- [ ] Component test: Export button hidden if readiness < 75
- [ ] Component test: Modal renders with team options for Linear
- [ ] E2E test: Complete export flow and verify Linear link appears

---

### Task 6: Error Handling and Edge Cases

**6.1** Handle Linear GraphQL API errors
- Network failures → Retry logic with exponential backoff
- Invalid token → Prompt user to reconnect Linear
- Rate limiting → Show friendly error with retry suggestion
- GraphQL errors → Parse error messages and show user-friendly text

**6.2** Handle duplicate exports
- Check if AEC already has `externalIssue` for Linear
- If exists, show confirmation: "This ticket was already exported. Export again?"
- Create new Linear issue if confirmed (don't update existing)

**6.3** Token refresh logic
- If access token expired, use refresh token to get new token
- Update stored tokens in Firestore
- Retry failed GraphQL request
- Pattern: Same as Jira token refresh

**Testing:**
- [ ] Unit test: Token refresh works on 401 response
- [ ] Integration test: Duplicate export creates new issue
- [ ] Integration test: Rate limit error shows friendly message

---

## Dev Notes

### Architecture Context

**Clean Architecture Layers:**
- **Presentation:** LinearController handles HTTP requests, DTOs for request/response
- **Application:** Use cases orchestrate business logic (ConnectLinear, ExportToLinear)
- **Domain:** LinearIntegration entity, validation rules
- **Infrastructure:** Firestore repository, Linear GraphQL API client

**Module:** Integrations (shared with Story 5.1)
- Path: `backend/src/integrations/`
- Domain entities: JiraIntegration, LinearIntegration
- Application ports: LinearIntegrationRepository, ExternalIssueTracker (shared interface)
- Adapters implement common export interface for future extensibility

### Security Considerations

**Token Storage:**
- Encrypt tokens before storing in Firestore (same pattern as Jira)
- Use Firebase KMS or environment-based encryption key
- Never log tokens (use `[REDACTED]` in logs)

**OAuth Security:**
- Validate redirect URI matches configured URI
- Generate secure state parameter to prevent CSRF
- Use HTTPS for all OAuth callbacks

**Access Control:**
- Only workspace admins can connect integrations
- Export requires user to be in the workspace
- Workspace isolation enforced at controller level via WorkspaceGuard

### External Dependencies

**New NPM Packages:**
- `@linear/sdk` - Official Linear GraphQL SDK
- Uses existing `crypto` (built-in) for token encryption from Story 5.1

**Linear API Reference:**
- OAuth 2.0: https://developers.linear.app/docs/oauth/authentication
- GraphQL API: https://developers.linear.app/docs/graphql/working-with-the-graphql-api
- SDK Documentation: https://github.com/linear/linear/tree/master/packages/sdk

### GraphQL vs REST Differences from Story 5.1

**API Protocol:**
- **Jira (5.1):** REST API with JSON payloads
- **Linear (5.2):** GraphQL API with mutations and queries

**Key Differences:**
- Linear uses GraphQL mutations for `createIssue` (not REST POST)
- Linear SDK provides type-safe GraphQL client
- Query construction: GraphQL query strings vs REST endpoints
- Error handling: GraphQL errors object vs HTTP status codes
- Response parsing: GraphQL data envelope vs direct JSON

**Pattern Reuse from Story 5.1:**
- OAuth flow structure (identical pattern)
- Token encryption/storage (same implementation)
- Frontend modal component (extended with platform prop)
- Domain entity structure (LinearIntegration mirrors JiraIntegration)
- Repository interface pattern (same methods)

### Learnings from Previous Story

**From Story 5.1: Jira Integration - OAuth & Export (Status: drafted)**

**Established Patterns to Reuse:**
- **OAuth Flow Structure:** ConnectUseCase + HandleCallbackUseCase pattern
- **Token Encryption:** Firestore storage with encryption before save
- **Integration Domain Entity:** Properties pattern (workspaceId, tokens, metadata)
- **Repository Interface:** save(), findByWorkspace(), delete() methods
- **Export Modal Component:** Platform-agnostic modal with conditional fields
- **Error Handling:** Token refresh, duplicate export confirmation, API error mapping

**Technical Insights:**
- Integrations module supports multiple platforms (Jira, Linear, future GitHub Issues)
- ExportModal.tsx is platform-agnostic (use platform prop to switch between providers)
- Common encryption pattern for all OAuth tokens
- Firestore path: `/workspaces/{workspaceId}/integrations/{platform}`
- ExternalIssue value object pattern for AEC metadata

**Reuse Opportunities:**
- Copy OAuth flow structure from Jira (ConnectLinear, HandleLinearCallback)
- Extend ExportModal component with platform='linear' prop instead of creating new modal
- Reuse token encryption utilities from JiraIntegration
- Follow same repository interface pattern for LinearIntegrationRepository
- Leverage existing Zustand integrations store structure

**Key Differences:**
- Linear uses GraphQL (@linear/sdk) instead of REST (jira-client)
- Linear fetches **teams** (not projects) for organization structure
- Linear supports full Markdown (Jira has limited support)
- Linear issue creation uses GraphQL mutation (not REST POST)

[Source: stories/5-1-jira-integration-oauth-export.md]

---

## Project Structure Notes

**New Files:**
```
backend/src/integrations/
├── domain/
│   └── LinearIntegration.ts                    # NEW
├── application/
│   ├── ports/
│   │   └── LinearIntegrationRepository.ts      # NEW
│   └── use-cases/
│       ├── ConnectLinearUseCase.ts             # NEW
│       └── HandleLinearCallbackUseCase.ts      # NEW
├── infrastructure/
│   ├── clients/
│   │   └── LinearApiClient.ts                  # NEW
│   ├── formatters/
│   │   └── LinearIssueFormatter.ts             # NEW
│   └── persistence/
│       └── FirestoreLinearIntegrationRepository.ts  # NEW
└── presentation/
    └── controllers/
        └── LinearController.ts                 # NEW

backend/src/tickets/application/use-cases/
└── ExportToLinearUseCase.ts                    # NEW

client/src/integrations/components/
└── LinearIntegrationSettings.tsx               # NEW

client/src/stores/
└── integrations.store.ts                       # EXTEND (add Linear state/actions)

client/src/tickets/components/
├── TicketDetail.tsx                            # EXTEND (add Linear export button)
└── ExportModal.tsx                             # EXTEND (add platform='linear' support)
```

**Modified Files:**
- `client/src/tickets/components/TicketDetail.tsx` - Add Linear export button
- `client/src/tickets/components/ExportModal.tsx` - Add Linear platform support
- `client/src/stores/integrations.store.ts` - Add Linear state and actions
- `backend/src/tickets/presentation/controllers/TicketsController.ts` - Add Linear export endpoint

### References

**Architecture:**
- [Source: docs/architecture.md#Epic to Architecture Mapping] - Integrations module structure
- [Source: docs/architecture.md#API Contracts] - Export endpoint patterns
- [Source: docs/architecture.md#Security Architecture] - Token encryption, OAuth security

**Epic Requirements:**
- [Source: docs/epics.md#Story 5.2] - Complete acceptance criteria and technical notes

**Previous Story Pattern:**
- [Source: stories/5-1-jira-integration-oauth-export.md] - OAuth flow, export pattern, error handling

---

## Change Log

| Date       | Author | Change Description |
|------------|--------|--------------------|
| 2026-02-04 | BMad   | Initial story creation from Epic 5.2 requirements |

---

## Functional Requirements Coverage

**FR7:** System exports ready tickets to Jira/Linear with dev/QA appendix ✅

---

## Dev Agent Record

### Completion Notes
- [ ] Linear OAuth 2.0 app configured in Linear Developer Settings
- [ ] All use cases implemented and tested
- [ ] Frontend OAuth flow works end-to-end
- [ ] Export creates Linear issues with proper Markdown formatting
- [ ] Tokens encrypted in Firestore
- [ ] Error handling covers GraphQL-specific edge cases
- [ ] ExportModal component extended to support Linear platform

### Context Reference
- [To be generated after story draft approved]

### Agent Model Used
{{agent_model_name_version}}

### Debug Log References

### File List
- [To be populated by dev agent during implementation]

---

## Senior Developer Review (AI)
- [To be completed after implementation by code-review workflow]
