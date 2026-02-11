# PRD Breakdown Feature - Steps to Reproduce

**Status:** Production Ready (Session 15, 2026-02-10)
**Focus:** Actionable steps FIRST, explanation second

---

## 🎯 QUICK START: 3-Minute Demo

### **Prerequisites**
- ✅ Logged in to Forge (Firebase auth)
- ✅ You have a PRD text (can be 100+ characters)
- ✅ Backend is running (or forge-ai.dev in production)

### **Step 1: Navigate to PRD Breakdown**
```
1. Go to http://localhost:3000/tickets/breakdown
   (or https://forge-ai.dev/tickets/breakdown in production)
2. You see: "Paste your PRD" form with inputs for:
   - PRD text area
   - Repository owner (GitHub username/org)
   - Repository name (repo slug)
   - Project name (optional)
```

### **Step 2: Fill in the Form**
```
1. Copy this sample PRD text:

   "Build a user authentication system that allows:
   - Email signup with password strength validation
   - Email verification via magic links
   - Login with email/password
   - Persistent session management
   - Logout functionality
   - Password reset via email

   Must integrate with GitHub OAuth for optional social login.
   Should work on web and mobile."

2. Paste into "PRD Text" field

3. Enter repository info:
   - Repository Owner: [your-github-username]
   - Repository Name: [your-repo-name]
   - Project Name: (optional - leave blank or type a name)

4. Click "Analyze PRD" button
```

### **Step 3: Wait for Analysis (~5-10 seconds)**
```
You should see:
- Loading spinner with "Analyzing PRD..."
- Progress indication (if available)
- Eventually → Screen changes to "Review & Edit Breakdown"
```

### **Step 4: Review the Breakdown**
```
You now see:
┌─────────────────────────────────┐
│ TICKETS: 12                     │
│ EPICS: 3                        │
│ ANALYSIS TIME: 00:00:XX         │
└─────────────────────────────────┘

Below: 3 Epic groups, each with:
- Epic name (e.g., "User Authentication")
- Epic goal description
- Functional Requirements tags (FR1, FR2, etc.)
- List of stories/tickets (collapsible)
```

### **Step 5a: View a Ticket (Read-Only)**
```
1. Click an epic name to expand (if collapsed)
2. See list of tickets underneath
3. Click a ticket card to see details:
   - Title
   - Description
   - Type badge (feature/bug/task)
   - Priority badge (low/medium/high/urgent)
   - BDD Acceptance Criteria (Given/When/Then)
```

### **Step 5b: Edit a Ticket (Modify)**
```
1. Click "Edit" button on a ticket card
2. Card switches to edit mode - fields become editable:
   - Title (text input)
   - Type (dropdown)
   - Priority (dropdown)
   - Description (shown above, not editable in this modal)
3. Make changes
4. Click "Save" to save OR "Cancel" to discard
5. Card returns to read-only mode
```

### **Step 5c: Delete a Ticket**
```
1. Click "Delete" (trash icon) on a ticket card
2. Ticket immediately removed from epic
3. Epic story count updates
4. Total ticket count updates at top
```

### **Step 5d: Reorder Tickets (Drag & Drop)**
```
1. Click and hold on a ticket card
2. Drag it up/down within the same epic
3. Visual feedback:
   - Cursor changes to grab cursor
   - Drop zone highlights in blue
4. Release mouse to drop
5. Ticket reorders immediately (store updates)
```

### **Step 5e: Add a New Ticket**
```
1. Click "+ Add Ticket" button in epic header
2. Modal opens with form:
   - Title (required, text input)
   - Description (text area)
   - Type (dropdown: feature/bug/task)
   - Priority (dropdown: low/medium/high/urgent)
   - BDD Criteria section:
     * Given, When, Then fields
     * "+ Add Another" button to add more criteria
     * "- Remove" button to delete criteria
3. Fill in fields
4. Click "Add Ticket" button
5. Modal closes, new ticket appears in epic
```

