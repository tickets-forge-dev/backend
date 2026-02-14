'use client';

import React, { useState, useEffect } from 'react';
import { type DesignReference } from '@repo/shared-types';
import { DesignReferencesSection } from './DesignReferencesSection';
import { AddDesignLinkDialog } from './AddDesignLinkDialog';

interface DesignTabProps {
  ticketId: string;
  references: DesignReference[];
  onAddDesignReference: (url: string, title?: string) => Promise<void>;
  onRemoveDesignReference: (referenceId: string) => Promise<void>;
  onRefreshDesignReference?: (referenceId: string) => Promise<void>;
  onRefresh?: () => Promise<void>; // Callback to refresh ticket data
}

export function DesignTab({
  ticketId,
  references,
  onAddDesignReference,
  onRemoveDesignReference,
  onRefreshDesignReference,
  onRefresh,
}: DesignTabProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Poll for metadata updates while any design reference is pending
  useEffect(() => {
    const hasPendingMetadata = references.some(
      (ref) => ref.metadataFetchStatus === 'pending'
    );

    if (!hasPendingMetadata || !onRefresh) return;

    // Start polling every 2 seconds while metadata is being fetched
    const interval = setInterval(() => {
      onRefresh().catch((error) => {
        console.error('Failed to refresh design metadata:', error);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [references, onRefresh]);

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
        onRefresh={onRefreshDesignReference}
        readOnly={false}
      />

      {showAddDialog && (
        <AddDesignLinkDialog
          onAdd={handleAddDesignLink}
          onClose={() => setShowAddDialog(false)}
        />
      )}
    </div>
  );
}
