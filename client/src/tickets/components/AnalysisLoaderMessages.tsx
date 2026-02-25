'use client';

import { useEffect, useState } from 'react';

// AC#1: Phase-mapped loading messages for repository analysis
const REPO_MESSAGES: Record<string, string> = {
  fingerprinting: 'Scanning repository structure...',
  reading_files: 'Reading relevant files...',
  analyzing: 'Analyzing code patterns...',
  generating: 'Building context for your spec...',
};

// Messages for non-repository tickets
const NO_REPO_MESSAGES: Record<string, string> = {
  preparing: 'Preparing ticket...',
  analyzing: 'Analyzing requirements...',
  organizing: 'Organizing information...',
  finalizing: 'Setting up specification...',
};

// AC#3: Fallback rotation sequences
const REPO_ROTATION_SEQUENCE = [
  'Scanning repository structure...',
  'Reading relevant files...',
  'Analyzing code patterns...',
  'Building context for your spec...',
];

const NO_REPO_ROTATION_SEQUENCE = [
  'Preparing ticket...',
  'Analyzing requirements...',
  'Organizing information...',
  'Setting up specification...',
];

const ROTATION_INTERVAL_MS = 3000; // 3 seconds per message

interface AnalysisLoaderMessagesProps {
  currentPhase?: string; // AC#2: From SSE stream
  isActive: boolean; // Whether analysis is running
  hasRepository?: boolean; // Whether repository is being analyzed
}

/**
 * AC#1, #4, #5: Displays phase-specific progress messages during analysis
 *
 * Shows human-readable messages that update based on analysis phase.
 * Supports both repository and non-repository ticket creation flows.
 * Falls back to auto-rotation when no phase is available.
 * Uses smooth fade transitions for calm, Linear-inspired UX.
 */
export function AnalysisLoaderMessages({
  currentPhase,
  isActive,
  hasRepository = true, // Default to true for backward compatibility
}: AnalysisLoaderMessagesProps) {
  // Choose message set based on repository presence
  const PHASE_MESSAGES = hasRepository ? REPO_MESSAGES : NO_REPO_MESSAGES;
  const ROTATION_SEQUENCE = hasRepository ? REPO_ROTATION_SEQUENCE : NO_REPO_ROTATION_SEQUENCE;

  const [displayMessage, setDisplayMessage] = useState<string>(ROTATION_SEQUENCE[0]);
  const [rotationIndex, setRotationIndex] = useState<number>(0);
  const [fadeKey, setFadeKey] = useState<number>(0); // AC#4: Trigger re-render for fade

  // AC#2: Update message when SSE phase changes
  useEffect(() => {
    if (currentPhase && PHASE_MESSAGES[currentPhase]) {
      setDisplayMessage(PHASE_MESSAGES[currentPhase]);
      setFadeKey((prev) => prev + 1); // Trigger fade transition
    } else if (currentPhase) {
      // Unknown phase, use default
      const defaultMessage = hasRepository ? 'Analyzing repository...' : 'Preparing ticket...';
      setDisplayMessage(defaultMessage);
      setFadeKey((prev) => prev + 1);
    }
  }, [currentPhase, PHASE_MESSAGES, hasRepository]);

  // AC#3: Auto-rotation fallback when no phase provided
  useEffect(() => {
    // Only rotate if active and no explicit phase from SSE
    if (!isActive || currentPhase) {
      return;
    }

    const interval = setInterval(() => {
      setRotationIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % ROTATION_SEQUENCE.length;
        setDisplayMessage(ROTATION_SEQUENCE[nextIndex]);
        setFadeKey((prev) => prev + 1); // Trigger fade transition
        return nextIndex;
      });
    }, ROTATION_INTERVAL_MS);

    // Cleanup on unmount or when conditions change
    return () => clearInterval(interval);
  }, [isActive, currentPhase, ROTATION_SEQUENCE]);

  if (!isActive) {
    return null;
  }

  return (
    <div
      key={fadeKey}
      className="text-sm text-[var(--text-secondary)] animate-fade-in"
    >
      {displayMessage}
    </div>
  );
}
