# Manual Testing Checklist
## Epic 4: Code Intelligence & Estimation

**Date:** 2026-02-02  
**Tester:** _____________  
**Backend Version:** 1.0.0  

---

## Pre-Testing Setup

### Environment Setup
- [ ] Backend running: `cd backend && pnpm run dev`
- [ ] Backend accessible: `http://localhost:3000`
- [ ] Swagger UI loads: `http://localhost:3000/api/docs`
- [ ] `.env` file configured with required variables
- [ ] Firebase configured (or mocked)
- [ ] GitHub App credentials available

### Quick Smoke Test
```bash
./backend/test-api.sh
```
- [ ] All quick tests pass

---

## Story 4.1: GitHub App Integration

### OAuth Flow
- [ ] Navigate to `http://localhost:3000/api/auth/github`
- [ ] Redirects to GitHub OAuth page
- [ ] Authorize app permissions
- [ ] Redirects back with token
- [ ] Token stored in session/cookie

### Repository Endpoint
```bash
curl http://localhost:3000/api/github/repos/facebook/react \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] Returns 200 OK
- [ ] Response contains `fullName`
- [ ] Response contains `defaultBranch`
- [ ] Response contains `isPrivate`
- [ ] Response contains `description`

### Branches Endpoint
```bash
curl http://localhost:3000/api/github/repos/facebook/react/branches \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] Returns 200 OK
- [ ] Response contains array of branches
- [ ] Each branch has `name`, `commitSha`, `isDefault`
- [ ] Default branch marked correctly

### Error Handling
```bash
curl http://localhost:3000/api/github/repos/invalid/repo \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] Returns 404 Not Found
- [ ] Error message clear

---

## Story 4.2: Repository Indexing

### Start Indexing
```bash
curl -X POST http://localhost:3000/api/indexing/start \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "test-ws",
    "repositoryId": 123456,
    "repositoryName": "octocat/Hello-World",
    "branch": "master",
    "commitSha": "abc123def456"
  }'
```
- [ ] Returns 202 Accepted
- [ ] Response contains `indexId`
- [ ] Response contains `message`
- [ ] Backend logs show indexing started

### Check Index Status
```bash
curl http://localhost:3000/api/indexing/test-ws/indexes/INDEX_ID_HERE
```
- [ ] Returns 200 OK
- [ ] Response shows `status` (pending/in-progress/completed)
- [ ] Response shows `progress` (0-100)
- [ ] Response shows `totalFiles`
- [ ] Response shows `indexedFiles`

### Query Index
```bash
curl -X POST http://localhost:3000/api/indexing/test-ws/query \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryName": "octocat/Hello-World",
    "searchTerm": "function",
    "fileTypes": ["javascript"]
  }'
```
- [ ] Returns 200 OK
- [ ] Response contains `results` array
- [ ] Each result has `path`, `language`, `matches`
- [ ] Response contains `totalResults`

### File Parsing Tests
**Manually verify logs show:**
- [ ] TypeScript files parsed correctly
- [ ] JSON files parsed correctly
- [ ] Markdown files parsed correctly
- [ ] Large files (>1MB) handled
- [ ] Binary files skipped
- [ ] Corrupted files handled gracefully

---

## Story 4.3: OpenAPI Spec Sync

### Repository WITH OpenAPI Spec

**Test with:** Any repo that has `openapi.yaml` or `openapi.json`

- [ ] After indexing completes, check logs for:
  - `[ApiSpecIndexerImpl] Found OpenAPI spec: openapi.yaml`
  - `[ApiSpecIndexerImpl] Spec is valid with X endpoints`
  - `[ApiSpecIndexerImpl] Computed hash: abc123...`

### Get API Spec
```bash
curl http://localhost:3000/api/indexing/test-ws/api-specs/REPO_NAME
```
- [ ] Returns 200 OK
- [ ] `hasSpec: true`
- [ ] `isValid: true`
- [ ] `specUrl` present
- [ ] `hash` present (64-char SHA-256)
- [ ] `endpoints` array with path/method
- [ ] `version` present
- [ ] `title` present

### Repository WITHOUT OpenAPI Spec (Graceful Degradation)

**Test with:** Repo without any OpenAPI files

- [ ] After indexing, check logs for:
  - `[ApiSpecIndexerImpl] No OpenAPI spec found`
  - `[ApiSpecIndexerImpl] Saving spec status: no spec`

### Get API Spec (No Spec)
```bash
curl http://localhost:3000/api/indexing/test-ws/api-specs/REPO_NAME
```
- [ ] Returns 200 OK
- [ ] `hasSpec: false`
- [ ] `isValid: true`
- [ ] `endpoints: []`
- [ ] `validationErrors: []`
- [ ] No errors or warnings

### Invalid OpenAPI Spec

**Test with:** Repo with malformed `openapi.yaml`

- [ ] After indexing, check logs for:
  - `[ApiSpecIndexerImpl] Found OpenAPI spec: openapi.yaml`
  - `[ApiSpecIndexerImpl] Spec validation failed`

### Get API Spec (Invalid)
```bash
curl http://localhost:3000/api/indexing/test-ws/api-specs/REPO_NAME
```
- [ ] Returns 200 OK
- [ ] `hasSpec: true`
- [ ] `isValid: false`
- [ ] `validationErrors` array present
- [ ] System still functions normally

---

## Story 4.4: Drift Detection

### Setup Test Ticket
1. Create a ticket in Firestore with:
   ```json
   {
     "id": "test-aec-1",
     "status": "ready",
     "codeSnapshot": {
       "commitSha": "abc123",
       "indexId": "idx-1"
     },
     "repositoryContext": {
       "repositoryName": "test/repo"
     }
   }
   ```

### Simulate GitHub Push Webhook
```bash
curl -X POST http://localhost:3000/api/webhooks/github \
  -H "Content-Type: application/json" \
  -H "x-github-event: push" \
  -H "x-hub-signature-256: sha256=YOUR_SIGNATURE" \
  -d '{
    "ref": "refs/heads/main",
    "before": "abc123",
    "after": "def456",
    "repository": {
      "id": 123456,
      "full_name": "test/repo"
    }
  }'
