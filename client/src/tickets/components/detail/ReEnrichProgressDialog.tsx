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
    <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-950 rounded-lg max-w-lg w-full mx-4 shadow-lg">
        {/* Header */}
        <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            Regenerating Specification
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Incorporating developer Q&A insights into an improved spec...
          </p>
        </div>

        {/* Phase Checklist */}
        <div className="px-6 py-6 space-y-3">
          {phases.map((phase, index) => {
            const status = getPhaseStatus(index);
            const Icon = phase.icon;
            const isActive = status === 'in_progress';
            const isComplete = status === 'complete';

            return (
              <div
                key={phase.key}
                className={`flex items-start gap-3 p-3 rounded-md transition-colors duration-150 ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/30'
                    : isComplete
                      ? 'bg-green-50 dark:bg-green-950/20'
                      : 'bg-gray-50 dark:bg-gray-800/40'
                }`}
              >
                {/* Icon/Status */}
                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center mt-0.5">
                  {isComplete ? (
                    <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : isActive ? (
                    <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
                  ) : (
                    <Icon
                      className={`w-5 h-5 ${
                        isActive
                          ? 'text-blue-600 dark:text-blue-400'
                          : isComplete
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-gray-400 dark:text-gray-600'
                      }`}
                    />
                  )}
                </div>

                {/* Phase info */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      isActive
                        ? 'text-blue-900 dark:text-blue-100'
                        : isComplete
                          ? 'text-green-900 dark:text-green-100'
                          : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {phase.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Bar & Stats */}
        <div className="px-6 py-6 border-t border-gray-200 dark:border-gray-800 space-y-3">
          <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400 font-medium">
              {Math.min(Math.floor(progressPercent), 99)}%
            </span>
            <span className="text-gray-500 dark:text-gray-500">{elapsedSeconds}s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
