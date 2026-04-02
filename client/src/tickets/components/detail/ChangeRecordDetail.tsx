'use client';

import type { AECResponse } from '@/services/ticket.service';
import { useTeamStore } from '@/teams/stores/team.store';
import { DivergenceCard } from './DivergenceCard';
import { ExternalLink, CheckCircle2, FileCode2, GitBranch, GitCompareArrows, GitPullRequest, Play, Clock, User } from 'lucide-react';

/**
 * Unified change record detail — single source of truth for record display.
 *
 * - "standalone" (Records page): adds header with ticket title/link, stats bar, names
 * - "embedded" (Ticket detail page): no header (ticket context already visible)
 *
 * All content sections (summary, acceptance criteria, review notes,
 * divergences, events, files) are identical in both variants.
 */

interface ChangeRecordDetailProps {
  ticket: AECResponse;
  variant?: 'standalone' | 'embedded';
  showNames?: 'creator' | 'developer' | 'both' | 'none' | 'off';
  onPreview?: (repoFullName: string, branch: string) => void;
}

function useResolveName() {
  const teamMembers = useTeamStore((s) => s.teamMembers);
  return (userId: string | null): string | null => {
    if (!userId) return null;
    const member = teamMembers.find((m) => m.userId === userId);
    return member?.displayName || member?.email?.split('@')[0] || null;
  };
}

