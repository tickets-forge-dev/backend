'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { AlertTriangle, ArrowRight, Lock, Plus, GitBranch, Pencil, Loader2 } from 'lucide-react';
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
const NEXT_STEP_HINTS: Record<string, { assigned: string; unassigned: string }> = {
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

  // Repository connect dialog
  const [repoDialogOpen, setRepoDialogOpen] = useState(false);
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
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-3">
      {/* Top row: Assignee ... Status badge */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative">
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

        {/* Created by — read only */}
        {ticket.createdBy && (
          <span className="text-[11px] text-[var(--text-tertiary)]">
            Created by <span className="text-[var(--text-secondary)]">{creatorName ?? '—'}</span>
          </span>
        )}

        {/* Tag pills + add tag */}
        <div className="flex items-center gap-1 flex-1 min-w-0 justify-center">
          {visibleTicketTags.map(tag => (
            <span key={tag.id} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getTagColor(tag.color).pill}`}>
              {tag.scope === 'private' && <Lock className="h-2 w-2" />}
              {tag.name}
            </span>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">
                <Plus className="h-3 w-3" />
                {visibleTicketTags.length === 0 && <span>Add tag</span>}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56 p-0">
              <TagPicker ticketId={ticket.id} currentTagIds={localTagIds} onTagsChange={handleTagsChange} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status badge — clicking opens lifecycle panel */}
        {ticket.status && (
          <TicketLifecycleInfo currentStatus={ticket.status} onTransition={onTransition} hasAssignee={!isUnassigned}>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer border border-transparent hover:border-current/20 hover:shadow-sm transition-all ${cfg.badgeClass}`}>
              {cfg.label}
              <svg className="h-3 w-3 opacity-50" viewBox="0 0 12 12" fill="none"><path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
          </TicketLifecycleInfo>
        )}
      </div>

      {/* Repository row */}
      <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] flex items-center gap-2">
        <GitBranch className="h-3 w-3 text-[var(--text-tertiary)] shrink-0" />
        {ticket.repositoryContext ? (
          <button
            onClick={() => setRepoDialogOpen(true)}
            className="group flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
          >
            <span className="font-medium">{ticket.repositoryContext.repositoryFullName}</span>
            <span className="text-[var(--text-tertiary)]">·</span>
            <span>{ticket.repositoryContext.branchName}</span>
            <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-60 transition-opacity" />
          </button>
        ) : (
          <button
            onClick={() => setRepoDialogOpen(true)}
            className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--primary)] transition-colors"
          >
            Connect repository
          </button>
        )}
      </div>

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

      {/* Bottom row: progress dots + next step hint or action slot */}
      {(hint || actionSlot) && (
        <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] flex items-center gap-3">
          {/* Mini progress dots */}
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
  );
}
