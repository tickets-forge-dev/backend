'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { AlertTriangle, ArrowRight, Lock, Plus, GitBranch, Pencil, Loader2, ChevronDown } from 'lucide-react';
import { AssigneeSelector } from './AssigneeSelector';
import { TicketLifecycleInfo } from './TicketLifecycleInfo';
import { TICKET_STATUS_CONFIG, LIFECYCLE_STEPS } from '../../config/ticketStatusConfig';
import type { AECResponse } from '@/services/ticket.service';
import { useTeamStore } from '@/teams/stores/team.store';
import { useAuthStore } from '@/stores/auth.store';
import { useTagsStore } from '@/stores/tags.store';
import { useServices } from '@/services/index';
import { useTicketsStore } from '@/stores/tickets.store';
import { TagPicker } from '../TagPicker';
import { getTagColor } from '@/tickets/config/tagColors';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { RepositorySelector } from '../RepositorySelector';
import { BranchSelector } from '../BranchSelector';
import { useSettingsStore } from '@/stores/settings.store';
import { toast } from 'sonner';

/** Maps current status → hint with and without a developer assigned. */
const NEXT_STEP_HINTS: Record<string, { assigned: string | null; unassigned: string | null }> = {
  draft: {
    assigned: 'Fill in details, then send to the developer for code-aware refinement',
    unassigned: 'Assign a developer for code-aware refinement, or approve as-is',
  },
  defined: {
    assigned: 'Developer is reviewing and refining the spec with code context',
    unassigned: 'Developer is reviewing and refining the spec with code context',
  },
  refined: {
    assigned: 'PM reviews the developer\'s changes before marking Ready',
    unassigned: 'PM reviews the developer\'s changes before marking Ready',
  },
  approved: {
    assigned: null,
    unassigned: null,
  },
  executing: {
    assigned: null,
    unassigned: null,
  },
  delivered: {
    assigned: null,
    unassigned: null,
  },
};

interface OverviewCardProps {
  ticket: AECResponse;
  onAssignTicket: (userId: string | null) => Promise<boolean>;
  qualityScore?: number;
  onTransition?: (status: string) => void;
  assignDialogOpen?: boolean;
  onAssignDialogOpenChange?: (open: boolean) => void;
  /** When true, the assign dialog was opened as part of the approval nudge flow */
  pendingApproval?: boolean;
  /** Optional action slot rendered in the bottom row (e.g., Develop button) */
  actionSlot?: React.ReactNode;
  /** Lifecycle bar rendered between assignee and status */
  lifecycleSlot?: React.ReactNode;
  /** External control for the repo dialog */
  repoDialogOpen?: boolean;
  onRepoDialogOpenChange?: (open: boolean) => void;
  /** Whether the detail panel is expanded (externally controlled) */
  isExpanded?: boolean;
  /** Callback when expanded state changes */
  onExpandedChange?: (expanded: boolean) => void;
}

