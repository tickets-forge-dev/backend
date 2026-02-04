# Epic 7 Testing & Debugging Plan

**Date**: 2026-02-04
**Status**: TESTING PHASE
**Priority**: P0 - CRITICAL

---

## 🚨 **Current Issues (User Reported)**

### 1. **Code Not Being Scanned**
- Repository indexing may not be working
- Workflow not accessing indexed code
- No validation insights being generated

### 2. **Partial/Broken Ticket Data**
- Tickets showing incomplete information
- Missing acceptance criteria
- Missing assumptions
- Partial data persistence

### 3. **Questions Completely Broken**
- Question generation not working
- Questions UI not displaying
- Need complete redesign

### 4. **Progress Visibility**
- User can't see what's happening during generation
- Need more granular progress updates
- Preflight check details hidden

---

## 📋 **Testing Strategy**

### **Phase 1: Elementary Testing (Step-by-Step)**
Test each workflow step individually to find breaking points.

### **Phase 2: Integration Testing**
Test full workflow end-to-end with real data.

### **Phase 3: Fix & Iterate**
Fix issues as discovered, re-test after each fix.

---

## 🔍 **Phase 1: Elementary Testing Checklist**

### **Test 1: Backend Startup**
**Goal**: Verify backend starts without errors

```bash
cd /Users/Idana/Documents/GitHub/forge/backend
npm run dev
```

**Check**:
- [ ] Backend starts on port 3000
- [ ] No compilation errors
- [ ] All modules load (Firebase, Tickets, Indexing, GitHub)
- [ ] Mastra workflow registered
- [ ] All services registered

**Expected Output**:
```
[Nest] Application successfully started
✅ Firebase ready
✅ [TicketsModule] Mastra workflow registered
```

**Actual Output**: (To be filled during testing)

---

### **Test 2: Create Ticket (API)**
**Goal**: Test POST /api/tickets endpoint directly

```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {FIREBASE_TOKEN}" \
  -d '{
    "title": "Fix login validation bug",
    "description": "Email validation crashes when domain is missing",
    "workspaceId": "test-workspace",
    "repositoryId": "test-repo"
  }'
```

**Check**:
- [ ] Request returns 201 Created
- [ ] Response includes aecId
- [ ] Response includes initial status (DRAFT or GENERATING)
- [ ] Firestore document created
- [ ] Workflow execution started (check logs)

**Expected Response**:
```json
{
  "aecId": "uuid-here",
  "status": "GENERATING",
  "workflowRunId": "workflow-run-id"
}
```

**Actual Response**: (To be filled during testing)

---

### **Test 3: Workflow Step 1 - Extract Intent**
**Goal**: Verify LLM can extract intent from input

**Check Logs For**:
```
[Step 1] Extracting intent...
[MastraContentGenerator] Calling LLM...
[Step 1] Intent extracted: "Fix email validation..."
```

**Check**:
- [ ] Step 1 logs appear
- [ ] LLM call succeeds
- [ ] Intent extracted
- [ ] AEC updated in Firestore with intent
- [ ] Progress updated (step 1 complete)

**Debug If Failed**:
- Check Ollama is running: `curl http://localhost:11434/api/tags`
- Check MastraContentGenerator is registered
- Check LLM provider configured correctly

---

### **Test 4: Workflow Step 2 - Detect Type**
**Goal**: Verify ticket type detection

**Check**:
- [ ] Step 2 logs appear
- [ ] Type detected (BUG, FEATURE, REFACTOR, etc.)
- [ ] AEC updated with type
- [ ] Progress updated (step 2 complete)

**Expected Log**:
```
[Step 2] Detecting type...
[Step 2] Type detected: BUG
```

---

### **Test 5: Workflow Step 3 - Preflight Validation**
**Goal**: Verify code scanning and validation

**This is Critical - Check**:
- [ ] Step 3 logs appear
- [ ] Workspace created/retrieved
- [ ] Repository cloned (if not already)
- [ ] Code indexed (if not already)
- [ ] Validation runs
- [ ] Findings generated
- [ ] Findings saved to AEC

**Expected Log**:
```
[Step 3] Running preflight validation...
[MastraWorkspaceFactory] Getting workspace for: test-repo
[QuickPreflightValidator] Running validators...
[Step 3] Found 5 findings (2 critical, 3 medium)
[Step 3] Findings: [...]
```

**Debug If Failed**:
- Check indexing status: `GET /api/indexing/status?repoId={repoId}`
- Check workspace exists in LibSQL
- Check validation service registered
- Check findings structure

---

