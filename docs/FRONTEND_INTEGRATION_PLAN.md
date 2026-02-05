# Frontend Integration Plan - Question Refinement Workflow

**Status:** 🟠 In Progress (Architecture fixed, API integration pending)
**Date:** 2026-02-05
**Goal:** Connect backend question refinement system to frontend for production-ready execution

---

## Expected End-to-End Flow

```
User Interaction:
1. User navigates to /tickets/create
2. Fills simple form: "Describe your ticket, what are we doing?"
3. Optionally selects repository + branch
4. Clicks "Generate Ticket" or Alt+Enter
   ↓
5. Redirected to /tickets/{id}
   ↓
6. Ticket detail page loads with:
   - Title, description
   - Generated tech spec (if complete)
   - Question rounds (if in progress)
   ↓
7. IF questions exist (status = IN_QUESTION_ROUND_X):
   - Show current round questions
   - User answers each question
   - Clicks "Submit & Continue" or "Skip to Finalize"
   ↓
8. IF "Continue": Show next round (or finalize if done)
9. IF "Skip" or "Round 3 Done": Show final spec summary
   ↓
10. Ticket complete with quality score
```

---

## UI Components Needed

### 1. Ticket Detail Page Enhancement
**File:** `client/app/(main)/tickets/[id]/page.tsx`

**Changes needed:**
- Import QuestionRoundService from useServices()
- Check if currentTicket.currentRound exists and > 0
- If yes, show QuestionRoundsSection component
- If no, show normal ticket details

**Conditional rendering:**
```tsx
{currentTicket.currentRound && currentTicket.currentRound > 0 ? (
  <QuestionRoundsSection
    questionRounds={currentTicket.questionRounds}
    currentRound={currentTicket.currentRound}
    onSubmitAnswers={handleSubmitRoundAnswers}
    onSkipToFinalize={handleSkipToFinalize}
  />
) : (
  <TicketDetailsSection
    ticket={currentTicket}
    onEdit={handleEdit}
  />
)}
```

### 2. QuestionRoundsSection Component (NEW)
**File:** `client/src/tickets/components/QuestionRoundsSection.tsx`

**Displays:**
- Round progress: "Round 2 of 3"
- Completed rounds (collapsed, with checkmarks)
- Current round (expanded, with input fields)
- Action buttons: "Submit & Continue", "Skip to Finalize"
- Loading overlay during submission

**Sub-components used:**
- QuestionRoundPanel (already created)
- Round progress indicator

### 3. Fix QuestionRoundPanel Component
**File:** `client/src/tickets/components/wizard/QuestionRoundPanel.tsx`

**Issues to fix:**
- ✅ Already removed backend imports
- Need to ensure it properly handles empty answers
- Need to ensure it renders different input types

### 4. Update Ticket Detail Page
**File:** `client/app/(main)/tickets/[id]/page.tsx`

**Add handlers:**
```tsx
// Start a round if ticket has no rounds but is DRAFT
useEffect(() => {
  if (currentTicket && !currentTicket.questionRounds?.length && isReadyForQuestions()) {
    handleStartFirstRound();
  }
}, [currentTicket?.id]);

// Handle submission
async handleSubmitRoundAnswers(roundNumber: number, answers: RoundAnswers) {
  const result = await questionRoundService.submitAnswers(
    ticketId,
    roundNumber,
    answers
  );
  if (result.nextAction === 'continue') {
    // Load next round
    fetchTicket(ticketId);
  } else {
    // Show finalize button
  }
}

// Handle skip
async handleSkipToFinalize() {
  await questionRoundService.skipToFinalize(ticketId);
  fetchTicket(ticketId);
}

// Handle finalize
async handleFinalizeSpec() {
  const allAnswers = currentTicket.questionRounds.map(r => r.answers);
  const result = await questionRoundService.finalizeSpec(ticketId, allAnswers);
  // Update ticket with final spec
  fetchTicket(ticketId);
}
```

---

## API Integration Points

