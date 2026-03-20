'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, ChevronRight, ChevronLeft, Loader2, Check, X } from 'lucide-react';
import { useJobsStore } from '@/stores/jobs.store';
import { JobCard } from './JobCard';
import { toast } from 'sonner';
import type { GenerationJobClient } from '@/stores/jobs.store';

/**
 * Right-side jobs panel on the tickets page.
 * Always visible as a collapsed strip by default.
 * Expands to show full job cards. Auto-expands when a job starts.
 * Hidden on mobile (below md breakpoint).
 */
export function JobsPanel() {
  const { jobs, cancelJob, retryJob } = useJobsStore();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(true);
  const prevActiveCount = useRef(0);

  // Filter out cancelled jobs after 5 seconds
  const visibleJobs = useMemo(() => {
    const now = Date.now();
    return jobs.filter((job) => {
      if (job.status !== 'cancelled') return true;
      return now - job.updatedAt.getTime() < 5000;
    });
  }, [jobs]);

  const activeCount = useMemo(
    () => visibleJobs.filter((j) => j.status === 'running' || j.status === 'retrying').length,
    [visibleJobs],
  );

  // Auto-expand when a NEW job starts (activeCount increases)
  useEffect(() => {
    if (activeCount > prevActiveCount.current) {
      setCollapsed(false);
    }
    prevActiveCount.current = activeCount;
  }, [activeCount]);

  const handleCancel = async (jobId: string) => {
    try {
      await cancelJob(jobId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to cancel job';
      toast.error(message);
    }
  };

  const handleRetry = async (jobId: string) => {
    try {
      await retryJob(jobId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to retry job';
      toast.error(message);
    }
  };

  const handleView = (ticketId: string) => {
    router.push(`/tickets/${ticketId}`);
  };

  // Collapsed: narrow strip with icon + mini indicators
  if (collapsed) {
    return (
      <div className="hidden md:flex w-10 shrink-0 border-l border-[var(--border-subtle)] flex-col items-center py-3 gap-2">
        {/* Expand button */}
        <button
          onClick={() => setCollapsed(false)}
          className="p-1 rounded hover:bg-[var(--bg-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          title={visibleJobs.length > 0 ? `Expand jobs panel (${visibleJobs.length})` : 'Expand jobs panel'}
        >
          <ChevronLeft className="h-3 w-3" />
        </button>

        {/* Zap icon with job count badge */}
        <div className="relative">
          <Zap className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
          {visibleJobs.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] rounded-full bg-blue-500 text-white text-[8px] font-bold flex items-center justify-center px-0.5">
              {visibleJobs.length}
            </span>
          )}
        </div>

        {/* Mini job indicators */}
        {visibleJobs.map((job) => (
          <MiniJobIndicator key={job.id} job={job} />
        ))}
      </div>
    );
  }

  // Expanded: full panel
  return (
    <div className="hidden md:flex w-60 shrink-0 border-l border-[var(--border-subtle)] flex-col overflow-y-auto">
      {/* Header with collapse button */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1.5">
          <Zap className="h-3 w-3" />
          Jobs {visibleJobs.length > 0 && `(${visibleJobs.length})`}
        </h3>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1 rounded hover:bg-[var(--bg-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          title="Collapse jobs panel"
        >
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* Job cards or empty state */}
      <div className="px-3 pb-3 flex flex-col gap-2">
        {visibleJobs.length === 0 ? (
          <p className="text-[10px] text-[var(--text-tertiary)] py-4 text-center">
            No active jobs
          </p>
        ) : (
          visibleJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onCancel={handleCancel}
              onRetry={handleRetry}
              onView={handleView}
            />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Minimal job indicator for collapsed panel.
 * Shows a small status dot with a tiny progress ring for active jobs.
 */
function MiniJobIndicator({ job }: { job: GenerationJobClient }) {
  const isActive = job.status === 'running' || job.status === 'retrying';

  return (
    <div
      className="relative flex items-center justify-center w-6 h-6 rounded-full cursor-default"
      title={`${job.ticketTitle} — ${job.status}${isActive ? ` (${job.percent}%)` : ''}`}
    >
      {isActive && (
        <>
          <svg className="absolute w-6 h-6 -rotate-90" viewBox="0 0 24 24">
            <circle
              cx="12" cy="12" r="10"
              fill="none"
              stroke="var(--border-subtle)"
              strokeWidth="2"
            />
            <circle
              cx="12" cy="12" r="10"
              fill="none"
              stroke="rgb(59, 130, 246)"
              strokeWidth="2"
              strokeDasharray={`${(job.percent / 100) * 62.83} 62.83`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <Loader2 className="h-2.5 w-2.5 text-blue-400 animate-spin relative z-10" />
        </>
      )}
      {job.status === 'completed' && (
        <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
          <Check className="h-2.5 w-2.5 text-green-400" />
        </div>
      )}
      {job.status === 'failed' && (
        <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center">
          <X className="h-2.5 w-2.5 text-red-400" />
        </div>
      )}
      {job.status === 'cancelled' && (
        <div className="w-4 h-4 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)]" />
      )}
    </div>
  );
}