### **Test 6: Workflow Step 4 - Review Findings (SUSPENSION)**
**Goal**: Verify workflow suspends for user review

**Check**:
- [ ] Workflow suspends at step 4
- [ ] AEC status: SUSPENDED_FINDINGS
- [ ] Findings visible in response
- [ ] Workflow state saved to LibSQL
- [ ] User can see findings in UI

**Expected**:
- AEC status: `SUSPENDED_FINDINGS`
- Generation state: `{ currentStep: 4, steps: [...], findings: [...] }`

**Resume Test**:
```bash
curl -X POST http://localhost:3000/api/tickets/{aecId}/resume \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{ "action": "proceed" }'
```

---

### **Test 7: Workflow Step 5 - Gather Repo Context**
**Goal**: Verify index query works

**Check**:
- [ ] Step 5 logs appear
- [ ] IndexQueryService called
- [ ] Relevant modules found
- [ ] Context saved to AEC
- [ ] Progress updated

**Expected Log**:
```
[Step 5] Gathering repository context...
[IndexQueryService] Querying index with keywords: ["email", "validation", "login"]
[Step 5] Found 8 relevant modules
```

**Debug If Failed**:
- Check index exists: `GET /api/indexing/indexes/{indexId}`
- Check index has embeddings
- Check query service registered

---

### **Test 8: Workflow Step 6 - Gather API Context**
**Goal**: Verify API spec parsing (if available)

**Check**:
- [ ] Step 6 logs appear
- [ ] API spec found (or gracefully skipped)
- [ ] Endpoints extracted
- [ ] Context saved to AEC

**Expected Log**:
```
[Step 6] Gathering API context...
[Step 6] Found 12 API endpoints
(or)
[Step 6] No API spec found, skipping
```

---

### **Test 9: Workflow Step 7 - Generate Acceptance Criteria**
**Goal**: Verify LLM generates AC

**Check**:
- [ ] Step 7 logs appear
- [ ] LLM call with code context
- [ ] Acceptance criteria generated
- [ ] Assumptions generated
- [ ] Draft content saved to AEC
- [ ] Progress updated

**Expected Log**:
```
[Step 7] Generating acceptance criteria...
[MastraContentGenerator] Generating AC with context...
[Step 7] Generated 5 acceptance criteria, 3 assumptions
```

---

### **Test 10: Workflow Step 8 - Generate Questions**
**Goal**: Verify question generation from validation findings

**Check**:
- [ ] Step 8 logs appear
- [ ] FindingsToQuestionsAgent called
- [ ] Questions generated (max 3)
- [ ] Questions saved to AEC
- [ ] Questions have options (chips)

**Expected Log**:
```
[Step 8] Generating questions...
[FindingsToQuestionsAgent] Processing 5 findings...
[Step 8] Generated 3 questions
```

**Check Question Structure**:
```typescript
{
  id: "q1",
  text: "Does this change authentication logic?",
  type: "binary",
  options: ["Yes", "No", "Unsure"],
  priority: "high",
  relatedFindingId: "finding-id"
}
```

---

### **Test 11: Workflow Step 9 - Ask Questions (SUSPENSION)**
**Goal**: Verify workflow suspends for questions

**Check**:
- [ ] Workflow suspends at step 9
- [ ] AEC status: SUSPENDED_QUESTIONS
- [ ] Questions visible in response
- [ ] User can see questions in UI
- [ ] User can submit answers

**Answer Questions**:
```bash
curl -X POST http://localhost:3000/api/tickets/{aecId}/answer-questions \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "answers": [
      { "questionId": "q1", "answer": "No" },
      { "questionId": "q2", "answer": "Yes" }
    ]
  }'
```

---

### **Test 12: Workflow Step 10 - Refine Draft**
**Goal**: Verify LLM refines based on answers

**Check**:
- [ ] Step 10 logs appear
- [ ] LLM called with answers
- [ ] Draft refined
- [ ] AEC updated

---

### **Test 13: Workflow Step 11 - Finalize**
**Goal**: Verify final save and unlock

**Check**:
- [ ] Step 11 logs appear
- [ ] AEC status: VALIDATED
- [ ] All fields populated
- [ ] Lock released
- [ ] Workflow completed

---

### **Test 14: Frontend - Ticket Detail View**
**Goal**: Verify UI displays ticket data

**Navigate to**: `http://localhost:3001/tickets/{aecId}`

**Check**:
- [ ] Title displays
- [ ] Description displays
- [ ] Acceptance criteria display (5 items)
- [ ] Assumptions display (3 items)
- [ ] Affected code displays
- [ ] Validation findings display
- [ ] Progress bar displays (if generating)
- [ ] Questions display (if suspended)

