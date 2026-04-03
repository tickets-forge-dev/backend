'use client';

import type { AECResponse } from '@/services/ticket.service';
import { useTeamStore } from '@/teams/stores/team.store';
import { useChangeRecordsStore } from '@/tickets/stores/change-records.store';
import { User } from 'lucide-react';

interface RecordSidebarProps {
  tickets: AECResponse[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function useResolveName() {
  const teamMembers = useTeamStore((s) => s.teamMembers);
  return (userId: string | null): string | null => {
    if (!userId) return null;
    const member = teamMembers.find((m) => m.userId === userId);
    return member?.displayName || member?.email?.split('@')[0] || null;
  };
}

const SHOW_NAMES_LABELS: Record<string, string> = {
  off: 'Names off',
  creator: 'Creator',
  developer: 'Developer',
  both: 'Both',
};

export function RecordSidebar({ tickets, selectedId, onSelect }: RecordSidebarProps) {
  const resolveName = useResolveName();
  const showNames = useChangeRecordsStore((s) => s.showNames);
  const cycleShowNames = useChangeRecordsStore((s) => s.cycleShowNames);

  const totalFiles = tickets.reduce((s, t) => s + t.changeRecord!.filesChanged.length, 0);
  const totalAdded = tickets.reduce((s, t) => s + t.changeRecord!.filesChanged.reduce((a, f) => a + f.additions, 0), 0);
  const totalRemoved = tickets.reduce((s, t) => s + t.changeRecord!.filesChanged.reduce((a, f) => a + f.deletions, 0), 0);
  const totalDivergences = tickets.filter((t) => t.changeRecord!.hasDivergence).length;

  const latest = [...tickets]
    .sort((a, b) => new Date(b.changeRecord!.submittedAt).getTime() - new Date(a.changeRecord!.submittedAt).getTime())
    .slice(0, 5);

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block w-[160px] shrink-0 border-l border-[var(--border-subtle)] pl-4 py-5 pr-3">
        <SidebarContent
          count={tickets.length}
          totalFiles={totalFiles}
          totalAdded={totalAdded}
          totalRemoved={totalRemoved}
          totalDivergences={totalDivergences}
          latest={latest}
          selectedId={selectedId}
          onSelect={onSelect}
          resolveName={resolveName}
          showNames={showNames}
          onCycleNames={cycleShowNames}
        />
      </div>

      {/* Mobile: compact horizontal row */}
      <div className="lg:hidden border border-[var(--border-subtle)] rounded-lg p-3">
        <div className="flex justify-between text-[10px] text-[var(--text-tertiary)]">
          <span>Records <span className="text-[var(--text-primary)] font-semibold">{tickets.length}</span></span>
          <span>Files <span className="text-[var(--text-primary)] font-semibold">{totalFiles}</span></span>
          <span>Added <span className="text-green-500 font-semibold">+{totalAdded}</span></span>
          <span>Removed <span className="text-red-500 font-semibold">-{totalRemoved}</span></span>
        </div>
      </div>
    </>
  );
}

function SidebarContent({
  count, totalFiles, totalAdded, totalRemoved, totalDivergences, latest, selectedId, onSelect, resolveName, showNames, onCycleNames,
}: {
  count: number; totalFiles: number; totalAdded: number; totalRemoved: number; totalDivergences: number;
  latest: AECResponse[]; selectedId: string | null; onSelect: (id: string) => void;
  resolveName: (userId: string | null) => string | null;
  showNames: 'off' | 'creator' | 'developer' | 'both';
  onCycleNames: () => void;
}) {
  const stats = [
    { label: 'Records', value: String(count), color: 'text-[var(--text-primary)]' },
    { label: 'Files', value: String(totalFiles), color: 'text-[var(--text-primary)]' },
    { label: 'Added', value: `+${totalAdded}`, color: 'text-green-500' },
    { label: 'Removed', value: `-${totalRemoved}`, color: 'text-red-500' },
  ];

  return (
    <>
      <div className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-2">Overview</div>
      <div className="mb-4">
        {stats.map((s) => (
          <div key={s.label} className="flex justify-between py-[3px] border-b border-[rgba(255,255,255,0.04)] last:border-0">
            <span className="text-[10px] text-[var(--text-tertiary)]">{s.label}</span>
            <span className={`text-[11px] font-semibold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium">Latest</div>
        <button
          onClick={onCycleNames}
          className={`h-5 flex items-center gap-1 px-1.5 rounded-full transition-colors ${
            showNames !== 'off'
              ? 'bg-purple-500/10 text-purple-500'
              : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]'
          }`}
          title={`Show: ${SHOW_NAMES_LABELS[showNames]}`}
        >
          <User className="w-2.5 h-2.5" />
          {showNames !== 'off' && (
            <span className="text-[8px] font-medium">{SHOW_NAMES_LABELS[showNames]}</span>
          )}
        </button>
      </div>
      <div className="flex flex-col gap-[2px]">
        {latest.map((t) => {
          const creatorName = resolveName(t.createdBy) || t.createdByName || null;
          const devName = resolveName(t.assignedTo);

          let nameLabel: string | null = null;
          if (showNames === 'creator') {
            nameLabel = creatorName;
          } else if (showNames === 'developer') {
            nameLabel = devName || (creatorName ? `${creatorName}` : null);
          } else if (showNames === 'both') {
            if (creatorName && devName && creatorName !== devName) {
              nameLabel = `${creatorName} → ${devName}`;
            } else {
              nameLabel = devName || creatorName;
            }
          }

          return (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={`text-left px-[7px] py-[5px] rounded transition-colors ${
                selectedId === t.id
                  ? 'border border-purple-500/10 bg-purple-500/[0.03]'
                  : 'border border-transparent hover:bg-[var(--bg-hover)]'
              }`}
            >
              <div className={`text-[10px] truncate ${
                selectedId === t.id ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
              }`}>
                {t.title}
              </div>
              {nameLabel && (
                <div className="text-[8px] text-purple-500/70 mt-[1px] truncate">
                  {nameLabel}
                </div>
              )}
              <div className="text-[8px] text-[var(--text-tertiary)] mt-[1px]">
                {formatDate(t.changeRecord!.submittedAt)} · {t.changeRecord!.filesChanged.length} files
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
