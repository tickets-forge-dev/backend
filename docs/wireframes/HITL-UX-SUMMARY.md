# HITL Workflow - UX Design Summary

**Story**: 7.10 Mastra Workflow Refactor
**Date**: 2026-02-03
**Status**: Approved for Implementation

## Overview

This document defines the user experience for the Human-In-The-Loop (HITL) ticket generation workflow. The workflow has 2 suspension points where user input is required, plus several intermediate states that should be visually communicated.

---

## UI States

### State 1: Initial Creation (Existing)
**When**: User clicks "Create Ticket"
**Duration**: Instant
**UI**: Standard ticket creation form

**Elements**:
- Title input (required)
- Description textarea
- Repository selector (dropdown)
- Branch selector (dropdown)
- "Create" button (primary)
- "Cancel" button (secondary)

**Behavior**:
- Clicking "Create" submits form
- Backend creates AEC with status `draft`
- Backend starts workflow immediately (async)
- Frontend subscribes to AEC document for real-time updates
- UI transitions to State 2 (In Progress)

---

### State 2: In Progress - Generation Running
**When**: Workflow steps 1-3 executing
**Duration**: 5-15 seconds
**UI**: Non-blocking progress indicator

**Visual Design**:
```
┌─────────────────────────────────────────────────────┐
│ Ticket: [Title]                                     │
│                                                     │
│ 🔄 Generating ticket content...                    │
│                                                     │
│ Progress:                                          │
│ ✅ Extracting intent                               │
│ ✅ Detecting type                                  │
│ ⏳ Running preflight validation                    │
│ ⏸️  Gathering repository context                   │
│ ⏸️  Generating acceptance criteria                 │
│                                                     │
│ [View Draft Details] (disabled)                    │
└─────────────────────────────────────────────────────┘
```

**Elements**:
- **Header**: Ticket title
- **Status indicator**: Spinner icon + text "Generating ticket content..."
- **Progress list**:
  - ✅ Completed steps (green checkmark)
  - ⏳ Current step (spinner)
  - ⏸️ Pending steps (gray)
- **Draft details button**: Disabled until content available

**Behavior**:
- User can navigate away (workflow continues)
- Real-time updates via Firestore subscription
- If user returns to page, progress continues from current step
- Steps update automatically as workflow progresses

**Step Labels**:
1. "Extracting intent"
2. "Detecting type"
3. "Running preflight validation"
4. "Gathering repository context"
5. "Generating acceptance criteria"
6. "Generating questions"

---

### State 3: Suspended - Critical Findings Review
**When**: Step 4 (reviewFindings) detects critical issues
**Duration**: Indefinite (waiting for user action)
**UI**: Modal dialog with action buttons

**Visual Design**:
```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  ⚠️  Critical Issues Detected                            │
│                                                          │
│  We found issues that may affect ticket quality:        │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 🔴 CRITICAL: Ambiguous Requirements                │ │
│  │                                                    │ │
│  │ The ticket description doesn't specify which API   │ │
│  │ endpoint should be modified. Multiple candidates   │ │
│  │ found: /api/users, /api/auth/users                │ │
│  │                                                    │ │
│  │ Suggestion: Clarify which endpoint in description │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 🔴 CRITICAL: Breaking Change Detected              │ │
│  │                                                    │ │
│  │ This change would modify the User.email field type │ │
│  │ from string to object, breaking 12 existing calls │ │
│  │                                                    │ │
│  │ Suggestion: Consider deprecation strategy first   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [Edit Ticket]  [Proceed Anyway]  [Cancel]             │
│   (primary)      (danger)          (secondary)          │
└──────────────────────────────────────────────────────────┘
```

**Elements**:
- **Header**: "⚠️ Critical Issues Detected"
- **Description**: Short explanation of findings
- **Findings list**: Each finding in a card:
  - Severity badge (🔴 CRITICAL)
  - Title
  - Detailed message
  - Suggestion (if available)
- **Action buttons**:
  - "Edit Ticket" (primary) - Returns to form, pre-fills data
  - "Proceed Anyway" (danger) - Continues workflow despite issues
  - "Cancel" (secondary) - Cancels workflow, deletes draft

**Behavior**:
- Modal is blocking (user must choose action)
- Workflow is suspended (LibSQL state preserved)
- If user clicks "Edit Ticket":
  - Workflow cancels
  - Returns to creation form with current data
  - User can modify and re-submit (starts new workflow)
- If user clicks "Proceed Anyway":
  - Workflow resumes from step 5
  - Findings saved to `preImplementationFindings[]`
- If user clicks "Cancel":
  - Workflow cancels
  - AEC deleted
  - Returns to tickets list

