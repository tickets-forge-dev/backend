'use client';

import { ExternalLink, GitPullRequest } from 'lucide-react';
import type { SessionSummary as SummaryType } from '../../types/session.types';
import { ElapsedTimer } from '../atoms/ElapsedTimer';

interface SessionSummaryProps {
  summary: SummaryType;
}

export function SessionSummary({ summary }: SessionSummaryProps) {
  const totalSeconds = Math.floor((summary.durationMs || 0) / 1000);

  return (
    <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-4 space-y-3">
      <div className="flex items-center gap-2 text-[13px] font-medium text-emerald-500">
        <span>&#10003;</span>
        <span>Development complete</span>
        <span>&middot;</span>
        <ElapsedTimer seconds={totalSeconds} />
      </div>

      <div className="flex gap-5 text-[12px]">
        <div>
          <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Files</div>
          <div className="text-[var(--text-primary)] font-medium">{summary.filesChanged}</div>
        </div>
      </div>

      {summary.prUrl && (
        <a
          href={summary.prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-md bg-[var(--bg-hover)] border border-[var(--border-subtle)] hover:bg-[var(--bg-active)] transition-colors"
        >
          <GitPullRequest className="w-4 h-4 text-violet-500" />
          <div className="flex-1">
            <div className="text-[13px] text-[var(--text-primary)] font-medium">
              Pull Request #{summary.prNumber}
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
        </a>
      )}
    </div>
  );
}
