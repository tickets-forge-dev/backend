# Fix Token Usage Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix token usage tracking so LLM tokens consumed during spec generation are counted toward team budgets.

**Architecture:** `TechSpecGeneratorImpl` has `callLLM`/`callFastLLM`/`callLLMWithOptions` methods that accept an optional `trackingContext` for token counting. But the 15+ internal generation methods that call them never pass it. Fix by adding an instance-level `_activeTrackingContext` field that entry-point methods (`generate`, `generateWithAnswers`, `generateQuestionsWithContext`, `generateNextQuestion`) set before running, and that the `callLLM` methods use as fallback when no explicit context is passed.

**Tech Stack:** NestJS, TypeScript, Firestore (UsageBudget), Vercel AI SDK

---

## Root Cause

1. `callLLM(systemPrompt, userPrompt, trackingContext?)` has token tracking gated on `if (trackingContext?.userId && usage)` (lines 2251, 2325, 2401)
2. All 15+ internal methods (e.g. `generateProblemStatement`, `generateSolutionFromDescription`, `generateAcceptanceCriteria`) call `this.callLLM(systemPrompt, userPrompt)` **without** the third arg
3. The entry-point methods (`generate()`, `generateWithAnswers()`) don't accept or thread a tracking context
4. Result: the `if` guard always fails, `incrementTokens` is never called, tokens stay at 0

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/tickets/application/services/TechSpecGeneratorImpl.ts` | Add `_activeTrackingContext` field; set/clear in entry methods; use as fallback in `callLLM`/`callFastLLM`/`callLLMWithOptions` |
| Modify | `src/tickets/domain/tech-spec/TechSpecGenerator.ts` | Add optional `trackingContext` to `TechSpecInput`, `generateWithAnswers`, `generateQuestionsWithContext`, `generateNextQuestion` inputs |
| Modify | `src/tickets/application/use-cases/FinalizeSpecUseCase.ts` | Pass `trackingContext` with `teamId` + `userId` (from `aec.createdBy`) |
| Modify | `src/tickets/application/use-cases/GenerateQuestionsUseCase.ts` | Pass `trackingContext` |
| Modify | `src/tickets/application/use-cases/GenerateNextQuestionUseCase.ts` | Pass `trackingContext` |
| Modify | `src/tickets/application/use-cases/StartQuestionRoundUseCase.ts` | Pass `trackingContext` |
| Modify | `src/tickets/application/use-cases/ReEnrichWithQAUseCase.ts` | Pass `trackingContext` |

---

### Task 1: Add `trackingContext` to domain interfaces

**Files:**
- Modify: `src/tickets/domain/tech-spec/TechSpecGenerator.ts:37-52` (TechSpecInput)
- Modify: `src/tickets/domain/tech-spec/TechSpecGenerator.ts:571-584` (generateWithAnswers input)
- Modify: `src/tickets/domain/tech-spec/TechSpecGenerator.ts:529-535` (generateQuestionsWithContext input)
- Modify: `src/tickets/domain/tech-spec/TechSpecGenerator.ts:509-514` (generateNextQuestion input)

- [ ] **Step 1: Add TrackingContext type and add it to TechSpecInput**

In `TechSpecGenerator.ts`, add above `TechSpecInput`:

```typescript
/** Optional tracking context for token usage metering */
export interface LLMTrackingContext {
  userId: string;
  teamId: string;
  ticketId?: string;
  operation?: string;
}
```

Add to `TechSpecInput` interface (after `designReferences`):

```typescript
  trackingContext?: LLMTrackingContext;
