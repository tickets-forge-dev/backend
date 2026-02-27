'use client';

import { Bug, ClipboardList, Lightbulb } from 'lucide-react';
import { AssigneeSelector } from './AssigneeSelector';
import { TicketLifecycleInfo } from './TicketLifecycleInfo';
import { TICKET_STATUS_CONFIG } from '../../config/ticketStatusConfig';
import type { AECResponse } from '@/services/ticket.service';

interface OverviewCardProps {
  ticket: AECResponse;
  onAssignTicket: (userId: string | null) => Promise<boolean>;
  qualityScore?: number;
  onTransition?: (status: string) => void;
  assignDialogOpen?: boolean;
  onAssignDialogOpenChange?: (open: boolean) => void;
}

export function OverviewCard({
  ticket,
  onAssignTicket,
  qualityScore,
  onTransition,
  assignDialogOpen,
  onAssignDialogOpenChange,
}: OverviewCardProps) {
  const cfg = TICKET_STATUS_CONFIG[ticket.status] ?? TICKET_STATUS_CONFIG.draft;

  return (
    <div className="flex items-center justify-between gap-4 py-2">
      {/* Left side: Assign + Type + Priority */}
      <div className="flex items-center gap-4">
        <AssigneeSelector
          assignedTo={ticket.assignedTo}
          onAssign={onAssignTicket}
          externalOpen={assignDialogOpen}
          onExternalOpenChange={onAssignDialogOpenChange}
        />

        {/* Divider */}
        <span className="h-4 w-px bg-[var(--border)]" />

        {/* Type */}
        {ticket.type && (
          <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            {ticket.type === 'bug' ? <Bug className="h-3.5 w-3.5 text-red-500" />
              : ticket.type === 'task' ? <ClipboardList className="h-3.5 w-3.5 text-blue-500" />
              : <Lightbulb className="h-3.5 w-3.5 text-amber-500" />}
            <span className="capitalize">{ticket.type}</span>
          </span>
        )}

        {/* Priority */}
        {ticket.priority && (
          <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <span className={`h-2 w-2 rounded-full ${
              ticket.priority === 'urgent' ? 'bg-red-500'
                : ticket.priority === 'high' ? 'bg-orange-500'
                : ticket.priority === 'medium' ? 'bg-yellow-500'
                : 'bg-green-500'
            }`} />
            <span className="capitalize">{ticket.priority}</span>
          </span>
        )}
      </div>

      {/* Right side: Quality Score + Status badge (clickable lifecycle) */}
      <div className="flex items-center gap-3">
        {/* Quality score */}
        {qualityScore !== undefined && (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
              qualityScore >= 75
                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                : qualityScore >= 50
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
            }`}
            title="Spec quality score — how complete and detailed the ticket specification is"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${
              qualityScore >= 75 ? 'bg-green-500' : qualityScore >= 50 ? 'bg-amber-500' : 'bg-red-500'
            }`} />
            Quality {qualityScore}%
          </span>
        )}

        {/* Status badge — clicking opens lifecycle panel */}
        {ticket.status && (
          <TicketLifecycleInfo currentStatus={ticket.status} onTransition={onTransition}>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer border border-transparent hover:border-current/20 hover:shadow-sm transition-all ${cfg.badgeClass}`}>
              {cfg.label}
              <svg className="h-3 w-3 opacity-50" viewBox="0 0 12 12" fill="none"><path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
          </TicketLifecycleInfo>
        )}

      </div>
    </div>
  );
}
