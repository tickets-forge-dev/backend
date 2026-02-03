'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/input';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import Link from 'next/link';
import { useTicketsStore } from '@/stores/tickets.store';
import { Loader2 } from 'lucide-react';

export default function TicketsListPage() {
  const { tickets, isLoading, loadError, loadTickets } = useTicketsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Filter and sort tickets - most recently updated first
  const filteredTickets = tickets
    .filter((ticket) => {
      const matchesSearch =
        searchQuery === '' ||
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'ready' && ticket.status === 'ready') ||
        (statusFilter === 'needs-input' && ticket.questions && ticket.questions.length > 0);

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Sort by updatedAt (most recent first)
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const getStatusBadge = (ticket: any) => {
    if (ticket.status === 'ready') {
      return (
        <Badge className="bg-[var(--green)]/10 text-[var(--green)] border-[var(--green)]/20 text-[10px] font-normal">
          Ready
        </Badge>
      );
    }
    if (ticket.questions && ticket.questions.length > 0) {
      return (
        <Badge className="bg-[var(--amber)]/10 text-[var(--amber)] border-[var(--amber)]/20 text-[10px] font-normal">
          Needs Input
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] font-normal border-[var(--border)]/30">
        Draft
      </Badge>
    );
  };

  const getTypeBadge = (type: string | null) => {
    if (!type) return null;

    // Subtle gray for all types - Linear-inspired minimalism
    return (
      <Badge variant="outline" className="bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border)]/20 text-[10px] font-normal">
        {type}
      </Badge>
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[var(--text-xl)] font-medium text-[var(--text)]">
            Tickets
          </h1>
          <p className="mt-1 text-[var(--text-sm)] text-[var(--text-secondary)]">
            Manage executable tickets
          </p>
        </div>
        <Link href="/tickets/create">
          <Button className="bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] rounded-lg px-4 py-2 font-medium transition-colors">
            New Ticket
          </Button>
        </Link>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search tickets..."
          className="max-w-md"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Badge
          variant={statusFilter === 'all' ? 'secondary' : 'outline'}
          className="cursor-pointer"
          onClick={() => setStatusFilter('all')}
        >
          All
        </Badge>
        <Badge
          variant={statusFilter === 'ready' ? 'secondary' : 'outline'}
          className="cursor-pointer"
          onClick={() => setStatusFilter('ready')}
        >
          Ready
        </Badge>
        <Badge
          variant={statusFilter === 'needs-input' ? 'secondary' : 'outline'}
          className="cursor-pointer"
          onClick={() => setStatusFilter('needs-input')}
        >
          Needs Input
        </Badge>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading tickets...</span>
          </div>
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
        <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)]">
          <div className="text-center">
            <p className="text-[var(--text-base)] text-[var(--text-secondary)]">
              {searchQuery || statusFilter !== 'all' ? 'No tickets found' : 'No tickets yet'}
            </p>
            <p className="mt-1 text-[var(--text-sm)] text-[var(--text-tertiary)]">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first executable ticket to get started'}
            </p>
          </div>
        </div>
      )}

      {!isLoading && !loadError && filteredTickets.length > 0 && (
        <div className="border-t border-[var(--border)]">
          {filteredTickets.map((ticket, index) => {
            const readinessScore = ticket.readinessScore || 0;
            const readinessBadgeClass =
              readinessScore >= 75
                ? 'bg-[var(--green)]/10 text-[var(--green)] border-[var(--green)]/20 text-[11px] font-medium'
                : readinessScore >= 50
                ? 'bg-[var(--amber)]/10 text-[var(--amber)] border-[var(--amber)]/20 text-[11px] font-medium'
                : 'bg-[var(--red)]/10 text-[var(--red)] border-[var(--red)]/20 text-[11px] font-medium';

            return (
              <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
                <div className="group px-4 py-3 border-b border-[var(--border)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer">
                  <div className="flex items-center justify-between gap-6">
                    {/* Left: Title + Badges */}
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      <h3 className="text-[var(--text-sm)] font-normal text-[var(--text)] truncate group-hover:text-[var(--text)] transition-colors">
                        {ticket.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getTypeBadge(ticket.type)}
                        {getStatusBadge(ticket)}
                      </div>
                    </div>

                    {/* Right: Readiness + Time */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
                        {getRelativeTime(ticket.updatedAt)}
                      </span>
                      <Badge variant="outline" className={readinessBadgeClass}>
                        {readinessScore}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
