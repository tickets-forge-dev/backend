'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Loader2, ArrowLeft, Trash2, AlertTriangle, CheckCircle, FileCode, FilePlus, FileX, Upload } from 'lucide-react';
import { useTicketsStore } from '@/stores/tickets.store';
import { useServices } from '@/services/index';
import { InlineEditableList } from '@/src/tickets/components/InlineEditableList';
import { ValidationResults } from '@/src/tickets/components/ValidationResults';
import { QuestionRoundsSection } from '@/src/tickets/components/QuestionRoundsSection';
import { StageIndicator } from '@/src/tickets/components/wizard/StageIndicator';
import { EditableItem } from '@/src/tickets/components/EditableItem';
import { EditItemDialog, type EditState } from '@/src/tickets/components/EditItemDialog';
import { useUndoDelete } from '@/src/tickets/hooks/use-undo-delete';
import type { RoundAnswers } from '@/types/question-refinement';

interface TicketDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function TicketDetailPage({ params }: TicketDetailPageProps) {
  const router = useRouter();
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [isSubmittingAnswers, setIsSubmittingAnswers] = useState(false);
  const [answerSubmitError, setAnswerSubmitError] = useState<string | null>(null);
  const [isStartingRound, setIsStartingRound] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [editContext, setEditContext] = useState<{ section: string; index: number } | null>(null);
  const { currentTicket, isLoading, fetchError, isUpdating, isDeleting, fetchTicket, updateTicket, deleteTicket } = useTicketsStore();
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
      <div className="rounded-lg bg-[var(--bg-subtle)] p-6">
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
      </div>
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

  // Build a techSpec patch and send to backend
  const saveTechSpecPatch = async (patch: Record<string, any>) => {
    if (!ticketId) return false;
    return updateTicket(ticketId, { techSpec: patch });
  };

  // Open edit dialog for a specific item
  const openEdit = (section: string, index: number) => {
    const ts = currentTicket?.techSpec;
    if (!ts) return;

    let state: EditState | null = null;

    if (section === 'assumptions') {
      const item = ts.problemStatement?.assumptions?.[index];
      if (item) state = { mode: 'string', value: item, label: 'Assumption' };
    } else if (section === 'constraints') {
      const item = ts.problemStatement?.constraints?.[index];
      if (item) state = { mode: 'string', value: item, label: 'Constraint' };
    } else if (section === 'steps') {
      const steps = ts.solution?.steps ?? (Array.isArray(ts.solution) ? ts.solution : null);
      const step = steps?.[index];
      if (step) {
        const desc = typeof step === 'string' ? step : step.description || JSON.stringify(step);
        state = { mode: 'string', value: desc, label: 'Step' };
      }
    } else if (section === 'acceptanceCriteria') {
      const ac = ts.acceptanceCriteria?.[index];
      if (ac) {
        if (typeof ac === 'string') {
          state = { mode: 'string', value: ac, label: 'Acceptance Criterion' };
        } else {
          state = {
            mode: 'bdd',
            given: ac.given || '',
            when: ac.when || '',
            then: ac.then || '',
            implementationNotes: ac.implementationNotes || '',
          };
        }
      }
    } else if (section === 'fileChanges') {
      const fc = ts.fileChanges?.[index];
      if (fc) state = { mode: 'fileChange', path: fc.path, action: fc.action || fc.type || 'modify' };
    } else if (section === 'inScope') {
      const item = ts.inScope?.[index];
      if (item) state = { mode: 'string', value: item, label: 'In-Scope Item' };
    } else if (section === 'outOfScope') {
      const item = ts.outOfScope?.[index];
      if (item) state = { mode: 'string', value: item, label: 'Out-of-Scope Item' };
    }

    if (state) {
      setEditState(state);
      setEditContext({ section, index });
      setEditDialogOpen(true);
    }
  };

