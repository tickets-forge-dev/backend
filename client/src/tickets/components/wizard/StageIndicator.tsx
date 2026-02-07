'use client';

import React from 'react';

/**
 * Stage Indicator Component
 *
 * Displays:
 * - Current stage progress (1/4, 2/4, etc.)
 * - Visual indicators (4 circles/boxes)
 * - Current stage highlighted/filled
 */
export function StageIndicator({ currentStage }: { currentStage: number }) {
  // Map internal stage numbers (1, 3, 4) to display numbers (1, 2, 3) - Stage 2 (context) is skipped
  const stageMap: Record<number, number> = { 1: 1, 3: 2, 4: 3 };
  const displayStage = stageMap[currentStage] || 1;

  const stages = [
    { number: 1, label: 'Input', description: 'Enter title & repository' },
    { number: 2, label: 'Draft', description: 'Review spec & questions' },
    { number: 3, label: 'Review', description: 'Final review & create' },
  ];

  return (
    <div className="space-y-3">
      {/* Progress Summary */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[var(--text)]">
          Stage {displayStage} of 3
        </h3>
        <p className="text-sm text-[var(--text-secondary)]">
          {Math.round((displayStage / 3) * 100)}% complete
        </p>
      </div>

      {/* Steps with aligned labels */}
      <div className="relative">
        {/* Connector line behind circles */}
        <div className="absolute top-4 left-[calc(16.67%+16px)] right-[calc(16.67%+16px)] h-0.5 bg-[var(--border)]" />
        {/* Completed portion of connector */}
        {displayStage > 1 && (
          <div
            className="absolute top-4 left-[calc(16.67%+16px)] h-0.5 bg-green-600 dark:bg-green-500"
            style={{ width: `${((Math.min(displayStage, 3) - 1) / 2) * (100 - 33.34)}%` }}
          />
        )}

        {/* Step columns */}
        <div className="relative flex justify-between">
          {stages.map((stage) => {
            const isCompleted = stage.number < displayStage;
            const isCurrent = stage.number === displayStage;

            return (
              <div key={stage.number} className="flex flex-col items-center w-1/3">
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
                  {isCompleted ? '✓' : stage.number}
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
