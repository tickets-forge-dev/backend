'use client';

import { useEffect, useState } from 'react';
import { Cloud, GitBranch, Sparkles } from 'lucide-react';
import { StepIndicator } from '../molecules/StepIndicator';

interface SessionProvisioningViewProps {
  onCancel: () => void;
}

const STEPS = [
  { key: 'sandbox', label: 'Creating sandbox', icon: Cloud },
  { key: 'clone', label: 'Cloning repository', icon: GitBranch },
  { key: 'agent', label: 'Starting AI agent', icon: Sparkles },
];

// Approximate timing for each step — sandbox ~5s, clone ~8s, agent ~3s
const STEP_DELAYS = [5000, 8000];

export function SessionProvisioningView({ onCancel }: SessionProvisioningViewProps) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let elapsed = 0;

    for (let i = 0; i < STEP_DELAYS.length; i++) {
      elapsed += STEP_DELAYS[i];
      timers.push(setTimeout(() => setActiveStep(i + 1), elapsed));
    }

    return () => timers.forEach(clearTimeout);
  }, []);

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
