'use client';

import { useEffect, useState, useMemo } from 'react';
import { Input } from '@/core/components/ui/input';
import { Button } from '@/core/components/ui/button';
import Link from 'next/link';
import { useTicketsStore } from '@/stores/tickets.store';
import { TicketSkeletonRow } from '@/tickets/components/TicketSkeletonRow';
import { useTicketGrouping } from '@/tickets/hooks/useTicketGrouping';
import { TicketGroupHeader } from '@/tickets/components/TicketGroupHeader';
import { CreationMenu } from '@/tickets/components/CreationMenu';
import { useTeamStore } from '@/teams/stores/team.store';
import { Loader2, SlidersHorizontal, Lightbulb, Bug, ClipboardList, Ban, X, ChevronDown, Search, FileText, Plus, MoreVertical, ExternalLink, Archive, Trash2, UserPlus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type SortBy = 'updated' | 'created' | 'priority' | 'progress';
type SortDirection = 'desc' | 'asc';

// Helper function to get type icon
function getTypeIcon(type: string | null) {
  switch (type) {
    case 'bug':
      return <Bug className="h-3.5 w-3.5 text-red-500" />;
    case 'task':
      return <ClipboardList className="h-3.5 w-3.5 text-blue-500" />;
    case 'feature':
    default:
      return <Lightbulb className="h-3.5 w-3.5 text-amber-500" />;
  }
}

export default function TicketsListPage() {
  const { tickets, isLoading, isInitialLoad, loadError, loadTickets, quota, fetchQuota, listPreferences, setListPreferences } = useTicketsStore();
  const { currentTeam } = useTeamStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>(listPreferences?.priorityFilter || 'all');
  const [typeFilter, setTypeFilter] = useState<string>(listPreferences?.typeFilter || 'all');
  const [showFilter, setShowFilter] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>((listPreferences?.sortBy as any) || 'updated');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reload tickets when workspace changes
  useEffect(() => {
    loadTickets();
    fetchQuota();
  }, [loadTickets, fetchQuota, currentTeam?.id]);

  const allTickets = tickets;

  // Helper to determine ticket status
  const getTicketStatus = (ticket: any): 'needs-input' | 'complete' | 'draft' | 'in-progress' | 'needs-resume' => {
    if (ticket.status === 'complete') return 'complete';

    // Detect partial/incomplete tickets (need resume)
    const isPartial =
      ticket.status === 'draft' &&
      ticket.techSpec &&
      (ticket.techSpec.qualityScore === 0 || ticket.techSpec.qualityScore === undefined);
    if (isPartial) return 'needs-resume';

    if (ticket.status === 'draft' && !ticket.techSpec && ticket.currentRound !== undefined) {
      return 'in-progress';
    }
    if (ticket.status === 'draft' && !ticket.techSpec) return 'draft';
    if (ticket.questions && ticket.questions.length > 0) return 'needs-input';
    return 'draft';
  };

  // Filter and sort tickets
  const filteredTickets = useMemo(() => {
    const lowercaseSearch = debouncedSearch.toLowerCase();

    return allTickets
      .filter((ticket) => {
        const matchesSearch =
          debouncedSearch === '' ||
          ticket.title.toLowerCase().includes(lowercaseSearch) ||
          ticket.description?.toLowerCase().includes(lowercaseSearch);

        const matchesPriority =
          priorityFilter === 'all' || ticket.priority === priorityFilter;

        const matchesType =
          typeFilter === 'all' || ticket.type === typeFilter;

        return matchesSearch && matchesPriority && matchesType;
      })
      .sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
          case 'updated':
            comparison = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            break;
          case 'created':
            comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            break;
          case 'priority': {
            const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
            const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
            const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
            comparison = bPriority - aPriority;
            break;
          }
          case 'progress': {
            const aProgress = a.techSpec?.qualityScore ?? a.readinessScore ?? 0;
            const bProgress = b.techSpec?.qualityScore ?? b.readinessScore ?? 0;
            comparison = bProgress - aProgress;
            break;
          }
        }

        return sortDirection === 'desc' ? comparison : -comparison;
      });
  }, [allTickets, debouncedSearch, priorityFilter, typeFilter, sortBy, sortDirection]);

  // Use grouping hook with saved preferences
  const { groups, collapsedGroups, toggleGroup } = useTicketGrouping(
    filteredTickets,
    listPreferences?.collapsedGroups
  );

  // Save preferences when they change
  useEffect(() => {
    setListPreferences({
      sortBy,
      priorityFilter,
      typeFilter,
      collapsedGroups: Array.from(collapsedGroups),
    });
  }, [sortBy, priorityFilter, typeFilter, collapsedGroups, setListPreferences]);

  const sortLabel = {
      updated: 'Recently updated',
      created: 'Recently created',
      priority: 'Priority',
      progress: 'Progress',
    }[sortBy];

    return (
      <div className="space-y-4 sm:space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-end gap-2 px-2 sm:px-0">
        {quota && !quota.canCreate ? (
          <div className="relative group">
            <CreationMenu disabled={true} />
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-50 whitespace-nowrap rounded-md bg-[var(--bg-subtle)] border border-[var(--border)]/40 px-3 py-1.5 text-[10px] sm:text-[11px] text-[var(--text-secondary)] shadow-lg">
              Ticket limit reached ({quota.used}/{quota.limit})
            </div>
          </div>
        ) : (
          <CreationMenu disabled={false} />
        )}
      </div>

      {/* Filter & Sort bar - Responsive */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <Input
            placeholder="Search tickets..."
            className="pl-9 pr-8 text-xs sm:text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-[var(--bg-hover)] rounded transition-colors"
            >
              <X className="h-4 w-4 text-[var(--text-tertiary)]" />
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="relative flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="hidden sm:flex text-xs sm:text-sm text-[var(--text-secondary)] hover:text-[var(--text)]"
          >
            <span>{sortLabel}</span>
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="sm:hidden text-[var(--text-tertiary)]"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          {showSortMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
              <div className="absolute left-0 sm:right-0 right-0 top-full mt-1 z-50 min-w-[180px] rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)]/40 p-1.5 shadow-lg">
                {[
                  { value: 'updated' as SortBy, label: 'Recently updated' },
                  { value: 'created' as SortBy, label: 'Recently created' },
                  { value: 'priority' as SortBy, label: 'Priority' },
                  { value: 'progress' as SortBy, label: 'Progress' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSortBy(opt.value);
                      setShowSortMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-xs sm:text-[var(--text-sm)] transition-colors ${sortBy === opt.value ? 'bg-[var(--bg-hover)] text-[var(--text)] font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* More filters button */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFilter((v) => !v)}
            className={`${priorityFilter !== 'all' || typeFilter !== 'all' ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)]'}`}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          {showFilter && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowFilter(false)} />
              <div className="absolute left-0 sm:right-0 right-0 top-full mt-1 z-50 w-screen sm:w-auto sm:min-w-[160px] rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)]/40 p-1.5 shadow-lg space-y-2">
                {/* Priority */}
                <div>
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

      {/* Loading state: Show skeletons when loading (including team switches) */}
      {isLoading && (
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
      {!isLoading && !loadError && filteredTickets.length === 0 && (
        <div className="flex min-h-[300px] sm:min-h-[400px] items-center justify-center mx-2 sm:mx-0">
          <div className="text-center px-4">
            {searchQuery || priorityFilter !== 'all' || typeFilter !== 'all' ? (
              <>
                <Search className="h-12 w-12 text-[var(--text-tertiary)] mx-auto mb-4" />
                <p className="text-sm text-[var(--text-secondary)]">No tickets found</p>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                  Try adjusting your filters
                </p>
              </>
            ) : (
              <>
                <FileText className="h-12 w-12 text-[var(--text-tertiary)] mx-auto mb-4" />
                <p className="text-base font-medium text-[var(--text)]">No tickets yet</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)] max-w-xs mx-auto">
                  Create your first executable ticket and let AI generate the technical spec
                </p>
                <Link href="/tickets/create">
                  <Button className="mt-4" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Ticket
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {!isLoading && !loadError && filteredTickets.length > 0 && (
        <div>
          {groups.length > 1 ? (
            // Grouped view
            <div className="space-y-0">
              {groups.map((group) => {
                const isCollapsed = collapsedGroups.has(group.key);
                return (
                  <div key={group.key}>
                    <TicketGroupHeader
                      label={group.label}
                      count={group.tickets.length}
                      isCollapsed={isCollapsed}
                      onToggle={() => toggleGroup(group.key)}
                    />
                    {!isCollapsed && (
                      <div className="space-y-1">
                        {group.tickets.map((ticket) => (
                          <TicketRow key={ticket.id} ticket={ticket} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            // Flat view (if only one group or no groups)
            <div className="space-y-1">
              {filteredTickets.map((ticket) => (
                <TicketRow key={ticket.id} ticket={ticket} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Extract ticket row to a separate component for reusability
function TicketRow({ ticket }: { ticket: any }) {
  const router = useRouter();
  const { deleteTicket, assignTicket } = useTicketsStore();

  // Helper to determine ticket status
  const getTicketStatus = (ticket: any): 'needs-input' | 'complete' | 'draft' | 'in-progress' | 'needs-resume' => {
    if (ticket.status === 'complete') return 'complete';

    // Detect partial/incomplete tickets (need resume)
    const isPartial =
      ticket.status === 'draft' &&
      ticket.techSpec &&
      (ticket.techSpec.qualityScore === 0 || ticket.techSpec.qualityScore === undefined);
    if (isPartial) return 'needs-resume';

    if (ticket.status === 'draft' && !ticket.techSpec && ticket.currentRound !== undefined) {
      return 'in-progress';
    }
    if (ticket.status === 'draft' && !ticket.techSpec) return 'draft';
    if (ticket.questions && ticket.questions.length > 0) return 'needs-input';
    return 'draft';
  };

  /** Detect tickets that are mid-wizard (draft with no finalized techSpec) */
  const isInProgress = (ticket: any) =>
    ticket.status === 'draft' && !ticket.techSpec && ticket.currentRound !== undefined;

  const getPriorityIndicator = (priority: string | null) => {
    if (!priority) return "";
    const config: Record<string, { color: string; label: string }> = {
      low: { color: 'bg-green-500', label: 'Low' },
      medium: { color: 'bg-yellow-500', label: 'Medium' },
      high: { color: 'bg-orange-500', label: 'High' },
      urgent: { color: 'bg-red-500', label: 'Urgent' },
    };
    const c = config[priority];
    if (!c) return "";
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-tertiary)]">
        <span className={`h-1.5 w-1.5 rounded-full ${c.color}`} />
        {c.label}
      </span>
    );
  };

  const getStatusBadge = (ticket: any) => {
    const ticketStatus = getTicketStatus(ticket);

    if (ticketStatus === 'needs-resume') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] text-red-500">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          Needs Resume
        </span>
      );
    }
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
      return "";
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

  const ticketStatus = getTicketStatus(ticket);
  const isNeedsInput = ticketStatus === 'needs-input';

  const handleOpen = () => {
    router.push(isInProgress(ticket) ? `/tickets/create?resume=${ticket.id}` : `/tickets/${ticket.id}`);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this ticket?')) {
      const success = await deleteTicket(ticket.id);
      if (success) {
        toast.success('Ticket deleted');
      } else {
        toast.error('Failed to delete ticket');
      }
    }
  };

  const handleArchive = () => {
    toast.info('Archive feature coming soon');
  };

  const handleAssign = () => {
    // Navigate to ticket detail page where assignment can be done
    router.push(`/tickets/${ticket.id}`);
  };

  return (
    <div className={`group rounded-lg px-3 sm:px-4 py-2.5 sm:py-3.5 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer flex items-center justify-between gap-2 sm:gap-4 mx-2 sm:mx-4 ${
      ticketStatus === 'needs-resume'
        ? 'bg-red-500/5'
        : ''
    }`}>
      <Link href={isInProgress(ticket) ? `/tickets/create?resume=${ticket.id}` : `/tickets/${ticket.id}`} className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          {/* Left: Title row */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
              <div className="flex-shrink-0">
                {getTypeIcon(ticket.type)}
              </div>
              <h3 className={`text-xs sm:text-[var(--text-sm)] truncate group-hover:text-[var(--text)] transition-colors flex-1 min-w-0 ${
                ticketStatus === 'needs-input' || ticketStatus === 'needs-resume' ? 'font-semibold text-[var(--text)]' : 'font-medium text-[var(--text-secondary)]'
              }`}>
                {ticket.title}
                {ticketStatus === 'needs-resume' && <span className="ml-1 sm:ml-2 text-red-500 font-normal">❌</span>}
              </h3>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 mt-1 ml-5 sm:ml-6">
              <span className="text-[10px] sm:text-[var(--text-xs)] text-[var(--text-tertiary)]">
                {getRelativeTime(ticket.updatedAt)}
              </span>
              <div className="hidden sm:contents">
                {getPriorityIndicator(ticket.priority)}
                {!ticket.questions || ticket.questions.length === 0 ? getStatusBadge(ticket) : null}
              </div>
            </div>
          </div>

          {/* Right: Assignee + Progress ring - Responsive */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:hidden">
              {getPriorityIndicator(ticket.priority)}
            </div>
            {/* Story 3.5-5: Show assignee avatar if assigned */}
            {ticket.assignedTo && (
              <div
                className="h-6 w-6 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[10px] font-medium text-[var(--primary)] flex-shrink-0"
                title={`Assigned to ${ticket.assignedTo}`}
              >
                {ticket.assignedTo.slice(0, 2).toUpperCase()}
              </div>
            )}
            <ProgressRing ticket={ticket} />
          </div>
        </div>
      </Link>

      {/* Actions menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-subtle)] transition-all focus:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4 text-[var(--text-tertiary)]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={handleOpen}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Open
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleAssign}>
            <UserPlus className="h-4 w-4 mr-2" />
            Assign
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleArchive}>
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="text-red-500 focus:text-red-500">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Extract progress ring to a separate component
function ProgressRing({ ticket }: { ticket: any }) {
  const readinessScore = ticket.techSpec?.qualityScore ?? ticket.readinessScore ?? 0;

  // Get progress color based on score
  const getProgressColor = () => {
    if (readinessScore === 0) return 'var(--text-tertiary)';
    if (readinessScore < 65) return '#3b82f6'; // blue
    if (readinessScore < 85) return '#f59e0b'; // amber
    return '#22c55e'; // green
  };

  const progressColor = getProgressColor();

  // Get progress tooltip
  const getProgressTooltip = () => {
    if (readinessScore === 0) return 'Not started';
    if (ticket.questions && ticket.questions.length > 0) {
      return "";
    }
    return `${readinessScore}% complete`;
  };

  return (
    <div className="flex-shrink-0 relative h-6 w-6 sm:h-8 sm:w-8 group/progress" title={getProgressTooltip()}>
      <svg className="h-6 w-6 sm:h-8 sm:w-8 -rotate-90" viewBox="0 0 32 32">
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
          stroke={progressColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={`${(readinessScore / 100) * 81.68} 81.68`}
          opacity={readinessScore > 0 ? 1 : 0.2}
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-[7px] sm:text-[9px] font-medium ${
        readinessScore === 0 ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-secondary)]'
      }`}>
        {readinessScore}
      </span>
      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 hidden group-hover/progress:block whitespace-nowrap rounded-md bg-[var(--bg-subtle)] border border-[var(--border)]/40 px-2 py-1 text-[10px] sm:text-[11px] text-[var(--text-secondary)] shadow-lg z-50">
        {getProgressTooltip()}
      </div>
    </div>
  );
}
