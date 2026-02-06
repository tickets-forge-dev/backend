'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWizardStore } from '@/tickets/stores/generation-wizard.store';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

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

  // Auto-navigate to ticket detail page after a brief delay
  useEffect(() => {
    if (draftAecId) {
      const timer = setTimeout(() => {
        router.push(`/tickets/${draftAecId}`);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [draftAecId, router]);

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
            {spec?.problemStatement && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Problem
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {typeof spec.problemStatement === 'string'
                    ? spec.problemStatement
                    : (spec.problemStatement as any).narrative || JSON.stringify(spec.problemStatement)}
                </p>
              </div>
            )}

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

      {/* Info */}
      <div className="text-center">
        <p className="text-xs text-gray-500 dark:text-gray-500">
          Redirecting to ticket details in 2 seconds...
        </p>
      </div>
    </div>
  );
}
