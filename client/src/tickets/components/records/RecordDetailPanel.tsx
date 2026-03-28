'use client';

import { useRouter } from 'next/navigation';
import type { AECResponse } from '@/services/ticket.service';
import { useTeamStore } from '@/teams/stores/team.store';
import { useChangeRecordsStore } from '@/tickets/stores/change-records.store';
import { DivergenceCard } from '../detail/DivergenceCard';
import { ExternalLink, CheckCircle2, FileCode2, GitBranch } from 'lucide-react';

interface RecordDetailPanelProps {
  ticket: AECResponse;
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

export function RecordDetailPanel({ ticket }: RecordDetailPanelProps) {
  const router = useRouter();
  const cr = ticket.changeRecord!;
  const resolveName = useResolveName();
  const showNames = useChangeRecordsStore((s) => s.showNames);

  const creatorName = resolveName(ticket.createdBy) || ticket.createdByName || null;
  const devName = resolveName(ticket.assignedTo);

  const nameParts: string[] = [];
  if ((showNames === 'creator' || showNames === 'both') && creatorName) {
    nameParts.push(`Created by ${creatorName}`);
  }
  if ((showNames === 'developer' || showNames === 'both') && (devName || creatorName)) {
    nameParts.push(`Developed by ${devName || creatorName}`);
  }

  const totalAdded = cr.filesChanged.reduce((s, f) => s + f.additions, 0);
  const totalRemoved = cr.filesChanged.reduce((s, f) => s + f.deletions, 0);
  const totalLines = totalAdded + totalRemoved;
  const turnaround = formatDuration(ticket.approvedAt, cr.submittedAt);

  return (
    <div
      key={ticket.id}
      className="border border-[var(--border-subtle)] rounded-lg overflow-hidden animate-[recordSlideIn_200ms_ease-out]"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
        <div className="flex items-start justify-between gap-3">
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
      </div>

      {/* Quick stats bar */}
      <div className="px-4 py-2.5 border-b border-[var(--border-subtle)] flex items-center gap-5 text-[10px] text-[var(--text-tertiary)]">
        <div className="flex items-center gap-1.5">
          <FileCode2 className="w-3 h-3" />
          <span className="text-[var(--text-secondary)] font-medium">{cr.filesChanged.length}</span>
          <span>files</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-medium">+{totalAdded}</span>
          <span className="font-medium">-{totalRemoved}</span>
        </div>
        {cr.hasDivergence && (
          <div className="flex items-center gap-1">
            <span>{cr.divergences.length} divergence{cr.divergences.length !== 1 ? 's' : ''}</span>
          </div>
        )}
        {/* Git branch link */}
        {ticket.implementationBranch && ticket.repositoryContext && (
          <a
            href={`https://github.com/${ticket.repositoryContext.repositoryFullName}/tree/${ticket.implementationBranch}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-[var(--text-secondary)] transition-colors ml-auto"
          >
            <GitBranch className="w-3 h-3" />
            <span className="font-mono truncate max-w-[140px]">{ticket.implementationBranch}</span>
          </a>
        )}
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Summary */}
        <div>
          <div className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-1">Summary</div>
          <div className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{cr.executionSummary}</div>
        </div>

        {/* Acceptance Criteria check */}
        {ticket.acceptanceCriteria && ticket.acceptanceCriteria.length > 0 && (
          <div>
            <div className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-1">
              Acceptance Criteria <span className="font-normal">({ticket.acceptanceCriteria.length})</span>
            </div>
            <div className="space-y-1">
              {ticket.acceptanceCriteria.map((ac, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[10px]">
                  <CheckCircle2 className="w-3 h-3 text-green-500/50 shrink-0 mt-px" />
                  <span className="text-[var(--text-secondary)]">{ac}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review note (if changes were requested) */}
        {cr.reviewNote && (
          <div className="bg-red-500/5 border border-red-500/10 rounded-md px-3 py-2">
            <div className="text-[9px] uppercase tracking-wider text-red-500/70 font-medium mb-0.5">Review Note</div>
            <div className="text-[11px] text-[var(--text-secondary)]">{cr.reviewNote}</div>
          </div>
        )}

        {/* Divergences */}
        {cr.divergences.length > 0 && (
          <div>
            <div className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-1.5">
              Divergences
            </div>
            <div className="space-y-1.5">
              {cr.divergences.map((d, i) => (
                <DivergenceCard key={i} divergence={d} />
              ))}
            </div>
          </div>
        )}

        {/* Decisions & Risks — combined, risks first for visibility */}
        {(cr.decisions.length > 0 || cr.risks.length > 0 || cr.scopeChanges.length > 0) && (
          <div>
            <div className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-1.5">Events</div>
            <div className="space-y-1.5">
              {cr.risks.map((e) => (
                <div key={e.id} className="flex gap-1.5 text-[10px]">
                  <span className="shrink-0">⚠️</span>
                  <span><span className="text-[var(--text-primary)]">{e.title}</span> <span className="text-[var(--text-tertiary)]">— {e.description}</span></span>
                </div>
              ))}
              {cr.scopeChanges.map((e) => (
                <div key={e.id} className="flex gap-1.5 text-[10px]">
                  <span className="shrink-0">📐</span>
                  <span><span className="text-[var(--text-primary)]">{e.title}</span> <span className="text-[var(--text-tertiary)]">— {e.description}</span></span>
                </div>
              ))}
              {cr.decisions.map((e) => (
                <div key={e.id} className="flex gap-1.5 text-[10px]">
                  <span className="shrink-0">💡</span>
                  <span><span className="text-[var(--text-primary)]">{e.title}</span> <span className="text-[var(--text-tertiary)]">— {e.description}</span></span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Files — collapsible for cleanliness */}
        {cr.filesChanged.length > 0 && (
          <details className="border-t border-[var(--border-subtle)] pt-3 group">
            <summary className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium cursor-pointer hover:text-[var(--text-secondary)] transition-colors select-none">
              Files changed <span className="font-normal">{cr.filesChanged.length}</span>
              <span className="ml-1 text-[8px] opacity-50 group-open:hidden">▸</span>
              <span className="ml-1 text-[8px] opacity-50 hidden group-open:inline">▾</span>
            </summary>
            <div className="space-y-0.5 font-mono text-[9px] mt-1.5">
              {cr.filesChanged.map((f, i) => {
                const canLink = ticket.repositoryContext && ticket.implementationBranch;
                const githubUrl = canLink
                  ? `https://github.com/${ticket.repositoryContext!.repositoryFullName}/blob/${ticket.implementationBranch}/${f.path}`
                  : null;

                return (
                  <div key={i} className="flex justify-between text-[var(--text-tertiary)] group/file">
                    {githubUrl ? (
                      <a
                        href={githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate hover:text-purple-400 transition-colors"
                      >
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
      </div>
    </div>
  );
}