**Finding Severity Colors**:
- 🔴 CRITICAL: Red background, white text
- 🟡 WARNING: Yellow background, black text
- 🔵 INFO: Blue background, white text

---

### State 4: In Progress - Refinement Running
**When**: Steps 5-8 executing (after user proceeds from findings)
**Duration**: 10-20 seconds
**UI**: Progress indicator (same as State 2, different steps)

**Visual Design**:
```
┌─────────────────────────────────────────────────────┐
│ Ticket: [Title]                                     │
│                                                     │
│ 🔄 Refining ticket content...                      │
│                                                     │
│ Progress:                                          │
│ ✅ Extracting intent                               │
│ ✅ Detecting type                                  │
│ ✅ Preflight validation (2 issues found)           │
│ ✅ Gathering repository context                    │
│ ⏳ Generating acceptance criteria                  │
│ ⏸️  Generating questions                           │
│                                                     │
│ [View Draft] (enabled)                             │
└─────────────────────────────────────────────────────┘
```

**Elements**:
- Same as State 2, but:
  - Status text: "Refining ticket content..."
  - Completed steps include findings count if applicable
  - "View Draft" button enabled (shows partial content)

**Behavior**:
- If user clicks "View Draft":
  - Opens side panel showing current state:
    - Intent
    - Type
    - Acceptance criteria (if generated)
    - Assumptions (if generated)
    - Findings
  - Panel is read-only
  - Panel updates in real-time
  - User can close panel and continue waiting

---

### State 5: Suspended - Questions
**When**: Step 9 (askQuestions) finds missing information
**Duration**: Indefinite (waiting for user answers)
**UI**: Side panel with question form

**Visual Design**:
```
┌──────────────────────────────────┬─────────────────────────┐
│ Ticket: [Title]                  │ 📝 Clarifying Questions │
│                                  │                         │
│ Type: FEATURE                    │ We need more info:      │
│                                  │                         │
│ Acceptance Criteria:             │ ┌─────────────────────┐ │
│ • User can upload profile photo  │ │ Question 1 of 3     │ │
│ • Photo is resized to 200x200    │ │                     │ │
│ • Photo is stored in S3          │ │ What file formats   │ │
│                                  │ │ should be supported?│ │
│ Assumptions:                     │ │                     │ │
│ • Using AWS S3 for storage       │ │ ☑ JPEG              │ │
│ • Max file size: 5MB             │ │ ☑ PNG               │ │
│                                  │ │ ☐ GIF               │ │
│                                  │ │ ☐ WebP              │ │
│                                  │ └─────────────────────┘ │
│                                  │                         │
│                                  │ [Previous] [Next]       │
│                                  │                         │
│                                  │ [Skip All] [Submit]     │
│                                  │ (secondary) (primary)   │
└──────────────────────────────────┴─────────────────────────┘
```

**Elements**:
- **Left panel**: Current draft content (read-only)
  - Type badge
  - Acceptance criteria list
  - Assumptions list
  - Findings (if any)
- **Right panel**: Question form
  - Question counter (e.g., "Question 1 of 3")
  - Question text
  - Input field (varies by question type):
    - Text input
    - Textarea
    - Checkboxes (multiple choice)
    - Radio buttons (single choice)
  - Navigation:
    - "Previous" button (disabled on first question)
    - "Next" button (enabled after answering)
  - Action buttons:
    - "Skip All" (secondary) - Proceeds without answers
    - "Submit" (primary) - Saves answers and resumes workflow

**Behavior**:
- Questions shown one at a time (wizard style)
- User can navigate back/forward between questions
- Answers saved in local state (not persisted until submit)
- If user clicks "Skip All":
  - Workflow resumes at step 10 without answers
  - Step 10 (refineDraft) skips (no refinement)
  - Proceeds to finalization
- If user clicks "Submit":
  - Answers saved to workflow state
  - Workflow resumes at step 10
  - Step 10 uses answers to refine acceptance criteria
- If user navigates away:
  - Answers preserved in workflow state (LibSQL)
  - User can return and continue from same question

**Question Types**:
- **Text**: Single-line input (e.g., "What should the API endpoint be named?")
- **Textarea**: Multi-line input (e.g., "Describe the expected error handling behavior")
- **Multiple choice**: Checkboxes (e.g., "Which file formats should be supported?")
- **Single choice**: Radio buttons (e.g., "Should this be a modal or a page?")

---

### State 6: Complete - Ready for Implementation
**When**: Step 11 (finalize) completes
**Duration**: Permanent
**UI**: Standard ticket detail page

