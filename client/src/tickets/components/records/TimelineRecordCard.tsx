'use client';

import type { AECResponse } from '@/services/ticket.service';

interface TimelineRecordCardProps {
  ticket: AECResponse;
  isSelected: boolean;
  onClick: () => void;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function TimelineRecordCard({ ticket, isSelected, onClick }: TimelineRecordCardProps) {
  const cr = ticket.changeRecord!;

  const totalAdditions = cr.filesChanged.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = cr.filesChanged.reduce((sum, f) => sum + f.deletions, 0);

  return (
    <button
      onClick={onClick}
      className={`w-[170px] text-left p-3 rounded-lg border transition-colors ${
        isSelected
          ? 'border-purple-500/40 bg-purple-500/5'
          : 'border-[var(--border-subtle)] bg-[var(--bg-hover)] hover:border-purple-500/20 hover:bg-purple-500/[0.03]'
      }`}
    >
      <div className="text-[13px] font-medium text-[var(--text-primary)] leading-tight mb-1.5 line-clamp-2">
        {ticket.title}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {cr.hasDivergence && (
          <span className="text-[10px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded">
            ⚡ Divergence
          </span>
        )}
        <span className="text-[10px] bg-[var(--bg-hover)] text-[var(--text-tertiary)] px-1.5 py-0.5 rounded">
          {cr.filesChanged.length} files
          {(totalAdditions > 0 || totalDeletions > 0) && (
            <> · +{totalAdditions} −{totalDeletions}</>
          )}
        </span>
      </div>
      <div className="text-[11px] text-[var(--text-tertiary)] mt-1.5">
        {formatTimeAgo(cr.submittedAt)}
      </div>
    </button>
  );
}
