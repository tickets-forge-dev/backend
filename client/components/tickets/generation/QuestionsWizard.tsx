/**
 * QuestionsWizard Component - Phase D
 * 
 * HITL Suspension Point 2: Answer clarifying questions
 * Wizard-style UI (one question at a time)
 * Actions: Submit / Skip All
 */

'use client';

import { useState } from 'react';
import { useWorkflowStore, type Question } from '@/src/stores/workflow.store';
import { ChevronLeft, ChevronRight, X, HelpCircle, Loader2 } from 'lucide-react';

interface QuestionsWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuestionsWizard({ isOpen, onClose }: QuestionsWizardProps) {
  const { questions, answers, setAnswers, submitQuestionAnswers, skipQuestions, error, clearError } =
    useWorkflowStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>(answers);

  if (!isOpen || questions.length === 0) return null;

  const currentQuestion = questions[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === questions.length - 1;
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleNext = () => {
    if (!isLast) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirst) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleAnswer = (value: string) => {
    const newAnswers = { ...localAnswers, [currentQuestion.id]: value };
    setLocalAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    clearError();
    try {
      await submitQuestionAnswers(localAnswers);
      onClose();
    } catch (error: any) {
      console.error('Failed to submit answers:', error);
      // Error state is managed by store
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setIsLoading(true);
    clearError();
    try {
      await skipQuestions();
      onClose();
    } catch (error: any) {
      console.error('Failed to skip questions:', error);
      // Error state is managed by store
    } finally {
      setIsLoading(false);
    }
  };

  const answeredCount = Object.keys(localAnswers).length;
  const canSubmit = answeredCount > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-6 h-6 text-blue-600" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Clarifying Questions
                  </h2>
                  <p className="text-sm text-gray-600">
                    Question {currentIndex + 1} of {questions.length}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {/* Context */}
            {currentQuestion.context && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">{currentQuestion.context}</p>
              </div>
            )}

            {/* Question */}
            <div className="mb-6">
              <label className="block text-base font-medium text-gray-900 mb-3">
                {currentQuestion.text}
              </label>

              <textarea
                value={answers[currentQuestion.id] || currentQuestion.defaultAnswer || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder="Type your answer here..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
              />

              {currentQuestion.defaultAnswer && !answers[currentQuestion.id] && (
                <p className="mt-2 text-xs text-gray-500">
                  Default: {currentQuestion.defaultAnswer}
                </p>
              )}
            </div>

            {/* Answer Status */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">
                {answeredCount} of {questions.length} answered
              </span>
              {answeredCount === questions.length && (
                <span className="text-green-600 font-medium">
                  ✓ All questions answered
                </span>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              {/* Navigation */}
              <div className="flex gap-2">
                <button
                  onClick={handlePrevious}
                  disabled={isFirst}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                {!isLast && (
                  <button
                    onClick={handleNext}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleSkip}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Skip All
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !canSubmit}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {isLast ? 'Submit Answers' : 'Submit & Continue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