export function OverviewCard({
  ticket,
  onAssignTicket,
  qualityScore,
  onTransition,
  assignDialogOpen,
  onAssignDialogOpenChange,
  pendingApproval,
  actionSlot,
  lifecycleSlot,
  repoDialogOpen: externalRepoDialogOpen,
  onRepoDialogOpenChange,
  isExpanded: controlledExpanded,
  onExpandedChange,
}: OverviewCardProps) {
  const cfg = TICKET_STATUS_CONFIG[ticket.status] ?? TICKET_STATUS_CONFIG.draft;
  const isUnassigned = !ticket.assignedTo;
  const hints = NEXT_STEP_HINTS[ticket.status];
  const hint = hints ? (isUnassigned ? hints.unassigned : hints.assigned) : '';
  const { teamMembers } = useTeamStore();
  const { tags } = useTagsStore();
  const { ticketService } = useServices();
  const { refreshTicket } = useTicketsStore();
  const { user } = useAuthStore();
  const creatorMember = ticket.createdBy ? teamMembers.find((m) => m.userId === ticket.createdBy) : null;
  // Resolve creator name: backend-provided name → team member → current user (if creator) → null
  const creatorName = ticket.createdByName
    || creatorMember?.displayName
    || creatorMember?.email
    || (ticket.createdBy && ticket.createdBy === user?.uid ? (user?.displayName || user?.email || null) : null);

  // Collapsible state — collapsed by default to reduce noise
  const [internalExpanded, setInternalExpanded] = useState(false);
  const expanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const setExpanded = (val: boolean) => {
    if (controlledExpanded === undefined) setInternalExpanded(val);
    onExpandedChange?.(val);
  };

  // Repository connect dialog — supports external control
  const [internalRepoOpen, setInternalRepoOpen] = useState(false);
  const repoDialogOpen = externalRepoDialogOpen ?? internalRepoOpen;
  const setRepoDialogOpen = onRepoDialogOpenChange ?? setInternalRepoOpen;
  const [isSavingRepo, setIsSavingRepo] = useState(false);
  const { selectedRepository, selectedBranch } = useTicketsStore();

  const handleSaveRepository = async () => {
    if (!selectedRepository || !selectedBranch) return;
    setIsSavingRepo(true);
    try {
      await ticketService.updateTicketRepository(ticket.id, selectedRepository, selectedBranch);
      await refreshTicket(ticket.id);
      setRepoDialogOpen(false);
      toast.success('Repository connected');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to connect repository');
    } finally {
      setIsSavingRepo(false);
    }
  };

  // Optimistic local tag IDs so pills render immediately after selection
  const [localTagIds, setLocalTagIds] = useState<string[]>(ticket.tagIds ?? []);

  // Sync when the authoritative ticket data arrives
  useEffect(() => {
    setLocalTagIds(ticket.tagIds ?? []);
  }, [ticket.tagIds]);

  // Resolve tag IDs to tag objects using optimistic local state
  const visibleTicketTags = useMemo(() => {
    if (localTagIds.length === 0) return [];
    return tags.filter(t => localTagIds.includes(t.id));
  }, [localTagIds, tags]);

  const handleTagsChange = useCallback(async (tagIds: string[]) => {
    setLocalTagIds(tagIds);
    try {
      await ticketService.updateTicketTags(ticket.id, tagIds);
      refreshTicket(ticket.id);
    } catch {
      // Revert optimistic update on failure
      setLocalTagIds(ticket.tagIds ?? []);
    }
  }, [ticket.id, ticket.tagIds, ticketService, refreshTicket]);

  // Find current and next step for the progress dots
  const currentIdx = LIFECYCLE_STEPS.findIndex(
    (s) => s.key === ticket.status,
  );

  return (
    <div className="px-4 py-2.5">
      {/* Always-visible row: Assignee — Status — Expand toggle */}
      <div className="relative flex items-center justify-between gap-4">
        <div className="relative z-10">
          <AssigneeSelector
            assignedTo={ticket.assignedTo}
            onAssign={onAssignTicket}
            externalOpen={assignDialogOpen}
            onExternalOpenChange={onAssignDialogOpenChange}
            pendingApproval={pendingApproval}
          />
          {/* Unassigned hint */}
          {isUnassigned && (
            <div className="group/warn absolute -top-1 -right-1">
              <AlertTriangle className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/warn:block z-50 w-56 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] px-3 py-2 shadow-xl">
                <p className="text-[11px] font-medium text-[var(--text-secondary)]">No developer assigned</p>
                <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)] leading-tight">Assign a developer for code-aware refinement, or skip and export / download the ticket directly.</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Mini progress dots — always visible as a compact summary */}
          <div className="flex items-center gap-1 shrink-0">
            {LIFECYCLE_STEPS.map((step, i) => (
              <div
                key={step.key}
                className={`h-1.5 rounded-full transition-colors ${
                  i <= currentIdx
                    ? 'w-4 bg-blue-500'
                    : 'w-1.5 bg-[var(--text-tertiary)]/20'
                }`}
              />
            ))}
          </div>

          {/* Status badge — clicking opens lifecycle panel */}
          {ticket.status && (
            <TicketLifecycleInfo currentStatus={ticket.status} onTransition={onTransition} hasAssignee={!isUnassigned}>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer border border-transparent hover:border-current/20 hover:shadow-sm transition-all ${cfg.badgeClass}`}>
                <span className="text-[10px] opacity-60 font-normal">Status</span>
                {cfg.label}
                <svg className="h-3 w-3 opacity-50" viewBox="0 0 12 12" fill="none"><path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
            </TicketLifecycleInfo>
          )}

          {/* Expand/collapse toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded hover:bg-[var(--bg-hover)] transition-colors"
            title={expanded ? 'Collapse details' : 'Expand details'}
          >
            <ChevronDown className={`h-3.5 w-3.5 text-[var(--text-tertiary)] transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expandable details — lifecycle bar, hint, next action */}
      {expanded && (
        <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] animate-fade-in">
          {/* Lifecycle bar — full stepper */}
          {lifecycleSlot && (
            <div className="mb-2">
              {lifecycleSlot}
            </div>
          )}

          {/* Hint row */}
          {(hint || actionSlot) && (
            <div className="flex items-center gap-3">
              {actionSlot ? (
                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                  {actionSlot}
                </div>
              ) : hint ? (
                <div className="flex items-center gap-1.5 min-w-0">
                  <ArrowRight className="h-3 w-3 shrink-0 text-[var(--text-tertiary)]" />
                  <p className="text-[11px] text-[var(--text-tertiary)] leading-tight truncate">
                    {hint}
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Connect Repository Dialog */}
      <Dialog open={repoDialogOpen} onOpenChange={setRepoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {ticket.repositoryContext ? 'Change Repository' : 'Connect Repository'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[var(--text-tertiary)]">
              Link a GitHub repository for code-aware development.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <RepositorySelector />
            <BranchSelector />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setRepoDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!selectedRepository || !selectedBranch || isSavingRepo}
                onClick={handleSaveRepository}
              >
                {isSavingRepo && <Loader2 className="h-3 w-3 animate-spin mr-1.5" />}
                {isSavingRepo ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
