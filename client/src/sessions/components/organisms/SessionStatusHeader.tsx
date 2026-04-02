'use client';

import { Terminal } from 'lucide-react';
import { ProgressDots } from '../atoms/ProgressDots';
import { ElapsedTimer } from '../atoms/ElapsedTimer';
import type { SessionStatus } from '../../types/session.types';

interface SessionStatusHeaderProps {
  status: SessionStatus;
  elapsedSeconds: number;
  onCancel?: () => void;
  verbose?: boolean;
  onToggleVerbose?: () => void;
}

export function SessionStatusHeader({ status, elapsedSeconds, onCancel, verbose, onToggleVerbose }: SessionStatusHeaderProps) {
  return (
    <div className="flex items-center justify-between py-2.5 px-1 mb-2 sticky top-0 z-10 bg-[var(--bg)]">
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
        {onToggleVerbose && (
          <button
            onClick={onToggleVerbose}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors ${
              verbose
                ? 'bg-[var(--bg-active)] text-[var(--text-secondary)]'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            }`}
            title={verbose ? 'Hide CLI logs' : 'Show CLI logs'}
          >
            <Terminal className="w-3 h-3" />
            {verbose ? 'Logs' : 'Logs'}
          </button>
        )}
        {status === 'running' && onCancel && (
          <button
            onClick={onCancel}
            className="text-[11px] px-2 py-0.5 rounded-md text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors"
          >
            Stop
          </button>
        )}
      </div>
    </div>
  );
}
