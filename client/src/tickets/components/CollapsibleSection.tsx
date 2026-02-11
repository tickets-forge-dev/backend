'use client';

import { ReactNode, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
  id: string;
  title: string;
  badge?: string;
  defaultExpanded?: boolean;
  children: ReactNode;
  className?: string;
  previewMode?: boolean; // Show 30% of content with fade effect
}

export function CollapsibleSection({
  id,
  title,
  badge,
  defaultExpanded = false,
  children,
  className = '',
  previewMode = false,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div
      id={id}
      className={`rounded-lg bg-[var(--bg-subtle)] overflow-hidden ${className}`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full p-4 hover:bg-[var(--bg-hover)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-[var(--text-sm)] font-medium text-[var(--text)]">
            {title}
          </h3>
          {badge && (
            <span className="text-[11px] text-[var(--text-tertiary)] bg-[var(--bg-hover)] px-1.5 py-0.5 rounded">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-[var(--text-tertiary)] transition-transform flex-shrink-0 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Content - full or preview mode */}
      <div className={`border-t border-[var(--border)] px-5 py-4 ${
        previewMode && !isExpanded ? 'relative' : ''
      }`}
      style={previewMode && !isExpanded ? {
        maxHeight: '200px',
        overflow: 'hidden',
      } : {}}
      >
        {children}

        {/* Fade effect overlay */}
        {previewMode && !isExpanded && (
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[var(--bg-subtle)] to-transparent pointer-events-none" />
        )}
      </div>

      {/* Show More button */}
      {previewMode && !isExpanded && (
        <div className="border-t border-[var(--border)] px-5 py-3">
          <button
            onClick={() => setIsExpanded(true)}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            Show More
          </button>
        </div>
      )}
    </div>
  );
}
