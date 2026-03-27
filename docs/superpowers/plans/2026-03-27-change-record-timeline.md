# Change Record Timeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a project-level "Records" page with a horizontal timeline showing all Change Records across tickets, with a detail panel for reviewing deliveries.

**Architecture:** Frontend-only — no new backend endpoints needed. The page fetches team tickets via the existing `TicketService.list()`, filters to those with a `changeRecord`, and renders a horizontal scrollable timeline. Selecting a record opens a detail panel with full Change Record content and Accept/Request Changes actions. Reuses existing `DivergenceCard` component and `reviewDelivery` API function.

**Tech Stack:** Next.js (App Router), React, Tailwind CSS, Lucide icons, `ticket.service.ts`

---

## Design Rules (CLAUDE.md section 4a — MANDATORY)

All components MUST follow these rules:
- Borders: `border border-[var(--border-subtle)]` — never hardcoded opacity
- Text: `text-[var(--text-primary)]`, `text-[var(--text-secondary)]`, `text-[var(--text-tertiary)]`
- Backgrounds: `bg-[var(--bg-primary)]`, `bg-[var(--bg-hover)]` — never raw hex
- Status badges: translucent (`bg-amber-500/10 text-amber-500`) — never solid fill
- Status dots: `w-2 h-2 rounded-full bg-{color}-500`
- Font sizes: `text-[13px]` body, `text-[12px]` meta, `text-[11px]` badges, `text-sm` headings
- Hover states on ALL interactive elements
- `transition-colors` on all hoverable items

---

## File Structure

**New files:**
- `client/app/(main)/records/page.tsx` — Route page shell (minimal, delegates to component)
- `client/src/tickets/components/records/ChangeRecordTimeline.tsx` — Main timeline page organism
- `client/src/tickets/components/records/TimelineStrip.tsx` — Horizontal scrollable timeline with date columns
- `client/src/tickets/components/records/TimelineRecordCard.tsx` — Expanded card on timeline (recent records)
- `client/src/tickets/components/records/RecordDetailPanel.tsx` — Bottom panel showing full Change Record

**Modified files:**
- `client/src/core/components/sidebar/SidebarNav.tsx` — Add "Records" navigation entry

---

### Task 1: Add "Records" route to sidebar navigation

**Files:**
- Modify: `client/src/core/components/sidebar/SidebarNav.tsx`

- [ ] **Step 1: Add ClipboardList icon import**

Add `ClipboardList` to the lucide-react import on line 6:

```typescript
import { LayoutGrid, Settings, MessageCircle, Search, User, ClipboardList } from 'lucide-react';
```

- [ ] **Step 2: Add Records navigation item**

In the `navigationItems` array (line 39-43), add the Records entry between Workspace and Profile:

```typescript
  const navigationItems = [
    { label: 'Workspace', href: '/tickets', icon: LayoutGrid },
    { label: 'Records', href: '/records', icon: ClipboardList },
    { label: 'Profile', href: '/profile', icon: User },
    { label: 'Settings', href: '/settings', icon: Settings, attention: hasProfileAttention },
  ];
```

- [ ] **Step 3: Commit**

```bash
git add client/src/core/components/sidebar/SidebarNav.tsx
git commit -m "feat: add Records entry to sidebar navigation"
```

---

### Task 2: Create TimelineRecordCard component

