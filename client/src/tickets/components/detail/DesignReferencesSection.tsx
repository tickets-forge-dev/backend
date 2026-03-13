'use client';

import Link from 'next/link';
import { type DesignReference } from '@repo/shared-types';
import { DesignReferenceCard } from './DesignReferenceCard';
import { Link2, Settings } from 'lucide-react';

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
      <div className="flex items-center justify-center min-h-[200px] rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="text-center">
          <div className="text-4xl mb-3">🎨</div>
          <p className="text-sm font-medium text-[var(--text-secondary)]">No design references added yet</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1 max-w-xs leading-relaxed">
            Add Figma, Loom, Miro, or any design link to extract colors, typography, layout specs, and component details for more accurate tickets.
          </p>
          {!readOnly && (
            <div className="mt-4 flex flex-col items-center gap-2">
              {onAdd && (
                <button
                  onClick={onAdd}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Add Design Link
                </button>
              )}
              {!isFigmaConnected && (
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  <Settings className="h-3 w-3" />
                  Connect Figma for rich previews
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
          className="w-full px-4 py-2 border border-dashed border-[var(--border)] rounded-md text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          + Add Design Link
        </button>
      )}
    </div>
  );
}
