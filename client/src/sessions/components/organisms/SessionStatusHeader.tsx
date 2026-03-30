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
    <div className="flex items-center justify-between py-2 mb-2">
      <div className="flex items-center gap-2">
        {status === 'running' ? (
          <>
            <ProgressDots color="violet" />
            <span className="text-[12px] text-violet-500 font-medium">Claude is working</span>
          </>
        ) : status === 'completed' ? (
          <>
            <span className="text-emerald-500 text-[13px]">&#10003;</span>
            <span className="text-[12px] text-emerald-500 font-medium">Development complete</span>
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
          <button onClick={onCancel} className="text-[11px] text-red-500 hover:text-red-400">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
