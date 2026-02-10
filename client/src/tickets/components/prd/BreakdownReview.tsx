'use client';

import { useState } from 'react';
import { Button } from '@/core/components/ui/button';
import { usePRDBreakdownStore } from '@/tickets/stores/prd-breakdown.store';
import { usePRDService } from '@/services/prd.service';
import { EpicGroup } from './EpicGroup';
import { AlertCircle, Loader2 } from 'lucide-react';

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
      <div className="p-6 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-slate-600">No breakdown data available</p>
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
        <div className="p-4 bg-white border border-slate-200 rounded-lg">
          <p className="text-xs text-slate-600 font-medium">TICKETS</p>
          <p className="text-2xl font-bold text-slate-900">
            {breakdown.tickets.length}
          </p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-lg">
          <p className="text-xs text-slate-600 font-medium">EPICS</p>
          <p className="text-2xl font-bold text-slate-900">
            {breakdown.summary.epicCount}
          </p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-lg">
          <p className="text-xs text-slate-600 font-medium">ANALYSIS TIME</p>
          <p className="text-2xl font-bold text-slate-900">
            {analysisTime ? `${analysisTime}ms` : '—'}
          </p>
        </div>
      </div>

      {/* Error alert */}
      {(creationError || error) && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-900">{creationError || error}</p>
        </div>
      )}

      {/* FR Coverage info */}
      {Object.keys(breakdown.summary.frCoverage).length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-900 font-medium mb-2">
            FUNCTIONAL REQUIREMENTS COVERAGE
          </p>
          <div className="flex flex-wrap gap-2">
            {breakdown.summary.frInventory.map((fr) => (
              <div key={fr.id} className="text-xs">
                <span className="font-medium text-blue-900">{fr.id}</span>
                <span className="text-blue-700">
                  {' '}
                  covered by {breakdown.summary.frCoverage[fr.id]?.length || 0}{' '}
                  stories
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Epic groups */}
      <div className="space-y-8">
        {breakdown.summary.epics.map((epic) => (
          <EpicGroup key={epic.index} epic={epic} />
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex justify-between pt-6 border-t border-slate-200">
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
