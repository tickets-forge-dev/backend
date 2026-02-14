'use client';

import { type DesignReference } from '@repo/shared-types';
import { DesignReferenceCard } from './DesignReferenceCard';

interface DesignReferencesSectionProps {
  references: DesignReference[];
  onAdd?: () => void;
  onRemove: (referenceId: string) => Promise<void>;
  onRefresh?: (referenceId: string) => Promise<void>;
  readOnly?: boolean;
}

export function DesignReferencesSection({
  references,
  onAdd,
  onRemove,
  onRefresh,
  readOnly = false,
}: DesignReferencesSectionProps) {
  if (references.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px] rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="text-center">
          <div className="text-4xl mb-3">🎨</div>
          <p className="text-sm font-medium text-[var(--text-secondary)]">No design references added yet</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">Design links (Figma, Loom, etc.) will appear here</p>
          {onAdd && !readOnly && (
            <button
              onClick={onAdd}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              Add Design Link
            </button>
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
