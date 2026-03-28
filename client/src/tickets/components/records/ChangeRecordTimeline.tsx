'use client';

import { useState, useEffect, useMemo } from 'react';
import { TicketService } from '@/services/ticket.service';
import type { AECResponse } from '@/services/ticket.service';
import { TimelineStrip } from './TimelineStrip';
import { RecordDetailPanel } from './RecordDetailPanel';
import { ClipboardList } from 'lucide-react';

type FilterStatus = 'all' | 'awaiting_review' | 'accepted' | 'changes_requested';

export function ChangeRecordTimeline() {
  const [tickets, setTickets] = useState<AECResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');

  const ticketService = useMemo(() => new TicketService(), []);

  const fetchTickets = async () => {
    try {
      const all = await ticketService.list();
      const withRecords = all.filter((t) => t.changeRecord !== null);
      setTickets(withRecords);
      if (!selectedId && withRecords.length > 0) {
        const mostRecent = withRecords.sort(
          (a, b) => new Date(b.changeRecord!.submittedAt).getTime() - new Date(a.changeRecord!.submittedAt).getTime(),
        )[0];
        setSelectedId(mostRecent.id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredTickets = useMemo(() => {
    if (filter === 'all') return tickets;
    return tickets.filter((t) => t.changeRecord!.status === filter);
  }, [tickets, filter]);

  const selectedTicket = tickets.find((t) => t.id === selectedId) ?? null;

  const counts = useMemo(() => ({
    all: tickets.length,
    awaiting_review: tickets.filter((t) => t.changeRecord!.status === 'awaiting_review').length,
    accepted: tickets.filter((t) => t.changeRecord!.status === 'accepted').length,
    changes_requested: tickets.filter((t) => t.changeRecord!.status === 'changes_requested').length,
  }), [tickets]);

  const handleReviewDelivery = async (ticketId: string, action: 'accept' | 'request_changes', note?: string) => {
    await ticketService.reviewDelivery(ticketId, action, note);
    await fetchTickets();
  };

  const filters: Array<{ key: FilterStatus; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'awaiting_review', label: 'Awaiting Review' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'changes_requested', label: 'Changes Requested' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[var(--text-tertiary)] text-sm">Loading records...</div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <ClipboardList className="w-10 h-10 text-[var(--text-tertiary)] mb-3 opacity-40" />
        <div className="text-sm text-[var(--text-secondary)] mb-1">No Change Records yet</div>
        <div className="text-[13px] text-[var(--text-tertiary)]">
          Change Records appear here when tickets are delivered with a settlement report.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Change Records</h1>
          <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">
            Review what was built vs what was intended
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-[12px] px-2.5 py-1 rounded-full border transition-colors ${
                filter === f.key
                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                  : 'bg-transparent text-[var(--text-tertiary)] border-[var(--border-subtle)] hover:text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]/20'
              }`}
            >
              {f.label}
              <span className={`ml-1 text-[11px] px-1 py-px rounded ${
                filter === f.key ? 'bg-purple-500/20' : 'bg-[var(--bg-hover)]'
              }`}>
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Strip */}
      <TimelineStrip
        tickets={filteredTickets}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      {/* Detail Panel */}
      {selectedTicket && selectedTicket.changeRecord && (
        <RecordDetailPanel
          ticket={selectedTicket}
          onReviewDelivery={handleReviewDelivery}
        />
      )}
    </div>
  );
}
