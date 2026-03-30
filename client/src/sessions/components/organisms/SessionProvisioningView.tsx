'use client';

import { Cloud, GitBranch, Sparkles } from 'lucide-react';
import { StepIndicator } from '../molecules/StepIndicator';

interface SessionProvisioningViewProps {
  onCancel: () => void;
}

const STEPS = [
  { key: 'sandbox', label: 'Creating sandbox', icon: Cloud, status: 'active' as const },
  { key: 'clone', label: 'Cloning repository', icon: GitBranch, status: 'pending' as const },
  { key: 'claude', label: 'Starting Claude Code', icon: Sparkles, status: 'pending' as const },
];

export function SessionProvisioningView({ onCancel }: SessionProvisioningViewProps) {
  return (
    <div className="flex flex-col items-center py-16">
      <div className="max-w-xs w-full space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-[14px] font-medium text-[var(--text-primary)]">Setting up environment</h3>
          <p className="text-[12px] text-[var(--text-tertiary)] mt-1">This usually takes a few seconds</p>
        </div>

        {STEPS.map((step) => (
          <StepIndicator
            key={step.key}
            icon={step.icon}
            label={step.label}
            status={step.status}
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
