'use client';

import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { useBulkEnrichmentStore } from '@/tickets/stores/bulk-enrichment.store';
import { useBulkEnrichmentService } from '@/services/bulk-enrichment.service';
import { AgentProgressCard } from './AgentProgressCard';
import { UnifiedQuestionForm } from './UnifiedQuestionForm';

/**
 * BulkEnrichmentWizard - 3-stage wizard for parallel enrichment
 *
 * Stage 1: Enriching (agent cards show real-time progress)
 * Stage 2: Answering (user answers all questions at once)
 * Stage 3: Finalizing (agent cards show finalization progress)
 *
 * Flow:
 * User clicks "Enrich & Create" in BreakdownReview
 *   → Wizard opens with ticketIds
 *   → POST /tickets/bulk/enrich (SSE)
 *   → Show Stage 1 (enriching) with progress
 *   → On complete, show Stage 2 (answering)
 *   → User answers all questions
 *   → Click "Finalize All Tickets"
 *   → POST /tickets/bulk/finalize (SSE)
 *   → Show Stage 3 (finalizing) with progress
 *   → On complete, redirect to /tickets
 */

export interface BulkEnrichmentWizardProps {
  ticketIds: string[];
  ticketTitles: Map<string, string>;
  onComplete?: (ticketIds: string[]) => void;
  onClose?: () => void;
}

export function BulkEnrichmentWizard({
  ticketIds,
  ticketTitles,
  onComplete,
  onClose,
}: BulkEnrichmentWizardProps) {
  const bulkService = useBulkEnrichmentService();
  const {
    phase,
    agentProgress,
    questions,
    answers,
    errors,
    enrichedCount,
    failedCount,
    estimatedTimeRemaining,
    initializeEnrichment,
    updateAgentProgress,
    setEnrichmentComplete,
    recordAnswer,
    startFinalization,
    updateFinalizationProgress,
    setFinalizationComplete,
  } = useBulkEnrichmentStore();

  // Initialize enrichment on mount
  useEffect(() => {
    initializeEnrichment(
      ticketIds,
      ticketIds.map((id) => ({ id, title: ticketTitles.get(id) || id })),
    );

    // Start enrichment
    startEnrichment();
  }, [ticketIds]);

  // Start enrichment process
  const startEnrichment = useCallback(async () => {
    try {
      await bulkService.enrichTickets(
        ticketIds,
        (event) => {
          if (event.type === 'progress' || event.type === 'error') {
            updateAgentProgress(event);
          } else if (event.type === 'complete') {
            // Convert maps to Map objects for store
            const questionsMap = new Map(Object.entries(event.questions || {}));
            const errorsMap = new Map(Object.entries(event.errors || {}));
            setEnrichmentComplete(questionsMap, errorsMap, event.completedCount || 0, event.failedCount || 0);
          }
        },
      );
    } catch (error) {
      console.error('Enrichment failed:', error);
      // Error is handled by service and store
    }
  }, [ticketIds, bulkService, updateAgentProgress, setEnrichmentComplete]);

  // Start finalization process
  const handleFinalize = useCallback(async () => {
    startFinalization();

    // Convert answers to API format
    const answersArray = Array.from(answers.entries()).map(([questionId, answer]) => {
      // Find which ticket this question belongs to
      let ticketId = '';
      for (const [tId, tQuestions] of questions.entries()) {
        if (tQuestions.some((q) => q.id === questionId)) {
          ticketId = tId;
          break;
        }
      }
      return { ticketId, questionId, answer };
    });

    try {
      await bulkService.finalizeTickets(
        answersArray,
        (event) => {
          if (event.type === 'progress' || event.type === 'error') {
            updateFinalizationProgress(event);
          } else if (event.type === 'complete') {
            setFinalizationComplete(event);
            // Redirect after a short delay to show completion
            setTimeout(() => {
              if (onComplete) {
                onComplete(ticketIds);
              }
            }, 1000);
          }
        },
      );
    } catch (error) {
      console.error('Finalization failed:', error);
    }
  }, [questions, answers, startFinalization, updateFinalizationProgress, setFinalizationComplete, bulkService, ticketIds, onComplete]);

  // Render Stage 1: Enriching
  if (phase === 'enriching') {
    return (
      <EnrichingStage
        agentProgress={agentProgress}
        enrichedCount={enrichedCount}
        failedCount={failedCount}
        totalCount={ticketIds.length}
        estimatedTimeRemaining={estimatedTimeRemaining}
        onClose={onClose}
      />
    );
  }

  // Render Stage 2: Answering
  if (phase === 'answering') {
    return (
      <AnsweringStage
        questionsByTicket={questions}
        ticketTitles={ticketTitles}
        onAnswerChange={recordAnswer}
        onSubmit={handleFinalize}
        enrichedCount={enrichedCount}
        failedCount={failedCount}
        onClose={onClose}
      />
    );
  }

  // Render Stage 3: Finalizing
  if (phase === 'finalizing' || phase === 'complete') {
    return (
      <FinalizingStage
        agentProgress={agentProgress}
        finalizedCount={enrichedCount}
        failedCount={failedCount}
        totalCount={enrichedCount + failedCount}
        isComplete={phase === 'complete'}
        estimatedTimeRemaining={estimatedTimeRemaining}
        onClose={onClose}
      />
    );
  }

  return null;
}

