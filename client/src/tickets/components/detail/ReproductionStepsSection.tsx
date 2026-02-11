'use client';

import { ReproductionStepCard } from './ReproductionStepCard';
import { CollapsibleSection } from '@/tickets/components/CollapsibleSection';
import { Button } from '@/core/components/ui/button';
import type { BugDetailsSpec } from '@/types/question-refinement';

interface ReproductionStepsSectionProps {
  bugDetails: BugDetailsSpec;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onAdd: () => void;
  readOnly?: boolean;
}

/**
 * Displays reproduction steps section for bug tickets
 *
 * Shows:
 * - Ordered list of steps with numbered badges
 * - Environment context (browser, OS, viewport, role)
 * - AI analysis (suspected cause, related files, suggested fix)
 * - Frequency and impact badges
 * - Add/Edit/Delete actions (if not read-only)
 *
 * Each step is collapsible and shows:
 * - Action text
 * - Expected vs actual behavior
 * - API call details (method, URL, headers, body, status)
 * - Console logs (syntax highlighting)
 * - Code snippets
 * - Notes
 */
export function ReproductionStepsSection({
  bugDetails,
  onEdit,
  onDelete,
  onAdd,
  readOnly = false,
}: ReproductionStepsSectionProps) {
  return (
    <CollapsibleSection
      id="reproduction-steps"
      title="Reproduction Steps"
      badge={`${bugDetails.reproductionSteps.length} steps`}
      defaultExpanded={true}
    >
      <div className="space-y-4">
        {/* Steps list
            TODO: Use step.id or step.order as key instead of array index to prevent
            state bugs if steps are reordered. Currently using index as temporary solution.
        */}
        {bugDetails.reproductionSteps.map((step, idx) => (
          <ReproductionStepCard
            key={`step-${step.order}-${idx}`}
            step={step}
            index={idx}
            onEdit={() => onEdit(idx)}
            onDelete={() => onDelete(idx)}
            readOnly={readOnly}
          />
        ))}

        {/* Environment context */}
        {bugDetails.environment && (
          <div className="border-t pt-4 mt-4">
            <h4 className="text-xs font-medium text-[var(--text-tertiary)] uppercase mb-2">Environment</h4>
            <div className="flex flex-wrap gap-2">
              {bugDetails.environment.browser && (
                <div className="px-2 py-1 bg-[var(--bg-secondary)] rounded text-xs text-[var(--text-secondary)]">
                  🌐 {bugDetails.environment.browser}
                </div>
              )}
              {bugDetails.environment.os && (
                <div className="px-2 py-1 bg-[var(--bg-secondary)] rounded text-xs text-[var(--text-secondary)]">
                  💻 {bugDetails.environment.os}
                </div>
              )}
              {bugDetails.environment.viewport && (
                <div className="px-2 py-1 bg-[var(--bg-secondary)] rounded text-xs text-[var(--text-secondary)]">
                  📱 {bugDetails.environment.viewport}
                </div>
              )}
              {bugDetails.environment.userRole && (
                <div className="px-2 py-1 bg-[var(--bg-secondary)] rounded text-xs text-[var(--text-secondary)]">
                  👤 {bugDetails.environment.userRole}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Frequency and impact */}
        {(bugDetails.frequency || bugDetails.impact) && (
          <div className="border-t pt-4 flex gap-4">
            {bugDetails.frequency && (
              <div>
                <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase mb-1">Frequency</p>
                <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs rounded">
                  {bugDetails.frequency}
                </span>
              </div>
            )}
            {bugDetails.impact && (
              <div>
                <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase mb-1">Impact</p>
                <span
                  className={`inline-block px-2 py-1 text-xs rounded ${
                    bugDetails.impact === 'critical'
                      ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                      : bugDetails.impact === 'high'
                        ? 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300'
                        : bugDetails.impact === 'medium'
                          ? 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300'
                          : 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300'
                  }`}
                >
                  {bugDetails.impact}
                </span>
              </div>
            )}
          </div>
        )}

        {/* AI Analysis */}
        {(bugDetails.suspectedCause || bugDetails.suggestedFix || bugDetails.relatedFiles) && (
          <div className="border-t pt-4 bg-amber-50 dark:bg-amber-950/20 p-3 rounded space-y-2">
            <h4 className="text-xs font-medium text-amber-900 dark:text-amber-100">🤖 AI Analysis</h4>

            {bugDetails.suspectedCause && (
              <div>
                <p className="text-xs font-medium text-amber-800 dark:text-amber-200 mb-1">Suspected Cause:</p>
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">{bugDetails.suspectedCause}</p>
              </div>
            )}

            {bugDetails.suggestedFix && (
              <div>
                <p className="text-xs font-medium text-amber-800 dark:text-amber-200 mb-1">Suggested Fix:</p>
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">{bugDetails.suggestedFix}</p>
              </div>
            )}

            {bugDetails.relatedFiles && bugDetails.relatedFiles.length > 0 && (
              <div>
                <p className="text-xs font-medium text-amber-800 dark:text-amber-200 mb-1">Related Files:</p>
                <ul className="space-y-0.5 text-xs text-amber-700 dark:text-amber-300">
                  {bugDetails.relatedFiles.map((file, i) => (
                    <li key={i}>• {file}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Add Step button */}
        {!readOnly && (
          <Button onClick={onAdd} variant="outline" size="sm" className="w-full text-xs">
            + Add Step
          </Button>
        )}
      </div>
    </CollapsibleSection>
  );
}
