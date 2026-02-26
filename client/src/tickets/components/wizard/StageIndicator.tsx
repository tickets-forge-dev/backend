'use client';

import React from 'react';

/**
 * Stage Indicator Component — compact single-row layout
 *
 * Shows: "Stage X of N" + inline step circles with labels + Next button
 * Bug tickets: 3 stages. Non-bug: 2 stages.
 */
interface StageIndicatorProps {
  currentStage: number;
  nextButton?: React.ReactNode;
  ticketType?: string;
}

export function StageIndicator({ currentStage, nextButton, ticketType }: StageIndicatorProps) {
  const isBug = ticketType === 'bug';

  const stageMap: Record<number, number> = isBug
    ? { 1: 1, 2: 2, 3: 3 }
    : { 1: 1, 3: 2 };
  const displayStage = stageMap[currentStage] || 1;

  const stages = isBug
    ? [
        { number: 1, label: 'Input' },
        { number: 2, label: 'Repro Steps' },
        { number: 3, label: 'Generate' },
      ]
    : [
        { number: 1, label: 'Input' },
        { number: 2, label: 'Generate' },
      ];

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Steps */}
      <div className="flex items-center gap-1.5">
        {stages.map((stage, i) => {
          const isCompleted = stage.number < displayStage;
          const isCurrent = stage.number === displayStage;

          return (
            <React.Fragment key={stage.number}>
              {/* Connector line */}
              {i > 0 && (
                <div
                  className={`w-6 h-px ${
                    stage.number <= displayStage
                      ? 'bg-green-600 dark:bg-green-500'
                      : 'bg-[var(--border)]'
                  }`}
                />
              )}

              {/* Circle + label */}
              <div className="flex items-center gap-1.5">
                <div
                  className={`
                    flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-medium flex-shrink-0
                    ${
                      isCurrent
                        ? 'bg-[var(--blue)] text-white ring-2 ring-[var(--blue)]/30'
                        : isCompleted
                          ? 'bg-green-600 dark:bg-green-500 text-white'
                          : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border)]'
                    }
                  `}
                >
                  {isCompleted ? '\u2713' : stage.number}
                </div>
                <span
                  className={`text-xs whitespace-nowrap ${
                    isCurrent
                      ? 'font-medium text-[var(--text)]'
                      : 'text-[var(--text-secondary)]'
                  }`}
                >
                  {stage.label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Next button */}
      {nextButton && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {nextButton}
        </div>
      )}
    </div>
  );
}
