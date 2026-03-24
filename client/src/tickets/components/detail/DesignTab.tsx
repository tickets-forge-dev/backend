'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { type DesignReference } from '@repo/shared-types';
import { Eye, Figma, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { Button } from '@/core/components/ui/button';
import { DesignReferencesSection } from './DesignReferencesSection';
import { AddDesignLinkDialog } from './AddDesignLinkDialog';
import { VisualExpectationsSection } from '@/src/tickets/components/VisualExpectationsSection';
import type { VisualExpectationsSpec, ExcalidrawDataSpec } from '@/types/question-refinement';
import { TicketService } from '@/services/ticket.service';
import { useTeamStore } from '@/teams/stores/team.store';
import { toast } from 'sonner';

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
  onRefresh?: () => Promise<void>; // Callback to refresh ticket data
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
  const [showValidationError, setShowValidationError] = useState(false);
  const [showRegenerateForm, setShowRegenerateForm] = useState(false);
  const ticketService = useMemo(() => new TicketService(), []);

  const wireframeContextMissing = !wireframeContext.trim();

  // Clear validation error when user starts typing
  useEffect(() => {
    if (wireframeContext.trim()) {
      setShowValidationError(false);
    }
  }, [wireframeContext]);

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
      if (user) {
        headers['Authorization'] = `Bearer ${await user.getIdToken()}`;
      }
      const teamId = useTeamStore.getState().currentTeam?.id;
      if (teamId) {
        headers['x-team-id'] = teamId;
      }
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
    if (wireframeContextMissing) {
      setShowValidationError(true);
      return;
    }
    setIsGeneratingWireframes(true);
    try {
      await ticketService.generateWireframes(ticketId, wireframeContext);
      toast.success('Wireframes generated');
      setShowRegenerateForm(false);
      if (onRefresh) await onRefresh();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to generate wireframes';
      toast.error(msg);
    } finally {
      setIsGeneratingWireframes(false);
    }
  }, [ticketId, wireframeContext, wireframeContextMissing, ticketService, onRefresh]);

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

  /** Shared wireframe context form used in both empty and regenerate states */
  const wireframeContextForm = (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium text-[var(--text-secondary)]">
          Describe the UI <span className="text-red-400">*</span>
        </label>
        <button
          type="button"
          onClick={handleGenerateUIDescription}
          disabled={isGeneratingUIDesc || !ticketTitle}
          className="inline-flex items-center gap-1 text-[11px] text-purple-500 hover:text-purple-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isGeneratingUIDesc ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
          {isGeneratingUIDesc ? 'Generating...' : 'Generate with AI'}
        </button>
      </div>
      <textarea
        value={wireframeContext}
        onChange={(e) => setWireframeContext(e.target.value)}
        placeholder="e.g. A dashboard with a sidebar nav, header with search, and a main content area showing a data table with filters..."
        rows={3}
        className={`w-full rounded-md border bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-purple-500/30 resize-none ${
          showValidationError && wireframeContextMissing ? 'border-red-400/50' : 'border-[var(--border-subtle)]'
        }`}
        disabled={isGeneratingWireframes}
      />
      {showValidationError && wireframeContextMissing && (
        <p className="text-[11px] text-red-400 mt-1">Describe the layout so the AI can generate accurate wireframes</p>
      )}
    </div>
  );

  return (
    <div className="space-y-8 p-5">
      {/* ─── AI-Generated Wireframes ─── */}
      {hasVisualExpectations ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Eye className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-[var(--text)]">Visual QA Expectations</h3>
                <p className="text-[11px] text-[var(--text-tertiary)]">AI-generated wireframes and screen expectations</p>
              </div>
            </div>
            <Button
              onClick={() => setShowRegenerateForm(!showRegenerateForm)}
              variant="ghost"
              size="sm"
              className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Regenerate
            </Button>
          </div>

          {/* Regenerate form (collapsible) */}
          {showRegenerateForm && (
            <div className="rounded-lg border border-dashed border-purple-500/20 bg-purple-500/5 p-5 mb-4">
              <div className="flex flex-col items-center text-center gap-3">
                <p className="text-xs text-[var(--text-secondary)]">
                  Provide a new UI description to regenerate wireframes
                </p>
                {wireframeContextForm}
                <div className="flex items-center gap-2 mt-1">
                  <Button
                    onClick={() => setShowRegenerateForm(false)}
                    variant="ghost"
                    size="sm"
                    disabled={isGeneratingWireframes}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGenerateWireframes}
                    disabled={isGeneratingWireframes}
                    variant="outline"
                    size="sm"
                  >
                    {isGeneratingWireframes ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                        Regenerate Wireframes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-lg bg-[var(--bg-subtle)] p-4">
            <VisualExpectationsSection
              summary={visualExpectations!.summary}
              expectations={visualExpectations!.expectations}
              flowDiagram={visualExpectations!.flowDiagram}
              excalidrawData={visualExpectations!.excalidrawData}
              wireframeHtml={wireframeHtml}
              ticketId={ticketId}
              onSaveExcalidraw={handleSaveExcalidraw}
            />
          </div>
        </div>
      ) : (
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
          <div className="rounded-lg border border-dashed border-[var(--border-subtle)] p-8">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">No wireframes generated</p>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
                  Generate AI wireframes showing expected screen states, layouts, and user flows
                </p>
              </div>
              {wireframeContextForm}
              <Button
                onClick={handleGenerateWireframes}
                disabled={isGeneratingWireframes}
                variant="outline"
                size="sm"
                className="mt-1"
              >
                {isGeneratingWireframes ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Generate Wireframes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Divider between sections */}
      <div className="border-t border-[var(--border-subtle)]" />

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
