'use client';

import React, { useState } from 'react';
import { type DesignReference } from '@repo/shared-types';
import { DesignReferencesSection } from './DesignReferencesSection';
import { AddDesignLinkDialog } from './AddDesignLinkDialog';

interface DesignTabProps {
  ticketId: string;
  references: DesignReference[];
  onAddDesignReference: (url: string, title?: string) => Promise<void>;
  onRemoveDesignReference: (referenceId: string) => Promise<void>;
}

export function DesignTab({
  ticketId,
  references,
  onAddDesignReference,
  onRemoveDesignReference,
}: DesignTabProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleAddDesignLink = async (url: string, title?: string) => {
    await onAddDesignReference(url, title);
    setShowAddDialog(false);
  };

  return (
    <div className="space-y-6 p-5">
      <DesignReferencesSection
        references={references}
        onAdd={() => setShowAddDialog(true)}
        onRemove={onRemoveDesignReference}
        readOnly={false}
      />

      {showAddDialog && (
        <AddDesignLinkDialog
          onAdd={handleAddDesignLink}
          onClose={() => setShowAddDialog(false)}
        />
      )}

      {/* Empty state message */}
      {references.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            No design references yet
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
            Add Figma mockups, Loom videos, or other design resources to provide visual context
          </p>
          <button
            onClick={() => setShowAddDialog(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium
              transition-colors"
          >
            Add Design Link
          </button>
        </div>
      )}
    </div>
  );
}
