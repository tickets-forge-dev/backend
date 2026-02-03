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

  // Filter tickets
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      searchQuery === '' ||
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'ready' && ticket.status === 'ready') ||
      (statusFilter === 'needs-input' && ticket.questions && ticket.questions.length > 0);

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (ticket: any) => {
    if (ticket.status === 'ready') {
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Ready</Badge>;
    }
    if (ticket.questions && ticket.questions.length > 0) {
      return <Badge variant="outline" className="border-amber-500/20 text-amber-600">Needs Input</Badge>;
    }
    return <Badge variant="outline">Draft</Badge>;
  };

  const getTypeBadge = (type: string | null) => {
    if (!type) return null;
    
    const typeColors: Record<string, string> = {
      feature: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      bug: 'bg-red-500/10 text-red-600 border-red-500/20',
      improvement: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      chore: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
    };

    return (
      <Badge variant="outline" className={typeColors[type] || ''}>
        {type}
      </Badge>
    );
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
          <Button>New Ticket</Button>
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
        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
            <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
              <div className="p-5 rounded-lg bg-[var(--bg)] hover:bg-[var(--bg-subtle)] border border-[var(--border)]/30 hover:border-[var(--border)] transition-all cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-[var(--text-base)] font-medium text-[var(--text)] truncate">
                        {ticket.title}
                      </h3>
                      {getTypeBadge(ticket.type)}
                      {getStatusBadge(ticket)}
                    </div>
                    
                    {ticket.description && (
                      <p className="text-[var(--text-sm)] text-[var(--text-secondary)] line-clamp-2 mb-3">
                        {ticket.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-[var(--text-xs)] text-[var(--text-tertiary)]">
                      <span>ID: {ticket.id.split('_')[1]?.substring(0, 8)}</span>
                      {ticket.acceptanceCriteria.length > 0 && (
                        <span>{ticket.acceptanceCriteria.length} AC</span>
                      )}
                      {ticket.assumptions.length > 0 && (
                        <span>{ticket.assumptions.length} Assumptions</span>
                      )}
                      {ticket.estimate && (
                        <span>Est: {ticket.estimate.range}</span>
                      )}
                      <span className="ml-auto">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
