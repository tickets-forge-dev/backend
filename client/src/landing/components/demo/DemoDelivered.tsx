// DemoDelivered.tsx
'use client';

import { ArrowLeft, CheckCircle2, Play, GitPullRequest, GitBranch, FileCode2 } from 'lucide-react';
import { DEMO_CHANGE_RECORD, DEMO_SESSION_SUMMARY } from './demo-data';

interface Props {
  onBack: () => void;
  onViewPreview: () => void;
}

export function DemoDelivered({ onBack, onViewPreview }: Props) {
  const cr = DEMO_CHANGE_RECORD;
  const summary = DEMO_SESSION_SUMMARY;
  const totalAdded = cr.filesChanged.reduce((s, f) => s + f.additions, 0);
  const totalRemoved = cr.filesChanged.reduce((s, f) => s + f.deletions, 0);

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-4">
        {/* Top bar */}
        <div className="flex items-center justify-between pt-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </button>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400">
            Delivered
          </span>
        </div>

        {/* Title */}
        <h1 className="text-[15px] font-medium text-[var(--text-secondary)]">Rate limit API responses to 100 req/min</h1>

        {/* Tab indicator */}
        <div className="border-b border-[var(--border-subtle)]">
          <div className="flex">
            <button className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-[var(--text)] border-b-2 border-[var(--text)]">
              <GitPullRequest className="h-3.5 w-3.5" />
              Runs
            </button>
          </div>
        </div>

        {/* Change Record */}
        <div className="border border-[var(--border-subtle)] rounded-lg overflow-hidden">
          {/* Quick stats */}
          <div className="px-4 py-2.5 border-b border-[var(--border-subtle)] flex items-center gap-5 text-[10px] text-[var(--text-tertiary)]">
            <div className="flex items-center gap-1.5">
              <FileCode2 className="w-3 h-3" />
              <span className="text-[var(--text-secondary)] font-medium">{cr.filesChanged.length}</span>
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
              <div className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{cr.executionSummary}</div>
            </div>

            {/* Acceptance Criteria */}
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-1.5">
                Acceptance Criteria ({cr.acceptanceCriteria.length})
              </div>
              <div className="space-y-1">
                {cr.acceptanceCriteria.map((ac, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[12px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500/50 shrink-0 mt-px" />
                    <span className="text-[var(--text-secondary)]">{ac}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Decisions */}
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-1.5">Events</div>
              <div className="space-y-2">
                {cr.decisions.map((d, i) => (
                  <div key={i} className="flex gap-2 text-[12px]">
                    <span className="shrink-0">💡</span>
                    <div>
                      <span className="font-medium text-[var(--text)]">{d.title}</span>
                      <span className="text-[var(--text-tertiary)]"> — {d.description}</span>
                    </div>
                  </div>
                ))}
                {cr.risks.map((r, i) => (
                  <div key={i} className="flex gap-2 text-[12px]">
                    <span className="shrink-0">⚠️</span>
                    <div>
                      <span className="font-medium text-[var(--text)]">{r.title}</span>
                      <span className="text-[var(--text-tertiary)]"> — {r.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* File changes */}
            <div className="border-t border-[var(--border-subtle)] pt-3">
              <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-1.5">
                Files changed ({cr.filesChanged.length})
              </div>
              <div className="space-y-0.5 font-mono text-[11px]">
                {cr.filesChanged.map((f, i) => (
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

            {/* GitHub links + Preview */}
            <div className="border-t border-[var(--border-subtle)] pt-3 flex items-center gap-4 text-[11px] text-[var(--text-tertiary)]">
              <span className="inline-flex items-center gap-1.5 text-violet-400">
                <GitPullRequest className="w-3 h-3" />
                PR #{summary.prNumber}
              </span>
              <span className="inline-flex items-center gap-1.5 text-purple-400 font-mono">
                <GitBranch className="w-3 h-3" />
                {summary.branch}
              </span>
              <button
                onClick={onViewPreview}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors ml-auto text-[11px] font-medium"
              >
                <Play className="w-3 h-3" fill="currentColor" />
                View Preview
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
