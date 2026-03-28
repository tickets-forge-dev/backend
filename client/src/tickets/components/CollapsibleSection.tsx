'use client';

import { ReactNode, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
  id: string;
  title: string;
  badge?: string;
  defaultExpanded?: boolean;
  isExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  children: ReactNode;
  className?: string;
  previewMode?: boolean; // Show 30% of content with fade effect
  variant?: 'default' | 'attention'; // 'attention' adds amber highlight for actionable sections
  attentionLabel?: string; // Optional label shown next to title in attention mode
}

export function CollapsibleSection({
  id,
  title,
  badge,
  defaultExpanded = false,
  isExpanded: controlledExpanded,
  onExpandedChange,
  children,
  className = '',
  previewMode = false,
  variant = 'default',
  attentionLabel,
}: CollapsibleSectionProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    if (controlledExpanded === undefined) {
      setInternalExpanded(newExpanded);
    }
    onExpandedChange?.(newExpanded);
  };

  return (
    <div
      id={id}
      className={`rounded-lg overflow-hidden ${
        variant === 'attention'
          ? 'bg-amber-500/5 ring-1 ring-amber-500/20'
          : 'bg-[var(--bg-subtle)]'
      } ${className}`}
    >
      <button
        onClick={handleToggle}
        className={`flex items-center justify-between w-full p-4 transition-colors ${
          variant === 'attention'
            ? 'hover:bg-amber-500/10'
            : 'hover:bg-[var(--bg-hover)]'
        }`}
      >
        <div className="flex items-center gap-2">
          <h3 className={`text-[var(--text-sm)] font-medium ${
            variant === 'attention' ? 'text-amber-500' : 'text-[var(--text)]'
          }`}>
            {title}
          </h3>
          {attentionLabel && variant === 'attention' && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              {attentionLabel}
            </span>
          )}
          {badge && (
            <span className={`text-[11px] px-1.5 py-0.5 rounded ${
              variant === 'attention'
                ? 'text-amber-500/70 bg-amber-500/10'
                : 'text-[var(--text-tertiary)] bg-[var(--bg-hover)]'
            }`}>
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

      {/* Content - shown when expanded or in preview mode */}
      {isExpanded || previewMode ? (
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
      ) : null}

      {/* Show More button */}
      {previewMode && !isExpanded && (
        <div className="border-t border-[var(--border)] px-5 py-3">
          <button
            onClick={() => {
              if (controlledExpanded === undefined) {
                setInternalExpanded(true);
              }
              onExpandedChange?.(true);
            }}
            className="text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            Show More
          </button>
        </div>
      )}
    </div>
  );
}
