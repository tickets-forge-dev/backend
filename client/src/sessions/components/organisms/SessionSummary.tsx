'use client';

import { useState } from 'react';
import { ExternalLink, GitPullRequest, GitBranch, Copy, Check, Play } from 'lucide-react';
import type { SessionSummary as SummaryType } from '../../types/session.types';
import { ElapsedTimer } from '../atoms/ElapsedTimer';

interface SessionSummaryProps {
  summary: SummaryType;
  onPreview?: (repoFullName: string, branch: string) => void;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-[var(--bg-active)] transition-colors shrink-0"
      title={`Copy ${label}`}
    >
      {copied ? (
        <Check className="w-3 h-3 text-emerald-500" />
      ) : (
        <Copy className="w-3 h-3 text-[var(--text-tertiary)]" />
      )}
    </button>
  );
}

export function SessionSummary({ summary, onPreview }: SessionSummaryProps) {
  const totalSeconds = Math.floor((summary.durationMs || 0) / 1000);
  const prLink = summary.prUrl
    || (summary.repoFullName && summary.prNumber
      ? `https://github.com/${summary.repoFullName}/pull/${summary.prNumber}`
      : null);

  return (
    <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-4 space-y-3">
      <div className="flex items-center gap-2 text-[13px] font-medium text-emerald-500">
        <span>&#10003;</span>
        <span>Development complete</span>
        <span>&middot;</span>
        <ElapsedTimer seconds={totalSeconds} />
      </div>

      {summary.filesChanged > 0 && (
        <div className="flex gap-5 text-[12px]">
          <div>
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Files</div>
            <div className="text-[var(--text-primary)] font-medium">{summary.filesChanged}</div>
          </div>
        </div>
      )}

      {/* PR Link */}
      {summary.prUrl && (
        <a
          href={summary.prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-md bg-[var(--bg-hover)] border border-[var(--border-subtle)] hover:bg-[var(--bg-active)] transition-colors"
        >
          <GitPullRequest className="w-4 h-4 text-violet-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] text-[var(--text-primary)] font-medium">
              Pull Request #{summary.prNumber}
            </div>
            <div className="text-[11px] text-[var(--text-tertiary)] truncate">
              {summary.prUrl}
            </div>
          </div>
          <CopyButton text={summary.prUrl} label="PR URL" />
          <ExternalLink className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0" />
        </a>
      )}

      {/* Branch */}
      {summary.branch && (
        <div
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-md bg-[var(--bg-hover)] border border-[var(--border-subtle)] ${
            prLink ? 'cursor-pointer hover:bg-[var(--bg-active)] transition-colors' : ''
          }`}
          onClick={() => {
            if (prLink) {
              window.open(prLink, '_blank');
            }
          }}
        >
          <GitBranch className="w-4 h-4 text-blue-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[12px] text-[var(--text-secondary)] font-mono truncate">
              {summary.branch}
            </div>
            {summary.repoFullName && (
              <div className="text-[11px] text-[var(--text-tertiary)] truncate">
                {prLink || `https://github.com/${summary.repoFullName}`}
              </div>
            )}
          </div>
          <CopyButton text={prLink || `https://github.com/${summary.repoFullName}`} label="PR URL" />
          {(prLink || summary.repoFullName) && (
            <a
              href={prLink || `https://github.com/${summary.repoFullName}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            </a>
          )}
        </div>
      )}

      {/* Run button — available when repo is known */}
      {onPreview && summary.repoFullName && (
        <button
          onClick={() => onPreview(summary.repoFullName!, 'main')}
          className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 transition-colors"
        >
          <Play className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" />
          <div className="flex-1 text-left">
            <div className="text-[13px] text-emerald-500 font-medium">Run</div>
            <div className="text-[11px] text-emerald-500/60">Launch the project in your browser</div>
          </div>
        </button>
      )}
    </div>
  );
}
