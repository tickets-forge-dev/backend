'use client';

import { usePRDBreakdownStore } from '@/tickets/stores/prd-breakdown.store';
import { Button } from '@/core/components/ui/button';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

/**
 * SuccessView - Step 3: Confirmation
 *
 * Shows that tickets were successfully created.
 * Provides links to view and enrich the tickets.
 */
export function SuccessView() {
  const { estimatedTicketsCount, createdTicketIds, reset } = usePRDBreakdownStore();

  return (
    <div className="space-y-8">
      {/* Success message */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle2 className="w-16 h-16" style={{ color: 'var(--green)' }} />
        </div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          Tickets Created Successfully!
        </h2>
        <p className="max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
          We&apos;ve created {createdTicketIds.length} draft tickets from your PRD breakdown.
          You can now review and enrich them with deep analysis.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderColor: 'var(--green)',
          }}
        >
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--green)' }}>TICKETS CREATED</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--green)' }}>
            {createdTicketIds.length}
          </p>
        </div>
        <div
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderColor: 'var(--blue)',
          }}
        >
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--blue)' }}>NEXT STEP</p>
          <p className="text-lg font-semibold" style={{ color: 'var(--blue)' }}>
            Enrich with deep analysis
          </p>
        </div>
      </div>

      {/* Next steps */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>What&apos;s next?</h3>
        <ol className="space-y-2">
          <li className="flex gap-3">
            <span className="text-sm font-semibold w-6" style={{ color: 'var(--text-tertiary)' }}>1</span>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Visit your <strong>Tickets</strong> page to see all created tickets
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-sm font-semibold w-6" style={{ color: 'var(--text-tertiary)' }}>2</span>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Click on any ticket to <strong>refine</strong> the title, description, and
              acceptance criteria
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-sm font-semibold w-6" style={{ color: 'var(--text-tertiary)' }}>3</span>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Use <strong>Deep Analysis</strong> to enrich with file changes, APIs, and test
              plans
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-sm font-semibold w-6" style={{ color: 'var(--text-tertiary)' }}>4</span>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Answer clarification questions to <strong>finalize the specification</strong>
            </span>
          </li>
        </ol>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-4" style={{ borderTopColor: 'var(--border)', borderTopWidth: '1px' }}>
        <Button variant="outline" onClick={() => reset()}>
          Analyze Another PRD
        </Button>
        <Link href="/tickets" className="flex-1">
          <Button className="w-full flex items-center justify-center gap-2">
            Go to Tickets <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Ticket list preview */}
      {createdTicketIds.length > 0 && (
        <div
          className="mt-8 p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--bg-subtle)',
            borderColor: 'var(--border)',
          }}
        >
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>
            Created Ticket IDs
          </p>
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            {createdTicketIds.map((id) => (
              <code
                key={id}
                className="text-xs p-2 rounded border font-mono"
                style={{
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text-secondary)',
                  borderColor: 'var(--border)',
                }}
              >
                {id}
              </code>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
