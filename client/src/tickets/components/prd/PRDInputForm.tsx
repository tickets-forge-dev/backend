'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/core/components/ui/button';
import { usePRDBreakdownStore } from '@/tickets/stores/prd-breakdown.store';
import { usePRDService } from '@/services/prd.service';
import { AlertCircle, Loader2, X, Clock } from 'lucide-react';

/**
 * PRDInputForm - Step 1: Input PRD text
 *
 * User pastes PRD text and clicks "Analyze PRD" to trigger the LLM breakdown workflow.
 * Repository selection is optional - it's only needed when deep analysis is required.
 */
export function PRDInputForm() {
  const prdService = usePRDService();
  const {
    prdText,
    projectName,
    isAnalyzing,
    error,
    analysisProgress,
    setPRDText,
    setProjectName,
    setBreakdown,
    setAnalyzing,
    setError,
    setAnalysisProgress,
    moveToReview,
    resumeDraft,
    deleteDraft,
  } = usePRDBreakdownStore();

  const [validationError, setValidationError] = useState<string | null>(null);
  const [savedDraft, setSavedDraft] = useState<any | null>(null);
  const [showResumeBanner, setShowResumeBanner] = useState(true);

  // Check for saved drafts on mount
  useEffect(() => {
    (async () => {
      try {
        const draft = await prdService.getLatestDraft();
        if (draft) {
          setSavedDraft(draft);
        }
      } catch (error) {
        // Silently fail if draft loading fails
        console.debug('No saved draft found');
      }
    })();
  }, [prdService]);

  const handleResumeDraft = () => {
    if (savedDraft) {
      resumeDraft(savedDraft);
      setShowResumeBanner(false);
    }
  };

  const handleDismissDraft = async () => {
    if (savedDraft) {
      try {
        await prdService.deleteDraft(savedDraft.id);
        deleteDraft();
      } catch (error) {
        console.error('Failed to delete draft:', error);
      }
    }
    setShowResumeBanner(false);
    setSavedDraft(null);
  };

  const handleAnalyze = async () => {
    // Validate inputs
    setValidationError(null);
    setError(null);

    if (!prdText.trim()) {
      setValidationError('PRD text is required');
      return;
    }

    if (prdText.trim().length < 100) {
      setValidationError('PRD text must be at least 100 characters');
      return;
    }

    // Analyze (repository is optional)
    setAnalyzing(true);
    setAnalysisProgress('Starting PRD analysis...');
    try {
      const result = await prdService.breakdownPRDWithProgress({
        prdText,
        projectName,
      }, (event) => {
        // Update progress display
        if (event.type === 'progress' && event.message) {
          setAnalysisProgress(event.message);
        } else if (event.type === 'complete') {
          setAnalysisProgress('Analysis complete!');
        } else if (event.type === 'error') {
          setAnalysisProgress(null);
        }
      });

      setBreakdown(
        result.breakdown,
        result.analysisTime,
        result.estimatedTicketsCount,
      );
      setAnalysisProgress(null);
      moveToReview();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to analyze PRD';
      setError(message);
      setAnalysisProgress(null);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Resume draft banner */}
      {savedDraft && showResumeBanner && (
        <div
          className="flex gap-3 p-4 rounded-lg border"
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderColor: 'var(--green)',
          }}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4" style={{ color: 'var(--green)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--green)' }}>
                Resume Previous Breakdown?
              </p>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Found a saved breakdown from {new Date(savedDraft.updatedAt).toLocaleDateString()} with{' '}
              {savedDraft.breakdown?.totalTickets || 0} tickets. Click Resume to pick up where you left off.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              size="sm"
              onClick={handleResumeDraft}
              style={{
                backgroundColor: 'var(--green)',
                color: 'white',
              }}
            >
              Resume
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismissDraft}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Error alert */}
      {(error || validationError) && (
        <div
          className="flex gap-3 p-4 rounded-lg border"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'var(--red)',
          }}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--red)' }} />
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--red)' }}>
              {error || validationError}
            </p>
            {error && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                Try pasting a clearer PRD with specific requirements
              </p>
            )}
          </div>
        </div>
      )}

      {/* PRD text input */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
          Paste your PRD
        </label>
        <textarea
          value={prdText}
          onChange={(e) => setPRDText(e.target.value)}
          placeholder="Paste your Product Requirements Document here. Include functional requirements, user stories, and success criteria..."
          className="w-full h-64 p-4 rounded-lg font-mono text-sm"
          style={{
            backgroundColor: 'var(--bg)',
            color: 'var(--text)',
            borderColor: 'var(--border)',
            borderWidth: '1px',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = '0 0 0 2px var(--blue)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
          disabled={isAnalyzing}
        />
        <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
          {prdText.length} characters
          {prdText.length < 100 && (
            <span className="font-medium" style={{ color: 'var(--red)' }}>
              {' '}
              (minimum 100 required)
            </span>
          )}
        </p>
      </div>

      {/* Analyze button */}
      <div className="flex justify-end">
        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !prdText.trim()}
          className="flex items-center gap-2"
        >
          {isAnalyzing && <Loader2 className="w-4 h-4 animate-spin" />}
          {isAnalyzing ? 'Analyzing PRD...' : 'Analyze PRD'}
        </Button>
      </div>

      {/* Progress message */}
      {analysisProgress && (
        <div
          className="p-3 rounded-lg text-sm"
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            color: 'var(--blue)',
            borderLeft: '3px solid var(--blue)',
            paddingLeft: '12px',
          }}
        >
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            <span>{analysisProgress}</span>
          </div>
        </div>
      )}

      {/* Info box */}
      <div
        className="p-4 rounded-lg border"
        style={{
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'var(--blue)',
        }}
      >
        <p className="text-sm" style={{ color: 'var(--blue)' }}>
          <strong>Tip:</strong> The PRD should include clear functional requirements,
          user stories, and success criteria. The more detailed your PRD, the better the
          breakdown.
        </p>
      </div>
    </div>
  );
}
