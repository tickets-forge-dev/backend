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
