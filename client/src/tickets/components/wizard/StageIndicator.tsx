'use client';

import React from 'react';
import { type WizardStage, getStageOrder } from '@/tickets/stores/generation-wizard.store';

const STAGE_LABELS: Record<WizardStage, string> = {
  details: 'Details',
  reproduce: 'Reproduce',
  codebase: 'Codebase',
  references: 'Attachments',
  options: 'Options',
  generate: 'Generate',
};

/**
 * Stage Indicator Component — responsive single-row layout
 *
 * Desktop: circles + labels + connector lines
 * Mobile: circles only + current step label below (5-6 steps need compact layout)
 *
 * Non-bug: Details → Codebase → References → Options → Generate (5)
 * Bug:     Details → Reproduce → Codebase → References → Options → Generate (6)
 */
interface StageIndicatorProps {
  currentStage: WizardStage;
  nextButton?: React.ReactNode;
  ticketType?: string;
}

export function StageIndicator({ currentStage, nextButton, ticketType }: StageIndicatorProps) {
  const stages = getStageOrder(ticketType ?? 'feature');
  const currentIdx = stages.indexOf(currentStage);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        {/* Steps */}
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
          {stages.map((stage, i) => {
            const isCompleted = i < currentIdx;
            const isCurrent = i === currentIdx;

            return (
              <React.Fragment key={stage}>
                {/* Connector line */}
                {i > 0 && (
                  <div
                    className={`w-3 sm:w-6 h-px flex-shrink-0 ${
                      i <= currentIdx
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
                    {isCompleted ? '\u2713' : i + 1}
                  </div>
                  {/* Labels hidden on mobile, visible on sm+ */}
                  <span
                    className={`text-xs whitespace-nowrap hidden sm:inline ${
                      isCurrent
                        ? 'font-medium text-[var(--text)]'
                        : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {STAGE_LABELS[stage]}
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
      <p className="text-xs font-medium text-[var(--text)] sm:hidden">
        Step {currentIdx + 1}: {STAGE_LABELS[currentStage]}
      </p>
    </div>
  );
}