**Visual Design**:
```
┌─────────────────────────────────────────────────────┐
│ ✅ Ticket Ready for Implementation                  │
│                                                     │
│ Title: [User's title]                              │
│ Type: FEATURE                                      │
│ Status: READY                                      │
│                                                     │
│ Acceptance Criteria:                               │
│ • User can upload profile photo via form           │
│ • Photo is validated (JPEG/PNG, max 5MB)           │
│ • Photo is resized to 200x200 on server            │
│ • Photo is stored in S3 bucket                     │
│ • User sees preview before confirming              │
│                                                     │
│ Assumptions:                                       │
│ • Using AWS S3 for storage                         │
│ • Using sharp library for image processing         │
│ • Max file size: 5MB                               │
│                                                     │
│ Repo Paths (likely affected):                      │
│ • backend/src/users/user.controller.ts             │
│ • backend/src/storage/s3.service.ts                │
│ • client/src/components/ProfileUpload.tsx          │
│                                                     │
│ Pre-Implementation Findings:                       │
│ 🟡 Warning: S3 bucket policy needs CORS update     │
│ 🔵 Info: Consider adding image compression option  │
│                                                     │
│ [Start Implementation] [Edit] [Archive]            │
│  (primary)             (secondary) (danger)        │
└─────────────────────────────────────────────────────┘
```

**Elements**:
- **Success banner**: "✅ Ticket Ready for Implementation"
- **Metadata**: Title, Type, Status
- **Content sections**:
  - Acceptance Criteria (bulleted list)
  - Assumptions (bulleted list)
  - Repo Paths (file paths with syntax highlighting)
  - Pre-Implementation Findings (if any)
- **Action buttons**:
  - "Start Implementation" (primary) - Creates branch, transitions to `in_progress`
  - "Edit" (secondary) - Allows editing content
  - "Archive" (danger) - Moves to archived status

**Behavior**:
- User can edit any field
- Editing transitions status back to `draft` (requires re-validation)
- User can start implementation immediately
- All workflow-generated content is editable

---

## State Flow Diagram

```
┌─────────────┐
│   Initial   │
│  Creation   │
└──────┬──────┘
       │ Create
       ▼
┌─────────────┐
│ In Progress │
│ (Steps 1-3) │
└──────┬──────┘
       │
       ├─── No Critical ───────┐
       │                       │
       ▼                       │
┌─────────────┐                │
│  Suspended  │                │
│  (Findings) │                │
└──────┬──────┘                │
       │                       │
       ├─ Edit ─────> [Cancel] │
       │                       │
       ├─ Cancel ───> [Cancel] │
       │                       │
       └─ Proceed ─────────────┤
                               │
                               ▼
                        ┌─────────────┐
                        │ In Progress │
                        │ (Steps 5-8) │
                        └──────┬──────┘
                               │
                               ├─── No Questions ──┐
                               │                   │
                               ▼                   │
                        ┌─────────────┐            │
                        │  Suspended  │            │
                        │ (Questions) │            │
                        └──────┬──────┘            │
                               │                   │
                               ├─ Skip ───────────┤
                               │                   │
                               └─ Submit ──────────┤
                                                   │
                                                   ▼
                                            ┌─────────────┐
                                            │  Complete   │
                                            │   (Ready)   │
                                            └─────────────┘
```

---

## Design Patterns

### 1. Non-Blocking Progress
- User can navigate away during workflow
- Progress indicator shows in ticket card on list view
- Clicking card opens detail view with full progress
- Real-time updates via Firestore subscriptions

### 2. Graceful Degradation
- If repository not indexed, show info message
- If services unavailable, show warning but continue
- Never block user due to backend issues

### 3. Explicit User Control
- User explicitly chooses to proceed despite critical findings
- User explicitly chooses to skip questions
- No "auto-proceed" after timeout (user must act)

### 4. Clear Communication
- Each step has human-readable label
- Findings include suggestions for resolution
- Questions include context from draft content

### 5. Minimal Cognitive Load
- Questions shown one at a time (wizard style)
- Progress indicator shows only high-level steps (not all 11)
- Draft content visible while answering questions (context)

---

## Success Metrics

### User Experience
- **Time to Ready**: < 60 seconds for simple tickets
- **User Actions Required**: 0-2 (ideal path requires none)
- **Abandonment Rate**: < 5% during generation
- **Edit Rate**: < 20% after completion (indicates quality)

### Technical Performance
- **Workflow Completion Rate**: > 95%
- **Graceful Degradation Rate**: 100% (no crashes on service failures)
- **Real-time Update Latency**: < 500ms
- **Suspension Resume Time**: < 2 seconds

---

## Accessibility