  // Save edited item back to techSpec
  const handleEditSave = async (updated: EditState) => {
    if (!editContext || !currentTicket?.techSpec) return;
    const { section, index } = editContext;
    const ts = currentTicket.techSpec;

    const patch: Record<string, any> = {};

    if (section === 'assumptions' && updated.mode === 'string') {
      const arr = [...(ts.problemStatement?.assumptions || [])];
      arr[index] = updated.value;
      patch.problemStatement = { ...ts.problemStatement, assumptions: arr };
    } else if (section === 'constraints' && updated.mode === 'string') {
      const arr = [...(ts.problemStatement?.constraints || [])];
      arr[index] = updated.value;
      patch.problemStatement = { ...ts.problemStatement, constraints: arr };
    } else if (section === 'steps' && updated.mode === 'string') {
      if (Array.isArray(ts.solution)) {
        const arr = [...ts.solution];
        arr[index] = updated.value;
        patch.solution = arr;
      } else if (ts.solution?.steps) {
        const arr = [...ts.solution.steps];
        arr[index] = typeof arr[index] === 'string' ? updated.value : { ...arr[index], description: updated.value };
        patch.solution = { ...ts.solution, steps: arr };
      }
    } else if (section === 'acceptanceCriteria') {
      const arr = [...(ts.acceptanceCriteria || [])];
      if (updated.mode === 'string') {
        arr[index] = updated.value;
      } else if (updated.mode === 'bdd') {
        arr[index] = {
          given: updated.given,
          when: updated.when,
          then: updated.then,
          implementationNotes: updated.implementationNotes || undefined,
        };
      }
      patch.acceptanceCriteria = arr;
    } else if (section === 'fileChanges' && updated.mode === 'fileChange') {
      const arr = [...(ts.fileChanges || [])];
      arr[index] = { ...arr[index], path: updated.path, action: updated.action };
      patch.fileChanges = arr;
    } else if (section === 'inScope' && updated.mode === 'string') {
      const arr = [...(ts.inScope || [])];
      arr[index] = updated.value;
      patch.inScope = arr;
    } else if (section === 'outOfScope' && updated.mode === 'string') {
      const arr = [...(ts.outOfScope || [])];
      arr[index] = updated.value;
      patch.outOfScope = arr;
    }

    if (Object.keys(patch).length > 0) {
      await saveTechSpecPatch(patch);
    }

    setEditDialogOpen(false);
    setEditState(null);
    setEditContext(null);
  };

