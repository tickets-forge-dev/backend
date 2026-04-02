'use client';

import { useRef, useEffect, useMemo, useCallback } from 'react';
import type { AECResponse } from '@/services/ticket.service';
import type { ZoomLevel } from './ZoomToggle';

/** Hook for click-and-drag horizontal scrolling */
function useDragScroll(ref: React.RefObject<HTMLDivElement | null>) {
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startScroll = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    isDragging.current = true;
    startX.current = e.pageX;
    startScroll.current = ref.current.scrollLeft;
    ref.current.style.cursor = 'grabbing';
    ref.current.style.userSelect = 'none';
  }, [ref]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.pageX - startX.current;
      el.scrollLeft = startScroll.current - dx;
    };

    const onMouseUp = () => {
      isDragging.current = false;
      el.style.cursor = 'grab';
      el.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [ref]);

  return { onMouseDown };
}

interface TimelineAxisProps {
  tickets: AECResponse[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  zoom: ZoomLevel;
}

// ─── date helpers ──────────────────────────────────────────

/** Normalize any Date to local midnight — prevents UTC/local drift in positioning */
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function startOfHour(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours());
}
/** Parse an ISO date string to local midnight (avoids UTC offset shifting the day) */
function toLocalDay(isoStr: string): Date {
  const d = new Date(isoStr);
  return startOfDay(d);
}
/** Parse an ISO date string preserving local hour precision */
function toLocalTime(isoStr: string): Date {
  return new Date(isoStr);
}
function startOfWeek(d: Date): Date {
  const day = d.getDay(); // 0=Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Mon start
  return new Date(d.getFullYear(), d.getMonth(), diff);
}
function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addHours(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 3_600_000);
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function formatHourTick(d: Date): string {
  const h = d.getHours();
  if (h === 0) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${String(h).padStart(2, '0')}:00`;
}
function formatDayTick(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function formatWeekTick(d: Date): string {
  const end = addDays(d, 6);
  const sameMonth = d.getMonth() === end.getMonth();
  if (sameMonth) return `${d.toLocaleDateString('en-US', { month: 'short' })} ${d.getDate()}–${end.getDate()}`;
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}
function formatMonthTick(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// ─── grouping ──────────────────────────────────────────────

interface RecordGroup {
  key: string;
  tickets: AECResponse[];
  date: Date; // bucket start
}

function bucketKey(d: Date, zoom: ZoomLevel): string {
  if (zoom === 'hour') return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
  if (zoom === 'day') return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  if (zoom === 'week') {
    const w = startOfWeek(d);
    return `${w.getFullYear()}-${w.getMonth()}-${w.getDate()}`;
  }
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function bucketStart(d: Date, zoom: ZoomLevel): Date {
  if (zoom === 'hour') return startOfHour(d);
  if (zoom === 'day') return startOfDay(d);
  if (zoom === 'week') return startOfWeek(d);
  return startOfMonth(d);
}

function groupTickets(tickets: AECResponse[], zoom: ZoomLevel): RecordGroup[] {
  const map = new Map<string, RecordGroup>();
  for (const t of tickets) {
    const d = zoom === 'hour' ? toLocalTime(t.changeRecord!.submittedAt) : toLocalDay(t.changeRecord!.submittedAt);
    const k = bucketKey(d, zoom);
    if (!map.has(k)) map.set(k, { key: k, tickets: [], date: bucketStart(d, zoom) });
    map.get(k)!.tickets.push(t);
  }
  return Array.from(map.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}

// ─── tick generation ───────────────────────────────────────

interface Tick {
  date: Date;
  label: string;
  isMonth: boolean; // for extra emphasis
}

function generateTicks(rangeStart: Date, rangeEnd: Date, zoom: ZoomLevel): Tick[] {
  const ticks: Tick[] = [];
  if (zoom === 'hour') {
    let cur = startOfHour(rangeStart);
    while (cur <= rangeEnd) {
      ticks.push({
        date: new Date(cur),
        label: formatHourTick(cur),
        isMonth: cur.getHours() === 0, // midnight = day boundary, emphasize
      });
      cur = addHours(cur, 1);
    }
  } else if (zoom === 'day') {
    let cur = new Date(rangeStart);
    while (cur <= rangeEnd) {
      ticks.push({
        date: new Date(cur),
        label: formatDayTick(cur),
        isMonth: cur.getDate() === 1,
      });
      cur = addDays(cur, 1);
    }
  } else if (zoom === 'week') {
    let cur = startOfWeek(rangeStart);
    while (cur <= rangeEnd) {
      ticks.push({
        date: new Date(cur),
        label: formatWeekTick(cur),
        isMonth: cur.getDate() <= 7,
      });
      cur = addDays(cur, 7);
    }
  } else {
    let cur = startOfMonth(rangeStart);
    while (cur <= rangeEnd) {
      ticks.push({
        date: new Date(cur),
        label: formatMonthTick(cur),
        isMonth: true,
      });
      cur = addMonths(cur, 1);
    }
  }
  return ticks;
}

// ─── spacing config ────────────────────────────────────────

const PX_PER_UNIT: Record<ZoomLevel, number> = {
  hour: 60,
  day: 70,
  week: 110,
  month: 160,
};

function dateToX(d: Date, rangeStart: Date, zoom: ZoomLevel): number {
  if (zoom === 'hour') {
    const totalHours = (d.getTime() - rangeStart.getTime()) / 3_600_000;
    return totalHours * PX_PER_UNIT.hour;
  }
  const totalDays = daysBetween(rangeStart, d);
  if (zoom === 'day') return totalDays * PX_PER_UNIT.day;
  if (zoom === 'week') return (totalDays / 7) * PX_PER_UNIT.week;
  return (totalDays / 30.44) * PX_PER_UNIT.month;
}

// ─── component ─────────────────────────────────────────────

export function TimelineAxis({ tickets, selectedId, onSelect, zoom }: TimelineAxisProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { onMouseDown } = useDragScroll(scrollRef);

  // Compute range based on zoom level
  const { rangeStart, rangeEnd, groups, ticks, totalWidth } = useMemo(() => {
    if (tickets.length === 0) {
      const now = new Date();
      const rs = zoom === 'hour' ? addHours(now, -12) : addDays(now, -30);
      const re = zoom === 'hour' ? addHours(now, 12) : addDays(now, 30);
      return { rangeStart: rs, rangeEnd: re, groups: [], ticks: generateTicks(rs, re, zoom), totalWidth: dateToX(re, rs, zoom) };
    }

    const dates = tickets.map((t) =>
      zoom === 'hour' ? toLocalTime(t.changeRecord!.submittedAt) : toLocalDay(t.changeRecord!.submittedAt)
    );
    const earliest = new Date(Math.min(...dates.map((d) => d.getTime())));
    const latest = new Date(Math.max(...dates.map((d) => d.getTime())));

    // Hour zoom: ±12 hours padding, others: ±30 days
    const rs = zoom === 'hour' ? addHours(startOfHour(earliest), -12) : addDays(startOfDay(earliest), -30);
    const re = zoom === 'hour' ? addHours(startOfHour(latest), 12) : addDays(startOfDay(latest), 30);

    const g = groupTickets(tickets, zoom);
    const t = generateTicks(rs, re, zoom);
    const w = dateToX(re, rs, zoom) + 60;

    return { rangeStart: rs, rangeEnd: re, groups: g, ticks: t, totalWidth: Math.max(w, 400) };
  }, [tickets, zoom]);

  // Scroll to latest record on mount / zoom change
  useEffect(() => {
    if (!scrollRef.current || tickets.length === 0) return;
    const parseDate = zoom === 'hour' ? toLocalTime : toLocalDay;
    const latestDate = new Date(
      Math.max(...tickets.map((t) => parseDate(t.changeRecord!.submittedAt).getTime()))
    );
    const x = dateToX(latestDate, rangeStart, zoom);
    const containerWidth = scrollRef.current.clientWidth;
    scrollRef.current.scrollLeft = Math.max(0, x - containerWidth / 2);
  }, [tickets.length, zoom]); // eslint-disable-line react-hooks/exhaustive-deps

  if (tickets.length === 0) return null;

  const LINE_Y = 48; // vertical position of the timeline line

  return (
    <div
      className="rounded-[10px] border border-[#8b5cf620] overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #110d1c 0%, #13101e 50%, var(--bg-subtle) 100%)' }}
    >
      <div className="relative">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-1/2 h-[60px] bg-[radial-gradient(ellipse,#8b5cf60d,transparent_70%)]" />
        </div>

        <div ref={scrollRef} onMouseDown={onMouseDown} className="overflow-x-auto timeline-scroll cursor-grab">
          <div className="relative" style={{ width: totalWidth, height: 110, minWidth: '100%' }}>
            {/* ── Date tick marks ── */}
            {ticks.map((tick, i) => {
              const x = dateToX(tick.date, rangeStart, zoom) + 30; // 30px left pad
              return (
                <div key={i} className="absolute" style={{ left: x, top: 0, transform: 'translateX(-50%)' }}>
                  {/* Tick label */}
                  <div
                    className={`text-center whitespace-nowrap select-none ${
                      tick.isMonth
                        ? 'text-[11px] font-medium text-[#71717a]'
                        : 'text-[10px] text-[#52525b]'
                    }`}
                    style={{ marginTop: 8 }}
                  >
                    {tick.label}
                  </div>
                  {/* Tick line */}
                  <div
                    className="mx-auto"
                    style={{
                      width: 1,
                      height: tick.isMonth ? 10 : 5,
                      marginTop: 3,
                      background: tick.isMonth ? '#52525b' : '#3f3f46',
                    }}
                  />
                </div>
              );
            })}

            {/* ── The purple timeline line ── */}
            <div
              className="absolute left-0 right-0 h-[2px]"
              style={{
                top: LINE_Y,
                background:
                  'linear-gradient(90deg, transparent 0%, #7c3aed44 5%, #8b5cf6 30%, #a78bfa 50%, #8b5cf6 70%, #7c3aed44 95%, transparent 100%)',
                boxShadow: '0 0 6px #8b5cf622',
              }}
            />

            {/* ── Record nodes ── */}
            {groups.map((group) => {
              // Position at the average date in the group
              const avgTime =
                group.tickets.reduce((s, t) => s + (zoom === 'hour' ? toLocalTime : toLocalDay)(t.changeRecord!.submittedAt).getTime(), 0) /
                group.tickets.length;
              const x = dateToX(new Date(avgTime), rangeStart, zoom) + 30;

              const isSingle = group.tickets.length === 1;
              const isSelected = isSingle && group.tickets[0].id === selectedId;
              const containsSelected = group.tickets.some((t) => t.id === selectedId);

              // Is this the most recent record? Show a pulse to draw attention
              const isLatest = isSingle && group.tickets[0].id === tickets[tickets.length - 1]?.id;

              if (isSingle) {
                const t = group.tickets[0];
                const cr = t.changeRecord!;
                return (
                  <button
                    key={group.key}
                    onClick={() => onSelect(t.id)}
                    className="absolute group cursor-pointer"
                    style={{ left: x, top: LINE_Y, transform: 'translate(-50%, -50%)' }}
                  >
                    {/* Hover ring — visible on hover to signal clickability */}
                    <div
                      className="absolute inset-0 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
                      style={{
                        width: 18,
                        height: 18,
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        border: '1.5px solid #8b5cf644',
                        background: '#8b5cf60a',
                      }}
                    />
                    {/* Pulse ring on latest record */}
                    {isLatest && !isSelected && (
                      <div
                        className="absolute rounded-full animate-ping"
                        style={{
                          width: 14,
                          height: 14,
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          background: '#8b5cf622',
                          animationDuration: '2.5s',
                        }}
                      />
                    )}
                    {/* Dot */}
                    <div
                      className="rounded-full transition-all duration-200 group-hover:scale-[1.4]"
                      style={{
                        width: isSelected ? 12 : 9,
                        height: isSelected ? 12 : 9,
                        background: isSelected ? '#a78bfa' : '#8b5cf6',
                        boxShadow: isSelected
                          ? '0 0 0 2px #13101e, 0 0 0 3.5px #8b5cf644, 0 0 14px #8b5cf644'
                          : '0 0 4px #8b5cf633',
                        opacity: isSelected ? 1 : 0.7,
                      }}
                    />
                    {/* Label below */}
                    <div
                      className={`absolute top-[16px] left-1/2 -translate-x-1/2 whitespace-nowrap text-center transition-all duration-200 ${
                        isSelected
                          ? 'text-[#c4b5fd]'
                          : 'text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] group-hover:translate-y-[2px]'
                      }`}
                    >
                      <div className={`text-[11px] max-w-[120px] truncate ${isSelected ? 'font-medium' : ''}`}>
                        {t.title}
                      </div>
                      <div className="text-[9px] opacity-60">
                        {cr.filesChanged.length} files
                      </div>
                    </div>
                  </button>
                );
              }

              // ── Grouped node ──
              return (
                <div
                  key={group.key}
                  className="absolute"
                  style={{ left: x, top: LINE_Y, transform: 'translate(-50%, -50%)' }}
                >
                  {/* Cluster dot */}
                  <button
                    onClick={() => onSelect(group.tickets[0].id)}
                    className="group relative cursor-pointer"
                  >
                    <div
                      className="rounded-full transition-all duration-200 group-hover:scale-[1.3]"
                      style={{
                        width: Math.min(14, 8 + group.tickets.length),
                        height: Math.min(14, 8 + group.tickets.length),
                        background: containsSelected
                          ? 'linear-gradient(135deg, #a78bfa, #7c3aed)'
                          : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                        boxShadow: containsSelected
                          ? '0 0 0 2px #13101e, 0 0 0 3.5px #8b5cf644, 0 0 14px #8b5cf644'
                          : '0 0 6px #8b5cf644',
                      }}
                    />
                    {/* Count badge */}
                    <div
                      className="absolute -top-2.5 -right-2.5 min-w-[16px] h-[14px] px-1 rounded-full flex items-center justify-center text-[8px] font-bold"
                      style={{
                        background: '#7c3aed',
                        color: '#e9e5f5',
                        boxShadow: '0 0 4px #7c3aed88',
                      }}
                    >
                      {group.tickets.length}
                    </div>
                    {/* Dropdown on hover */}
                    <div className="hidden group-hover:block absolute top-[16px] left-1/2 -translate-x-1/2 z-20 pt-1">
                      <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg shadow-xl p-1.5 min-w-[140px]">
                        {group.tickets.map((t) => (
                          <button
                            key={t.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelect(t.id);
                            }}
                            className={`w-full text-left px-2 py-1.5 rounded-md text-[10px] transition-colors truncate ${
                              t.id === selectedId
                                ? 'bg-purple-500/10 text-[var(--text-primary)]'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                            }`}
                          >
                            {t.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  </button>
                  {/* Label below */}
                  <div className="absolute top-[14px] left-1/2 -translate-x-1/2 whitespace-nowrap text-center pointer-events-none">
                    <div className={`text-[11px] font-medium ${containsSelected ? 'text-[#c4b5fd]' : 'text-[var(--text-tertiary)]'}`}>
                      {group.tickets.length} records
                    </div>
                  </div>
                </div>
              );
            })}

            {/* ── "Today" marker ── */}
            {(() => {
              const today = startOfDay(new Date());
              if (today >= rangeStart && today <= rangeEnd) {
                const x = dateToX(today, rangeStart, zoom) + 30;
                return (
                  <div className="absolute pointer-events-none" style={{ left: x, top: LINE_Y - 16, transform: 'translateX(-50%)' }}>
                    <div className="text-[9px] text-emerald-500/70 font-medium text-center mb-[2px]">today</div>
                    <div className="w-px h-[22px] bg-emerald-500/25 mx-auto" />
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
