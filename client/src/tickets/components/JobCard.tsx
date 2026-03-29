'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Loader2, Check, X, Minus, AlertTriangle, RotateCw } from 'lucide-react';
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
  const [sinceUpdate, setSinceUpdate] = useState(0);

  // Update elapsed time every second for active jobs
  useEffect(() => {
    if (job.status !== 'running' && job.status !== 'retrying') return;

    const interval = setInterval(() => {
      setElapsed(formatElapsed(job.createdAt));
      setSinceUpdate(Math.floor((Date.now() - job.updatedAt.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [job.status, job.createdAt, job.updatedAt]);

  const isActive = job.status === 'running' || job.status === 'retrying';
  const isCancelled = job.status === 'cancelled';
  const [isRecovering, setIsRecovering] = useState(false);
  const autoRecoveredRef = useRef(false);

  // Job is "stale" if no backend update for 60s+ while supposedly active
  const isStale = isActive && sinceUpdate > 60;

  // Auto-recover after 120s of no activity (once per job)
  useEffect(() => {
    if (isActive && sinceUpdate > 120 && !autoRecoveredRef.current && !isRecovering) {
      autoRecoveredRef.current = true;
      setIsRecovering(true);
      onRetry(job.id);
      setTimeout(() => setIsRecovering(false), 3000);
    }
  }, [isActive, sinceUpdate, isRecovering, job.id, onRetry]);

  const handleRecover = () => {
    setIsRecovering(true);
    onRetry(job.id);
    setTimeout(() => setIsRecovering(false), 3000);
  };

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
      {isActive && job.phase && (
        <p className="text-[10px] text-[var(--text-tertiary)] truncate pl-5">
          {job.phase}
        </p>
      )}

      {/* Stale warning — no backend update for 60s+ */}
      {isStale && (
        <div className="flex items-center gap-1 pl-5">
          <AlertTriangle className="h-2.5 w-2.5 text-amber-500 flex-shrink-0" />
          <p className="text-[10px] text-amber-500">
            {isRecovering ? 'Recovering...' : `No update for ${sinceUpdate}s — may be stuck`}
          </p>
        </div>
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
            className="h-full animate-progress-shimmer transition-all duration-500 ease-out rounded-full"
            style={{ width: `${job.percent}%` }}
          />
        </div>
      )}

      {/* Footer: elapsed time + action button */}
      <div className="flex items-center justify-between pl-5">
        <span className={`text-[10px] ${isStale ? 'text-amber-500' : 'text-[var(--text-tertiary)]'}`}>
          {elapsed}
        </span>

        {isActive && (
          <div className="flex items-center gap-1">
            {isStale && !isRecovering && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-1.5 text-[10px] text-amber-500 hover:text-amber-400"
                onClick={handleRecover}
              >
                <RotateCw className="h-2.5 w-2.5 mr-0.5" />
                Recover
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1.5 text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text)]"
              onClick={() => onCancel(job.id)}
            >
              Cancel
            </Button>
          </div>
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
