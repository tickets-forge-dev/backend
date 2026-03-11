'use client';

import { AlertTriangle } from 'lucide-react';
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
  const isUnassigned = !ticket.assignedTo;

  return (
    <div className="py-2">
      {/* Assign To Developer ... [spacer] ... Status badge */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative">
          <AssigneeSelector
            assignedTo={ticket.assignedTo}
            onAssign={onAssignTicket}
            externalOpen={assignDialogOpen}
            onExternalOpenChange={onAssignDialogOpenChange}
          />
          {/* Unassigned warning */}
          {isUnassigned && (
            <div className="group/warn absolute -top-1 -right-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/warn:block z-50 w-52 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] px-3 py-2 shadow-xl">
                <p className="text-[11px] font-medium text-amber-500">No developer assigned</p>
                <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)] leading-tight">Assign a developer to move this ticket to Dev Refine phase</p>
              </div>
            </div>
          )}
        </div>

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
