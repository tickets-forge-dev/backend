'use client';

import { useState } from 'react';
import { LIFECYCLE_STEPS, TICKET_STATUS_CONFIG } from '../../config/ticketStatusConfig';

interface TicketLifecycleBarProps {
  currentStatus: string;
}

export function TicketLifecycleBar({ currentStatus }: TicketLifecycleBarProps) {
  const currentIdx = LIFECYCLE_STEPS.findIndex(s => s.key === currentStatus);
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-1.5 w-full relative">
      {LIFECYCLE_STEPS.map((step, i) => {
        const isPast = currentIdx >= 0 && i < currentIdx;
        const isCurrent = step.key === currentStatus;
        const statusCfg = TICKET_STATUS_CONFIG[step.key];

        return (
          <div key={step.key} className="flex items-center gap-1.5 flex-1 min-w-0">
            {/* Step */}
            <div
              className="relative flex items-center gap-1.5 min-w-0 cursor-default"
              onMouseEnter={() => setHoveredStep(step.key)}
              onMouseLeave={() => setHoveredStep(null)}
            >
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isCurrent ? statusCfg?.dotClass ?? 'bg-[var(--text-secondary)]'
                  : isPast ? 'bg-emerald-500'
                  : 'bg-[var(--text-tertiary)]/30'
                }`}
              />
              <span
                className={`text-[11px] whitespace-nowrap ${
                  isCurrent ? 'text-[var(--text)] font-medium'
                  : isPast ? 'text-[var(--text-secondary)]'
                  : 'text-[var(--text-tertiary)]/60'
                }`}
              >
                {step.label}
              </span>

              {/* Tooltip */}
              {hoveredStep === step.key && (
                <div className="absolute left-0 top-full mt-2 z-50 px-2.5 py-1.5 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-subtle)] shadow-md whitespace-nowrap animate-fade-in">
                  <p className="text-[11px] font-medium text-[var(--text)]">{step.label}</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{step.description}</p>
                  {step.note && (
                    <p className="text-[9px] text-[var(--text-tertiary)]/60 mt-0.5 italic">{step.note}</p>
                  )}
                </div>
              )}
            </div>

            {/* Connector line */}
            {i < LIFECYCLE_STEPS.length - 1 && (
              <div
                className={`flex-1 h-[1.5px] min-w-[12px] rounded-full ${
                  isPast ? 'bg-emerald-500/40' : 'bg-[var(--text-tertiary)]/15'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
