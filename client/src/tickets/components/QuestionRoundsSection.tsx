'use client';

import React, { useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';
import { QuestionRoundPanel } from './wizard/QuestionRoundPanel';
import { QuestionRefinementModal } from './QuestionRefinementModal';
import type { QuestionRound, RoundAnswers } from '@/types/question-refinement';

interface QuestionRoundsSectionProps {
  questionRounds: QuestionRound[];
  currentRound: number;
  maxRounds: number;
  onSubmitAnswers: (roundNumber: number, answers: RoundAnswers) => Promise<void>;
  onSkipToFinalize: () => Promise<void>;
  onFinalizeSpec?: () => Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
  onDismissError?: () => void;
  useModalUI?: boolean; // NEW: Enable modal UI instead of panels
}

/**
 * QuestionRoundsSection Component
 *
 * Displays the iterative question refinement workflow:
 * - Shows completed rounds (collapsed)
 * - Shows current round (expanded)
 * - Shows progress indicator
 * - Handles submission and skip actions
 */
export function QuestionRoundsSection({
  questionRounds,
  currentRound,
  maxRounds,
  onSubmitAnswers,
  onSkipToFinalize,
  onFinalizeSpec,
  isSubmitting = false,
  error = null,
  onDismissError,
  useModalUI = false,
}: QuestionRoundsSectionProps) {
  const [localAnswers, setLocalAnswers] = useState<RoundAnswers>({});
  const [isSkipping, setIsSkipping] = useState(false);

  if (!questionRounds || questionRounds.length === 0) {
    return null;
  }

  // Modal UI path (new single-question interface)
  if (useModalUI) {
    const currentRoundData = questionRounds.find((r) => r.roundNumber === currentRound);
    if (!currentRoundData || currentRoundData.questions.length === 0) {
      return null;
    }

    const handleAnswerChange = (questionId: string, answer: string | string[]) => {
      setLocalAnswers((prev) => ({
        ...prev,
        [questionId]: answer,
      }));
    };

    const handleSubmit = async () => {
      const allAnswers = {
        ...currentRoundData.answers,
        ...localAnswers,
      };
      try {
        await onSubmitAnswers(currentRound, allAnswers);
        setLocalAnswers({});
        // Check if we should finalize
        if (currentRound >= maxRounds && onFinalizeSpec) {
          await onFinalizeSpec();
        }
      } catch (err) {
        // Error handled by parent
      }
    };

    const handleSkip = async () => {
      setIsSkipping(true);
      try {
        await onSkipToFinalize();
      } finally {
        setIsSkipping(false);
      }
    };

    return (
      <QuestionRefinementModal
        questions={currentRoundData.questions}
        answers={{
          ...currentRoundData.answers,
          ...localAnswers,
        }}
        onAnswerChange={handleAnswerChange}
        onSubmit={handleSubmit}
        onSkip={handleSkip}
        isSubmitting={isSubmitting}
      />
    );
  }

  // Existing panel UI path (backward compatible)

  const currentRoundData = questionRounds.find((r) => r.roundNumber === currentRound);
  const maxRound = Math.max(...questionRounds.map((r) => r.roundNumber), 0);
  const isFinalRound = currentRound >= maxRounds;

  // Validate currentRound is within bounds
  const isValidRound = currentRound >= 1 && currentRound <= maxRounds && currentRoundData;

  const handleAnswerChange = (questionId: string, answer: string | string[]) => {
    setLocalAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = async () => {
    if (!currentRoundData || !isValidRound) return;

    try {
      // Merge with existing answers
      const allAnswers = {
        ...currentRoundData.answers,
        ...localAnswers,
      };

      await onSubmitAnswers(currentRound, allAnswers);
      // Reset local answers after successful submission
      setLocalAnswers({});
    } catch (err) {
      // Error handled by parent
    }
  };

  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      await onSkipToFinalize();
    } finally {
      setIsSkipping(false);
    }
  };

  const handleFinalize = async () => {
    try {
      // Submit current round's answers first so the backend has them
      if (currentRoundData && isValidRound) {
        const allAnswers = {
          ...currentRoundData.answers,
          ...localAnswers,
        };
        await onSubmitAnswers(currentRound, allAnswers);
        setLocalAnswers({});
      }

      // Then finalize
      if (onFinalizeSpec) {
        await onFinalizeSpec();
      }
    } catch (err) {
      // Error handled by parent
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-[var(--text-lg)] font-medium text-[var(--text)]">
          Question Refinement
        </h2>
        <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
          Answer clarification questions to improve spec quality
        </p>
      </div>

      {/* Progress Indicator - only for multi-round flows */}
      {maxRounds >= 2 && (
        <div className="text-[var(--text-sm)] text-[var(--text-secondary)]">
          <div className="flex items-center justify-between mb-2">
            <span>
              Progress: Round {currentRound} of {maxRounds}
            </span>
            <span className="text-[var(--text-xs)]">
              {Math.round((currentRound / maxRounds) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 bg-[var(--bg-hover)] rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${(currentRound / maxRounds) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <Card className="p-4 border-[var(--red)] bg-red-50 dark:bg-red-950/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-[var(--red)] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[var(--text-sm)] font-medium text-[var(--red)]">
                Error submitting answers
              </p>
              <p className="text-[var(--text-sm)] text-[var(--text-secondary)] mt-1">
                {error}
              </p>
            </div>
            {onDismissError && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismissError}
                className="text-[var(--red)]"
              >
                Dismiss
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Question Rounds */}
      <div className="space-y-4">
        {questionRounds.map((round) => (
          <QuestionRoundPanel
            key={round.roundNumber}
            round={{
              ...round,
              answers: round.roundNumber === currentRound
                ? { ...round.answers, ...localAnswers }
                : round.answers,
            }}
            isActive={round.roundNumber === currentRound}
            onAnswer={
              round.roundNumber === currentRound
                ? (questionId, answer) => handleAnswerChange(questionId, answer)
                : () => {} // No-op for inactive rounds
            }
            disabled={round.roundNumber !== currentRound}
            hideHeader={maxRounds < 2}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-6 border-t border-[var(--border)]">
        <Button
          variant="outline"
          onClick={handleSkip}
          disabled={isSubmitting || isSkipping}
          className="flex-1"
        >
          {isSkipping ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Skipping...
            </>
          ) : (
            'Skip to Finalize'
          )}
        </Button>

        {isFinalRound ? (
          // Final round - show finalize button
          <Button
            onClick={handleFinalize}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Finalizing...
              </>
            ) : (
              'Finalize Spec'
            )}
          </Button>
        ) : (
          // Not final round - show continue button
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit & Continue'
            )}
          </Button>
        )}
      </div>

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-950 rounded-lg p-8 flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
              {currentRound >= maxRounds ? 'Finalizing spec...' : 'Processing your answers...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
