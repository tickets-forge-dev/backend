'use client';

import React from 'react';
import { Check } from 'lucide-react';
import type { ClarificationQuestion, QuestionAnswer } from '@/types/question-refinement';

interface QuestionCardProps {
  question: ClarificationQuestion;
  answer: QuestionAnswer;
  onAnswerChange: (answer: QuestionAnswer) => void;
  highlightedOptionIndex?: number;
  onOptionHighlight?: (index: number) => void;
}

export function QuestionCard({
  question,
  answer,
  onAnswerChange,
  highlightedOptionIndex = -1,
  onOptionHighlight,
}: QuestionCardProps) {
  const renderRadio = () => {
    const options = question.options || [];
    return (
      <div className="space-y-2">
        {options.map((option, idx) => {
          const isSelected = answer === option;
          const isHighlighted = highlightedOptionIndex === idx;
          return (
            <label
              key={option}
              onMouseEnter={() => onOptionHighlight?.(idx)}
              className={`
                flex items-center gap-3 p-3 rounded-lg cursor-pointer
                transition-all border-2 border-transparent
                ${isHighlighted ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50 dark:bg-blue-950/20' : 'bg-[var(--bg-subtle)] hover:bg-[var(--bg-subtle)]/80'}
                ${isSelected ? 'border-blue-500/50 bg-blue-50 dark:bg-blue-950/20' : ''}
              `}
            >
              <div
                className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center
                  transition-all
                  ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-[var(--border)]'}
                `}
              >
                {isSelected && <Check size={14} className="text-white" />}
              </div>
              <span className="text-[var(--text-sm)]">{option}</span>
            </label>
          );
        })}
      </div>
    );
  };

  const renderCheckbox = () => {
    const options = question.options || [];
    const selectedArray = Array.isArray(answer) ? answer : [];
    return (
      <div className="space-y-2">
        {options.map((option, idx) => {
          const isSelected = selectedArray.includes(option);
          const isHighlighted = highlightedOptionIndex === idx;
          return (
            <label
              key={option}
              onMouseEnter={() => onOptionHighlight?.(idx)}
              className={`
                flex items-center gap-3 p-3 rounded-lg cursor-pointer
                transition-all border-2 border-transparent
                ${isHighlighted ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50 dark:bg-blue-950/20' : 'bg-[var(--bg-subtle)] hover:bg-[var(--bg-subtle)]/80'}
                ${isSelected ? 'border-blue-500/50 bg-blue-50 dark:bg-blue-950/20' : ''}
              `}
            >
              <div
                className={`
                  w-5 h-5 rounded border-2 flex items-center justify-center
                  transition-all
                  ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-[var(--border)]'}
                `}
              >
                {isSelected && <Check size={14} className="text-white" />}
              </div>
              <span className="text-[var(--text-sm)]">{option}</span>
            </label>
          );
        })}
      </div>
    );
  };

  const renderText = () => {
    return (
      <input
        type="text"
        value={typeof answer === 'string' ? answer : ''}
        onChange={(e) => onAnswerChange(e.target.value)}
        placeholder="Type your answer here..."
        className={`
          w-full px-4 py-3 rounded-lg border-2 bg-[var(--bg-subtle)]
          transition-all
          ${answer ? 'border-blue-500' : 'border-[var(--border)]'}
          focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
          text-[var(--text-sm)]
        `}
        autoFocus
      />
    );
  };

  const renderTextarea = () => {
    return (
      <textarea
        value={typeof answer === 'string' ? answer : ''}
        onChange={(e) => onAnswerChange(e.target.value)}
        placeholder="Type your detailed answer here..."
        rows={5}
        className={`
          w-full px-4 py-3 rounded-lg border-2 bg-[var(--bg-subtle)] resize-none
          transition-all
          ${answer ? 'border-blue-500' : 'border-[var(--border)]'}
          focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
          text-[var(--text-sm)]
        `}
        autoFocus
      />
    );
  };

  const renderSelect = () => {
    const options = question.options || [];
    return (
      <select
        value={typeof answer === 'string' ? answer : ''}
        onChange={(e) => onAnswerChange(e.target.value)}
        className={`
          w-full px-4 py-3 rounded-lg border-2 bg-[var(--bg-subtle)]
          transition-all
          ${answer ? 'border-blue-500' : 'border-[var(--border)]'}
          focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
          text-[var(--text-sm)]
        `}
      >
        <option value="">Select an option...</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  };

  // Render based on question type
  switch (question.type) {
    case 'radio':
      return renderRadio();
    case 'checkbox':
      return renderCheckbox();
    case 'text':
      return renderText();
    case 'multiline':
      return renderTextarea();
    case 'select':
      return renderSelect();
    default:
      return <div className="text-[var(--text)]/50">Unknown question type</div>;
  }
}
