'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWizardStore } from '@/tickets/stores/generation-wizard.store';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';
import {
  AlertTriangle,
  Loader2,
  CheckCircle2,
  ChevronLeft,
  Check,
  FileCode2,
  Lightbulb,
  ListChecks,
  Layers,
  ArrowRight,
  Plus,
  FlaskConical,
} from 'lucide-react';
import { normalizeProblemStatement } from '@/tickets/utils/normalize-problem-statement';
import { SpecGenerationProgressDialog } from './SpecGenerationProgressDialog';

/** Extract readable solution text */
function extractSolutionText(sol: unknown): string {
  if (!sol) return '';
  if (typeof sol === 'string') return sol;
  if (Array.isArray(sol)) return sol.filter((s) => typeof s === 'string').join('\n');
  if (typeof sol === 'object' && sol !== null) {
    const obj = sol as Record<string, unknown>;
    if (typeof obj.overview === 'string') return obj.overview;
    if (Array.isArray(obj.steps)) {
      return obj.steps
        .map((s: any) => (typeof s === 'string' ? s : s?.description || ''))
        .filter(Boolean)
        .join('\n');
    }
  }
  return '';
}

/** Count solution steps */
function countSolutionSteps(sol: unknown): number {
  if (!sol) return 0;
  if (Array.isArray(sol)) return sol.length;
  if (typeof sol === 'object' && sol !== null) {
    const obj = sol as Record<string, unknown>;
    if (Array.isArray(obj.steps)) return obj.steps.length;
  }
  return 0;
}

