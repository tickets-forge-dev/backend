/**
 * QuestionsWizard Component - Phase D
 * 
 * HITL Suspension Point 2: Answer clarifying questions
 * Shows all questions at once with selectable options
 * Actions: Submit / Skip All
 */

'use client';

import { useState } from 'react';
import { useWorkflowStore, type Question } from '@/src/stores/workflow.store';
import { X, HelpCircle, Loader2 } from 'lucide-react';

interface QuestionsWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuestionsWizard({ isOpen, onClose }: QuestionsWizardProps) {
  const { questions, answers, submitQuestionAnswers, skipQuestions, error, clearError } =
    useWorkflowStore();

  const [isLoading, setIsLoading] = useState(false);
  const [localAnswers, setLocalAnswers] = useState<Record<string, string | string[]>>(answers);

  if (!isOpen || questions.length === 0) return null;

  const handleAnswer = (questionId: string, value: string | string[]) => {
    setLocalAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    clearError();
    try {
      await submitQuestionAnswers(localAnswers as Record<string, string>);
      onClose();
    } catch (error: any) {
      console.error('Failed to submit answers:', error);
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
    } finally {
      setIsLoading(false);
    }
  };

  const answeredCount = Object.keys(localAnswers).filter(k => localAnswers[k]).length;
  const canSubmit = answeredCount > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
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
                    Answer these questions to improve ticket quality
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
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {questions.map((question) => (
              <div key={question.id} className="space-y-3">
                <label className="block text-base font-medium text-gray-900">
                  {question.text}
                </label>

                {question.type === 'radio' ? (
                  <div className="space-y-2">
                    {question.options?.map((option) => (
                      <label key={option} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name={question.id}
                          value={option}
                          checked={localAnswers[question.id] === option}
                          onChange={(e) => handleAnswer(question.id, e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                ) : question.type === 'checkbox' ? (
                  <div className="space-y-2">
                    {question.options?.map((option) => (
                      <label key={option} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          value={option}
                          checked={
                            Array.isArray(localAnswers[question.id])
                              ? (localAnswers[question.id] as string[]).includes(option)
                              : false
                          }
                          onChange={(e) => {
                            const current = Array.isArray(localAnswers[question.id])
                              ? (localAnswers[question.id] as string[])
                              : [];
                            const updated = e.target.checked
                              ? [...current, option]
                              : current.filter(o => o !== option);
                            handleAnswer(question.id, updated);
                          }}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    value={(localAnswers[question.id] as string) || ''}
                    onChange={(e) => handleAnswer(question.id, e.target.value)}
                    placeholder="Type your answer here..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {answeredCount} of {questions.length} answered
              </p>

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
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  Submit Answers
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
