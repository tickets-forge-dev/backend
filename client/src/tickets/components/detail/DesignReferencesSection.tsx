'use client';

import Link from 'next/link';
import { type DesignReference } from '@repo/shared-types';
import { DesignReferenceCard } from './DesignReferenceCard';
import { Link2, Plus, Settings } from 'lucide-react';

interface DesignReferencesSectionProps {
  references: DesignReference[];
  onAdd?: () => void;
  onRemove: (referenceId: string) => Promise<void>;
  onRefresh?: (referenceId: string) => Promise<void>;
  readOnly?: boolean;
  isFigmaConnected?: boolean;
}

export function DesignReferencesSection({
  references,
  onAdd,
  onRemove,
  onRefresh,
  readOnly = false,
  isFigmaConnected = false,
}: DesignReferencesSectionProps) {
  if (references.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border-subtle)] py-10 px-6">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center">
            <Link2 className="h-4 w-4 text-[var(--text-tertiary)]" />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">No design references</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              Figma, Loom, Miro, or any design link
            </p>
          </div>
          {!readOnly && (
            <div className="flex items-center gap-3 mt-1">
              {onAdd && (
                <button
                  onClick={onAdd}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Add link
                </button>
              )}
              {!isFigmaConnected && (
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  <Settings className="h-3 w-3" />
                  Connect Figma
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {references.map((reference) => (
        <DesignReferenceCard
          key={reference.id}
          reference={reference}
          onRemove={onRemove}
          onRefresh={onRefresh}
          readOnly={readOnly}
        />
      ))}
      {onAdd && !readOnly && (
        <button
          onClick={onAdd}
          className="w-full flex items-center justify-center gap-1.5 px-4 py-2 border border-dashed border-[var(--border-subtle)] rounded-lg text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          <Plus className="h-3 w-3" />
          Add design link
        </button>
      )}
    </div>
  );
}
