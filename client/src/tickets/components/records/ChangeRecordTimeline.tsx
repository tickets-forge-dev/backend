'use client';

import { useEffect, useMemo } from 'react';
import { useTeamStore } from '@/teams/stores/team.store';
import { useChangeRecordsStore } from '@/tickets/stores/change-records.store';
import { TimelineAxis } from './TimelineAxis';
import { RecordDetailPanel } from './RecordDetailPanel';
import { RecordSidebar } from './RecordSidebar';
import { DateRangeFilter } from './DateRangeFilter';
import { ZoomToggle } from './ZoomToggle';
import { RecordFilters, ActiveFilterPills, hasActiveFilters } from './RecordFilters';
import { ClipboardList, Search } from 'lucide-react';

export function ChangeRecordTimeline() {
  const {
    tickets, loading, selectedId, zoom, dateRange, search, filters,
    loadRecords, setSelectedId, setZoom, setDateRange, setSearch, setFilters,
  } = useChangeRecordsStore();
  const teamMembers = useTeamStore((s) => s.teamMembers);

  useEffect(() => { loadRecords(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Filtered by search + filters (used by sidebar, detail panel, selection)
  const filteredTickets = useMemo(() => {
    const q = search.toLowerCase().trim();

    return tickets.filter((t) => {
      if (q) {
        const titleMatch = t.title.toLowerCase().includes(q);
        const member = t.assignedTo
          ? teamMembers.find((m) => m.userId === t.assignedTo)
          : null;
        const nameMatch =
          member?.displayName?.toLowerCase().includes(q) ||
          member?.email?.toLowerCase().includes(q);
        if (!titleMatch && !nameMatch) return false;
      }

      if (filters.priority !== 'all' && t.priority !== filters.priority) return false;
      if (filters.type !== 'all' && t.type !== filters.type) return false;
      if (filters.recordStatus !== 'all' && t.changeRecord!.status !== filters.recordStatus) return false;
      if (filters.tagIds.length > 0) {
        const ticketTags = t.tagIds ?? [];
        if (!filters.tagIds.every((id) => ticketTags.includes(id))) return false;
      }

      return true;
    });
  }, [tickets, search, teamMembers, filters]);

  // Date range only affects the timeline view
  // Parse as local time (append T00:00:00) to avoid UTC/local mismatch
  const timelineTickets = useMemo(() => {
    const fromDate = new Date(dateRange.from + 'T00:00:00');
    const toDate = new Date(dateRange.to + 'T23:59:59.999');
    return filteredTickets.filter((t) => {
      const d = new Date(t.changeRecord!.submittedAt);
      return d >= fromDate && d <= toDate;
    });
  }, [filteredTickets, dateRange]);

  // Auto-select latest visible record when current selection is filtered out
  useEffect(() => {
    if (selectedId && !timelineTickets.find((t) => t.id === selectedId)) {
      setSelectedId(timelineTickets.length > 0 ? timelineTickets[timelineTickets.length - 1].id : null);
    }
  }, [timelineTickets, selectedId, setSelectedId]);

  const selectedTicket = timelineTickets.find((t) => t.id === selectedId) ?? null;

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
        <div className="text-sm text-[var(--text-secondary)] mb-1">No Decision Logs yet</div>
        <div className="text-[13px] text-[var(--text-tertiary)]">
          Decision Logs appear here when tickets are delivered.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <div className="shrink-0">
              <h1 className="text-sm font-semibold text-[var(--text-primary)]">Decision Logs</h1>
              <p className="text-[10px] text-[var(--text-tertiary)] -mt-0.5">Click a log on the timeline to view details</p>
            </div>

            {/* Search — centered */}
            <div className="flex-1 flex justify-center">
              <div className="relative w-full max-w-[220px]">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="h-7 w-full pl-6 pr-2 rounded-md border border-[var(--border-subtle)] bg-transparent text-[11px] text-[var(--text-secondary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-purple-500/40 transition-colors"
                />
              </div>
            </div>

            {/* Icon buttons — right */}
            <div className="flex items-center gap-1 pr-2">
              <RecordFilters filters={filters} onChange={setFilters} />
              <DateRangeFilter
                from={dateRange.from}
                to={dateRange.to}
                onChange={(from, to) => setDateRange(from, to)}
              />
              <ZoomToggle zoom={zoom} onZoomChange={setZoom} />
            </div>
          </div>
          <ActiveFilterPills filters={filters} onChange={setFilters} />
        </div>

        {/* Timeline — date range only affects this */}
        {timelineTickets.length > 0 ? (
          <TimelineAxis
            tickets={timelineTickets}
            selectedId={selectedId}
            onSelect={setSelectedId}
            zoom={zoom}
          />
        ) : (
          <div className="rounded-[10px] border border-[var(--border-subtle)] flex items-center justify-center py-8">
            <div className="text-center">
              <div className="text-[11px] text-[var(--text-tertiary)]">No records in this date range</div>
              <button
                onClick={() => {
                  const t = new Date();
                  const f = new Date();
                  f.setDate(f.getDate() - 90);
                  setDateRange(f.toISOString().slice(0, 10), t.toISOString().slice(0, 10));
                }}
                className="text-[10px] text-purple-500 hover:underline mt-1"
              >
                Expand to last 90 days
              </button>
            </div>
          </div>
        )}

        {/* Selected record detail */}
        {selectedTicket && selectedTicket.changeRecord && (
          <RecordDetailPanel ticket={selectedTicket} />
        )}
      </div>

      {/* Sidebar */}
      {timelineTickets.length > 0 && (
        <RecordSidebar tickets={timelineTickets} selectedId={selectedId} onSelect={setSelectedId} />
      )}
    </div>
  );
}
