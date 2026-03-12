'use client';

import React, { useState, useEffect } from 'react';
import { type DesignReference } from '@repo/shared-types';
import { Eye, Figma } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { DesignReferencesSection } from './DesignReferencesSection';
import { AddDesignLinkDialog } from './AddDesignLinkDialog';
import { VisualExpectationsSection } from '@/src/tickets/components/VisualExpectationsSection';
import type { VisualExpectationsSpec } from '@/types/question-refinement';

interface DesignTabProps {
  ticketId: string;
  references: DesignReference[];
  visualExpectations?: VisualExpectationsSpec;
  onAddDesignReference: (url: string, title?: string) => Promise<void>;
  onRemoveDesignReference: (referenceId: string) => Promise<void>;
  onRefreshDesignReference?: (referenceId: string) => Promise<void>;
  onRefresh?: () => Promise<void>; // Callback to refresh ticket data
}

export function DesignTab({
  ticketId,
  references,
  visualExpectations,
  onAddDesignReference,
  onRemoveDesignReference,
  onRefreshDesignReference,
  onRefresh,
}: DesignTabProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isFigmaConnected, setIsFigmaConnected] = useState(false);

  // Check Figma connection status on mount
  useEffect(() => {
    const checkFigmaStatus = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const idToken = await user.getIdToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
        const response = await fetch(`${apiUrl}/integrations/figma/oauth/status`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (response.ok) {
          const data = await response.json();
          setIsFigmaConnected(data.connected === true);
        }
      } catch {
        // Silently fail — default to not connected
      }
    };
    checkFigmaStatus();
  }, []);

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

  const hasVisualExpectations = (visualExpectations?.expectations?.length ?? 0) > 0;
  const hasReferences = references.length > 0;

  return (
    <div className="space-y-8 p-5">
      {/* ─── AI-Generated Wireframes ─── */}
      {hasVisualExpectations && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Eye className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-[var(--text)]">Visual QA Expectations</h3>
              <p className="text-[11px] text-[var(--text-tertiary)]">AI-generated wireframes and screen expectations</p>
            </div>
          </div>
          <div className="rounded-lg bg-[var(--bg-subtle)] p-4">
            <VisualExpectationsSection
              summary={visualExpectations!.summary}
              expectations={visualExpectations!.expectations}
              flowDiagram={visualExpectations!.flowDiagram}
            />
          </div>
        </div>
      )}

      {/* Divider between sections */}
      {hasVisualExpectations && (
        <div className="border-t border-[var(--border-subtle)]" />
      )}

      {/* ─── External Design References (Figma, Loom, etc.) ─── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Figma className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-[var(--text)]">Design References</h3>
            <p className="text-[11px] text-[var(--text-tertiary)]">Link designs to extract colors, themes, layouts, and component specs</p>
          </div>
        </div>
        <DesignReferencesSection
          references={references}
          onAdd={() => setShowAddDialog(true)}
          onRemove={onRemoveDesignReference}
          onRefresh={onRefreshDesignReference}
          readOnly={false}
          isFigmaConnected={isFigmaConnected}
        />
      </div>

      {showAddDialog && (
        <AddDesignLinkDialog
          onAdd={handleAddDesignLink}
          onClose={() => setShowAddDialog(false)}
        />
      )}
    </div>
  );
}
