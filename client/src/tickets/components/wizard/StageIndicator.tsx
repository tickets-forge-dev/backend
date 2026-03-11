'use client';

import React from 'react';

/**
 * Stage Indicator Component — responsive single-row layout
 *
 * Desktop: circles + labels + connector lines
 * Mobile: circles only + current step label below (saves horizontal space for 5-6 steps)
 */
interface StageIndicatorProps {
  currentStage: number;
  nextButton?: React.ReactNode;
  ticketType?: string;
}

export function StageIndicator({ currentStage, nextButton, ticketType }: StageIndicatorProps) {
  const isBug = ticketType === 'bug';

  // Bug: 1=Input, 2=Repro, 3=Options, 4=Generate
  // Non-bug: 1=Input, 2=Options, 3=Generate
  const stageMap: Record<number, number> = isBug
    ? { 1: 1, 2: 2, 3: 3, 4: 4 }
    : { 1: 1, 2: 2, 3: 3 };
  const displayStage = stageMap[currentStage] || 1;

  const stages = isBug
    ? [
        { number: 1, label: 'Input' },
        { number: 2, label: 'Repro Steps' },
        { number: 3, label: 'Options' },
        { number: 4, label: 'Generate' },
      ]
    : [
        { number: 1, label: 'Input' },
        { number: 2, label: 'Options' },
        { number: 3, label: 'Generate' },
      ];

  const currentLabel = stages.find((s) => s.number === displayStage)?.label;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        {/* Steps */}
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
          {stages.map((stage, i) => {
            const isCompleted = stage.number < displayStage;
            const isCurrent = stage.number === displayStage;

            return (
              <React.Fragment key={stage.number}>
                {/* Connector line */}
                {i > 0 && (
                  <div
                    className={`w-3 sm:w-6 h-px flex-shrink-0 ${
                      stage.number <= displayStage
                        ? 'bg-green-600 dark:bg-green-500'
                        : 'bg-[var(--border)]'
                    }`}
                  />
                )}

                {/* Circle + label */}
                <div className="flex items-center gap-1 sm:gap-1.5">
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
                  {/* Labels hidden on mobile, visible on sm+ */}
                  <span
                    className={`text-xs whitespace-nowrap hidden sm:inline ${
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

      {/* Mobile: show current step label below the circles */}
      {currentLabel && (
        <p className="text-xs font-medium text-[var(--text)] sm:hidden">
          Step {displayStage}: {currentLabel}
        </p>
      )}
    </div>
  );
}
