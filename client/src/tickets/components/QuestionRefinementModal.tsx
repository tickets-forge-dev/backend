'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronUp, ChevronDown, AlertCircle } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';
import type { ClarificationQuestion, RoundAnswers } from '@/types/question-refinement';
import { QuestionCard } from './QuestionCard';

interface QuestionRefinementModalProps {
  questions: ClarificationQuestion[];
  answers: RoundAnswers;
  onAnswerChange: (questionId: string, answer: string | string[]) => void;
  onSubmit: () => Promise<void>;
  onSkip: () => Promise<void>;
  isSubmitting: boolean;
}

export function QuestionRefinementModal({
  questions,
  answers,
  onAnswerChange,
  onSubmit,
  onSkip,
  isSubmitting,
}: QuestionRefinementModalProps) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [highlightedOptionIndex, setHighlightedOptionIndex] = useState(0);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [isLocalSubmitting, setIsLocalSubmitting] = useState(false);

  const hasQuestions = questions && questions.length > 0;
  const currentQuestion = hasQuestions ? questions[questionIndex] : null;
  const isLastQuestion = hasQuestions ? questionIndex === questions.length - 1 : false;
  const isFirstQuestion = questionIndex === 0;
  const isAnswered = currentQuestion ? currentQuestion.id in answers && answers[currentQuestion.id] !== null : false;

  // Handle keyboard navigation
  useEffect(() => {
    if (!hasQuestions) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Arrow up/down: navigate options
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedOptionIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const maxIndex = (currentQuestion?.options?.length || 1) - 1;
        setHighlightedOptionIndex((prev) => Math.min(maxIndex, prev + 1));
      }
      // Enter: select highlighted option and advance
      else if (e.key === 'Enter' && !isLocalSubmitting) {
        e.preventDefault();
        if (isLastQuestion && isAnswered) {
          handleSubmit();
        } else if (isAnswered) {
          handleNext();
        }
      }
      // Escape: close with confirmation
      else if (e.key === 'Escape') {
        e.preventDefault();
        setShowConfirmClose(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionIndex, currentQuestion, isAnswered, isLastQuestion, isLocalSubmitting, hasQuestions]);

  if (!hasQuestions || !currentQuestion) {
    return null;
  }

  const handleNext = () => {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      setHighlightedOptionIndex(0);
    }
  };

  const handlePrevious = () => {
    if (questionIndex > 0) {
      setQuestionIndex(questionIndex - 1);
      setHighlightedOptionIndex(0);
    }
  };

  const handleSubmit = async () => {
    if (!isAnswered || isLocalSubmitting) return;
    setIsLocalSubmitting(true);
    try {
      await onSubmit();
    } finally {
      setIsLocalSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsLocalSubmitting(true);
    try {
      await onSkip();
    } finally {
      setIsLocalSubmitting(false);
    }
  };

  return (
    <>
      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        {/* Modal Card */}
        <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--border)]/20">
            <div>
              <h2 className="text-[var(--text-lg)] font-semibold">
                {currentQuestion.question}
              </h2>
              {currentQuestion.context && (
                <p className="text-[var(--text-sm)] text-[var(--text)]/70 mt-1">
                  {currentQuestion.context}
                </p>
              )}
            </div>
            <button
              onClick={() => setShowConfirmClose(true)}
              className="text-[var(--text)]/50 hover:text-[var(--text)]/70 transition-colors"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="px-6 pt-4 pb-2 text-[var(--text-xs)] text-[var(--text)]/60">
            Question {questionIndex + 1} of {questions.length}
          </div>

          {/* Progress Bar */}
          <div className="px-6 pb-4">
            <div className="h-1 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Content Area - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <QuestionCard
              question={currentQuestion}
              answer={answers[currentQuestion.id] ?? null}
              onAnswerChange={(answer) => {
                if (answer !== null) {
                  onAnswerChange(currentQuestion.id, answer);
                  setHighlightedOptionIndex(0);
                }
              }}
              highlightedOptionIndex={highlightedOptionIndex}
              onOptionHighlight={setHighlightedOptionIndex}
            />

            {currentQuestion.impact && (
              <div className="mt-6 p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/50 rounded">
                <p className="text-[var(--text-xs)] text-blue-900 dark:text-blue-100">
                  <strong>Impact:</strong> {currentQuestion.impact}
                </p>
              </div>
            )}
          </div>

          {/* Footer - Buttons */}
          <div className="border-t border-[var(--border)]/20 p-6 flex items-center justify-between gap-3">
            {/* Left: Previous/Skip */}
            <div className="flex gap-2">
              {!isFirstQuestion && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={isLocalSubmitting}
                >
                  <ChevronUp size={16} className="mr-1" />
                  Previous
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                disabled={isLocalSubmitting}
              >
                Skip to End
              </Button>
            </div>

            {/* Right: Next/Submit */}
            <div className="flex gap-2">
              {!isLastQuestion && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={!isAnswered || isLocalSubmitting}
                >
                  Next
                  <ChevronDown size={16} className="ml-1" />
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!isAnswered || isLocalSubmitting}
                className={isAnswered ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                {isLastQuestion ? 'Finalize' : 'Next'}
              </Button>
            </div>
          </div>

          {/* Keyboard Hint */}
          <div className="px-6 pb-4 text-[var(--text-xs)] text-[var(--text)]/50 text-center">
            Use ↑↓ to navigate • Enter to select • Esc to close
          </div>
        </Card>
      </div>

      {/* Confirm Close Dialog */}
      {showConfirmClose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[51] p-4">
          <Card className="w-full max-w-sm">
            <div className="p-6">
              <div className="flex gap-3">
                <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold">Discard answers?</h3>
                  <p className="text-[var(--text-sm)] text-[var(--text)]/70 mt-1">
                    Your answers will not be saved if you close now.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmClose(false)}
                >
                  Keep Answering
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowConfirmClose(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
