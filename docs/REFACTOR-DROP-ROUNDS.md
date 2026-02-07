# Refactor: Drop Multi-Round Questions, Keep It Simple

**Status:** Planning
**Priority:** High (Core UX simplification)
**Effort:** 4 days
**Date:** 2026-02-07

---

## Problem Statement

Current multi-round question system is over-engineered:
- ❌ Confuses users with "Round 1/2/3"
- ❌ Complex state machine (currentRound, maxRounds, questionRounds array)
- ❌ Multiple API calls and retry loops
- ❌ 800+ lines of round-related code
- ❌ Hard to debug, easy to break

**Goal:** Simple, bulletproof single-question-set flow

---

## Architecture: Old vs New

### Old (Rounds-Based)
```
Ticket Created
  ↓
Start Round 1 → Generate questions → Show panel → Answer → Submit
  ↓
Determine if more rounds needed (LLM decision)
  ↓
Start Round 2 → Generate follow-up questions → Show panel → Answer → Submit
  ↓
Start Round 3 (if needed) → Same flow → Submit
  ↓
Check if finalization ready → Finalize Spec
  ↓
Done

Problems:
- 3+ API calls for questions alone
- State tracked in currentRound, maxRounds, questionRounds
- Complex conditionals for "should we ask more?"
- Hard to track which round user is in
- Users confused by "Round 1 of 3"
```

### New (Simple Single Set)
```
Ticket Created
  ↓
Generate Questions (1 API call)
  - LLM generates up to 5 most important questions
  - Returns immediately
  ↓
Show Questions in Modal
  - User answers all 5 (or fewer)
  - Keyboard nav, no round complexity
  ↓
Submit Answers (1 API call)
  - POST /api/questions/submit
  - Immediately finalizes spec
  ↓
Done!

Benefits:
- 2 API calls total (vs 3-6+)
- Linear, predictable flow
- No state machine needed
- Users see progress immediately
- Much easier to debug
```

---

## Implementation Plan

### Phase 1: Domain Layer Simplification (1 day)

**File: `backend/src/tickets/domain/aec/AEC.ts`**

Delete:
- `questionRounds: QuestionRound[]`
- `currentRound: number`
- `maxRounds: number`
- `startQuestionRound()`
- `completeQuestionRound()`
- `skipToFinalize()`
- `isRoundComplete()`
- `markReadyForFinalization()`

Add:
```typescript
// Simple question tracking (no rounds)
private _questions: ClarificationQuestion[] = [];
private _questionAnswers: Record<string, string | string[]> = {};
private _questionsAnsweredAt: Date | null = null;

// Methods
setQuestions(questions: ClarificationQuestion[]): void {
  this._questions = questions;
  this._updatedAt = new Date();
}

recordQuestionAnswers(answers: Record<string, string | string[]>): void {
  this._questionAnswers = answers;
  this._questionsAnsweredAt = new Date();
  this._updatedAt = new Date();
}

get questions(): ClarificationQuestion[] {
  return [...this._questions];
}

get questionAnswers(): Record<string, string | string[]> {
  return { ...this._questionAnswers };
}

get hasAnsweredQuestions(): boolean {
  return this._questionsAnsweredAt !== null;
}
```

**Rationale:** Questions are now simple data, not a complex state machine.

---

### Phase 2: Use Case Refactoring (1.5 days)

**Delete:**
- `StartQuestionRoundUseCase.ts` (entire file, ~300 lines)
- `SubmitAnswersUseCase.ts` (entire file, ~250 lines)

**Create:**
- `GenerateQuestionsUseCase.ts` (new, ~150 lines)
- `SubmitQuestionAnswersUseCase.ts` (new, ~200 lines)

---

#### **New Use Case 1: GenerateQuestionsUseCase**