```

**Signature Computation:**
```bash
echo -n 'PAYLOAD' | openssl dgst -sha256 -hmac 'YOUR_WEBHOOK_SECRET'
```

### Verify Webhook Received
- [ ] Returns 200 OK
- [ ] Response: `{"received": true}`

### Check Backend Logs
- [ ] `[GitHubWebhookHandler] Received GitHub webhook: push for repo test/repo`
- [ ] `[DriftDetectorService] Detecting code drift for test/repo@def456`
- [ ] `[DriftDetectorService] Marked AEC test-aec-1 as drifted: Code snapshot changed: abc123 → def456`
- [ ] `[DriftDetectorService] Drift detection complete: X drifted, Y checked`

### Verify Ticket Updated
```bash
curl http://localhost:3000/api/tickets/test-ws/test-aec-1
```
- [ ] `status: "drifted"`
- [ ] `driftDetectedAt` present
- [ ] `driftReason` present
- [ ] Reason shows old→new commit SHA

### No Drift When SHA Matches
1. Send webhook with same commit SHA as ticket
2. Verify ticket status unchanged
3. Logs show: `No drift detected`

### API Drift Detection
1. Create ticket with `apiSnapshot: {hash: "abc123"}`
2. Update OpenAPI spec in repo
3. Re-index repo (new spec hash: "def456")
4. Verify ticket marked as drifted
5. `driftReason` mentions "API spec changed"

---

## Story 4.5: Effort Estimation

### Basic Estimation
```bash
curl -X POST http://localhost:3000/api/tickets/test-ws/TEST_AEC_ID/estimate \
  -H "Content-Type: application/json"
