# Story 4.1: GitHub App Integration - Read-Only Repo Access

Status: ready-for-dev

## Story

As a Product Manager,
I want to connect my GitHub organization to Executable Tickets,
so that the system can read my codebase and generate code-aware tickets.

## Acceptance Criteria

1. **Settings Integration Page**
   - **Given** the user is a workspace admin
   - **When** they navigate to Settings → Integrations → GitHub
   - **Then** they see:
     - "Connect GitHub" button
     - OAuth flow explanation ("Read-only access, no code writes")
     - Connected status if already connected

2. **GitHub OAuth Flow**
   - **Given** user clicks "Connect GitHub"
   - **When** the OAuth flow completes
   - **Then** GitHub OAuth flow launches (popup or redirect)
   - **And** user authorizes GitHub App
   - **And** app requests permissions: `read:repo`, `read:org`, `read:user`
   - **And** user is redirected back to app with authorization code

3. **Token Exchange & Storage**
   - **Given** successful OAuth authorization
   - **When** backend receives the authorization code
   - **Then** backend exchanges code for access token
   - **And** token stored securely in Firestore (encrypted at rest)
   - **And** token associated with workspace
   - **And** success message displayed to user

4. **Repository List Display**
   - **Given** GitHub is connected
   - **When** user views the Integrations page
   - **Then** backend fetches user's accessible repositories
   - **And** repository list displayed with checkboxes
   - **And** shows repository metadata (name, visibility, last updated)
   - **And** supports filtering/search for many repos

5. **Repository Selection for Indexing**
   - **Given** repository list is displayed
   - **When** user selects repositories
   - **Then** selected repos are marked for indexing
   - **And** "Index Selected Repos" button enables workflow (Story 4.2)
   - **And** selection persisted to workspace settings

6. **Webhook Configuration**
   - **Given** GitHub App is authorized
   - **When** connection is established
   - **Then** backend registers webhook URL with GitHub
   - **And** listens for `push` and `pull_request` events
   - **And** events trigger index updates (Story 4.4)

7. **Disconnection Flow**
   - **Given** GitHub is connected
   - **When** user clicks "Disconnect GitHub"
   - **Then** confirmation dialog appears
   - **And** on confirm, token is revoked/deleted
   - **And** repository list is cleared
   - **And** UI returns to "Connect GitHub" state

8. **Error Handling**
   - **Given** various error conditions
   - **When** they occur
   - **Then** OAuth popup blocked shows appropriate message
   - **And** token refresh failures prompt re-authentication
   - **And** rate limits show friendly error with retry timing
   - **And** revoked access shows reconnect prompt

## Tasks / Subtasks