```typescript
/**
 * Generates up to 5 clarification questions once
 *
 * - No rounds, no retry loops
 * - Fast execution
 * - Bulletproof error handling
 */
@Injectable()
export class GenerateQuestionsUseCase {
  constructor(
    @Inject(AEC_REPOSITORY) private aecRepository: AECRepository,
    @Inject(TECH_SPEC_GENERATOR) private techSpecGenerator: TechSpecGenerator,
    @Inject(CODEBASE_ANALYZER) private codebaseAnalyzer: CodebaseAnalyzer,
    @Inject(PROJECT_STACK_DETECTOR) private stackDetector: ProjectStackDetector,
    @Inject(GITHUB_FILE_SERVICE) private githubFileService: GitHubFileService,
  ) {}

  async execute(command: {
    aecId: string;
    workspaceId: string;
  }): Promise<{ aec: AEC; questions: ClarificationQuestion[] }> {
    const { aecId, workspaceId } = command;

    // 1. Load AEC
    const aec = await this.aecRepository.findById(aecId);
    if (!aec) throw new NotFoundException(`AEC ${aecId} not found`);
    if (aec.workspaceId !== workspaceId) throw new BadRequestException('Workspace mismatch');

    // 2. Already has questions? Return them
    if (aec.questions.length > 0) {
      console.log(`📋 Questions already generated for ${aecId}, returning existing`);
      return { aec, questions: aec.questions };
    }

    // 3. Build minimal codebase context (fast)
    const context = await this.buildCodebaseContext(aec);

    // 4. Generate questions (single call, no retries on this version)
    const questions = await this.techSpecGenerator.generateQuestionsWithContext({
      title: aec.title,
      description: aec.description ?? undefined,
      context,
      priorAnswers: [], // No prior answers in single-set flow
      roundNumber: 1, // Always "round 1" conceptually, but no multi-round logic
    });

    // 5. Validate we got some questions (but even 0 is OK)
    console.log(`📋 Generated ${questions.length} questions for ${aecId}`);

    // 6. Store questions in AEC
    if (questions.length > 0) {
      aec.setQuestions(questions);
      await this.aecRepository.save(aec);
    }

    return { aec, questions };
  }

  private async buildCodebaseContext(aec: AEC): Promise<CodebaseContext> {
    // Same as before, but simplified
    // No complex retry logic, just best-effort
    const repoContext = aec.repositoryContext;
    if (!repoContext) {
      return getMinimalContext();
    }

    try {
      const [owner, repo] = repoContext.repositoryFullName.split('/');
      const fileTree = await this.githubFileService.getTree(owner, repo, repoContext.branchName);
      const filesMap = await this.readKeyFiles(owner, repo, repoContext.branchName);
      const stack = await this.stackDetector.detectStack(filesMap);
      const analysis = await this.codebaseAnalyzer.analyzeStructure(filesMap, fileTree);

      return { stack, analysis, fileTree, files: filesMap };
    } catch (error) {
      console.warn('Failed to build full context, using minimal:', error instanceof Error ? error.message : String(error));
      return getMinimalContext();
    }
  }
}
```

**Key Principles:**
- ✅ No multi-round loops
- ✅ No retry logic on main path (questions are best-effort)
- ✅ Idempotent (safe to call multiple times)
- ✅ Returns existing questions if already generated
- ✅ Fast execution (no multi-round delays)

---

#### **New Use Case 2: SubmitQuestionAnswersUseCase**

```typescript
/**
 * Submit question answers and immediately finalize spec
 *
 * - Validates all answers are provided
 * - Calls FinalizeSpecUseCase to generate spec with answers
 * - Returns finalized spec with bulletproof error handling
 * - NO intermediate states, direct path to finalization
 */
@Injectable()
export class SubmitQuestionAnswersUseCase {
  private readonly logger = new Logger(SubmitQuestionAnswersUseCase.name);

  constructor(
    @Inject(AEC_REPOSITORY) private aecRepository: AECRepository,
    @Inject(FINALIZE_SPEC_USE_CASE) private finalizeSpecUseCase: FinalizeSpecUseCase,
  ) {}

  async execute(command: {
    aecId: string;
    workspaceId: string;
    answers: Record<string, string | string[]>;
  }): Promise<{ aec: AEC; techSpec: TechSpec }> {
    const { aecId, workspaceId, answers } = command;

    // 1. Load AEC
    const aec = await this.aecRepository.findById(aecId);
    if (!aec) throw new NotFoundException(`AEC ${aecId} not found`);
    if (aec.workspaceId !== workspaceId) throw new BadRequestException('Workspace mismatch');

    // 2. Validate answers
    this.validateAnswers(aec.questions, answers);

    // 3. Record answers in domain
    aec.recordQuestionAnswers(answers);
    await this.aecRepository.save(aec);

    this.logger.log(`✅ Recorded answers for ${aec.questions.length} questions (${aecId})`);

    // 4. Finalize spec with answers (bulletproof finalization)
    const techSpec = await this.finalizeSpecUseCase.execute({
      aecId,
      workspaceId,
      answers: Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      })),
    });

    this.logger.log(`✨ Spec finalized with quality score: ${techSpec.qualityScore}/100 (${aecId})`);

    // 5. Update AEC with tech spec
    aec.setTechSpec(techSpec);
    await this.aecRepository.save(aec);

    return { aec, techSpec };
  }

  /**
   * Validate that user answered all required questions
   * Throws if validation fails
   */
  private validateAnswers(questions: ClarificationQuestion[], answers: Record<string, string | string[]>): void {
    if (!Array.isArray(questions) || questions.length === 0) {
      // No questions to answer (OK state)
      return;
    }

    const missingAnswers: string[] = [];

    for (const question of questions) {
      const answer = answers[question.id];

      // Check if answer exists and is not empty
      if (answer === null || answer === undefined) {
        missingAnswers.push(question.id);
        continue;
      }

      // Check if answer is empty string or empty array
      if (typeof answer === 'string' && answer.trim() === '') {
        missingAnswers.push(question.id);
      } else if (Array.isArray(answer) && answer.length === 0) {
        missingAnswers.push(question.id);
      }
    }

    if (missingAnswers.length > 0) {
      throw new BadRequestException(
        `Missing answers for questions: ${missingAnswers.join(', ')}. ` +
        `Please answer all ${questions.length} questions before finalizing.`
      );
    }
  }
}
```

