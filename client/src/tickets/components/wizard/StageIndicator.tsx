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
  const stages = [
    { number: 1, label: 'Input', description: 'Enter title & repository' },
    { number: 2, label: 'Context', description: 'Review stack & patterns' },
    { number: 3, label: 'Draft', description: 'Review spec & questions' },
    { number: 4, label: 'Review', description: 'Final review & create' },
  ];

  return (
    <div className="space-y-4">
      {/* Progress Summary */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-50">
          Stage {currentStage} of 4
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {Math.round((currentStage / 4) * 100)}% complete
        </p>
      </div>

      {/* Visual Stage Indicator */}
      <div className="flex items-center gap-2">
        {stages.map((stage) => {
          const isCompleted = stage.number < currentStage;
          const isCurrent = stage.number === currentStage;

          return (
            <React.Fragment key={stage.number}>
              {/* Stage Circle */}
              <div
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full font-medium text-sm
                  transition-all duration-200
                  ${
                    isCurrent
                      ? 'bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900 ring-2 ring-gray-900 dark:ring-gray-50'
                      : isCompleted
                        ? 'bg-green-600 dark:bg-green-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }
                `}
              >
                {isCompleted ? (
                  <span className="text-lg">✓</span>
                ) : (
                  stage.number
                )}
              </div>

              {/* Connector Line */}
              {stage.number < 4 && (
                <div
                  className={`
                    flex-1 h-1 mx-1 rounded
                    ${
                      isCompleted
                        ? 'bg-green-600 dark:bg-green-500'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }
                  `}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Stage Labels */}
      <div className="hidden sm:flex gap-2 text-xs">
        {stages.map((stage) => (
          <div
            key={stage.number}
            className="flex-1 text-center"
          >
            <p className={
              stage.number === currentStage
                ? 'font-medium text-gray-900 dark:text-gray-50'
                : 'text-gray-600 dark:text-gray-400'
            }>
              {stage.label}
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
              {stage.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
