'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface ToggleOptionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  onToggle: () => void;
  hint?: string;
  /** Override styling when card is in a special state (e.g., deferred) */
  accentClass?: string;
  /** Disable the toggle switch */
  toggleDisabled?: boolean;
  children?: React.ReactNode;
  /** Footer content rendered below the expandable area */
  footer?: React.ReactNode;
  /** Force expand the card (e.g., for validation errors) */
  forceExpanded?: boolean;
  /** Text for the collapsed hint — defaults to "Click to add context (optional)" */
  collapsedHint?: string;
}

/**
 * ToggleOptionCard — Reusable card with toggle, expandable content, and smooth animation.
 *
 * ON state: green left border accent, expanded children with CSS grid-rows transition.
 * OFF state: collapsed children, muted styling.
 */
export function ToggleOptionCard({
  title,
  description,
  icon,
  enabled,
  onToggle,
  accentClass,
  toggleDisabled,
  children,
  footer,
  forceExpanded,
  collapsedHint,
}: ToggleOptionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  // Measure content height for animation
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children, expanded, enabled]);

  // Collapse when disabled (but don't auto-expand when enabled — user clicks to expand)
  useEffect(() => {
    if (!enabled) {
      setExpanded(false);
    }
  }, [enabled]);

  // Force expand when parent requests it (e.g., validation error)
  useEffect(() => {
    if (forceExpanded && enabled) {
      setExpanded(true);
    }
  }, [forceExpanded, enabled]);

  const handleExpandToggle = () => {
    if (enabled) setExpanded((prev) => !prev);
  };

  const borderClass = accentClass
    ? accentClass
    : enabled
      ? 'border-[var(--border-hover)]'
      : 'border-[var(--border-subtle)] bg-[var(--bg-subtle)]';

  return (
    <div className={`rounded-lg border transition-all duration-200 ${borderClass}`}>
      {/* Header: icon + title + chevron + toggle */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={handleExpandToggle}
          className="flex items-center gap-3 flex-1 text-left min-w-0"
        >
          {icon}
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--text)]">{title}</p>
            <p className="text-xs text-[var(--text-secondary)] truncate">{description}</p>
          </div>
          {enabled && (
            <ChevronDown
              className={`h-4 w-4 text-[var(--text-tertiary)] flex-shrink-0 transition-transform duration-200 ${
                expanded ? 'rotate-180' : ''
              }`}
            />
          )}
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={onToggle}
          disabled={toggleDisabled}
          className={`relative ml-3 inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors ${
            toggleDisabled
              ? 'bg-gray-300 dark:bg-gray-600 opacity-50 cursor-not-allowed'
              : enabled
                ? 'bg-[var(--text-tertiary)] cursor-pointer'
                : 'bg-gray-300 dark:bg-gray-600 cursor-pointer'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform mt-0.5 ${
              enabled && !toggleDisabled ? 'translate-x-[18px]' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Expandable content with smooth height transition */}
      <div
        className="overflow-hidden transition-[max-height,opacity] duration-200 ease-in-out"
        style={{
          maxHeight: enabled && expanded ? `${contentHeight + 16}px` : '0px',
          opacity: enabled && expanded ? 1 : 0,
        }}
      >
        <div ref={contentRef} className="border-t border-[var(--border-subtle)] px-4 py-4">
          {children}
        </div>
      </div>

      {/* Collapsed hint to expand */}
      {enabled && !expanded && children && (
        <button
          type="button"
          onClick={handleExpandToggle}
          className="w-full text-left px-4 pb-3 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:underline"
        >
          {collapsedHint || 'Click to add context (optional)'}
        </button>
      )}

      {/* Footer (e.g., checkbox) */}
      {footer}
    </div>
  );
}
