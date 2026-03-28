'use client';

import { useRouter } from 'next/navigation';
import type { AECResponse } from '@/services/ticket.service';
import { DivergenceCard } from '../detail/DivergenceCard';
import { ExternalLink } from 'lucide-react';

interface RecordDetailPanelProps {
  ticket: AECResponse;
}

export function RecordDetailPanel({ ticket }: RecordDetailPanelProps) {
  const router = useRouter();
  const cr = ticket.changeRecord!;

  return (
    <div className="border border-[var(--border-subtle)] rounded-lg overflow-hidden bg-[var(--bg-subtle)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
        <button
          onClick={() => router.push(`/tickets/${ticket.slug || ticket.id}`)}
          className="text-[13px] font-medium text-[var(--text-primary)] hover:text-purple-400 transition-colors inline-flex items-center gap-1.5"
        >
          {ticket.title}
          <ExternalLink className="w-3 h-3 opacity-40 shrink-0" />
        </button>
        <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
          Delivered {new Date(cr.submittedAt).toLocaleDateString()}
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Summary */}
        <div>
          <div className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-1">Summary</div>
          <div className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{cr.executionSummary}</div>
        </div>

        {/* Divergences */}
        {cr.divergences.length > 0 && (
          <div className="space-y-2">
            <div className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium">
              Divergences ({cr.divergences.length})
            </div>
            {cr.divergences.map((d, i) => (
              <DivergenceCard key={i} divergence={d} />
            ))}
          </div>
        )}

        {/* Execution Events */}
        {(cr.decisions.length > 0 || cr.risks.length > 0 || cr.scopeChanges.length > 0) && (
          <div>
            <div className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-1.5">Events</div>
            <div className="space-y-1.5">
              {cr.decisions.map((e) => (
                <div key={e.id} className="flex gap-1.5 text-[10px]">
                  <span className="shrink-0">💡</span>
                  <span><span className="text-[var(--text-primary)]">{e.title}</span> <span className="text-[var(--text-tertiary)]">— {e.description}</span></span>
                </div>
              ))}
              {cr.risks.map((e) => (
                <div key={e.id} className="flex gap-1.5 text-[10px]">
                  <span className="shrink-0">⚠️</span>
                  <span><span className="text-[var(--text-primary)]">{e.title}</span> <span className="text-[var(--text-tertiary)]">— {e.description}</span></span>
                </div>
              ))}
              {cr.scopeChanges.map((e) => (
                <div key={e.id} className="flex gap-1.5 text-[10px]">
                  <span className="shrink-0">📐</span>
                  <span><span className="text-[var(--text-primary)]">{e.title}</span> <span className="text-[var(--text-tertiary)]">— {e.description}</span></span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Code Changes */}
        {cr.filesChanged.length > 0 && (
          <div className="border-t border-[var(--border-subtle)] pt-3">
            <div className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-1.5">
              Files <span className="font-normal">{cr.filesChanged.length}</span>
            </div>
            <div className="space-y-0.5 font-mono text-[9px]">
              {cr.filesChanged.map((f, i) => (
                <div key={i} className="flex justify-between text-[var(--text-tertiary)]">
                  <span className="truncate">{f.path}</span>
                  <span className="shrink-0 ml-2">
                    {f.additions > 0 && <span className="text-green-500">+{f.additions}</span>}
                    {f.deletions > 0 && <span className="text-red-500 ml-1">-{f.deletions}</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
