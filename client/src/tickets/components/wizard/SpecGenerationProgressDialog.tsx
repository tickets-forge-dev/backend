'use client';

import React, { useEffect, useState, useRef } from 'react';
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
 * Shows a checklist of generation phases driven by real backend job progress.
 * Falls back to simulated progress only during the brief initial submit
 * (before the background job is created and polling begins).
 */

interface SpecGenerationProgressDialogProps {
  isVisible: boolean;
  isSubmitting?: boolean; // true when finalizing spec
  isGenerating?: boolean; // true when generating questions
  onSendToBackground?: () => void;
  onCancel?: () => void;
  /** Real phase name from backend job polling */
  realPhase?: string | null;
  /** Real percent (0-100) from backend job polling */
  realPercent?: number;
}

interface PhaseConfig {
  key: string;
  label: string;
  icon: React.ComponentType<{ className: string }>;
}

// Spec generation phases — displayed as a checklist
const SPEC_GENERATION_PHASES: PhaseConfig[] = [
  { key: 'processing', label: 'Processing your answers', icon: Brain },
  { key: 'analyzing', label: 'Analyzing requirements', icon: Target },
  { key: 'problem', label: 'Generating problem statement', icon: FileText },
  { key: 'solution', label: 'Creating solution approach', icon: Zap },
  { key: 'criteria', label: 'Building acceptance criteria', icon: CheckSquare2 },
  { key: 'complete', label: 'Finalizing specification', icon: CheckCircle2 },
];

const QUESTION_GENERATION_PHASES: PhaseConfig[] = [
  { key: 'analyzing', label: 'Analyzing codebase', icon: Brain },
  { key: 'context', label: 'Understanding context', icon: Target },
  { key: 'generating', label: 'Generating questions', icon: Zap },
  { key: 'refining', label: 'Refining questions', icon: CheckSquare2 },
  { key: 'complete', label: 'Ready to proceed', icon: CheckCircle2 },
];

/**
 * Map real backend percent to a display phase index (0-5).
 * Backend progress ranges from the BackgroundFinalizationService (0-40%)
 * and TechSpecGeneratorImpl (40-90%, mapped via wrapper callback).
 */
function phaseIndexFromPercent(percent: number): number {
  if (percent < 15) return 0;  // Processing / loading / preparing
  if (percent < 30) return 1;  // Analyzing codebase context
  if (percent < 50) return 2;  // Generating problem statement
  if (percent < 60) return 3;  // Creating solution approach
  if (percent < 80) return 4;  // Acceptance criteria + file changes + deps
  return 5;                     // Test plan + visual expectations + saving
}

export function SpecGenerationProgressDialog({
  isVisible,
  isSubmitting = false,
  isGenerating = false,
  onSendToBackground,
  onCancel,
  realPhase,
  realPercent,
}: SpecGenerationProgressDialogProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [simPercent, setSimPercent] = useState(0);
  // Track the highest real percent seen to prevent backwards jumps
  const highWaterRef = useRef(0);

  const phases = isSubmitting ? SPEC_GENERATION_PHASES : QUESTION_GENERATION_PHASES;
  const phaseCount = phases.length;

  const hasRealProgress = realPercent !== undefined && realPercent > 0;

  // Track high-water mark for real percent
  useEffect(() => {
    if (realPercent !== undefined && realPercent > highWaterRef.current) {
      highWaterRef.current = realPercent;
    }
  }, [realPercent]);

  // Elapsed time counter + simulated progress (fallback only)
  useEffect(() => {
    if (!isVisible) {
      setElapsedSeconds(0);
      setSimPercent(0);
      highWaterRef.current = 0;
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 0.5);
      // Only advance simulated progress if we don't have real data yet
      if (!hasRealProgress) {
        setSimPercent((prev) => {
          if (prev >= 8) return prev; // Cap simulated at 8% — real data takes over quickly
          return Math.min(prev + Math.random() * 1.5 + 0.3, 8);
        });
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible, hasRealProgress]);

  if (!isVisible) return null;

  // Once real progress arrives, use it exclusively (high-water mark prevents backwards jumps)
  const displayPercent = hasRealProgress
    ? highWaterRef.current
    : simPercent;

  // Determine current phase index from real data or time-based fallback
  let currentPhaseIndex: number;
  if (hasRealProgress) {
    currentPhaseIndex = phaseIndexFromPercent(highWaterRef.current);
  } else {
    // Brief fallback: distribute over 8 seconds for question gen, 15s for spec
    const estimatedTotalTime = isSubmitting ? 15 : 8;
    const timePerPhase = estimatedTotalTime / phaseCount;
    currentPhaseIndex = Math.min(
      Math.floor(elapsedSeconds / timePerPhase),
      // Cap at phase 1 when simulating — don't fake further without real data
      hasRealProgress ? phaseCount - 1 : 1,
    );
  }

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
              style={{ width: `${Math.min(displayPercent, 100)}%` }}
            />
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--text-secondary)] font-medium tabular-nums">
              {Math.min(Math.floor(displayPercent), 99)}%
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