**Key Principles:**
- ✅ All-or-nothing: Either all answers are good, or error out
- ✅ Clear error messages (missing questions listed)
- ✅ Direct path to finalization (no intermediate states)
- ✅ Bulletproof validation before finalization
- ✅ Logs answer count and quality score

---

### Phase 3: Controller Updates (0.5 day)

**File: `backend/src/tickets/presentation/controllers/tickets.controller.ts`**

Replace round-based endpoints with simple ones:

```typescript
/**
 * POST /api/tickets/:id/questions
 * Generate up to 5 clarification questions
 */
@Post(':id/questions')
async generateQuestions(@Param('id') id: string, @Body() _dto: empty) {
  const aec = await this.generateQuestionsUseCase.execute({
    aecId: id,
    workspaceId: this.currentUser.workspaceId,
  });
  return { success: true, questions: aec.questions };
}

/**
 * POST /api/tickets/:id/submit-questions
 * Submit question answers and finalize spec
 */
@Post(':id/submit-questions')
async submitQuestions(
  @Param('id') id: string,
  @Body() dto: { answers: Record<string, string | string[]> },
) {
  const result = await this.submitQuestionAnswersUseCase.execute({
    aecId: id,
    workspaceId: this.currentUser.workspaceId,
    answers: dto.answers,
  });
  return {
    success: true,
    techSpec: result.techSpec,
    qualityScore: result.techSpec.qualityScore,
  };
}
```

---

### Phase 4: Frontend Simplification (1.5 days)

**Delete:**
- `QuestionRoundsSection.tsx` (entire file, ~260 lines)

**Create:**
- `QuestionsPanel.tsx` (new, ~100 lines)

---

#### **New Component: QuestionsPanel**

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';
import { QuestionRefinementModal } from './QuestionRefinementModal';
import type { ClarificationQuestion, RoundAnswers } from '@/types/question-refinement';

interface QuestionsPanelProps {
  aecId: string;
  onQuestionsGenerated?: (count: number) => void;
  onQuestionsSubmitted?: (spec: any) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function QuestionsPanel({
  aecId,
  onQuestionsGenerated,
  onQuestionsSubmitted,
  isLoading = false,
  error = null,
}: QuestionsPanelProps) {
  const [questions, setQuestions] = useState<ClarificationQuestion[]>([]);
  const [answers, setAnswers] = useState<RoundAnswers>({});
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Generate questions on mount
  useEffect(() => {
    const generateQuestions = async () => {
      setIsLoadingQuestions(true);
      setLocalError(null);
      try {
        const res = await fetch(`/api/tickets/${aecId}/questions`, {
          method: 'POST',
        });
        if (!res.ok) throw new Error('Failed to generate questions');
        const data = await res.json();
        setQuestions(data.questions);
        onQuestionsGenerated?.(data.questions.length);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to generate questions';
        setLocalError(msg);
      } finally {
        setIsLoadingQuestions(false);
      }
    };

    generateQuestions();
  }, [aecId, onQuestionsGenerated]);

  const handleAnswerChange = (questionId: string, answer: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setLocalError(null);
    try {
      const res = await fetch(`/api/tickets/${aecId}/submit-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to submit answers');
      }

      const data = await res.json();
      onQuestionsSubmitted?.(data.techSpec);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit answers';
      setLocalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    // Skip questions and go straight to finalization
    setIsSubmitting(true);
    setLocalError(null);
    try {
      const res = await fetch(`/api/tickets/${aecId}/submit-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: {} }),
      });

