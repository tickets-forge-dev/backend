'use client';

import { ProgressDots } from '../atoms/ProgressDots';
import { ElapsedTimer } from '../atoms/ElapsedTimer';
import type { SessionStatus } from '../../types/session.types';

interface SessionStatusHeaderProps {
  status: SessionStatus;
  elapsedSeconds: number;
  onCancel?: () => void;
}

export function SessionStatusHeader({ status, elapsedSeconds, onCancel }: SessionStatusHeaderProps) {
  return (
    <div className="flex items-center justify-between py-2.5 px-1 mb-2">
      <div className="flex items-center gap-2.5">
        {status === 'running' ? (
          <>
            <ProgressDots color="emerald" />
            <span className="text-[12px] text-[var(--text-secondary)] font-medium">Working...</span>
          </>
        ) : status === 'completed' ? (
          <>
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/15">
              <span className="text-emerald-500 text-[10px]">&#10003;</span>
            </span>
            <span className="text-[12px] text-emerald-500 font-medium">Complete</span>
          </>
        ) : status === 'cancelled' ? (
          <span className="text-[12px] text-[var(--text-tertiary)]">Cancelled</span>
        ) : (
          <span className="text-[12px] text-[var(--text-tertiary)]">{status}</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <ElapsedTimer seconds={elapsedSeconds} />
        {status === 'running' && onCancel && (
          <button
            onClick={onCancel}
            className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            Stop
          </button>
        )}
      </div>
    </div>
  );
}
