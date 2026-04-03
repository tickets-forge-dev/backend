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
  onSendToBackground?: () => void;
  onCancel?: () => void;
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
      'detecting_stack': 'fingerprinting', // BackgroundScanService uses this name
      'selecting_files': 'selecting_files',
      'reading_files': 'reading_files',
      'analyzing': 'analyzing',
      'complete': 'complete',
      'completed': 'complete', // Background jobs use 'completed' (with 'd')
    };
    return repoPhaseMap[backendPhase] || null;
  }

  // For non-repository tickets, map backend 'complete'/'completed' to our phases
  if (backendPhase === 'complete' || backendPhase === 'completed') return 'complete';
  // Default to 'preparing' for non-repo case
  return 'preparing';
}

export function AnalysisProgressDialog({
  currentPhase,
  message,
  percent,
  hasRepository = true, // Default to true for backward compatibility
  onSendToBackground,
  onCancel,
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

  // Warn user before leaving the page (tab close, navigation, refresh)
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers show a generic message, but returnValue is still needed
      e.returnValue = 'Analysis is in progress. Leaving will cancel it.';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
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

  // Debug: log phase changes
  useEffect(() => {
    console.log('[AnalysisDialog] phase:', currentPhase, '→ normalized:', normalizedPhase, 'percent:', percent);
  }, [currentPhase, normalizedPhase, percent]);

  // Determine which phases are complete, in-progress, and pending
  const getPhaseStatus = (phaseKey: string): 'pending' | 'in_progress' | 'complete' => {
    if (phaseKey === normalizedPhase) return 'in_progress';

    const currentPhaseOrder = PHASES.find((p) => p.key === normalizedPhase)?.order ?? 0;
    const phaseOrder = PHASES.find((p) => p.key === phaseKey)?.order ?? 0;

    if (phaseOrder < currentPhaseOrder) return 'complete';
    return 'pending';
  };

  return (
    <div className="fixed inset-0 bg-black/30 dark:bg-black/50 z-[1100] flex items-center justify-center backdrop-blur-md" style={{ pointerEvents: 'auto' }}>
      <div className="bg-[var(--bg-subtle)] rounded-lg max-w-lg w-full mx-4 shadow-xl border border-[var(--border-subtle)]">
        {/* Header */}
        <div className="px-6 py-6 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text)]">
            {hasRepository ? 'Analyzing Your Codebase' : 'Preparing Your Ticket'}
          </h2>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">
            {hasRepository
              ? "Please stay on this page — we're analyzing your repository."
              : "Please stay on this page — we're setting up your ticket."}
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
                className={`flex items-start gap-3 p-3 rounded-md transition-colors duration-300 ${
                  isActive
                    ? 'bg-blue-400/8 border border-blue-400/10'
                    : isComplete
                      ? 'bg-emerald-500/10'
                      : 'bg-zinc-800/40'
                }`}
              >
                {/* Icon/Status */}
                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center mt-0.5">
                  {isComplete ? (
                    <Check className="w-5 h-5 text-emerald-400" />
                  ) : isActive ? (
                    <Loader2 className="w-5 h-5 text-blue-300/70 animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5 text-zinc-600" />
                  )}
                </div>

                {/* Phase info */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      isActive
                        ? 'text-blue-300/70'
                        : isComplete
                          ? 'text-emerald-400'
                          : 'text-zinc-500'
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
        <div className="px-6 py-6 border-t border-[var(--border-subtle)] space-y-3">
          {/* Progress bar */}
          <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400/50 to-blue-300/60 transition-all duration-500 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>

          {/* Percent and elapsed time */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-secondary)] font-medium">{percent}%</span>
            <span className="text-[var(--text-tertiary)]">{elapsedSeconds}s</span>
          </div>

          {/* Action buttons for background finalization */}
          {(onSendToBackground || onCancel) && (
            <div className="flex items-center justify-end gap-2 pt-2">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="px-3 py-1.5 text-xs font-medium rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  Cancel
                </button>
              )}
              {onSendToBackground && (
                <button
                  onClick={onSendToBackground}
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-400/15 text-blue-300 border border-blue-400/20 hover:bg-blue-400/25 transition-colors"
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
