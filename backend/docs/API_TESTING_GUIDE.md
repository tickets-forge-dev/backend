# Epic 4 - API Manual Testing Guide
## Code Intelligence & Estimation Features

**Date:** 2026-02-02  
**Backend URL:** `http://localhost:3000`  
**API Docs:** `http://localhost:3000/api/docs`

---

## Prerequisites

### 1. Start the Backend
```bash
cd /Users/Idana/Documents/GitHub/forge/backend
pnpm install
pnpm run dev
```

Wait for: `📚 API Documentation: http://localhost:3000/api/docs`

### 2. Environment Variables
Ensure `.env` file has:
```env
PORT=3000
FRONTEND_URL=http://localhost:3001
GITHUB_CLIENT_ID=your_github_app_client_id
GITHUB_CLIENT_SECRET=your_github_app_secret
GITHUB_WEBHOOK_SECRET=your_webhook_secret
SESSION_SECRET=your_session_secret
```

---

## Story 4.1: GitHub Integration

### Test 1: Health Check
```bash
curl http://localhost:3000/api/health
```

**Expected:** `200 OK` with health status

---

### Test 2: Get Repository Info
```bash
curl -X GET "http://localhost:3000/api/github/repos/facebook/react" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "fullName": "facebook/react",
  "defaultBranch": "main",
  "isPrivate": false,
  "description": "A declarative, efficient, and flexible JavaScript library..."
}
```

**Note:** This requires authentication. Use OAuth flow first or skip if no token.

---

### Test 3: List Repository Branches
```bash
curl -X GET "http://localhost:3000/api/github/repos/facebook/react/branches" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "branches": [
    {
      "name": "main",
      "commitSha": "abc123...",
      "isDefault": true
    },
    {
      "name": "develop",
      "commitSha": "def456...",
      "isDefault": false
    }
  ]
}
```

---

### Test 4: GitHub OAuth Flow (Browser Test)

1. Open browser: `http://localhost:3000/api/auth/github`
2. Authorize GitHub App
3. Should redirect to frontend with token
4. Token stored in session

---

## Story 4.2: Repository Indexing

### Test 5: Start Indexing (Mock)
```bash
curl -X POST "http://localhost:3000/api/indexing/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "workspaceId": "test-workspace",
    "repositoryId": 123456,
    "repositoryName": "test/repo",
    "branch": "main",
    "commitSha": "abc123def456"
  }'
```

**Expected Response:**
```json
{
  "indexId": "idx_abc123",
  "message": "Indexing started"
}
```

**Status:** `202 Accepted`

---

### Test 6: Get Index Status
```bash
curl -X GET "http://localhost:3000/api/indexing/test-workspace/indexes/idx_abc123" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "indexId": "idx_abc123",
  "status": "completed",
  "progress": 100,
  "totalFiles": 42,
  "indexedFiles": 42,
  "createdAt": "2026-02-02T20:00:00.000Z",
  "completedAt": "2026-02-02T20:01:00.000Z"
}
```

---

### Test 7: Query Code Index
```bash
curl -X POST "http://localhost:3000/api/indexing/test-workspace/query" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "repositoryName": "test/repo",
    "searchTerm": "UserService",
    "fileTypes": ["typescript"]
  }'
```

**Expected Response:**
```json
{
  "results": [
    {
      "path": "src/services/UserService.ts",
      "language": "typescript",
      "matches": ["class UserService", "export UserService"]
    }
  ],
  "totalResults": 1
}
```

---

## Story 4.3: OpenAPI Spec Sync

### Test 8: Index API Specs (Automatic)
API specs are indexed automatically during repository indexing.

Check logs for:
```
[ApiSpecIndexerImpl] Indexing API specs for test/repo@abc123
[ApiSpecIndexerImpl] Found OpenAPI spec: openapi.yaml
[ApiSpecIndexerImpl] Spec is valid with 15 endpoints
```

---

### Test 9: Get API Spec Status
```bash
curl -X GET "http://localhost:3000/api/indexing/test-workspace/api-specs/test/repo" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response (with spec):**
```json
{
  "workspaceId": "test-workspace",
  "repositoryName": "test/repo",
  "hasSpec": true,
  "isValid": true,
  "specUrl": "openapi.yaml",
  "hash": "8f3d2a1c9b5e...",
  "endpoints": [
    {
      "path": "/users",
      "method": "GET",
      "operationId": "getUsers"
    },
    {
      "path": "/users",
      "method": "POST",
      "operationId": "createUser"
    }
  ],
  "version": "3.0.0",
  "title": "Test API"
}
```

**Expected Response (without spec - graceful degradation):**
```json
{
  "workspaceId": "test-workspace",
  "repositoryName": "test/repo",
  "hasSpec": false,
  "isValid": true,
  "endpoints": [],
  "validationErrors": []
}
```

---

## Story 4.4: Drift Detection

### Test 10: GitHub Push Webhook (Simulated)
```bash
curl -X POST "http://localhost:3000/api/webhooks/github" \
  -H "Content-Type: application/json" \
  -H "x-github-event: push" \
  -H "x-hub-signature-256: sha256=$(echo -n '{"repository":{"full_name":"test/repo"}}' | openssl dgst -sha256 -hmac 'your_webhook_secret' | sed 's/^.* //')" \
  -d '{
    "ref": "refs/heads/main",
    "before": "abc123",
    "after": "def456",
    "repository": {
      "id": 123456,
      "full_name": "test/repo"
    },
    "commits": [
      {
        "id": "def456",
        "message": "Update authentication logic"
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "received": true
}
```

**Expected Logs:**
```
[GitHubWebhookHandler] Received GitHub webhook: push for repo test/repo
[DriftDetectorService] Detecting code drift for test/repo@def456
[DriftDetectorService] Marked AEC aec-123 as drifted: Code snapshot changed: abc123 → def456
[DriftDetectorService] Drift detection complete: 2 drifted, 5 checked
```

---

### Test 11: Check Drifted Ticket
```bash
curl -X GET "http://localhost:3000/api/tickets/test-workspace/aec-123" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "id": "aec-123",
  "status": "drifted",
  "driftDetectedAt": "2026-02-02T20:05:00.000Z",
  "driftReason": "Code snapshot changed: abc123 → def456",
  "codeSnapshot": {
    "commitSha": "abc123",
    "indexId": "idx_old"
  }
}
```

---

## Story 4.5: Effort Estimation

### Test 12: Estimate Effort
```bash
curl -X POST "http://localhost:3000/api/tickets/test-workspace/aec-123/estimate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "min": 6,
  "max": 10,
  "confidence": "medium",
  "drivers": [
    "3 modules touched",
    "API changes detected",
    "2 similar tickets for reference"
  ]
}
```

---

## Swagger UI Testing

### Open Swagger Docs
Navigate to: `http://localhost:3000/api/docs`