```

- [ ] **Step 2: Add trackingContext to generateWithAnswers input**

Add `trackingContext?: LLMTrackingContext;` to the `generateWithAnswers` input type (after `apiContext`).

- [ ] **Step 3: Add trackingContext to generateQuestionsWithContext input**

Add `trackingContext?: LLMTrackingContext;` to the `generateQuestionsWithContext` input type (after `roundNumber`).

- [ ] **Step 4: Add trackingContext to generateNextQuestion input**

Add `trackingContext?: LLMTrackingContext;` to the `generateNextQuestion` input type (after `previousQAs`).

- [ ] **Step 5: Commit**

```bash
git add src/tickets/domain/tech-spec/TechSpecGenerator.ts
git commit -m "feat: add LLMTrackingContext to TechSpecGenerator interfaces"
```

---

### Task 2: Wire tracking context into TechSpecGeneratorImpl

**Files:**
- Modify: `src/tickets/application/services/TechSpecGeneratorImpl.ts`

- [ ] **Step 1: Add `_activeTrackingContext` field**

In the class body (after the existing private fields around line 558), add:

```typescript
  /** Active tracking context — set by entry-point methods for callLLM fallback */
  private _activeTrackingContext?: { userId?: string; teamId?: string; ticketId?: string; operation?: string };
```

- [ ] **Step 2: Update `callLLM` to use fallback context**

At line 2226, change:

```typescript
    trackingContext?: { userId?: string; teamId?: string; ticketId?: string; operation?: string },
```

The body starting at line 2251 already uses `trackingContext`. Add fallback at the top of the method body (after the `if (!this.llmModel)` check):

```typescript
    // Use instance-level tracking context as fallback
    const effectiveContext = trackingContext ?? this._activeTrackingContext;
```

Then replace all references to `trackingContext` within `callLLM` with `effectiveContext`.

- [ ] **Step 3: Update `callFastLLM` to use fallback context**

Same pattern: add `const effectiveContext = trackingContext ?? this._activeTrackingContext;` after the null model check, and replace `trackingContext` with `effectiveContext` in the method body.

Also update the fallback to main model:
```typescript
return this.callLLM(systemPrompt, userPrompt, effectiveContext);
```

- [ ] **Step 4: Update `callLLMWithOptions` to use fallback context**

Same pattern for `callLLMWithOptions` (line 2371).

- [ ] **Step 5: Set/clear context in `generate()`**

In `generate()` (line 604), add at the very start:

```typescript
    this._activeTrackingContext = input.trackingContext ? {
      userId: input.trackingContext.userId,
      teamId: input.trackingContext.teamId,
      ticketId: input.trackingContext.ticketId,
      operation: 'tech_spec_generation',
    } : undefined;
    try {
```

And wrap the existing body in the try block, adding a finally:

```typescript
    } finally {
      this._activeTrackingContext = undefined;
    }
```

- [ ] **Step 6: Set/clear context in `generateWithAnswers()`**

Same pattern in `generateWithAnswers()` (line 2977). The method already has a `try` block — set `_activeTrackingContext` before it:

```typescript
    this._activeTrackingContext = input.trackingContext ? {
      userId: input.trackingContext.userId,
      teamId: input.trackingContext.teamId,
      ticketId: input.trackingContext.ticketId,
      operation: 'tech_spec_generation_with_answers',
    } : undefined;
