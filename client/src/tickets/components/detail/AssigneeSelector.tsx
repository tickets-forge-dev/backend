'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { TeamService, type TeamMember } from '@/services/team.service';
import { useTeamStore } from '@/teams/stores/team.store';
import { Users, UserPlus, X, Terminal, Copy, Check, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';

interface AssigneeSelectorProps {
  assignedTo: string | null;
  onAssign: (userId: string | null) => Promise<boolean>;
  disabled?: boolean;
  /** Controlled open state — lets parent open the dialog programmatically */
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}

export function AssigneeSelector({
  assignedTo,
  onAssign,
  disabled = false,
  externalOpen,
  onExternalOpenChange,
}: AssigneeSelectorProps) {
  const [developers, setDevelopers] = useState<TeamMember[]>([]);
  const [allMembers, setAllMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Sync external open state
  useEffect(() => {
    if (externalOpen) setDialogOpen(true);
  }, [externalOpen]);
  const [isAssigning, setIsAssigning] = useState(false);
  
  // Get current team from team store
  const currentTeam = useTeamStore((state) => state.currentTeam);
  // Derive currentTeamId from currentTeam (Zustand getters don't work with selectors)
  const currentTeamId = currentTeam?.id || null;

  // Determine if user is in a team workspace or private workspace
  const isPrivateWorkspace = !currentTeamId;

  // Fetch team members on mount
  useEffect(() => {
    const fetchDevelopers = async () => {
      // Private workspace - no team members to fetch
      if (!currentTeamId) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);

        const user = auth.currentUser;
        if (!user) {
          throw new Error('Not authenticated');
        }

        const idToken = await user.getIdToken();
        const teamService = new TeamService();

        // Use currentTeamId (team_...) instead of workspaceId (ws_...)
        const members = await teamService.getTeamMembers(currentTeamId, idToken);
        setAllMembers(members.filter((m) => m.status === 'active'));

        // Filter: Only ACTIVE members who can execute tickets (admin + developer roles)
        // Exclude the current user (can't assign to yourself)
        const activeDevelopers = members.filter(
          (m) => m.status === 'active' && (m.role === 'developer' || m.role === 'admin') && m.userId !== user.uid
        );

        setDevelopers(activeDevelopers);
      } catch (err: any) {
        setError(err.message || 'Failed to load developers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDevelopers();
  }, [currentTeamId]);

  const handleAssign = async (userId: string | null) => {
    setIsAssigning(true);
    try {
      const success = await onAssign(userId);
      if (success) {
        setDialogOpen(false);
      }
    } finally {
      setIsAssigning(false);
    }
  };

  // Find assigned developer for display name
  const assignedDev = developers.find((d) => d.userId === assignedTo);

  // Trigger button - pill-shaped chip, clearly interactive
  const TriggerButton = () => {
    // Assigned state — show avatar initial + name chip
    if (assignedTo && assignedDev) {
      const initials = (assignedDev.displayName || assignedDev.email || '?')[0].toUpperCase();
      return (
        <button
          onClick={() => setDialogOpen(true)}
          disabled={disabled}
          className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--bg-hover)] border border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--bg)] text-[var(--text)] transition-colors disabled:opacity-50"
        >
          <div className="h-5 w-5 rounded-full bg-[var(--blue)] flex items-center justify-center text-white text-[10px] font-semibold shrink-0">
            {initials}
          </div>
          <span className="text-xs font-medium truncate max-w-[120px]">
            {assignedDev.displayName || assignedDev.email}
          </span>
        </button>
      );
    }

    // Unassigned state — dashed "Assign" button
    return (
      <button
        onClick={() => setDialogOpen(true)}
        disabled={disabled || isLoading}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-dashed border-[var(--border)] hover:border-[var(--blue)] hover:text-[var(--blue)] text-[var(--text-secondary)] transition-colors disabled:opacity-50"
      >
        <UserPlus className="h-3.5 w-3.5 shrink-0" />
        <span className="text-xs font-medium">
          {isLoading ? 'Loading…' : 'Assign To Developer'}
        </span>
      </button>
    );
  };

  return (
    <>
      <TriggerButton />

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) onExternalOpenChange?.(false);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Ticket</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {/* Private workspace message */}
            {isPrivateWorkspace && (
              <div className="text-center py-6">
                <Users className="h-10 w-10 text-[var(--text-tertiary)] mx-auto mb-3" />
                <p className="text-sm text-[var(--text)]">
                  Assignment requires a team workspace
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Create or join a team to assign tickets to developers.
                </p>
              </div>
            )}

            {/* No assignable members message */}
            {!isPrivateWorkspace && !isLoading && developers.length === 0 && !error && (
              <div className="text-center py-4">
                <UserPlus className="h-8 w-8 text-[var(--blue)] mx-auto mb-2" />
                <p className="text-sm text-[var(--text)]">
                  No assignable members in your team yet
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Invite team members with admin or developer role to enable assignment.
                </p>
                {allMembers.length > 0 && (
                  <p className="text-xs text-[var(--text-tertiary)] mt-2">
                    {allMembers.length} member{allMembers.length !== 1 ? 's' : ''} without assignable role
                  </p>
                )}
                <DevCliInfo />
              </div>
            )}

            {/* Developer list */}
            {!isPrivateWorkspace && developers.length > 0 && (
              <div className="space-y-1 mb-3">
                {/* Unassign option */}
                <button
                  onClick={() => handleAssign(null)}
                  disabled={isAssigning || !assignedTo}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    !assignedTo 
                      ? 'bg-[var(--bg-hover)] text-[var(--text)]' 
                      : 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'
                  } disabled:opacity-50`}
                >
                  <X className="h-4 w-4" />
                  <span className="text-sm">Unassigned</span>
                  {!assignedTo && <span className="ml-auto text-xs text-[var(--blue)]">Current</span>}
                </button>

                {/* Developers */}
                {developers.map((dev) => (
                  <button
                    key={dev.userId}
                    onClick={() => handleAssign(dev.userId)}
                    disabled={isAssigning}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      dev.userId === assignedTo 
                        ? 'bg-[var(--bg-hover)] text-[var(--text)]' 
                        : 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'
                    } disabled:opacity-50`}
                  >
                    <div className="h-6 w-6 rounded-full bg-[var(--blue)] flex items-center justify-center text-white text-xs font-medium">
                      {(dev.displayName || dev.email || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm truncate">{dev.displayName || dev.email}</p>
                        <span className="text-xs text-[var(--text-tertiary)] capitalize">{dev.role}</span>
                      </div>
                      <p className="text-[10px] text-[var(--text-tertiary)] opacity-50 truncate">{dev.email}</p>
                    </div>
                    {dev.userId === assignedTo && (
                      <span className="text-xs text-[var(--blue)]">Current</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Developer CLI info — show when there are developers or in empty state */}
            {!isPrivateWorkspace && !isLoading && developers.length > 0 && (
              <DevCliInfo />
            )}

            {/* Error */}
            {error && (
              <p className="text-sm text-red-500 text-center py-4">{error}</p>
            )}

            {/* Loading */}
            {isLoading && (
              <p className="text-sm text-[var(--text-tertiary)] text-center py-6">Loading team members...</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Small collapsible info block explaining how assigned devs use the CLI. */
function DevCliInfo() {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const command = 'npm install -g @anthropic-forge/cli';

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] text-left">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 w-full text-left hover:text-[var(--text)] transition-colors"
      >
        <ChevronRight className={`h-3 w-3 text-[var(--text-tertiary)] transition-transform ${expanded ? 'rotate-90' : ''}`} />
        <Terminal className="h-3 w-3 text-[var(--text-tertiary)]" />
        <p className="text-[11px] font-medium text-[var(--text-secondary)]">How it works for developers</p>
      </button>
      {expanded && (
        <div className="mt-1.5 pl-[18px]">
          <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed mb-2">
            Once assigned, the developer installs the forge CLI, logs in with <code className="text-[var(--text-secondary)] bg-[var(--bg-hover)] px-1 py-px rounded text-[10px]">forge login</code>, and runs <code className="text-[var(--text-secondary)] bg-[var(--bg-hover)] px-1 py-px rounded text-[10px]">forge develop</code> to refine the ticket with real code context.
          </p>
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[var(--bg-hover)] border border-[var(--border-subtle)] hover:border-[var(--border)] transition-colors group"
          >
            <code className="flex-1 text-[10px] text-[var(--text-secondary)] text-left font-mono truncate">{command}</code>
            {copied ? (
              <Check className="h-3 w-3 text-green-500 shrink-0" />
            ) : (
              <Copy className="h-3 w-3 text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] shrink-0" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