---

### **Test 15: Frontend - Real-Time Progress**
**Goal**: Verify Firestore subscription updates UI

**Steps**:
1. Open ticket detail page
2. Create new ticket via API
3. Watch UI update in real-time

**Check**:
- [ ] Progress bar moves from step to step
- [ ] Step titles update
- [ ] Status changes (GENERATING → SUSPENDED → VALIDATED)
- [ ] UI updates without page refresh

---

## 🔧 **Phase 2: Integration Tests**

### **Full Flow Test 1: Bug Ticket**
**Input**:
```json
{
  "title": "Login fails with invalid email",
  "description": "Users can't login when email is malformed (missing domain)",
  "workspaceId": "workspace-1",
  "repositoryId": "backend-repo"
}
```

**Expected Output**:
- Type: BUG
- 5+ acceptance criteria
- 3+ assumptions
- 2-3 questions about edge cases
- Findings reference actual files (e.g., `EmailValidator.ts`)
- No hallucinated code references

---

### **Full Flow Test 2: Feature Ticket**
**Input**:
```json
{
  "title": "Add user profile photo upload",
  "description": "Allow users to upload profile photos (max 5MB)",
  "workspaceId": "workspace-1",
  "repositoryId": "backend-repo"
}
```

**Expected Output**:
- Type: FEATURE
- 5+ acceptance criteria with Given/When/Then
- Storage requirements mentioned
- API endpoints suggested
- Security considerations (auth, file validation)

---

## 🐛 **Phase 3: Known Issues to Fix**

### **Issue 1: Questions Not Displaying**
**Symptoms**: Questions generated but not visible in UI

**Root Cause Hypotheses**:
1. Questions not saved to Firestore correctly
2. Frontend not reading questions field
3. Questions UI component not rendered
4. Firestore subscription not updating

**Debug Steps**:
1. Check Firestore: Does AEC have `questions` array?
2. Check frontend console: Any errors?
3. Check component: Is `QuestionsSection` rendering?
4. Check store: Is `questions` in Zustand state?

---

### **Issue 2: Partial Ticket Data**
**Symptoms**: Tickets missing AC, assumptions, or other fields

**Root Cause Hypotheses**:
1. Workflow completing before all steps run
2. AEC mapper not persisting all fields
3. LLM not generating complete output
4. Validation failing silently

**Debug Steps**:
1. Check workflow logs: Did all 12 steps complete?
2. Check AEC in Firestore: Which fields are missing?
3. Check LLM responses: Are they complete?
4. Check mapper: Is it handling all fields?

---

### **Issue 3: Code Not Being Scanned**
**Symptoms**: No code references, generic findings

**Root Cause Hypotheses**:
1. Repository not indexed
2. Workspace not created
3. Validation not running
4. IndexQueryService not working

**Debug Steps**:
1. Check indexing status: `GET /api/indexing/status`
2. Check workspace in LibSQL: Does it exist?
3. Check validation logs: Is it running?
4. Check findings: Do they reference actual files?

---

## 📊 **Success Criteria**

After all tests pass, we should have:

✅ **Backend**:
- Workflow executes all 12 steps
- No runtime errors
- All services registered
- Data persisted correctly

✅ **Code Scanning**:
- Repository indexed
- Workspace created
- Validation runs
- Findings reference actual files

✅ **Ticket Quality**:
- 5+ acceptance criteria
- 3+ assumptions
- Code-aware content
- No hallucinations

✅ **Questions**:
- 2-3 questions generated
- Questions have options
- Questions display in UI
- Answers can be submitted

✅ **Progress**:
- Real-time UI updates
- All 12 steps visible
- Suspension points work
- Resume functionality works

✅ **Frontend**:
- Ticket detail view complete
- Real-time updates work
- Questions UI functional
- Progress bar accurate

---

## 🚀 **Next Steps**

1. **Start Backend**: Test 1
2. **Test API**: Tests 2-13 (sequential)
3. **Test Frontend**: Tests 14-15
4. **Integration**: Full flow tests
5. **Fix Issues**: As discovered
6. **Re-test**: After each fix
7. **Document**: What works, what doesn't

---

## 📝 **Testing Log**

### **Session 1: 2026-02-04**
**Tester**: 
**Time**: 
**Tests Run**: 
**Tests Passed**: 
**Tests Failed**: 
**Issues Found**: 
**Fixes Applied**: 

---

**Ready to start testing! Let's go step by step.** 🎯
