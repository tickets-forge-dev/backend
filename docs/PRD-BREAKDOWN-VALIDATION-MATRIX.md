# PRD Breakdown Validation Matrix

**Comprehensive test matrix for all flows, error scenarios, and edge cases**

---

## Test Categories

1. **Happy Path Tests** (normal user workflows)
2. **Error Scenario Tests** (validation failures)
3. **Edge Case Tests** (boundary conditions)
4. **Integration Tests** (cross-component flows)
5. **Performance Tests** (scale and load)

---

## Happy Path Tests

### Test Group: PRD Analysis

| Test ID | Scenario | Steps | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| HP-001 | Analyze valid PRD (150 chars) | 1. Enter PRD text (150 chars)<br>2. Click "Analyze" | Progress message → Breakdown shown | ✅ Ready |
| HP-002 | Analyze large PRD (50,000 chars) | 1. Enter max-size PRD<br>2. Click "Analyze" | Completes within 60s | ✅ Ready |
| HP-003 | Show analysis time | 1. Complete analysis<br>2. Check timestamp display | "Analyzed in: 23.4 seconds" | ✅ Ready |
| HP-004 | Show estimated ticket count | 1. Complete analysis<br>2. Check counter display | "Estimated 12 tickets" | ✅ Ready |
| HP-005 | Display epic structure | 1. Complete analysis<br>2. Check epic grouping | All epics shown with stories | ✅ Ready |
| HP-006 | Display BDD criteria | 1. Complete analysis<br>2. Check AC section | Given/When/Then displayed | ✅ Ready |
| HP-007 | Display FR coverage | 1. Complete analysis<br>2. Check FR mapping | "FR1 → [story1, story2]" | ✅ Ready |
| HP-008 | Project name optional | 1. Leave project name empty<br>2. Analyze PRD | Analysis still succeeds | ✅ Ready |

---

### Test Group: Edit & Selection

| Test ID | Scenario | Steps | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| HP-009 | Edit ticket title | 1. Click edit on ticket<br>2. Change title<br>3. Save | Title updated in list | ✅ Ready |
| HP-010 | Edit ticket description | 1. Click edit<br>2. Modify description<br>3. Save | Description updated | ✅ Ready |
| HP-011 | Edit priority | 1. Click edit<br>2. Change priority dropdown<br>3. Save | Priority badge updates | ✅ Ready |
| HP-012 | Edit type | 1. Click edit<br>2. Change type (feature→bug)<br>3. Save | Type icon changes | ✅ Ready |
| HP-013 | Edit BDD criteria | 1. Click edit criteria<br>2. Modify given/when/then<br>3. Save | Criteria updated | ✅ Ready |
| HP-014 | Add BDD criterion | 1. Click add criterion<br>2. Fill given/when/then<br>3. Save | New criterion appears | ✅ Ready |
| HP-015 | Delete BDD criterion | 1. Click delete on criterion<br>2. Confirm | Criterion removed | ✅ Ready |
| HP-016 | Delete entire ticket | 1. Click delete ticket<br>2. Confirm | Ticket removed from epic | ✅ Ready |
| HP-017 | Toggle single ticket | 1. Click checkbox on ticket | Checkbox state toggles | ✅ Ready |
| HP-018 | Select all tickets | 1. Click "Select All"<br>2. Check all tickets | All checkboxes checked | ✅ Ready |
| HP-019 | Deselect all tickets | 1. Click "Deselect All"<br>2. Check all tickets | All checkboxes unchecked | ✅ Ready |
| HP-020 | Reorder ticket within epic | 1. Drag ticket up/down<br>2. Drop at new position | Ticket moves in epic | ✅ Ready |

---

### Test Group: Auto-save Draft

| Test ID | Scenario | Steps | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| HP-021 | Auto-save on title edit | 1. Edit ticket title<br>2. Wait 2s | "Last saved at X:XX" appears | ✅ Ready |
| HP-022 | Auto-save on priority change | 1. Change priority<br>2. Wait 2s | Draft saved (timestamp updates) | ✅ Ready |
| HP-023 | Debounce auto-save | 1. Edit title, priority, AC in sequence<br>2. Wait 2s | Save triggered once (not 3x) | ✅ Ready |
| HP-024 | Draft persists in localStorage | 1. Make edits<br>2. Check browser storage | `prd-breakdown-<draftId>` in localStorage | ✅ Ready |
| HP-025 | Selection persists in draft | 1. Select 2 tickets<br>2. Refresh page | Selected state restored | ✅ Ready |

