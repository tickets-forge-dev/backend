'use client';

import { useState } from 'react';
import { Button } from '@/core/components/ui/button';
import { usePRDBreakdownStore } from '@/tickets/stores/prd-breakdown.store';
import { usePRDService } from '@/services/prd.service';
import { useTicketsStore } from '@/stores/tickets.store';
import { RepositorySelector } from '../RepositorySelector';
import { AlertCircle, Loader2 } from 'lucide-react';

/**
 * PRDInputForm - Step 1: Input PRD text and select repository
 *
 * User pastes PRD text and selects a repository for context.
 * Then clicks "Analyze PRD" to trigger the LLM breakdown workflow.
 */
export function PRDInputForm() {
  const prdService = usePRDService();
  const { selectedRepository } = useTicketsStore();
  const {
    prdText,
    projectName,
    isAnalyzing,
    error,
    setPRDText,
    setProjectName,
    setBreakdown,
    setAnalyzing,
    setError,
    moveToReview,
  } = usePRDBreakdownStore();

  const [validationError, setValidationError] = useState<string | null>(null);

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

    if (!selectedRepository) {
      setValidationError('Repository selection is required');
      return;
    }

    // Parse repository from "owner/name" format
    const [repositoryOwner, repositoryName] = selectedRepository.split('/');

    // Analyze
    setAnalyzing(true);
    try {
      const result = await prdService.breakdownPRD({
        prdText,
        repositoryOwner,
        repositoryName,
        projectName,
      });

      setBreakdown(
        result.breakdown,
        result.analysisTime,
        result.estimatedTicketsCount,
      );
      moveToReview();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to analyze PRD';
      setError(message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
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

      {/* Repository selection */}
      <RepositorySelector />

      {/* Analyze button */}
      <div className="flex justify-end">
        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !prdText.trim() || !selectedRepository}
          className="flex items-center gap-2"
        >
          {isAnalyzing && <Loader2 className="w-4 h-4 animate-spin" />}
          {isAnalyzing ? 'Analyzing PRD...' : 'Analyze PRD'}
        </Button>
      </div>

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
