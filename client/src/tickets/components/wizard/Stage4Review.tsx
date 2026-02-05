'use client';

import React, { useState } from 'react';
import { useWizardStore } from '@tickets/stores/generation-wizard.store';
import { Button } from '@/core/components/ui/button';

/**
 * Stage 4: Final Review Component
 *
 * Displays:
 * - Complete ticket summary (read-only)
 * - Quality score (0-100) with visual indicator
 * - Issues list if score < 80 (expandable)
 * - Create Ticket button (disabled if quality < 50)
 *
 * Features:
 * - All sections read-only
 * - Quality score with color coding (green ≥80, amber 50-79, red <50)
 * - Navigate back to Stage 3 or create ticket
 */
export function Stage4Review() {
  const {
    spec,
    loading,
    goBackToSpec,
    createTicket,
  } = useWizardStore();

  const [expandedIssues, setExpandedIssues] = useState(false);

  if (!spec) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Loading specification...</p>
      </div>
    );
  }

  const qualityScore = spec.qualityScore || 0;
  const scoreColor =
    qualityScore >= 80
      ? 'text-green-600 dark:text-green-400'
      : qualityScore >= 50
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400';

  const scoreBackgroundColor =
    qualityScore >= 80
      ? 'bg-green-100 dark:bg-green-900/20'
      : qualityScore >= 50
        ? 'bg-amber-100 dark:bg-amber-900/20'
        : 'bg-red-100 dark:bg-red-900/20';

  const canCreate = qualityScore >= 50;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center sm:text-left">
        <h2 className="text-xl font-medium text-gray-900 dark:text-gray-50 mb-2">
          Ready to Create Ticket
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Review the final specification below and create your ticket.
        </p>
      </div>

      {/* Quality Score Card */}
      <div className={`rounded-lg border ${scoreBackgroundColor} p-6`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quality Score
            </p>
            <p className={`text-4xl font-bold ${scoreColor}`}>
              {qualityScore}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {qualityScore >= 80
                ? 'Excellent - Ready to create'
                : qualityScore >= 50
                  ? 'Good - Minor issues present'
                  : 'Low - Address issues before creating'}
            </p>
          </div>

          {/* Visual Score Indicator */}
          <div className="hidden sm:block">
            <div className="w-24 h-24 rounded-full border-4 border-gray-300 dark:border-gray-700 flex items-center justify-center">
              <div className="text-center">
                <p className={`text-2xl font-bold ${scoreColor}`}>
                  {Math.round((qualityScore / 100) * 100)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Issues Section (if score < 80) */}
      {qualityScore < 80 && spec.ambiguityFlags.length > 0 && (
        <div className="border border-amber-200 dark:border-amber-800 rounded-lg overflow-hidden">
          <button
            onClick={() => setExpandedIssues(!expandedIssues)}
            className="w-full px-6 py-4 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 flex items-center justify-between"
            aria-expanded={expandedIssues}
          >
            <div className="text-left">
              <h3 className="font-medium text-amber-900 dark:text-amber-200">
                {spec.ambiguityFlags.length} Issues Found
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
                Review and address these items for better quality
              </p>
            </div>
            <span className="text-2xl text-amber-600 dark:text-amber-400">
              {expandedIssues ? '−' : '+'}
            </span>
          </button>
          {expandedIssues && (
            <div className="px-6 py-4 border-t border-amber-200 dark:border-amber-800 space-y-2">
              {spec.ambiguityFlags.map((issue, i) => (
                <p key={i} className="text-sm text-amber-800 dark:text-amber-300">
                  • {issue}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Specification Summary */}
      <div className="space-y-6 bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</p>
          <p className="text-lg font-medium text-gray-900 dark:text-gray-50">{spec.title}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              In Scope ({spec.inScope.length})
            </p>
            <ul className="space-y-1">
              {spec.inScope.slice(0, 3).map((item, i) => (
                <li key={i} className="text-sm text-gray-600 dark:text-gray-400">
                  ✓ {item}
                </li>
              ))}
              {spec.inScope.length > 3 && (
                <li className="text-sm text-gray-500 dark:text-gray-500 italic">
                  +{spec.inScope.length - 3} more
                </li>
              )}
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Out of Scope ({spec.outOfScope.length})
            </p>
            <ul className="space-y-1">
              {spec.outOfScope.slice(0, 3).map((item, i) => (
                <li key={i} className="text-sm text-gray-600 dark:text-gray-400">
                  − {item}
                </li>
              ))}
              {spec.outOfScope.length > 3 && (
                <li className="text-sm text-gray-500 dark:text-gray-500 italic">
                  +{spec.outOfScope.length - 3} more
                </li>
              )}
            </ul>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Acceptance Criteria ({spec.acceptanceCriteria.length})
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {spec.acceptanceCriteria.length} acceptance criteria defined and ready for testing
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            File Changes ({spec.fileChanges.length})
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {spec.fileChanges.length} files to create/modify/delete
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={goBackToSpec}
          disabled={loading}
          className="flex-1"
        >
          Back to Draft
        </Button>
        <Button
          type="button"
          onClick={createTicket}
          disabled={!canCreate || loading}
          className="flex-1"
        >
          {loading ? 'Creating Ticket...' : 'Create Ticket'}
        </Button>
      </div>

      {!canCreate && (
        <p className="text-sm text-red-600 dark:text-red-400 text-center">
          Quality score must be at least 50 to create a ticket. Please go back and review the draft.
        </p>
      )}
    </div>
  );
}