---

### Test Group: Bulk Creation

| Test ID | Scenario | Steps | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| HP-026 | Create 1 ticket | 1. Select 1 ticket<br>2. Click "Enrich & Create" | Ticket created, ID returned | ✅ Ready |
| HP-027 | Create 5 tickets | 1. Select 5 tickets<br>2. Click "Enrich & Create" | All 5 created, IDs in results | ✅ Ready |
| HP-028 | Create 100 tickets (max) | 1. Select 100 tickets<br>2. Click "Enrich & Create" | All 100 created in 30s | ✅ Ready |
| HP-029 | Create tickets as drafts | 1. Create tickets<br>2. Navigate to /tickets | Tickets have no tech spec | ✅ Ready |
| HP-030 | Preserve originalIndex | 1. Create 5 tickets<br>2. Check response indices | indices: 0,1,2,3,4 (ordered) | ✅ Ready |

---

### Test Group: Bulk Enrichment

| Test ID | Scenario | Steps | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| HP-031 | Enrich single ticket | 1. Click "Enrich & Create"<br>2. Complete Stage 1 | Questions generated for 1 ticket | ✅ Ready |
| HP-032 | Enrich 5 tickets | 1. Create 5 tickets<br>2. Wait for enrichment | All 5 get questions generated | ✅ Ready |
| HP-033 | Show progress per ticket | 1. Start enrichment<br>2. Watch progress | "Ticket 1/5 analyzing..." | ✅ Ready |
| HP-034 | Generate max 5 questions | 1. Enrich ticket<br>2. Check question count | ≤ 5 questions per ticket | ✅ Ready |
| HP-035 | Questions include different types | 1. Answer questions<br>2. Check input types | Mix of text, textarea, select | ✅ Ready |
| HP-036 | Answer text question | 1. Type answer to text question<br>2. See validation | Max 5000 chars enforced | ✅ Ready |
| HP-037 | Answer textarea question | 1. Type multiline answer<br>2. See validation | Multiline supported | ✅ Ready |

---

### Test Group: Finalization

| Test ID | Scenario | Steps | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| HP-038 | Finalize single ticket | 1. Answer questions<br>2. Click "Finalize" | Spec generated, tech spec created | ✅ Ready |
| HP-039 | Finalize 5 tickets | 1. Answer all questions<br>2. Click "Finalize" | All 5 specs generated | ✅ Ready |
| HP-040 | Show finalization progress | 1. Click "Finalize"<br>2. Watch progress | "Ticket 1/5 generating spec..." | ✅ Ready |

---

### Test Group: Success & Navigation

| Test ID | Scenario | Steps | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| HP-041 | Show success view | 1. Complete all steps<br>2. See success screen | "2 tickets created and enriched" | ✅ Ready |
| HP-042 | List created ticket links | 1. Success screen shows<br>2. Count links | Links for each ticket present | ✅ Ready |
| HP-043 | Navigate to ticket | 1. Click ticket link<br>2. Check page | Navigates to /tickets/[id] | ✅ Ready |
| HP-044 | View all tickets button | 1. Click "View All Tickets"<br>2. Check page | Navigates to /tickets | ✅ Ready |

---

### Test Group: Draft Resumption

| Test ID | Scenario | Steps | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| HP-045 | Show resume banner | 1. Save draft<br>2. Close & reopen page<br>3. Check page | "Resume Draft" banner visible | ✅ Ready |
| HP-046 | Resume draft | 1. Click "Resume Draft"<br>2. Check state | PRD text, breakdown, selection restored | ✅ Ready |
| HP-047 | Dismiss draft | 1. Click "Dismiss"<br>2. Check page | Banner gone, input form ready | ✅ Ready |
| HP-048 | Draft expires after 24h | 1. Save draft<br>2. Manually set createdAt to 25h ago<br>3. Reopen | Banner not shown | ✅ Ready |

---

## Error Scenario Tests

### Test Group: Input Validation

