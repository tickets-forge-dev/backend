'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWizardStore, type RecoveryInfo } from '@/tickets/stores/generation-wizard.store';
import { Stage1Input } from './wizard/Stage1Input';
import { Stage3Draft } from './wizard/Stage3Draft';
import { StageIndicator } from './wizard/StageIndicator';
import { AnalysisProgressDialog } from './wizard/AnalysisProgressDialog';
import { FirstTicketCelebrationDialog } from '@/core/components/celebration/FirstTicketCelebrationDialog';
import { Button } from '@/core/components/ui/button';

/**
 * GenerationWizard Container Component
 *
 * Orchestrates the ticket generation wizard:
 * 1. Input: User enters title and selects repository
 * 3. Draft: Answers clarification questions, reviews generated spec, and shows unified summary
 *
 * Manages:
 * - Conditional rendering of stages
 * - Loading overlay during API calls
 * - Error display and retry logic
 * - Stage navigation (forward and backward)
 * - Recovery detection on mount (resume after refresh/navigation)
 * - Overall wizard flow
 */
export function GenerationWizard({ resumeId, initialType, forceNew }: { resumeId?: string; initialType?: 'feature' | 'bug' | 'task'; forceNew?: boolean }) {
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
    currentPhase,
    loadingMessage,
    progressPercent,
    setType,
    draftAecId,
    showCelebration,
    closeCelebration,
    input,
    includeRepository,
    analyzeRepository,
    hasRepository,
  } = useWizardStore();

  const [recoveryInfo, setRecoveryInfo] = useState<RecoveryInfo | null>(null);
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(false);

  // On mount: reset if forceNew is true (e.g., mode=new URL param)
  useEffect(() => {
    if (forceNew) {
      reset();
    }
  }, [forceNew, reset]);

  // On mount: set initial type if provided
  useEffect(() => {
    if (initialType) {
      setType(initialType);
    }
  }, [initialType, setType]);

  // On mount: handle resume param or detect recoverable state
  // tryRecover only reads — it does NOT mutate store state
  // Skip recovery check if forceNew is true
  useEffect(() => {
    if (forceNew) {
      // forceNew means start fresh, don't offer recovery
      return;
    }

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
  }, [forceNew]);

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

  // Create Next button for current stage
  const getNextButton = () => {
    if (currentStage === 1) {
      // Stage 1: Input validation
      const wordCount = input.title.trim().split(/\s+/).filter(Boolean).length;
      const isTitleValid = wordCount >= 2 && input.title.length <= 500;
      const isRepoValid = !includeRepository || (input.repoOwner.length > 0 && input.repoName.length > 0);
      const isFormValid = isTitleValid && isRepoValid;

      return (
        <Button
          onClick={(e) => {
            e.preventDefault();
            if (isFormValid) {
              analyzeRepository();
            }
          }}
          disabled={!isFormValid || loading}
          size="sm"
          className="min-w-[96px]"
        >
          {loading ? 'Analyzing...' : 'Next'}
        </Button>
      );
    }
    // Add other stages as needed
    return null;
  };

  return (
    <div className="relative w-full h-full bg-white dark:bg-gray-950">
      {/* Stage Indicator - Hide after ticket is created */}
      {!draftAecId && (
        <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6">
            <StageIndicator currentStage={currentStage} nextButton={getNextButton()} />
          </div>
        </div>
      )}

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

        {/* Stage 3: Draft Review, Questions & Unified Summary */}
        {currentStage === 3 && <Stage3Draft />}
      </div>

      {/* Analysis Progress Dialog */}
      {loading && (
        <AnalysisProgressDialog
          currentPhase={currentPhase}
          message={loadingMessage}
          percent={progressPercent}
          hasRepository={hasRepository}
        />
      )}

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

      {/* First Ticket Celebration */}
      <FirstTicketCelebrationDialog
        open={showCelebration}
        onClose={closeCelebration}
      />
    </div>
  );
}
