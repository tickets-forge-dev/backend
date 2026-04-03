'use client';

import React, { useEffect, useState } from 'react';
import {
  Brain,
  CheckCircle2,
  Loader2,
  Check,
  FileText,
  CheckSquare2,
  Zap,
  Target,
} from 'lucide-react';

/**
 * SpecGenerationProgressDialog - Real-time spec generation progress
 *
 * Shows an engaging checklist of 6 spec generation phases as they complete.
 * Each phase displays:
 * - Icon (brain, file, checkmark, etc.)
 * - Phase name (e.g., "Processing answers")
 * - Status (pending, in-progress, complete)
 * - Overall progress bar with percentage
 * - Elapsed time counter
 */

interface SpecGenerationProgressDialogProps {
  isVisible: boolean;
  isSubmitting?: boolean; // true when finalizing spec
  isGenerating?: boolean; // true when generating questions
  onSendToBackground?: () => void;
  onCancel?: () => void;
}

interface PhaseConfig {
  key: string;
  label: string;
  icon: React.ComponentType<{ className: string }>;
  order: number;
}

// Phase configurations in order
const SPEC_GENERATION_PHASES: PhaseConfig[] = [
  { key: 'processing', label: 'Processing your answers', icon: Brain, order: 1 },
  { key: 'analyzing', label: 'Analyzing requirements', icon: Target, order: 2 },
  { key: 'problem', label: 'Generating problem statement', icon: FileText, order: 3 },
  { key: 'solution', label: 'Creating solution approach', icon: Zap, order: 4 },
  { key: 'criteria', label: 'Building acceptance criteria', icon: CheckSquare2, order: 5 },
  { key: 'complete', label: 'Finalizing specification', icon: CheckCircle2, order: 6 },
];

const QUESTION_GENERATION_PHASES: PhaseConfig[] = [
  { key: 'analyzing', label: 'Analyzing codebase', icon: Brain, order: 1 },
  { key: 'context', label: 'Understanding context', icon: Target, order: 2 },
  { key: 'generating', label: 'Generating questions', icon: Zap, order: 3 },
  { key: 'refining', label: 'Refining questions', icon: CheckSquare2, order: 4 },
  { key: 'complete', label: 'Ready to proceed', icon: CheckCircle2, order: 5 },
];

export function SpecGenerationProgressDialog({
  isVisible,
  isSubmitting = false,
  isGenerating = false,
  onSendToBackground,
  onCancel,
}: SpecGenerationProgressDialogProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  const phases = isSubmitting ? SPEC_GENERATION_PHASES : QUESTION_GENERATION_PHASES;
  const phaseCount = phases.length;

  // Elapsed time counter
  useEffect(() => {
    if (!isVisible) {
      setElapsedSeconds(0);
      setProgressPercent(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 0.5);
      // Gradually increase progress (faster at start, slower near end)
      setProgressPercent((prev) => {
        if (prev >= 90) return prev;
        const increment = (Math.random() * 5 + 1);
        return Math.min(prev + increment, 90);
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible]);

  // Reset when hidden
  useEffect(() => {
    if (!isVisible) {
      setProgressPercent(0);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  // Estimate current phase based on elapsed time and phase count
  // Distribute phases evenly over estimated total time
  const estimatedTotalTime = isSubmitting ? 15 : 8; // seconds
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
    <div className="fixed inset-0 bg-black/30 dark:bg-black/50 z-[1100] flex items-center justify-center backdrop-blur-md" style={{ pointerEvents: 'auto' }}>
      <div className="bg-[var(--bg-subtle)] rounded-lg max-w-lg w-full mx-4 shadow-xl border border-[var(--border-subtle)]">
        {/* Header */}
        <div className="px-6 py-6 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text)]">
            {isSubmitting ? 'Generating Your Specification' : 'Generating Clarification Questions'}
          </h2>
          <p className="text-[13px] text-[var(--text-tertiary)] mt-1">
            {isSubmitting
              ? 'Processing your answers and building the final spec. This may take a minute or two.'
              : 'Analyzing your codebase and preparing clarifying questions. This may take a minute or two.'}
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
          {/* Progress bar */}
          <div className="w-full bg-[var(--bg-hover)] rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400/50 to-blue-300/60 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--text-secondary)] font-medium tabular-nums">
              {Math.min(Math.floor(progressPercent), 99)}%
            </span>
            <span className="text-[var(--text-tertiary)] tabular-nums">
              {Math.floor(elapsedSeconds)}s
            </span>
          </div>

          {/* Background / Cancel actions */}
          {(onSendToBackground || onCancel) && (
            <div className="flex items-center justify-end gap-2 pt-1">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="px-3 py-1.5 text-[11px] font-medium rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  Cancel
                </button>
              )}
              {onSendToBackground && (
                <button
                  onClick={onSendToBackground}
                  className="px-3 py-1.5 text-[11px] font-medium rounded-md bg-blue-400/10 text-blue-300/80 border border-blue-400/15 hover:bg-blue-400/20 transition-colors"
                >
                  Send to Background
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
