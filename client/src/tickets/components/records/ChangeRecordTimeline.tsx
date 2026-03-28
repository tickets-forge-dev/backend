'use client';

import { useState, useEffect, useMemo } from 'react';
import { TicketService } from '@/services/ticket.service';
import type { AECResponse } from '@/services/ticket.service';
import { TimelineStrip } from './TimelineStrip';
import { RecordDetailPanel } from './RecordDetailPanel';
import { ClipboardList } from 'lucide-react';

export function ChangeRecordTimeline() {
  const [tickets, setTickets] = useState<AECResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const ticketService = useMemo(() => new TicketService(), []);

  useEffect(() => {
    (async () => {
      try {
        const all = await ticketService.list();
        const withRecords = all
          .filter((t) => t.changeRecord !== null)
          .sort(
            (a, b) =>
              new Date(b.changeRecord!.submittedAt).getTime() -
              new Date(a.changeRecord!.submittedAt).getTime(),
          );
        setTickets(withRecords);
        if (withRecords.length > 0) {
          setSelectedId(withRecords[0].id);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
          Change Records appear here when tickets are delivered with a settlement report.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Change Records</h1>
        <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">
          A history of what was built, what changed, and why
        </p>
      </div>

      {/* Timeline Strip */}
      <TimelineStrip
        tickets={tickets}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      {/* Detail Panel */}
      {selectedTicket && selectedTicket.changeRecord && (
        <RecordDetailPanel ticket={selectedTicket} />
      )}
    </div>
  );
}