- [ ] Task 1: GitHub App Setup (AC: #1, #2)
  - [ ] Create GitHub App in GitHub Developer Settings (manual)
  - [ ] Configure OAuth callback URL
  - [ ] Set required permissions (read:repo, read:org, read:user)
  - [ ] Configure webhook URL
  - [ ] Document app ID and client secret in environment variables

- [ ] Task 2: Backend OAuth Controller (AC: #2, #3)
  - [ ] Create `backend/src/github/presentation/controllers/github-oauth.controller.ts`
  - [ ] Add `GET /api/github/oauth/authorize` - returns GitHub OAuth URL
  - [ ] Add `GET /api/github/oauth/callback` - handles OAuth callback
  - [ ] Add `POST /api/github/disconnect` - revokes connection
  - [ ] Apply FirebaseAuthGuard and WorkspaceGuard

- [ ] Task 3: GitHub Token Service (AC: #3, #6)
  - [ ] Create `backend/src/github/application/services/github-token.service.ts`
  - [ ] Implement `exchangeCodeForToken(code: string): Promise<GitHubToken>`
  - [ ] Implement `refreshToken(refreshToken: string): Promise<GitHubToken>`
  - [ ] Implement `revokeToken(workspaceId: string): Promise<void>`
  - [ ] Token encryption before Firestore storage

- [ ] Task 4: GitHub Integration Repository (AC: #3)
  - [ ] Create `backend/src/github/domain/GitHubIntegration.ts` entity
  - [ ] Create `backend/src/github/infrastructure/persistence/GitHubIntegrationRepository.ts`
  - [ ] Firestore path: `workspaces/{workspaceId}/integrations/github`
  - [ ] Store: accessToken, refreshToken, expiresAt, installedAt, webhookSecret

- [ ] Task 5: Repository List Endpoint (AC: #4)
  - [ ] Add `GET /api/github/repositories` endpoint
  - [ ] Fetch repositories using stored token via @octokit/rest
  - [ ] Return list with metadata: name, fullName, visibility, updatedAt
  - [ ] Handle pagination for users with many repos

- [ ] Task 6: Repository Selection Endpoint (AC: #5)
  - [ ] Add `POST /api/github/repositories/select` endpoint
  - [ ] Store selected repository IDs in workspace settings
  - [ ] DTO: `{ repositoryIds: string[] }`
  - [ ] Validate user has access to selected repositories

- [ ] Task 7: Webhook Handler (AC: #6)
  - [ ] Create `backend/src/github/infrastructure/webhooks/github-webhook.handler.ts`
  - [ ] Add `POST /api/webhooks/github` endpoint (no auth - signature verified)
  - [ ] Verify webhook signature using webhook secret
  - [ ] Handle `push` events - queue re-index
  - [ ] Handle `pull_request` events - update branch list

- [ ] Task 8: Frontend Settings Page (AC: #1, #4, #5, #7)
  - [ ] Create `client/src/settings/components/GitHubIntegration.tsx`
  - [ ] Add "Connect GitHub" button with OAuth initiation
  - [ ] Display connected status with user/org info
  - [ ] Repository list with checkboxes
  - [ ] "Disconnect" button with confirmation dialog

- [ ] Task 9: Frontend GitHub Service (AC: #2, #4)
  - [ ] Update `client/src/services/github.service.ts`
  - [ ] Add `getOAuthUrl(): Promise<string>`
  - [ ] Add `getConnectionStatus(): Promise<ConnectionStatus>`
  - [ ] Add `listRepositories(): Promise<Repository[]>`
  - [ ] Add `selectRepositories(ids: string[]): Promise<void>`
  - [ ] Add `disconnect(): Promise<void>`

- [ ] Task 10: Settings Store (AC: #1)
  - [ ] Create `client/src/stores/settings.store.ts`
  - [ ] Add `githubConnected`, `githubRepositories` state
  - [ ] Add actions: `loadGitHubStatus()`, `selectRepositories()`, `disconnectGitHub()`

- [ ] Task 11: Update RepositorySelector (AC: #5)
  - [ ] Update `client/src/tickets/components/RepositorySelector.tsx`
  - [ ] If GitHub connected, show dropdown of connected repos
  - [ ] If not connected, show "Connect GitHub" prompt
  - [ ] Fall back to manual input for non-connected users

- [ ] Task 12: Write Tests
  - [ ] Unit tests for GitHubTokenService
  - [ ] Unit tests for webhook signature verification
  - [ ] Integration tests for OAuth flow
  - [ ] Frontend tests for GitHubIntegration component

## Dev Notes

### Architecture Context

From [architecture.md](../../docs/architecture.md):

**Clean Architecture Pattern:**
- Domain: GitHubIntegration entity (no framework deps)
- Application: GitHubTokenService, GitHubOAuthUseCase
- Presentation: GitHubOAuthController, GitHubWebhookHandler
- Infrastructure: Firestore repository, @octokit/rest client

**Security Considerations:**
- Tokens stored encrypted in Firestore
- Webhook signatures verified using HMAC-SHA256
- OAuth state parameter to prevent CSRF
- Tokens scoped to workspace (multi-tenancy isolation)

### Learnings from Story 4.0

**From Story 4.0 (Status: in-progress)**

**GitHubApiService Already Exists:**
- `backend/src/shared/infrastructure/github/github-api.service.ts`
- Uses @octokit/rest SDK
- Already has `getRepository()`, `getBranches()`, `getBranchHead()`
- Extend this service for repository listing

**Guard Pattern Established:**
- FirebaseAuthGuard + WorkspaceGuard pattern works
- @WorkspaceId() decorator extracts workspaceId
- Apply guards to all new OAuth endpoints (except webhook)

**Frontend Service Pattern:**
- GitHubService already exists at `client/src/services/github.service.ts`
- Extend with OAuth-related methods
- Uses useServices() hook for dependency injection

[Source: docs/sprint-artifacts/4-0-branch-selection-and-default-detection.md#Dev-Agent-Record]

### Technical Approach

**GitHub App vs OAuth App:**
```
This story uses GitHub OAuth App (simpler):
- OAuth App: User-level access tokens
- GitHub App: Installation-level, more complex
- Start with OAuth App, can upgrade to GitHub App later for org-level features
```

**OAuth Flow:**
```typescript
// 1. Frontend initiates
const url = await githubService.getOAuthUrl();
window.location.href = url; // or popup

// 2. GitHub redirects to callback
GET /api/github/oauth/callback?code=xxx&state=yyy

// 3. Backend exchanges code
const token = await githubTokenService.exchangeCodeForToken(code);
await integrationRepo.save({ workspaceId, accessToken: encrypt(token) });

// 4. Frontend polls for completion
await githubService.getConnectionStatus(); // returns connected: true
```

**Token Storage:**
```typescript
// Firestore: /workspaces/{workspaceId}/integrations/github
{
  accessToken: "encrypted_token_here",
  tokenType: "bearer",
  scope: "read:repo,read:org,read:user",
  installedAt: Timestamp,
  installedBy: "user_uid"
}
```

### File Locations

**Files to Create (Backend):**
- `backend/src/github/presentation/controllers/github-oauth.controller.ts`
- `backend/src/github/application/services/github-token.service.ts`
- `backend/src/github/domain/GitHubIntegration.ts`
- `backend/src/github/infrastructure/persistence/GitHubIntegrationRepository.ts`
- `backend/src/github/infrastructure/webhooks/github-webhook.handler.ts`

**Files to Modify (Backend):**
- `backend/src/github/github.module.ts` (add new providers)
- `backend/src/shared/infrastructure/github/github-api.service.ts` (add repo listing)
- `backend/src/app.module.ts` (add webhook route if needed)

**Files to Create (Frontend):**
- `client/src/settings/components/GitHubIntegration.tsx`
- `client/src/stores/settings.store.ts`

**Files to Modify (Frontend):**
- `client/src/services/github.service.ts` (add OAuth methods)
- `client/src/tickets/components/RepositorySelector.tsx` (use connected repos)
- `client/app/(main)/settings/page.tsx` (add integrations section)

### Testing Strategy

**Unit Tests:**
- Token encryption/decryption
- Webhook signature verification
- OAuth state validation

**Integration Tests:**
- OAuth callback with mock GitHub responses
- Repository listing with pagination
- Webhook event handling

### Prerequisites

- Firebase Auth working (Story 1.5.2) ✅
- GitHub API service exists (Story 4.0) ✅
- Environment variables for GitHub OAuth (GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET)
- @octokit/rest dependency (already present)

### Project Standards

From [CLAUDE.md](../../CLAUDE.md):
- Use dependency injection via useServices() hook for frontend services
- Follow Clean Architecture (domain has no framework deps)
- Handle loading, error, and empty states in components
- Use shadcn/ui components from @/core/components/ui/
- All mutations go through use cases → domain → repository

### References

- [Source: docs/epics.md#story-41-github-app-integration-read-only-repo-access] - Epic definition
- [Source: docs/sprint-artifacts/4-1-branch-selection-design.md] - Comprehensive design spec
- [Source: docs/architecture.md#api-contracts] - API patterns
- [GitHub OAuth Apps: https://docs.github.com/en/apps/oauth-apps]
- [GitHub Webhooks: https://docs.github.com/en/webhooks]
- [@octokit/rest: https://github.com/octokit/rest.js]

## Dev Agent Record

### Context Reference

- [Story Context File](./4-1-github-app-integration-read-only-repo-access.context.xml)

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

**Session 2026-02-02:**
- ✅ Fixed GitHub OAuth session persistence issue
  - Added express-session middleware to backend
  - Configured session cookies with proper settings (httpOnly, sameSite: lax)
  - Added withCredentials: true to frontend axios client
  - Session state now persists across OAuth redirect flow

- ✅ Completed repository selection persistence (AC #5)
  - Extended GET /connection endpoint to return selectedRepositories array
  - Updated frontend ConnectionStatus interface
  - Modified store to populate selectedRepositories on load
  - Selection now persists across page refreshes

- ✅ All core acceptance criteria complete (AC #1-5)
  - AC #1: Settings Integration Page ✓
  - AC #2: GitHub OAuth Flow ✓
  - AC #3: Token Exchange & Storage ✓
  - AC #4: Repository List Display ✓
  - AC #5: Repository Selection for Indexing ✓

**Remaining:**
- AC #6: Webhook Configuration (deferred to Story 4.2)
- AC #7: Disconnect Flow (implemented but needs testing)
- AC #8: Error Handling (partially implemented)

### File List

**Backend:**
- `backend/src/main.ts` - Added session middleware configuration
- `backend/src/github/presentation/controllers/github-oauth.controller.ts` - Extended connection endpoint with selectedRepositories
- `backend/src/shared/infrastructure/firebase/firebase.config.ts` - Improved error handling (ServiceUnavailableException)

**Frontend:**
- `client/src/services/github.service.ts` - Added withCredentials, updated ConnectionStatus interface
- `client/src/stores/settings.store.ts` - Modified loadGitHubStatus to populate selectedRepositories

**Dependencies:**
- Added: express-session, @types/express-session

## Change Log

- 2026-02-02: Session persistence and repository selection loading implemented
- 2026-02-01: Story drafted by create-story workflow
