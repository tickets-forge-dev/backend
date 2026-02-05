'use client';

import React, { useState } from 'react';
import { useWizardStore } from '@/tickets/stores/generation-wizard.store';
import { Button } from '@/core/components/ui/button';
import { Checkbox } from '@/core/components/ui/checkbox';
import { Input } from '@/core/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/core/components/ui/radio-group';
import { Textarea } from '@/core/components/ui/textarea';
import { Badge } from '@/core/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { QuestionRoundPanel } from './QuestionRoundPanel';

/**
 * Stage 3: Draft Review Component
 *
 * Displays:
 * - Problem statement (editable)
 * - Solution overview (editable)
 * - Acceptance criteria (editable)
 * - Scope: in-scope and out-of-scope (editable)
 * - Clarification questions (form fields - radio, checkbox, text, multiline, select)
 * - File changes (create/modify/delete with paths)
 *
 * Features:
 * - Accordion pattern to manage sections
 * - Auto-save answers to Zustand store
 * - Edit buttons open modals for each section
 * - Navigate back or continue to Stage 4
 */
export function Stage3Draft() {
  const {
    spec,
    answers,
    loading,
    answerQuestion,
    goBackToContext,
    confirmSpecContinue,
    questionRounds,
    currentRound,
    roundStatus,
    answerQuestionInRound,
    submitRoundAnswers,
    skipToFinalize,
    finalizeSpec,
  } = useWizardStore();

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['problem', 'solution', 'acceptance', 'questions'])
  );
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const areCurrentRoundQuestionsAnswered = (): boolean => {
    if (!questionRounds || questionRounds.length === 0) return true;

    const currentRoundData = questionRounds.find(r => r.roundNumber === currentRound);
    if (!currentRoundData) return true;

    // All questions must have answers
    return currentRoundData.questions.every(q => {
      const answer = currentRoundData.answers[q.id];
      if (Array.isArray(answer)) {
        return answer.length > 0;
      }
      return !!answer;
    });
  };

  if (!spec) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Generating specification...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center sm:text-left">
        <h2 className="text-xl font-medium text-gray-900 dark:text-gray-50 mb-2">
          Review Generated Specification
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Review the generated spec and answer clarification questions below.
        </p>
      </div>

      {/* Problem Statement Section */}
      <Section
        title="Problem Statement"
        expanded={expandedSections.has('problem')}
        onToggle={() => toggleSection('problem')}
      >
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Narrative</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {spec.problemStatement.narrative}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Why It Matters</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {spec.problemStatement.whyItMatters}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Context</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {spec.problemStatement.context}
            </p>
          </div>
        </div>
      </Section>

      {/* Solution Section */}
      <Section
        title="Solution"
        expanded={expandedSections.has('solution')}
        onToggle={() => toggleSection('solution')}
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Overview</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {spec.solution.overview}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Implementation Steps</p>
            <ol className="space-y-2">
              {spec.solution.steps.map((step) => (
                <li key={step.order} className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">{step.order}.</span> {step.description}
                  {step.file && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 ml-6 font-mono">
                      {step.file}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      {/* Scope Section */}
      <Section
        title="Scope"
        expanded={expandedSections.has('scope')}
        onToggle={() => toggleSection('scope')}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">In Scope</p>
            <ul className="space-y-1">
              {spec.inScope.map((item, i) => (
                <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Out of Scope</p>
            <ul className="space-y-1">
              {spec.outOfScope.map((item, i) => (
                <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                  <span className="text-gray-400 dark:text-gray-600 mt-1">−</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* Acceptance Criteria Section */}
      <Section
        title={`Acceptance Criteria (${spec.acceptanceCriteria.length})`}
        expanded={expandedSections.has('acceptance')}
        onToggle={() => toggleSection('acceptance')}
      >
        <div className="space-y-3">
          {spec.acceptanceCriteria.map((ac) => (
            <div
              key={ac.given}
              className="border-l-4 border-blue-200 dark:border-blue-800 pl-4 py-2"
            >
              <p className="text-sm"><span className="font-medium">Given</span> {ac.given}</p>
              <p className="text-sm"><span className="font-medium">When</span> {ac.when}</p>
              <p className="text-sm"><span className="font-medium">Then</span> {ac.then}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Question Rounds Section (New Iterative Refinement) */}
      {questionRounds && questionRounds.length > 0 && (
        <Section
          title={`Clarification Questions (Round ${currentRound}/3)`}
          expanded={expandedSections.has('questions')}
          onToggle={() => toggleSection('questions')}
        >
          <div className="space-y-6">
            {questionRounds.map((round) => (
              <QuestionRoundPanel
                key={round.roundNumber}
                round={round}
                isActive={round.roundNumber === currentRound}
                onAnswer={(questionId, answer) => answerQuestionInRound(round.roundNumber, questionId, answer)}
                disabled={roundStatus !== 'answering' || round.roundNumber !== currentRound}
              />
            ))}
          </div>

          {/* Round Navigation */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSkipConfirm(true)}
              disabled={roundStatus !== 'idle'}
            >
              Skip to Finalize
            </Button>
            <Button
              type="button"
              onClick={async () => {
                const result = await submitRoundAnswers(currentRound);
                if (result === 'finalize') {
                  await finalizeSpec();
                }
              }}
              disabled={roundStatus === 'submitting' || !areCurrentRoundQuestionsAnswered()}
              className="flex-1"
            >
              {roundStatus === 'submitting' ? 'Submitting...' : (currentRound < 3 ? 'Submit & Continue' : 'Submit & Finalize')}
            </Button>
          </div>

          {/* Skip Confirmation Dialog */}
          {showSkipConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-sm mx-4 space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-50">Skip Remaining Rounds?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  The agent may generate better specs with more context. Are you sure?
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowSkipConfirm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      setShowSkipConfirm(false);
                      await skipToFinalize();
                      await finalizeSpec();
                    }}
                    className="flex-1"
                  >
                    Skip
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Original Clarification Questions Section (Backward Compatibility) */}
      {(!questionRounds || questionRounds.length === 0) && spec.clarificationQuestions.length > 0 && (
        <Section
          title={`Clarification Questions (${spec.clarificationQuestions.length})`}
          expanded={expandedSections.has('questions')}
          onToggle={() => toggleSection('questions')}
        >
          <div className="space-y-6">
            {spec.clarificationQuestions.map((question) => (
              <ClarificationQuestion
                key={question.id}
                question={question}
                value={answers[question.id]}
                onChange={(answer) => answerQuestion(question.id, answer)}
              />
            ))}
          </div>
        </Section>
      )}

      {/* File Changes Section */}
      {spec.fileChanges.length > 0 && (
        <Section
          title={`File Changes (${spec.fileChanges.length})`}
          expanded={expandedSections.has('files')}
          onToggle={() => toggleSection('files')}
        >
          <div className="space-y-3">
            {spec.fileChanges.map((file) => (
              <div key={file.path} className="text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className={
                    file.action === 'create'
                      ? 'text-green-600 dark:text-green-400'
                      : file.action === 'delete'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-blue-600 dark:text-blue-400'
                  }>
                    {file.action === 'create' ? '+ ' : file.action === 'delete' ? '− ' : '~ '}
                  </span>
                  <span className="font-mono text-gray-700 dark:text-gray-300">{file.path}</span>
                </div>
                {file.suggestedChanges && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 ml-6">
                    {file.suggestedChanges}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Navigation (Only show if no question rounds) */}
      {(!questionRounds || questionRounds.length === 0) && (
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={goBackToContext}
            disabled={loading}
            className="flex-1"
          >
            Back to Context
          </Button>
          <Button
            type="button"
            onClick={confirmSpecContinue}
            disabled={loading}
            className="flex-1"
          >
            Continue to Review
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Collapsible Section Component
 */
function Section({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between"
        aria-expanded={expanded}
      >
        <h3 className="font-medium text-gray-900 dark:text-gray-50">{title}</h3>
        <span className="text-2xl text-gray-600 dark:text-gray-400">
          {expanded ? '−' : '+'}
        </span>
      </button>
      {expanded && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Clarification Question Input Component
 */
function ClarificationQuestion({
  question,
  value,
  onChange,
}: {
  question: any;
  value: any;
  onChange: (value: string | string[]) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-gray-900 dark:text-gray-50">
          {question.question}
        </label>
        {question.context && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{question.context}</p>
        )}
      </div>

      {question.type === 'radio' && (
        <RadioGroup
          value={value || ''}
          onValueChange={onChange}
        >
          {question.options?.map((option: string) => (
            <div key={option} className="flex items-center gap-2">
              <RadioGroupItem value={option} id={`${question.id}-${option}`} />
              <label htmlFor={`${question.id}-${option}`} className="text-sm cursor-pointer">
                {option}
              </label>
            </div>
          ))}
        </RadioGroup>
      )}

      {question.type === 'checkbox' && (
        <div className="space-y-2">
          {question.options?.map((option: string) => (
            <div key={option} className="flex items-center gap-2">
              <Checkbox
                id={`${question.id}-${option}`}
                checked={(value as string[])?.includes(option) || false}
                onCheckedChange={(checked) => {
                  const current = (value as string[]) || [];
                  const updated = checked
                    ? [...current, option]
                    : current.filter((v) => v !== option);
                  onChange(updated);
                }}
              />
              <label htmlFor={`${question.id}-${option}`} className="text-sm cursor-pointer">
                {option}
              </label>
            </div>
          ))}
        </div>
      )}

      {question.type === 'text' && (
        <Input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Your answer..."
        />
      )}

      {question.type === 'multiline' && (
        <Textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Your answer..."
          rows={4}
        />
      )}

      {question.type === 'select' && (
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select an option..." />
          </SelectTrigger>
          <SelectContent>
            {question.options?.map((option: string) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