### Keyboard Navigation
- **Tab**: Navigate between buttons/inputs
- **Enter**: Submit current form/question
- **Escape**: Close modal (same as Cancel)
- **Arrow keys**: Navigate between questions (when applicable)

### Screen Readers
- Progress list announces each step as it completes
- Modal findings read with severity first ("Critical issue: ...")
- Question forms announce question number ("Question 1 of 3")
- Success banner announced when workflow completes

### Color Contrast
- All severity colors meet WCAG AA standards
- Icons used in addition to color (not just color)
- Focus indicators visible on all interactive elements

---

## Error Handling

### Workflow Failure
**When**: Any workflow step throws unhandled error
**UI**: Error banner on ticket detail page

```
┌─────────────────────────────────────────────────────┐
│ ❌ Generation Failed                                │
│                                                     │
│ We encountered an error while generating this      │
│ ticket. Your input has been saved as a draft.      │
│                                                     │
│ Error: Failed to connect to repository index       │
│                                                     │
│ [Retry] [Edit Manually] [Contact Support]          │
└─────────────────────────────────────────────────────┘
```

**Behavior**:
- AEC transitions to `failed` status
- User input preserved (title, description, repository context)
- User can retry workflow or edit manually

### Network Interruption
**When**: User loses connection during generation
**UI**: Warning banner (non-blocking)

```
┌─────────────────────────────────────────────────────┐
│ ⚠️ Connection Lost                                  │
│ Reconnecting... Generation will continue.          │
└─────────────────────────────────────────────────────┘
```

**Behavior**:
- Workflow continues on backend (fire-and-forget)
- UI re-subscribes to Firestore when connection restored
- Progress indicator updates automatically

---

## Mobile Considerations

### State 3 (Findings Modal)
- Full-screen on mobile
- Findings cards stack vertically
- Action buttons stack at bottom

### State 5 (Questions Panel)
- Full-screen on mobile (no side-by-side)
- "View Draft" button opens overlay
- Question navigation at top and bottom

### General
- Touch targets minimum 44x44 points
- Swipe gestures for question navigation
- Pull-to-refresh on ticket list view

---

## Implementation Notes

### Frontend (Next.js + React)

**Files to Create**:
- `client/src/tickets/components/TicketGenerationProgress.tsx` (State 2/4)
- `client/src/tickets/components/FindingsReviewModal.tsx` (State 3)
- `client/src/tickets/components/QuestionsWizard.tsx` (State 5)
- `client/src/tickets/hooks/useWorkflowProgress.ts` (Firestore subscription)

**State Management** (Zustand):
```typescript
interface WorkflowStore {
  // Current workflow state (from Firestore)
  workflowState: 'idle' | 'running' | 'suspended' | 'complete' | 'failed';
  currentStep: number;
  totalSteps: number;
  findings: Finding[];
  questions: Question[];
  answers: Record<string, any>;

  // Actions
  resumeWorkflow: (action: 'proceed' | 'edit' | 'cancel') => Promise<void>;
  submitAnswers: (answers: Record<string, any>) => Promise<void>;
  skipQuestions: () => Promise<void>;
}
```

### Backend (NestJS)

**Firestore Real-time Updates**:
- AEC document includes `generationState` field
- `generationState.status`: 'idle' | 'running' | 'suspended' | 'complete' | 'failed'
- `generationState.currentStep`: 1-11
- `generationState.suspensionReason`: 'critical_findings' | 'questions' | null
- Frontend subscribes to AEC document, updates UI on change

**Workflow Suspension Handling**:
- When step returns `{ action: 'suspend' }`, workflow pauses
- Update AEC `generationState.status = 'suspended'`
- Frontend detects change, shows appropriate UI
- User action triggers API call to resume workflow
- API call resumes workflow from LibSQL state

---

## Future Enhancements

### Phase 2
- **Workflow History**: Show timeline of all steps with timestamps
- **Undo/Redo**: Allow user to go back to previous step
- **Collaborative Review**: Multiple users can review findings/questions
- **Smart Suggestions**: LLM suggests answers to questions based on codebase

### Phase 3
- **Voice Input**: Answer questions via voice
- **Auto-Skip**: Automatically proceed if no critical findings after 5 seconds
- **Batch Generation**: Create multiple tickets from single description
- **Template Library**: Save and reuse common ticket patterns

---

## Conclusion

This HITL workflow balances **automation** (LLM-generated content) with **user control** (explicit decisions at critical points). The UX is designed to be:

- **Transparent**: User always knows what's happening
- **Non-blocking**: User can navigate away and return
- **Forgiving**: Graceful degradation when services unavailable
- **Efficient**: Minimal actions required for happy path

**Next Step**: Implement frontend components per this specification.
