'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/core/components/ui/input';
import { Button } from '@/core/components/ui/button';
import Link from 'next/link';
import { useTicketsStore } from '@/stores/tickets.store';
import { TicketSkeletonRow } from '@/tickets/components/TicketSkeletonRow';
import { useDemoTickets } from '@/tickets/hooks/useDemoTickets';
import { Loader2, SlidersHorizontal, Lightbulb, Bug, ClipboardList, Ban, X } from 'lucide-react';

export default function TicketsListPage() {
  const { tickets, isLoading, isInitialLoad, loadError, loadTickets, quota, fetchQuota } = useTicketsStore();
  const { activeDemoTickets, dismissDemoTicket } = useDemoTickets();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    loadTickets();
    fetchQuota();
  }, [loadTickets, fetchQuota]);

  // Combine real tickets and demo tickets for display
  const allTickets = [...activeDemoTickets, ...tickets];

  // Filter and sort tickets - most recently updated first
  const filteredTickets = allTickets
    .filter((ticket) => {
      const matchesSearch =
        searchQuery === '' ||
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'draft' && ticket.status === 'draft') ||
        (statusFilter === 'complete' && ticket.status === 'complete');

      const matchesPriority =
        priorityFilter === 'all' || ticket.priority === priorityFilter;

      const matchesType =
        typeFilter === 'all' || ticket.type === typeFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesType;
    })
    .sort((a, b) => {
      // Sort by updatedAt (most recent first)
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const getTypeIcon = (type: string | null) => {
    switch (type) {
      case 'bug':
        return <Bug className="h-3.5 w-3.5 text-red-500" />;
      case 'task':
        return <ClipboardList className="h-3.5 w-3.5 text-blue-500" />;
      case 'feature':
      default:
        return <Lightbulb className="h-3.5 w-3.5 text-amber-500" />;
    }
  };

  const getPriorityIndicator = (priority: string | null) => {
    if (!priority) return null;
    const config: Record<string, { color: string; label: string }> = {
      low: { color: 'bg-green-500', label: 'Low' },
      medium: { color: 'bg-yellow-500', label: 'Medium' },
      high: { color: 'bg-orange-500', label: 'High' },
      urgent: { color: 'bg-red-500', label: 'Urgent' },
    };
    const c = config[priority];
    if (!c) return null;
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-tertiary)]">
        <span className={`h-1.5 w-1.5 rounded-full ${c.color}`} />
        {c.label}
      </span>
    );
  };

  /** Detect tickets that are mid-wizard (draft with no finalized techSpec) */
  const isInProgress = (ticket: any) =>
    ticket.status === 'draft' && !ticket.techSpec && ticket.currentRound !== undefined;

  const getStatusBadge = (ticket: any) => {
    if (isInProgress(ticket)) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] text-blue-500">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          In Progress
        </span>
      );
    }
    if (ticket.status === 'complete') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] text-green-500">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          Complete
        </span>
      );
    }
    if (ticket.status === 'ready') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] text-green-500">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          Ready
        </span>
      );
    }
    if (ticket.questions && ticket.questions.length > 0) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--amber)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--amber)]" />
          Needs Input
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-tertiary)]/50" />
        Draft
      </span>
    );
  };

  // Format relative time (Linear-style)
  const getRelativeTime = (date: string | Date) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
  
      return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
  
    return (
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-end">
        {quota && !quota.canCreate ? (
          <div className="relative group">
            <Button disabled>New Ticket</Button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-50 whitespace-nowrap rounded-md bg-[var(--bg-subtle)] border border-[var(--border)]/40 px-3 py-1.5 text-[11px] text-[var(--text-secondary)] shadow-lg">
              Ticket limit reached ({quota.used}/{quota.limit})
            </div>
          </div>
        ) : (
          <Link href="/tickets/create">
            <Button>New Ticket</Button>
          </Link>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex items-center justify-center gap-2">
        <Input
          placeholder="Search tickets..."
          className="max-w-md"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFilter((v) => !v)}
            className={statusFilter !== 'all' || priorityFilter !== 'all' || typeFilter !== 'all' ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)]'}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          {showFilter && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowFilter(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)]/40 p-1.5 shadow-lg space-y-2">
                {/* Status */}
                <div>
                  <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider px-2 mb-0.5">Status</p>
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'draft', label: 'Draft' },
                    { value: 'complete', label: 'Complete' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setStatusFilter(opt.value); }}
                      className={`w-full text-left px-3 py-1.5 rounded-md text-[var(--text-sm)] transition-colors ${statusFilter === opt.value ? 'bg-[var(--bg-hover)] text-[var(--text)] font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {/* Priority */}
                <div className="border-t border-[var(--border)]/30 pt-2">
                  <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider px-2 mb-0.5">Priority</p>
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'urgent', label: 'Urgent', dot: 'bg-red-500' },
                    { value: 'high', label: 'High', dot: 'bg-orange-500' },
                    { value: 'medium', label: 'Medium', dot: 'bg-yellow-500' },
                    { value: 'low', label: 'Low', dot: 'bg-green-500' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setPriorityFilter(opt.value); }}
                      className={`w-full text-left px-3 py-1.5 rounded-md text-[var(--text-sm)] transition-colors flex items-center gap-2 ${priorityFilter === opt.value ? 'bg-[var(--bg-hover)] text-[var(--text)] font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
                    >
                      {opt.dot && <span className={`h-1.5 w-1.5 rounded-full ${opt.dot}`} />}
                      {opt.label}
                    </button>
                  ))}
                </div>
                {/* Type */}
                <div className="border-t border-[var(--border)]/30 pt-2">
                  <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider px-2 mb-0.5">Type</p>
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'feature', label: 'Feature' },
                    { value: 'bug', label: 'Bug' },
                    { value: 'task', label: 'Task' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setTypeFilter(opt.value); }}
                      className={`w-full text-left px-3 py-1.5 rounded-md text-[var(--text-sm)] transition-colors flex items-center gap-2 ${typeFilter === opt.value ? 'bg-[var(--bg-hover)] text-[var(--text)] font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
                    >
                      {opt.value !== 'all' && getTypeIcon(opt.value)}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Loading state: Show skeletons only on initial load */}
      {isInitialLoad && isLoading && (
        <div className="space-y-1.5">
          {[...Array(5)].map((_, i) => (
            <TicketSkeletonRow key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {loadError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm text-red-600">{loadError}</p>
        </div>
      )}

      {/* Tickets list */}
      {!isInitialLoad && !loadError && filteredTickets.length === 0 && (
        <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-[var(--border)]/40 bg-[var(--bg-subtle)]">
          <div className="text-center">
            <p className="text-[var(--text-base)] text-[var(--text-secondary)]">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || typeFilter !== 'all' ? 'No tickets found' : 'No tickets yet'}
            </p>
            <p className="mt-1 text-[var(--text-sm)] text-[var(--text-tertiary)]">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first executable ticket to get started'}
            </p>
          </div>
        </div>
      )}

      {!isInitialLoad && !loadError && filteredTickets.length > 0 && (
        <div className="space-y-1.5">
          {filteredTickets.map((ticket) => {
            const isDemoTicket = ticket.id.startsWith('demo-');
            const readinessScore = ticket.techSpec?.qualityScore ?? ticket.readinessScore ?? 0;
            const progressColor =
              readinessScore >= 75
                ? 'bg-green-500'
                : readinessScore >= 50
                ? 'bg-amber-500'
                : 'bg-[var(--text-tertiary)]/40';

            return (
              <div key={ticket.id} className="group rounded-lg px-4 py-3.5 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer flex items-center justify-between gap-4">
                <Link href={isInProgress(ticket) ? `/tickets/create?resume=${ticket.id}` : `/tickets/${ticket.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    {/* Left: Title row */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        {getTypeIcon(ticket.type)}
                        <h3 className="text-[var(--text-sm)] font-medium text-[var(--text-secondary)] truncate group-hover:text-[var(--text)] transition-colors">
                          {isDemoTicket && <span className="text-[var(--text-tertiary)]">Demo Ticket • </span>}
                          {ticket.title}
                        </h3>
                        {getPriorityIndicator(ticket.priority)}
                        {getStatusBadge(ticket)}
                      </div>
                      <div className="flex items-center gap-3 mt-1 ml-6">
                        <span className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
                          {getRelativeTime(ticket.updatedAt)}
                        </span>
                      </div>
                    </div>

                    {/* Right: Progress ring */}
                    <div className="flex-shrink-0 relative h-8 w-8">
                      <svg className="h-8 w-8 -rotate-90" viewBox="0 0 32 32">
                        <circle
                          cx="16" cy="16" r="13"
                          fill="none"
                          stroke="var(--border)"
                          strokeWidth="2.5"
                          opacity="0.3"
                        />
                        <circle
                          cx="16" cy="16" r="13"
                          fill="none"
                          className={readinessScore >= 75 ? 'stroke-green-500' : readinessScore >= 50 ? 'stroke-amber-500' : 'stroke-[var(--text-tertiary)]'}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeDasharray={`${(readinessScore / 100) * 81.68} 81.68`}
                          opacity={readinessScore > 0 ? 1 : 0.2}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-medium text-[var(--text-tertiary)]">
                        {readinessScore}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Delete button for demo tickets */}
                {isDemoTicket && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      dismissDemoTicket(ticket.id);
                    }}
                    className="flex-shrink-0 p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete demo ticket"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
