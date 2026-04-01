'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { type DesignReference } from '@repo/shared-types';
import { Figma, Loader2, Sparkles, Monitor, Pencil } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { Button } from '@/core/components/ui/button';
import { DesignReferencesSection } from './DesignReferencesSection';
import { AddDesignLinkDialog } from './AddDesignLinkDialog';
import { DesignEditBlade } from './DesignEditBlade';
import { VisualExpectationsSection } from '@/src/tickets/components/VisualExpectationsSection';
import type { VisualExpectationsSpec, ExcalidrawDataSpec } from '@/types/question-refinement';
import { TicketService } from '@/services/ticket.service';
import { useTeamStore } from '@/teams/stores/team.store';
import { toast } from 'sonner';
import { createPortal } from 'react-dom';

interface DesignTabProps {
  ticketId: string;
  ticketTitle: string;
  ticketDescription: string | null;
  references: DesignReference[];
  visualExpectations?: VisualExpectationsSpec;
  wireframeHtml?: string | null;
  onAddDesignReference: (url: string, title?: string) => Promise<void>;
  onRemoveDesignReference: (referenceId: string) => Promise<void>;
  onRefreshDesignReference?: (referenceId: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
}

export function DesignTab({
  ticketId,
  ticketTitle,
  ticketDescription,
  references,
  visualExpectations,
  wireframeHtml,
  onAddDesignReference,
  onRemoveDesignReference,
  onRefreshDesignReference,
  onRefresh,
}: DesignTabProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isFigmaConnected, setIsFigmaConnected] = useState(false);
  const [isGeneratingWireframes, setIsGeneratingWireframes] = useState(false);
  const [isGeneratingUIDesc, setIsGeneratingUIDesc] = useState(false);
  const [wireframeContext, setWireframeContext] = useState('');
  const [editBladeOpen, setEditBladeOpen] = useState(false);
  const ticketService = useMemo(() => new TicketService(), []);

  const handleSaveExcalidraw = useCallback(async (data: ExcalidrawDataSpec) => {
    await ticketService.update(ticketId, {
      techSpec: {
        visualExpectations: {
          ...visualExpectations,
          excalidrawData: data,
        },
      },
    });
    if (onRefresh) await onRefresh();
  }, [ticketId, visualExpectations, ticketService, onRefresh]);

  const handleGenerateUIDescription = useCallback(async () => {
    if (!ticketTitle) return;
    setIsGeneratingUIDesc(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const user = auth.currentUser;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user) headers['Authorization'] = `Bearer ${await user.getIdToken()}`;
      const teamId = useTeamStore.getState().currentTeam?.id;
      if (teamId) headers['x-team-id'] = teamId;

      const res = await fetch(`${API_URL}/tickets/generate-ui-description`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title: ticketTitle, description: ticketDescription }),
      });
      if (!res.ok) throw new Error('Failed to generate');
      const data = await res.json();
      if (data.uiDescription) {
        setWireframeContext(data.uiDescription);
      }
    } catch {
      toast.error('Failed to generate UI description');
    } finally {
      setIsGeneratingUIDesc(false);
    }
  }, [ticketTitle, ticketDescription]);

  const handleGenerateWireframes = useCallback(async () => {
    setIsGeneratingWireframes(true);
    try {
      await ticketService.generateWireframes(ticketId, wireframeContext);
      toast.success('Wireframes generated');
      if (onRefresh) await onRefresh();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to generate wireframes';
      toast.error(msg);
    } finally {
      setIsGeneratingWireframes(false);
    }
  }, [ticketId, wireframeContext, ticketService, onRefresh]);

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
        // Silently fail
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
    const interval = setInterval(() => {
      onRefresh().catch(() => {});
    }, 2000);
    return () => clearInterval(interval);
  }, [references, onRefresh]);

  const handleAddDesignLink = async (url: string, title?: string) => {
    await onAddDesignReference(url, title);
    setShowAddDialog(false);
  };

  const hasVisualExpectations = (visualExpectations?.expectations?.length ?? 0) > 0;

  return (
    <div className="space-y-8 p-5">
      {/* ─── Card 1: Wireframes ─── */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] overflow-hidden">
        {hasVisualExpectations ? (
          <>
            <div className="flex items-center px-5 py-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-medium text-[var(--text)]">Wireframes</h3>
              </div>
            </div>
            <div className="p-5">
              <VisualExpectationsSection
                summary={visualExpectations!.summary}
                expectations={visualExpectations!.expectations}
                flowDiagram={visualExpectations!.flowDiagram}
                excalidrawData={visualExpectations!.excalidrawData}
                wireframeHtml={wireframeHtml}
                ticketId={ticketId}
                onSaveExcalidraw={handleSaveExcalidraw}
                onEditSpecifications={() => setEditBladeOpen(true)}
              />
            </div>
          </>
        ) : (
          <>
            <div className="px-5 py-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-medium text-[var(--text)]">Wireframes</h3>
              </div>
            </div>
            <div className="p-5">
              <div className="flex flex-col items-center text-center gap-3 py-4">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <p className="text-sm text-[var(--text-secondary)]">No wireframes yet</p>
                <p className="text-[11px] text-[var(--text-tertiary)] max-w-sm">
                  Generate screen specifications from the ticket&apos;s acceptance criteria and solution.
                </p>
                <Button onClick={handleGenerateWireframes} disabled={isGeneratingWireframes} variant="outline" size="sm" className="mt-1">
                  {isGeneratingWireframes ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Generating...</> : <><Sparkles className="w-3.5 h-3.5 mr-1.5" />Generate Wireframes</>}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── Card 2: Design References ─── */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <Figma className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-medium text-[var(--text)]">Design References</h3>
          </div>
        </div>
        <div className="p-5">
          <DesignReferencesSection
            references={references}
            onAdd={() => setShowAddDialog(true)}
            onRemove={onRemoveDesignReference}
            onRefresh={onRefreshDesignReference}
            readOnly={false}
            isFigmaConnected={isFigmaConnected}
          />
        </div>
      </div>

      {showAddDialog && (
        <AddDesignLinkDialog
          onAdd={handleAddDesignLink}
          onClose={() => setShowAddDialog(false)}
        />
      )}

      {/* Edit blade — rendered via portal */}
      {typeof window !== 'undefined' && createPortal(
        <DesignEditBlade
          open={editBladeOpen}
          onClose={() => setEditBladeOpen(false)}
          ticketId={ticketId}
          ticketTitle={ticketTitle}
          ticketDescription={ticketDescription}
          onRefresh={onRefresh}
        />,
        document.body
      )}
    </div>
  );
}