### **Step 6: Create All Tickets**
```
1. Review all changes are correct
2. Click "Enrich & Create {N} Tickets" button
   (N = total ticket count)
3. Wait for processing (~2-3 seconds per ticket = 24-36 seconds total)
4. You see loading spinner: "Enriching {N} tickets..."
5. On success → "Success" screen appears showing:
   - Checkmark icon
   - "Successfully created {N} tickets!"
   - List of ticket IDs
   - "View Tickets" button
```

### **Step 7: Verify Tickets Were Created**
```
1. Click "View Tickets" on success screen
2. Or navigate to: http://localhost:3000/tickets
3. You should see all created tickets:
   - Status: "draft" (no tech spec yet)
   - Title from breakdown
   - Epic name in description
   - Acceptance criteria populated
```

---

## ✅ Expected Outcomes by Step

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/tickets/breakdown` | Form loads, ready for PRD input |
| 2 | Fill form & click "Analyze PRD" | Form submits, API call made |
| 3 | Wait for analysis | Screen transitions to "Review & Edit" |
| 4 | Page loads breakdown | 3 cards at top (tickets, epics, analysis time), epic groups below |
| 5a | View ticket | Card shows: title, description, type/priority badges, BDD criteria |
| 5b | Edit & save ticket | Title/type/priority update in card, card returns to read-only |
| 5c | Delete ticket | Ticket disappears, counts update |
| 5d | Drag & drop ticket | Ticket reorders within epic, visual feedback during drag |
| 5e | Add ticket | Modal opens, fills form, ticket appears in epic |
| 6 | Click "Enrich & Create" | API call, loading spinner, success screen |
| 7 | View in tickets list | All tickets appear as draft tickets |

---

## 🧪 Test Cases (Detailed)

### **Test Case 1: Happy Path (Full End-to-End)**
```
PRE:  Logged in, at /tickets/breakdown
STEP: Fill form with valid PRD + repo info
STEP: Click "Analyze PRD"
STEP: Wait for analysis
STEP: Review breakdown (no edits)
STEP: Click "Enrich & Create 12 Tickets"
STEP: Wait for success screen
STEP: Click "View Tickets"
POST: See 12 new draft tickets in /tickets list
PASS: ✅ All tickets created with correct epic names
```

### **Test Case 2: Edit Before Creating**
```
PRE:  At Review screen with breakdown loaded
STEP: Find ticket titled "Email signup with validation"
STEP: Click "Edit"
STEP: Change title to "Email signup with password strength"
STEP: Change priority from "high" to "urgent"
STEP: Click "Save"
STEP: Verify card shows new title and priority
STEP: Click "Enrich & Create 12 Tickets"
POST: Check /tickets, verify edited ticket has new title/priority
PASS: ✅ Changes persisted to database
```

### **Test Case 3: Reorder Before Creating**
```
PRE:  At Review screen with breakdown loaded
STEP: Find "User Authentication" epic, expand it
STEP: Drag 3rd ticket to 1st position
STEP: Verify order changed visually
STEP: Drag 2nd ticket to 3rd position
STEP: Verify final order is: [original 3rd], [original 1st], [original 2nd]
STEP: Click "Enrich & Create 12 Tickets"
POST: Check /tickets, verify story indices match new order
PASS: ✅ Reordering persisted to database
```

### **Test Case 4: Add New Ticket**
```
PRE:  At Review screen, 12 tickets, epic count = 3
STEP: Click "+ Add Ticket" in first epic
STEP: Modal opens
STEP: Fill title: "Password strength validation"
STEP: Select type: "feature"
STEP: Select priority: "high"
STEP: Fill Given: "User enters password"
STEP: Fill When: "Password is less than 8 chars"
STEP: Fill Then: "Show error message"
STEP: Click "Add Ticket"
STEP: Modal closes
STEP: Verify new ticket appears in first epic
STEP: Verify total ticket count: 13 (was 12)
STEP: Click "Enrich & Create 13 Tickets"
POST: Check /tickets, verify new ticket exists with BDD criteria
PASS: ✅ New ticket created successfully
```

### **Test Case 5: Delete Ticket**
```
PRE:  At Review screen, 12 tickets
STEP: Find any ticket
STEP: Click "Delete" (trash icon)
STEP: Verify ticket disappears immediately
STEP: Verify total ticket count: 11 (was 12)
STEP: Click "Enrich & Create 11 Tickets"
POST: Check /tickets, verify deleted ticket does NOT exist
PASS: ✅ Deletion persisted to database
```

### **Test Case 6: Invalid Input - Empty PRD**
```
PRE:  At /tickets/breakdown
STEP: Leave PRD text empty
STEP: Fill repo info
STEP: Click "Analyze PRD"
POST: Error message appears: "PRD must be at least 100 characters"
PASS: ✅ Validation works
```

### **Test Case 7: Invalid Input - Empty Repo**
```
PRE:  At /tickets/breakdown
STEP: Fill PRD text
STEP: Leave repository owner/name empty
STEP: Click "Analyze PRD"
POST: Error message appears: "Repository owner and name required"
PASS: ✅ Validation works
```

### **Test Case 8: Network Error During Analysis**
```
PRE:  At /tickets/breakdown
STEP: Fill form with valid data
STEP: (Simulate network error: offline mode OR backend down)
STEP: Click "Analyze PRD"
STEP: Wait 10 seconds
POST: Error message shows: "Failed to analyze PRD"
PASS: ✅ Error handling works
```

### **Test Case 9: Partial Failure During Bulk Create**
```
PRE:  At Review screen, 12 tickets
STEP: Manually corrupt 1 ticket's BDD criteria (if possible) OR
      Skip this if validation prevents it
