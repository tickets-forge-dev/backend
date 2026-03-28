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
                      className={`w-3 h-3 rounded-full border-2 transition-all hover:scale-150 bg-purple-400 border-purple-400/30 ${
                        selectedId === t.id ? 'ring-2 ring-purple-500/30' : ''
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
