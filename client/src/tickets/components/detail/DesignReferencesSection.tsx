'use client';

import React, { useState } from 'react';
import { ExternalLink, Trash2, Plus } from 'lucide-react';
import { type DesignReference } from '@repo/shared-types';

interface DesignReferencesSectionProps {
  references: DesignReference[];
  onAdd?: () => void;
  onRemove: (referenceId: string) => Promise<void>;
  readOnly?: boolean;
}

const PLATFORM_ICONS: Record<string, string> = {
  figma: '🎨',
  loom: '📹',
  miro: '🎯',
  sketch: '✏️',
  whimsical: '🌈',
  other: '🔗',
};

const PLATFORM_NAMES: Record<string, string> = {
  figma: 'Figma',
  loom: 'Loom',
  miro: 'Miro',
  sketch: 'Sketch',
  whimsical: 'Whimsical',
  other: 'Other',
};

export function DesignReferencesSection({
  references,
  onAdd,
  onRemove,
  readOnly = false,
}: DesignReferencesSectionProps) {
  const [removing, setRemoving] = useState<Set<string>>(new Set());

  const handleRemove = async (referenceId: string) => {
    try {
      setRemoving((prev) => new Set(prev).add(referenceId));
      await onRemove(referenceId);
    } finally {
      setRemoving((prev) => {
        const next = new Set(prev);
        next.delete(referenceId);
        return next;
      });
    }
  };

  if (references.length === 0 && !onAdd) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Design References ({references.length})
        </h3>
        {onAdd && !readOnly && (
          <button
            onClick={onAdd}
            className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 dark:text-blue-400
              hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            <Plus size={14} />
            Add Link
          </button>
        )}
      </div>

      {references.length === 0 ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          No design references added yet.
        </p>
      ) : (
        <div className="space-y-2">
          {references.map((ref) => (
            <div
              key={ref.id}
              className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700"
            >
              <div className="text-lg flex-shrink-0">
                {PLATFORM_ICONS[ref.platform] || PLATFORM_ICONS.other}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {ref.title || PLATFORM_NAMES[ref.platform] || PLATFORM_NAMES.other}
                </p>
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={ref.url}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate block"
                >
                  {ref.url || 'Unknown URL'}
                </a>
                {ref.addedBy && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Added by {ref.addedBy}
                  </p>
                )}
                {ref.addedAt && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {new Date(ref.addedAt).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="flex gap-1 flex-shrink-0">
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open in new tab"
                  className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <ExternalLink size={16} />
                </a>
                {!readOnly && (
                  <button
                    onClick={() => handleRemove(ref.id)}
                    disabled={removing.has(ref.id)}
                    title="Remove reference"
                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
