'use client';

import { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { useTagsStore } from '@/stores/tags.store';
import { getTagColor } from '@/tickets/config/tagColors';

export interface RecordFilterState {
  priority: string;
  type: string;
  recordStatus: string;
  tagIds: string[];
}

export const DEFAULT_FILTERS: RecordFilterState = {
  priority: 'all',
  type: 'all',
  recordStatus: 'all',
  tagIds: [],
};

interface RecordFiltersProps {
  filters: RecordFilterState;
  onChange: (filters: RecordFilterState) => void;
}

const PRIORITIES = [
  { value: 'all', label: 'All priorities' },
  { value: 'critical', label: 'Critical', dot: 'bg-red-500' },
  { value: 'high', label: 'High', dot: 'bg-orange-500' },
  { value: 'medium', label: 'Medium', dot: 'bg-yellow-500' },
  { value: 'low', label: 'Low', dot: 'bg-blue-500' },
];

const TYPES = [
  { value: 'all', label: 'All types' },
  { value: 'feature', label: 'Feature' },
  { value: 'bug', label: 'Bug' },
  { value: 'improvement', label: 'Improvement' },
  { value: 'task', label: 'Task' },
  { value: 'refactor', label: 'Refactor' },
];

const RECORD_STATUSES = [
  { value: 'all', label: 'All statuses' },
  { value: 'awaiting_review', label: 'Awaiting review', dot: 'bg-amber-500' },
  { value: 'accepted', label: 'Accepted', dot: 'bg-green-500' },
  { value: 'changes_requested', label: 'Changes requested', dot: 'bg-red-500' },
];

export function hasActiveFilters(filters: RecordFilterState): boolean {
  return (
    filters.priority !== 'all' ||
    filters.type !== 'all' ||
    filters.recordStatus !== 'all' ||
    filters.tagIds.length > 0
  );
}

export function RecordFilters({ filters, onChange }: RecordFiltersProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const tags = useTagsStore((s) => s.tags);
  const active = hasActiveFilters(filters);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const set = <K extends keyof RecordFilterState>(key: K, value: RecordFilterState[K]) =>
    onChange({ ...filters, [key]: value });

  const toggleTag = (id: string) => {
    const next = filters.tagIds.includes(id)
      ? filters.tagIds.filter((t) => t !== id)
      : [...filters.tagIds, id];
    set('tagIds', next);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`h-7 w-7 rounded-full flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors ${
          active
            ? 'text-purple-500'
            : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
        }`}
        title="Filters"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-[220px] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-lg shadow-lg p-2 space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Filters
            </span>
            {active && (
              <button
                onClick={() => onChange(DEFAULT_FILTERS)}
                className="text-[10px] text-purple-500 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Priority */}
          <FilterSection label="Priority">
            {PRIORITIES.map((opt) => (
              <FilterOption
                key={opt.value}
                label={opt.label}
                dot={opt.dot}
                active={filters.priority === opt.value}
                onClick={() => set('priority', opt.value)}
              />
            ))}
          </FilterSection>

          {/* Type */}
          <FilterSection label="Type">
            {TYPES.map((opt) => (
              <FilterOption
                key={opt.value}
                label={opt.label}
                active={filters.type === opt.value}
                onClick={() => set('type', opt.value)}
              />
            ))}
          </FilterSection>

          {/* Record Status */}
          <FilterSection label="Review status">
            {RECORD_STATUSES.map((opt) => (
              <FilterOption
                key={opt.value}
                label={opt.label}
                dot={opt.dot}
                active={filters.recordStatus === opt.value}
                onClick={() => set('recordStatus', opt.value)}
              />
            ))}
          </FilterSection>

          {/* Tags */}
          {tags.length > 0 && (
            <FilterSection label="Tags">
              {tags.map((tag) => {
                const color = getTagColor(tag.color);
                const isActive = filters.tagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`w-full text-left px-2 py-1 rounded-md text-[11px] transition-colors flex items-center gap-2 ${
                      isActive
                        ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] font-medium'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${color.dot}`} />
                    <span className="truncate">{tag.name}</span>
                  </button>
                );
              })}
            </FilterSection>
          )}
        </div>
      )}
    </div>
  );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-[var(--border-subtle)] pt-1.5 first:border-0 first:pt-0">
      <div className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider px-1 mb-0.5">
        {label}
      </div>
      {children}
    </div>
  );
}

function FilterOption({
  label,
  dot,
  active,
  onClick,
}: {
  label: string;
  dot?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-2 py-1 rounded-md text-[11px] transition-colors flex items-center gap-2 ${
        active
          ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] font-medium'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
      }`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />}
      {label}
    </button>
  );
}

/** Active filter pills shown below the toolbar */
export function ActiveFilterPills({
  filters,
  onChange,
}: {
  filters: RecordFilterState;
  onChange: (filters: RecordFilterState) => void;
}) {
  const tags = useTagsStore((s) => s.tags);
  if (!hasActiveFilters(filters)) return null;

  const pills: { label: string; onRemove: () => void }[] = [];

  if (filters.priority !== 'all') {
    const p = PRIORITIES.find((p) => p.value === filters.priority);
    pills.push({
      label: `Priority: ${p?.label ?? filters.priority}`,
      onRemove: () => onChange({ ...filters, priority: 'all' }),
    });
  }
  if (filters.type !== 'all') {
    const t = TYPES.find((t) => t.value === filters.type);
    pills.push({
      label: `Type: ${t?.label ?? filters.type}`,
      onRemove: () => onChange({ ...filters, type: 'all' }),
    });
  }
  if (filters.recordStatus !== 'all') {
    const s = RECORD_STATUSES.find((s) => s.value === filters.recordStatus);
    pills.push({
      label: `Status: ${s?.label ?? filters.recordStatus}`,
      onRemove: () => onChange({ ...filters, recordStatus: 'all' }),
    });
  }
  for (const tagId of filters.tagIds) {
    const tag = tags.find((t) => t.id === tagId);
    if (tag) {
      pills.push({
        label: tag.name,
        onRemove: () => onChange({ ...filters, tagIds: filters.tagIds.filter((id) => id !== tagId) }),
      });
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {pills.map((pill) => (
        <span
          key={pill.label}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-500 text-[10px] font-medium"
        >
          {pill.label}
          <button onClick={pill.onRemove} className="hover:text-purple-300 transition-colors">
            <X className="w-2.5 h-2.5" />
          </button>
        </span>
      ))}
    </div>
  );
}
