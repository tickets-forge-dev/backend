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
  Info,
  ChevronDown,
  ChevronUp,
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
 * Stage 3: Draft Review with Dynamic, Conversational Clarification Questions
 *
 * Flow:
 * 1. Create draft AEC (if needed)
 * 2. Fetch first question from LLM (+ initial assumptions)
 * 3. Show ONE question at a time; after each answer, fetch next from LLM
 * 4. LLM stops early when it has enough info → auto-submit → finalize
 * 5. Show unified summary with actions (merged Stage 3 + Stage 4)
 */
export function Stage3Draft() {
  const router = useRouter();
  const {
    draftAecId,
    spec,
    clarificationQuestions,
    questionAnswers,
    assumptions,
    questionsComplete,
    questionReasoning,
    roundStatus,
    error,
    goBackToInput,
    confirmContextContinue,
    fetchNextQuestion,
    submitQuestionAnswers,
    answerQuestion,
    setError,
    reset,
    input,
  } = useWizardStore();

  const [localError, setLocalError] = useState<string | null>(null);
  const [customAnswer, setCustomAnswer] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const initRef = useRef(false);
  const autoSubmitRef = useRef(false);
  const soundPlayedRef = useRef(false);

  // The current question is always the last one in the list (the newest)
  const currentQuestion = clarificationQuestions.length > 0
    ? clarificationQuestions[clarificationQuestions.length - 1]
    : null;
  const currentAnswer = currentQuestion ? questionAnswers[currentQuestion.id] : undefined;
  const hasAnswer = currentAnswer !== undefined && currentAnswer !== '';

  // Play a subtle chime when spec generation completes
  useEffect(() => {
    if (spec && !soundPlayedRef.current) {
      soundPlayedRef.current = true;
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } catch {
        // Silently fail if AudioContext not available
      }
    }
  }, [spec]);

  // Step 1: Create draft (if needed) then fetch first/next question
  useEffect(() => {
    if (initRef.current) return;
    if (spec || questionsComplete) return;

    // If we already have questions, check if they're all answered (resume case)
    // If so, we need to fetch the next one. If not, show the current unanswered one.
    if (clarificationQuestions.length > 0) {
      const allAnswered = clarificationQuestions.every(
        (q) => questionAnswers[q.id] !== undefined && questionAnswers[q.id] !== ''
      );
      if (!allAnswered) return; // Still have an unanswered question to show
      // All answered — fetch the next question from LLM
      initRef.current = true;
      fetchNextQuestion().catch((err) => {
        console.error('[Stage3Draft resume] Error fetching next question:', err);
        setLocalError(err instanceof Error ? err.message : 'Failed to load next question');
      });
      return;
    }

    initRef.current = true;

    const init = async () => {
      try {
        const storeState = useWizardStore.getState();

        if (!storeState.draftAecId) {
          await confirmContextContinue();
          const newState = useWizardStore.getState();
          if (!newState.draftAecId) return;
          if (newState.spec) return;
        }
        // Fetch first question (no previous answers)
        await fetchNextQuestion();
      } catch (err) {
        console.error('[Stage3Draft init] Error:', err);
        setLocalError(err instanceof Error ? err.message : 'Failed to initialize');
      }
    };

    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftAecId, clarificationQuestions.length, spec, questionsComplete, confirmContextContinue, fetchNextQuestion, retryCount]);

  // Auto-submit when questionsComplete is set (LLM said it has enough info)
  useEffect(() => {
    if (questionsComplete && !autoSubmitRef.current && !spec && roundStatus === 'idle') {
      autoSubmitRef.current = true;
      const timer = setTimeout(() => {
        submitQuestionAnswers().catch((err) => {
          const errorMsg = err instanceof Error ? err.message : 'Failed to finalize';
          setLocalError(errorMsg);
          setError(errorMsg);
          autoSubmitRef.current = false;
        });
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [questionsComplete, spec, roundStatus, submitQuestionAnswers, setError]);

  const isSubmitting = roundStatus === 'submitting' || roundStatus === 'finalizing';
  const isGenerating = roundStatus === 'generating';

  // Select a predefined option → answer + fetch next question
  const selectOption = useCallback((option: string) => {
    if (!currentQuestion) return;
    setShowCustomInput(false);
    setCustomAnswer('');
    answerQuestion(currentQuestion.id, option);
    // Fetch next question from LLM (it will see this answer)
    fetchNextQuestion();
  }, [currentQuestion, answerQuestion, fetchNextQuestion]);

  // Submit custom typed answer → answer + fetch next question
  const submitCustom = useCallback(() => {
    if (!currentQuestion || !customAnswer.trim()) return;
    answerQuestion(currentQuestion.id, customAnswer.trim());
    setShowCustomInput(false);
    setCustomAnswer('');
    fetchNextQuestion();
  }, [currentQuestion, customAnswer, answerQuestion, fetchNextQuestion]);

  // Skip current question → answer as skipped + fetch next
  const skipQuestion = useCallback(() => {
    if (!currentQuestion) return;
    answerQuestion(currentQuestion.id, '_skipped');
    setShowCustomInput(false);
    setCustomAnswer('');
    fetchNextQuestion();
  }, [currentQuestion, answerQuestion, fetchNextQuestion]);

  // Skip all questions → submit with skipped answers
  const handleSkipAll = async () => {
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
        isVisible={!spec && (isSubmitting)}
        isSubmitting={isSubmitting}
        isGenerating={false}
      />

      {/* Questions complete — transitioning to spec generation */}
      {!spec && !isGenerating && !isSubmitting && questionsComplete && (
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

      {/* Dynamic One-at-a-Time Question Flow */}
      {!spec && !isSubmitting && !questionsComplete && (currentQuestion || isGenerating) && (
        <>
          {/* Assumptions Block (collapsible) */}
          {assumptions.length > 0 && (
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
              <button
                type="button"
                onClick={() => setShowAssumptions(!showAssumptions)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-left"
              >
                <Info className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                <span className="text-xs text-[var(--text-tertiary)] flex-1">
                  {assumptions.length} assumption{assumptions.length !== 1 ? 's' : ''} (will be used unless your answers say otherwise)
                </span>
                {showAssumptions
                  ? <ChevronUp className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                  : <ChevronDown className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                }
              </button>
              {showAssumptions && (
                <div className="px-4 pb-3 space-y-1">
                  {assumptions.map((a, i) => (
                    <p key={i} className="text-[11px] text-[var(--text-tertiary)] pl-5">
                      &bull; {a}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Loading state between questions */}
          {isGenerating && (
            <div className="text-center py-12 space-y-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {clarificationQuestions.length === 0 ? 'Analyzing your ticket...' : 'Generating next question...'}
              </p>
              {questionReasoning && clarificationQuestions.length > 0 && (
                <p className="text-xs text-[var(--text-tertiary)] max-w-md mx-auto italic leading-relaxed">
                  {questionReasoning}
                </p>
              )}
            </div>
          )}

          {/* Current Question */}
          {!isGenerating && currentQuestion && !hasAnswer && (
            <>
              {/* Dynamic Progress Indicator */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>Question {clarificationQuestions.length}</span>
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
                    style={{ width: `${Math.min((clarificationQuestions.length / 5) * 100, 100)}%` }}
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
                          setCustomAnswer('');
                        }}
                        className={`
                          w-full flex items-center gap-3 p-3.5 rounded-lg text-left
                          transition-all border-2
                          ${showCustomInput
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                            : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-950'
                          }
                        `}
                      >
                        <div
                          className={`
                            w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                            transition-all
                            ${showCustomInput
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300 dark:border-gray-600'
                            }
                          `}
                        >
                          {showCustomInput && <Check size={12} className="text-white" />}
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
                <Button variant="outline" size="sm" onClick={goBackToInput}>
                  Back
                </Button>
                <Button variant="ghost" size="sm" onClick={skipQuestion}>
                  Skip
                </Button>
              </div>
            </>
          )}
        </>
      )}

      {/* Waiting for first question (no questions yet, not generating) */}
      {!spec && !isGenerating && !isSubmitting && !questionsComplete && clarificationQuestions.length === 0 && (
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 text-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Analyzing your ticket...
          </p>
        </div>
      )}
    </div>
  );
}
