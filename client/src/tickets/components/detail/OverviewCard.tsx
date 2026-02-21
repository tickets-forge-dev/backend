'use client';

import { Bug, ClipboardList, Lightbulb, CheckCircle } from 'lucide-react';
import { AssigneeSelector } from './AssigneeSelector';
import type { AECResponse } from '@/services/ticket.service';

interface OverviewCardProps {
  ticket: AECResponse;
  // Story 3.5-5: Assignment
  onAssignTicket: (userId: string | null) => Promise<boolean>;
  // Metadata display
  qualityScore?: number;
  isComplete?: boolean;
  canToggleStatus?: boolean;
  onStatusClick?: () => void;
}

export function OverviewCard({
  ticket,
  onAssignTicket,
  qualityScore,
  isComplete,
  canToggleStatus,
  onStatusClick,
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
            qualityScore >= 75
              ? 'bg-green-500'
              : qualityScore >= 50
              ? 'bg-amber-500'
              : 'bg-red-500'
          }`}>
            {qualityScore}/100
          </span>
        )}

        {/* Status button */}
        {canToggleStatus && (
          <button
            onClick={onStatusClick}
            className={`
              inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium transition-colors
              ${isComplete
                ? 'bg-green-500/15 text-green-600 dark:text-green-400 hover:bg-green-500/25'
                : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]/80'
              }
            `}
          >
            {isComplete && <CheckCircle className="h-3 w-3" />}
            <span>{isComplete ? 'Complete' : 'Draft'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
