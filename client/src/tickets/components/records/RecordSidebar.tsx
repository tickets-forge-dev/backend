'use client';

import type { AECResponse } from '@/services/ticket.service';

interface RecordSidebarProps {
  tickets: AECResponse[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function RecordSidebar({ tickets, selectedId, onSelect }: RecordSidebarProps) {
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
        />
      </div>

      {/* Mobile: compact horizontal row */}
      <div className="lg:hidden border border-[var(--border-subtle)] rounded-lg p-3">
        <div className="flex justify-between text-[10px] text-[var(--text-tertiary)]">
          <span>Records <span className="text-[var(--text-primary)] font-semibold">{tickets.length}</span></span>
          <span>Files <span className="text-[var(--text-primary)] font-semibold">{totalFiles}</span></span>
          <span>Added <span className="text-green-500 font-semibold">+{totalAdded}</span></span>
          <span>Removed <span className="text-red-500 font-semibold">-{totalRemoved}</span></span>
          <span>Divergences <span className="text-[var(--text-primary)] font-semibold">{totalDivergences}</span></span>
        </div>
      </div>
    </>
  );
}

function SidebarContent({
  count, totalFiles, totalAdded, totalRemoved, totalDivergences, latest, selectedId, onSelect,
}: {
  count: number; totalFiles: number; totalAdded: number; totalRemoved: number; totalDivergences: number;
  latest: AECResponse[]; selectedId: string | null; onSelect: (id: string) => void;
}) {
  const stats = [
    { label: 'Records', value: String(count), color: 'text-[var(--text-primary)]' },
    { label: 'Files', value: String(totalFiles), color: 'text-[var(--text-primary)]' },
    { label: 'Added', value: `+${totalAdded}`, color: 'text-green-500' },
    { label: 'Removed', value: `-${totalRemoved}`, color: 'text-red-500' },
    { label: 'Divergences', value: String(totalDivergences), color: 'text-[var(--text-primary)]' },
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

      <div className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-1.5">Latest</div>
      <div className="flex flex-col gap-[2px]">
        {latest.map((t) => (
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
            <div className="text-[8px] text-[var(--text-tertiary)] mt-[1px]">
              {formatDate(t.changeRecord!.submittedAt)} · {t.changeRecord!.filesChanged.length} files
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
