'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Check, X, Minus } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import type { GenerationJobClient } from '@/stores/jobs.store';

interface JobCardProps {
  job: GenerationJobClient;
  onCancel: (jobId: string) => void;
  onRetry: (jobId: string) => void;
  onView: (ticketId: string) => void;
  onDismiss?: (jobId: string) => void;
}

/**
 * Format elapsed time from a start date to now.
 */
function formatElapsed(from: Date): string {
  const seconds = Math.max(0, Math.floor((Date.now() - from.getTime()) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Compact card displaying a background generation job's status.
 */
export function JobCard({ job, onCancel, onRetry, onView, onDismiss }: JobCardProps) {
  const [elapsed, setElapsed] = useState(() => formatElapsed(job.createdAt));

  // Update elapsed time every second for active jobs
  useEffect(() => {
    if (job.status !== 'running' && job.status !== 'retrying') return;

    const interval = setInterval(() => {
      setElapsed(formatElapsed(job.createdAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [job.status, job.createdAt]);

  const isCancelled = job.status === 'cancelled';

  return (
    <div
      className={`animate-fade-in rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2.5 flex flex-col gap-1.5 transition-opacity ${
        isCancelled ? 'opacity-50' : ''
      }`}
    >
      {/* Title + status indicator */}
      <div className="flex items-start gap-1.5">
        <StatusIcon status={job.status} attempt={job.attempt} />
        <span className="text-xs text-[var(--text)] leading-tight line-clamp-2 flex-1 min-w-0">
          {job.ticketTitle || 'Untitled'}
        </span>
      </div>

      {/* Phase text */}
      {(job.status === 'running' || job.status === 'retrying') && job.phase && (
        <p className="text-[10px] text-[var(--text-tertiary)] truncate pl-5">
          {job.phase}
        </p>
      )}

      {/* Error text */}
      {job.status === 'failed' && job.error && (
        <p className="text-[10px] text-red-400 truncate pl-5">
          {job.error}
        </p>
      )}

      {/* Progress bar */}
      {(job.status === 'running' || job.status === 'retrying') && (
        <div className="w-full bg-[var(--border-subtle)] rounded-full h-1 overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${job.percent}%` }}
          />
        </div>
      )}

      {/* Footer: elapsed time + action button */}
      <div className="flex items-center justify-between pl-5">
        <span className="text-[10px] text-[var(--text-tertiary)]">
          {elapsed}
        </span>

        {(job.status === 'running' || job.status === 'retrying') && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1.5 text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text)]"
            onClick={() => onCancel(job.id)}
          >
            Cancel
          </Button>
        )}
        {job.status === 'failed' && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1.5 text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text)]"
            onClick={() => onRetry(job.id)}
          >
            Retry
          </Button>
        )}
        {job.status === 'completed' && job.type !== 'scan' && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1.5 text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text)]"
            onClick={() => onView(job.ticketId)}
          >
            View
          </Button>
        )}
        {(job.status === 'completed' || job.status === 'failed') && onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 text-[var(--text-tertiary)] hover:text-[var(--text)]"
            onClick={() => onDismiss(job.id)}
            title="Dismiss"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Status icon for a job card.
 */
function StatusIcon({ status, attempt }: { status: GenerationJobClient['status']; attempt: number }) {
  switch (status) {
    case 'running':
      return <Loader2 className="h-3 w-3 text-blue-400 animate-spin flex-shrink-0 mt-0.5" />;
    case 'retrying':
      return (
        <span className="flex items-center gap-0.5 flex-shrink-0 mt-0.5">
          <Loader2 className="h-3 w-3 text-amber-400 animate-spin" />
          <span className="text-[9px] text-amber-400">{attempt}/2</span>
        </span>
      );
    case 'completed':
      return <Check className="h-3 w-3 text-green-400 flex-shrink-0 mt-0.5" />;
    case 'failed':
      return <X className="h-3 w-3 text-red-400 flex-shrink-0 mt-0.5" />;
    case 'cancelled':
      return <Minus className="h-3 w-3 text-[var(--text-tertiary)] flex-shrink-0 mt-0.5" />;
    default:
      return null;
  }
}