```
- [ ] Returns 200 OK
- [ ] Response contains `min` (number)
- [ ] Response contains `max` (number)
- [ ] Response contains `confidence` ("low"/"medium"/"high")
- [ ] Response contains `drivers` (array of strings)
- [ ] `drivers` length <= 3

### Minimum Estimate (2 hours)
**Test ticket with:**
- `repoPaths: []`
- `hasApiChanges: false`
- `hasDatabaseChanges: false`
- `hasAuthChanges: false`

- [ ] `min >= 2`
- [ ] `max >= 2`

### Module Counting
**Test ticket with:**
- `repoPaths: ["src/a.ts", "src/b.ts", "src/c.ts"]` (3 files)

- [ ] `drivers` includes "3 modules touched"
- [ ] Estimate increased by 3-6 hours

### API Changes
**Test ticket with:**
- `apiSnapshot: {hash: "abc123"}` (indicates API changes)

- [ ] `drivers` includes "API changes detected"
- [ ] Estimate increased by 2-4 hours

### Database Changes
**Test ticket with:**
- `repoPaths: ["migrations/001_add_users.sql"]`

- [ ] `drivers` includes "Database migrations required"
- [ ] Estimate increased by 3-6 hours

### Auth Changes
**Test ticket with:**
- `repoPaths: ["src/auth/permissions.ts"]`

- [ ] `drivers` includes "Auth logic changes"
- [ ] Estimate increased by 2-3 hours

### Complex Ticket
**Test ticket with:**
- 3 modules
- API changes
- DB changes
- Auth changes

- [ ] Estimate shows cumulative hours
- [ ] Only top 3 drivers shown
- [ ] `min` and `max` realistic (not absurd)

### Confidence Levels
**Low confidence (0-1 historical tickets):**
- [ ] `confidence: "low"`
- [ ] `drivers` includes "Limited historical data"
- [ ] Range widened (min≈4, max≈12)

**Medium confidence (2-4 historical tickets):**
- [ ] `confidence: "medium"`
- [ ] Range moderate

**High confidence (5+ historical tickets):**
- [ ] `confidence: "high"`
- [ ] `drivers` mentions "X similar tickets for reference"
- [ ] Range narrowed (tighter estimate)

### Error Handling
**Firestore query fails:**
- [ ] Estimation still succeeds
- [ ] Falls back to low confidence
- [ ] No crash or 500 error

---

## Integration Tests

### End-to-End Flow 1: Index → Estimate
1. [ ] Start indexing a repository
2. [ ] Wait for completion
3. [ ] Create ticket with indexed data
4. [ ] Estimate effort
5. [ ] Verify estimate stored in ticket

### End-to-End Flow 2: Index → Drift
1. [ ] Index repository at commit abc123
2. [ ] Create ticket with snapshot abc123
3. [ ] Simulate code change (webhook with def456)
4. [ ] Verify ticket marked drifted
5. [ ] Drift reason correct

### End-to-End Flow 3: Full Lifecycle
1. [ ] Index repository
2. [ ] Create ticket
3. [ ] Estimate effort
4. [ ] Code changes (webhook)
5. [ ] Drift detected
6. [ ] Status: ready → drifted
7. [ ] All data persisted correctly

---

## Performance Tests

### Load Testing (Optional)
```bash
# Install Apache Bench
brew install httpd

# Test indexing endpoint
ab -n 100 -c 10 -p payload.json -T application/json \
  http://localhost:3000/api/indexing/start
```

- [ ] 100 requests completed
- [ ] No errors
- [ ] Average response time < 1000ms

### Concurrent Drift Detection
- [ ] Create 10 tickets with old SHA
- [ ] Send 1 webhook with new SHA
- [ ] Verify all 10 tickets updated
- [ ] Processing time < 5 seconds

---

## Error Handling & Edge Cases

### Invalid Payloads
```bash
curl -X POST http://localhost:3000/api/indexing/start \
  -H "Content-Type: application/json" \
  -d '{}'
```
- [ ] Returns 400 Bad Request
- [ ] Error message clear

### Missing Auth Token
```bash
curl http://localhost:3000/api/github/repos/facebook/react
```
- [ ] Returns 401 Unauthorized (if guards enabled)
- [ ] OR returns 403 Forbidden

### Malformed Webhook
```bash
curl -X POST http://localhost:3000/api/webhooks/github \
  -H "x-github-event: push" \
  -d 'invalid json'
```
- [ ] Returns 400 or 401
- [ ] System doesn't crash

### Large Repository
- [ ] Index repo with 1000+ files
- [ ] Doesn't timeout
- [ ] Progress updates correctly
- [ ] Completes successfully

---

## Final Checklist

### Functional Tests
- [ ] All Story 4.1 tests pass
- [ ] All Story 4.2 tests pass
- [ ] All Story 4.3 tests pass
- [ ] All Story 4.4 tests pass
- [ ] All Story 4.5 tests pass

### Non-Functional Tests
- [ ] Performance acceptable
- [ ] Error handling robust
- [ ] Logs clear and helpful
- [ ] No memory leaks observed

### Documentation
- [ ] Swagger UI accurate
- [ ] API responses match docs
- [ ] Error messages helpful

### Production Readiness
- [ ] All critical paths tested
- [ ] Edge cases handled
- [ ] Graceful degradation works
- [ ] System resilient to failures

---

## Sign-Off

**Tester Name:** _______________________  
**Date Tested:** _______________________  
**Result:** [ ] PASS  [ ] FAIL  [ ] NEEDS WORK  

**Notes:**
_________________________________________
_________________________________________
_________________________________________

**Issues Found:**
_________________________________________
_________________________________________
_________________________________________

---

**Status:** ✅ Ready for Manual Testing