      if (!res.ok) throw new Error('Failed to finalize');
      const data = await res.json();
      onQuestionsSubmitted?.(data.techSpec);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to finalize';
      setLocalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoadingQuestions) {
    return (
      <div className="rounded-lg bg-[var(--bg-subtle)] p-6 text-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto mb-3" />
        <p className="text-sm text-[var(--text-secondary)]">Generating questions...</p>
      </div>
    );
  }

  // No questions (OK state)
  if (questions.length === 0) {
    return (
      <div className="rounded-lg bg-[var(--bg-subtle)] p-6 text-center py-8">
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          No clarification needed. Ready to finalize?
        </p>
        <Button onClick={handleSkip} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Finalizing...
            </>
          ) : (
            'Finalize Spec'
          )}
        </Button>
      </div>
    );
  }

  // Show modal for questions
  return (
    <>
      <QuestionRefinementModal
        questions={questions}
        answers={answers}
        onAnswerChange={handleAnswerChange}
        onSubmit={handleSubmit}
        onSkip={handleSkip}
        isSubmitting={isSubmitting || isLoading}
      />

      {/* Error display */}
      {(error || localError) && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-900">{error || localError}</p>
          </div>
        </Card>
      )}
    </>
  );
}
```

**Key Principles:**
- ✅ Simple: Load questions on mount, show modal, handle submission
- ✅ Linear flow: No round tracking, no state complexity
- ✅ Idempotent: Safe to call multiple times (won't regenerate questions)
- ✅ No intermediate states between questions and finalization
- ✅ Clear error messages

---

### Phase 5: Update Existing Components (1 day)

**Files to Update:**
- `Stage3Draft.tsx` - Replace QuestionRoundsSection with QuestionsPanel
- `tickets/[id]/page.tsx` - Remove round-related logic, use simple questions panel
- `Stage2Context.tsx` - Already cleaned up in previous commit
- Delete `QuestionRoundsSection.tsx` entirely

**Key Changes:**
```tsx
// Old
<QuestionRoundsSection
  questionRounds={currentTicket.questionRounds}
  currentRound={currentTicket.currentRound!}
  maxRounds={currentTicket.maxRounds ?? 3}
  onSubmitAnswers={handleSubmitAnswers}
  onSkipToFinalize={handleSkipToFinalize}
  onFinalizeSpec={handleFinalizeSpec}
  isSubmitting={isSubmittingAnswers}
  error={answerSubmitError}
/>

// New
<QuestionsPanel
  aecId={currentTicket.id}
  onQuestionsSubmitted={(spec) => {
    // Update ticket with finalized spec
    updateTicket({ ...currentTicket, techSpec: spec });
  }}
/>
```

---

### Phase 6: Types Cleanup (0.5 day)

**Delete from `client/src/types/question-refinement.ts`:**
- `QuestionRound` interface
- `StartQuestionRoundRequest` interface
- Round-related types

**Keep:**
- `ClarificationQuestion`
- `TestCaseSpec`, `ApiEndpointSpec`
- All other non-round types

---

## Edge Cases & Bulletproof Handling

### Case 1: No Questions Needed
```
User creates ticket about simple task
  ↓
generateQuestions() returns [] (0 questions)
  ↓
QuestionsPanel shows "No clarification needed"
  ↓
User clicks "Finalize Spec"
  ↓
submitQuestionAnswers({ answers: {} }) with empty answers
  ↓
Use case validates: 0 required answers needed ✓
  ↓
Spec finalized successfully
```

### Case 2: User Answers Some But Not All
```
Show modal with 5 questions
User answers 3, leaves 2 blank
User clicks "Finalize"
  ↓
submitQuestionAnswers() validates answers
  ↓
Missing: ["q4", "q5"]
  ↓
Error: "Missing answers for questions: q4, q5. Please answer all 5."
  ↓
User stays in modal, completes answers
  ↓
Retry submit with all 5 answered ✓
```

### Case 3: Skip Questions Entirely
```
Modal showing with 5 questions
User clicks "Skip to End"
  ↓
submitQuestionAnswers({ answers: {} })
  ↓
Validation: 0 answers provided
  ↓
But questions.length = 5
  ↓
ERROR: Can't skip if questions were generated!
  ↓
