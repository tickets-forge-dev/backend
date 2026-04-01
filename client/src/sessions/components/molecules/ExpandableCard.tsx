'use client';

import { useState, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

interface ExpandableCardProps {
  header: ReactNode;
  children?: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

export function ExpandableCard({ header, children, defaultExpanded = false, className = '' }: ExpandableCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasContent = !!children;

  return (
    <div className={`bg-[var(--bg-hover)] border border-[var(--border-subtle)] rounded-md overflow-hidden ${className}`}>
      <button
        onClick={() => hasContent && setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-[var(--bg-active)] transition-colors"
      >
        {header}
        {hasContent && (
          <ChevronRight className={`w-3 h-3 text-[var(--text-tertiary)] transition-transform ${expanded ? 'rotate-90' : ''}`} />
        )}
      </button>
      {expanded && children && (
        <div className="border-t border-[var(--border-subtle)]">
          {children}
        </div>
      )}
    </div>
  );
}
