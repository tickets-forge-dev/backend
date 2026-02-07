'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useWizardStore } from '@/tickets/stores/generation-wizard.store';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { QuestionRoundsSection } from '../QuestionRoundsSection';
import type { RoundAnswers } from '@/types/question-refinement';

/**
 * Stage 3: Draft Review with Question Refinement
 *
 * Displays:
 * - Initial generated spec (problem, solution, scope, AC)
 * - 3-round iterative question refinement
 * - User can skip questions and go straight to review
 *
 * Navigation:
 * - Back: Returns to Stage 2
 * - After questions: Continues to Stage 4
 */
export function Stage3Draft() {
  const {
    draftAecId,
    input,
    spec,
    roundStatus,
    error,
    questionRounds,
    currentRound,
    maxRounds,
    goBackToContext,
    confirmContextContinue,
    confirmSpecContinue,
    startQuestionRound,
    submitRoundAnswers,
    skipToFinalize,
    finalizeSpec,
    setError,
  } = useWizardStore();

  const [localError, setLocalError] = useState<string | null>(null);
  const initRef = useRef(false);

  // Step 1: Create draft if needed
  useEffect(() => {
    if (!draftAecId && !initRef.current) {
      initRef.current = true;
      console.log('[Stage3Draft] Creating draft...');
      confirmContextContinue().catch((err) => {
        console.error('[Stage3Draft] Draft creation failed:', err);
        setLocalError(err instanceof Error ? err.message : 'Failed to create draft');
      });
    }
  }, [draftAecId, confirmContextContinue]);

  // Step 2: Start questions once draft exists
  const rounds = questionRounds || [];
  useEffect(() => {
    if (draftAecId && rounds.length === 0) {
      console.log('[Stage3Draft] Starting question round for draft:', draftAecId);
      startQuestionRound(draftAecId, 1).catch((err) => {
        console.error('[Stage3Draft] Question round failed:', err);
        setLocalError(err instanceof Error ? err.message : 'Failed to start questions');
      });
    }
  }, [draftAecId, rounds.length, startQuestionRound]);

  // Handle submitting answers for a round
  const handleSubmitAnswers = async (roundNumber: number, answers: RoundAnswers) => {
    try {
      setLocalError(null);
      const filtered = Object.fromEntries(
        Object.entries(answers).filter(([, v]) => v != null)
      ) as Record<string, string | string[]>;
      const nextAction = await submitRoundAnswers(roundNumber, filtered);

      if (nextAction === 'finalize') {
        // Auto-finalize the spec
        await finalizeSpec();
      }
      // If 'continue', the store will have updated with the next round automatically
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to submit answers';
      setLocalError(errorMsg);
      setError(errorMsg);
    }
  };

  // Handle skipping to finalize
  const handleSkipToFinalize = async () => {
    try {
      setLocalError(null);
      await skipToFinalize();
      // Auto-finalize the spec
      await finalizeSpec();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to skip to finalize';
      setLocalError(errorMsg);
      setError(errorMsg);
    }
  };

  // Handle finalizing spec
  const handleFinalizeSpec = async () => {
    try {
      setLocalError(null);
      await finalizeSpec();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to finalize spec';
      setLocalError(errorMsg);
      setError(errorMsg);
    }
  };

  // Determine if we're still submitting
  const isSubmitting = roundStatus === 'submitting' || roundStatus === 'finalizing';

  if (!draftAecId) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Initializing ticket and questions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center sm:text-left">
        <h2 className="text-xl font-medium text-gray-900 dark:text-gray-50 mb-2">
          Review Draft Specification
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Review the initial specification and answer clarification questions to improve ticket quality.
        </p>
      </div>

      {/* Error Display */}
      {(error || localError) && (
        <Card className="p-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900 dark:text-red-200">
                Error: {error || localError}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Initial Spec Summary */}
      {spec && (
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-gray-50">
            Initial Specification
          </h3>

          {/* Problem Statement */}
          {spec.problemStatement && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Problem
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {typeof spec.problemStatement === 'string'
                  ? spec.problemStatement
                  : (spec.problemStatement as any).narrative || JSON.stringify(spec.problemStatement)}
              </p>
            </div>
          )}

          {/* Solution */}
          {spec.solution && spec.solution.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-800">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Solution
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {spec.solution.map((item, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-gray-400">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Acceptance Criteria */}
          {spec.acceptanceCriteria && spec.acceptanceCriteria.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-800">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Acceptance Criteria
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {spec.acceptanceCriteria.map((item, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-gray-400">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Questions Section */}
      {roundStatus === 'generating' ? (
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 text-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Generating clarification questions...
          </p>
        </div>
      ) : rounds.length > 0 && currentRound > 0 ? (
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
          <QuestionRoundsSection
            questionRounds={rounds}
            currentRound={currentRound}
            maxRounds={maxRounds}
            onSubmitAnswers={handleSubmitAnswers}
            onSkipToFinalize={handleSkipToFinalize}
            onFinalizeSpec={handleFinalizeSpec}
            isSubmitting={isSubmitting}
            error={localError}
            onDismissError={() => setLocalError(null)}
            useModalUI={true}
          />
        </div>
      ) : (
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 text-center py-12">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Initializing questions...
          </p>
        </div>
      )}

      {/* Navigation - Show back button always, continue button after questions done */}
      <div className="flex gap-3 justify-between pt-6 border-t border-gray-200 dark:border-gray-800">
        <Button
          variant="outline"
          onClick={goBackToContext}
          disabled={roundStatus === 'generating' || roundStatus === 'submitting' || roundStatus === 'finalizing'}
        >
          Back
        </Button>

        {/* Show continue button only if questions are done (no current round or finalization complete) */}
        {(!rounds.length || currentRound === 0) && (
          <Button
            onClick={confirmSpecContinue}
            disabled={roundStatus === 'generating' || roundStatus === 'submitting' || roundStatus === 'finalizing'}
          >
            {roundStatus === 'finalizing' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Finalizing...
              </>
            ) : (
              'Continue to Review'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
