# Story 4.1: GitHub App Integration - Progress Tracker

**Story:** GitHub App Integration - Read-Only Repo Access  
**Started:** _________  
**Target Completion:** _________  
**Status:** 🟡 Not Started

---

## Quick Links

- [Implementation Guide](./STORY_4.1_IMPLEMENTATION_GUIDE.md)
- [Story File](./sprint-artifacts/4-1-github-app-integration-read-only-repo-access.md)
- [Context File](./sprint-artifacts/4-1-github-app-integration-read-only-repo-access.context.xml)

---

## Phase 1: GitHub App Setup (Manual) ⏱️ 30-60 minutes

- [ ] 1.1: Create GitHub App
  - [ ] Go to https://github.com/settings/apps/new
  - [ ] Configure name, URLs, permissions
  - [ ] Subscribe to push and pull_request events
- [ ] 1.2: Save Credentials
  - [ ] Copy App ID
  - [ ] Copy Client ID
  - [ ] Generate and copy Client Secret
  - [ ] Copy Webhook Secret
- [ ] 1.3: Generate Private Key (optional)
- [ ] 1.4: Update Environment Variables
  - [ ] Add GITHUB_CLIENT_ID to backend/.env
  - [ ] Add GITHUB_CLIENT_SECRET to backend/.env
  - [ ] Add GITHUB_APP_ID to backend/.env
  - [ ] Add GITHUB_WEBHOOK_SECRET to backend/.env
  - [ ] Add GITHUB_CALLBACK_URL to backend/.env
  - [ ] Add GITHUB_TOKEN_ENCRYPTION_KEY to backend/.env
- [ ] 1.5: Install App to Test Organization

**Phase 1 Complete:** [ ] Yes  
**Time Spent:** _____ hours

---

## Phase 2: Backend Domain Layer ⏱️ 4-6 hours

### Domain Entities
- [ ] 2.1: Create GitHubIntegration.ts
  - Location: `backend/src/github/domain/GitHubIntegration.ts`
  - Has create() and reconstitute() methods
  - Has selectRepositories() method
  - Has updateToken() method
  - Has disconnect() method
- [ ] 2.2: Create GitHubIntegrationRepository.ts (interface)
  - Location: `backend/src/github/domain/GitHubIntegrationRepository.ts`
  - Has save(), findByWorkspace(), delete() methods
- [ ] 2.3: Create GitHubRepository.ts (value object)
  - Location: `backend/src/github/domain/GitHubRepository.ts`
  - Defines repository metadata structure

### Testing
- [ ] 2.4: Write unit tests for GitHubIntegration
  - Test create()
  - Test selectRepositories()
  - Test isTokenExpired()
  - Test disconnect()

**Phase 2 Complete:** [ ] Yes  
**Time Spent:** _____ hours

---

## Phase 3: Application Layer ⏱️ 8-10 hours

### Services
- [ ] 3.1: Create GitHubTokenService.ts
  - Location: `backend/src/github/application/services/GitHubTokenService.ts`
  - Implement exchangeCodeForToken()
  - Implement refreshToken()
  - Implement revokeToken()
  - Implement encryptToken()
  - Implement decryptToken()

### Use Cases
- [ ] 3.2: Create ConnectGitHubUseCase.ts
  - Location: `backend/src/github/application/use-cases/ConnectGitHubUseCase.ts`
  - Handles OAuth flow completion
- [ ] 3.3: Create GetGitHubRepositoriesUseCase.ts
  - Fetches repositories using Octokit
  - Returns formatted repository list
- [ ] 3.4: Create SelectRepositoriesUseCase.ts
  - Updates selected repository IDs
  - Persists to integration entity
- [ ] 3.5: Create DisconnectGitHubUseCase.ts
  - Revokes token on GitHub
  - Deletes integration from database

### Testing
- [ ] 3.6: Write unit tests for GitHubTokenService
  - Test token encryption/decryption
  - Test exchangeCodeForToken()
- [ ] 3.7: Write unit tests for use cases
  - Test ConnectGitHubUseCase
  - Test GetGitHubRepositoriesUseCase
  - Test SelectRepositoriesUseCase
  - Test DisconnectGitHubUseCase

**Phase 3 Complete:** [ ] Yes  
**Time Spent:** _____ hours

---

## Phase 4: Infrastructure Layer ⏱️ 4-6 hours

