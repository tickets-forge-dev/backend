'use client';

import React, { useEffect, useState } from 'react';
import {
  Brain,
  CheckCircle2,
  Loader2,
  Check,
  FileText,
  MessageSquare,
  Sparkles,
  Zap,
} from 'lucide-react';

interface ReEnrichProgressDialogProps {
  isVisible: boolean;
}

interface PhaseConfig {
  key: string;
  label: string;
  icon: React.ComponentType<{ className: string }>;
  order: number;
}

const RE_ENRICH_PHASES: PhaseConfig[] = [
  { key: 'reading', label: 'Reading developer Q&A answers', icon: MessageSquare, order: 1 },
  { key: 'analyzing', label: 'Analyzing new context', icon: Brain, order: 2 },
  { key: 'rewriting', label: 'Rewriting problem statement', icon: FileText, order: 3 },
  { key: 'solution', label: 'Updating solution approach', icon: Zap, order: 4 },
  { key: 'criteria', label: 'Refining acceptance criteria', icon: Sparkles, order: 5 },
  { key: 'complete', label: 'Finalizing re-baked spec', icon: CheckCircle2, order: 6 },
];

export function ReEnrichProgressDialog({ isVisible }: ReEnrichProgressDialogProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  const phases = RE_ENRICH_PHASES;
  const phaseCount = phases.length;

  useEffect(() => {
    if (!isVisible) {
      setElapsedSeconds(0);
      setProgressPercent(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
      setProgressPercent((prev) => {
        if (prev >= 90) return prev;
        const increment = Math.random() * 10 + 2;
        return Math.min(prev + increment, 90);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const estimatedTotalTime = 12;
  const timePerPhase = estimatedTotalTime / phaseCount;
  const currentPhaseIndex = Math.min(
    Math.floor(elapsedSeconds / timePerPhase),
    phaseCount - 1
  );

  const getPhaseStatus = (index: number): 'pending' | 'in_progress' | 'complete' => {
    if (index < currentPhaseIndex) return 'complete';
    if (index === currentPhaseIndex) return 'in_progress';
    return 'pending';
  };

  return (
    <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-[1100] flex items-center justify-center backdrop-blur-md">
      <div className="bg-[var(--bg-subtle)] rounded-lg max-w-lg w-full mx-4 shadow-xl border border-[var(--border-subtle)]">
        {/* Header */}
        <div className="px-6 py-6 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text)]">
            Regenerating Specification
          </h2>
          <p className="text-[13px] text-[var(--text-tertiary)] mt-1">
            Incorporating developer feedback into an improved spec. This may take a minute or two.
          </p>
        </div>

        {/* Phase Checklist */}
        <div className="px-6 py-6 space-y-2">
          {phases.map((phase, index) => {
            const status = getPhaseStatus(index);
            const Icon = phase.icon;
            const isActive = status === 'in_progress';
            const isComplete = status === 'complete';

            return (
              <div
                key={phase.key}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors duration-300 ${
                  isActive
                    ? 'bg-blue-400/8 border border-blue-400/10'
                    : isComplete
                      ? 'bg-emerald-500/10'
                      : 'bg-[var(--bg-hover)]/50'
                }`}
              >
                {/* Icon/Status */}
                <div className="flex-shrink-0 w-4.5 h-4.5 flex items-center justify-center">
                  {isComplete ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : isActive ? (
                    <Loader2 className="w-4 h-4 text-blue-300/70 animate-spin" />
                  ) : (
                    <Icon className={`w-4 h-4 text-[var(--text-tertiary)]/40`} />
                  )}
                </div>

                {/* Phase info */}
                <p
                  className={`text-[13px] font-medium ${
                    isActive
                      ? 'text-[var(--text)]'
                      : isComplete
                        ? 'text-emerald-400'
                        : 'text-[var(--text-tertiary)]'
                  }`}
                >
                  {phase.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Progress Bar & Stats */}
        <div className="px-6 py-5 border-t border-[var(--border-subtle)] space-y-3">
          <div className="w-full bg-[var(--bg-hover)] rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400/50 to-blue-300/60 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--text-secondary)] font-medium tabular-nums">
              {Math.min(Math.floor(progressPercent), 99)}%
            </span>
            <span className="text-[var(--text-tertiary)] tabular-nums">{elapsedSeconds}s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
