'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/core/components/ui/button';
import { usePRDBreakdownStore } from '@/tickets/stores/prd-breakdown.store';
import { usePRDService } from '@/services/prd.service';
import { BulkEnrichmentWizard } from '@/tickets/components/bulk';
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
 * - Then bulk enrich all tickets in parallel
 *
 * Flow:
 * 1. Click "Enrich & Create" → Create draft tickets (POST /breakdown/bulk-create)
 * 2. Show BulkEnrichmentWizard with ticket IDs
 * 3. Wizard handles: enrichment (Stage 1) → questions (Stage 2) → finalization (Stage 3)
 * 4. On completion → Redirect to /tickets with "new" badges
 */
export function BreakdownReview() {
  const router = useRouter();
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
  const [draftTicketIds, setDraftTicketIds] = useState<string[]>([]);
  const [showEnrichmentWizard, setShowEnrichmentWizard] = useState(false);

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
      // Step 1: Create draft tickets
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

      // Step 2: Extract created ticket IDs (preserving order)
      const createdIds = result.results
        .filter((r) => r.ticketId)
        .map((r) => r.ticketId!);

      // Check for errors
      const errors = result.results.filter((r) => r.error);
      if (errors.length > 0) {
        const errorMessages = errors
          .map((e) => `"${e.title}": ${e.error}`)
          .join('\n');
        setCreationError(`Some tickets failed to create:\n${errorMessages}`);
      }

      // Step 3: Show enrichment wizard only if we have tickets
      if (createdIds.length > 0) {
        setDraftTicketIds(createdIds);
        setShowEnrichmentWizard(true);
      } else if (errors.length === result.results.length) {
        setCreationError('All tickets failed to create. Please check the errors above.');
      }
      setCreating(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create tickets';
      setCreationError(message);
      setCreating(false);
    }
  };

  const handleEnrichmentComplete = (enrichedTicketIds: string[]) => {
    // Store created ticket IDs in store
    setCreatedTicketIds(enrichedTicketIds);

    // Close wizard and move to success state
    setShowEnrichmentWizard(false);
    moveToSuccess();

    // Redirect to tickets list after a brief delay
    setTimeout(() => {
      router.push('/tickets');
    }, 500);
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

      {/* Enrichment notice */}
      <div
        className="p-4 rounded-lg border"
        style={{
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderColor: 'var(--green)',
        }}
      >
        <p className="text-sm" style={{ color: 'var(--green)' }}>
          ✨ <strong>These tickets will be fully enriched:</strong> When you click &ldquo;Enrich &amp; Create&rdquo;, each ticket will go through deep analysis, generate clarification questions, and create a complete technical specification with file changes, APIs, and test plans.
        </p>
      </div>

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
            : `Enrich & Create ${breakdown.tickets.length} Tickets`}
        </Button>
      </div>

      {/* Bulk Enrichment Wizard Modal */}
      {showEnrichmentWizard && draftTicketIds.length > 0 && (
        <BulkEnrichmentWizard
          ticketIds={draftTicketIds}
          ticketTitles={new Map(
            breakdown.tickets.map((ticket, index) => [draftTicketIds[index] || '', ticket.title]),
          )}
          onComplete={handleEnrichmentComplete}
          onClose={() => setShowEnrichmentWizard(false)}
        />
      )}
    </div>
  );
}
