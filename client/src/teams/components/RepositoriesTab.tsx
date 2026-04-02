'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/core/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import { GitBranch, Plus, MoreVertical, Trash2 } from 'lucide-react';
import { useTeamStore } from '@/teams/stores/team.store';
import { AddRepositoryDialog } from './AddRepositoryDialog';

interface RepositoriesTabProps {
  teamId: string;
  isOwner: boolean;
}

function getRoleBadgeClass(role: 'backend' | 'frontend' | 'shared'): string {
  switch (role) {
    case 'backend':
      return 'bg-violet-500/10 text-violet-500';
    case 'frontend':
      return 'bg-blue-500/10 text-blue-500';
    case 'shared':
      return 'bg-teal-500/10 text-teal-500';
  }
}

function getRoleLabel(role: 'backend' | 'frontend' | 'shared'): string {
  switch (role) {
    case 'backend':
      return 'Backend';
    case 'frontend':
      return 'Frontend';
    case 'shared':
      return 'Shared';
  }
}

/**
 * GitHub mark SVG — same mark used elsewhere in the codebase
 */
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

/**
 * RepositoriesTab Component
 *
 * Lists repositories configured for this project and allows owners to
 * add, update, or remove them.
 */
export function RepositoriesTab({ teamId, isOwner }: RepositoriesTabProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const { teamRepositories, isLoadingRepos, loadTeamRepositories, removeTeamRepository } =
    useTeamStore();

  useEffect(() => {
    loadTeamRepositories(teamId);
  }, [teamId, loadTeamRepositories]);

  const handleRemove = async (repoFullName: string) => {
    await removeTeamRepository(teamId, repoFullName);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[var(--text-lg)] font-semibold text-[var(--text)]">Repositories</h3>
          <p className="mt-1 text-[13px] text-[var(--text-tertiary)]">
            Configure GitHub repositories for this project and their roles
          </p>
        </div>
        {isOwner && (
          <Button
            onClick={() => setAddDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add repository
          </Button>
        )}
      </div>

      {/* Repository List */}
      {isLoadingRepos ? (
        <div className="py-12 text-center text-[13px] text-[var(--text-tertiary)]">
          Loading repositories...
        </div>
      ) : teamRepositories.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] py-16 text-center">
          <GitHubIcon className="mb-3 h-8 w-8 text-[var(--text-tertiary)]" />
          <p className="text-[13px] font-medium text-[var(--text-secondary)]">
            No repositories configured
          </p>
          <p className="mt-1 text-[12px] text-[var(--text-tertiary)]">
            Connect GitHub repositories so the AI knows which codebase to work in.
          </p>
          {isOwner && (
            <Button
              onClick={() => setAddDialogOpen(true)}
              className="mt-4 flex items-center gap-2"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              Add your first repository
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {teamRepositories.map((repo) => (
            <div
              key={repo.repositoryFullName}
              className="flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] px-4 py-3"
            >
              {/* GitHub icon */}
              <GitHubIcon className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]" />

              {/* Repo name */}
              <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--text-secondary)]">
                {repo.repositoryFullName}
              </span>

              {/* Role badge */}
              <span
                className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium ${getRoleBadgeClass(repo.role)}`}
              >
                {getRoleLabel(repo.role)}
              </span>

              {/* Default branch */}
              <span className="flex shrink-0 items-center gap-1 font-mono text-[11px] text-[var(--text-tertiary)]">
                <GitBranch className="h-3 w-3" />
                {repo.defaultBranch}
              </span>

              {/* Actions (owner only) */}
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="shrink-0 rounded p-1 text-[var(--text-tertiary)] transition-colors hover:bg-zinc-800/50 hover:text-[var(--text-secondary)]">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-500 focus:text-red-500"
                      onClick={() => handleRemove(repo.repositoryFullName)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Repository Dialog */}
      <AddRepositoryDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        teamId={teamId}
      />
    </div>
  );
}
