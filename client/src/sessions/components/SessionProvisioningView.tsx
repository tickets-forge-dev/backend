'use client';

import { Check, Loader2, Cloud, GitBranch, Sparkles } from 'lucide-react';

interface SessionProvisioningViewProps {
  onCancel: () => void;
}

const STEPS = [
  { key: 'sandbox', label: 'Creating sandbox', icon: Cloud },
  { key: 'clone', label: 'Cloning repository', icon: GitBranch },
  { key: 'claude', label: 'Starting Claude Code', icon: Sparkles },
];

export function SessionProvisioningView({ onCancel }: SessionProvisioningViewProps) {
  return (
    <div className="flex flex-col items-center py-16">
      <div className="max-w-xs w-full space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-[14px] font-medium text-[var(--text-primary)]">Setting up environment</h3>
          <p className="text-[12px] text-[var(--text-tertiary)] mt-1">This usually takes a few seconds</p>
        </div>

        {STEPS.map((step, i) => {
          const isActive = i === 0;
          const isComplete = false;
          const Icon = step.icon;

          return (
            <div
              key={step.key}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-md ${
                isActive
                  ? 'bg-violet-500/5 border border-violet-500/10'
                  : isComplete
                    ? 'bg-emerald-500/5'
                    : ''
              }`}
            >
              {isComplete ? (
                <Check className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : isActive ? (
                <Loader2 className="w-5 h-5 text-violet-500 animate-spin shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-[var(--bg-hover)] shrink-0" />
              )}
              <span className={`text-[13px] ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
                {step.label}
              </span>
            </div>
          );
        })}

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
