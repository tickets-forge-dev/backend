# Scenario Testing Guide
## Epic 4 - Interactive curl-based Scenarios

This guide provides **5 interactive scenarios** you can run to test the complete Epic 4 functionality.

---

## 🚀 Quick Start

### Option 1: Interactive Menu (Recommended)
```bash
./backend/test-scenarios.sh
```

This launches an interactive menu where you can choose which scenario to run.

### Option 2: Run All Scenarios
```bash
./backend/test-scenarios.sh
# Then choose option 6
```

---

## 📋 Available Scenarios

### Scenario 1: Repository Indexing Flow ⏱️ ~2 minutes
**Tests:** Story 4.2 (Indexing) + Story 4.3 (OpenAPI)

**Flow:**
1. Start indexing a repository
2. Check indexing status (pending → in-progress → completed)
3. Query the indexed files
4. Check for OpenAPI spec

**What You'll See:**
- ✅ Index ID returned
- ✅ Progress tracking
- ✅ File search results
- ✅ API spec detection (or graceful "not found")

**Key Endpoints:**
- `POST /api/indexing/start`
- `GET /api/indexing/{workspace}/indexes/{id}`
- `POST /api/indexing/{workspace}/query`
- `GET /api/indexing/{workspace}/api-specs/{repo}`

---

### Scenario 2: Drift Detection Flow ⏱️ ~3 minutes
**Tests:** Story 4.4 (Drift Detection)

**Flow:**
1. Create AEC ticket with code snapshot (commit SHA)
2. Simulate GitHub push webhook (new commit)
3. Check backend logs for drift detection
4. Verify ticket status changed to "drifted"

**What You'll See:**
- ✅ Webhook accepted
- ✅ Drift detection logs in backend
- ✅ Ticket marked as "drifted"
- ✅ Drift reason stored

**Key Endpoints:**
- `POST /api/webhooks/github`
- (Ticket retrieval would use `GET /api/tickets/{workspace}/{id}`)

**Expected Logs:**
```
[DriftDetectorService] Detecting code drift for octocat/Hello-World@def456new
[DriftDetectorService] Marked AEC aec-drift-test-001 as drifted
[DriftDetectorService] Drift detection complete: 1 drifted, 1 checked
```

---

### Scenario 3: Effort Estimation Flow ⏱️ ~2 minutes
**Tests:** Story 4.5 (Estimation)

**Flow:**
1. Create ticket with context (modules, API changes, etc.)
2. Request effort estimation
3. View estimation breakdown
4. See how historical data improves estimates

**What You'll See:**
- ✅ Estimate range (min-max hours)
- ✅ Confidence level (low/medium/high)
- ✅ Top 3 drivers explaining the estimate
- ✅ Historical data impact

**Key Endpoints:**
- `POST /api/tickets/{workspace}/{id}/estimate`

**Example Response:**
```json
{
  "min": 7,
  "max": 12,
  "confidence": "low",
  "drivers": [
    "3 modules touched",
    "API changes detected",
    "Limited historical data"
  ]
}
```

---

### Scenario 4: Complete Lifecycle ⏱️ ~5 minutes
**Tests:** All Stories (4.1 → 4.5)

**Full Flow:**
1. Index repository at commit A
2. Create AEC ticket
3. Get initial effort estimate
4. Code changes (commit B) → Drift detected
5. Re-index repository at commit B
6. Update ticket with new snapshot
7. Re-estimate effort

**What You'll See:**
- ✅ End-to-end ticket lifecycle
- ✅ Drift detection and recovery
- ✅ Estimate changes based on new code
- ✅ Complete production workflow

---

### Scenario 5: OpenAPI Spec Detection ⏱️ ~3 minutes
**Tests:** Story 4.3 (OpenAPI Spec Sync)

**Flow:**
1. Index repository with OpenAPI spec
2. Query for API spec
3. See spec hash computation
4. Simulate spec changes → API drift
5. Test graceful degradation (no spec)

**What You'll See:**
- ✅ Multiple spec locations searched
- ✅ SHA-256 hash computed
- ✅ API drift detection
- ✅ Graceful fallback when no spec

**Spec Search Order:**
1. `/openapi.yaml`
2. `/openapi.json`
3. `/swagger.yaml`
4. `/swagger.json`
5. `/docs/openapi.yaml`
6. `/api/openapi.yaml`

---

## 🎯 How It Works

### Interactive Mode
Each scenario:
1. **Explains what it's testing**
2. **Shows the curl command** it's about to run
3. **Displays the response** in formatted JSON
4. **Waits for you to press ENTER** before continuing
5. **Highlights successes** with ✓ and colors

### Visual Output
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCENARIO 1: Repository Indexing Flow
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ This simulates indexing a repository and querying the index

