'use client';

import { Bug, ClipboardList, Lightbulb, ArrowRight } from 'lucide-react';
import { AssigneeSelector } from './AssigneeSelector';
import { TicketLifecycleInfo } from './TicketLifecycleInfo';
import { TICKET_STATUS_CONFIG } from '../../config/ticketStatusConfig';
import type { AECResponse } from '@/services/ticket.service';

interface OverviewCardProps {
  ticket: AECResponse;
  onAssignTicket: (userId: string | null) => Promise<boolean>;
  qualityScore?: number;
  onMarkAsReady?: () => void;
}

function StatusBadge({ status }: { status: string }) {
  const cfg = TICKET_STATUS_CONFIG[status];
  const label = cfg?.label ?? status;
  const className = cfg?.badgeClass ?? 'bg-[var(--bg-hover)] text-[var(--text-secondary)]';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

export function OverviewCard({
  ticket,
  onAssignTicket,
  qualityScore,
  onMarkAsReady,
}: OverviewCardProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      {/* Left side: Assign + Type + Priority */}
      <div className="flex items-center gap-4">
        <AssigneeSelector
          assignedTo={ticket.assignedTo}
          onAssign={onAssignTicket}
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

      {/* Right side: Quality Score + Status */}
      <div className="flex items-center gap-3">
        {/* Quality score */}
        {qualityScore !== undefined && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${
            qualityScore >= 75 ? 'bg-green-500' : qualityScore >= 50 ? 'bg-amber-500' : 'bg-red-500'
          }`}>
            {qualityScore}/100
          </span>
        )}

        {/* Status badge */}
        {ticket.status && (
          <>
            <StatusBadge status={ticket.status} />
            <TicketLifecycleInfo currentStatus={ticket.status} />
          </>
        )}

        {/* Mark as Ready — only for draft tickets */}
        {ticket.status === 'draft' && onMarkAsReady && (
          <button
            onClick={onMarkAsReady}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors"
          >
            <ArrowRight className="h-3 w-3" />
            Mark as Ready
          </button>
        )}
      </div>
    </div>
  );
}
