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