/**
 * Stage 1: Enriching - Show real-time agent progress
 */
interface EnrichingStageProps {
  agentProgress: Map<number, any>;
  enrichedCount: number;
  failedCount: number;
  totalCount: number;
  estimatedTimeRemaining: number;
  onClose?: () => void;
}

function EnrichingStage({
  agentProgress,
  enrichedCount,
  failedCount,
  totalCount,
  estimatedTimeRemaining,
  onClose,
}: EnrichingStageProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div
        className="rounded-lg border w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6"
        style={{
          backgroundColor: 'var(--bg)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ color: 'var(--text)' }}
            >
              Enriching Tickets
            </h2>
            <p
              className="text-sm mt-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              {enrichedCount + failedCount} of {totalCount} tickets analyzed
              {estimatedTimeRemaining > 0 && ` • Est. ${estimatedTimeRemaining}s remaining`}
            </p>
          </div>
          {onClose && (
            <button onClick={onClose}>
              <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            </button>
          )}
        </div>

        {/* Progress summary */}
        <div className="grid grid-cols-3 gap-3">
          <div
            className="p-3 rounded border text-center"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              borderColor: 'var(--border)',
            }}
          >
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              IN PROGRESS
            </p>
            <p
              className="text-lg font-bold"
              style={{ color: 'var(--blue)' }}
            >
              {Math.max(0, totalCount - enrichedCount - failedCount)}
            </p>
          </div>
          <div
            className="p-3 rounded border text-center"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              borderColor: 'var(--border)',
            }}
          >
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              COMPLETED
            </p>
            <p
              className="text-lg font-bold"
              style={{ color: 'var(--green)' }}
            >
              {enrichedCount}
            </p>
          </div>
          <div
            className="p-3 rounded border text-center"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              borderColor: 'var(--border)',
            }}
          >
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              FAILED
            </p>
            <p
              className="text-lg font-bold"
              style={{ color: failedCount > 0 ? 'var(--red)' : 'var(--text-secondary)' }}
            >
              {failedCount}
            </p>
          </div>
        </div>

        {/* Agent progress cards */}
        <div className="space-y-3">
          {[1, 2, 3].map((agentId) => {
            const progress = agentProgress.get(agentId);
            if (!progress) {
              return (
                <AgentProgressCard
                  key={agentId}
                  agentId={agentId}
                  ticketTitle="Waiting..."
                  phase="question_generation"
                  status="started"
                  message="Waiting to start..."
                />
              );
            }

            return (
              <AgentProgressCard
                key={agentId}
                agentId={progress.agentId}
                ticketTitle={progress.ticketTitle}
                phase={progress.phase}
                status={progress.status}
                message={progress.message}
                error={progress.error}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Stage 2: Answering - User answers all questions
 */
interface AnsweringStageProps {
  questionsByTicket: Map<string, any[]>;
  ticketTitles: Map<string, string>;
  onAnswerChange: (questionId: string, answer: string) => void;
  onSubmit: () => void;
  enrichedCount: number;
  failedCount: number;
  onClose?: () => void;
}

function AnsweringStage({
  questionsByTicket,
  ticketTitles,
  onAnswerChange,
  onSubmit,
  enrichedCount,
  failedCount,
  onClose,
}: AnsweringStageProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div
        className="rounded-lg border w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6"
        style={{
          backgroundColor: 'var(--bg)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ color: 'var(--text)' }}
            >
              Enrichment Complete
            </h2>
            <p
              className="text-sm mt-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              {enrichedCount} tickets analyzed • {failedCount > 0 && `${failedCount} failed • `}Ready for clarification
            </p>
          </div>
          {onClose && (
            <button onClick={onClose}>
              <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            </button>
          )}
        </div>

        {/* Questions form */}
        <UnifiedQuestionForm
          questionsByTicket={questionsByTicket}
          ticketTitles={ticketTitles}
          onAnswerChange={onAnswerChange}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}

/**
 * Stage 3: Finalizing - Show finalization progress
 */
interface FinalizingStageProps {
  agentProgress: Map<number, any>;
  finalizedCount: number;
  failedCount: number;
  totalCount: number;
  isComplete: boolean;
  estimatedTimeRemaining: number;
  onClose?: () => void;
}

function FinalizingStage({
  agentProgress,
  finalizedCount,
  failedCount,
  totalCount,
  isComplete,
  estimatedTimeRemaining,
  onClose,
}: FinalizingStageProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div
        className="rounded-lg border w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6"
        style={{
          backgroundColor: 'var(--bg)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ color: 'var(--text)' }}
            >
              {isComplete ? 'Finalization Complete' : 'Finalizing Tickets'}
            </h2>
            <p
              className="text-sm mt-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              {finalizedCount} of {totalCount} tickets finalized
              {estimatedTimeRemaining > 0 && !isComplete && ` • Est. ${estimatedTimeRemaining}s remaining`}
            </p>
          </div>
          {onClose && (
            <button onClick={onClose}>
              <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            </button>
          )}
        </div>

        {/* Progress summary */}
        <div className="grid grid-cols-3 gap-3">
          <div
            className="p-3 rounded border text-center"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              borderColor: 'var(--border)',
            }}
          >
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              IN PROGRESS
            </p>
            <p
              className="text-lg font-bold"
              style={{ color: 'var(--blue)' }}
            >
              {Math.max(0, totalCount - finalizedCount - failedCount)}
            </p>
          </div>
          <div
            className="p-3 rounded border text-center"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              borderColor: 'var(--border)',
            }}
          >
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              COMPLETED
            </p>
            <p
              className="text-lg font-bold"
              style={{ color: 'var(--green)' }}
            >
              {finalizedCount}
            </p>
          </div>
          <div
            className="p-3 rounded border text-center"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              borderColor: 'var(--border)',
            }}
          >
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              FAILED
            </p>
            <p
              className="text-lg font-bold"
              style={{ color: failedCount > 0 ? 'var(--red)' : 'var(--text-secondary)' }}
            >
              {failedCount}
            </p>
          </div>
        </div>

        {/* Agent progress cards */}
        <div className="space-y-3">
          {[1, 2, 3].map((agentId) => {
            const progress = agentProgress.get(agentId);
            if (!progress) {
              return (
                <AgentProgressCard
                  key={agentId}
                  agentId={agentId}
                  ticketTitle="Waiting..."
                  phase="generating_spec"
                  status="started"
                  message="Waiting to start..."
                />
              );
            }

            return (
              <AgentProgressCard
                key={agentId}
                agentId={progress.agentId}
                ticketTitle={progress.ticketTitle}
                phase={progress.phase as any}
                status={progress.status}
                message={progress.message}
                error={progress.error}
              />
            );
          })}
        </div>

        {/* Completion message */}
        {isComplete && (
          <div
            className="p-4 rounded-lg border text-center"
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderColor: 'var(--green)',
            }}
          >
            <p style={{ color: 'var(--green)' }} className="font-medium text-sm">
              ✓ All tickets successfully enriched! Redirecting...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
