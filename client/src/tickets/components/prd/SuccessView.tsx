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
          <CheckCircle2 className="w-16 h-16 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">
          Tickets Created Successfully!
        </h2>
        <p className="text-slate-600 max-w-md mx-auto">
          We&apos;ve created {createdTicketIds.length} draft tickets from your PRD breakdown.
          You can now review and enrich them with deep analysis.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg">
          <p className="text-xs text-emerald-700 font-medium mb-2">TICKETS CREATED</p>
          <p className="text-3xl font-bold text-emerald-900">
            {createdTicketIds.length}
          </p>
        </div>
        <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700 font-medium mb-2">NEXT STEP</p>
          <p className="text-lg font-semibold text-blue-900">
            Enrich with deep analysis
          </p>
        </div>
      </div>

      {/* Next steps */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">What&apos;s next?</h3>
        <ol className="space-y-2">
          <li className="flex gap-3">
            <span className="text-sm font-semibold text-slate-400 w-6">1</span>
            <span className="text-sm text-slate-700">
              Visit your <strong>Tickets</strong> page to see all created tickets
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-sm font-semibold text-slate-400 w-6">2</span>
            <span className="text-sm text-slate-700">
              Click on any ticket to <strong>refine</strong> the title, description, and
              acceptance criteria
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-sm font-semibold text-slate-400 w-6">3</span>
            <span className="text-sm text-slate-700">
              Use <strong>Deep Analysis</strong> to enrich with file changes, APIs, and test
              plans
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-sm font-semibold text-slate-400 w-6">4</span>
            <span className="text-sm text-slate-700">
              Answer clarification questions to <strong>finalize the specification</strong>
            </span>
          </li>
        </ol>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-4 border-t border-slate-200">
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
        <div className="mt-8 p-6 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-sm font-semibold text-slate-900 mb-3">
            Created Ticket IDs
          </p>
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            {createdTicketIds.map((id) => (
              <code
                key={id}
                className="text-xs bg-white p-2 rounded border border-slate-200 text-slate-600 font-mono"
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
