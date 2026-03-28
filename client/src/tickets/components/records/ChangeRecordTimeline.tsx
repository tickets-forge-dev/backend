'use client';

import { useState, useEffect, useMemo } from 'react';
import { TicketService } from '@/services/ticket.service';
import type { AECResponse } from '@/services/ticket.service';
import { TimelineAxis } from './TimelineAxis';
import { RecordDetailPanel } from './RecordDetailPanel';
import { RecordSidebar } from './RecordSidebar';
import { DateRangeFilter } from './DateRangeFilter';
import { ZoomToggle } from './ZoomToggle';
import { RecordHelpButton } from './RecordHelpButton';
import { ClipboardList } from 'lucide-react';

function defaultDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export function ChangeRecordTimeline() {
  const [tickets, setTickets] = useState<AECResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCardMode, setIsCardMode] = useState(false);
  const [dateRange, setDateRange] = useState(defaultDateRange);

  const ticketService = useMemo(() => new TicketService(), []);

  useEffect(() => {
    (async () => {
      try {
        const all = await ticketService.list();
        const withRecords = all
          .filter((t) => t.changeRecord !== null)
          .sort(
            (a, b) =>
              new Date(a.changeRecord!.submittedAt).getTime() -
              new Date(b.changeRecord!.submittedAt).getTime(),
          );
        setTickets(withRecords);
        if (withRecords.length > 0) {
          setSelectedId(withRecords[withRecords.length - 1].id);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredTickets = useMemo(() => {
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    toDate.setHours(23, 59, 59, 999);
    return tickets.filter((t) => {
      const d = new Date(t.changeRecord!.submittedAt);
      return d >= fromDate && d <= toDate;
    });
  }, [tickets, dateRange]);

  const selectedTicket = tickets.find((t) => t.id === selectedId) ?? null;

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
          Change Records appear here when tickets are delivered.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row">
      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-[var(--text-lg)] font-semibold text-[var(--text-primary)]">Change Records</h1>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
              A history of what was built, what changed, and why
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DateRangeFilter
              from={dateRange.from}
              to={dateRange.to}
              onChange={(from, to) => setDateRange({ from, to })}
            />
            <div className="w-px h-3 bg-[var(--border-subtle)]" />
            <ZoomToggle isCardMode={isCardMode} onToggle={() => setIsCardMode(!isCardMode)} />
            <RecordHelpButton />
          </div>
        </div>

        {/* Timeline */}
        <TimelineAxis
          tickets={filteredTickets}
          selectedId={selectedId}
          onSelect={setSelectedId}
          isCardMode={isCardMode}
        />

        {/* Selected record detail */}
        {selectedTicket && selectedTicket.changeRecord && (
          <RecordDetailPanel ticket={selectedTicket} />
        )}

      </div>

      {/* Sidebar (handles desktop/mobile internally) */}
      {filteredTickets.length > 0 && (
        <RecordSidebar tickets={filteredTickets} selectedId={selectedId} onSelect={setSelectedId} />
      )}
    </div>
  );
}
