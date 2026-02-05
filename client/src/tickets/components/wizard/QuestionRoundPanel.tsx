import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/core/components/ui/badge';
import type { QuestionRound, ClarificationQuestion } from '@/types/question-refinement';

interface QuestionRoundPanelProps {
  round: QuestionRound;
  isActive: boolean;
  onAnswer: (questionId: string, answer: string | string[]) => void;
  disabled?: boolean;
}

/**
 * QuestionRoundPanel - Collapsible component for displaying a single question round
 *
 * Shows:
 * - Round number and status badge
 * - Answered/answered timestamps
 * - Collapsible question list
 * - Question inputs (radio, checkbox, text, multiline, select)
 * - Skip indicator if round was skipped by user
 */
export function QuestionRoundPanel({
  round,
  isActive,
  onAnswer,
  disabled = false,
}: QuestionRoundPanelProps) {
  const [isExpanded, setIsExpanded] = useState(isActive);

  const isAnswered = round.answeredAt !== null;
  const isSkipped = round.skippedByUser;

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="border rounded-lg mb-4 overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled}
        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 disabled:bg-gray-50 disabled:opacity-50 flex items-center justify-between"
      >
        <div className="flex items-center gap-3 flex-1 text-left">
          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}

          <span className="font-semibold">
            {isActive ? '◀' : isAnswered ? '✅' : '⏭️'} Round {round.roundNumber}: {getRoundTitle(round.roundNumber)}
          </span>

          {isAnswered && (
            <span className="text-xs text-gray-500">
              Answered {formatTime(round.answeredAt!)}
            </span>
          )}

          {isActive && !isAnswered && (
            <Badge variant="default">Answering now...</Badge>
          )}

          {isSkipped && (
            <Badge variant="secondary">Skipped</Badge>
          )}
        </div>
      </button>

      {/* Content - Visible when expanded */}
      {isExpanded && (
        <div className="px-4 py-4 border-t bg-white space-y-6">
          {round.questions.map((question, idx) => (
            <QuestionInput
              key={question.id}
              question={question}
              value={round.answers[question.id] || (question.type === 'checkbox' ? [] : '')}
              onChange={(answer) => onAnswer(question.id, answer)}
              disabled={disabled || !isActive}
              questionNumber={idx + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Individual question input component
 * Renders different input types based on question.type
 */
interface QuestionInputProps {
  question: ClarificationQuestion;
  value?: string | string[];
  onChange: (answer: string | string[]) => void;
  disabled: boolean;
  questionNumber: number;
}

function QuestionInput({
  question,
  value,
  onChange,
  disabled,
  questionNumber,
}: QuestionInputProps) {
  return (
    <div className="space-y-2">
      {/* Question Text with Context */}
      <div className="flex gap-2">
        <label className="font-medium text-sm flex-1">
          Q{questionNumber}: {question.question}
        </label>
        {question.context && (
          <button
            title={question.context}
            className="text-gray-400 hover:text-gray-600 text-lg"
          >
            ℹ️
          </button>
        )}
      </div>

      {/* Impact Badge */}
      {question.impact && (
        <p className="text-xs text-gray-600 ml-0.5">
          💡 <span className="italic">{question.impact}</span>
        </p>
      )}

      {/* Input Component Based on Type */}
      {question.type === 'radio' && (
        <RadioInput
          options={question.options || []}
          value={value as string}
          onChange={onChange}
          disabled={disabled}
        />
      )}

      {question.type === 'checkbox' && (
        <CheckboxInput
          options={question.options || []}
          value={value as string[]}
          onChange={onChange}
          disabled={disabled}
        />
      )}

      {question.type === 'text' && (
        <TextInput
          value={value as string}
          onChange={onChange}
          disabled={disabled}
          placeholder="Enter your answer..."
        />
      )}

      {question.type === 'multiline' && (
        <TextAreaInput
          value={value as string}
          onChange={onChange}
          disabled={disabled}
          placeholder="Enter your detailed answer..."
        />
      )}

      {question.type === 'select' && (
        <SelectInput
          options={question.options || []}
          value={value as string}
          onChange={onChange}
          disabled={disabled}
        />
      )}
    </div>
  );
}

/**
 * Radio Button Input
 */
function RadioInput({
  options,
  value,
  onChange,
  disabled,
}: {
  options: string[];
  value?: string;
  onChange: (answer: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-2 ml-4">
      {options.map((option) => (
        <label key={option} className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={option}
            value={option}
            checked={value === option}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-4 h-4"
          />
          <span className="text-sm">{option}</span>
        </label>
      ))}
    </div>
  );
}

/**
 * Checkbox Input
 */
function CheckboxInput({
  options,
  value = [],
  onChange,
  disabled,
}: {
  options: string[];
  value?: string[];
  onChange: (answer: string[]) => void;
  disabled: boolean;
}) {
  const selectedValues = Array.isArray(value) ? value : [];

  const handleChange = (option: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedValues, option]);
    } else {
      onChange(selectedValues.filter((v) => v !== option));
    }
  };

  return (
    <div className="space-y-2 ml-4">
      {options.map((option) => (
        <label key={option} className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            value={option}
            checked={selectedValues.includes(option)}
            onChange={(e) => handleChange(option, e.target.checked)}
            disabled={disabled}
            className="w-4 h-4"
          />
          <span className="text-sm">{option}</span>
        </label>
      ))}
    </div>
  );
}

/**
 * Text Input (single line)
 */
function TextInput({
  value,
  onChange,
  disabled,
  placeholder,
}: {
  value?: string;
  onChange: (answer: string) => void;
  disabled: boolean;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-100"
    />
  );
}

/**
 * Text Area (multiline)
 */
function TextAreaInput({
  value,
  onChange,
  disabled,
  placeholder,
}: {
  value?: string;
  onChange: (answer: string) => void;
  disabled: boolean;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      maxLength={500}
      rows={4}
      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-100"
    />
  );
}

/**
 * Select Dropdown
 */
function SelectInput({
  options,
  value,
  onChange,
  disabled,
}: {
  options: string[];
  value?: string;
  onChange: (answer: string) => void;
  disabled: boolean;
}) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-100"
    >
      <option value="">Select an option...</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

/**
 * Get human-readable title for round number
 */
function getRoundTitle(roundNumber: 1 | 2 | 3): string {
  switch (roundNumber) {
    case 1:
      return 'Initial Clarification';
    case 2:
      return 'Refinement Questions';
    case 3:
      return 'Final Clarification';
    default:
      return `Round ${roundNumber}`;
  }
}
