'use client';

import { Cloud, GitBranch, Sparkles } from 'lucide-react';
import { StepIndicator } from '../molecules/StepIndicator';
import { useSessionStore } from '../../stores/session.store';

interface SessionProvisioningViewProps {
  onCancel: () => void;
}

const STEPS = [
  { key: 'sandbox', label: 'Creating sandbox', icon: Cloud },
  { key: 'clone', label: 'Cloning repository', icon: GitBranch },
  { key: 'agent', label: 'Starting AI agent', icon: Sparkles },
];

// Step thresholds in seconds — derived from the store's elapsedSeconds timer
const STEP_THRESHOLDS = [5, 12]; // sandbox ~5s, clone ~12s total

export function SessionProvisioningView({ onCancel }: SessionProvisioningViewProps) {
  const elapsedSeconds = useSessionStore((s) => s.elapsedSeconds);

  // Derive active step from elapsed time — no internal timers to get out of sync
  const activeStep = elapsedSeconds >= STEP_THRESHOLDS[1] ? 2
    : elapsedSeconds >= STEP_THRESHOLDS[0] ? 1
    : 0;

  return (
    <div className="flex flex-col items-center py-16">
      <div className="max-w-xs w-full space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-[14px] font-medium text-[var(--text-primary)]">Setting up environment</h3>
          <p className="text-[12px] text-[var(--text-tertiary)] mt-1">This usually takes a few seconds</p>
        </div>

        {STEPS.map((step, i) => (
          <StepIndicator
            key={step.key}
            icon={step.icon}
            label={step.label}
            status={i < activeStep ? 'completed' : i === activeStep ? 'active' : 'pending'}
          />
        ))}

        <div className="text-center pt-4">
          <button
            onClick={onCancel}
            className="text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] underline underline-offset-2 decoration-[var(--border-subtle)]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
