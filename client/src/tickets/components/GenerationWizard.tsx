'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWizardStore, type RecoveryInfo, type WizardStage } from '@/tickets/stores/generation-wizard.store';
import { useJobsStore } from '@/stores/jobs.store';
import { useTicketsStore } from '@/stores/tickets.store';
import { DetailsStep } from './wizard/DetailsStep';
import { CodebaseStep } from './wizard/CodebaseStep';
import { ReferencesStep } from './wizard/ReferencesStep';
import { Stage2ReproSteps } from './wizard/Stage2ReproSteps';
import { GenerationOptionsStep } from './wizard/GenerationOptionsStep';
import { Stage3Draft } from './wizard/Stage3Draft';
import { StageIndicator } from './wizard/StageIndicator';
import { AnalysisProgressDialog } from './wizard/AnalysisProgressDialog';
import { FirstTicketCelebrationDialog } from '@/core/components/celebration/FirstTicketCelebrationDialog';
import { Button } from '@/core/components/ui/button';
import { ArrowLeft } from 'lucide-react';

/**
 * GenerationWizard Container Component
 *
 * Orchestrates the ticket generation wizard with named stages:
 * Non-bug: Details → Codebase → References → Options → Generate
 * Bug:     Details → Reproduce → Codebase → References → Options → Generate
 */
