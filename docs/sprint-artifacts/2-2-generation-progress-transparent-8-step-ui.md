# Story 2.2: Generation Progress - Transparent 8-Step UI

Status: ready-for-dev

## Story

As a Product Manager,
I want to see real-time progress through ticket generation steps,
so that I trust the system and understand what's happening.

## Acceptance Criteria

1. **Generation Progress Display**
   - **Given** the user has submitted a ticket creation request
   - **When** generation begins
   - **Then** the UI displays 8 steps vertically with:
     - Step number and title
     - Status indicator (pending/in-progress/complete)
     - Expandable details section (collapsed by default)
     - Retry button (if step fails)

2. **8 Generation Steps Shown**
   - **Given** the progress UI is displayed
   - **When** reviewing the steps
   - **Then** the following 8 steps are shown:
     1. "Intent extraction" - Parse user input
     2. "Type detection" - Classify ticket type (feature/bug/task)
     3. "Repo index query" - Find relevant code modules
     4. "API snapshot resolution" - Resolve OpenAPI spec version
     5. "Ticket drafting" - Generate AEC content
     6. "Validation" - Run validators and calculate score
     7. "Question prep" - Identify clarification questions
     8. "Estimation" - Calculate effort estimate

3. **Real-Time Progress Updates**
   - **Given** generation is running
   - **When** each step completes
   - **Then** step status changes from pending → in-progress → complete
   - **And** next step automatically starts
   - **And** details section populates with human-readable summary

4. **Generation Complete Navigation**
   - **Given** all 8 steps are complete
   - **When** the final step finishes
   - **Then** UI transitions to ticket detail view with readiness badge
   - **And** AEC status is updated to 'validated'

5. **Step Failure Handling**
   - **Given** a generation step is running
   - **When** the step fails (timeout, error, LLM failure)
   - **Then** step shows error status
   - **And** error message is displayed in expandable details
   - **And** retry button appears for that step only
   - **And** user can click retry or cancel

6. **Progress Persistence**
   - **Given** generation is in progress
   - **When** user navigates away from the page
   - **Then** progress is not lost
   - **And** user can return and see current progress
   - **And** AEC stores `generationState` field tracking step completion

7. **Step Timeout Enforcement**
   - **Given** a generation step is running
   - **When** step exceeds 30 seconds
   - **Then** step fails with timeout error
   - **And** user-friendly timeout message displayed (not technical)
   - **And** total generation target is <60 seconds
   - **And** retry button available

## Tasks / Subtasks

