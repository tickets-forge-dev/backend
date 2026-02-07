'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useWizardStore } from '@/tickets/stores/generation-wizard.store';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { normalizeProblemStatement } from '@/tickets/utils/normalize-problem-statement';

/** Recursively extract the first meaningful string from a deeply nested object */
function extractText(value: unknown, maxDepth = 5): string {
  if (!value) return '';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if ((trimmed.startsWith('{') || trimmed.startsWith('[')) && maxDepth > 0) {
      try {
        const parsed = JSON.parse(trimmed);
        const result = extractText(parsed, maxDepth - 1);
        if (result.length > 10) return result;
      } catch { /* not JSON */ }
      // JSON string but nothing readable extracted — don't return raw JSON
      return '';
    }
    return value;
  }
  if (maxDepth <= 0) return '';
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    for (const key of ['narrative', 'description', 'summary', 'overview', 'problem', 'text', 'whyItMatters', 'context']) {
      if (typeof obj[key] === 'string' && (obj[key] as string).length > 10) return obj[key] as string;
    }
    for (const key of Object.keys(obj)) {
      const result = extractText(obj[key], maxDepth - 1);
      if (result.length > 10) return result;
    }
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const result = extractText(item, maxDepth - 1);
      if (result.length > 10) return result;
    }
  }
  return '';
}

/**
 * Stage 4: Final Review Component
 *
 * Shows:
 * - Final ticket summary (spec)
 * - Quality score and readiness status
 * - Option to go to ticket detail page
 * - Option to create another ticket
 */
export function Stage4Review() {
  const router = useRouter();
  const { draftAecId, spec, input, reset } = useWizardStore();

  // No auto-redirect — let user click "View Ticket Details" manually

  if (!draftAecId) {
    return (
      <div className="space-y-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
        <h2 className="text-xl font-medium text-gray-900 dark:text-gray-50 mb-2">
          Ticket Created Successfully
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Your ticket has been created and is ready for review
        </p>
      </div>

      {/* Ticket Summary */}
      {(spec || input.title) && (
        <Card className="p-6 border-gray-200 dark:border-gray-800">
          <h3 className="font-medium text-gray-900 dark:text-gray-50 mb-4">
            Ticket Summary
          </h3>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {input.title}
              </p>
            </div>

            {/* Problem Statement */}
            {spec?.problemStatement && (() => {
              const ps = normalizeProblemStatement(spec.problemStatement);
              return ps.narrative ? (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Problem
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {ps.narrative}
                  </p>
                </div>
              ) : null;
            })()}

            {/* Quality Score */}
            {spec?.qualityScore !== undefined && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quality Score
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        spec.qualityScore >= 75
                          ? 'bg-green-500'
                          : spec.qualityScore >= 50
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(spec.qualityScore, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {spec.qualityScore.toFixed(0)}/100
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center">
        <Button
          variant="outline"
          onClick={reset}
        >
          Create Another Ticket
        </Button>
        <Button
          onClick={() => {
            if (draftAecId) {
              router.push(`/tickets/${draftAecId}`);
            }
          }}
        >
          View Ticket Details
        </Button>
      </div>

    </div>
  );
}
