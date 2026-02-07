'use client';

import { ReactNode, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
  id: string;
  title: string;
  defaultExpanded?: boolean;
  children: ReactNode;
  className?: string;
}

export function CollapsibleSection({
  id,
  title,
  defaultExpanded = false,
  children,
  className = '',
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div
      id={id}
      data-nav-section
      className={`rounded-lg bg-[var(--bg-subtle)] overflow-hidden ${className}`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full p-4 hover:bg-[var(--bg-hover)] transition-colors"
      >
        <h3 className="text-[var(--text-sm)] font-medium text-[var(--text)]">
          {title}
        </h3>
        <ChevronDown
          className={`h-4 w-4 text-[var(--text-tertiary)] transition-transform flex-shrink-0 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isExpanded && (
        <div className="border-t border-[var(--border)] px-4 py-3">
          {children}
        </div>
      )}
    </div>
  );
}
