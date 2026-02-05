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
import { Loader2, ArrowLeft, Trash2, AlertTriangle } from 'lucide-react';
import { useTicketsStore } from '@/stores/tickets.store';
import { useServices } from '@/services/index';
import { InlineEditableList } from '@/src/tickets/components/InlineEditableList';
import { ValidationResults } from '@/src/tickets/components/ValidationResults';
import { QuestionRoundsSection } from '@/src/tickets/components/QuestionRoundsSection';
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
    if (!ticketId) return;
    setIsStartingRound(true);
    setAnswerSubmitError(null);
    try {
      console.log('🎯 Auto-starting Round 1 for new ticket');
      await questionRoundService.startRound(ticketId, 1);
      // Refresh to show questions
      await fetchTicket(ticketId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start question round';
      console.error('❌ Failed to start Round 1:', errorMessage);
      setAnswerSubmitError(errorMessage);
    } finally {
      setIsStartingRound(false);
    }
  }, [ticketId, questionRoundService, fetchTicket]);

  // Don't auto-start - let user explicitly start analysis to see code scanning
  // This way they understand that GitHub code is being analyzed

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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit answers';
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to skip to finalize';
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to finalize spec';
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
          <Badge className={`${readinessBadgeClass} text-white`}>
            Ready {readinessScore}
          </Badge>
        </div>
      </div>

      {/* Error message */}
      {answerSubmitError && (
        <Card className="p-4 border-[var(--red)] bg-red-50 dark:bg-red-950/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-[var(--red)] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[var(--text-sm)] font-medium text-[var(--red)]">
                Failed to generate questions
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

      {/* Not started yet - show start button */}
      {!isStartingRound && !currentTicket.currentRound && (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="text-center">
              <h3 className="text-[var(--text-md)] font-medium text-[var(--text)] mb-2">
                Answer Clarification Questions
              </h3>
              <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
                Answer clarification questions to improve your ticket specification (up to 3 rounds)
              </p>
            </div>
            <Button
              onClick={startQuestionRound1}
              size="lg"
              className="mt-2"
            >
              📋 Start Question Round 1
            </Button>
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
       currentTicket.currentRound <= 3 &&
       currentTicket.questionRounds &&
       currentTicket.questionRounds.length > 0 && (
        <QuestionRoundsSection
          questionRounds={currentTicket.questionRounds}
          currentRound={currentTicket.currentRound}
          onSubmitAnswers={handleSubmitRoundAnswers}
          onSkipToFinalize={handleSkipToFinalize}
          onFinalizeSpec={handleFinalizeSpec}
          isSubmitting={isSubmittingAnswers}
          error={answerSubmitError}
          onDismissError={() => setAnswerSubmitError(null)}
        />
      )}

      {/* Acceptance Criteria */}
      {currentTicket.acceptanceCriteria && currentTicket.acceptanceCriteria.length > 0 && (
        <section className="space-y-3">
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
        <section className="space-y-3">
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
        <section className="space-y-3">
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
        <section className="space-y-3">
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
