'use client';

import React, { useEffect, useState } from 'react';
import { useWizardStore } from '@/tickets/stores/generation-wizard.store';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { QuestionRound } from '@/tickets/stores/generation-wizard.store';

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
    goBackToContext,
    confirmSpecContinue,
    startQuestionRound,
  } = useWizardStore();

  const [isInitialized, setIsInitialized] = useState(false);

  // On first mount, start the first question round if needed
  useEffect(() => {
    const initializeQuestions = async () => {
      if (!isInitialized && draftAecId && questionRounds.length === 0) {
        try {
          await startQuestionRound(draftAecId, 1);
        } catch (err) {
          console.error('Failed to initialize first question round:', err);
        }
      }
    };

    initializeQuestions();
    setIsInitialized(true);
  }, [draftAecId, questionRounds.length, isInitialized, startQuestionRound]);

  if (!draftAecId || !spec) {
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
      {error && (
        <Card className="p-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900 dark:text-red-200">
                Error: {error}
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
                {spec.problemStatement}
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
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 dark:text-gray-50 mb-2">
          Clarification Questions
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Answer clarification questions to improve specification quality (up to 3 rounds)
        </p>

        {/* Questions Loading State */}
        {roundStatus === 'generating' && (
          <div className="py-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Generating clarification questions...
            </p>
          </div>
        )}

        {/* No Questions */}
        {!roundStatus.includes('generating') && (!questionRounds || questionRounds.length === 0) && (
          <div className="py-8 text-center bg-gray-50 dark:bg-gray-900 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Questions will load automatically
            </p>
          </div>
        )}

        {/* Question Rounds - Placeholder for QuestionRoundsSection integration */}
        {questionRounds.length > 0 && (
          <div className="space-y-4">
            {questionRounds.map((round) => (
              <div
                key={round.roundNumber}
                className={`p-4 border rounded-lg ${
                  round.roundNumber === questionRounds[questionRounds.length - 1].roundNumber
                    ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <p className="font-medium text-gray-900 dark:text-gray-50">
                    Round {round.roundNumber} of 3
                  </p>
                  {round.answeredAt && (
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                      Answered
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {round.questions.length} question{round.questions.length !== 1 ? 's' : ''}
                </p>
                {/* Questions will render here via QuestionRoundsSection component */}
                <div className="space-y-3">
                  {round.questions.map((question) => (
                    <div key={question.id} className="text-sm">
                      <p className="text-gray-700 dark:text-gray-300 mb-2">
                        {question.question}
                      </p>
                      {question.context && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 italic mb-2">
                          {question.context}
                        </p>
                      )}
                      {question.type === 'radio' && question.options && (
                        <div className="space-y-1">
                          {question.options.map((opt) => (
                            <label key={opt} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <input type="radio" name={question.id} value={opt} disabled />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 justify-between pt-6 border-t border-gray-200 dark:border-gray-800">
        <Button
          variant="outline"
          onClick={goBackToContext}
          disabled={roundStatus === 'generating' || roundStatus === 'submitting' || roundStatus === 'finalizing'}
        >
          Back
        </Button>
        <Button
          onClick={confirmSpecContinue}
          disabled={roundStatus === 'generating' || roundStatus === 'submitting' || roundStatus === 'finalizing'}
        >
          {roundStatus === 'finalizing' ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Finalizing...
            </>
          ) : roundStatus === 'submitting' ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Continue to Review'
          )}
        </Button>
      </div>
    </div>
  );
}
