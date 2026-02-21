'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { TeamService, type TeamMember } from '@/services/team.service';
import { useTeamStore } from '@/teams/stores/team.store';
import { Users, UserPlus, UserCircle, X } from 'lucide-react';
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
}

export function AssigneeSelector({
  assignedTo,
  onAssign,
  disabled = false,
}: AssigneeSelectorProps) {
  const [developers, setDevelopers] = useState<TeamMember[]>([]);
  const [allMembers, setAllMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  
  // Get current team from team store
  const currentTeamId = useTeamStore((state) => state.currentTeamId);
  const currentTeam = useTeamStore((state) => state.currentTeam);

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
        const activeDevelopers = members.filter(
          (m) => m.status === 'active' && (m.role === 'developer' || m.role === 'admin')
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

  // Trigger button - minimal inline display
  const TriggerButton = () => {
    if (isPrivateWorkspace) {
      return (
        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
        >
          <Users className="h-3.5 w-3.5" />
          <span>Assign</span>
        </button>
      );
    }

    if (!isLoading && developers.length === 0 && !error) {
      return (
        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
        >
          <UserPlus className="h-3.5 w-3.5 text-[var(--blue)]" />
          <span>Assign</span>
        </button>
      );
    }

    // Has developers - show current assignment or "Assign"
    return (
      <button
        onClick={() => setDialogOpen(true)}
        disabled={disabled || isLoading}
        className="flex items-center gap-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors disabled:opacity-50"
      >
        <UserCircle className="h-3.5 w-3.5" />
        <span>
          {isLoading ? 'Loading...' : assignedTo ? (assignedDev?.displayName || assignedDev?.email || 'Assigned') : 'Assign'}
        </span>
      </button>
    );
  };

  return (
    <>
      <TriggerButton />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
              <div className="text-center py-6">
                <UserPlus className="h-10 w-10 text-[var(--blue)] mx-auto mb-3" />
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
              </div>
            )}

            {/* Developer list */}
            {!isPrivateWorkspace && developers.length > 0 && (
              <div className="space-y-1">
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
                      <p className="text-sm truncate">{dev.displayName || dev.email}</p>
                      {dev.displayName && (
                        <p className="text-xs text-[var(--text-tertiary)] truncate">{dev.email}</p>
                      )}
                    </div>
                    {dev.userId === assignedTo && (
                      <span className="text-xs text-[var(--blue)]">Current</span>
                    )}
                  </button>
                ))}
              </div>
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