**Files:**
- Create: `client/src/tickets/components/records/TimelineRecordCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client';

import type { AECResponse } from '@/services/ticket.service';

interface TimelineRecordCardProps {
  ticket: AECResponse;
  isSelected: boolean;
  onClick: () => void;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function TimelineRecordCard({ ticket, isSelected, onClick }: TimelineRecordCardProps) {
  const cr = ticket.changeRecord!;
  const statusColor = cr.status === 'awaiting_review'
    ? 'bg-amber-500'
    : cr.status === 'accepted'
      ? 'bg-green-500'
      : 'bg-red-500';
  const statusLabel = cr.status === 'awaiting_review'
    ? 'Awaiting Review'
    : cr.status === 'accepted'
      ? 'Accepted'
      : 'Changes Requested';
  const statusTextColor = cr.status === 'awaiting_review'
    ? 'text-amber-500/70'
    : cr.status === 'accepted'
      ? 'text-green-500/70'
      : 'text-red-500/70';

  const totalAdditions = cr.filesChanged.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = cr.filesChanged.reduce((sum, f) => sum + f.deletions, 0);

  return (
    <button
      onClick={onClick}
      className={`w-[170px] text-left p-3 rounded-lg border transition-colors ${
        isSelected
          ? 'border-purple-500/40 bg-purple-500/5'
          : 'border-[var(--border-subtle)] bg-[var(--bg-hover)] hover:border-purple-500/20 hover:bg-purple-500/[0.03]'
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <div className={`w-[6px] h-[6px] rounded-full ${statusColor} shrink-0`} />
        <span className={`text-[11px] ${statusTextColor} truncate`}>{statusLabel}</span>
      </div>
      <div className="text-[13px] font-medium text-[var(--text-primary)] leading-tight mb-1.5 line-clamp-2">
        {ticket.title}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {cr.hasDivergence && (
          <span className="text-[10px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded">
            ⚡ Divergence
          </span>
        )}
        <span className="text-[10px] bg-[var(--bg-hover)] text-[var(--text-tertiary)] px-1.5 py-0.5 rounded">
          {cr.filesChanged.length} files
          {(totalAdditions > 0 || totalDeletions > 0) && (
            <> · +{totalAdditions} −{totalDeletions}</>
          )}
        </span>
      </div>
      <div className="text-[11px] text-[var(--text-tertiary)] mt-1.5">
        {formatTimeAgo(cr.submittedAt)}
      </div>
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/tickets/components/records/TimelineRecordCard.tsx
git commit -m "feat: add TimelineRecordCard component for timeline display"
```

---

### Task 3: Create RecordDetailPanel component

**Files:**
- Create: `client/src/tickets/components/records/RecordDetailPanel.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AECResponse } from '@/services/ticket.service';
import { DivergenceCard } from '../detail/DivergenceCard';
import { ExternalLink } from 'lucide-react';

interface RecordDetailPanelProps {
  ticket: AECResponse;
  onReviewDelivery: (ticketId: string, action: 'accept' | 'request_changes', note?: string) => Promise<void>;
}