### Persistence
- [ ] 4.1: Create FirestoreGitHubIntegrationRepository.ts
  - Location: `backend/src/github/infrastructure/persistence/`
  - Implements IGitHubIntegrationRepository
  - save() method
  - findByWorkspace() method
  - delete() method

### Testing
- [ ] 4.2: Write repository tests
  - Test save()
  - Test findByWorkspace()
  - Test delete()
  - Test with Firestore emulator

**Phase 4 Complete:** [ ] Yes  
**Time Spent:** _____ hours

---

## Phase 5: Presentation Layer ⏱️ 6-8 hours

### Controllers
- [ ] 5.1: Create GitHubOAuthController.ts
  - Location: `backend/src/github/presentation/controllers/`
  - GET /api/github/oauth/authorize
  - GET /api/github/oauth/callback
  - GET /api/github/repositories
  - POST /api/github/repositories/select
  - POST /api/github/disconnect
  - Apply FirebaseAuthGuard and WorkspaceGuard

### Webhooks
- [ ] 5.2: Create GitHubWebhookHandler.ts
  - Location: `backend/src/github/infrastructure/webhooks/`
  - POST /api/webhooks/github
  - Verify webhook signature
  - Handle push events
  - Handle pull_request events

### Module Setup
- [ ] 5.3: Create github.module.ts
  - Register all providers
  - Register controllers
  - Export services
- [ ] 5.4: Register GitHubModule in app.module.ts
  - Add to imports array

### Dependencies
- [ ] 5.5: Install required packages
  ```bash
  cd backend
  npm install @octokit/rest
  npm install --save-dev @types/node
  ```

### Testing
- [ ] 5.6: Write controller tests
  - Test authorize endpoint
  - Test callback endpoint
  - Test repositories endpoint
  - Test select endpoint
  - Test disconnect endpoint
- [ ] 5.7: Write webhook handler tests
  - Test signature verification
  - Test push event handling
  - Test pull_request event handling

**Phase 5 Complete:** [ ] Yes  
**Time Spent:** _____ hours

---

## Phase 6: Frontend Implementation ⏱️ 10-15 hours

### Services
- [ ] 6.1: Update github.service.ts
  - Location: `client/src/services/github.service.ts`
  - Implement getOAuthUrl()
  - Implement getConnectionStatus()
  - Implement listRepositories()
  - Implement selectRepositories()
  - Implement disconnect()

### State Management
- [ ] 6.2: Create settings.store.ts
  - Location: `client/src/stores/settings.store.ts`
  - Add githubConnected state
  - Add githubRepositories state
  - Add selectedRepositoryIds state
  - Implement loadGitHubStatus()
  - Implement connectGitHub()
  - Implement loadRepositories()
  - Implement selectRepositories()
  - Implement disconnectGitHub()

### UI Components
- [ ] 6.3: Create GitHubIntegration.tsx
  - Location: `client/src/settings/components/GitHubIntegration.tsx`
  - "Connect GitHub" button
  - Connected status display
  - Repository list with checkboxes
  - "Save Selection" button
  - "Disconnect" button with confirmation
- [ ] 6.4: Add Settings Page Route
  - Create settings/integrations page
  - Add GitHubIntegration component
- [ ] 6.5: Update RepositorySelector.tsx (if exists)
  - Use connected repositories
  - Fallback to manual input

### Testing
- [ ] 6.6: Write component tests
  - Test GitHubIntegration component
  - Test connect flow
  - Test repository selection
  - Test disconnect flow

**Phase 6 Complete:** [ ] Yes  
**Time Spent:** _____ hours

---

## Phase 7: Integration Testing ⏱️ 4-6 hours

### End-to-End Tests
- [ ] 7.1: Test OAuth Flow
  - Click "Connect GitHub"
  - Authorize on GitHub
  - Redirected back to app
  - Status shows "Connected"
- [ ] 7.2: Test Repository List
  - Repositories load after connection
  - Metadata displayed correctly
  - Filtering/search works (if implemented)
- [ ] 7.3: Test Repository Selection
  - Select repositories with checkboxes
  - Click "Save Selection"
  - Selection persisted
- [ ] 7.4: Test Disconnection
  - Click "Disconnect"
  - Confirm dialog appears
  - Token revoked
  - UI returns to "Connect" state
