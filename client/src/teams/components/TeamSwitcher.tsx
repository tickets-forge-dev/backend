'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown, Loader2, Plus, Users } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import { Badge } from '@/core/components/ui/badge';
import { useTeamStore } from '@/teams/stores/team.store';
import { useUIStore } from '@/stores/ui.store';
import { CreateTeamDialog } from './CreateTeamDialog';
import { cn } from '@/lib/utils';

/**
 * TeamSwitcher Component
 *
 * Dropdown component for switching between teams.
 * Shows current team name, role badge, and list of available teams.
 */
export function TeamSwitcher() {
  const router = useRouter();
  const { sidebarCollapsed } = useUIStore();
  const { teams, currentTeamId, currentTeam, isLoading, isSwitching, error, loadTeams, switchTeam } =
    useTeamStore();

  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Load teams on mount
  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const handleSwitchTeam = async (teamId: string) => {
    if (teamId === currentTeamId) {
      // Same team clicked - navigate to tickets page
      router.push('/tickets');
      setDropdownOpen(false);
      return;
    }
    try {
      await switchTeam(teamId);
      setDropdownOpen(false);
      // Navigate to tickets page after successful switch
      router.push('/tickets');
    } catch (err) {
      console.error('Failed to switch team:', err);
    }
  };

  const handleSwitchToPersonal = () => {
    // Switch to personal workspace by clearing current team
    const { setCurrentTeam } = useTeamStore.getState();
    setCurrentTeam(null);
    setDropdownOpen(false);
    // Navigate to tickets page
    router.push('/tickets');
  };

  // Don't render if no teams loaded yet
  if (isLoading && teams.length === 0) {
    return null;
  }

  // Show error state briefly
  if (error && teams.length === 0) {
    return (
      <div className="border-b border-[var(--border)] p-3">
        <div className="text-[var(--text-xs)] text-[var(--text-tertiary)] text-center">
          Failed to load teams
        </div>
      </div>
    );
  }

  const currentTeamName = currentTeam?.name || 'Personal Workspace';
  const isOwner = currentTeam?.isOwner ?? false;

  return (
    <div className="border-b border-[var(--border)] p-3">
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            disabled={isSwitching}
            className={cn(
              'w-full gap-2 py-2 h-auto',
              sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-2'
            )}
          >
            {/* Left: Icon + Team Name */}
            <div className="flex items-center gap-2 min-w-0">
              {isSwitching && sidebarCollapsed ? (
                <Loader2 className="h-4 w-4 text-[var(--text-tertiary)] flex-shrink-0 animate-spin" />
              ) : (
                <Users className="h-4 w-4 text-[var(--text-tertiary)] flex-shrink-0" />
              )}
              {!sidebarCollapsed && (
                <span className="text-[var(--text-sm)] font-medium text-[var(--text)] truncate">
                  {currentTeamName}
                </span>
              )}
            </div>
            {/* Right: Role Badge + Chevron/Loader */}
            {!sidebarCollapsed && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Badge
                  variant={currentTeam ? (isOwner ? 'default' : 'secondary') : 'outline'}
                  className="text-[10px] px-1.5 py-0"
                >
                  {currentTeam ? (isOwner ? 'Owner' : 'Member') : 'Private'}
                </Badge>
                {isSwitching ? (
                  <Loader2 className="h-3.5 w-3.5 text-[var(--text-tertiary)] animate-spin" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                )}
              </div>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          side="right"
          alignOffset={-4}
          sideOffset={12}
          className="w-64 z-[var(--z-modal)]"
        >
          <DropdownMenuLabel className="text-[var(--text-xs)] text-[var(--text-tertiary)] font-normal">
            Switch Team
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {/* Personal Workspace Option */}
          <DropdownMenuItem
            onClick={handleSwitchToPersonal}
            className="cursor-pointer flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              {!currentTeamId && <Check className="h-4 w-4 text-[var(--primary)]" />}
              <span className="text-[var(--text-sm)] truncate">Personal Workspace</span>
            </div>
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 flex-shrink-0"
            >
              Private
            </Badge>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {/* Team List */}
          {teams.length === 0 ? (
            <div className="px-2 py-6 text-center text-[var(--text-sm)] text-[var(--text-tertiary)]">
              No teams available
            </div>
          ) : (
            teams.map((team) => (
              <DropdownMenuItem
                key={team.id}
                onClick={() => handleSwitchTeam(team.id)}
                className="cursor-pointer flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {team.isCurrent && <Check className="h-4 w-4 text-[var(--primary)]" />}
                  <span className="text-[var(--text-sm)] truncate">{team.name}</span>
                </div>
                <Badge
                  variant={team.isOwner ? 'default' : 'outline'}
                  className="text-[10px] px-1.5 py-0 flex-shrink-0"
                >
                  {team.isOwner ? 'Owner' : 'Member'}
                </Badge>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          {/* Create Team Dialog */}
          <CreateTeamDialog
            trigger={
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="text-[var(--text-sm)]">Create Team</span>
              </DropdownMenuItem>
            }
            onSuccess={() => {
              setDropdownOpen(false);
            }}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