export function RecordDetailPanel({ ticket, onReviewDelivery }: RecordDetailPanelProps) {
  const router = useRouter();
  const cr = ticket.changeRecord!;
  const [loading, setLoading] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const isAwaitingReview = cr.status === 'awaiting_review';

  const handleAccept = async () => {
    setLoading(true);
    try {
      await onReviewDelivery(ticket.id, 'accept');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!rejectNote.trim()) return;
    setLoading(true);
    try {
      await onReviewDelivery(ticket.id, 'request_changes', rejectNote);
      setRejectNote('');
      setShowRejectForm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-primary)] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex justify-between items-start border-b border-[var(--border-subtle)]">
        <div>
          <button
            onClick={() => router.push(`/tickets/${ticket.slug || ticket.id}`)}
            className="text-[15px] font-semibold text-[var(--text-primary)] hover:text-purple-400 transition-colors inline-flex items-center gap-1.5"
          >
            {ticket.title}
            <ExternalLink className="w-3.5 h-3.5 opacity-40" />
          </button>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${
              isAwaitingReview ? 'bg-amber-500' : cr.status === 'accepted' ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className={`text-[12px] ${
              isAwaitingReview ? 'text-amber-500/70' : cr.status === 'accepted' ? 'text-green-500/70' : 'text-red-500/70'
            }`}>
              {isAwaitingReview ? 'Awaiting PM review' : cr.status === 'accepted' ? 'Accepted' : 'Changes requested'}
            </span>
            <span className="text-[12px] text-[var(--text-tertiary)]">
              · Delivered {new Date(cr.submittedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        {isAwaitingReview && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setShowRejectForm(!showRejectForm)}
              disabled={loading}
              className="bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] px-3 py-1.5 rounded-md text-[13px] hover:bg-[var(--bg-active)] transition-colors"
            >
              Request Changes
            </button>
            <button
              onClick={handleAccept}
              disabled={loading}
              className="bg-green-600 text-white px-3 py-1.5 rounded-md text-[13px] font-medium hover:bg-green-700 transition-colors"
            >
              Accept
            </button>
          </div>
        )}
      </div>

      {/* Reject form */}
      {showRejectForm && isAwaitingReview && (
        <div className="px-5 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-hover)]">
          <textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="What needs to change?"
            className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-md p-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] resize-none"
            rows={3}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setShowRejectForm(false)}
              className="text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRequestChanges}
              disabled={loading || !rejectNote.trim()}
              className="bg-red-600 text-white px-3 py-1.5 rounded-md text-[13px] font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              Send Back
            </button>
          </div>
        </div>
      )}

      {/* Review note */}
      {cr.reviewNote && (
        <div className="px-5 py-3 border-b border-[var(--border-subtle)] bg-red-500/[0.03]">
          <div className="text-[11px] uppercase tracking-wider text-red-500/60 mb-1">Changes Requested</div>
          <div className="text-[13px] text-[var(--text-secondary)]">{cr.reviewNote}</div>
        </div>
      )}

      {/* Body: main + sidebar */}
      <div className="px-5 py-4 flex gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Execution summary */}
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5 font-semibold">
              Execution Summary
            </div>
            <div className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
              {cr.executionSummary}
            </div>
          </div>

          {/* Divergences */}
          {cr.divergences.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">
                Divergences ({cr.divergences.length})
              </div>
              {cr.divergences.map((d, i) => (
                <DivergenceCard key={i} divergence={d} />
              ))}
            </div>
          )}

          {/* File changes */}
          {cr.filesChanged.length > 0 && (
            <div className="border-t border-[var(--border-subtle)] pt-4">
              <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] mb-2 font-semibold">
                Code Changes
                <span className="font-normal ml-2">
                  {cr.filesChanged.length} files
                </span>
              </div>
              <div className="space-y-0.5">
                {cr.filesChanged.map((f, i) => (
                  <div key={i} className="flex justify-between items-center text-[12px] font-mono py-0.5">
                    <span className="text-[var(--text-tertiary)] truncate">{f.path}</span>
                    <span className="shrink-0 ml-3">
                      {f.additions > 0 && <span className="text-green-500">+{f.additions}</span>}
                      {f.deletions > 0 && <span className="text-red-500 ml-1.5">−{f.deletions}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: events */}
        {(cr.decisions.length > 0 || cr.risks.length > 0 || cr.scopeChanges.length > 0) && (
          <div className="w-[260px] shrink-0 border-l border-[var(--border-subtle)] pl-6">
            <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] mb-3 font-semibold">
              Execution Events
            </div>
            <div className="space-y-2.5">
              {cr.decisions.map((e) => (
                <div key={e.id} className="flex gap-2 text-[12px]">
                  <span className="text-purple-400 shrink-0">💡</span>
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">{e.title}</div>
                    <div className="text-[var(--text-tertiary)] mt-0.5">{e.description}</div>
                  </div>
                </div>
              ))}
              {cr.risks.map((e) => (
                <div key={e.id} className="flex gap-2 text-[12px]">
                  <span className="text-amber-500 shrink-0">⚠️</span>
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">{e.title}</div>
                    <div className="text-[var(--text-tertiary)] mt-0.5">{e.description}</div>
                  </div>
                </div>
              ))}
              {cr.scopeChanges.map((e) => (
                <div key={e.id} className="flex gap-2 text-[12px]">
                  <span className="text-blue-400 shrink-0">📐</span>
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">{e.title}</div>
                    <div className="text-[var(--text-tertiary)] mt-0.5">{e.description}</div>
                  </div>
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
git commit -m "feat: add RecordDetailPanel for Change Record timeline detail view"
```

---

### Task 4: Create TimelineStrip component

**Files:**
- Create: `client/src/tickets/components/records/TimelineStrip.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client';

import { useRef, useEffect } from 'react';
import type { AECResponse } from '@/services/ticket.service';
import { TimelineRecordCard } from './TimelineRecordCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TimelineStripProps {
  tickets: AECResponse[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

interface DateGroup {
  label: string;
  date: string;
  isToday: boolean;
  tickets: AECResponse[];
}

function groupByDate(tickets: AECResponse[]): DateGroup[] {
  const today = new Date().toDateString();
  const groups = new Map<string, AECResponse[]>();

  for (const t of tickets) {
    const dateKey = new Date(t.changeRecord!.submittedAt).toDateString();
    if (!groups.has(dateKey)) groups.set(dateKey, []);
    groups.get(dateKey)!.push(t);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([dateStr, items]) => ({
      label: dateStr === today
        ? 'Today'
        : new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      date: dateStr,
      isToday: dateStr === today,
      tickets: items.sort(
        (a, b) => new Date(b.changeRecord!.submittedAt).getTime() - new Date(a.changeRecord!.submittedAt).getTime(),
      ),
    }));
}

const RECENT_CARD_COUNT = 3;

export function TimelineStrip({ tickets, selectedId, onSelect }: TimelineStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const groups = groupByDate(tickets);

  // Count records to determine which are "recent" (expanded as cards)
  const allRecordIds = tickets
    .sort((a, b) => new Date(b.changeRecord!.submittedAt).getTime() - new Date(a.changeRecord!.submittedAt).getTime())
    .map((t) => t.id);
  const recentIds = new Set(allRecordIds.slice(0, RECENT_CARD_COUNT));

  // Scroll to right (most recent) on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [tickets.length]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -250 : 250,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-primary)] overflow-hidden relative">
      {/* Scroll arrows */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-[var(--bg-hover)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-active)] transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        onClick={() => scroll('right')}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-[var(--bg-hover)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-active)] transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Scrollable track */}
      <div
        ref={scrollRef}
        className="overflow-x-auto overflow-y-hidden px-10 py-5 scrollbar-thin"
      >
        <div className="flex gap-0 min-w-max">
          {groups.map((group) => (
            <div key={group.date} className="min-w-[190px] flex flex-col items-center">
              {/* Date label */}
              <div className={`text-[11px] mb-2 font-medium ${
                group.isToday ? 'text-purple-400' : 'text-[var(--text-tertiary)]'
              }`}>
                {group.label}
              </div>
              {/* Date line */}
              <div className="w-px h-3 bg-[var(--border-subtle)] mb-3" />
              {/* Records */}
              <div className="flex flex-col gap-2 items-center">
                {group.tickets.map((t) =>
                  recentIds.has(t.id) ? (
                    <TimelineRecordCard
                      key={t.id}
                      ticket={t}
                      isSelected={selectedId === t.id}
                      onClick={() => onSelect(t.id)}
                    />
                  ) : (
                    <button
                      key={t.id}
                      onClick={() => onSelect(t.id)}
                      title={t.title}
                      className={`w-3 h-3 rounded-full border-2 transition-all hover:scale-150 ${
                        selectedId === t.id ? 'ring-2 ring-purple-500/30' : ''
                      } ${
                        t.changeRecord!.status === 'awaiting_review'
                          ? 'bg-amber-500 border-amber-500/30'
                          : t.changeRecord!.status === 'accepted'
                            ? 'bg-green-500 border-green-500/30'
                            : 'bg-red-500 border-red-500/30'
                      }`}
                    />
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/tickets/components/records/TimelineStrip.tsx
git commit -m "feat: add TimelineStrip component with horizontal scrollable timeline

Groups records by date, shows last 3 as expanded cards, older as colored dots.
Auto-scrolls to most recent on mount."
```

---

### Task 5: Create ChangeRecordTimeline page component

**Files:**
- Create: `client/src/tickets/components/records/ChangeRecordTimeline.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { TicketService } from '@/services/ticket.service';
import type { AECResponse } from '@/services/ticket.service';
import { TimelineStrip } from './TimelineStrip';
import { RecordDetailPanel } from './RecordDetailPanel';
import { ClipboardList } from 'lucide-react';

type FilterStatus = 'all' | 'awaiting_review' | 'accepted' | 'changes_requested';

export function ChangeRecordTimeline() {
  const [tickets, setTickets] = useState<AECResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');

  const ticketService = useMemo(() => new TicketService(), []);

  const fetchTickets = async () => {
    try {
      const all = await ticketService.list();
      const withRecords = all.filter((t) => t.changeRecord !== null);
      setTickets(withRecords);
      // Auto-select most recent if nothing selected
      if (!selectedId && withRecords.length > 0) {
        const mostRecent = withRecords.sort(
          (a, b) => new Date(b.changeRecord!.submittedAt).getTime() - new Date(a.changeRecord!.submittedAt).getTime(),
        )[0];
        setSelectedId(mostRecent.id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredTickets = useMemo(() => {
    if (filter === 'all') return tickets;
    return tickets.filter((t) => t.changeRecord!.status === filter);
  }, [tickets, filter]);

  const selectedTicket = tickets.find((t) => t.id === selectedId) ?? null;

  const counts = useMemo(() => ({
    all: tickets.length,
    awaiting_review: tickets.filter((t) => t.changeRecord!.status === 'awaiting_review').length,
    accepted: tickets.filter((t) => t.changeRecord!.status === 'accepted').length,
    changes_requested: tickets.filter((t) => t.changeRecord!.status === 'changes_requested').length,
  }), [tickets]);

  const handleReviewDelivery = async (ticketId: string, action: 'accept' | 'request_changes', note?: string) => {
    await ticketService.reviewDelivery(ticketId, action, note);
    await fetchTickets();
  };

  const filters: Array<{ key: FilterStatus; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'awaiting_review', label: 'Awaiting Review' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'changes_requested', label: 'Changes Requested' },
  ];

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
          Change Records appear here when tickets are delivered with a settlement report.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header + Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Change Records</h1>
          <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">
            Review what was built vs what was intended
          </p>
        </div>
        <div className="flex gap-1.5">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-[12px] px-2.5 py-1 rounded-full border transition-colors ${
                filter === f.key
                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                  : 'bg-transparent text-[var(--text-tertiary)] border-[var(--border-subtle)] hover:text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]/20'
              }`}
            >
              {f.label}
              <span className={`ml-1 text-[11px] px-1 py-px rounded ${
                filter === f.key ? 'bg-purple-500/20' : 'bg-[var(--bg-hover)]'
              }`}>
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Strip */}
      <TimelineStrip
        tickets={filteredTickets}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      {/* Detail Panel */}
      {selectedTicket && selectedTicket.changeRecord && (
        <RecordDetailPanel
          ticket={selectedTicket}
          onReviewDelivery={handleReviewDelivery}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/tickets/components/records/ChangeRecordTimeline.tsx
git commit -m "feat: add ChangeRecordTimeline main page component

Fetches tickets, filters to those with Change Records, renders
timeline strip + detail panel. Filter pills with counts."
```

---

### Task 6: Create the route page

**Files:**
- Create: `client/app/(main)/records/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { ChangeRecordTimeline } from '@/tickets/components/records/ChangeRecordTimeline';

export default function RecordsPage() {
  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <ChangeRecordTimeline />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/app/\(main\)/records/page.tsx
git commit -m "feat: add /records route page for Change Record timeline"
```

---

### Task 7: Verify and fix

- [ ] **Step 1: Run TypeScript check**

Run: `cd client && npx tsc --noEmit 2>&1 | head -20`
Expected: No type errors.

- [ ] **Step 2: Verify page loads in browser**

Open `http://localhost:3001/records` in the browser. The page should show:
- Empty state if no tickets have Change Records
- Timeline + detail panel if there are delivered tickets with records

- [ ] **Step 3: Fix any issues found**

- [ ] **Step 4: Commit fixes if needed**

```bash
git commit -m "fix: resolve remaining issues in Change Record timeline"
```

---

## Notes

### Data Flow

```
TicketService.list() → filter(changeRecord !== null) → sort by submittedAt
  → TimelineStrip (groups by date, shows cards/dots)
  → RecordDetailPanel (full record + review actions)
  → TicketService.reviewDelivery() → refetch
```

### Component Reuse

- `DivergenceCard` — reused from the ticket detail Delivered tab
- `reviewDelivery` API function — reused from ticket.service.ts
- Status color patterns — consistent with `ticketStatusConfig.ts`

### Empty State

The empty state shows when no tickets have Change Records. This is the normal state for new projects that haven't had any executions yet.

### Mobile

The timeline strip horizontal scroll works on mobile via touch swipe. The detail panel stacks below naturally. The events sidebar collapses below the main content on narrow screens (handled by the flex layout wrapping).
