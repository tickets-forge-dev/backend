'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { TeamService, type TeamMember } from '@/services/team.service';
import { useTeamStore } from '@/teams/stores/team.store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get current team ID from team store (not workspaceId which has different prefix)
  const currentTeamId = useTeamStore((state) => state.currentTeamId);

  // Fetch team members on mount
  useEffect(() => {
    const fetchDevelopers = async () => {
      // Need a valid team ID to fetch members
      if (!currentTeamId) {
        setIsLoading(false);
        setError('No team selected');
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

        // Filter: Only ACTIVE members with DEVELOPER role (business rule)
        const activeDevelopers = members.filter(
          (m) => m.status === 'active' && m.role === 'developer'
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

  const handleAssign = async (value: string) => {
    // "unassigned" special value = null
    const userId = value === 'unassigned' ? null : value;

    const success = await onAssign(userId);

    if (!success && error) {
      // Optionally show error toast
      console.error('Failed to assign ticket:', error);
    }
  };

  // Find assigned developer for display name
  const assignedDev = developers.find((d) => d.userId === assignedTo);
  const displayValue = assignedTo === null ? 'unassigned' : assignedTo;

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-[var(--text-secondary)]">
        Assigned To
      </label>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      <Select
        value={displayValue}
        onValueChange={handleAssign}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="w-full">
          <SelectValue>
            {isLoading ? (
              <span className="text-[var(--text-tertiary)]">Loading...</span>
            ) : assignedTo === null ? (
              <span className="text-[var(--text-tertiary)]">Unassigned</span>
            ) : (
              <span>
                {assignedDev?.displayName || assignedDev?.email || 'Unknown'}
              </span>
            )}
          </SelectValue>
        </SelectTrigger>

        <SelectContent>
          {/* Unassigned option */}
          <SelectItem value="unassigned">
            <span className="text-[var(--text-tertiary)]">Unassigned</span>
          </SelectItem>

          {/* Active developers */}
          {developers.map((dev) => (
            <SelectItem key={dev.userId} value={dev.userId}>
              <div className="flex items-center gap-2">
                <span>{dev.displayName || dev.email}</span>
                {dev.userId === assignedTo && (
                  <span className="text-xs text-[var(--text-tertiary)]">
                    (current)
                  </span>
                )}
              </div>
            </SelectItem>
          ))}

          {/* Empty state */}
          {developers.length === 0 && !isLoading && (
            <div className="px-2 py-1.5 text-xs text-[var(--text-tertiary)]">
              No active developers in team
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
