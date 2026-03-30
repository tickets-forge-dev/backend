'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, ChevronRight, ChevronLeft, ChevronDown, Loader2, Check, X, Trash2 } from 'lucide-react';
import { useJobsStore } from '@/stores/jobs.store';
import { JobCard } from './JobCard';
import { toast } from 'sonner';
import type { GenerationJobClient } from '@/stores/jobs.store';
import { useSessionStore } from '@/src/sessions/stores/session.store';

/**
 * Right-side jobs panel on the tickets page.
 * Desktop: Always visible as a collapsed strip (md+ breakpoint).
 * Mobile: Floating toggle button + slide-over overlay.
 * Groups jobs into Active and Completed sections.
 */
export function JobsPanel() {
  const { jobs, dismissedIds, cancelJob, retryJob, clearCompleted, dismissJob } = useJobsStore();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [completedCollapsed, setCompletedCollapsed] = useState(false);
  const prevActiveCount = useRef(0);

  const sessionStatus = useSessionStore(s => s.status);
  const sessionTicketId = useSessionStore(s => s.ticketId);
  const sessionElapsed = useSessionStore(s => s.elapsedSeconds);
  const isSessionActive = sessionStatus === 'provisioning' || sessionStatus === 'running';
  const prevSessionActive = useRef(false);

  // Filter out dismissed and recently-cancelled jobs
  const visibleJobs = useMemo(() => {
    const now = Date.now();
    return jobs.filter((job) => {
      if (dismissedIds.has(job.id)) return false;
      if (job.status === 'cancelled') return now - job.updatedAt.getTime() < 5000;
      return true;
    });
  }, [jobs, dismissedIds]);

  const activeJobs = useMemo(
    () => visibleJobs.filter((j) => j.status === 'running' || j.status === 'retrying'),
    [visibleJobs],
  );

  const completedJobs = useMemo(
    () => visibleJobs.filter((j) => j.status === 'completed' || j.status === 'failed' || j.status === 'cancelled'),
    [visibleJobs],
  );

  // Auto-expand when a NEW job starts (activeCount increases)
  useEffect(() => {
    if (activeJobs.length > prevActiveCount.current) {
      setCollapsed(false);
      setMobileOpen(true);
    }
    prevActiveCount.current = activeJobs.length;
  }, [activeJobs.length]);

  // Auto-expand when a Cloud Develop session starts
  useEffect(() => {
    if (isSessionActive && !prevSessionActive.current) {
      setCollapsed(false);
      setMobileOpen(true);
    }
    prevSessionActive.current = isSessionActive;
  }, [isSessionActive]);

  const { poll } = useJobsStore();

  const handleCancel = async (jobId: string) => {
    try {
      await cancelJob(jobId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to cancel job';
      // If job already completed/failed, just refresh — not a real error
      if (message.includes('not active')) {
        await poll();
      } else {
        toast.error(message);
      }
    }
  };

  const handleRetry = async (jobId: string) => {
    try {
      await retryJob(jobId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to retry job';
      // If job already completed, just refresh
      if (message.includes('not active')) {
        await poll();
      } else {
        toast.error(message);
      }
    }
  };

  const handleView = (ticketId: string) => {
    setMobileOpen(false);
    router.push(`/tickets/${ticketId}`);
  };

  const elapsedMin = Math.floor(sessionElapsed / 60);
  const elapsedSec = String(sessionElapsed % 60).padStart(2, '0');

  /** Shared panel content used in both desktop expanded and mobile overlay */
  const panelContent = (
    <div className="px-3 pb-3 flex flex-col gap-1.5">
      {/* Active Cloud Develop session card */}
      {isSessionActive && (
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2.5 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 text-emerald-500 animate-spin flex-shrink-0" />
            <span className="text-xs text-[var(--text-primary)] font-medium leading-tight flex-1 min-w-0 truncate">
              Cloud Develop
            </span>
          </div>
          <div className="flex items-center justify-between pl-4">
            <span className="text-[10px] text-[var(--text-tertiary)]">
              {sessionStatus === 'provisioning' ? 'Setting up sandbox...' : 'Claude is working'}
            </span>
            <span className="text-[10px] text-[var(--text-tertiary)] tabular-nums">
              {elapsedMin}:{elapsedSec}
            </span>
          </div>
          {sessionTicketId && (
            <button
              onClick={() => { setMobileOpen(false); router.push(`/tickets/${sessionTicketId}`); }}
              className="text-[10px] text-emerald-500 hover:text-emerald-400 transition-colors pl-4 text-left"
            >
              View ticket →
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {visibleJobs.length === 0 && !isSessionActive && (
        <p className="text-[10px] text-[var(--text-tertiary)] py-4 text-center">
          No active jobs
        </p>
      )}

      {/* Active jobs section */}
      {activeJobs.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider pt-1">
            Active ({activeJobs.length})
          </p>
          {activeJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onCancel={handleCancel}
              onRetry={handleRetry}
              onView={handleView}
              onDismiss={dismissJob}
            />
          ))}
        </div>
      )}

      {/* Divider between sections */}
      {activeJobs.length > 0 && completedJobs.length > 0 && (
        <div className="border-t border-[var(--border-subtle)] my-1" />
      )}

      {/* Completed jobs section — collapsible */}
      {completedJobs.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => setCompletedCollapsed(!completedCollapsed)}
              className="flex items-center gap-1 text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider hover:text-[var(--text-secondary)] transition-colors"
            >
              <ChevronDown className={`h-2.5 w-2.5 transition-transform ${completedCollapsed ? '-rotate-90' : ''}`} />
              Completed ({completedJobs.length})
            </button>
            <button
              onClick={clearCompleted}
              className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors flex items-center gap-0.5"
              title="Clear all completed jobs"
            >
              <Trash2 className="h-2.5 w-2.5" />
              Clear
            </button>
          </div>
          {!completedCollapsed && completedJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onCancel={handleCancel}
              onRetry={handleRetry}
              onView={handleView}
              onDismiss={dismissJob}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* ─── Mobile: floating toggle button ─── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 right-3 z-40 p-2 rounded-lg bg-[var(--bg)] border border-[var(--border-subtle)] shadow-lg hover:bg-[var(--bg-subtle)] transition-colors"
        title={visibleJobs.length > 0 ? `Jobs (${visibleJobs.length})` : 'Jobs'}
      >
        <div className="relative">
          {isSessionActive ? (
            <Loader2 className="h-4 w-4 text-emerald-500 animate-spin" />
          ) : (
            <Zap className="h-4 w-4 text-[var(--text-secondary)]" />
          )}
          {(visibleJobs.length > 0 || isSessionActive) && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] rounded-full bg-blue-500 text-white text-[8px] font-bold flex items-center justify-center px-0.5">
              {visibleJobs.length + (isSessionActive ? 1 : 0)}
            </span>
          )}
        </div>
      </button>

      {/* ─── Mobile: slide-over overlay ─── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          {/* Panel */}
          <div className="md:hidden fixed inset-y-0 right-0 z-50 w-72 bg-[var(--bg)] border-l border-[var(--border-subtle)] flex flex-col overflow-y-auto animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-3 pt-3 pb-1">
              <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="h-3 w-3" />
                Jobs {visibleJobs.length > 0 && `(${visibleJobs.length})`}
              </h3>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded hover:bg-[var(--bg-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {panelContent}
          </div>
        </>
      )}

      {/* ─── Desktop: collapsed strip ─── */}
      {collapsed ? (
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
            {(visibleJobs.length > 0 || isSessionActive) && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] rounded-full bg-blue-500 text-white text-[8px] font-bold flex items-center justify-center px-0.5">
                {visibleJobs.length + (isSessionActive ? 1 : 0)}
              </span>
            )}
          </div>

          {/* Cloud Develop session mini-indicator */}
          {isSessionActive && (
            <div
              className="relative flex items-center justify-center w-6 h-6 rounded-full cursor-default"
              title={`Cloud Develop — ${sessionStatus === 'provisioning' ? 'Setting up...' : 'Running'} (${elapsedMin}:${elapsedSec})`}
            >
              <Loader2 className="h-2.5 w-2.5 text-emerald-500 animate-spin" />
            </div>
          )}

          {/* Mini job indicators */}
          {visibleJobs.map((job) => (
            <MiniJobIndicator key={job.id} job={job} />
          ))}
        </div>
      ) : (
        /* ─── Desktop: expanded panel ─── */
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
          {panelContent}
        </div>
      )}
    </>
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
