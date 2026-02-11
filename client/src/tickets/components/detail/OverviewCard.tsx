'use client';

import { useState } from 'react';
import { Layers, Clock, FileCode, FlaskConical, ChevronDown, FileText, Save, Expand, Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { MetricCell } from './MetricCell';
import type { AECResponse } from '@/services/ticket.service';

interface OverviewCardProps {
  ticket: AECResponse;
  descriptionDraft: string;
  onDescriptionChange: (value: string) => void;
  onDescriptionSave: () => void;
  isSavingDescription: boolean;
  isDescriptionDirty: boolean;
  onDescriptionExpand: () => void;
}

export function OverviewCard({
  ticket,
  descriptionDraft,
  onDescriptionChange,
  onDescriptionSave,
  isSavingDescription,
  isDescriptionDirty,
  onDescriptionExpand,
}: OverviewCardProps) {
  const [notesExpanded, setNotesExpanded] = useState(false);
  const techSpec = ticket.techSpec;

  // Build tech stack string
  const stackParts: string[] = [];
  if (techSpec?.stack?.language) stackParts.push(techSpec.stack.language);
  if (techSpec?.stack?.framework) stackParts.push(techSpec.stack.framework);
  if (techSpec?.stack?.packageManager) stackParts.push(techSpec.stack.packageManager);
  const stackLabel = stackParts.join(' / ') || 'N/A';

  // Estimate string
  const estimate = ticket.estimate;
  const estimateLabel = estimate
    ? `${estimate.min}-${estimate.max}h, ${estimate.confidence}`
    : 'N/A';

  // Count file changes
  const fileCount = techSpec?.fileChanges?.length || 0;

  // Count API endpoints
  const apiCount = techSpec?.apiChanges?.endpoints?.length || 0;

  // Count tests
  const testCount = techSpec?.testPlan
    ? (techSpec.testPlan.unitTests?.length || 0) +
      (techSpec.testPlan.integrationTests?.length || 0) +
      (techSpec.testPlan.edgeCases?.length || 0)
    : 0;

  // Quality score
  const qualityScore = techSpec?.qualityScore;

  const notesPreview = descriptionDraft
    ? descriptionDraft.length > 80
      ? descriptionDraft.slice(0, 80) + '...'
      : descriptionDraft
    : 'No notes yet';

  return (
    <div className="rounded-lg bg-[var(--bg-subtle)] p-4 space-y-3">
      {/* Metrics grid */}
      {techSpec && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCell icon={Layers} label="Stack" value={stackLabel} />
          <MetricCell icon={Clock} label="Estimate" value={estimateLabel} />
          <MetricCell
            icon={FileCode}
            label="Scope"
            value={`${fileCount} files${apiCount > 0 ? `, ${apiCount} APIs` : ''}`}
          />
          <MetricCell icon={FlaskConical} label="Tests" value={`${testCount} tests`} />
        </div>
      )}

      {/* Collapsible Notes */}
      <div className="border-t border-[var(--border)]/20 pt-3">
        <button
          onClick={() => setNotesExpanded((v) => !v)}
          className="flex items-center justify-between w-full group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-3.5 w-3.5 text-[var(--text-tertiary)] flex-shrink-0" />
            <span className="text-xs font-medium text-[var(--text)]">Notes</span>
            {!notesExpanded && (
              <span className="text-[11px] text-[var(--text-tertiary)] truncate">
                {notesPreview}
              </span>
            )}
          </div>
          <ChevronDown
            className={`h-3.5 w-3.5 text-[var(--text-tertiary)] transition-transform flex-shrink-0 ${
              notesExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>

        {notesExpanded && (
          <div className="mt-3 space-y-2">
            <textarea
              value={descriptionDraft}
              onChange={(e) => onDescriptionChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  if (isDescriptionDirty) onDescriptionSave();
                }
              }}
              placeholder="Add notes... (supports Markdown)"
              rows={3}
              className="w-full bg-transparent text-[var(--text-sm)] text-[var(--text-secondary)] leading-relaxed font-mono resize-y rounded-md border border-[var(--border)]/30 px-3 py-2 placeholder:text-[var(--text-tertiary)]/50 focus:outline-none focus:border-[var(--primary)]/50 focus:ring-1 focus:ring-[var(--primary)]/20 transition-colors"
            />
            <div className="flex items-center justify-between">
              {isDescriptionDirty ? (
                <p className="text-[10px] text-[var(--text-tertiary)]">
                  Unsaved changes. Press{' '}
                  <kbd className="px-1 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-tertiary)] font-mono text-[9px]">
                    Cmd+S
                  </kbd>{' '}
                  or click Save.
                </p>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!isDescriptionDirty || isSavingDescription}
                  onClick={onDescriptionSave}
                  className={`h-7 px-2.5 text-xs ${isDescriptionDirty ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)]'}`}
                >
                  {isSavingDescription ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Save className="h-3 w-3 mr-1" />
                  )}
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDescriptionExpand}
                  className="h-7 w-7 p-0 text-[var(--text-tertiary)] hover:text-[var(--text)]"
                  title="Expand editor"
                >
                  <Expand className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