| Test ID | Scenario | Steps | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| ES-001 | Empty PRD text | 1. Leave PRD empty<br>2. Click "Analyze" | "PRD text is required" error | ✅ Ready |
| ES-002 | PRD < 100 chars | 1. Enter 50-char PRD<br>2. Click "Analyze" | "PRD text is too short (50 chars). Minimum 100 required." | ✅ Ready |
| ES-003 | PRD > 50,000 chars | 1. Enter 50,001-char PRD<br>2. Click "Analyze" | "PRD text is too long (50001 chars). Maximum 50000 allowed." | ✅ Ready |
| ES-004 | Whitespace-only PRD | 1. Enter "   \n   "<br>2. Click "Analyze" | "PRD text is required" error | ✅ Ready |

---

### Test Group: Batch Validation

| Test ID | Scenario | Steps | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| ES-005 | No tickets selected | 1. Deselect all<br>2. Click "Enrich & Create" | "Please select at least one ticket" error | ✅ Ready |
| ES-006 | Batch > 100 tickets | 1. Try to bulk-create 101 tickets<br>2. Send request | 400 "Bulk creation limit is 100 tickets" | ✅ Ready |
| ES-007 | Empty batch | 1. Send POST with empty tickets array | 400 "No tickets provided" | ✅ Ready |

---

### Test Group: BDD Criteria Validation

| Test ID | Scenario | Steps | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| ES-008 | Missing "given" field | 1. Create ticket with AC: `[{"when":"X","then":"Y"}]`<br>2. Bulk create | 400 "Invalid BDD criteria... missing required fields" | ✅ Ready |
| ES-009 | Missing "when" field | 1. Create ticket with AC: `[{"given":"X","then":"Y"}]`<br>2. Bulk create | 400 "Invalid BDD criteria... missing required fields" | ✅ Ready |
| ES-010 | Missing "then" field | 1. Create ticket with AC: `[{"given":"X","when":"Y"}]`<br>2. Bulk create | 400 "Invalid BDD criteria... missing required fields" | ✅ Ready |
| ES-011 | Empty "given" string | 1. Create AC: `[{"given":"  ","when":"X","then":"Y"}]`<br>2. Bulk create | 400 "Invalid BDD criteria" | ✅ Ready |
| ES-012 | Invalid JSON in AC | 1. Create AC: `not valid json`<br>2. Bulk create | 400 "Failed to parse acceptance criteria" | ✅ Ready |
| ES-013 | AC is not array | 1. Create AC: `{"given":"X","when":"Y","then":"Z"}`<br>2. Bulk create | 400 "Invalid acceptance criteria format... must be an array" | ✅ Ready |

---

### Test Group: Workspace Authorization

| Test ID | Scenario | Steps | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| ES-014 | User not workspace owner | 1. Try bulk-create in workspace with different owner<br>2. Send request | 403 "User does not have permission" | ✅ Ready |
| ES-015 | Invalid workspace ID | 1. Bulk-create with fake workspaceId<br>2. Send request | 400 "Workspace not found" | ✅ Ready |

---

### Test Group: Network & Timeout

| Test ID | Scenario | Steps | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| ES-016 | Network disconnected during analysis | 1. Start PRD analysis<br>2. Disable internet<br>3. Wait for response | Network error: "Failed to connect" | ✅ Ready |
| ES-017 | Timeout during PRD analysis | 1. Start PRD analysis<br>2. Wait 120+ seconds<br>3. Check response | "PRD analysis timeout: No response for 120 seconds" | ✅ Ready |
| ES-018 | Timeout during enrichment | 1. Start enrichment<br>2. Wait 120+ seconds | Enrichment timeout, partial results | ✅ Ready |
| ES-019 | Slow chunks received | 1. Receive SSE chunks slowly<br>2. Verify timeout resets | Timeout reset on each chunk, succeeds | ✅ Ready |

---

### Test Group: Partial Batch Failures

| Test ID | Scenario | Steps | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| ES-020 | 1 of 5 tickets fails | 1. Create 5 tickets, 1 with bad BDD<br>2. Check response | 4 tickets created, 1 error, originalIndex preserved | ✅ Ready |
| ES-021 | All tickets fail | 1. Create 5 tickets, all with bad BDD<br>2. Check response | All 5 show error, originalIndex preserved | ✅ Ready |
| ES-022 | 1 of 5 enrichments fails | 1. Enrich 5 tickets, 1 fails<br>2. Check response | 4 succeed, 1 error event sent | ✅ Ready |

