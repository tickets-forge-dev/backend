'use client';

import type { ChangeRecordResponse } from '@/services/ticket.service';
import { DivergenceCard } from './DivergenceCard';

interface ChangeRecordTabProps {
  changeRecord: ChangeRecordResponse;
}

export function ChangeRecordTab({ changeRecord }: ChangeRecordTabProps) {
  return (
    <div className="space-y-5">
      {/* Execution Summary */}
      <div className="border border-[var(--border-subtle)] rounded-lg p-4">
        <div className="text-sm font-semibold text-[var(--text-primary)] mb-2">Execution Summary</div>
        <div className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
          {changeRecord.executionSummary}
        </div>
      </div>

      {/* Divergences */}
      {changeRecord.divergences.length > 0 && (
        <div className="space-y-2.5">
          <div className="text-sm font-semibold text-[var(--text-primary)]">
            Divergences ({changeRecord.divergences.length})
          </div>
          {changeRecord.divergences.map((d, i) => (
            <DivergenceCard key={i} divergence={d} />
          ))}
        </div>
      )}

      {/* Decisions / Risks / Scope Changes */}
      {(changeRecord.decisions.length > 0 || changeRecord.risks.length > 0 || changeRecord.scopeChanges.length > 0) && (
        <div className="border border-[var(--border-subtle)] rounded-lg p-4 space-y-3">
          <div className="text-sm font-semibold text-[var(--text-primary)]">Execution Events</div>
          {changeRecord.decisions.map((e) => (
            <div key={e.id} className="flex gap-2 text-[13px]">
              <span className="text-purple-500 shrink-0">💡</span>
              <div>
                <span className="font-medium text-[var(--text-primary)]">{e.title}</span>
                <span className="text-[var(--text-tertiary)]"> — {e.description}</span>
              </div>
            </div>
          ))}
          {changeRecord.risks.map((e) => (
            <div key={e.id} className="flex gap-2 text-[13px]">
              <span className="text-amber-500 shrink-0">⚠️</span>
              <div>
                <span className="font-medium text-[var(--text-primary)]">{e.title}</span>
                <span className="text-[var(--text-tertiary)]"> — {e.description}</span>
              </div>
            </div>
          ))}
          {changeRecord.scopeChanges.map((e) => (
            <div key={e.id} className="flex gap-2 text-[13px]">
              <span className="text-blue-500 shrink-0">📐</span>
              <div>
                <span className="font-medium text-[var(--text-primary)]">{e.title}</span>
                <span className="text-[var(--text-tertiary)]"> — {e.description}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File Changes */}
      {changeRecord.filesChanged.length > 0 && (
        <div className="border border-[var(--border-subtle)] rounded-lg overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-[var(--text-primary)]">Code Changes</div>
            <span className="text-[12px] text-[var(--text-tertiary)] bg-[var(--bg-hover)] px-2 py-0.5 rounded-full">
              {changeRecord.filesChanged.length} files
            </span>
          </div>
          <div className="border-t border-[var(--border-subtle)] px-4 py-2 space-y-1">
            {changeRecord.filesChanged.map((f, i) => (
              <div key={i} className="flex justify-between items-center text-[12px] font-mono">
                <span className="text-[var(--text-tertiary)] truncate">{f.path}</span>
                <span className="shrink-0 ml-3">
                  {f.additions > 0 && <span className="text-green-500">+{f.additions}</span>}
                  {f.deletions > 0 && <span className="text-red-500 ml-1.5">-{f.deletions}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
