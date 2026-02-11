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
      setElapsedSeconds((prev) => prev + 1);
      // Gradually increase progress (faster at start, slower near end)
      setProgressPercent((prev) => {
        if (prev >= 90) return prev;
        const increment = Math.random() * 10 + 2;
        return Math.min(prev + increment, 90);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  // Set to complete when done
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
    <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-950 rounded-lg max-w-lg w-full mx-4 shadow-lg">
        {/* Header */}
        <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            {isSubmitting ? 'Generating Your Specification' : 'Generating Clarification Questions'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isSubmitting
              ? 'Processing your answers and building the final spec...'
              : 'Analyzing your codebase and preparing clarifying questions...'}
          </p>
        </div>

        {/* Phase Checklist */}
        <div className="px-6 py-6 space-y-3 max-h-96 overflow-y-auto">
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
          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>

          {/* Percent and elapsed time */}
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
