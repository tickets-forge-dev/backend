// DemoDecisionLogDetail.tsx
'use client';

import { ArrowLeft, CheckCircle2, FileCode2, ExternalLink } from 'lucide-react';
import { DEMO_DECISION_LOGS } from './demo-data';

interface Props {
  recordIndex: number;
  onBack: () => void;
}

export function DemoDecisionLogDetail({ recordIndex, onBack }: Props) {
  const record = DEMO_DECISION_LOGS[recordIndex];
  if (!record) return null;

  const totalAdded = record.filesChanged.reduce((s, f) => s + f.additions, 0);
  const totalRemoved = record.filesChanged.reduce((s, f) => s + f.deletions, 0);

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="px-4 py-3 space-y-3">
        {/* Back */}
        <button onClick={onBack} className="flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Decision Logs</span>
        </button>

        {/* Header card */}
        <div className="border border-[var(--border-subtle)] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
            <div className="flex items-center gap-2 mb-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${record.status === 'accepted' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className={`text-[9px] uppercase tracking-wider font-medium ${record.status === 'accepted' ? 'text-emerald-500/60' : 'text-amber-500/60'}`}>
                {record.status === 'accepted' ? 'Accepted' : 'Changes Requested'}
              </span>
            </div>
            <div className="text-[13px] font-medium text-[var(--text)]">{record.ticketTitle}</div>
            <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5 flex items-center gap-2">
              <span>{record.submittedLabel}</span>
              <span className="opacity-30">·</span>
              <span>{record.developer}</span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="px-4 py-2 border-b border-[var(--border-subtle)] flex items-center gap-5 text-[10px] text-[var(--text-tertiary)]">
            <div className="flex items-center gap-1.5">
              <FileCode2 className="w-3 h-3" />
              <span className="text-[var(--text-secondary)] font-medium">{record.filesChanged.length}</span>
              <span>files</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-emerald-500/70">+{totalAdded}</span>
              {totalRemoved > 0 && <span className="font-medium text-red-500/70">-{totalRemoved}</span>}
            </div>
          </div>

          <div className="px-4 py-3 space-y-4">
            {/* Summary */}
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-1">Summary</div>
              <div className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{record.executionSummary}</div>
            </div>

            {/* Acceptance Criteria */}
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-1.5">
                Acceptance Criteria ({record.acceptanceCriteria.length})
              </div>
              <div className="space-y-1">
                {record.acceptanceCriteria.map((ac, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px]">
                    <CheckCircle2 className="w-3 h-3 text-green-500/50 shrink-0 mt-px" />
                    <span className="text-[var(--text-secondary)]">{ac}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Review note */}
            {record.reviewNote && (
              <div className="bg-red-500/5 border border-red-500/10 rounded-md px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-red-500/70 font-medium mb-0.5">Review Note</div>
                <div className="text-[11px] text-[var(--text-secondary)]">{record.reviewNote}</div>
              </div>
            )}

            {/* Divergences */}
            {record.divergences.length > 0 && (
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-1.5">
                  Divergences ({record.divergences.length})
                </div>
                <div className="space-y-2">
                  {record.divergences.map((d, i) => (
                    <div key={i} className="bg-amber-500/5 border border-amber-500/10 rounded-md px-3 py-2 text-[11px] space-y-1">
                      <div className="font-medium text-amber-400">{d.area}</div>
                      <div className="text-[var(--text-tertiary)]"><span className="text-[var(--text-secondary)]">Intended:</span> {d.intended}</div>
                      <div className="text-[var(--text-tertiary)]"><span className="text-[var(--text-secondary)]">Actual:</span> {d.actual}</div>
                      <div className="text-[var(--text-tertiary)]"><span className="text-[var(--text-secondary)]">Justification:</span> {d.justification}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Events */}
            {(record.decisions.length > 0 || record.risks.length > 0) && (
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-1.5">Events</div>
                <div className="space-y-1.5">
                  {record.decisions.map((d, i) => (
                    <div key={`d${i}`} className="flex gap-2 text-[11px]">
                      <span className="shrink-0">💡</span>
                      <div><span className="font-medium text-[var(--text)]">{d.title}</span> <span className="text-[var(--text-tertiary)]">— {d.description}</span></div>
                    </div>
                  ))}
                  {record.risks.map((r, i) => (
                    <div key={`r${i}`} className="flex gap-2 text-[11px]">
                      <span className="shrink-0">⚠️</span>
                      <div><span className="font-medium text-[var(--text)]">{r.title}</span> <span className="text-[var(--text-tertiary)]">— {r.description}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Files changed */}
            <div className="border-t border-[var(--border-subtle)] pt-3">
              <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-1.5">
                Files changed ({record.filesChanged.length})
              </div>
              <div className="space-y-0.5 font-mono text-[10px]">
                {record.filesChanged.map((f, i) => (
                  <div key={i} className="flex justify-between text-[var(--text-tertiary)]">
                    <span className="truncate">{f.path}</span>
                    <span className="shrink-0 ml-2">
                      <span className="text-emerald-500">+{f.additions}</span>
                      {f.deletions > 0 && <span className="text-red-500 ml-1">-{f.deletions}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
