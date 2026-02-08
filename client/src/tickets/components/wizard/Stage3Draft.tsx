'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWizardStore } from '@/tickets/stores/generation-wizard.store';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';
import { AlertTriangle, Loader2, CheckCircle2, ChevronLeft, Check } from 'lucide-react';
import { normalizeProblemStatement } from '@/tickets/utils/normalize-problem-statement';

/** Recursively extract the first meaningful string from a deeply nested object */
function extractText(value: unknown, maxDepth = 5): string {
  if (!value) return '';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    // If it looks like JSON, parse and try to extract readable text
    if ((trimmed.startsWith('{') || trimmed.startsWith('[')) && maxDepth > 0) {
      try {
        const parsed = JSON.parse(trimmed);
        const result = extractText(parsed, maxDepth - 1);
        if (result.length > 10) return result;
      } catch { /* not JSON */ }
      // JSON string but nothing readable extracted — don't return raw JSON
      return '';
    }
    return value;
  }
  if (maxDepth <= 0) return '';
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    for (const key of ['narrative', 'description', 'summary', 'overview', 'problem', 'text', 'whyItMatters', 'context']) {
      if (typeof obj[key] === 'string' && (obj[key] as string).length > 10) return obj[key] as string;
    }
    for (const key of Object.keys(obj)) {
      const result = extractText(obj[key], maxDepth - 1);
      if (result.length > 10) return result;
    }
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const result = extractText(item, maxDepth - 1);
      if (result.length > 10) return result;
    }
  }
  return '';
}

/** Extract readable solution text */
function extractSolutionText(sol: unknown): string {
  if (!sol) return '';
  if (typeof sol === 'string') return sol;
  if (Array.isArray(sol)) return sol.filter((s) => typeof s === 'string').join('\n');
  if (typeof sol === 'object' && sol !== null) {
    const obj = sol as Record<string, unknown>;
    if (typeof obj.overview === 'string') return obj.overview;
    return extractText(sol);
  }
  return '';
}

/**
 * Stage 3: Draft Review with One-at-a-Time Clarification Questions
 *
 * Flow:
 * 1. Create draft AEC (if needed)
 * 2. Generate up to 5 clarification questions
 * 3. Show ONE question at a time with LLM options + "type your own"
 * 4. After all questions → auto-submit → finalize
 * 5. Show spec summary → "Continue to Review"
 */