function formatDuration(startIso: string | null, endIso: string): string | null {
  if (!startIso) return null;
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (ms < 0) return null;
  const hours = Math.floor(ms / 3_600_000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h`;
  const mins = Math.floor(ms / 60_000);
  return `${mins}m`;
}

export function ChangeRecordDetail({ ticket, variant = 'embedded', showNames = 'none', onPreview }: ChangeRecordDetailProps) {
  const cr = ticket.changeRecord!;
  const resolveName = useResolveName();
  const isStandalone = variant === 'standalone';

  const creatorName = resolveName(ticket.createdBy) || ticket.createdByName || null;
  const devName = resolveName(ticket.assignedTo);
  const totalAdded = cr.filesChanged.reduce((s, f) => s + f.additions, 0);
  const totalRemoved = cr.filesChanged.reduce((s, f) => s + f.deletions, 0);
  const turnaround = formatDuration(ticket.approvedAt, cr.submittedAt);

  const nameParts: string[] = [];
  if ((showNames === 'creator' || showNames === 'both') && creatorName) {
    nameParts.push(`Created by ${creatorName}`);
  }
  if ((showNames === 'developer' || showNames === 'both') && (devName || creatorName)) {
    nameParts.push(`Developed by ${devName || creatorName}`);
  }

  const canLink = ticket.repositoryContext && ticket.implementationBranch;

  return (
    <div
      key={ticket.id}
      className={`border border-[var(--border-subtle)] rounded-lg overflow-hidden ${isStandalone ? 'animate-[recordSlideIn_200ms_ease-out]' : ''}`}
    >
      {/* Header — standalone only (provides ticket context) */}
      {isStandalone && (
        <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
              <span className="text-[9px] uppercase tracking-wider text-purple-500/60 font-medium">Selected Record</span>
            </div>
            <a
              href={`/tickets/${ticket.slug || ticket.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-medium text-[var(--text-primary)] hover:text-purple-400 transition-colors inline-flex items-center gap-1.5"
            >
              <span className="truncate">{ticket.title}</span>
              <ExternalLink className="w-3 h-3 opacity-40 shrink-0" />
            </a>
            <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5 flex items-center gap-2 flex-wrap">
              <span>Delivered {new Date(cr.submittedAt).toLocaleDateString()}</span>
              {turnaround && (
                <>
                  <span className="opacity-30">·</span>
                  <span>Turnaround {turnaround}</span>
                </>
              )}
              {nameParts.length > 0 && (
                <>
                  <span className="opacity-30">·</span>
                  <span className="text-purple-500/70">{nameParts.join(' · ')}</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick stats bar — standalone only, hidden when no file data */}
      {isStandalone && cr.filesChanged.length > 0 && (
        <div className="px-4 py-2.5 border-b border-[var(--border-subtle)] flex items-center gap-5 text-[10px] text-[var(--text-tertiary)]">
          <div className="flex items-center gap-1.5">
            <FileCode2 className="w-3 h-3" />
            <span className="text-[var(--text-secondary)] font-medium">{cr.filesChanged.length}</span>
            <span>files</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-emerald-500/70">+{totalAdded}</span>
            <span className="font-medium text-red-500/70">-{totalRemoved}</span>
          </div>
          {cr.hasDivergence && (
            <div className="flex items-center gap-1">
              <span>{cr.divergences.length} divergence{cr.divergences.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Content (identical in both variants) ── */}
      <div className={isStandalone ? 'px-4 py-3 space-y-4' : 'px-5 py-4 space-y-5'}>
        {/* Metadata row */}
        <div className="flex items-center gap-4 flex-wrap text-[11px] text-[var(--text-tertiary)]">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span>{new Date(cr.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <span className="opacity-40">·</span>
            <span>{new Date(cr.submittedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          {turnaround && (
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--text-secondary)] font-medium">{turnaround}</span>
              <span>turnaround</span>
            </div>
          )}
          {(devName || creatorName) && (
            <div className="flex items-center gap-1.5">
              <User className="w-3 h-3" />
              <span>{devName || creatorName}</span>
            </div>
          )}
        </div>

        {/* Summary */}
        <div>
          <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-1">Summary</div>
          <div className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{cr.executionSummary}</div>
        </div>

        {/* Acceptance Criteria */}
        {ticket.acceptanceCriteria && ticket.acceptanceCriteria.length > 0 && (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-1.5">
              Acceptance Criteria <span className="font-normal">({ticket.acceptanceCriteria.length})</span>
            </div>
            <div className="space-y-1">
              {ticket.acceptanceCriteria.map((ac, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[12px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500/50 shrink-0 mt-px" />
                  <span className="text-[var(--text-secondary)]">{ac}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review Note */}
        {cr.reviewNote && (
          <div className="bg-red-500/5 border border-red-500/10 rounded-md px-3 py-2">
            <div className="text-[11px] uppercase tracking-wider text-red-500/70 font-medium mb-0.5">Review Note</div>
            <div className="text-[13px] text-[var(--text-secondary)]">{cr.reviewNote}</div>
          </div>
        )}

        {/* Divergences */}
        {cr.divergences.length > 0 && (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-1.5">
              Divergences ({cr.divergences.length})
            </div>
            <div className="space-y-2">
              {cr.divergences.map((d, i) => (
                <DivergenceCard key={i} divergence={d} />
              ))}
            </div>
          </div>
        )}

        {/* Events */}
        {(cr.decisions.length > 0 || cr.risks.length > 0 || cr.scopeChanges.length > 0) && (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-1.5">Events</div>
            <div className="space-y-2">
              {cr.decisions.map((e) => (
                <div key={e.id} className="flex gap-2 text-[13px]">
                  <span className="shrink-0">💡</span>
                  <div>
                    <span className="font-medium text-[var(--text-primary)]">{e.title}</span>
                    <span className="text-[var(--text-tertiary)]"> — {e.description}</span>
                  </div>
                </div>
              ))}
              {cr.risks.map((e) => (
                <div key={e.id} className="flex gap-2 text-[13px]">
                  <span className="shrink-0">⚠️</span>
                  <div>
                    <span className="font-medium text-[var(--text-primary)]">{e.title}</span>
                    <span className="text-[var(--text-tertiary)]"> — {e.description}</span>
                  </div>
                </div>
              ))}
              {cr.scopeChanges.map((e) => (
                <div key={e.id} className="flex gap-2 text-[13px]">
                  <span className="shrink-0">📐</span>
                  <div>
                    <span className="font-medium text-[var(--text-primary)]">{e.title}</span>
                    <span className="text-[var(--text-tertiary)]"> — {e.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Files Changed — collapsible with GitHub links */}
        {cr.filesChanged.length > 0 && (
          <details className="border-t border-[var(--border-subtle)] pt-3 group">
            <summary className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium cursor-pointer hover:text-[var(--text-secondary)] transition-colors select-none">
              Files changed {cr.filesChanged.length}
              <span className="ml-1 text-[8px] opacity-50 group-open:hidden">▸</span>
              <span className="ml-1 text-[8px] opacity-50 hidden group-open:inline">▾</span>
            </summary>
            <div className="space-y-0.5 font-mono text-[12px] mt-1.5">
              {cr.filesChanged.map((f, i) => {
                const githubUrl = canLink
                  ? `https://github.com/${ticket.repositoryContext!.repositoryFullName}/blob/${ticket.implementationBranch}/${f.path}`
                  : null;
                return (
                  <div key={i} className="flex justify-between text-[var(--text-tertiary)]">
                    {githubUrl ? (
                      <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="truncate hover:text-purple-400 transition-colors">
                        {f.path}
                      </a>
                    ) : (
                      <span className="truncate">{f.path}</span>
                    )}
                    <span className="shrink-0 ml-2">
                      {f.additions > 0 && <span className="text-green-500">+{f.additions}</span>}
                      {f.deletions > 0 && <span className="text-red-500 ml-1">-{f.deletions}</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </details>
        )}

        {/* GitHub links */}
        {canLink && (
          <div className="border-t border-[var(--border-subtle)] pt-3 flex items-center gap-4 text-[11px] text-[var(--text-tertiary)]">
            <a
              href={`https://github.com/${ticket.repositoryContext!.repositoryFullName}/pulls?q=is%3Apr+head%3A${ticket.implementationBranch}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-violet-400 transition-colors"
            >
              <GitPullRequest className="w-3 h-3" />
              <span>Pull Request</span>
            </a>
            <a
              href={`https://github.com/${ticket.repositoryContext!.repositoryFullName}/tree/${ticket.implementationBranch}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-purple-400 transition-colors"
            >
              <GitBranch className="w-3 h-3" />
              <span className="font-mono">{ticket.implementationBranch}</span>
            </a>
            {ticket.repositoryContext!.commitSha && (
              <a
                href={`https://github.com/${ticket.repositoryContext!.repositoryFullName}/compare/${ticket.repositoryContext!.commitSha}...${ticket.implementationBranch}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-purple-400 transition-colors"
              >
                <GitCompareArrows className="w-3 h-3" />
                <span>View diff</span>
              </a>
            )}
            {onPreview && (
              <button
                onClick={() => onPreview(
                  ticket.repositoryContext!.repositoryFullName,
                  ticket.implementationBranch || ticket.repositoryContext!.branchName || 'main',
                )}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors ml-auto text-[11px] font-medium"
                title="Run project in browser"
              >
                <Play className="w-3 h-3" fill="currentColor" />
                <span>Run</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