export function GenerationWizard({ resumeId, initialType, forceNew }: { resumeId?: string; initialType?: 'feature' | 'bug' | 'task'; forceNew?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    setTitle,
    draftAecId,
    draftAecSlug,
    showCelebration,
    closeCelebration,
    type,
    input,
    includeRepository,
    hasRepository,
    nextStage,
    prevStage,
    activeJobId,
    cancelAnalysis,
  } = useWizardStore();

  // Subscribe to job progress when an active job is running
  const activeJob = useJobsStore((s) => activeJobId ? s.getJobById(activeJobId) : undefined);
  const cancelJob = useJobsStore((s) => s.cancelJob);

  const [recoveryInfo, setRecoveryInfo] = useState<RecoveryInfo | null>(null);
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(false);

  // When the active job completes, navigate to the ticket detail page
  useEffect(() => {
    if (activeJob?.status === 'completed' && draftAecId) {
      // Job completed — navigate to ticket detail
      const slug = draftAecSlug || draftAecId;
      useWizardStore.setState({
        loading: false,
        currentPhase: null,
        loadingMessage: null,
        activeJobId: null,
      });
      router.push(`/tickets/${slug}`);
    } else if (activeJob?.status === 'failed') {
      // Job failed — show error and clear loading state
      useWizardStore.setState({
        loading: false,
        currentPhase: null,
        loadingMessage: null,
        activeJobId: null,
        error: activeJob.error || 'Spec generation failed. Please try again.',
      });
    } else if (activeJob?.status === 'cancelled') {
      // Job cancelled — clear loading state
      useWizardStore.setState({
        loading: false,
        currentPhase: null,
        loadingMessage: null,
        activeJobId: null,
      });
    } else if (activeJob && (activeJob.status === 'running' || activeJob.status === 'retrying')) {
      // Job in progress — sync progress from job to wizard state
      useWizardStore.setState({
        currentPhase: activeJob.phase,
        progressPercent: activeJob.percent,
      });
    }
  }, [activeJob, draftAecId, draftAecSlug, router]);

  // On mount: reset if forceNew is true (e.g., mode=new URL param)
  useEffect(() => {
    if (forceNew) {
      reset();
      // Pre-fill description from query param (e.g., from quick draft)
      const desc = searchParams.get('description');
      if (desc) {
        setTitle(desc);
      }
    }
  }, [forceNew, reset, searchParams, setTitle]);

  // On mount: set initial type if provided
  useEffect(() => {
    if (initialType) {
      setType(initialType);
    }
  }, [initialType, setType]);

  // On mount or resumeId change: handle resume param or detect recoverable state
  useEffect(() => {
    if (forceNew) return;

    if (resumeId) {
      resumeDraft(resumeId);
      return;
    }

    const info = tryRecover();
    if (info.canRecover) {
      setRecoveryInfo(info);
      setShowRecoveryBanner(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceNew, resumeId]);

  const handleResume = useCallback(async () => {
    setShowRecoveryBanner(false);
    setRecoveryInfo(null);
    await applyRecovery();
    if (resumeId) {
      router.push('/create');
    }
  }, [applyRecovery, resumeId, router]);

  const handleStartFresh = useCallback(() => {
    reset();
    setShowRecoveryBanner(false);
    setRecoveryInfo(null);
    if (resumeId) {
      router.push('/create');
    }
  }, [reset, resumeId, router]);

  // Handler: send generation to background and navigate away
  const handleSendToBackground = useCallback(() => {
    router.push('/tickets');
  }, [router]);

  // Handler: cancel the active generation job
  const handleCancelJob = useCallback(async () => {
    if (!activeJobId) return;
    try {
      await cancelJob(activeJobId);
      useWizardStore.setState({
        loading: false,
        currentPhase: null,
        loadingMessage: null,
        activeJobId: null,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel';
      setError(msg);
    }
  }, [activeJobId, cancelJob, setError]);

  // Handler: cancel foreground analysis (SSE stream)
  const handleCancelAnalysis = useCallback(() => {
    useWizardStore.getState().cancelAnalysis();
  }, []);

  const isBranchesLoading = useTicketsStore((s) => s.isBranchesLoading);

  // Validation for the Details step
  const wordCount = input.title.trim().split(/\s+/).filter(Boolean).length;
  const isTitleValid = wordCount >= 2 && input.title.length <= 2000;
  const isRepoValid = !includeRepository || (input.repoOwner.length > 0 && input.repoName.length > 0);

  // Determine if the progress dialog is for a background job (shows extra buttons)
  const isBackgroundJob = !!activeJobId;

  // Resolve progress data: from jobs store when a background job is active, otherwise from wizard store
  const resolvedPhase = isBackgroundJob ? (activeJob?.phase ?? currentPhase) : currentPhase;
  const resolvedPercent = isBackgroundJob ? (activeJob?.percent ?? progressPercent) : progressPercent;

  // Next button logic based on current stage
  const getNextButton = () => {
    // Details step — validate title
    if (currentStage === 'details') {
      return (
        <Button
          onClick={() => { if (isTitleValid) nextStage(); }}
          disabled={!isTitleValid || loading}
          size="sm"
          className="min-w-[96px]"
        >
          Next
        </Button>
      );
    }

    // Reproduce step (bug only) — Back + Next
    if (currentStage === 'reproduce') {
      return (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevStage}>Back</Button>
          <Button onClick={nextStage} disabled={loading} size="sm" className="min-w-[96px]">
            Next
          </Button>
        </div>
      );
    }

    // Codebase step — Back + Next (validate repo if included)
    if (currentStage === 'codebase') {
      return (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevStage}>Back</Button>
          <Button
            onClick={() => { if (isRepoValid) nextStage(); }}
            disabled={!isRepoValid || loading || isBranchesLoading}
            size="sm"
            className="min-w-[96px]"
          >
            {isBranchesLoading ? 'Loading...' : 'Next'}
          </Button>
        </div>
      );
    }

    // References step — Back + Next (always valid — references are optional)
    if (currentStage === 'references') {
      return (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevStage}>Back</Button>
          <Button onClick={nextStage} disabled={loading} size="sm" className="min-w-[96px]">
            Next
          </Button>
        </div>
      );
    }

    // Options and Generate steps handle their own navigation
    return null;
  };

  // Render the current stage component
  const renderStage = (): React.ReactNode => {
    const stageMap: Record<WizardStage, React.ReactNode> = {
      details: <DetailsStep />,
      reproduce: <Stage2ReproSteps />,
      codebase: <CodebaseStep />,
      references: <ReferencesStep />,
      options: <GenerationOptionsStep />,
      generate: <Stage3Draft />,
    };
    return stageMap[currentStage] ?? <DetailsStep />;
  };

  return (
    <div className="relative w-full h-full bg-white dark:bg-gray-950">
      {/* Stage Indicator - Hide only after ticket is fully generated (generate stage with a draft) */}
      {!(draftAecId && currentStage === 'generate') && (
        <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 py-3 sm:px-6 flex items-center gap-3">
            <button
              onClick={() => router.push('/tickets')}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-subtle)] transition-colors flex-shrink-0"
              aria-label="Back to workspace"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex-1 min-w-0">
              <StageIndicator currentStage={currentStage} nextButton={getNextButton()} ticketType={type} />
            </div>
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
        {renderStage()}
      </div>

      {/* Progress Dialog — shown during both foreground analysis and background job generation */}
      {loading && (resolvedPhase || currentPhase) && (
        <AnalysisProgressDialog
          currentPhase={resolvedPhase}
          message={loadingMessage}
          percent={resolvedPercent}
          hasRepository={hasRepository}
          onSendToBackground={isBackgroundJob ? handleSendToBackground : undefined}
          onCancel={isBackgroundJob ? handleCancelJob : handleCancelAnalysis}
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
