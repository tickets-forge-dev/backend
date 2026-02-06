'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Loader2, ArrowLeft, Trash2, AlertTriangle, CheckCircle, FileCode, FilePlus, FileX } from 'lucide-react';
import { useTicketsStore } from '@/stores/tickets.store';
import { useServices } from '@/services/index';
import { InlineEditableList } from '@/src/tickets/components/InlineEditableList';
import { ValidationResults } from '@/src/tickets/components/ValidationResults';
import { QuestionRoundsSection } from '@/src/tickets/components/QuestionRoundsSection';
import { StageIndicator } from '@/src/tickets/components/wizard/StageIndicator';
import type { RoundAnswers } from '@/types/question-refinement';

interface TicketDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function TicketDetailPage({ params }: TicketDetailPageProps) {
  const router = useRouter();
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSubmittingAnswers, setIsSubmittingAnswers] = useState(false);
  const [answerSubmitError, setAnswerSubmitError] = useState<string | null>(null);
  const [isStartingRound, setIsStartingRound] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const { currentTicket, isLoading, fetchError, isDeleting, fetchTicket, updateTicket, deleteTicket } = useTicketsStore();
  const { questionRoundService } = useServices();

  // Unwrap params (Next.js 15 async params)
  useEffect(() => {
    params.then(({ id }) => setTicketId(id));
  }, [params]);

  // Fetch ticket when ID is available
  useEffect(() => {
    if (ticketId) {
      fetchTicket(ticketId);
    }
  }, [ticketId, fetchTicket]);

  const startQuestionRound1 = useCallback(async () => {
    if (!ticketId || !currentTicket) return;

    // Guard: Don't start if maxRounds is 0
    if (currentTicket.maxRounds === 0) {
      console.log('⏭️  Skipping questions (maxRounds=0, auto-finalized)');
      return;
    }

    // Guard: Already started
    if ((currentTicket.currentRound ?? 0) > 0) return;

    setIsStartingRound(true);
    setAnswerSubmitError(null);
    try {
      console.log('🎯 Auto-starting Round 1');
      await questionRoundService.startRound(ticketId, 1);
      await fetchTicket(ticketId);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message
        || error?.message
        || 'Failed to start question round';
      console.error('❌ Failed to start Round 1:', errorMessage);
      setAnswerSubmitError(errorMessage);
    } finally {
      setIsStartingRound(false);
    }
  }, [ticketId, currentTicket, questionRoundService, fetchTicket]);

  // Auto-start round 1 when ticket loads (if not started and maxRounds > 0)
  useEffect(() => {
    if (currentTicket && (currentTicket.currentRound ?? 0) === 0 && (currentTicket.maxRounds ?? 0) > 0) {
      startQuestionRound1();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTicket?.id]);

  // Track active section for left nav scroll spy
  useEffect(() => {
    const handleScroll = () => {
      const sectionEls = document.querySelectorAll('[data-nav-section]');
      let current = '';
      sectionEls.forEach(el => {
        if (el.getBoundingClientRect().top <= 120) {
          current = el.id;
        }
      });
      if (current) setActiveSection(current);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isLoading || !ticketId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  if (fetchError || !currentTicket) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-[var(--text-base)] text-[var(--red)]">
            {fetchError || 'Ticket not found'}
          </p>
          <Button
            onClick={() => router.push('/tickets')}
            variant="outline"
            className="mt-4"
          >
            Back to Tickets
          </Button>
        </div>
      </Card>
    );
  }

  // Compute readiness badge color
  const readinessScore = currentTicket.readinessScore || 0;
  const readinessBadgeClass =
    readinessScore >= 75
      ? 'bg-[var(--green)]'
      : readinessScore >= 50
      ? 'bg-[var(--amber)]'
      : 'bg-[var(--red)]';

  // Derive wizard stage from ticket state
  const deriveCurrentStage = (): 1 | 2 | 3 | 4 => {
    // Stage 1-2 completed (ticket exists)
    // Stage 4: Finalized (has tech spec or rounds completed)
    if (currentTicket.techSpec) return 4;
    if (currentTicket.maxRounds === 0) return 4;
    if ((currentTicket.currentRound ?? 0) > (currentTicket.maxRounds ?? 3)) return 4;

    // Stage 3: Questions/draft phase
    return 3;
  };

  const currentStage = deriveCurrentStage();

  // Build section nav items based on what's actually rendered
  const techSpec = currentTicket.techSpec;
  const navSections = [
    techSpec?.qualityScore !== undefined && { id: 'quality-score', label: 'Quality' },
    techSpec?.problemStatement && { id: 'problem-statement', label: 'Problem' },
    techSpec?.solution && { id: 'solution', label: 'Solution' },
    techSpec?.acceptanceCriteria?.length > 0 && { id: 'spec-acceptance', label: 'Acceptance Criteria' },
    techSpec?.fileChanges?.length > 0 && { id: 'file-changes', label: 'File Changes' },
    (techSpec?.inScope?.length > 0 || techSpec?.outOfScope?.length > 0) && { id: 'scope', label: 'Scope' },
    currentTicket.acceptanceCriteria?.length > 0 && { id: 'ticket-acceptance', label: 'Criteria' },
    currentTicket.assumptions?.length > 0 && { id: 'assumptions', label: 'Assumptions' },
    currentTicket.repoPaths?.length > 0 && { id: 'affected-code', label: 'Affected Code' },
    currentTicket.estimate && { id: 'estimate', label: 'Estimate' },
  ].filter(Boolean) as { id: string; label: string }[];

  // Handle inline editing save
  const handleSaveAcceptanceCriteria = async (items: string[]) => {
    if (!ticketId) return;
    await updateTicket(ticketId, { acceptanceCriteria: items });
  };

  const handleSaveAssumptions = async (items: string[]) => {
    if (!ticketId) return;
    await updateTicket(ticketId, { assumptions: items });
  };

  // Handle submitting answers for a question round
  const handleSubmitRoundAnswers = async (roundNumber: number, answers: RoundAnswers) => {
    if (!ticketId) return;
    setIsSubmittingAnswers(true);
    setAnswerSubmitError(null);

    try {
      const result = await questionRoundService.submitAnswers(ticketId, roundNumber as 1 | 2 | 3, answers);

      // Refresh ticket to see updated state (next round or finalize button)
      await fetchTicket(ticketId);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message
        || error?.message
        || 'Failed to submit answers';
      setAnswerSubmitError(errorMessage);
    } finally {
      setIsSubmittingAnswers(false);
    }
  };

  // Handle skipping to finalize
  const handleSkipToFinalize = async () => {
    if (!ticketId) return;
    setIsSubmittingAnswers(true);
    setAnswerSubmitError(null);

    try {
      await questionRoundService.skipToFinalize(ticketId);
      // Refresh to show finalize button or final spec
      await fetchTicket(ticketId);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message
        || error?.message
        || 'Failed to skip to finalize';
      setAnswerSubmitError(errorMessage);
    } finally {
      setIsSubmittingAnswers(false);
    }
  };

  // Handle finalizing the spec
  const handleFinalizeSpec = async () => {
    if (!ticketId || !currentTicket?.questionRounds) return;
    setIsSubmittingAnswers(true);
    setAnswerSubmitError(null);

    try {
      // Collect all answers from all rounds
      const allAnswers = currentTicket.questionRounds.map(round => round.answers || {});

      await questionRoundService.finalizeSpec(ticketId, allAnswers);
      // Refresh to show final spec with quality score
      await fetchTicket(ticketId);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message
        || error?.message
        || 'Failed to finalize spec';
      setAnswerSubmitError(errorMessage);
    } finally {
      setIsSubmittingAnswers(false);
    }
  };

  const handleDelete = async () => {
    if (!ticketId) return;
    const success = await deleteTicket(ticketId);
    if (success) {
      router.push('/tickets');
    }
  };

  return (
    <div className="space-y-8">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/tickets')}
        className="-ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Tickets
      </Button>

      {/* Progress Stepper */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 -mx-4 sm:-mx-6 px-4 sm:px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <StageIndicator currentStage={currentStage} />
        </div>
      </div>

      {/* Content with section nav */}
      <div className="relative">
        {/* Section Navigator — sticky left sidebar on wide screens */}
        {navSections.length > 0 && (
          <nav className="hidden 2xl:block absolute right-full mr-6 top-0 bottom-0 w-40">
            <div className="sticky top-24 space-y-0.5">
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[3px] top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-800" />
                <div className="space-y-0.5">
                  {navSections.map(section => {
                    const isActive = activeSection === section.id;
                    return (
                      <button
                        key={section.id}
                        onClick={() => {
                          const el = document.getElementById(section.id);
                          if (el) {
                            const y = el.getBoundingClientRect().top + window.scrollY - 100;
                            window.scrollTo({ top: y, behavior: 'smooth' });
                          }
                        }}
                        className={`
                          relative flex items-center gap-3 text-left text-xs w-full py-1.5 transition-colors
                          ${isActive ? 'text-[var(--text)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'}
                        `}
                      >
                        <div className={`
                          w-[7px] h-[7px] rounded-full flex-shrink-0 z-10 transition-colors
                          ${isActive ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-600'}
                        `} />
                        <span className={isActive ? 'font-medium' : ''}>
                          {section.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </nav>
        )}

      {/* Header with title, type, and readiness badge */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-[var(--text-xl)] font-medium text-[var(--text)]">
              {currentTicket.title}
            </h1>
            {currentTicket.type && (
              <Badge variant="outline" className="capitalize">
                {currentTicket.type}
              </Badge>
            )}
          </div>
          <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
            Ticket #{currentTicket.id}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {currentTicket.techSpec ? (
            <Badge className={`${readinessBadgeClass} text-white`}>
              Ready {readinessScore}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[var(--text-secondary)]">
              {currentTicket.currentRound === 0
                ? 'Draft'
                : `Round ${currentTicket.currentRound}/${currentTicket.maxRounds}`}
            </Badge>
          )}
        </div>
      </div>

      {/* Error message */}
      {answerSubmitError && (
        <Card className="p-4 border-[var(--red)] bg-red-50 dark:bg-red-950/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-[var(--red)] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[var(--text-sm)] font-medium text-[var(--red)]">
                {answerSubmitError.includes('Maximum') ? 'Cannot start round' : 'Something went wrong'}
              </p>
              <p className="text-[var(--text-xs)] text-[var(--red)] mt-1">
                {answerSubmitError}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAnswerSubmitError(null)}
              className="text-[var(--red)]"
            >
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      {/* Validation Results */}
      {currentTicket.validationResults && currentTicket.validationResults.length > 0 && (
        <ValidationResults
          validationResults={currentTicket.validationResults}
          overallScore={currentTicket.readinessScore}
        />
      )}

      {/* Special case: maxRounds=0 (no questions needed) */}
      {!isStartingRound && currentTicket.maxRounds === 0 && !currentTicket.techSpec && (
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center gap-3">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <div className="text-center">
              <h3 className="text-[var(--text-md)] font-medium text-[var(--text)] mb-1">
                No Clarification Needed
              </h3>
              <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
                This task is straightforward enough to generate a spec directly
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Loading state while scanning GitHub code and generating questions */}
      {isStartingRound && (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--text-tertiary)]" />
            <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
              📋 Generating questions...
            </p>
          </div>
        </Card>
      )}

      {/* Question Rounds - Show if in progress */}
      {!isStartingRound && currentTicket.currentRound &&
       currentTicket.currentRound > 0 &&
       currentTicket.currentRound <= (currentTicket.maxRounds ?? 3) &&
       currentTicket.questionRounds &&
       currentTicket.questionRounds.length > 0 && (
        <QuestionRoundsSection
          questionRounds={currentTicket.questionRounds}
          currentRound={currentTicket.currentRound}
          maxRounds={currentTicket.maxRounds ?? 3}
          onSubmitAnswers={handleSubmitRoundAnswers}
          onSkipToFinalize={handleSkipToFinalize}
          onFinalizeSpec={handleFinalizeSpec}
          isSubmitting={isSubmittingAnswers}
          error={answerSubmitError}
          onDismissError={() => setAnswerSubmitError(null)}
        />
      )}

      {/* Tech Spec - Main content for Stage 4 (Review) */}
      {currentTicket.techSpec && (
        <section className="space-y-6">
          <h2 className="text-[var(--text-md)] font-medium text-[var(--text)]">
            Technical Specification
          </h2>

          {/* Quality Score */}
          {currentTicket.techSpec.qualityScore !== undefined && (
            <Card id="quality-score" data-nav-section className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[var(--text-sm)] font-medium text-[var(--text)]">
                    Quality Score
                  </p>
                  <span className="text-[var(--text-sm)] font-medium text-[var(--text)]">
                    {currentTicket.techSpec.qualityScore}/100
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      currentTicket.techSpec.qualityScore >= 75
                        ? 'bg-green-500'
                        : currentTicket.techSpec.qualityScore >= 50
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(currentTicket.techSpec.qualityScore, 100)}%` }}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Problem Statement */}
          {currentTicket.techSpec.problemStatement && (
            <Card id="problem-statement" data-nav-section className="p-4 space-y-3">
              <h3 className="text-[var(--text-sm)] font-medium text-[var(--text)]">
                Problem Statement
              </h3>
              <p className="text-[var(--text-sm)] text-[var(--text-secondary)] leading-relaxed">
                {typeof currentTicket.techSpec.problemStatement === 'string'
                  ? currentTicket.techSpec.problemStatement
                  : currentTicket.techSpec.problemStatement.narrative}
              </p>
              {typeof currentTicket.techSpec.problemStatement === 'object' && (
                <>
                  {currentTicket.techSpec.problemStatement.whyItMatters && (
                    <div className="pt-2 border-t border-[var(--border)]">
                      <p className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase mb-1">
                        Why it matters
                      </p>
                      <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
                        {currentTicket.techSpec.problemStatement.whyItMatters}
                      </p>
                    </div>
                  )}
                  {currentTicket.techSpec.problemStatement.assumptions?.length > 0 && (
                    <div className="pt-2 border-t border-[var(--border)]">
                      <p className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase mb-1">
                        Assumptions
                      </p>
                      <ul className="space-y-1 text-[var(--text-sm)] text-[var(--text-secondary)]">
                        {currentTicket.techSpec.problemStatement.assumptions.map((a: string, i: number) => (
                          <li key={i}>&#8226; {a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {currentTicket.techSpec.problemStatement.constraints?.length > 0 && (
                    <div className="pt-2 border-t border-[var(--border)]">
                      <p className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase mb-1">
                        Constraints
                      </p>
                      <ul className="space-y-1 text-[var(--text-sm)] text-[var(--text-secondary)]">
                        {currentTicket.techSpec.problemStatement.constraints.map((c: string, i: number) => (
                          <li key={i}>&#8226; {c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </Card>
          )}

          {/* Solution Steps */}
          {currentTicket.techSpec.solution && (
            <Card id="solution" data-nav-section className="p-4 space-y-3">
              <h3 className="text-[var(--text-sm)] font-medium text-[var(--text)]">
                Solution
              </h3>
              {typeof currentTicket.techSpec.solution === 'string' ? (
                <p className="text-[var(--text-sm)] text-[var(--text-secondary)] leading-relaxed">
                  {currentTicket.techSpec.solution}
                </p>
              ) : Array.isArray(currentTicket.techSpec.solution) ? (
                <ol className="space-y-2 text-[var(--text-sm)] text-[var(--text-secondary)]">
                  {currentTicket.techSpec.solution.map((step: string | any, idx: number) => (
                    <li key={idx} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-medium text-[var(--text-tertiary)]">
                        {idx + 1}
                      </span>
                      <span className="pt-0.5">
                        {typeof step === 'string' ? step : step.description || JSON.stringify(step)}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : currentTicket.techSpec.solution.overview ? (
                <div className="space-y-3">
                  <p className="text-[var(--text-sm)] text-[var(--text-secondary)] leading-relaxed">
                    {currentTicket.techSpec.solution.overview}
                  </p>
                  {currentTicket.techSpec.solution.steps?.length > 0 && (
                    <ol className="space-y-2 text-[var(--text-sm)] text-[var(--text-secondary)]">
                      {currentTicket.techSpec.solution.steps.map((step: any, idx: number) => (
                        <li key={idx} className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-medium text-[var(--text-tertiary)]">
                            {step.order || idx + 1}
                          </span>
                          <div className="pt-0.5">
                            <p>{step.description}</p>
                            {step.file && (
                              <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] font-mono mt-1">
                                {step.file}{step.lineNumbers ? `:${step.lineNumbers[0]}-${step.lineNumbers[1]}` : ''}
                              </p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              ) : null}
            </Card>
          )}

          {/* Acceptance Criteria from spec (BDD format or string list) */}
          {currentTicket.techSpec.acceptanceCriteria?.length > 0 && (
            <Card id="spec-acceptance" data-nav-section className="p-4 space-y-3">
              <h3 className="text-[var(--text-sm)] font-medium text-[var(--text)]">
                Acceptance Criteria
              </h3>
              <ul className="space-y-3 text-[var(--text-sm)] text-[var(--text-secondary)]">
                {currentTicket.techSpec.acceptanceCriteria.map((ac: any, idx: number) => (
                  <li key={idx}>
                    {typeof ac === 'string' ? (
                      <span>&#8226; {ac}</span>
                    ) : (
                      <div className="space-y-1 bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                        <p><span className="font-medium text-[var(--text-tertiary)]">Given</span> {ac.given}</p>
                        <p><span className="font-medium text-[var(--text-tertiary)]">When</span> {ac.when}</p>
                        <p><span className="font-medium text-[var(--text-tertiary)]">Then</span> {ac.then}</p>
                        {ac.implementationNotes && (
                          <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] italic mt-1">
                            {ac.implementationNotes}
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* File Changes */}
          {currentTicket.techSpec.fileChanges?.length > 0 && (
            <Card id="file-changes" data-nav-section className="p-4 space-y-3">
              <h3 className="text-[var(--text-sm)] font-medium text-[var(--text)]">
                File Changes
              </h3>
              <ul className="space-y-2">
                {currentTicket.techSpec.fileChanges.map((fc: any, idx: number) => {
                  const action = fc.action || fc.type || 'modify';
                  const Icon = action === 'create' ? FilePlus
                    : action === 'delete' ? FileX
                    : FileCode;
                  const colorClass = action === 'create' ? 'text-green-500'
                    : action === 'delete' ? 'text-red-500'
                    : 'text-amber-500';

                  return (
                    <li key={idx} className="flex items-center gap-2 text-[var(--text-sm)]">
                      <Icon className={`h-4 w-4 flex-shrink-0 ${colorClass}`} />
                      <span className="font-mono text-[var(--text-secondary)]">{fc.path}</span>
                      <Badge variant="outline" className="text-[var(--text-xs)] capitalize">
                        {action}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          {/* Scope */}
          {(currentTicket.techSpec.inScope?.length > 0 || currentTicket.techSpec.outOfScope?.length > 0) && (
            <div id="scope" data-nav-section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentTicket.techSpec.inScope?.length > 0 && (
                <Card className="p-4 space-y-2">
                  <h3 className="text-[var(--text-sm)] font-medium text-green-600 dark:text-green-400">
                    In Scope
                  </h3>
                  <ul className="space-y-1 text-[var(--text-sm)] text-[var(--text-secondary)]">
                    {currentTicket.techSpec.inScope.map((item: string, idx: number) => (
                      <li key={idx}>&#8226; {item}</li>
                    ))}
                  </ul>
                </Card>
              )}
              {currentTicket.techSpec.outOfScope?.length > 0 && (
                <Card className="p-4 space-y-2">
                  <h3 className="text-[var(--text-sm)] font-medium text-[var(--text-tertiary)]">
                    Out of Scope
                  </h3>
                  <ul className="space-y-1 text-[var(--text-sm)] text-[var(--text-secondary)]">
                    {currentTicket.techSpec.outOfScope.map((item: string, idx: number) => (
                      <li key={idx}>&#8226; {item}</li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          )}
        </section>
      )}

      {/* Acceptance Criteria */}
      {currentTicket.acceptanceCriteria && currentTicket.acceptanceCriteria.length > 0 && (
        <section id="ticket-acceptance" data-nav-section className="space-y-3">
          <h2 className="text-[var(--text-md)] font-medium text-[var(--text)]">
            Acceptance Criteria
          </h2>
          <Card className="p-4">
            <InlineEditableList
              items={currentTicket.acceptanceCriteria}
              type="numbered"
              onSave={handleSaveAcceptanceCriteria}
              emptyMessage="No acceptance criteria yet"
            />
          </Card>
        </section>
      )}

      {/* Assumptions */}
      {currentTicket.assumptions && currentTicket.assumptions.length > 0 && (
        <section id="assumptions" data-nav-section className="space-y-3">
          <h2 className="text-[var(--text-md)] font-medium text-[var(--text)]">
            Assumptions
          </h2>
          <Card className="p-4">
            <InlineEditableList
              items={currentTicket.assumptions}
              type="bulleted"
              onSave={handleSaveAssumptions}
              emptyMessage="No assumptions yet"
            />
          </Card>
        </section>
      )}

      {/* Affected Code */}
      {currentTicket.repoPaths && currentTicket.repoPaths.length > 0 && (
        <section id="affected-code" data-nav-section className="space-y-3">
          <h2 className="text-[var(--text-md)] font-medium text-[var(--text)]">
            Affected Code
          </h2>
          <Card className="p-4">
            <ul className="space-y-1 text-[var(--text-sm)] font-mono text-[var(--text-secondary)]">
              {currentTicket.repoPaths.map((path, index) => (
                <li key={index}>{path}</li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      {/* Estimate */}
      {currentTicket.estimate && (
        <section id="estimate" data-nav-section className="space-y-3">
          <h2 className="text-[var(--text-md)] font-medium text-[var(--text)]">
            Estimate
          </h2>
          <Card className="p-4">
            <div className="space-y-2">
              <p className="text-[var(--text-base)] text-[var(--text)]">
                {currentTicket.estimate.min}-{currentTicket.estimate.max} hours{' '}
                <span className="text-[var(--text-tertiary)] capitalize">
                  ({currentTicket.estimate.confidence} confidence)
                </span>
              </p>
              {currentTicket.estimate.drivers && currentTicket.estimate.drivers.length > 0 && (
                <ul className="space-y-1 text-[var(--text-sm)] text-[var(--text-secondary)]">
                  {currentTicket.estimate.drivers.map((driver: string, index: number) => (
                    <li key={index}>• {driver}</li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </section>
      )}

      {/* Questions (if readiness < 75) */}
      {currentTicket.questions && currentTicket.questions.length > 0 && readinessScore < 75 && (
        <section className="space-y-3">
          <h2 className="text-[var(--text-md)] font-medium text-[var(--text)]">
            Clarification Needed
          </h2>
          <Card className="p-4">
            <div className="space-y-4">
              {currentTicket.questions.slice(0, 3).map((question, index) => (
                <div key={question.id || index} className="space-y-2">
                  <p className="text-[var(--text-base)] text-[var(--text)]">
                    {index + 1}. {question.text}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {question.options.map((option: { value: string; label: string }) => (
                      <Badge
                        key={option.value}
                        variant="outline"
                        className="cursor-pointer hover:bg-[var(--bg-hover)]"
                      >
                        {option.label}
                      </Badge>
                    ))}
                  </div>
                  {question.defaultAssumption && (
                    <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] italic">
                      Default: {question.defaultAssumption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}

      {/* Footer with export and delete buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-[var(--border)]">
        <Button
          variant="ghost"
          onClick={() => setShowDeleteConfirm(true)}
          className="text-[var(--red)] hover:text-[var(--red)] hover:bg-[var(--red)]/10"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Ticket
        </Button>
        <Button disabled title="Export functionality coming in Epic 5">
          Export to Jira
        </Button>
      </div>
      </div> {/* End relative wrapper for section nav */}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[var(--red)]" />
              Delete Ticket
            </DialogTitle>
            <DialogDescription className="text-[var(--text-base)]">
              Are you sure you want to delete this ticket? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
              <strong className="text-[var(--text)]">Ticket:</strong> {currentTicket.title}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Ticket
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
