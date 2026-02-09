'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWizardStore, type RecoveryInfo } from '@/tickets/stores/generation-wizard.store';
import { Stage1Input } from './wizard/Stage1Input';
import { Stage3Draft } from './wizard/Stage3Draft';
import { Stage4Review } from './wizard/Stage4Review';
import { StageIndicator } from './wizard/StageIndicator';
import { WizardOverlay } from './wizard/WizardOverlay';

/**
 * GenerationWizard Container Component
 *
 * Orchestrates the 4-stage ticket generation wizard:
 * 1. Input: User enters title and selects repository
 * 2. Context: Reviews detected stack, patterns, and files
 * 3. Draft: Reviews generated spec and answers clarification questions
 * 4. Review: Final review before ticket creation
 *
 * Manages:
 * - Conditional rendering of stages
 * - Loading overlay during API calls
 * - Error display and retry logic
 * - Stage navigation (forward and backward)
 * - Recovery detection on mount (resume after refresh/navigation)
 * - Overall wizard flow
 */
export function GenerationWizard({ resumeId }: { resumeId?: string }) {
  const router = useRouter();
  const {
    currentStage,
    loading,
    error,
    setError,
    reset,
    tryRecover,
    applyRecovery,
    resumeDraft,
  } = useWizardStore();

  const [recoveryInfo, setRecoveryInfo] = useState<RecoveryInfo | null>(null);
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(false);

  // On mount: handle resume param or detect recoverable state
  // tryRecover only reads — it does NOT mutate store state
  useEffect(() => {
    if (resumeId) {
      resumeDraft(resumeId);
      // Also show banner for resume URL param so user can start fresh if needed
      setRecoveryInfo({
        canRecover: true,
        stage: 2, // Will be updated to correct stage by resumeDraft
        title: 'Draft Ticket',
      });
      setShowRecoveryBanner(true);
      return;
    }

    const info = tryRecover();
    if (info.canRecover) {
      setRecoveryInfo(info);
      setShowRecoveryBanner(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResume = useCallback(async () => {
    setShowRecoveryBanner(false);
    setRecoveryInfo(null);
    // applyRecovery reads the snapshot and restores state (or calls resumeDraft for Stage 3+)
    await applyRecovery();
    // Clear resume param from URL so user doesn't auto-resume on next visit
    if (resumeId) {
      router.push('/create');
    }
  }, [applyRecovery, resumeId, router]);

  const handleStartFresh = useCallback(() => {
    reset();
    setShowRecoveryBanner(false);
    setRecoveryInfo(null);
    // Clear the resume param from URL so user doesn't get stuck
    if (resumeId) {
      router.push('/create');
    }
  }, [reset, resumeId, router]);

  return (
    <div className="relative w-full h-full bg-white dark:bg-gray-950">
      {/* Stage Indicator */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6">
          <StageIndicator currentStage={currentStage} />
        </div>
      </div>

      {/* Recovery Banner */}
      {showRecoveryBanner && recoveryInfo && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="max-w-4xl mx-auto px-4 py-3 sm:px-6 flex items-center justify-between gap-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              You have an in-progress ticket: <span className="font-medium">&ldquo;{recoveryInfo.title}&rdquo;</span>
            </p>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleResume}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Resume
              </button>
              <button
                onClick={handleStartFresh}
                className="px-3 py-1.5 text-xs font-medium rounded-md text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors"
              >
                Start Fresh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
        {/* Stage 1: Input */}
        {currentStage === 1 && <Stage1Input />}

        {/* Stage 3: Draft Review & Questions (Stage 2 context review removed) */}
        {currentStage === 3 && <Stage3Draft />}

        {/* Stage 4: Final Review & Create */}
        {currentStage === 4 && <Stage4Review />}
      </div>

      {/* Loading Overlay */}
      {loading && <WizardOverlay />}

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-w-sm z-50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
