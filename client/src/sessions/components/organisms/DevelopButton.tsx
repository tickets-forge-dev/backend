'use client';

import { useState } from 'react';
import { Play, Zap, ArrowRight, GitBranch, ChevronDown } from 'lucide-react';
import { useSessionStore } from '../../stores/session.store';
import { useSkillsStore } from '../../stores/skills.store';
import { SkillPicker } from '../molecules/SkillPicker';

interface RepoInfo {
  repositoryFullName: string;
  isPrimary: boolean;
  role?: string;
}

interface DevelopButtonProps {
  ticketId: string;
  ticketStatus: string;
  onStart: (skillIds?: string[], repoFullName?: string) => void;
  /** Number of file changes from the ticket's tech spec */
  fileChangeCount?: number;
  /** Repository full name (owner/repo) — single repo fallback */
  repoFullName?: string;
  /** Branch that will be created */
  branch?: string;
  /** All repositories linked to this ticket */
  repositories?: RepoInfo[];
  /** Callback to open the repo connection dialog */
  onConnectRepo?: () => void;
}

export function DevelopButton({ ticketId, ticketStatus, onStart, repoFullName, onConnectRepo, repositories }: DevelopButtonProps) {
  const { status } = useSessionStore();
  const { getEffectiveSkillIds } = useSkillsStore();
  const isLoading = status === 'provisioning' || status === 'running';
  const isDisabled = isLoading;

  // Normalize repos list — fall back to single repoFullName
  const repos: RepoInfo[] = repositories && repositories.length > 0
    ? repositories
    : repoFullName
      ? [{ repositoryFullName: repoFullName, isPrimary: true }]
      : [];

  const hasRepo = repos.length > 0;
  const primaryRepo = repos.find(r => r.isPrimary) || repos[0];
  const [selectedRepo, setSelectedRepo] = useState<string>(primaryRepo?.repositoryFullName || '');

  const handleStart = () => {
    const skillIds = getEffectiveSkillIds();
    onStart(skillIds, repos.length > 1 ? selectedRepo : undefined);
  };

  return (
    <div className="flex flex-col items-center h-full min-h-[400px] pt-[15%] px-6">
      <div className="w-full max-w-sm space-y-5">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 mb-1">
            <Zap className="w-5 h-5 text-emerald-500" />
          </div>
          <h3 className="text-[15px] font-semibold text-[var(--text)]">
            Start development
          </h3>
          <p className="text-[13px] text-[var(--text-tertiary)] leading-relaxed">
            AI will implement, test, and open a PR.
          </p>
        </div>

        {/* Repo connection prompt */}
        {!hasRepo && (
          <div className="rounded-lg border border-amber-500/15 bg-amber-500/5 p-3.5">
            <div className="flex items-start gap-2.5">
              <GitBranch className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-[12px] font-medium text-[var(--text)]">
                  Connect a repository
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  A GitHub repository is required for the AI agent to clone, implement, and push changes.
                </p>
                {onConnectRepo && (
                  <button
                    onClick={onConnectRepo}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] text-[11px] font-medium text-[var(--text)] transition-colors"
                  >
                    <GitBranch className="w-3 h-3" />
                    Connect Repository
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Repo picker — only when multiple repos */}
        {repos.length > 1 && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Target repository
            </label>
            <div className="relative">
              <select
                value={selectedRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                className="w-full appearance-none rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] px-3 py-2 pr-8 text-[12px] text-[var(--text)] transition-colors hover:bg-[var(--bg-active)] focus:outline-none focus:border-[var(--text-tertiary)]"
              >
                {repos.map((repo) => (
                  <option key={repo.repositoryFullName} value={repo.repositoryFullName}>
                    {repo.repositoryFullName.split('/').pop()}
                    {repo.isPrimary ? ' (primary)' : ''}
                    {repo.role ? ` — ${repo.role}` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-tertiary)] pointer-events-none" />
            </div>
          </div>
        )}

        {/* Skill Picker */}
        <SkillPicker ticketId={ticketId} />

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={isDisabled || !hasRepo}
          className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--bg-hover)] border border-[var(--border-subtle)] hover:bg-[var(--bg-active)] text-[var(--text)] text-[13px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Play className="w-3.5 h-3.5" fill="currentColor" />
          Start Development
          <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-50" />
        </button>
      </div>
    </div>
  );
}