/**
 * Stage 3: Draft Review with One-at-a-Time Clarification Questions
 *
 * Flow:
 * 1. Create draft AEC (if needed)
 * 2. Generate up to 5 clarification questions
 * 3. Show ONE question at a time with LLM options + "type your own"
 * 4. After all questions → auto-submit → finalize
 * 5. Show unified summary with actions (merged Stage 3 + Stage 4)
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
    generateQuestions,
    submitQuestionAnswers,
    answerQuestion,
    setError,
    reset,
    input,
  } = useWizardStore();

  const [localError, setLocalError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [customAnswer, setCustomAnswer] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
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
        const storeState = useWizardStore.getState();

        // Read fresh store state (not stale closure) to decide if draft exists
        if (!storeState.draftAecId) {
          await confirmContextContinue();
          const newState = useWizardStore.getState();
          if (!newState.draftAecId) {
            // confirmContextContinue set an error in the store — don't proceed
            return;
          }
          // Auto-finalize path (maxRounds=0) may have already set spec — skip questions
          if (newState.spec) {
            return;
          }
        }
        await generateQuestions();
      } catch (err) {
        console.error('[Stage3Draft init] Error:', err);
        setLocalError(err instanceof Error ? err.message : 'Failed to initialize');
      }
    };

    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftAecId, clarificationQuestions.length, spec, confirmContextContinue, generateQuestions, retryCount]);

  // Auto-submit after all questions are answered
  const answeredCount = clarificationQuestions.filter(
    (q) => questionAnswers[q.id] !== undefined && questionAnswers[q.id] !== ''
  ).length;
  const allAnswered = clarificationQuestions.length > 0 && answeredCount === clarificationQuestions.length;

  useEffect(() => {
    if (allAnswered && !autoSubmitRef.current && !spec && roundStatus === 'idle') {
      autoSubmitRef.current = true;
      // Small delay so the "all answered" UI renders before the submit overlay kicks in
      const timer = setTimeout(() => {
        submitQuestionAnswers().catch((err) => {
          const errorMsg = err instanceof Error ? err.message : 'Failed to finalize';
          setLocalError(errorMsg);
          setError(errorMsg);
          autoSubmitRef.current = false; // Allow retry
        });
      }, 600);
      return () => clearTimeout(timer);
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
        {(error || localError) ? (
          <div className="text-center py-12 space-y-4">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto" />
            <p className="text-sm text-red-600 dark:text-red-400">
              {error || localError}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" onClick={goBackToInput}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setLocalError(null);
                  setError(null);
                  initRef.current = false;
                  setRetryCount((c) => c + 1);
                }}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Creating ticket draft...
            </p>
          </div>
        )}
      </div>
    );
  }

  // Derive spec stats
  const fileChangesCount = spec?.fileChanges?.length ?? 0;
  const acCount = spec?.acceptanceCriteria?.length ?? 0;
  const solutionSteps = countSolutionSteps(spec?.solution);
  const testCount =
    (spec?.testPlan?.unitTests?.length ?? 0) +
    (spec?.testPlan?.integrationTests?.length ?? 0) +
    (spec?.testPlan?.edgeCases?.length ?? 0);
  const apiCount = spec?.apiChanges?.endpoints?.length ?? 0;
  const ps = spec?.problemStatement ? normalizeProblemStatement(spec.problemStatement) : null;
  const solutionText = extractSolutionText(spec?.solution);

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

      {/* ─── Unified Summary (replaces Stage 3 spec view + Stage 4) ─── */}
      {spec && (
        <>
          {/* Success Header */}
          <div className="text-center pt-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500/10 mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-1">
              Ticket Ready
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              {input.title}
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Quality', value: spec.qualityScore !== undefined ? `${Math.round(spec.qualityScore)}%` : '—', color: (spec.qualityScore ?? 0) >= 75 ? 'text-green-600 dark:text-green-400' : (spec.qualityScore ?? 0) >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400' },
              { label: 'Files', value: fileChangesCount, color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Criteria', value: acCount, color: 'text-purple-600 dark:text-purple-400' },
              { label: 'Tests', value: testCount, color: 'text-cyan-600 dark:text-cyan-400' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-4 py-3 text-center">
                <p className={`text-lg font-semibold ${stat.color}`}>{stat.value}</p>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Content Sections */}
          <div className="space-y-4">
            {/* Problem Statement */}
            {ps?.narrative && (
              <div className="rounded-lg border border-[var(--border-subtle)] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-medium text-[var(--text)]">Problem</h3>
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-3">
                  {ps.narrative}
                </p>
              </div>
            )}

            {/* Solution */}
            {solutionText && (
              <div className="rounded-lg border border-[var(--border-subtle)] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="h-4 w-4 text-blue-500" />
                  <h3 className="text-sm font-medium text-[var(--text)]">Solution</h3>
                  {solutionSteps > 0 && (
                    <span className="text-[11px] text-[var(--text-tertiary)]">
                      {solutionSteps} step{solutionSteps !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-3 whitespace-pre-line">
                  {solutionText}
                </p>
              </div>
            )}

            {/* File Changes + API + Tests — compact row */}
            {(fileChangesCount > 0 || apiCount > 0 || testCount > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {fileChangesCount > 0 && (
                  <div className="rounded-lg border border-[var(--border-subtle)] p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <FileCode2 className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-xs font-medium text-[var(--text)]">File Changes</span>
                    </div>
                    <div className="space-y-0.5">
                      {spec.fileChanges!.slice(0, 3).map((f: any, i: number) => (
                        <p key={i} className="text-[11px] text-[var(--text-tertiary)] font-mono truncate">
                          {f.path}
                        </p>
                      ))}
                      {fileChangesCount > 3 && (
                        <p className="text-[11px] text-[var(--text-tertiary)]">
                          +{fileChangesCount - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {apiCount > 0 && (
                  <div className="rounded-lg border border-[var(--border-subtle)] p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Layers className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-xs font-medium text-[var(--text)]">API Endpoints</span>
                    </div>
                    <div className="space-y-0.5">
                      {spec.apiChanges!.endpoints!.slice(0, 3).map((ep: any, i: number) => (
                        <p key={i} className="text-[11px] text-[var(--text-tertiary)] font-mono truncate">
                          <span className="text-blue-500">{ep.method}</span> {ep.route}
                        </p>
                      ))}
                      {apiCount > 3 && (
                        <p className="text-[11px] text-[var(--text-tertiary)]">
                          +{apiCount - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {testCount > 0 && (
                  <div className="rounded-lg border border-[var(--border-subtle)] p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <FlaskConical className="h-3.5 w-3.5 text-cyan-500" />
                      <span className="text-xs font-medium text-[var(--text)]">Test Plan</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-tertiary)]">
                      {spec.testPlan?.unitTests?.length ?? 0} unit, {spec.testPlan?.integrationTests?.length ?? 0} integration, {spec.testPlan?.edgeCases?.length ?? 0} edge cases
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Acceptance Criteria */}
            {acCount > 0 && (
              <div className="rounded-lg border border-[var(--border-subtle)] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ListChecks className="h-4 w-4 text-purple-500" />
                  <h3 className="text-sm font-medium text-[var(--text)]">Acceptance Criteria</h3>
                  <span className="text-[11px] text-[var(--text-tertiary)]">{acCount}</span>
                </div>
                <div className="space-y-1">
                  {spec.acceptanceCriteria!.slice(0, 4).map((ac: any, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                      <p className="text-[12px] text-[var(--text-secondary)] leading-snug">
                        {typeof ac === 'string'
                          ? ac
                          : ac.given
                            ? `Given ${ac.given}, when ${ac.when}, then ${ac.then}`
                            : JSON.stringify(ac)
                        }
                      </p>
                    </div>
                  ))}
                  {acCount > 4 && (
                    <p className="text-[11px] text-[var(--text-tertiary)] ml-5">
                      +{acCount - 4} more criteria
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
            <Button variant="outline" onClick={reset}>
              <Plus className="h-4 w-4 mr-2" />
              Create Another
            </Button>
            <Button
              onClick={() => {
                if (draftAecId) router.push(`/tickets/${draftAecId}`);
              }}
            >
              View Ticket
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </>
      )}

      {/* Detailed Progress Dialog for Generating / Submitting States */}
      <SpecGenerationProgressDialog
        isVisible={!spec && (isGenerating || isSubmitting)}
        isSubmitting={isSubmitting}
        isGenerating={isGenerating}
      />

      {/* All questions answered — transitioning to spec generation */}
      {!spec && !isGenerating && !isSubmitting && allAnswered && clarificationQuestions.length > 0 && (
        <div className="text-center py-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
          <p className="text-sm text-[var(--text-secondary)]">
            Generating your specification...
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              autoSubmitRef.current = false;
              submitQuestionAnswers().catch((err) => {
                const errorMsg = err instanceof Error ? err.message : 'Failed to finalize';
                setLocalError(errorMsg);
                setError(errorMsg);
              });
            }}
          >
            Retry
          </Button>
        </div>
      )}

      {/* One-at-a-Time Question Flow (only when NOT all answered) */}
      {!spec && !isGenerating && !isSubmitting && !allAnswered && currentQuestion && (
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