---

## Edge Case Tests

### Test Group: Boundary Values

| Test ID | Scenario | Steps | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| EC-001 | PRD exactly 100 chars | 1. Enter 100-char PRD<br>2. Click "Analyze" | Analysis succeeds | ✅ Ready |
| EC-002 | PRD exactly 50,000 chars | 1. Enter 50,000-char PRD<br>2. Click "Analyze" | Analysis succeeds | ✅ Ready |
| EC-003 | 1 ticket (min batch) | 1. Select 1 ticket<br>2. Click "Enrich & Create" | Single ticket created | ✅ Ready |
| EC-004 | 100 tickets (max batch) | 1. Select all 100<br>2. Click "Enrich & Create" | All 100 created | ✅ Ready |
| EC-005 | 0 questions generated | 1. Enrich ticket<br>2. Check questions | Show "No questions" message (if LLM returns empty) | ✅ Ready |
| EC-006 | 5 questions generated (max) | 1. Enrich ticket<br>2. Check questions | All 5 shown, no truncation | ✅ Ready |

---

### Test Group: Unicode & Special Characters

| Test ID | Scenario | Steps | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| EC-007 | PRD with emoji | 1. Enter "📱 Mobile app 🎉" in PRD<br>2. Analyze | Analysis succeeds, emoji preserved | ✅ Ready |
| EC-008 | Ticket title with emoji | 1. Edit title to "✅ Task"<br>2. Save | Title preserved with emoji | ✅ Ready |
| EC-009 | Answer with unicode (CJK) | 1. Answer in Chinese/Japanese<br>2. Finalize | Spec generated correctly | ✅ Ready |
| EC-010 | Answer with special chars | 1. Answer: "Price: $100 (50% off)"<br>2. Finalize | Spec preserves special chars | ✅ Ready |
| EC-011 | Answer with markdown | 1. Answer: "# Heading\n- Bullet"<br>2. Finalize | Markdown preserved in spec | ✅ Ready |

---

### Test Group: Data Integrity

| Test ID | Scenario | Steps | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| EC-012 | Preserve ticket order | 1. Create 5 tickets<br>2. Check response indices | indices: [0,1,2,3,4] in order | ✅ Ready |
| EC-013 | Preserve epic structure | 1. Analyze PRD<br>2. Edit ticket<br>3. Check epic | Epic structure unchanged | ✅ Ready |
| EC-014 | Long description (1000 chars) | 1. Edit description to 1000 chars<br>2. Save | Full description preserved | ✅ Ready |
| EC-015 | Many acceptance criteria (20) | 1. Add 20 criteria<br>2. Save | All 20 preserved | ✅ Ready |

---

### Test Group: Concurrent Operations

| Test ID | Scenario | Steps | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| EC-016 | Multiple tabs open (same draft) | 1. Open breakdown in 2 tabs<br>2. Edit in tab 1<br>3. Check tab 2 | Tab 2 doesn't auto-update (separate instance) | ✅ Ready |
| EC-017 | Rapid edits (100 changes in 2s) | 1. Spam-click edits<br>2. Wait for auto-save | Debounce limits to 1 save | ✅ Ready |
| EC-018 | Navigate away during analysis | 1. Start analysis<br>2. Navigate to /tickets<br>3. Return | Analysis cancels, can restart | ✅ Ready |

---

## Integration Tests

### Test Group: Complete Workflows

| Test ID | Scenario | Steps | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| IT-001 | Full flow: Analyze → Create → Enrich → Finalize | 1. Paste PRD<br>2. Analyze<br>3. Select 2 tickets<br>4. Enrich & Create<br>5. Answer questions<br>6. Finalize | End result: 2 tickets with specs created | ✅ Ready |
| IT-002 | Abandon and restart | 1. Start analysis<br>2. Click back<br>3. Paste different PRD<br>4. Analyze new PRD | New breakdown shown, old draft lost | ✅ Ready |
| IT-003 | Edit heavily, then create | 1. Analyze PRD<br>2. Edit 5 tickets (titles, AC, priority)<br>3. Create | All edits preserved in created tickets | ✅ Ready |
| IT-004 | Resume and continue | 1. Analyze, auto-save<br>2. Close page<br>3. Reopen, click "Resume"<br>4. Continue to create | Full state restored, creation succeeds | ✅ Ready |
| IT-005 | Create, then navigate to ticket | 1. Complete full flow<br>2. Click ticket link<br>3. View ticket detail | Ticket shows with created metadata | ✅ Ready |

