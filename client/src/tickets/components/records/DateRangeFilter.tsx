'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateRangeFilterProps {
  from: string; // YYYY-MM-DD
  to: string;
  onChange: (from: string, to: string) => void;
}

// ─── helpers ───────────────────────────────────

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseYMD(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isBetween(d: Date, from: Date, to: Date) {
  return d >= from && d <= to;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay(); // 0=Sun
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// ─── component ─────────────────────────────────

export function DateRangeFilter({ from, to, onChange }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Calendar view state — show the month of "from" and "from+1"
  const fromDate = parseYMD(from);
  const [viewYear, setViewYear] = useState(fromDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(fromDate.getMonth());

  // Selection state: picking 'from' or 'to'
  const [picking, setPicking] = useState<'from' | 'to'>('from');
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Reset view when opening
  useEffect(() => {
    if (open) {
      const d = parseYMD(from);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
      setPicking('from');
      setHoverDate(null);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDefault = (() => {
    const now = new Date();
    const def = new Date();
    def.setDate(def.getDate() - 30);
    return from === toYMD(def) && to === toYMD(now);
  })();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  };

  const secondMonth = viewMonth === 11 ? 0 : viewMonth + 1;
  const secondYear = viewMonth === 11 ? viewYear + 1 : viewYear;

  const handleDayClick = (d: Date) => {
    const ymd = toYMD(d);
    if (picking === 'from') {
      // If clicked date is after current "to", set both
      if (d > parseYMD(to)) {
        onChange(ymd, ymd);
      } else {
        onChange(ymd, to);
      }
      setPicking('to');
    } else {
      // If clicked date is before current "from", swap
      if (d < parseYMD(from)) {
        onChange(ymd, from);
      } else {
        onChange(from, ymd);
      }
      setPicking('from');
    }
  };

  const applyPreset = (days: number) => {
    const t = new Date();
    const f = new Date();
    f.setDate(f.getDate() - days);
    onChange(toYMD(f), toYMD(t));
    setOpen(false);
  };

  // Format for the display label
  const fromLabel = parseYMD(from).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const toLabel = parseYMD(to).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`h-7 w-7 rounded-full flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors ${
          !isDefault
            ? 'text-purple-500'
            : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
        }`}
        title={`${fromLabel} – ${toLabel}`}
      >
        <Calendar className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-lg shadow-lg p-3">
          {/* Navigation header */}
          <div className="flex items-center justify-between mb-2">
            <button onClick={prevMonth} className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors">
              <ChevronLeft className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            </button>
            <div className="flex gap-8">
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                {MONTH_NAMES[secondMonth]} {secondYear}
              </span>
            </div>
            <button onClick={nextMonth} className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors">
              <ChevronRight className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            </button>
          </div>

          {/* Picking indicator */}
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setPicking('from')}
              className={`flex-1 text-center py-1 rounded text-[10px] transition-colors ${
                picking === 'from'
                  ? 'bg-purple-500/15 text-purple-400 font-medium'
                  : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              From: {fromLabel}
            </button>
            <button
              onClick={() => setPicking('to')}
              className={`flex-1 text-center py-1 rounded text-[10px] transition-colors ${
                picking === 'to'
                  ? 'bg-purple-500/15 text-purple-400 font-medium'
                  : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              To: {toLabel}
            </button>
          </div>

          {/* Dual month grid */}
          <div className="flex gap-4">
            <MonthGrid
              year={viewYear}
              month={viewMonth}
              from={parseYMD(from)}
              to={parseYMD(to)}
              hoverDate={hoverDate}
              picking={picking}
              onDayClick={handleDayClick}
              onDayHover={setHoverDate}
            />
            <MonthGrid
              year={secondYear}
              month={secondMonth}
              from={parseYMD(from)}
              to={parseYMD(to)}
              hoverDate={hoverDate}
              picking={picking}
              onDayClick={handleDayClick}
              onDayHover={setHoverDate}
            />
          </div>

          {/* Quick presets */}
          <div className="flex gap-1 mt-2.5 pt-2 border-t border-[var(--border-subtle)]">
            {[
              { label: '7d', days: 7 },
              { label: '30d', days: 30 },
              { label: '90d', days: 90 },
              { label: '1y', days: 365 },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => applyPreset(preset.days)}
                className="flex-1 py-1 rounded text-[10px] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Month grid ────────────────────────────────

function MonthGrid({
  year, month, from, to, hoverDate, picking, onDayClick, onDayHover,
}: {
  year: number;
  month: number;
  from: Date;
  to: Date;
  hoverDate: Date | null;
  picking: 'from' | 'to';
  onDayClick: (d: Date) => void;
  onDayHover: (d: Date | null) => void;
}) {
  const days = daysInMonth(year, month);
  const offset = firstDayOfMonth(year, month);
  const today = new Date();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d));

  return (
    <div className="w-[154px]">
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-0.5">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="text-[8px] text-center text-[var(--text-tertiary)] font-medium py-0.5">
            {d}
          </div>
        ))}
      </div>
      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;

          const isFrom = isSameDay(day, from);
          const isTo = isSameDay(day, to);
          const isInRange = isBetween(day, from, to);
          const isToday = isSameDay(day, today);

          // Preview range while hovering
          let isPreview = false;
          if (hoverDate && picking === 'to' && day > from && day <= hoverDate && day > to) {
            isPreview = true;
          }
          if (hoverDate && picking === 'from' && day < to && day >= hoverDate && day < from) {
            isPreview = true;
          }

          const isEndpoint = isFrom || isTo;

          return (
            <button
              key={day.getDate()}
              onClick={() => onDayClick(day)}
              onMouseEnter={() => onDayHover(day)}
              onMouseLeave={() => onDayHover(null)}
              className={`h-[22px] w-[22px] text-[10px] rounded-full flex items-center justify-center transition-colors relative ${
                isEndpoint
                  ? 'bg-purple-500 text-white font-medium'
                  : isInRange
                    ? 'bg-purple-500/10 text-purple-400'
                    : isPreview
                      ? 'bg-purple-500/5 text-purple-400/60'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              {day.getDate()}
              {isToday && !isEndpoint && (
                <div className="absolute bottom-[1px] left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full bg-emerald-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
