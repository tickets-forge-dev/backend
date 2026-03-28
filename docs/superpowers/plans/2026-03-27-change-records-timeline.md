# Change Records Timeline Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Change Records page as a horizontal timeline with zoomable dot/card views, date range filtering, stats sidebar, and help tooltip.

**Architecture:** The page is composed of small focused components: `ChangeRecordTimeline` (orchestrator with state), `TimelineAxis` (the purple-glowing horizontal line with dots/cards), `RecordDetailPanel` (selected record info), `RecordSidebar` (stats + latest), `DateRangeFilter`, `ZoomToggle`, and `RecordHelpButton`. All data comes from the existing `TicketService.list()` which is already project-scoped via the `x-team-id` header.

**Tech Stack:** Next.js 14 (app router), React 19, Tailwind CSS, TypeScript. No new dependencies.

---

### Task 1: Create ZoomToggle component

**Files:**
- Create: `client/src/tickets/components/records/ZoomToggle.tsx`

- [ ] **Step 1: Create the ZoomToggle component**

This is a small toggle switch that flips between dot mode and card mode.

```tsx
// client/src/tickets/components/records/ZoomToggle.tsx
'use client';

interface ZoomToggleProps {
  isCardMode: boolean;
  onToggle: () => void;
}

export function ZoomToggle({ isCardMode, onToggle }: ZoomToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5"
      aria-label={isCardMode ? 'Switch to dot view' : 'Switch to card view'}
    >
      {/* Dot icon */}
      <div className={`w-[5px] h-[5px] rounded-full transition-colors ${
        !isCardMode ? 'bg-[var(--text-secondary)]' : 'bg-[var(--text-tertiary)]'
      }`} />
      {/* Track */}
      <div className="w-[24px] h-[13px] bg-[var(--bg-hover)] rounded-full relative transition-colors">
        <div className={`w-[9px] h-[9px] rounded-full bg-[var(--text-secondary)] absolute top-[2px] transition-all duration-200 ${
          isCardMode ? 'left-[13px]' : 'left-[2px]'
        }`} />
      </div>
      {/* Card icon */}
      <div className={`w-[7px] h-[5px] rounded-[1px] transition-colors ${
        isCardMode ? 'bg-[var(--text-secondary)]' : 'bg-[var(--text-tertiary)]'
      }`} />
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/tickets/components/records/ZoomToggle.tsx
git commit -m "feat(records): add ZoomToggle component"
```

---

### Task 2: Create DateRangeFilter component

**Files:**
- Create: `client/src/tickets/components/records/DateRangeFilter.tsx`

- [ ] **Step 1: Create the DateRangeFilter component**

Two native date inputs styled to match the app. Emits `onChange` with from/to dates.

```tsx
// client/src/tickets/components/records/DateRangeFilter.tsx
'use client';

interface DateRangeFilterProps {
  from: string; // YYYY-MM-DD
  to: string;
  onChange: (from: string, to: string) => void;
}

export function DateRangeFilter({ from, to, onChange }: DateRangeFilterProps) {
  return (
    <div className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
      <input
        type="date"
        value={from}
        onChange={(e) => onChange(e.target.value, to)}
        className="bg-[var(--bg-subtle)] border border-[var(--border-subtle)] px-2 py-[3px] rounded text-[10px] text-[var(--text-secondary)] [color-scheme:dark]"
      />
      <span>–</span>
      <input
        type="date"
        value={to}
        onChange={(e) => onChange(from, e.target.value)}
        className="bg-[var(--bg-subtle)] border border-[var(--border-subtle)] px-2 py-[3px] rounded text-[10px] text-[var(--text-secondary)] [color-scheme:dark]"
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/tickets/components/records/DateRangeFilter.tsx
git commit -m "feat(records): add DateRangeFilter component"
```

---

### Task 3: Create RecordHelpButton component

**Files:**
- Create: `client/src/tickets/components/records/RecordHelpButton.tsx`

- [ ] **Step 1: Create the RecordHelpButton component**

A `?` button that toggles a popover with a plain-language explanation of what records are.

