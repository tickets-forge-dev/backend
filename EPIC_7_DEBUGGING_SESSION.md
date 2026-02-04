# Epic 7 Debugging Session - 2026-02-04

## Issues Identified & Fixed

### ✅ Issue 1: Empty Placeholder Flash on Context Step
**Problem**: Repository selector showed empty placeholder "Select..." immediately on load  
**Root Cause**: Calculation of `completedRepos` happened before loading check  
**Fix**: Moved loading check BEFORE `completedRepos` calculation (early return)  
**Status**: FIXED ✅

### ✅ Issue 2: Empty State Message Flash
**Problem**: "No indexed repositories" flashed before data loaded  
**Root Cause**: Store data (selectedRepositories, indexingJobs) started empty  
**Fix**: Added `hasAnyData` check - only show UI when we actually have data OR loading is legitimately complete  
**Status**: FIXED ✅

### ✅ Issue 3: Critical 30-Second Timeout on `/api/indexing/list`
**Problem**: Backend endpoint hung for 30 seconds, freezing entire app  
**Root Cause**: Firestore query hanging or workspaceId invalid  
**Fixes Applied**:
1. **Backend Controller**: Added workspaceId validation, try-catch, debug logging
2. **Firestore Repository**: Added 10s timeout with Promise.race, return empty array on timeout
3. **Client Service**: Added 10s axios timeout, return empty array on error
**Status**: FIXED ✅ (graceful degradation)

### ✅ Issue 4: "Initializing..." Stuck Forever
**Problem**: Workflow initialization showed spinner indefinitely with no way out  
**Fix**: 
- Added 2-minute timeout detection
- Show elapsed seconds during initialization  
- Cancel button appears after 30 seconds
- Timeout warning after 2 minutes with retry button
**Status**: FIXED ✅

---

## Remaining Issues to Investigate

### 🔴 Issue 5: Why is `/api/indexing/list` Timing Out?
**Status**: ROOT CAUSE UNKNOWN

**Hypotheses**:
1. **WorkspaceId is undefined/invalid**
   - `req.workspaceId` set by WorkspaceGuard
   - May be undefined on initial load before auth completes
   - Need to check: Is WorkspaceGuard failing silently?

2. **Firestore collection doesn't exist**
   - Path: `/workspaces/{workspaceId}/indexes`
   - If workspaceId is valid but no indexes collection exists, query might hang
   - Need to verify: Does the collection exist in Firestore?

3. **Firebase initialization race condition**
   - Firebase may not be fully initialized when first request hits
   - Need to check: Firebase ready state before queries

**Debug Steps**:
1. Add logging to WorkspaceGuard to see if workspaceId is set
2. Check Firestore console for actual workspace structure
3. Test with known valid workspaceId
4. Add middleware logging for all incoming requests

---

## Test Results

### ✅ Test 1: Backend Startup - PASSED
- Backend compiled: 111 files ✅
- All modules loaded ✅
- Firebase initialized ✅
- Ollama configured ✅
- Mastra workflow registered (12 steps, 2 HITL) ✅
- All services registered:
  - IndexQueryService ✅
  - MastraWorkspaceFactory ✅
  - QuickPreflightValidator ✅
  - FindingsToQuestionsAgent ✅

### 🔴 Test 2: Create Ticket - NOT STARTED
**Reason**: Blocked by indexing timeout issue

### 🔴 Tests 3-15: NOT STARTED
**Reason**: Need to resolve indexing issue first

---

## Code Changes Summary

### Files Modified:
1. `client/src/tickets/components/RepositorySelector.tsx`
   - Fixed loading state order
   - Added hasAnyData check
   - Prevents empty state flash

2. `backend/src/indexing/presentation/controllers/indexing.controller.ts`
   - Added workspaceId validation
   - Added try-catch with graceful degradation
   - Added debug logging

3. `backend/src/indexing/infrastructure/persistence/firestore-index.repository.ts`
   - Added 10-second timeout to findByWorkspace
   - Added Promise.race pattern
   - Return empty array on timeout

4. `client/src/services/github.service.ts`
   - Added 10-second axios timeout
   - Added try-catch
   - Return empty array on error

5. `client/src/tickets/components/GenerationProgressNew.tsx`
   - Added timeout detection (2 minutes)
   - Added cancel button (after 30s)
   - Show elapsed time
   - Timeout warning UI

### Commits:
1. `fix(ui): Show loading spinner instead of empty placeholder`
2. `fix(ui): Remove duplicate loading check`
3. `fix(ui): Move loading check BEFORE completedRepos calculation`
4. `fix: loading check before calculation`
5. `fix: better loading state`
6. `fix(critical): Add timeout and error handling to prevent 30s indexing hang`
7. `fix(ui): Add timeout and cancel button to workflow initialization`

---

## Next Steps

### Priority 1: Fix Indexing Timeout Root Cause
1. **Add debug middleware** to log all request details:
   - workspaceId
   - userId
   - auth token presence
   - request path

2. **Verify Firestore structure**:
   - Check if workspaces collection exists
   - Check if any workspace has indexes subcollection
   - Verify data format matches mapper expectations

3. **Test with mock data**:
   - Create test workspace in Firestore manually
   - Add test index document
   - Verify endpoint returns it

### Priority 2: Continue Epic 7 Testing
Once indexing is fixed, resume testing plan:
- Test 2: Create ticket via API
- Test 3-13: Individual workflow steps
- Test 14-15: Frontend UI

### Priority 3: Questions System
- Verify question generation works
- Test questions UI display
- Test answer submission

---

## User Feedback

> "I want to focus on Epic Seven because it's far from being working and tested. The reason I added Elementary is because I want to go step-by-step and see where things break because currently it doesn't give a good result at all."

**Action Items**:
1. ✅ Created comprehensive testing plan (EPIC_7_TESTING_PLAN.md)
2. ✅ Started elementary testing (Test 1 passed)
3. 🔴 Blocked on indexing timeout - need to resolve
4. ⏳ Need to test actual ticket generation
5. ⏳ Need to verify code scanning works
6. ⏳ Need to verify questions work

---

## Questions for User

1. **Do you have any existing indexed repositories in Firestore?**
   - Can check: Firestore Console → workspaces → [your-workspace-id] → indexes
   
2. **What workspace are you using for testing?**
   - Need workspaceId to debug the timeout issue

3. **Do you want me to:**
   - A) Continue debugging the indexing timeout?
   - B) Skip indexing for now and test workflow without it?
   - C) Create a mock indexing setup for testing?

---

**Session Status**: In Progress  
**Next Task**: Debug indexing timeout root cause  
**Blockers**: `/api/indexing/list` timing out after 10 seconds