### 1. Start First Question Round
**Endpoint:** `POST /tickets/{id}/start-round`
**Trigger:** When user creates ticket (if questions are needed)
**Response:** Questions for Round 1

```typescript
// In ticket detail page, after fetching ticket
if (currentTicket.status === 'DRAFT' && shouldStartQuestions()) {
  await questionRoundService.startRound(ticketId, 1);
}
```

### 2. Submit Round Answers
**Endpoint:** `POST /tickets/{id}/submit-answers`
**Trigger:** User clicks "Submit & Continue" or "Submit & Finalize"
**Response:** { nextAction: 'continue' | 'finalize' }

### 3. Skip to Finalize
**Endpoint:** `POST /tickets/{id}/skip-to-finalize`
**Trigger:** User clicks "Skip to Finalize" at any round
**Response:** Acknowledgment

### 4. Finalize Spec
**Endpoint:** `POST /tickets/{id}/finalize`
**Trigger:** User at Round 3 completes, or clicked "Skip to Finalize", or next round is empty
**Response:** Final TechSpec with quality score

---

## Implementation Sequence

### Phase 1: Make Build Pass ✅ DONE
- ✅ Remove backend imports from frontend
- ✅ Create frontend-only types
- ✅ Add question-round service

### Phase 2: Wire API Integration (CURRENT)
- 🟠 Create QuestionRoundsSection component
- 🟠 Fix QuestionRoundPanel if needed
- 🟠 Add question handlers to ticket detail page
- 🟠 Hook up service calls

### Phase 3: Test End-to-End
- 🟠 Create ticket → should get spec OR go into Round 1
- 🟠 Answer questions → rounds progress
- 🟠 Skip to finalize → final spec generated
- 🟠 Finalize → quality score shown

### Phase 4: Polish
- 🟠 Loading states
- 🟠 Error handling
- 🟠 Edge cases (network errors, timeouts)

---

## File Changes Summary

### Created Files
- ✅ `client/src/types/question-refinement.ts` - Frontend types
- ✅ `client/src/services/question-round.service.ts` - API integration
- 🟠 `client/src/tickets/components/QuestionRoundsSection.tsx` - NEW

### Modified Files
- ✅ `client/src/tickets/stores/generation-wizard.store.ts` - Remove backend imports
- ✅ `client/src/tickets/components/wizard/QuestionRoundPanel.tsx` - Remove backend imports
- ✅ `client/src/services/index.ts` - Add question round service
- ✅ `client/src/services/ticket.service.ts` - Extend AECResponse
- ✅ `client/tsconfig.json` - Add @/types alias
- 🟠 `client/app/(main)/tickets/[id]/page.tsx` - Add question handlers

---

## Current Status

**What's Working:**
- ✅ Simple ticket creation form
- ✅ Ticket list page
- ✅ Ticket detail page (loads empty if no spec)
- ✅ Backend API endpoints complete
- ✅ Backend domain logic complete
- ✅ Frontend type definitions

**What's Broken:**
- ❌ Ticket detail doesn't show questions (no QuestionRoundsSection)
- ❌ No handlers wired for start/submit/finalize
- ❌ Complex 4-stage GenerationWizard unused (can be disabled)

**Next Priority:**
Create QuestionRoundsSection component and wire it into ticket detail page.

---

## Testing Checklist

- [ ] Create ticket → redirected to detail page
- [ ] Ticket detail page shows ticket (not empty)
- [ ] If questions exist, they're shown in QuestionRoundsSection
- [ ] Can answer a question
- [ ] Submit button sends answers to API
- [ ] Next round loads automatically
- [ ] Can skip to finalize at any time
- [ ] Final spec shown with quality score
- [ ] Reload page → questions persist (from Firestore)
- [ ] Network error → graceful retry
- [ ] Slow LLM → loading spinner shown

---

## Performance Notes

- Questions persist in Firestore → no data loss on refresh
- Questions cached in frontend store → smooth UX
- Service uses axios with 30s timeout → reasonable for LLM calls
- Logging in place for debugging