```

Add a `finally` block that clears it.

- [ ] **Step 7: Set/clear context in `generateQuestionsWithContext()`**

Same pattern in `generateQuestionsWithContext()` (line 2877), with operation `'question_generation'`.

- [ ] **Step 8: Set/clear context in `generateNextQuestion()`**

Same pattern in `generateNextQuestion()` (line 2832), with operation `'next_question_generation'`.

- [ ] **Step 9: Commit**

```bash
git add src/tickets/application/services/TechSpecGeneratorImpl.ts
git commit -m "fix: wire tracking context fallback into callLLM methods for token counting"
```

---

### Task 3: Pass tracking context from use cases

**Files:**
- Modify: `src/tickets/application/use-cases/FinalizeSpecUseCase.ts`
- Modify: `src/tickets/application/use-cases/GenerateQuestionsUseCase.ts`
- Modify: `src/tickets/application/use-cases/GenerateNextQuestionUseCase.ts`
- Modify: `src/tickets/application/use-cases/StartQuestionRoundUseCase.ts`
- Modify: `src/tickets/application/use-cases/ReEnrichWithQAUseCase.ts`

- [ ] **Step 1: FinalizeSpecUseCase — pass trackingContext to generateWithAnswers**

In `generateSpecWithRetry()` (line 382), add `trackingContext` to the object passed to `this.techSpecGenerator.generateWithAnswers()`. The `aecId` and `teamId` are available as local variables. Get `userId` from the AEC entity.

First, add `aecId` and `teamId` parameters to `generateSpecWithRetry`:

```typescript
  private async generateSpecWithRetry(
    title: string,
    description: string | null,
    context: any,
    allAnswers: Array<{ questionId: string; answer: string | string[] }>,
    ticketType?: 'feature' | 'bug' | 'task',
    reproductionSteps?: any[],
    includeWireframes?: boolean,
    includeApiSpec?: boolean,
    wireframeContext?: string,
    wireframeImageUrls?: string[],
    apiContext?: string,
    trackingContext?: { userId: string; teamId: string; ticketId: string },
  ): Promise<any> {
```

Then in the call to `generateWithAnswers` add:

```typescript
          trackingContext: trackingContext ? {
            userId: trackingContext.userId,
            teamId: trackingContext.teamId,
            ticketId: trackingContext.ticketId,
          } : undefined,
```

Update the call site in `execute()` (line 122) to pass:

```typescript
      { userId: aec.createdBy, teamId: command.teamId, ticketId: command.aecId },
```

Import `LLMTrackingContext` from the domain interface.

- [ ] **Step 2: GenerateQuestionsUseCase — pass trackingContext**

In the call to `this.techSpecGenerator.generateQuestionsWithContext()` (line 282), add:

```typescript
          trackingContext: {
            userId: aec.createdBy,
            teamId: command.teamId,
            ticketId: command.aecId,
          },
```

Need to pass `aec` reference into `generateQuestionsWithRetry` or extract `createdBy` earlier.

- [ ] **Step 3: StartQuestionRoundUseCase — pass trackingContext**

Same pattern in `generateQuestionsWithRetry()` (line 294):

```typescript
          trackingContext: {
            userId: aec.createdBy,
            teamId: command.teamId,
            ticketId: command.aecId,
          },
```

- [ ] **Step 4: GenerateNextQuestionUseCase — pass trackingContext**

In the call to `this.techSpecGenerator.generateNextQuestion()` (line 94), add:

```typescript
          trackingContext: {
            userId: aec.createdBy,
            teamId: command.teamId,
            ticketId: command.aecId,
          },
```

- [ ] **Step 5: ReEnrichWithQAUseCase — pass trackingContext**

In the call to `this.techSpecGenerator.generateWithAnswers()` (line 117), add:

```typescript
          trackingContext: {
            userId: aec.createdBy,
            teamId: command.teamId,
            ticketId: command.ticketId,
          },
```

- [ ] **Step 6: Commit**

```bash
git add src/tickets/application/use-cases/FinalizeSpecUseCase.ts \
        src/tickets/application/use-cases/GenerateQuestionsUseCase.ts \
        src/tickets/application/use-cases/GenerateNextQuestionUseCase.ts \
        src/tickets/application/use-cases/StartQuestionRoundUseCase.ts \
        src/tickets/application/use-cases/ReEnrichWithQAUseCase.ts
git commit -m "fix: pass tracking context from use cases to enable token counting"
```

---

### Task 4: Build and verify

- [ ] **Step 1: Run TypeScript compilation**

```bash
cd /home/forge/Documents/forge/backend/backend && npx tsc --noEmit
```

Expected: No compilation errors.

- [ ] **Step 2: Run existing tests**

```bash
cd /home/forge/Documents/forge/backend/backend && npx jest --passWithNoTests 2>&1 | tail -20
```

Expected: All existing tests pass (or no tests affected).

- [ ] **Step 3: Final commit if any fixes needed**

Fix any compilation or test issues, then commit.