STEP: Click "Enrich & Create 12 Tickets"
POST: Success screen shows:
      "Successfully created 11 of 12 tickets"
      "1 ticket failed: [error message]"
PASS: ✅ Partial failure handling works
```

### **Test Case 10: Large PRD (Stress Test)**
```
PRE:  At /tickets/breakdown
STEP: Create large PRD text (5,000+ characters)
STEP: Fill repo info
STEP: Click "Analyze PRD"
STEP: Wait (may take 15-30 seconds)
STEP: At Review screen, verify 50+ tickets generated
STEP: Scroll through, verify all load correctly
STEP: Click "Enrich & Create {N} Tickets" (may take 2+ minutes)
POST: Success screen, all tickets created
PASS: ✅ Handles large PRDs without crashing
```

---

## 📋 Checklist: Did You See It Work?

- [ ] Step 1: PRD form loads at `/tickets/breakdown`
- [ ] Step 2: Form accepts PRD text and repo info
- [ ] Step 3: "Analyze PRD" button triggers API call and transitions to review
- [ ] Step 4: Review page shows breakdown with epics and tickets
- [ ] Step 5a: Can view ticket details (read-only)
- [ ] Step 5b: Can edit ticket (title, type, priority)
- [ ] Step 5c: Can delete ticket
- [ ] Step 5d: Can drag & drop to reorder
- [ ] Step 5e: Can add new ticket via modal
- [ ] Step 6: "Enrich & Create" button works, shows loading, then success
- [ ] Step 7: New tickets appear in `/tickets` list as drafts
- [ ] Test Case 1: Happy path works end-to-end
- [ ] Test Case 2: Edits persist to database
- [ ] Test Case 3: Reordering persists to database
- [ ] Test Case 4: New tickets persist to database
- [ ] Test Case 5: Deletions persist to database
- [ ] Test Case 6-7: Input validation works
- [ ] Test Case 8: Error handling works
- [ ] Test Case 9: Partial failure handling works (if applicable)
- [ ] Test Case 10: Large PRDs don't crash

---

## 🐛 Debugging: If Something Doesn't Work

### **Problem: "Analyze PRD" button does nothing**
```
1. Open browser console (F12 → Console tab)
2. Look for red errors
3. Check Network tab → "breakdown/prd" request
4. If 401: Firebase token expired, refresh page
5. If 500: Backend error, check backend logs
6. If timeout: Backend down, restart docker
```

### **Problem: Analysis hangs (spinner for >30 seconds)**
```
1. Check browser console for errors
2. Check Network tab: is request still pending?
3. Check backend logs: is LLM taking too long?
4. Try with shorter PRD (< 1000 chars) to test
5. Try with Ollama vs Anthropic (env var: LLM_PROVIDER)
```

### **Problem: Reordering doesn't work (drag doesn't respond)**
```
1. Make sure you're dragging a ticket WITHIN the same epic
2. Drag from ticket card, not from buttons
3. Check browser console for JS errors
4. Try with different browser (Chrome vs Firefox)
5. Check that JavaScript is enabled
```

### **Problem: "Enrich & Create" fails**
```
1. Check Network tab → "breakdown/bulk-create" request
2. If 400: Bad request, check error message in response
3. If 401: Firebase token expired, refresh and retry
4. If 403: Workspace issue, check workspace ID
5. If 500: Backend error, check backend logs
6. Try with fewer tickets (delete some) and retry
```

### **Problem: Created tickets don't appear in list**
```
1. Refresh /tickets page (F5)
2. Check that tickets have status "draft"
3. Check that tickets have correct workspace ID
4. Check browser console for Firestore errors
5. Check Firebase console: are tickets in database?
```

---

## 🏗️ What's Happening (Architecture Overview)

### **Phase 1: Input**
- **Where:** Frontend: `/tickets/breakdown/page.tsx`
- **What:** User pastes PRD + repo info, clicks "Analyze"
- **Data:** Store updates with `setPRDText()`, `setRepository()`

### **Phase 2: Analyze (LLM Processing)**
- **Where:** Backend: `POST /tickets/breakdown/prd`
- **What:** `PRDBreakdownService` breaks down PRD using Claude LLM
- **Process:**
  1. Extract Functional Requirements (FRs) from PRD
  2. Group FRs into epics (by user value, not technical layers)
  3. Break each epic into vertically-sliced stories
  4. Generate BDD acceptance criteria for each story
  5. Map dependencies and validate FR coverage
- **Output:** JSON with epics, stories, BDD criteria, FR mappings

### **Phase 3: Review & Edit**
- **Where:** Frontend: `BreakdownReview.tsx`
- **What:** User sees breakdown, can edit/reorder/add/delete
- **State:** Zustand store `prd-breakdown.store`
- **Actions:** `updateTicket()`, `deleteTicket()`, `reorderTickets()`, `addTicket()`
- **Storage:** All in-memory (state) until user clicks "Create"

### **Phase 4: Create Tickets**
- **Where:** Backend: `POST /tickets/breakdown/bulk-create`
- **What:** `BulkCreateFromBreakdownUseCase` creates draft AEC tickets
- **Process:**
  1. Validate all tickets (100 max, BDD criteria format)
  2. For each ticket:
     - Create draft AEC in Firestore
     - Parse and set acceptance criteria
     - Set epic name in description
  3. Return success/error list
- **Output:** List of ticket IDs, error list (if partial failure)

### **Phase 5: Success**
- **Where:** Frontend: `SuccessView.tsx`
- **What:** Show confirmation with ticket IDs
- **Next:** User clicks "View Tickets" → `/tickets` list page

---

## 🔌 API Reference

### **Endpoint 1: Analyze PRD**
```
POST /tickets/breakdown/prd
Content-Type: application/json
Authorization: Bearer {firebaseToken}

