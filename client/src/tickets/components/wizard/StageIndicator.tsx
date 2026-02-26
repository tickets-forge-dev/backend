'use client';

import React from 'react';

/**
 * Stage Indicator Component
 *
 * Displays:
 * - Current stage progress (1/N, 2/N, etc.)
 * - Visual indicators (circles)
 * - Current stage highlighted/filled
 * - Optional Next button inline with progress
 *
 * Bug tickets show 3 stages (Input → Repro Steps → Generate).
 * Non-bug tickets show 2 stages (Input → Generate).
 */
interface StageIndicatorProps {
  currentStage: number;
  nextButton?: React.ReactNode;
  ticketType?: string;
}

export function StageIndicator({ currentStage, nextButton, ticketType }: StageIndicatorProps) {
  const isBug = ticketType === 'bug';

  // Map internal stage numbers to display numbers
  // Bug: 1→1, 2→2, 3→3 (3 stages)
  // Non-bug: 1→1, 3→2 (2 stages, stage 2 skipped)
  const stageMap: Record<number, number> = isBug
    ? { 1: 1, 2: 2, 3: 3 }
    : { 1: 1, 3: 2 };
  const displayStage = stageMap[currentStage] || 1;

  const stages = isBug
    ? [
        { number: 1, label: 'Input', description: 'Enter title & repository' },
        { number: 2, label: 'Repro Steps', description: 'Describe how to reproduce' },
        { number: 3, label: 'Generate', description: 'Questions & spec' },
      ]
    : [
        { number: 1, label: 'Input', description: 'Enter title & repository' },
        { number: 2, label: 'Generate', description: 'Questions & spec' },
      ];

  const totalStages = stages.length;
  const widthClass = totalStages === 3 ? 'w-1/3' : 'w-1/2';

  // Connector positioning: spans between first and last circle centers
  const connectorLeft = totalStages === 3
    ? 'left-[calc(16.67%+16px)]'
    : 'left-[calc(25%+16px)]';
  const connectorRight = totalStages === 3
    ? 'right-[calc(16.67%+16px)]'
    : 'right-[calc(25%+16px)]';

  // Completed connector width based on progress
  const completedSegments = displayStage - 1;
  const totalSegments = totalStages - 1;
  const completedPercent = totalSegments > 0 ? (completedSegments / totalSegments) * 100 : 0;

  return (
    <div className="space-y-3">
      {/* Progress Summary */}
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-medium text-[var(--text)]">
          Stage {displayStage} of {totalStages}
        </h3>
        <div className="flex items-center gap-3">
          {nextButton}
        </div>
      </div>

      {/* Steps with aligned labels */}
      <div className="relative">
        {/* Connector line behind circles */}
        <div className={`absolute top-4 ${connectorLeft} ${connectorRight} h-0.5 bg-[var(--border)]`} />
        {/* Completed portion of connector */}
        {completedPercent > 0 && (
          <div
            className={`absolute top-4 ${connectorLeft} h-0.5 bg-green-600 dark:bg-green-500`}
            style={{ width: `${completedPercent}%`, maxWidth: `calc(100% - ${totalStages === 3 ? '33.34%' : '50%'} - 32px)` }}
          />
        )}

        {/* Step columns */}
        <div className="relative flex justify-between">
          {stages.map((stage) => {
            const isCompleted = stage.number < displayStage;
            const isCurrent = stage.number === displayStage;

            return (
              <div key={stage.number} className={`flex flex-col items-center ${widthClass}`}>
                {/* Circle */}
                <div
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium
                    transition-all duration-200 z-10
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

                {/* Label + description */}
                <p className={`mt-2 text-xs text-center ${
                  isCurrent
                    ? 'font-medium text-[var(--text)]'
                    : 'text-[var(--text-secondary)]'
                }`}>
                  {stage.label}
                </p>
                <p className="hidden sm:block text-[10px] text-center text-[var(--text-tertiary)] mt-0.5">
                  {stage.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
