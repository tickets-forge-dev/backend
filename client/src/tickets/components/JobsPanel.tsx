'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';
import { useJobsStore } from '@/stores/jobs.store';
import { JobCard } from './JobCard';
import { toast } from 'sonner';

/**
 * Right-side panel showing active and recent generation jobs.
 * Auto-hides when no jobs are visible.
 * Hidden on mobile (below md breakpoint).
 */
export function JobsPanel() {
  const { jobs, cancelJob, retryJob } = useJobsStore();
  const router = useRouter();

  // Filter out cancelled jobs after they have been visible for 5 seconds
  const visibleJobs = useMemo(() => {
    const now = Date.now();
    return jobs.filter((job) => {
      if (job.status !== 'cancelled') return true;
      // Keep cancelled jobs visible for 5 seconds after update
      return now - job.updatedAt.getTime() < 5000;
    });
  }, [jobs]);

  if (visibleJobs.length === 0) return null;

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

  return (
    <div className="hidden md:flex w-60 shrink-0 border-l border-[var(--border-subtle)] p-3 flex-col gap-3 overflow-y-auto">
      <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1.5">
        <Zap className="h-3 w-3" />
        Jobs ({visibleJobs.length})
      </h3>
      {visibleJobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          onCancel={handleCancel}
          onRetry={handleRetry}
          onView={handleView}
        />
      ))}
    </div>
  );
}