Request:
{
  "prdText": "Build a user auth system...",
  "repositoryOwner": "username",
  "repositoryName": "repo-name",
  "projectName": "Project Name" (optional)
}

Response:
{
  "breakdown": {
    "tickets": [...],
    "summary": {
      "totalTickets": 12,
      "epicCount": 3,
      "epics": [...],
      "frCoverage": {...}
    }
  },
  "analysisTime": 5432,
  "estimatedTicketsCount": 12
}
```

### **Endpoint 2: Create Tickets**
```
POST /tickets/breakdown/bulk-create
Content-Type: application/json
Authorization: Bearer {firebaseToken}

Request:
{
  "tickets": [
    {
      "epicName": "User Authentication",
      "title": "Email signup with validation",
      "description": "As a new user...",
      "type": "feature",
      "priority": "high",
      "acceptanceCriteria": "[{\"given\":\"...\",\"when\":\"...\",\"then\":\"...\"}]"
    },
    ...
  ]
}

Response:
{
  "createdCount": 12,
  "ticketIds": ["uuid1", "uuid2", ...],
  "errors": []
}
```

---

## ⏱️ Performance Expectations

| Operation | Duration | Notes |
|-----------|----------|-------|
| Analyze PRD (500 chars) | 3-5 seconds | LLM processing |
| Analyze PRD (2000 chars) | 5-10 seconds | More FRs to extract |
| Analyze PRD (5000+ chars) | 15-30 seconds | Large breakdown, possible timeout |
| Create 12 tickets | 24-36 seconds | 2-3 seconds per ticket |
| Create 50 tickets | 100-150 seconds | 2-3 seconds per ticket |
| Drag & drop reorder | <100ms | Instant visual feedback |
| Edit ticket | <100ms | Instant save |
| Delete ticket | <100ms | Instant removal |

---

## 🚨 Known Limitations

1. **No Steps to Implement** - Generated breakdown doesn't include technical implementation steps (yet)
2. **Single Epic Group Only** - Can't reorder epics, only tickets within epics
3. **No Attachment Upload** - Can't attach files during breakdown review
4. **No Collaborative Editing** - Single user at a time (no real-time sync)
5. **Lossy BDD Import** - If editing BDD criteria in text, structure might not preserve
6. **Max 100 Tickets** - Bulk create limited to 100 at a time
7. **No Undo** - Deletions are permanent (before clicking Create)
8. **No Progress Stream** - Bulk create doesn't show per-ticket progress

---

## 📚 Related Documentation

- **Architecture & Flow:** `/docs/PRD-BREAKDOWN-FLOW.md`
- **Gap Analysis:** `/docs/PRD-BREAKDOWN-GAPS.md`
- **P1 Critical Fixes:** `/docs/PRD-BREAKDOWN-P1-FIXES-IMPLEMENTED.md`
- **Verification Checklist:** `/docs/PRD-BREAKDOWN-P1-VERIFICATION-CHECKLIST.md`
- **CURL API Tests:** `/docs/PRD-BREAKDOWN-CURL-TESTS.md`
- **Session 15 Summary:** `/docs/PRD-BREAKDOWN-SESSION-15-SUMMARY.md`

---

## ✅ Now Go Use It!

**You have everything you need to:**
- ✅ Understand the feature by using it (Steps 1-7)
- ✅ Test it thoroughly (10 test cases)
- ✅ Debug if something breaks (debugging section)
- ✅ Know what's happening under the hood (architecture section)

**Questions? Check:**
1. Is it in "Steps to Reproduce"? → Use that
2. Is it in "Expected Outcomes"? → Compare against what you see
3. Is it in "Test Cases"? → Run that test
4. Is it broken? → Check "Debugging" section
5. Want to know why? → Read "What's Happening" section

**Next Steps:**
- [ ] Run Step 1-7 yourself and verify it works
- [ ] Run all 10 test cases
- [ ] If you find a bug, create an issue with reproduction steps
- [ ] If it works, you're ready for production! 🚀