- [ ] 7.5: Test Webhook Reception
  - Use ngrok for local webhook URL
  - Push to connected repository
  - Webhook received and logged
  - Signature verification works

### Error Scenarios
- [ ] 7.6: Test OAuth popup blocked
  - Appropriate error message shown
- [ ] 7.7: Test token expiration
  - Re-authentication prompted
- [ ] 7.8: Test rate limits
  - Friendly error with retry timing
- [ ] 7.9: Test revoked access
  - Reconnect prompt shown

**Phase 7 Complete:** [ ] Yes  
**Time Spent:** _____ hours

---

## Phase 8: Documentation & Deployment ⏱️ 2-3 hours

### Documentation
- [ ] 8.1: Update .env.example
  - Add all GitHub environment variables
- [ ] 8.2: Write setup instructions
  - Document GitHub App creation
  - Document environment variable setup
  - Document testing with ngrok
- [ ] 8.3: Update API documentation
  - Document OAuth endpoints
  - Document webhook endpoint
- [ ] 8.4: Update sprint status
  - Change story status to "done" in sprint-status.yaml

### Deployment
- [ ] 8.5: Create PR
  - Write detailed PR description
  - Link to story files
  - Include testing notes
- [ ] 8.6: Code review
  - Address review comments
  - Ensure all tests pass
- [ ] 8.7: Merge to main
  - Squash commits if needed
  - Update changelog

**Phase 8 Complete:** [ ] Yes  
**Time Spent:** _____ hours

---

## Final Checklist - Story Complete ✅

### Acceptance Criteria (from Story 4.1)
- [ ] Settings Integration Page exists
- [ ] Connect GitHub button works
- [ ] OAuth flow completes successfully
- [ ] Token stored encrypted in Firestore
- [ ] Repository list displays after connection
- [ ] Repository selection persists
- [ ] Webhook configured and receiving events
- [ ] Disconnect flow works
- [ ] Error handling implemented

### Code Quality
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Clean Architecture maintained
- [ ] Domain layer has no external dependencies
- [ ] Tokens encrypted before storage
- [ ] Webhook signature verified
- [ ] Error handling comprehensive
- [ ] Logging added for debugging

### Testing
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual testing complete
- [ ] OAuth flow tested
- [ ] Webhook tested with ngrok
- [ ] Error scenarios tested
- [ ] Code coverage > 80%

### Documentation
- [ ] Implementation guide complete
- [ ] .env.example updated
- [ ] API docs updated
- [ ] Setup instructions written
- [ ] PR description complete

### Deployment
- [ ] Feature branch created
- [ ] All commits follow convention
- [ ] PR created and reviewed
- [ ] CI/CD pipeline passes
- [ ] Merged to main
- [ ] Sprint status updated

---

## Time Tracking Summary

| Phase | Estimated | Actual | Notes |
|-------|-----------|--------|-------|
| Phase 1: GitHub App Setup | 0.5-1h | ___h | |
| Phase 2: Domain Layer | 4-6h | ___h | |
| Phase 3: Application Layer | 8-10h | ___h | |
| Phase 4: Infrastructure Layer | 4-6h | ___h | |
| Phase 5: Presentation Layer | 6-8h | ___h | |
| Phase 6: Frontend | 10-15h | ___h | |
| Phase 7: Testing | 4-6h | ___h | |
| Phase 8: Docs & Deploy | 2-3h | ___h | |
| **TOTAL** | **40-60h** | **___h** | |

---

## Blockers & Issues

| Date | Issue | Resolution | Status |
|------|-------|------------|--------|
| | | | |

---

## Notes & Learnings

### What Went Well


### What Could Be Improved


### Unexpected Challenges


---

## Dependencies for Next Stories

After Story 4.1 is complete, these stories become unblocked:
- ✅ Story 4.2: Code Indexing (depends on GitHub connection)
- ✅ Story 4.3: OpenAPI Spec Sync (depends on GitHub connection)
- ✅ Story 4.4: Drift Detection (depends on webhooks + indexing)
- ✅ Story 4.5: Effort Estimation (depends on code indexing)
- ✅ Story 4.6: Safety Rails (depends on code indexing)

---

**Story Status:** 🟡 Not Started → 🟠 In Progress → 🟢 Complete

**Completed:** ___________  
**Total Time:** _____ hours  
**Merged PR:** #_____