- [ ] Task 1: Create GenerationProgress component (AC: #1, #2, #3)
  - [ ] Create `client/src/tickets/components/GenerationProgress.tsx`
  - [ ] Display 8 steps vertically with status indicators
  - [ ] Use shadcn Accordion for expandable details
  - [ ] Subscribe to AEC generationState via Firestore listener
  - [ ] Render step status (pending/in-progress/complete/failed)

- [ ] Task 2: Implement real-time updates via Firestore (AC: #3, #6)
  - [ ] Set up Firestore onSnapshot listener for AEC document
  - [ ] Update component state when generationState changes
  - [ ] Unsubscribe listener on component unmount
  - [ ] Handle connection errors gracefully

- [ ] Task 3: Wire generation into create flow (AC: #4)
  - [ ] Update create page to show GenerationProgress after submit
  - [ ] Navigate to ticket detail when all steps complete
  - [ ] Pass AEC id to GenerationProgress component

- [ ] Task 4: Implement step retry (AC: #5, #7)
  - [ ] Add retry button for failed steps
  - [ ] Call backend endpoint to retry from failed step
  - [ ] Update UI when retry starts
  - [ ] Handle retry failures

- [ ] Task 5: Add timeout handling (AC: #7)
  - [ ] Display user-friendly timeout messages
  - [ ] Show retry option on timeout
  - [ ] Track time per step (for UX metrics)

- [ ] Task 6: Backend - Implement 8-step orchestration (AC: #2, #3)
  - [ ] Create GenerationOrchestrator service
  - [ ] Wire into CreateTicketUseCase (call after save)
  - [ ] Execute steps 1-8 sequentially
  - [ ] Update AEC generationState in Firestore after each step
  - [ ] Handle step failures and timeouts

- [ ] Task 7: Backend - Implement LLM steps with Ollama (AC: #2)
  - [ ] Step 1: Call llmGenerator.extractIntent()
  - [ ] Step 2: Call llmGenerator.detectType()
  - [ ] Step 5: Call llmGenerator.generateDraft()
  - [ ] Step 7: Call llmGenerator.generateQuestions()

- [ ] Task 8: Backend - Implement stub steps (AC: #2)
  - [ ] Step 3: Repo query stub (returns empty array for now)
  - [ ] Step 4: API snapshot stub (returns null for now)
  - [ ] Step 6: Validation stub (returns placeholder score)
  - [ ] Step 8: Estimation stub (returns default estimate)

- [ ] Task 9: Write tests
  - [ ] Test GenerationProgress renders all 8 steps
  - [ ] Test Firestore listener updates UI
  - [ ] Test retry button functionality
  - [ ] Test navigation after completion

## Dev Notes

### Architecture Context

From [tech-spec-epic-2.md](./tech-spec-epic-2.md#story-22):

**Story 2.2 Implementation:**
- UI component: `client/src/tickets/components/GenerationProgress.tsx`
- Subscribe to AEC updates via Firestore listener (onSnapshot)
- Backend orchestration: CreateTicketUseCase orchestrates all 8 steps
- Steps 1,2,5,7: Mastra/Ollama agents (ILLMContentGenerator)
- Steps 3,4,6,8: Deterministic services (stubs in Epic 2)
- Backend updates AEC `generationState` in Firestore after each step
- Frontend renders based on `generationState.currentStep` and `generationState.steps[]`

### Learnings from Previous Story (2.1)

**From Story 2.1 (Status: done)**

**Services Available to Reuse:**
- `TicketService` at `client/src/services/ticket.service.ts` - Has getById() method
- `useServices()` hook at `client/src/services/index.ts` - DI pattern
- `useTicketsStore` at `client/src/stores/tickets.store.ts` - State management

**Patterns Established:**
- useServices() dependency injection working
- Zustand store integration successful
- Firestore persistence verified (5 tickets saved)
- Error handling with dismissible error card

**Components Available:**
- shadcn/ui Accordion (for expandable step details)
- Badge (for status indicators)
- Button (for retry)
- Card (for step containers)

**Backend Infrastructure Ready:**
- CreateTicketUseCase creates draft AEC
- FirestoreAECRepository saves to Firestore
- ILLMContentGenerator interface with 4 LLM methods
- Ollama configured and working

**Key Pattern - Firestore Real-Time:**
```typescript
useEffect(() => {
  const unsubscribe = firestore
    .collection(`workspaces/${workspaceId}/aecs`)
    .doc(aecId)
    .onSnapshot((snapshot) => {
      const data = snapshot.data();
      setGenerationState(data?.generationState);
    });
  return unsubscribe;
}, [aecId]);
```

[Source: docs/sprint-artifacts/2-1-ticket-creation-ui-minimal-input-form.md#Dev-Agent-Record]

### Technical Approach

**Frontend Component:**
```typescript
// client/src/tickets/components/GenerationProgress.tsx
'use client';

import { useEffect, useState } from 'react';
import { firestore } from '@/lib/firebase';
import { Accordion } from '@/core/components/ui/accordion';
import { Badge } from '@/core/components/ui/badge';

export function GenerationProgress({ aecId }: { aecId: string }) {
  const [generationState, setGenerationState] = useState(null);

  useEffect(() => {
    // Subscribe to AEC updates
    const unsubscribe = firestore
      .doc(`workspaces/ws_dev/aecs/${aecId}`)
      .onSnapshot((snapshot) => {
        setGenerationState(snapshot.data()?.generationState);
      });

    return () => unsubscribe();
  }, [aecId]);

  // Render 8 steps with status badges
  return (
    <div className="space-y-4">
      {generationState?.steps.map(step => (
        <StepCard key={step.id} step={step} />
      ))}
    </div>
  );
}
```

**Backend Orchestration:**
```typescript
// backend/src/tickets/application/services/GenerationOrchestrator.ts
@Injectable()
export class GenerationOrchestrator {
  async orchestrate(aec: AEC) {
    // Step 1: Intent extraction
    await this.executeStep(aec, 1, async () => {
      const intent = await this.llmGenerator.extractIntent({
        title: aec.title,
        description: aec.description
      });
      return intent;
    });

    // Step 2: Type detection
    await this.executeStep(aec, 2, async () => {
      const type = await this.llmGenerator.detectType(intent);
      aec.updateContent(type.type, [], [], []);
      return type;
    });

    // ... steps 3-8

    // Mark as validated
    aec.validate(validationResults);
    await this.aecRepository.update(aec);
  }

  private async executeStep(aec, stepNum, fn) {
    // Update step status to in-progress
    const state = aec.generationState;
    state.steps[stepNum-1].status = 'in-progress';
    aec.updateGenerationState(state);
    await this.aecRepository.update(aec);

    try {
      const result = await fn();

      // Update step to complete
      state.steps[stepNum-1].status = 'complete';
      state.steps[stepNum-1].details = JSON.stringify(result);
      aec.updateGenerationState(state);
      await this.aecRepository.update(aec);
    } catch (error) {
      // Update step to failed
      state.steps[stepNum-1].status = 'failed';
      state.steps[stepNum-1].error = error.message;
      await this.aecRepository.update(aec);
      throw error;
    }
  }
}
```

### 8-Step Generation Flow

**LLM Steps (via Ollama in dev):**
1. Intent extraction → Extract core intent and keywords
2. Type detection → Classify as feature/bug/task
5. Ticket drafting → Generate ACs, assumptions, repo paths
7. Question prep → Generate clarification questions

**Stub Steps (implemented in Epic 3-4):**
3. Repo query → Return [] (Epic 4 implements repo indexing)
4. API snapshot → Return null (Epic 4 implements OpenAPI sync)
6. Validation → Return score: 50 (Epic 3 implements full validators)
8. Estimation → Return { min: 4, max: 8 } (Epic 4 implements estimation)

### File Locations

**Files to Create:**
- `client/src/tickets/components/GenerationProgress.tsx` - Main progress component
- `backend/src/tickets/application/services/GenerationOrchestrator.ts` - 8-step orchestration

**Files to Modify:**
- `client/app/(main)/tickets/create/page.tsx` - Show GenerationProgress after submit
- `backend/src/tickets/application/use-cases/CreateTicketUseCase.ts` - Call orchestrator
- `client/app/(main)/tickets/[id]/page.tsx` - Show ticket details after generation

### Prerequisites

- Story 2.1 complete (form creates tickets) ✅
- Firestore real-time listeners (Firebase SDK) ✅
- Ollama LLM configured ✅
- ILLMContentGenerator interface ready ✅

### Project Standards

From [CLAUDE.md](../../CLAUDE.md):
- MANDATORY: use useServices() hook (if services needed)
- Use Zustand for state if needed (or component state for this UI)
- No business logic in components (generation logic in backend)
- Always handle loading, error states
- Subscribe to Firestore, unsubscribe on unmount

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-2.md#story-22-generation-progress]
- [Source: docs/epics.md#story-22-generation-progress-transparent-8-step-ui]
- [Source: docs/prd.md#8-step-generation]
- [Source: docs/ux.md#generation-progress-screen]
- [Source: docs/architecture.md#real-time-updates]

## Dev Agent Record

### Context Reference

- [Story Context](./2-2-generation-progress-transparent-8-step-ui.context.xml)

### Agent Model Used

Claude Sonnet 4.5 (1M context) [claude-sonnet-4-5-20250929[1m]]

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2026-01-31: Story created by create-story workflow