📝 Step 1: Start indexing repository
Request:
POST /api/indexing/start
{
  "repositoryId": 1296269,
  "repositoryName": "octocat/Hello-World",
  "branch": "master",
  "commitSha": "7fd1a60b01f91b314f59955a4e4d4e80d8edf11d"
}

Response:
{
  "indexId": "idx-abc123",
  "message": "Indexing started"
}

✓ Indexing started with ID: idx-abc123

Press ENTER to continue...
```

---

## 🛠️ Prerequisites

1. **Backend must be running:**
   ```bash
   cd backend
   pnpm run dev
   ```

2. **Backend accessible at:**
   ```
   http://localhost:3000
   ```

3. **Python 3 installed** (for JSON formatting)

---

## 📖 Manual curl Commands

If you prefer to run commands manually instead of the interactive script:

### Start Indexing
```bash
curl -X POST http://localhost:3000/api/indexing/start \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryId": 1296269,
    "repositoryName": "octocat/Hello-World",
    "branch": "master",
    "commitSha": "7fd1a60b01f91b314f59955a4e4d4e80d8edf11d"
  }'
```

### Check Index Status
```bash
curl http://localhost:3000/api/indexing/test-workspace-001/indexes/{INDEX_ID}
```

### Simulate Webhook (Drift)
```bash
curl -X POST http://localhost:3000/api/webhooks/github \
  -H "Content-Type: application/json" \
  -H "x-github-event: push" \
  -d '{
    "ref": "refs/heads/main",
    "before": "abc123old",
    "after": "def456new",
    "repository": {
      "id": 1296269,
      "full_name": "octocat/Hello-World"
    }
  }'
```

### Estimate Effort
```bash
curl -X POST http://localhost:3000/api/tickets/test-workspace-001/{TICKET_ID}/estimate
```

### Get API Spec
```bash
curl http://localhost:3000/api/indexing/test-workspace-001/api-specs/octocat%2FHello-World
```

---

## 🔍 What to Observe

### In the Script Output
- ✅ Green checkmarks for successes
- ℹ Blue info messages
- ✗ Red errors (if any)
- Formatted JSON responses

### In Backend Logs
Watch your backend terminal for:
- `[IndexingService] Started indexing...`
- `[FileIndexerImpl] Indexed X files`
- `[ApiSpecIndexerImpl] Found OpenAPI spec`
- `[DriftDetectorService] Detected drift for...`
- `[EstimationEngineService] Estimated effort...`

### In Firestore (if configured)
- Tickets created with snapshots
- Tickets marked as "drifted"
- Estimates stored in ticket.estimate

---

## 🚨 Troubleshooting

### Backend Not Running
```
✗ Backend is not accessible at http://localhost:3000
Start it with: cd backend && pnpm run dev
```

**Fix:** Start the backend first

### JSON Parse Errors
If you see JSON formatting errors, the response might be HTML or an error page.

**Fix:** Check backend logs for errors

### 404 Errors
Some endpoints require data to exist first (e.g., tickets in Firestore).

**Expected:** The scenarios handle this gracefully and explain what would happen in production

---

## 📊 Success Criteria

After running all scenarios, you should see:

✅ **Scenario 1:** Indexing started, status retrieved, queries work  
✅ **Scenario 2:** Webhooks accepted, drift detected (in logs)  
✅ **Scenario 3:** Estimates returned with drivers  
✅ **Scenario 4:** Full lifecycle completed  
✅ **Scenario 5:** Spec detection + graceful degradation  

---

## 🎓 Learning Outcomes

By running these scenarios, you'll understand:

1. **How indexing works** - Repository → Files → Index → Query
2. **How drift detection works** - Webhook → Compare SHA → Mark drifted
3. **How estimation works** - Complexity factors → Range → Confidence
4. **How specs are tracked** - Detect → Hash → Compare → API drift
5. **How it all connects** - Complete ticket lifecycle

---

## 📚 Related Documentation

- **API Testing Guide:** `backend/API_TESTING_GUIDE.md` (detailed curl commands)
- **Manual Checklist:** `backend/MANUAL_TESTING_CHECKLIST.md` (QA checklist)
- **Quick Tests:** `backend/test-api.sh` (automated smoke tests)
- **Integration Tests:** `backend/TESTING.md` (Jest test suite)

---

## 🎉 Next Steps

After running scenarios:

1. ✅ Try modifying the test data (repo names, commits, etc.)
2. ✅ Watch backend logs while scenarios run
3. ✅ Check Firestore to see data persisted
4. ✅ Try the full manual checklist for deeper testing
5. ✅ Deploy to production! 🚀

---

**Status:** ✅ Ready for Interactive Testing

**Run:** `./backend/test-scenarios.sh`
