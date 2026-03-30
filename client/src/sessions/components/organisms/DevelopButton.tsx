'use client';

import { useEffect } from 'react';
import { Play, AlertTriangle } from 'lucide-react';
import { useSessionStore } from '../../stores/session.store';
import { IconBadge } from '../atoms/IconBadge';
import { QuotaDisplay } from '../molecules/QuotaDisplay';

const FILE_CHANGE_COMPLEXITY_THRESHOLD = 12;

interface DevelopButtonProps {
  ticketId: string;
  ticketStatus: string;
  onStart: () => void;
  /** Number of file changes from the ticket's tech spec — used for complexity gating */
  fileChangeCount?: number;
}

export function DevelopButton({ ticketId, ticketStatus, onStart, fileChangeCount }: DevelopButtonProps) {
  const { status, quota, fetchQuota } = useSessionStore();
  const isLoading = status === 'provisioning' || status === 'running';
  const isDisabled = ticketStatus !== 'approved' || isLoading;
  const isHighComplexity = typeof fileChangeCount === 'number' && fileChangeCount > FILE_CHANGE_COMPLEXITY_THRESHOLD;

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  return (
    <div className="flex flex-col items-center gap-4 py-16">
      <IconBadge icon={Play} color="emerald" size="lg" />

      <div className="text-center">
        <h3 className="text-[15px] font-medium text-[var(--text-primary)] mb-1">
          Ready to develop
        </h3>
        <p className="text-[13px] text-[var(--text-secondary)] max-w-sm leading-relaxed">
          Claude will implement this ticket, run tests, and create a pull request for your team to review.
        </p>
      </div>

      {isHighComplexity && (
        <div className="flex items-start gap-2 text-[11px] text-amber-500 bg-amber-500/5 rounded-md px-3 py-2 border border-amber-500/10 max-w-sm">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>
            This ticket touches {fileChangeCount} files. Consider assigning a developer for complex work — large changes risk timeouts or partial completions.
          </span>
        </div>
      )}

      <button
        onClick={onStart}
        disabled={isDisabled}
        className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[14px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Play className="w-4 h-4" fill="currentColor" />
        Start Development
      </button>

      <QuotaDisplay quota={quota} />
    </div>
  );
}
