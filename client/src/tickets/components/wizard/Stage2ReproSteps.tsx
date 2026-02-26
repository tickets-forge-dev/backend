'use client';

import React from 'react';
import { useWizardStore } from '@/tickets/stores/generation-wizard.store';
import { Input } from '@/core/components/ui/input';
import { Button } from '@/core/components/ui/button';
import { Plus, X } from 'lucide-react';

/**
 * Stage 2: Reproduction Steps (Bug tickets only)
 *
 * Lets users provide ordered reproduction steps before spec generation.
 * Each step has: action (required), expectedBehavior (optional), actualBehavior (optional).
 * Steps are optional — 0 steps is fine (AI will infer from description).
 */
export function Stage2ReproSteps() {
  const {
    reproductionSteps,
    addReproductionStep,
    updateReproductionStep,
    removeReproductionStep,
  } = useWizardStore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--text)]">Reproduction Steps</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Help AI understand the bug. You can skip this — AI will infer steps from your description.
        </p>
      </div>

      {/* Steps list */}
      {reproductionSteps.length > 0 && (
        <div className="space-y-4">
          {reproductionSteps.map((step, index) => (
            <div
              key={index}
              className="relative border border-[var(--border-subtle)] rounded-lg p-4"
            >
              {/* Step number + delete */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  Step {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeReproductionStep(index)}
                  className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950 text-[var(--text-tertiary)] hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  aria-label={`Remove step ${index + 1}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action (required) */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    What did you do? <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={step.action}
                    onChange={(e) => updateReproductionStep(index, { action: e.target.value })}
                    placeholder='e.g. "Click the Submit button on the checkout page"'
                    className="text-sm"
                  />
                </div>

                {/* Expected + Actual side by side on larger screens */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                      What should happen?
                    </label>
                    <Input
                      value={step.expectedBehavior ?? ''}
                      onChange={(e) => updateReproductionStep(index, { expectedBehavior: e.target.value || undefined })}
                      placeholder='e.g. "Order confirmation page loads"'
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                      What actually happens?
                    </label>
                    <Input
                      value={step.actualBehavior ?? ''}
                      onChange={(e) => updateReproductionStep(index, { actualBehavior: e.target.value || undefined })}
                      placeholder='e.g. "Spinner hangs indefinitely"'
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add step button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addReproductionStep}
        className="gap-1.5"
      >
        <Plus className="w-4 h-4" />
        Add step
      </Button>

      {/* Empty state hint */}
      {reproductionSteps.length === 0 && (
        <p className="text-xs text-[var(--text-tertiary)]">
          No steps added yet. Click &quot;Add step&quot; to describe how to reproduce the bug, or press Next to let AI generate steps from your description.
        </p>
      )}
    </div>
  );
}
