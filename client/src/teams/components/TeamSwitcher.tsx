'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown, Loader2, Plus, Settings, Users } from 'lucide-react';
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
import Link from 'next/link';

/**
 * TeamSwitcher Component
 *
 * Dropdown component for switching between teams.
 * Shows current team name, role badge, and list of available teams.
 */
export function TeamSwitcher() {
  const router = useRouter();
  const { sidebarCollapsed } = useUIStore();
  const { teams, currentTeam, isLoading, isSwitching, error, loadTeams, switchTeam, switchToPersonal } = useTeamStore();

  // Get currentTeamId from currentTeam (ensures reactivity)
  const currentTeamId = currentTeam?.id || null;

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

  const handleSwitchToPersonal = async () => {
    try {
      await switchToPersonal();
      setDropdownOpen(false);
      router.push('/tickets');
    } catch (err) {
      console.error('Failed to switch to personal workspace:', err);
    }
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
          Failed to load projects
        </div>
      </div>
    );
  }

  const currentTeamName = currentTeam?.name || 'Personal Workspace';
  const isOwner = currentTeam?.isOwner ?? false;

  return (
    <div className="px-2.5 pb-2">
      <span className={cn(
        'text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]/50 px-2 mb-1 block whitespace-nowrap transition-[opacity,transform] duration-200',
        sidebarCollapsed ? 'opacity-0 -translate-x-1' : 'opacity-100 translate-x-0'
      )}>
        Project
      </span>
      <div className="flex items-center">
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              disabled={isSwitching}
              className={cn(
                'flex-1 min-w-0 gap-1 py-1 h-auto',
                sidebarCollapsed ? 'justify-center px-0' : 'justify-start px-2'
              )}
            >
              {/* Icon shown only when collapsed */}
              <span className={cn(
                'flex-shrink-0 transition-opacity duration-200',
                sidebarCollapsed ? 'opacity-100 w-3.5' : 'opacity-0 w-0 overflow-hidden'
              )}>
                {isSwitching ? (
                  <Loader2 className="h-3.5 w-3.5 text-[var(--text-tertiary)] animate-spin" />
                ) : (
                  <Users className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                )}
              </span>
              {/* Text shown when expanded */}
              <span className={cn(
                'text-[13px] text-[var(--text-secondary)] truncate whitespace-nowrap transition-[opacity,transform] duration-200',
                sidebarCollapsed ? 'opacity-0 -translate-x-1' : 'opacity-100 translate-x-0'
              )}>
                {currentTeamName}
              </span>
              <span className={cn(
                'flex-shrink-0 transition-opacity duration-200',
                sidebarCollapsed ? 'opacity-0' : 'opacity-100'
              )}>
                {isSwitching ? (
                  <Loader2 className="h-3 w-3 text-[var(--text-tertiary)] animate-spin" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-[var(--text-tertiary)]" />
                )}
              </span>
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
            Switch Project
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {/* Personal Workspace Option */}
          <DropdownMenuItem
            onClick={handleSwitchToPersonal}
            className="cursor-pointer flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              {!teams.some((t) => t.isCurrent) && <Check className="h-4 w-4 text-[var(--primary)]" />}
              <span className="text-[13px] text-[var(--text-secondary)] truncate">Personal Workspace</span>
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
              No projects available
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
                  <span className="text-[13px] text-[var(--text-secondary)] truncate">{team.name}</span>
                </div>
                <Badge
                  variant="outline"
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
                <span className="text-[13px] text-[var(--text-secondary)]">Create Project</span>
              </DropdownMenuItem>
            }
            onSuccess={() => {
              setDropdownOpen(false);
            }}
          />
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Team settings gear icon - only shown when a team is selected */}
      {currentTeam && (
        <Link
          href={`/teams/${currentTeam.id}`}
          title="Project settings"
          className={cn(
            'flex items-center justify-center rounded-md p-1 flex-shrink-0 transition-[opacity,colors] duration-200',
            'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]',
            sidebarCollapsed ? 'opacity-0 pointer-events-none w-0 overflow-hidden' : 'opacity-100'
          )}
        >
          <Settings className="h-3.5 w-3.5" />
        </Link>
      )}
      </div>
    </div>
  );
}