```tsx
// client/src/tickets/components/records/RecordHelpButton.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

export function RecordHelpButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-5 h-5 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
        aria-label="What are Change Records?"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-7 w-[280px] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-lg p-3 shadow-lg z-20">
          <div className="text-[11px] font-medium text-[var(--text-primary)] mb-1.5">
            What are Change Records?
          </div>
          <div className="text-[11px] text-[var(--text-tertiary)] leading-relaxed">
            Change Records capture what was built for each ticket — the summary of work done,
            any differences from the original plan, key decisions made along the way, and which
            files were changed. Think of it as a project changelog you can browse over time.
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/tickets/components/records/RecordHelpButton.tsx
git commit -m "feat(records): add RecordHelpButton tooltip component"
```

---

### Task 4: Create TimelineAxis component

**Files:**
- Create: `client/src/tickets/components/records/TimelineAxis.tsx`
- Delete: `client/src/tickets/components/records/TimelineStrip.tsx` (replaced)
- Delete: `client/src/tickets/components/records/TimelineRecordCard.tsx` (inlined)

- [ ] **Step 1: Create the TimelineAxis component**

The hero component — purple-glowing horizontal line with clickable dots that morph into cards when zoomed in.

```tsx
// client/src/tickets/components/records/TimelineAxis.tsx
'use client';

import { useRef, useEffect } from 'react';
import type { AECResponse } from '@/services/ticket.service';

interface TimelineAxisProps {
  tickets: AECResponse[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isCardMode: boolean;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function TimelineAxis({ tickets, selectedId, onSelect, isCardMode }: TimelineAxisProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to end (most recent) on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [tickets.length]);

  if (tickets.length === 0) return null;

  return (
    <div className="rounded-[10px] border border-[#8b5cf620] overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #110d1c 0%, #13101e 50%, var(--bg-subtle) 100%)' }}
    >
      {/* Subtle radial glow */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-1/2 h-[60px] bg-[radial-gradient(ellipse,#8b5cf60d,transparent_70%)]" />
        </div>

        <div ref={scrollRef} className="overflow-x-auto px-6 pt-6 pb-4 scrollbar-thin">
          <div className="relative min-w-max" style={{ minWidth: `${Math.max(tickets.length * 90, 300)}px` }}>
            {/* The glowing purple line */}
            <div
              className="absolute left-0 right-0 h-[1.5px]"
              style={{
                top: isCardMode ? '50%' : '24px',
                background: 'linear-gradient(90deg, var(--bg-hover), #7c3aed44 12%, #8b5cf6 40%, #a78bfa 55%, #8b5cf6 70%, #7c3aed44 88%, var(--bg-hover))',
                boxShadow: '0 0 6px #8b5cf622',
                transition: 'top 300ms ease-out',
              }}
            />

            {/* Dots / Cards */}
            <div className="relative flex justify-between" style={{ minHeight: isCardMode ? '120px' : '52px', transition: 'min-height 300ms ease-out' }}>
              {tickets.map((t, i) => {
                const cr = t.changeRecord!;
                const isSelected = t.id === selectedId;
                const isAbove = i % 2 === 0;
                const totalAdditions = cr.filesChanged.reduce((s, f) => s + f.additions, 0);
                const totalDeletions = cr.filesChanged.reduce((s, f) => s + f.deletions, 0);

                return (
                  <button
                    key={t.id}
                    onClick={() => onSelect(t.id)}
                    className="flex-1 flex flex-col items-center relative z-[1] group"
                    style={{
                      transitionDelay: `${i * 50}ms`,
                    }}
                  >
                    {/* DOT MODE */}
                    {!isCardMode && (
                      <>
                        <div className={`text-[8px] mb-[7px] transition-colors ${
                          isSelected ? 'text-[#c4b5fd] font-medium' : 'text-[#52525b]'
                        }`}>
                          {formatDate(cr.submittedAt)}
                        </div>
                        <div
                          className="rounded-full transition-all duration-300"
                          style={{
                            width: isSelected ? 8 : 6,
                            height: isSelected ? 8 : 6,
                            background: isSelected ? '#a78bfa' : '#8b5cf6',
                            boxShadow: isSelected
                              ? '0 0 0 2px #13101e, 0 0 0 3.5px #8b5cf644, 0 0 12px #8b5cf644'
                              : '0 0 4px #8b5cf633',
                            opacity: isSelected ? 1 : 0.7,
                          }}
                        />
                        <div className={`text-[7px] mt-[7px] max-w-[60px] truncate transition-colors ${
                          isSelected ? 'text-[#c4b5fd] font-medium' : 'text-[var(--text-tertiary)]'
                        }`}>
                          {t.title}
                        </div>
                      </>
                    )}

                    {/* CARD MODE */}
                    {isCardMode && (
                      <div className={`flex flex-col items-center ${isAbove ? 'justify-end pb-[18px]' : 'justify-start pt-[18px]'}`}
                        style={{ minHeight: '120px', order: 0 }}
                      >
                        {/* Card (above or below the line) */}
                        <div
                          className={`w-[100px] rounded-md border p-2 text-left transition-all duration-300 ${
                            isSelected
                              ? 'border-[#8b5cf644] bg-[#8b5cf608]'
                              : 'border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:border-[#8b5cf622]'
                          } ${isAbove ? 'mb-2' : 'mt-2'}`}
                          style={{ order: isAbove ? 0 : 2 }}
                        >
                          <div className={`text-[9px] font-medium truncate ${
                            isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                          }`}>
                            {t.title}
                          </div>
                          <div className="text-[7px] text-[var(--text-tertiary)] mt-0.5">
                            {cr.filesChanged.length} files
                            {(totalAdditions > 0 || totalDeletions > 0) && (
                              <> · <span className="text-green-500">+{totalAdditions}</span> <span className="text-red-500">-{totalDeletions}</span></>
                            )}
                          </div>
                          {cr.hasDivergence && (
                            <div className="text-[7px] text-amber-500 mt-0.5">⚡ divergence</div>
                          )}
                        </div>

                        {/* Dot on the line */}
                        <div
                          className="rounded-full shrink-0 transition-all duration-300"
                          style={{
                            width: isSelected ? 8 : 6,
                            height: isSelected ? 8 : 6,
                            background: isSelected ? '#a78bfa' : '#8b5cf6',
                            boxShadow: isSelected
                              ? '0 0 0 2px #13101e, 0 0 0 3.5px #8b5cf644, 0 0 12px #8b5cf644'
                              : '0 0 4px #8b5cf633',
                            opacity: isSelected ? 1 : 0.7,
                            order: 1,
                          }}
                        />

                        {/* Date label */}
                        <div className={`text-[7px] mt-1 ${isAbove ? '' : ''} ${
                          isSelected ? 'text-[#c4b5fd]' : 'text-[#52525b]'
                        }`} style={{ order: isAbove ? 2 : 0 }}>
                          {formatDate(cr.submittedAt)}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Delete old files**

```bash
rm client/src/tickets/components/records/TimelineStrip.tsx
rm client/src/tickets/components/records/TimelineRecordCard.tsx
```

- [ ] **Step 3: Commit**

```bash
git add client/src/tickets/components/records/TimelineAxis.tsx
git add -u client/src/tickets/components/records/TimelineStrip.tsx client/src/tickets/components/records/TimelineRecordCard.tsx
git commit -m "feat(records): add TimelineAxis with dot/card zoom modes