export function Stage3Draft() {
  const router = useRouter();
  const {
    draftAecId,
    spec,
    clarificationQuestions,
    questionAnswers,
    roundStatus,
    error,
    goBackToInput,
    confirmContextContinue,
    confirmSpecContinue,
    generateQuestions,
    submitQuestionAnswers,
    answerQuestion,
    setError,
  } = useWizardStore();

  const [localError, setLocalError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [customAnswer, setCustomAnswer] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const initRef = useRef(false);
  const autoSubmitRef = useRef(false);

  // Step 1: Create draft (if needed) then generate questions
  useEffect(() => {
    if (initRef.current) return;
    // Already have questions or spec — nothing to do
    if (clarificationQuestions.length > 0 || spec) return;

    initRef.current = true;

    const init = async () => {
      try {
        // Create draft AEC if we don't have one yet
        if (!draftAecId) {
          await confirmContextContinue();
          // Check if draft was created (confirmContextContinue sets draftAecId in store)
          const newState = useWizardStore.getState();
          if (!newState.draftAecId) {
            // confirmContextContinue set an error in the store — don't proceed
            return;
          }
        }
        // Generate questions
        await generateQuestions();
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : 'Failed to initialize');
      }
    };

    init();
  }, [draftAecId, clarificationQuestions.length, spec, confirmContextContinue, generateQuestions]);

  // Auto-submit after all questions are answered
  const answeredCount = clarificationQuestions.filter(
    (q) => questionAnswers[q.id] !== undefined && questionAnswers[q.id] !== ''
  ).length;
  const allAnswered = clarificationQuestions.length > 0 && answeredCount === clarificationQuestions.length;

  useEffect(() => {
    if (allAnswered && !autoSubmitRef.current && !spec && roundStatus === 'idle') {
      autoSubmitRef.current = true;
      submitQuestionAnswers().catch((err) => {
        const errorMsg = err instanceof Error ? err.message : 'Failed to finalize';
        setLocalError(errorMsg);
        setError(errorMsg);
      });
    }
  }, [allAnswered, spec, roundStatus, submitQuestionAnswers, setError]);

  const isSubmitting = roundStatus === 'submitting' || roundStatus === 'finalizing';
  const isGenerating = roundStatus === 'generating';

  const currentQuestion = clarificationQuestions[currentIndex] ?? null;
  const currentAnswer = currentQuestion ? questionAnswers[currentQuestion.id] : undefined;
  const hasAnswer = currentAnswer !== undefined && currentAnswer !== '';

  // Select a predefined option
  const selectOption = useCallback((option: string) => {
    if (!currentQuestion) return;
    setShowCustomInput(false);
    setCustomAnswer('');
    answerQuestion(currentQuestion.id, option);

    // Auto-advance after brief visual feedback
    setTimeout(() => {
      if (currentIndex < clarificationQuestions.length - 1) {
        setCurrentIndex((i) => i + 1);
        setShowCustomInput(false);
        setCustomAnswer('');
      }
      // If last question, the auto-submit useEffect will trigger
    }, 400);
  }, [currentQuestion, currentIndex, clarificationQuestions.length, answerQuestion]);

  // Submit custom typed answer
  const submitCustom = useCallback(() => {
    if (!currentQuestion || !customAnswer.trim()) return;
    answerQuestion(currentQuestion.id, customAnswer.trim());
    setShowCustomInput(false);

    // Auto-advance
    setTimeout(() => {
      if (currentIndex < clarificationQuestions.length - 1) {
        setCurrentIndex((i) => i + 1);
        setShowCustomInput(false);
        setCustomAnswer('');
      }
    }, 400);
  }, [currentQuestion, customAnswer, currentIndex, clarificationQuestions.length, answerQuestion]);

  // Skip current question and advance
  const skipQuestion = useCallback(() => {
    if (!currentQuestion) return;
    answerQuestion(currentQuestion.id, '_skipped');
    if (currentIndex < clarificationQuestions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setShowCustomInput(false);
      setCustomAnswer('');
    }
  }, [currentQuestion, currentIndex, clarificationQuestions.length, answerQuestion]);

  // Skip all questions
  const handleSkipAll = async () => {
    // Mark all unanswered questions as skipped
    for (const q of clarificationQuestions) {
      if (!questionAnswers[q.id] || questionAnswers[q.id] === '') {
        answerQuestion(q.id, '_skipped');
      }
    }
    try {
      setLocalError(null);
      await submitQuestionAnswers();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to finalize';
      setLocalError(errorMsg);
      setError(errorMsg);
    }
  };

  // Go to previous question
  const goBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setShowCustomInput(false);
      setCustomAnswer('');
    }
  };

  // Loading: waiting for draft creation
  if (!draftAecId) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Creating ticket draft...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Error Display */}
      {(error || localError) && (
        <Card className="p-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900 dark:text-red-200">
                {error || localError}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Spec Summary (shown after finalization) */}
      {spec && (
        <>
          <div className="text-center">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400 mx-auto mb-3" />
            <h2 className="text-xl font-medium text-gray-900 dark:text-gray-50 mb-1">
              Specification Ready
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your technical specification has been generated.
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 dark:text-gray-50">
                Generated Specification
              </h3>
              {spec.qualityScore !== undefined && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Quality: {Math.round(spec.qualityScore)}/100
                </span>
              )}
            </div>

            {/* Problem Statement */}
            {spec.problemStatement && (() => {
              const ps = normalizeProblemStatement(spec.problemStatement);
              return ps.narrative ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Problem</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {ps.narrative}
                  </p>
                </div>
              ) : null;
            })()}

            {/* Solution */}
            {spec.solution && (
              <div className="space-y-1 pt-3 border-t border-gray-200 dark:border-gray-800">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Solution</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {extractSolutionText(spec.solution)}
                </p>
              </div>
            )}

            {/* File Changes Count */}
            {spec.fileChanges && Array.isArray(spec.fileChanges) && spec.fileChanges.length > 0 && (
              <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {spec.fileChanges.length} file change{spec.fileChanges.length !== 1 ? 's' : ''} identified
                </p>
              </div>
            )}
          </div>

          {/* Actions after finalization */}
          <div className="flex gap-3 justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button variant="outline" onClick={goBackToInput}>
              Start Over
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  if (draftAecId) router.push(`/tickets/${draftAecId}`);
                }}
              >
                View Full Ticket
              </Button>
              <Button onClick={confirmSpecContinue}>
                Continue to Review
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Generating / Submitting States */}
      {!spec && (isGenerating || isSubmitting) && (
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 text-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isSubmitting ? 'Generating specification...' : 'Generating clarification questions...'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {isSubmitting ? 'Analyzing your answers and building the spec' : 'This usually takes a few seconds'}
          </p>
        </div>
      )}

      {/* One-at-a-Time Question Flow */}
      {!spec && !isGenerating && !isSubmitting && currentQuestion && (
        <>
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>Question {currentIndex + 1} of {clarificationQuestions.length}</span>
              <button
                type="button"
                onClick={handleSkipAll}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                Skip all questions
              </button>
            </div>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentIndex + 1) / clarificationQuestions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="space-y-5">
            <div className="space-y-2">
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-50">
                {currentQuestion.question}
              </h3>
              {currentQuestion.context && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {currentQuestion.context}
                </p>
              )}
            </div>

            {/* Options or Free-Text Input */}
            <div className="space-y-2">
              {(currentQuestion.options || []).length > 0 ? (
                <>
                  {/* LLM-provided options */}
                  {(currentQuestion.options || []).map((option, idx) => {
                    const isSelected = currentAnswer === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => selectOption(option)}
                        className={`
                          w-full flex items-center gap-3 p-3.5 rounded-lg text-left
                          transition-all border-2
                          ${isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                            : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-950'
                          }
                        `}
                      >
                        <div
                          className={`
                            w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                            transition-all
                            ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-600'}
                          `}
                        >
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                        <span className={`text-sm ${isSelected ? 'text-gray-900 dark:text-gray-50 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                          {idx + 1}. {option}
                        </span>
                      </button>
                    );
                  })}

                  {/* "Type your own answer" option */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomInput(true);
                    }}
                    className={`
                      w-full flex items-center gap-3 p-3.5 rounded-lg text-left
                      transition-all border-2
                      ${showCustomInput || (hasAnswer && !(currentQuestion.options || []).includes(currentAnswer as string))
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-950'
                      }
                    `}
                  >
                    <div
                      className={`
                        w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                        transition-all
                        ${showCustomInput || (hasAnswer && !(currentQuestion.options || []).includes(currentAnswer as string))
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300 dark:border-gray-600'
                        }
                      `}
                    >
                      {(showCustomInput || (hasAnswer && !(currentQuestion.options || []).includes(currentAnswer as string))) && (
                        <Check size={12} className="text-white" />
                      )}
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {(currentQuestion.options || []).length + 1}. Type your own answer
                    </span>
                  </button>

                  {/* Custom Answer Input (expandable) */}
                  {showCustomInput && (
                    <div className="pl-8 space-y-2">
                      <input
                        type="text"
                        value={customAnswer}
                        onChange={(e) => setCustomAnswer(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && customAnswer.trim()) {
                            submitCustom();
                          }
                        }}
                        placeholder="Type your answer..."
                        autoFocus
                        className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                      <Button
                        size="sm"
                        onClick={submitCustom}
                        disabled={!customAnswer.trim()}
                      >
                        Confirm
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                /* No options — show direct text input */
                <div className="space-y-3">
                  <input
                    type="text"
                    value={customAnswer || (typeof currentAnswer === 'string' ? currentAnswer : '')}
                    onChange={(e) => setCustomAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customAnswer.trim()) {
                        submitCustom();
                      }
                    }}
                    placeholder="Type your answer..."
                    autoFocus
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  <Button
                    size="sm"
                    onClick={submitCustom}
                    disabled={!customAnswer.trim()}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Question Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
            {currentIndex > 0 ? (
              <Button variant="outline" size="sm" onClick={goBack}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={goBackToInput}>
                Back
              </Button>
            )}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {answeredCount} of {clarificationQuestions.length} answered
              </span>
              <Button variant="ghost" size="sm" onClick={skipQuestion}>
                Skip
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Waiting for questions (no questions yet, not generating) */}
      {!spec && !isGenerating && !isSubmitting && clarificationQuestions.length === 0 && (
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 text-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Preparing questions...
          </p>
        </div>
      )}
    </div>
  );
}
