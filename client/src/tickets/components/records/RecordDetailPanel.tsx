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
    <div className="border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-primary)] overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-5 py-4 border-b border-[var(--border-subtle)]">
        <button
          onClick={() => router.push(`/tickets/${ticket.slug || ticket.id}`)}
          className="text-[15px] font-semibold text-[var(--text-primary)] hover:text-purple-400 transition-colors inline-flex items-center gap-1.5"
        >
          {ticket.title}
          <ExternalLink className="w-3.5 h-3.5 opacity-40 shrink-0" />
        </button>
        <div className="text-[12px] text-[var(--text-tertiary)] mt-1">
          Delivered {new Date(cr.submittedAt).toLocaleDateString()}
        </div>
      </div>

      {/* Body: main + sidebar */}
      <div className="px-4 sm:px-5 py-4 flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5 font-semibold">
              Execution Summary
            </div>
            <div className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
              {cr.executionSummary}
            </div>
          </div>

          {cr.divergences.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">
                Divergences ({cr.divergences.length})
              </div>
              {cr.divergences.map((d, i) => (
                <DivergenceCard key={i} divergence={d} />
              ))}
            </div>
          )}

          {cr.filesChanged.length > 0 && (
            <div className="border-t border-[var(--border-subtle)] pt-4">
              <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] mb-2 font-semibold">
                Code Changes
                <span className="font-normal ml-2">{cr.filesChanged.length} files</span>
              </div>
              <div className="space-y-0.5">
                {cr.filesChanged.map((f, i) => (
                  <div key={i} className="flex justify-between items-center text-[12px] font-mono py-0.5">
                    <span className="text-[var(--text-tertiary)] truncate">{f.path}</span>
                    <span className="shrink-0 ml-3">
                      {f.additions > 0 && <span className="text-green-500">+{f.additions}</span>}
                      {f.deletions > 0 && <span className="text-red-500 ml-1.5">−{f.deletions}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: events */}
        {(cr.decisions.length > 0 || cr.risks.length > 0 || cr.scopeChanges.length > 0) && (
          <div className="w-full lg:w-[260px] shrink-0 border-t lg:border-t-0 lg:border-l border-[var(--border-subtle)] pt-4 lg:pt-0 lg:pl-6">
            <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] mb-3 font-semibold">
              Execution Events
            </div>
            <div className="space-y-2.5">
              {cr.decisions.map((e) => (
                <div key={e.id} className="flex gap-2 text-[12px]">
                  <span className="text-purple-400 shrink-0">💡</span>
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">{e.title}</div>
                    <div className="text-[var(--text-tertiary)] mt-0.5">{e.description}</div>
                  </div>
                </div>
              ))}
              {cr.risks.map((e) => (
                <div key={e.id} className="flex gap-2 text-[12px]">
                  <span className="text-amber-500 shrink-0">⚠️</span>
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">{e.title}</div>
                    <div className="text-[var(--text-tertiary)] mt-0.5">{e.description}</div>
                  </div>
                </div>
              ))}
              {cr.scopeChanges.map((e) => (
                <div key={e.id} className="flex gap-2 text-[12px]">
                  <span className="text-blue-400 shrink-0">📐</span>
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">{e.title}</div>
                    <div className="text-[var(--text-tertiary)] mt-0.5">{e.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
