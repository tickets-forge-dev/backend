'use client';

import { useEffect, useState } from 'react';

// AC#1: Phase-mapped loading messages
const PHASE_MESSAGES: Record<string, string> = {
  fingerprinting: 'Scanning repository structure...',
  reading_files: 'Reading relevant files...',
  analyzing: 'Analyzing code patterns...',
  generating: 'Building context for your spec...',
};

// AC#3: Fallback rotation sequence
const ROTATION_SEQUENCE = [
  'Scanning repository structure...',
  'Reading relevant files...',
  'Analyzing code patterns...',
  'Building context for your spec...',
];

const ROTATION_INTERVAL_MS = 3000; // 3 seconds per message

interface AnalysisLoaderMessagesProps {
  currentPhase?: string; // AC#2: From SSE stream
  isActive: boolean; // Whether analysis is running
}

/**
 * AC#1, #4, #5: Displays phase-specific progress messages during repository analysis
 *
 * Shows human-readable messages that update based on deep analysis phase.
 * Falls back to auto-rotation when no phase is available.
 * Uses smooth fade transitions for calm, Linear-inspired UX.
 */
export function AnalysisLoaderMessages({ currentPhase, isActive }: AnalysisLoaderMessagesProps) {
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
      setDisplayMessage('Analyzing repository...');
      setFadeKey((prev) => prev + 1);
    }
  }, [currentPhase]);

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
  }, [isActive, currentPhase]);

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