  // Delete an item from a techSpec array
  const deleteTechSpecItem = async (section: string, index: number) => {
    if (!currentTicket?.techSpec) return;
    const ts = currentTicket.techSpec;
    const patch: Record<string, any> = {};

    if (section === 'assumptions') {
      const arr = [...(ts.problemStatement?.assumptions || [])];
      arr.splice(index, 1);
      patch.problemStatement = { ...ts.problemStatement, assumptions: arr };
    } else if (section === 'constraints') {
      const arr = [...(ts.problemStatement?.constraints || [])];
      arr.splice(index, 1);
      patch.problemStatement = { ...ts.problemStatement, constraints: arr };
    } else if (section === 'steps') {
      if (Array.isArray(ts.solution)) {
        const arr = [...ts.solution];
        arr.splice(index, 1);
        patch.solution = arr;
      } else if (ts.solution?.steps) {
        const arr = [...ts.solution.steps];
        arr.splice(index, 1);
        patch.solution = { ...ts.solution, steps: arr };
      }
    } else if (section === 'acceptanceCriteria') {
      const arr = [...(ts.acceptanceCriteria || [])];
      arr.splice(index, 1);
      patch.acceptanceCriteria = arr;
    } else if (section === 'fileChanges') {
      const arr = [...(ts.fileChanges || [])];
      arr.splice(index, 1);
      patch.fileChanges = arr;
    } else if (section === 'inScope') {
      const arr = [...(ts.inScope || [])];
      arr.splice(index, 1);
      patch.inScope = arr;
    } else if (section === 'outOfScope') {
      const arr = [...(ts.outOfScope || [])];
      arr.splice(index, 1);
      patch.outOfScope = arr;
    }

    if (Object.keys(patch).length > 0) {
      await saveTechSpecPatch(patch);
    }
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

  const handleToggleStatus = async () => {
    if (!ticketId) return;
    const newStatus = currentTicket.status === 'complete' ? 'draft' : 'complete';
    const success = await updateTicket(ticketId, { status: newStatus });
    if (success) {
      setShowStatusConfirm(false);
    }
  };

  const isComplete = currentTicket.status === 'complete';
  const canToggleStatus = currentTicket.status === 'draft' || currentTicket.status === 'complete';

  const handleDelete = async () => {
    if (!ticketId) return;
    const success = await deleteTicket(ticketId);
    if (success) {
      router.push('/tickets');
    }
  };

  return (
    <div className="space-y-8">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/tickets')}
          className="-ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tickets
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled
          title="Export functionality coming soon"
        >
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          Export
        </Button>
      </div>

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
          {canToggleStatus ? (
            <button
              onClick={() => setShowStatusConfirm(true)}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer
                ${isComplete
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                }
              `}
            >
              {isComplete && <CheckCircle className="h-3.5 w-3.5" />}
              {isComplete ? 'Complete' : 'Draft'}
            </button>
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
        <div className="rounded-lg p-4 bg-red-50 dark:bg-red-950/20">
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
        </div>
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
        <div className="rounded-lg bg-[var(--bg-subtle)] p-6">
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
        </div>
      )}

      {/* Loading state while scanning GitHub code and generating questions */}
      {isStartingRound && (
        <div className="rounded-lg bg-[var(--bg-subtle)] p-8">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--text-tertiary)]" />
            <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
              📋 Generating questions...
            </p>
          </div>
        </div>
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
            <div id="quality-score" data-nav-section className="rounded-lg bg-[var(--bg-subtle)] p-4">
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
            </div>
          )}

          {/* Problem Statement */}
          {currentTicket.techSpec.problemStatement && (
            <div id="problem-statement" data-nav-section className="rounded-lg bg-[var(--bg-subtle)] p-4 space-y-3">
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
                          <li key={i}>
                            <EditableItem onEdit={() => openEdit('assumptions', i)} onDelete={() => deleteTechSpecItem('assumptions', i)}>
                              &#8226; {a}
                            </EditableItem>
                          </li>
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
                          <li key={i}>
                            <EditableItem onEdit={() => openEdit('constraints', i)} onDelete={() => deleteTechSpecItem('constraints', i)}>
                              &#8226; {c}
                            </EditableItem>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Solution Steps */}
          {currentTicket.techSpec.solution && (
            <div id="solution" data-nav-section className="rounded-lg bg-[var(--bg-subtle)] p-4 space-y-3">
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
                    <li key={idx}>
                      <EditableItem onEdit={() => openEdit('steps', idx)} onDelete={() => deleteTechSpecItem('steps', idx)}>
                        <div className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-medium text-[var(--text-tertiary)]">
                            {idx + 1}
                          </span>
                          <span className="pt-0.5">
                            {typeof step === 'string' ? step : step.description || JSON.stringify(step)}
                          </span>
                        </div>
                      </EditableItem>
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
                        <li key={idx}>
                          <EditableItem onEdit={() => openEdit('steps', idx)} onDelete={() => deleteTechSpecItem('steps', idx)}>
                            <div className="flex gap-3">
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
                            </div>
                          </EditableItem>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Acceptance Criteria from spec (BDD format or string list) */}
          {currentTicket.techSpec.acceptanceCriteria?.length > 0 && (
            <div id="spec-acceptance" data-nav-section className="rounded-lg bg-[var(--bg-subtle)] p-4 space-y-3">
              <h3 className="text-[var(--text-sm)] font-medium text-[var(--text)]">
                Acceptance Criteria
              </h3>
              <ul className="space-y-3 text-[var(--text-sm)] text-[var(--text-secondary)]">
                {currentTicket.techSpec.acceptanceCriteria.map((ac: any, idx: number) => (
                  <li key={idx}>
                    <EditableItem onEdit={() => openEdit('acceptanceCriteria', idx)} onDelete={() => deleteTechSpecItem('acceptanceCriteria', idx)}>
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
                    </EditableItem>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* File Changes */}
          {currentTicket.techSpec.fileChanges?.length > 0 && (
            <div id="file-changes" data-nav-section className="rounded-lg bg-[var(--bg-subtle)] p-4 space-y-3">
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
                    <li key={idx}>
                      <EditableItem onEdit={() => openEdit('fileChanges', idx)} onDelete={() => deleteTechSpecItem('fileChanges', idx)}>
                        <div className="flex items-center gap-2 text-[var(--text-sm)]">
                          <Icon className={`h-4 w-4 flex-shrink-0 ${colorClass}`} />
                          <span className="font-mono text-[var(--text-secondary)]">{fc.path}</span>
                          <Badge variant="outline" className="text-[var(--text-xs)] capitalize">
                            {action}
                          </Badge>
                        </div>
                      </EditableItem>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Scope */}
          {(currentTicket.techSpec.inScope?.length > 0 || currentTicket.techSpec.outOfScope?.length > 0) && (
            <div id="scope" data-nav-section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentTicket.techSpec.inScope?.length > 0 && (
                <div className="rounded-lg bg-[var(--bg-subtle)] p-4 space-y-2">
                  <h3 className="text-[var(--text-sm)] font-medium text-green-600 dark:text-green-400">
                    In Scope
                  </h3>
                  <ul className="space-y-1 text-[var(--text-sm)] text-[var(--text-secondary)]">
                    {currentTicket.techSpec.inScope.map((item: string, idx: number) => (
                      <li key={idx}>
                        <EditableItem onEdit={() => openEdit('inScope', idx)} onDelete={() => deleteTechSpecItem('inScope', idx)}>
                          &#8226; {item}
                        </EditableItem>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {currentTicket.techSpec.outOfScope?.length > 0 && (
                <div className="rounded-lg bg-[var(--bg-subtle)] p-4 space-y-2">
                  <h3 className="text-[var(--text-sm)] font-medium text-[var(--text-tertiary)]">
                    Out of Scope
                  </h3>
                  <ul className="space-y-1 text-[var(--text-sm)] text-[var(--text-secondary)]">
                    {currentTicket.techSpec.outOfScope.map((item: string, idx: number) => (
                      <li key={idx}>
                        <EditableItem onEdit={() => openEdit('outOfScope', idx)} onDelete={() => deleteTechSpecItem('outOfScope', idx)}>
                          &#8226; {item}
                        </EditableItem>
                      </li>
                    ))}
                  </ul>
                </div>
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
          <div className="rounded-lg bg-[var(--bg-subtle)] p-4">
            <InlineEditableList
              items={currentTicket.acceptanceCriteria}
              type="numbered"
              onSave={handleSaveAcceptanceCriteria}
              emptyMessage="No acceptance criteria yet"
            />
          </div>
        </section>
      )}

      {/* Assumptions */}
      {currentTicket.assumptions && currentTicket.assumptions.length > 0 && (
        <section id="assumptions" data-nav-section className="space-y-3">
          <h2 className="text-[var(--text-md)] font-medium text-[var(--text)]">
            Assumptions
          </h2>
          <div className="rounded-lg bg-[var(--bg-subtle)] p-4">
            <InlineEditableList
              items={currentTicket.assumptions}
              type="bulleted"
              onSave={handleSaveAssumptions}
              emptyMessage="No assumptions yet"
            />
          </div>
        </section>
      )}

      {/* Affected Code */}
      {currentTicket.repoPaths && currentTicket.repoPaths.length > 0 && (
        <section id="affected-code" data-nav-section className="space-y-3">
          <h2 className="text-[var(--text-md)] font-medium text-[var(--text)]">
            Affected Code
          </h2>
          <div className="rounded-lg bg-[var(--bg-subtle)] p-4">
            <ul className="space-y-1 text-[var(--text-sm)] font-mono text-[var(--text-secondary)]">
              {currentTicket.repoPaths.map((path, index) => (
                <li key={index}>{path}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Estimate */}
      {currentTicket.estimate && (
        <section id="estimate" data-nav-section className="space-y-3">
          <h2 className="text-[var(--text-md)] font-medium text-[var(--text)]">
            Estimate
          </h2>
          <div className="rounded-lg bg-[var(--bg-subtle)] p-4">
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
          </div>
        </section>
      )}

      {/* Questions (if readiness < 75) */}
      {currentTicket.questions && currentTicket.questions.length > 0 && readinessScore < 75 && (
        <section className="space-y-3">
          <h2 className="text-[var(--text-md)] font-medium text-[var(--text)]">
            Clarification Needed
          </h2>
          <div className="rounded-lg bg-[var(--bg-subtle)] p-4">
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
          </div>
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
      </div>
      </div> {/* End relative wrapper for section nav */}

      {/* Status Toggle Confirmation Dialog */}
      <Dialog open={showStatusConfirm} onOpenChange={setShowStatusConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isComplete ? 'Revert to Draft?' : 'Mark as Complete?'}
            </DialogTitle>
            <DialogDescription className="text-[var(--text-base)]">
              {isComplete
                ? 'This will move the ticket back to draft status for further editing.'
                : 'This will mark the ticket as complete. You can revert it to draft later if needed.'}
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
              onClick={() => setShowStatusConfirm(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleToggleStatus}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : isComplete ? (
                'Revert to Draft'
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Complete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <EditItemDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        editState={editState}
        onSave={handleEditSave}
        isSaving={isUpdating}
      />

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