(OR) Change UX: Only show "Skip" if user hasn't started answering
```

### Case 4: Network Failure During Submit
```
User answers all 5 questions
Clicks "Finalize"
POST /api/questions/submit fails (network)
  ↓
Catch error, show: "Network error. Please try again."
  ↓
Answers still in local state (not lost)
  ↓
User clicks "Finalize" again
  ↓
Same request succeeds ✓
```

### Case 5: Finalization Fails (LLM error)
```
User submits answers
Backend calls FinalizeSpecUseCase
LLM fails (API error, timeout, etc.)
  ↓
FinalizeSpecUseCase retries 3x with backoff
  ↓
Still fails after 3 attempts
  ↓
Error returned: "Failed to finalize spec. Please try again."
  ↓
User stays on page, can retry
  ↓
Answers preserved in AEC (can retry)
```

---

## Bulletproof Finalization Checklist

- [ ] All answers validated before starting finalization
- [ ] FinalizeSpecUseCase has robust retry logic (3 attempts)
- [ ] Partial failures don't corrupt AEC state
- [ ] Answers persisted to AEC before finalization attempt
- [ ] TechSpec validation (required fields exist)
- [ ] Stack field properly populated (or null if unknown)
- [ ] UUID generation works (fixed in previous commit)
- [ ] Quality score calculated correctly
- [ ] No state left in "finalizing" limbo
- [ ] Clear error messages if finalization fails

---

## Testing Strategy

### Unit Tests
- `GenerateQuestionsUseCase`: Question generation, idempotency
- `SubmitQuestionAnswersUseCase`: Answer validation, missing answer detection
- `QuestionsPanel`: Modal display, answer state management

### Integration Tests
- Generate questions → Submit answers → Spec finalized (full flow)
- No questions generated → Skip directly to finalization
- Partial answers → Error with clear message
- Network error during submit → Answers preserved for retry

### E2E Tests
- Create ticket → Answer 5 questions → Spec finalized with answers
- Create ticket → Skip questions → Spec finalized without answers
- Create ticket → Answer partially → Error → Complete answers → Success

---

## Rollback Plan

If anything breaks:
1. Revert to commit before this refactor
2. Restore `QuestionRoundsSection`, round-based use cases
3. All user data preserved (no deletion, just code swap)
4. Estimated rollback time: <15 minutes

---

## Success Criteria

✅ **Functionality:**
- Generate up to 5 questions (one-time)
- User answers questions in modal
- Finalize spec with answers
- No round concept visible to users

✅ **Code Quality:**
- 75% less code (800+ → ~200 lines for question logic)
- Linear flow (no complex state machine)
- Clear error handling at each step
- Comprehensive logging

✅ **Robustness:**
- All validation before finalization
- Retry logic on failures
- Edge cases handled explicitly
- No state left in bad limbo states

✅ **UX:**
- Simple, clear flow
- Fast (2 API calls vs 3-6+)
- Clear error messages
- Keyboard navigation works great

---

## Timeline

| Phase | Task | Days | Status |
|-------|------|------|--------|
| 1 | Domain simplification | 1 | 🔜 |
| 2 | Use case refactoring | 1.5 | 🔜 |
| 3 | Controller updates | 0.5 | 🔜 |
| 4 | Frontend simplification | 1.5 | 🔜 |
| 5 | Component updates | 1 | 🔜 |
| 6 | Types cleanup | 0.5 | 🔜 |
| — | Testing + fixes | 1-2 | 🔜 |
| **TOTAL** | | **7-8 days** | 🔜 |

---

## Commits (Planned)

1. `refactor(aec): Remove round-based fields and methods`
2. `refactor(use-cases): Replace round-based with simple GenerateQuestions/SubmitAnswers`
3. `refactor(controller): Simplify endpoints to /questions and /submit-questions`
4. `refactor(frontend): Delete QuestionRoundsSection, create QuestionsPanel`
5. `refactor(types): Remove round-related types`
6. `test(questions): Comprehensive tests for new flow`
7. `docs(questions): Update documentation`

---

## Post-Refactor Checklist

- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] Frontend builds successfully
- [ ] Backend builds successfully
- [ ] Manual testing: Create ticket → Answer questions → Finalized
- [ ] Manual testing: Create ticket → No questions → Finalized
- [ ] Manual testing: Error handling (missing answers, network failure)
- [ ] Verify stack field populated in spec
- [ ] Verify quality score calculated
- [ ] All edge cases tested
- [ ] Code review pass
- [ ] Documentation updated
