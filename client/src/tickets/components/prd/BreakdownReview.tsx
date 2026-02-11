'use client';

import { useState } from 'react';
import { Button } from '@/core/components/ui/button';
import { usePRDBreakdownStore } from '@/tickets/stores/prd-breakdown.store';
import { usePRDService } from '@/services/prd.service';
import { EpicGroup } from './EpicGroup';
import { AlertCircle, Loader2 } from 'lucide-react';

/**
 * Format milliseconds to hh:mm:ss format
 */
function formatAnalysisTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((val) => String(val).padStart(2, '0'))
    .join(':');
}

/**
 * BreakdownReview - Step 2: Review and edit breakdown
 *
 * Shows all epics and tickets from the breakdown.
 * User can:
 * - Edit ticket title, description, priority, type
 * - Edit acceptance criteria
 * - Delete tickets
 * - Reorder tickets within epics
 * - Then bulk create all tickets
 */
export function BreakdownReview() {
  const prdService = usePRDService();
  const {
    breakdown,
    analysisTime,
    estimatedTicketsCount,
    isCreating,
    error,
    setCreating,
    setError,
    setCreatedTicketIds,
    moveToSuccess,
  } = usePRDBreakdownStore();

  const [creationError, setCreationError] = useState<string | null>(null);

  if (!breakdown) {
    return (
      <div
        className="p-6 rounded-lg border"
        style={{
          backgroundColor: 'var(--bg-subtle)',
          borderColor: 'var(--border)',
        }}
      >
        <p style={{ color: 'var(--text-secondary)' }}>No breakdown data available</p>
      </div>
    );
  }

  const handleCreateTickets = async () => {
    setCreationError(null);
    setError(null);

    if (breakdown.tickets.length === 0) {
      setCreationError('No tickets to create');
      return;
    }

    setCreating(true);
    try {
      const request = {
        tickets: breakdown.tickets.map((ticket) => ({
          epicName: ticket.epicName,
          title: ticket.title,
          description: ticket.description,
          type: ticket.type,
          priority: ticket.priority,
          acceptanceCriteria: JSON.stringify(ticket.acceptanceCriteria),
        })),
      };

      const result = await prdService.bulkCreateFromBreakdown(request);
      setCreatedTicketIds(result.ticketIds);
      moveToSuccess();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create tickets';
      setCreationError(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: 'var(--bg)',
            borderColor: 'var(--border)',
          }}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>TICKETS</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {breakdown.tickets.length}
          </p>
        </div>
        <div
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: 'var(--bg)',
            borderColor: 'var(--border)',
          }}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>EPICS</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {breakdown.summary.epicCount}
          </p>
        </div>
        <div
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: 'var(--bg)',
            borderColor: 'var(--border)',
          }}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>ANALYSIS TIME</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {analysisTime ? formatAnalysisTime(analysisTime) : '—'}
          </p>
        </div>
      </div>

      {/* Error alert */}
      {(creationError || error) && (
        <div
          className="flex gap-3 p-4 rounded-lg border"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'var(--red)',
          }}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--red)' }} />
          <p className="text-sm" style={{ color: 'var(--red)' }}>{creationError || error}</p>
        </div>
      )}

      {/* Epic groups */}
      <div className="space-y-8">
        {breakdown.summary.epics.map((epic) => (
          <EpicGroup key={epic.index} epic={epic} />
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex justify-between pt-6" style={{ borderTopColor: 'var(--border)', borderTopWidth: '1px' }}>
        <Button variant="outline">← Back to Input</Button>
        <Button
          onClick={handleCreateTickets}
          disabled={isCreating || breakdown.tickets.length === 0}
          className="flex items-center gap-2"
        >
          {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
          {isCreating
            ? `Creating ${breakdown.tickets.length} tickets...`
            : `Create ${breakdown.tickets.length} Tickets`}
        </Button>
      </div>
    </div>
  );
}