Replace TimelineStrip and TimelineRecordCard with a single TimelineAxis
component. Purple-glowing horizontal line with dots that morph into
alternating cards. Staggered transition animation."
```

---

### Task 5: Rewrite RecordDetailPanel as pure informational view

**Files:**
- Rewrite: `client/src/tickets/components/records/RecordDetailPanel.tsx`

- [ ] **Step 1: Rewrite RecordDetailPanel**

Purely informational — no accept/reject. Uses app card styling.

```tsx
// client/src/tickets/components/records/RecordDetailPanel.tsx
'use client';

import { useRouter } from 'next/navigation';
import type { AECResponse } from '@/services/ticket.service';
import { DivergenceCard } from '../detail/DivergenceCard';
import { ExternalLink } from 'lucide-react';

interface RecordDetailPanelProps {
  ticket: AECResponse;
}

export function RecordDetailPanel({ ticket }: RecordDetailPanelProps) {
  const router = useRouter();
  const cr = ticket.changeRecord!;

  return (
    <div className="border border-[var(--border-subtle)] rounded-lg overflow-hidden bg-[var(--bg-subtle)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
        <button
          onClick={() => router.push(`/tickets/${ticket.slug || ticket.id}`)}
          className="text-[13px] font-medium text-[var(--text-primary)] hover:text-purple-400 transition-colors inline-flex items-center gap-1.5"
        >
          {ticket.title}
          <ExternalLink className="w-3 h-3 opacity-40 shrink-0" />
        </button>
        <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
          Delivered {new Date(cr.submittedAt).toLocaleDateString()}
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Summary */}
        <div>
          <div className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-1">Summary</div>
          <div className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{cr.executionSummary}</div>
        </div>

        {/* Divergences */}
        {cr.divergences.length > 0 && (
          <div className="space-y-2">
            <div className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium">
              Divergences ({cr.divergences.length})
            </div>
            {cr.divergences.map((d, i) => (
              <DivergenceCard key={i} divergence={d} />
            ))}
          </div>
        )}

        {/* Execution Events */}
        {(cr.decisions.length > 0 || cr.risks.length > 0 || cr.scopeChanges.length > 0) && (
          <div>
            <div className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-1.5">Events</div>
            <div className="space-y-1.5">
              {cr.decisions.map((e) => (
                <div key={e.id} className="flex gap-1.5 text-[10px]">
                  <span className="shrink-0">💡</span>
                  <span><span className="text-[var(--text-primary)]">{e.title}</span> <span className="text-[var(--text-tertiary)]">— {e.description}</span></span>
                </div>
              ))}
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
            </div>
          </div>
        )}

        {/* Code Changes */}
        {cr.filesChanged.length > 0 && (
          <div className="border-t border-[var(--border-subtle)] pt-3">
            <div className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-1.5">
              Files <span className="font-normal">{cr.filesChanged.length}</span>
            </div>
            <div className="space-y-0.5 font-mono text-[9px]">
              {cr.filesChanged.map((f, i) => (
                <div key={i} className="flex justify-between text-[var(--text-tertiary)]">
                  <span className="truncate">{f.path}</span>
                  <span className="shrink-0 ml-2">
                    {f.additions > 0 && <span className="text-green-500">+{f.additions}</span>}
                    {f.deletions > 0 && <span className="text-red-500 ml-1">-{f.deletions}</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/tickets/components/records/RecordDetailPanel.tsx
git commit -m "feat(records): rewrite RecordDetailPanel as pure informational view

Remove accept/reject buttons, review note, and status indicators.
Records are historical — summary, divergences, events, files only."
```

---

### Task 6: Create RecordSidebar component

**Files:**
- Create: `client/src/tickets/components/records/RecordSidebar.tsx`

- [ ] **Step 1: Create the RecordSidebar component**

Compact 160px sidebar with overview stats and latest records list.

```tsx
// client/src/tickets/components/records/RecordSidebar.tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add client/src/tickets/components/records/RecordSidebar.tsx
git commit -m "feat(records): add RecordSidebar with overview stats and latest list"
```

---

### Task 7: Rewrite ChangeRecordTimeline orchestrator

**Files:**
- Rewrite: `client/src/tickets/components/records/ChangeRecordTimeline.tsx`

- [ ] **Step 1: Rewrite the ChangeRecordTimeline**

Orchestrates all sub-components: header, date range, zoom, timeline, detail panel, sidebar.

```tsx
// client/src/tickets/components/records/ChangeRecordTimeline.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { TicketService } from '@/services/ticket.service';
import type { AECResponse } from '@/services/ticket.service';
import { TimelineAxis } from './TimelineAxis';
import { RecordDetailPanel } from './RecordDetailPanel';
import { RecordSidebar } from './RecordSidebar';
import { DateRangeFilter } from './DateRangeFilter';
import { ZoomToggle } from './ZoomToggle';
import { RecordHelpButton } from './RecordHelpButton';
import { ClipboardList } from 'lucide-react';

function defaultDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export function ChangeRecordTimeline() {
  const [tickets, setTickets] = useState<AECResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCardMode, setIsCardMode] = useState(false);
  const [dateRange, setDateRange] = useState(defaultDateRange);

  const ticketService = useMemo(() => new TicketService(), []);

  useEffect(() => {
    (async () => {
      try {
        const all = await ticketService.list();
        const withRecords = all
          .filter((t) => t.changeRecord !== null)
          .sort(
            (a, b) =>
              new Date(a.changeRecord!.submittedAt).getTime() -
              new Date(b.changeRecord!.submittedAt).getTime(),
          );
        setTickets(withRecords);
        if (withRecords.length > 0) {
          setSelectedId(withRecords[withRecords.length - 1].id);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredTickets = useMemo(() => {
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    toDate.setHours(23, 59, 59, 999);
    return tickets.filter((t) => {
      const d = new Date(t.changeRecord!.submittedAt);
      return d >= fromDate && d <= toDate;
    });
  }, [tickets, dateRange]);

  const selectedTicket = tickets.find((t) => t.id === selectedId) ?? null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[var(--text-tertiary)] text-sm">Loading records...</div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <ClipboardList className="w-10 h-10 text-[var(--text-tertiary)] mb-3 opacity-40" />
        <div className="text-sm text-[var(--text-secondary)] mb-1">No Change Records yet</div>
        <div className="text-[13px] text-[var(--text-tertiary)]">
          Change Records appear here when tickets are delivered.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row">
      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-[var(--text-lg)] font-semibold text-[var(--text-primary)]">Change Records</h1>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
              A history of what was built, what changed, and why
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DateRangeFilter
              from={dateRange.from}
              to={dateRange.to}
              onChange={(from, to) => setDateRange({ from, to })}
            />
            <div className="w-px h-3 bg-[var(--border-subtle)]" />
            <ZoomToggle isCardMode={isCardMode} onToggle={() => setIsCardMode(!isCardMode)} />
            <RecordHelpButton />
          </div>
        </div>

        {/* Timeline */}
        <TimelineAxis
          tickets={filteredTickets}
          selectedId={selectedId}
          onSelect={setSelectedId}
          isCardMode={isCardMode}
        />

        {/* Selected record detail */}
        {selectedTicket && selectedTicket.changeRecord && (
          <RecordDetailPanel ticket={selectedTicket} />
        )}

        {/* Mobile sidebar (stacks below) */}
        {filteredTickets.length > 0 && (
          <div className="lg:hidden">
            <RecordSidebar tickets={filteredTickets} selectedId={selectedId} onSelect={setSelectedId} />
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      {filteredTickets.length > 0 && (
        <RecordSidebar tickets={filteredTickets} selectedId={selectedId} onSelect={setSelectedId} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/tickets/components/records/ChangeRecordTimeline.tsx
git commit -m "feat(records): rewrite ChangeRecordTimeline with timeline axis, sidebar, date range, zoom

Orchestrates all sub-components: TimelineAxis, RecordDetailPanel,
RecordSidebar, DateRangeFilter, ZoomToggle, RecordHelpButton.
Date range defaults to last 30 days. Project filtering via x-team-id."
```

---

### Task 8: Build, verify, and clean up

**Files:**
- Verify: all components render without errors

- [ ] **Step 1: Build the client**

```bash
cd client && rm -rf .next && npx next build --no-lint
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Fix any TypeScript or build errors**

If the build reports errors, fix them. Common issues:
- Import paths (ensure `@/` alias resolves)
- Missing `'use client'` directives
- Type mismatches with `AECResponse`

- [ ] **Step 3: Manual smoke test**

Start the dev server (`npm run dev` from the `client/` directory) and verify:
1. Navigate to `/records`
2. Timeline renders with purple-glowing line and dots
3. Clicking a dot selects it and shows the detail panel below
4. Zoom toggle switches between dot and card views with animation
5. Date range filter narrows the visible records
6. Help button shows the tooltip
7. Sidebar shows stats and latest records
8. Clicking a sidebar item selects the record on the timeline
9. Mobile: resize to 375px — header stacks, sidebar moves below, timeline scrolls

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore(records): clean up and verify Change Records timeline redesign"
```
