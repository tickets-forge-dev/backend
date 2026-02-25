'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Cloud,
  FolderTree,
  FileCode,
  Layers,
  FileSearch,
  FileText,
  Brain,
  CheckCircle2,
  Loader2,
  Check,
} from 'lucide-react';
import { AnalysisLoaderMessages } from '../AnalysisLoaderMessages';

/**
 * AnalysisProgressDialog - Real-time analysis progress visualization
 *
 * Shows an engaging checklist of 8 analysis phases as they complete.
 * Each phase displays:
 * - Icon (cloud, folder, file, etc.)
 * - Phase name (e.g., "Connecting to GitHub")
 * - Status (pending, in-progress, complete)
 * - Sub-message for current phase
 * - Overall progress bar with percentage
 * - Elapsed time counter
 */

interface AnalysisProgressDialogProps {
  currentPhase: string | null;
  message: string | null;
  percent: number;
  hasRepository?: boolean; // Whether repository is being analyzed
}

interface PhaseConfig {
  key: string;
  label: string;
  icon: React.ComponentType<{ className: string }>;
  order: number;
}

// Phase configurations for repository analysis
const REPO_PHASES: PhaseConfig[] = [
  { key: 'connecting', label: 'Connecting to GitHub', icon: Cloud, order: 1 },
  { key: 'fetching_tree', label: 'Fetching repository structure', icon: FolderTree, order: 2 },
  { key: 'reading_configs', label: 'Reading configuration files', icon: FileCode, order: 3 },
  { key: 'fingerprinting', label: 'Detecting tech stack', icon: Layers, order: 4 },
  { key: 'selecting_files', label: 'Selecting relevant files', icon: FileSearch, order: 5 },
  { key: 'reading_files', label: 'Reading source files', icon: FileText, order: 6 },
  { key: 'analyzing', label: 'Analyzing patterns and architecture', icon: Brain, order: 7 },
  { key: 'complete', label: 'Analysis complete', icon: CheckCircle2, order: 8 },
];

// Phase configurations for non-repository tickets
const NO_REPO_PHASES: PhaseConfig[] = [
  { key: 'preparing', label: 'Preparing ticket', icon: FileText, order: 1 },
  { key: 'analyzing', label: 'Analyzing requirements', icon: Brain, order: 2 },
  { key: 'organizing', label: 'Organizing information', icon: Layers, order: 3 },
  { key: 'complete', label: 'Setup complete', icon: CheckCircle2, order: 4 },
];

// Map backend phase names to our phase keys
function normalizePhase(backendPhase: string | null, hasRepository: boolean): string | null {
  if (!backendPhase) return null;

  // For repository analysis, use exact backend phases
  if (hasRepository) {
    const repoPhaseMap: Record<string, string> = {
      'connecting': 'connecting',
      'fetching_tree': 'fetching_tree',
      'reading_configs': 'reading_configs',
      'fingerprinting': 'fingerprinting',
      'selecting_files': 'selecting_files',
      'reading_files': 'reading_files',
      'analyzing': 'analyzing',
      'complete': 'complete',
    };
    return repoPhaseMap[backendPhase] || null;
  }

  // For non-repository tickets, map backend 'complete' to our phases
  if (backendPhase === 'complete') return 'complete';
  // Default to 'preparing' for non-repo case
  return 'preparing';
}

export function AnalysisProgressDialog({
  currentPhase,
  message,
  percent,
  hasRepository = true, // Default to true for backward compatibility
}: AnalysisProgressDialogProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const PHASES = hasRepository ? REPO_PHASES : NO_REPO_PHASES;
  const normalizedPhase = normalizePhase(currentPhase, hasRepository);
  const activePhaseRef = useRef<HTMLDivElement>(null);

  // Elapsed time counter
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to keep active phase visible
  useEffect(() => {
    if (activePhaseRef.current) {
      activePhaseRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [normalizedPhase]);

  // Determine which phases are complete, in-progress, and pending
  const getPhaseStatus = (phaseKey: string): 'pending' | 'in_progress' | 'complete' => {
    if (phaseKey === normalizedPhase) return 'in_progress';

    const currentPhaseOrder = PHASES.find((p) => p.key === normalizedPhase)?.order ?? 0;
    const phaseOrder = PHASES.find((p) => p.key === phaseKey)?.order ?? 0;

    if (phaseOrder < currentPhaseOrder) return 'complete';
    return 'pending';
  };

  return (
    <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-950 rounded-lg max-w-lg w-full mx-4 shadow-lg">
        {/* Header */}
        <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            {hasRepository ? 'Analyzing Your Codebase' : 'Preparing Your Ticket'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {hasRepository
              ? "Hang tight! We're analyzing your repository to understand its structure and patterns."
              : "Hang tight! We're setting up your ticket specification."}
          </p>
        </div>

        {/* Phase Checklist */}
        <div className="px-6 py-6 space-y-3">
          {PHASES.map((phase) => {
            const status = getPhaseStatus(phase.key);
            const Icon = phase.icon;
            const isActive = status === 'in_progress';
            const isComplete = status === 'complete';

            return (
              <div
                key={phase.key}
                ref={isActive ? activePhaseRef : null}
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

                  {/* AC#2, #3, #4: Phase-mapped loader messages with auto-rotation */}
                  {isActive && (
                    <div className="mt-1">
                      <AnalysisLoaderMessages
                        currentPhase={currentPhase || undefined}
                        isActive={isActive}
                        hasRepository={hasRepository}
                      />
                    </div>
                  )}
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
              style={{ width: `${percent}%` }}
            />
          </div>

          {/* Percent and elapsed time */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400 font-medium">{percent}%</span>
            <span className="text-gray-500 dark:text-gray-500">{elapsedSeconds}s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
