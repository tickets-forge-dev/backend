'use client';

import { useEffect } from 'react';
import { Zap } from 'lucide-react';
import { useSessionStore } from '../stores/session.store';

interface DevelopButtonProps {
  ticketId: string;
  ticketStatus: string;
  onStart: () => void;
}

export function DevelopButton({ ticketId, ticketStatus, onStart }: DevelopButtonProps) {
  const { status, quota, fetchQuota } = useSessionStore();
  const isLoading = status === 'provisioning' || status === 'running';
  const isDisabled = ticketStatus !== 'approved' || isLoading;

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  return (
    <div className="flex flex-col items-center gap-4 py-16">
      <div className="w-14 h-14 rounded-xl bg-violet-500/10 flex items-center justify-center">
        <Zap className="w-6 h-6 text-violet-500" />
      </div>

      <div className="text-center">
        <h3 className="text-[15px] font-medium text-[var(--text-primary)] mb-1">
          Ready to develop
        </h3>
        <p className="text-[13px] text-[var(--text-secondary)] max-w-sm leading-relaxed">
          Claude will implement this ticket, run tests, and create a pull request for your team to review.
        </p>
      </div>

      <button
        onClick={onStart}
        disabled={isDisabled}
        className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-[14px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Zap className="w-4 h-4" />
        Start Development
      </button>

      {quota && (
        <p className="text-[11px] text-[var(--text-tertiary)]">
          {quota.remaining} of {quota.limit} developments remaining &middot;{' '}
          <span className="text-violet-500">{quota.plan} plan</span>
        </p>
      )}
    </div>
  );
}
