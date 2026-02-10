'use client';

import { useState } from 'react';
import { Button } from '@/core/components/ui/button';
import { usePRDBreakdownStore } from '@/tickets/stores/prd-breakdown.store';
import { usePRDService } from '@/services/prd.service';
import { AlertCircle, Loader2 } from 'lucide-react';

/**
 * PRDInputForm - Step 1: Input PRD text and select repository
 *
 * User pastes PRD text and selects a repository for context.
 * Then clicks "Analyze PRD" to trigger the LLM breakdown workflow.
 */
export function PRDInputForm() {
  const prdService = usePRDService();
  const {
    prdText,
    repositoryOwner,
    repositoryName,
    projectName,
    isAnalyzing,
    error,
    setPRDText,
    setRepository,
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

    if (!repositoryOwner || !repositoryName) {
      setValidationError('Repository selection is required');
      return;
    }

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
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">
              {error || validationError}
            </p>
            {error && (
              <p className="text-xs text-red-700 mt-1">
                Try pasting a clearer PRD with specific requirements
              </p>
            )}
          </div>
        </div>
      )}

      {/* PRD text input */}
      <div>
        <label className="block text-sm font-medium text-slate-900 mb-2">
          Paste your PRD
        </label>
        <textarea
          value={prdText}
          onChange={(e) => setPRDText(e.target.value)}
          placeholder="Paste your Product Requirements Document here. Include functional requirements, user stories, and success criteria..."
          className="w-full h-64 p-4 border border-slate-200 rounded-lg font-mono text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isAnalyzing}
        />
        <p className="text-xs text-slate-500 mt-2">
          {prdText.length} characters
          {prdText.length < 100 && (
            <span className="text-red-600 font-medium">
              {' '}
              (minimum 100 required)
            </span>
          )}
        </p>
      </div>

      {/* Repository and project */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Repository owner */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Repository Owner
          </label>
          <input
            type="text"
            value={repositoryOwner}
            onChange={(e) => setRepository(e.target.value, repositoryName)}
            placeholder="e.g., facebook"
            className="w-full px-4 py-2 border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isAnalyzing}
          />
        </div>

        {/* Repository name */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Repository Name
          </label>
          <input
            type="text"
            value={repositoryName}
            onChange={(e) => setRepository(repositoryOwner, e.target.value)}
            placeholder="e.g., react"
            className="w-full px-4 py-2 border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isAnalyzing}
          />
          <p className="text-xs text-slate-500 mt-2">
            Used for tech stack detection and code-aware analysis
          </p>
        </div>

        {/* Project name */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Project Name (optional)
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g., Authentication System"
            className="w-full px-4 py-2 border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isAnalyzing}
          />
        </div>
      </div>

      {/* Analyze button */}
      <div className="flex justify-end">
        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !prdText.trim() || !repositoryOwner}
          className="flex items-center gap-2"
        >
          {isAnalyzing && <Loader2 className="w-4 h-4 animate-spin" />}
          {isAnalyzing ? 'Analyzing PRD...' : 'Analyze PRD'}
        </Button>
      </div>

      {/* Info box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>Tip:</strong> The PRD should include clear functional requirements,
          user stories, and success criteria. The more detailed your PRD, the better the
          breakdown.
        </p>
      </div>
    </div>
  );
}
