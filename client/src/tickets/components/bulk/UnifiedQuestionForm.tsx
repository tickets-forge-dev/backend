'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { EnrichedQuestion } from '@/tickets/stores/bulk-enrichment.store';

/**
 * UnifiedQuestionForm - Collect answers for all ticket questions
 *
 * Groups questions by ticket and allows user to answer all at once.
 * Questions can be: radio, checkbox, text, textarea, select
 */

export interface UnifiedQuestionFormProps {
  questionsByTicket: Map<string, EnrichedQuestion[]>;
  ticketTitles: Map<string, string>;
  onAnswerChange: (questionId: string, answer: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

interface AnswerState {
  [questionId: string]: string;
}

export function UnifiedQuestionForm({
  questionsByTicket,
  ticketTitles,
  onAnswerChange,
  onSubmit,
  isSubmitting = false,
}: UnifiedQuestionFormProps) {
  // Start with all sections collapsed (empty set)
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerState>({});

  // Track total questions
  const totalQuestions = Array.from(questionsByTicket.values()).reduce(
    (sum, questions) => sum + questions.length,
    0,
  );
  const answeredQuestions = Object.keys(answers).filter((id) => answers[id]?.trim()).length;

  // Toggle ticket expansion - accordion behavior (only one at a time)
  const toggleTicket = (ticketId: string) => {
    setExpandedTicket((prev) => (prev === ticketId ? null : ticketId));
  };

  // Count answered questions per ticket
  const getAnsweredCount = (ticketId: string) => {
    const ticketQuestions = questionsByTicket.get(ticketId) || [];
    return ticketQuestions.filter((q) => answers[q.id]?.trim()).length;
  };

  // Handle answer change
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    onAnswerChange(questionId, value);
  };

  return (
    <div className="space-y-6">
      {/* Progress header */}
      <div
        className="p-4 rounded-lg border"
        style={{
          backgroundColor: 'var(--bg-subtle)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p
              className="text-sm font-medium"
              style={{ color: 'var(--text)' }}
            >
              Answer Clarification Questions
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              {answeredQuestions} of {totalQuestions} questions answered
            </p>
          </div>

          {/* Progress bar */}
          <div
            className="w-24 h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
          >
            <div
              className="h-full transition-all duration-300"
              style={{
                width: totalQuestions > 0 ? `${(answeredQuestions / totalQuestions) * 100}%` : '0%',
                backgroundColor: 'var(--blue)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Questions grouped by ticket */}
      <div className="space-y-4">
        {Array.from(questionsByTicket.entries()).map(([ticketId, questions]) => {
          const answeredCount = getAnsweredCount(ticketId);
          const isExpanded = expandedTicket === ticketId;

          return (
            <div key={ticketId}>
              {/* Ticket header (collapsible) */}
              <button
                onClick={() => toggleTicket(ticketId)}
                className="w-full flex items-center gap-2 p-3 rounded-lg border mb-3 hover:border-[var(--text-secondary)]/50 transition-colors"
                style={{
                  backgroundColor: isExpanded ? 'var(--bg-subtle)' : 'var(--bg)',
                  borderColor: isExpanded ? 'var(--blue)' : 'var(--border)',
                }}
              >
                <ChevronDown
                  className="w-4 h-4 transition-transform flex-shrink-0"
                  style={{
                    color: 'var(--text-secondary)',
                    transform: isExpanded ? 'rotate(0)' : 'rotate(-90deg)',
                  }}
                />
                <div className="flex-1 text-left min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: 'var(--text)' }}
                  >
                    {ticketTitles.get(ticketId) || ticketId}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <p
                    className="text-xs"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <span style={{ color: answeredCount > 0 ? 'var(--green)' : 'var(--text-tertiary)' }}>
                      {answeredCount}
                    </span>
                    /{questions.length}
                  </p>
                  <p
                    className="text-xs flex-shrink-0"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {questions.length === 1 ? 'question' : 'questions'}
                  </p>
                </div>
              </button>

              {/* Questions (shown when expanded) */}
              {isExpanded && (
                <div className="space-y-4 ml-4 mb-6">
                  {questions.map((question) => (
                    <QuestionInput
                      key={question.id}
                      question={question}
                      answer={answers[question.id] || ''}
                      onAnswerChange={(value) => handleAnswerChange(question.id, value)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit button */}
      <div className="space-y-3 pt-6" style={{ borderTopColor: 'var(--border)', borderTopWidth: '1px' }}>
        {answeredQuestions < totalQuestions && (
          <div
            className="p-3 rounded-lg border text-sm"
            style={{
              backgroundColor: 'rgba(251, 146, 60, 0.1)',
              borderColor: 'var(--amber-600)',
              color: 'var(--amber-600)',
            }}
          >
            ⚠️ {totalQuestions - answeredQuestions} of {totalQuestions} questions not answered. You can continue anyway.
          </div>
        )}
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full flex items-center gap-2"
        >
          {isSubmitting && (
            <div
              className="w-4 h-4 border-2 border-transparent border-t-current rounded-full animate-spin"
              style={{ borderTopColor: 'currentColor' }}
            />
          )}
          {isSubmitting ? 'Finalizing Tickets...' : 'Finalize All Tickets'}
        </Button>
      </div>
    </div>
  );
}

/**
 * QuestionInput - Single question renderer
 */
interface QuestionInputProps {
  question: EnrichedQuestion;
  answer: string;
  onAnswerChange: (value: string) => void;
}

function QuestionInput({ question, answer, onAnswerChange }: QuestionInputProps) {
  return (
    <div className="space-y-2">
      <label className="block">
        <p
          className="text-sm font-medium mb-2"
          style={{ color: 'var(--text)' }}
        >
          {question.question}
        </p>

        {question.type === 'multiline' ? (
          <textarea
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value.slice(0, 5000))}
            className="w-full px-3 py-2 rounded border text-sm"
            style={{
              backgroundColor: 'var(--bg)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
            placeholder="Your answer..."
            rows={4}
            maxLength={5000}
          />
        ) : question.type === 'text' ? (
          <input
            type="text"
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value.slice(0, 1000))}
            className="w-full px-3 py-2 rounded border text-sm"
            style={{
              backgroundColor: 'var(--bg)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
            placeholder="Your answer..."
            maxLength={1000}
          />
        ) : question.type === 'radio' && question.options ? (
          <div className="space-y-2">
            {question.options.map((option) => (
              <label key={option} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={answer === option}
                  onChange={(e) => onAnswerChange(e.target.value)}
                  className="w-4 h-4"
                />
                <span
                  className="text-sm"
                  style={{ color: 'var(--text)' }}
                >
                  {option}
                </span>
              </label>
            ))}
          </div>
        ) : question.type === 'checkbox' && question.options ? (
          <div className="space-y-2">
            {question.options.map((option) => (
              <label key={option} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  value={option}
                  checked={answer.split(',').includes(option)}
                  onChange={(e) => {
                    const vals = new Set(answer.split(',').filter((v) => v));
                    if (e.target.checked) {
                      vals.add(option);
                    } else {
                      vals.delete(option);
                    }
                    onAnswerChange(Array.from(vals).join(','));
                  }}
                  className="w-4 h-4"
                />
                <span
                  className="text-sm"
                  style={{ color: 'var(--text)' }}
                >
                  {option}
                </span>
              </label>
            ))}
          </div>
        ) : question.type === 'select' && question.options ? (
          <select
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value)}
            className="w-full px-3 py-2 rounded border text-sm"
            style={{
              backgroundColor: 'var(--bg)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
            <option value="">Select an option...</option>
            {question.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : null}
      </label>
    </div>
  );
}