You'll see all API endpoints with:
- ✅ Request/response schemas
- ✅ Try it out buttons
- ✅ Authentication setup
- ✅ Example payloads

---

## Manual Testing Scenarios

### Scenario 1: Full Indexing Flow

1. **Start indexing:**
   ```bash
   curl -X POST http://localhost:3000/api/indexing/start \
     -H "Content-Type: application/json" \
     -d '{"workspaceId":"ws-1","repositoryId":123,"repositoryName":"test/repo","branch":"main","commitSha":"abc123"}'
   ```

2. **Check progress:**
   ```bash
   curl http://localhost:3000/api/indexing/ws-1/indexes/idx_abc123
   ```

3. **Query indexed code:**
   ```bash
   curl -X POST http://localhost:3000/api/indexing/ws-1/query \
     -H "Content-Type: application/json" \
     -d '{"repositoryName":"test/repo","searchTerm":"class"}'
   ```

---

### Scenario 2: Drift Detection Flow

1. **Create ticket with snapshot:**
   ```bash
   curl -X POST http://localhost:3000/api/tickets/ws-1 \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Add password reset",
       "description": "Implement password reset flow",
       "repositoryName": "test/repo",
       "codeSnapshot": {
         "commitSha": "abc123",
         "indexId": "idx_1"
       }
     }'
   ```

2. **Simulate code change (webhook):**
   ```bash
   curl -X POST http://localhost:3000/api/webhooks/github \
     -H "x-github-event: push" \
     -H "x-hub-signature-256: sha256=COMPUTED_SIGNATURE" \
     -d '{"ref":"refs/heads/main","after":"def456","repository":{"full_name":"test/repo"}}'
   ```

3. **Verify ticket drifted:**
   ```bash
   curl http://localhost:3000/api/tickets/ws-1/aec-123
   ```
   Should show `"status": "drifted"`

---

### Scenario 3: Effort Estimation Flow

1. **Create ticket:**
   ```bash
   curl -X POST http://localhost:3000/api/tickets/ws-1 \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Add 2FA",
       "repoPaths": ["src/auth.ts", "src/user.ts", "src/api.ts"],
       "type": "feature"
     }'
   ```

2. **Trigger estimation:**
   ```bash
   curl -X POST http://localhost:3000/api/tickets/ws-1/aec-123/estimate
   ```

3. **Verify estimate stored:**
   ```bash
   curl http://localhost:3000/api/tickets/ws-1/aec-123
   ```
   Should include `"estimate": {"min":6,"max":10,"confidence":"medium"}`

---

## Testing Without Auth (Development Mode)

If guards are disabled (commented out), you can test without tokens:

```bash
# All endpoints work without Authorization header
curl http://localhost:3000/api/indexing/start -X POST -H "Content-Type: application/json" -d '{...}'
```

---

## Troubleshooting

### Issue: 401 Unauthorized
**Solution:** Auth guards are enabled. Either:
1. Complete OAuth flow to get token
2. Temporarily comment out `@UseGuards()` decorators
3. Use Swagger UI which handles auth

### Issue: 404 Not Found
**Solution:** Check:
1. Backend is running on port 3000
2. Endpoint path starts with `/api/`
3. Method (GET/POST) is correct

### Issue: 500 Internal Server Error
**Solution:** Check backend logs:
```bash
tail -f backend/logs/app.log
```

### Issue: CORS Error (Browser)
**Solution:** Ensure `FRONTEND_URL` env var is set correctly

---

## Success Criteria

After manual testing, verify:

✅ **Story 4.1:** GitHub endpoints return repository data  
✅ **Story 4.2:** Indexing jobs start and complete  
✅ **Story 4.3:** API specs detected and parsed (or gracefully degraded)  
✅ **Story 4.4:** Webhooks trigger drift detection  
✅ **Story 4.5:** Effort estimates calculated correctly  

---

## Next Steps

1. ✅ Run all curl tests above
2. ✅ Verify Swagger UI (`/api/docs`)
3. ✅ Test with real GitHub repository
4. ✅ Test webhook with ngrok tunnel
5. ✅ Load test with Apache Bench or k6

---

**Status:** Ready for Manual Testing 🚀