---

## Performance Tests

### Test Group: Load Testing

| Test ID | Scenario | Steps | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| PT-001 | Analyze 10,000 char PRD | 1. Paste 10KB PRD<br>2. Analyze | Completes in 20-30s | ✅ Ready |
| PT-002 | Analyze 50,000 char PRD | 1. Paste 50KB PRD<br>2. Analyze | Completes in 40-60s | ✅ Ready |
| PT-003 | Create 100 tickets | 1. Create 100 tickets<br>2. Time request | Completes in 20-30s | ✅ Ready |
| PT-004 | Enrich 10 tickets | 1. Enrich 10 tickets<br>2. Time request | Completes in 60-90s | ✅ Ready |
| PT-005 | Enrich 50 tickets | 1. Split into 5 batches of 10<br>2. Enrich each<br>3. Total time | Total ~300-450s (5x single batch) | ✅ Ready |

---

### Test Group: Storage

| Test ID | Scenario | Steps | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| PT-006 | localStorage usage | 1. Save 10 drafts<br>2. Check storage | < 5MB used | ✅ Ready |
| PT-007 | Large breakdown storage | 1. Save breakdown with 100 tickets<br>2. Measure size | Single draft ~ 100-500KB | ✅ Ready |

---

## Regression Test Checklist

Before each release, verify:

- [ ] **No repository requirements in UI** (removed in v1.1)
  - [ ] No "Repository" field shown in PRDInputForm
  - [ ] Repository fields are optional in backend DTOs
  - [ ] Analysis works without repository info

- [ ] **BDD Criteria Validation** (CRITICAL FIX #1)
  - [ ] Empty given/when/then rejected
  - [ ] Invalid JSON rejected
  - [ ] All required fields validated

- [ ] **Workspace Isolation** (CRITICAL FIX #3)
  - [ ] ForbiddenException thrown for unauthorized users
  - [ ] userId verified against workspace.ownerId

- [ ] **originalIndex Mapping** (CRITICAL FIX #2)
  - [ ] Index preserved when tickets fail
  - [ ] Response maintains original order

- [ ] **SSE Timeout Handling** (CRITICAL FIX #4)
  - [ ] Timeout resets on each chunk
  - [ ] 120-second timeout enforced
  - [ ] No stream hangs

- [ ] **Draft Auto-save**
  - [ ] localStorage updated on changes
  - [ ] Debounce limits saves to 1 every 2s
  - [ ] Timestamp displayed correctly

- [ ] **Selection Persistence**
  - [ ] isSelected state saved in draft
  - [ ] Selection restored on resume
  - [ ] Select All/Deselect All works

---

## Manual Testing Sign-Off

### QA Lead Checklist

- [ ] All happy path tests pass (HP-001 to HP-048)
- [ ] All error scenarios handled (ES-001 to ES-022)
- [ ] All edge cases covered (EC-001 to EC-018)
- [ ] All integration tests pass (IT-001 to IT-005)
- [ ] Performance targets met (PT-001 to PT-007)
- [ ] Regression tests pass (all items checked)
- [ ] No console errors or warnings
- [ ] No unhandled promise rejections
- [ ] UI is responsive and intuitive
- [ ] Error messages are clear and actionable

### Developer Checklist

- [ ] Code review complete
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] No TypeScript errors
- [ ] Build succeeds without warnings
- [ ] No hardcoded test data in prod code
- [ ] No debug console.log statements
- [ ] All error handling implemented
- [ ] Accessibility checked (keyboard nav, screen reader)
- [ ] Dark mode tested (if applicable)

### Product Owner Checklist

- [ ] Feature matches requirements
- [ ] UX flows are intuitive
- [ ] Error messages are helpful
- [ ] Performance is acceptable
- [ ] No blocking issues
- [ ] Ready for production release

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Lead | _____ | _____ | _____ |
| Developer | _____ | _____ | _____ |
| Product Owner | _____ | _____ | _____ |

