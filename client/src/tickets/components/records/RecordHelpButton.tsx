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
        className="h-7 w-7 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
        aria-label="What are Change Records?"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-[280px] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-lg p-3 shadow-lg z-50">
          <div className="text-[11px] font-medium text-[var(--text-primary)] mb-1">
            Change Records
          </div>
          <div className="text-[11px] text-[var(--text-tertiary)] leading-relaxed">
            A timeline of everything that happened across your project — deliveries, decisions, and code changes over time.
          </div>
        </div>
      )}
    </div>
  );
}
