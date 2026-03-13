'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Pencil, Save, X, Sparkles, Undo2, Check, Send, Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { TicketService } from '@/services/ticket.service';
import type { ExcalidrawDataSpec } from '@/types/question-refinement';

const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then((m) => m.Excalidraw),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] rounded-lg bg-[var(--bg-subtle)] animate-pulse flex items-center justify-center">
        <span className="text-sm text-[var(--text-tertiary)]">Loading wireframe editor...</span>
      </div>
    ),
  },
);

type EditorMode = 'view' | 'edit' | 'refine';

interface ExcalidrawEditorProps {
  excalidrawData: ExcalidrawDataSpec;
  ticketId: string;
  onSave: (updatedData: ExcalidrawDataSpec) => Promise<void>;
}

export function ExcalidrawEditor({ excalidrawData, ticketId, onSave }: ExcalidrawEditorProps) {
  const [mode, setMode] = useState<EditorMode>('view');
  const [elements, setElements] = useState<any[]>(excalidrawData.elements);
  const [preRefineElements, setPreRefineElements] = useState<any[] | null>(null);
  const [refineInput, setRefineInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const ticketService = useMemo(() => new TicketService(), []);

  const handleChange = useCallback(
    (els: readonly any[]) => {
      if (mode === 'edit') {
        setElements([...els]);
      }
    },
    [mode],
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedData: ExcalidrawDataSpec = {
        ...excalidrawData,
        elements,
      };
      await onSave(updatedData);
      setMode('view');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setElements(excalidrawData.elements);
    setMode('view');
  };

  const handleStartRefine = () => {
    setPreRefineElements([...elements]);
    setMode('refine');
  };

  const handleRefineSubmit = async () => {
    if (!refineInput.trim()) return;
    setIsRefining(true);
    try {
      const refined = await ticketService.refineWireframe(ticketId, refineInput.trim(), elements);
      setElements(refined);
      setRefineInput('');
    } catch (error) {
      console.error('Wireframe refinement failed:', error);
    } finally {
      setIsRefining(false);
    }
  };

  const handleRefineAccept = () => {
    setPreRefineElements(null);
    setMode('view');
  };

  const handleRefineRevert = () => {
    if (preRefineElements) {
      setElements(preRefineElements);
    }
    setPreRefineElements(null);
    setRefineInput('');
    setMode('view');
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
          Excalidraw Wireframe
        </span>
        <div className="flex items-center gap-2">
          {mode === 'view' && (
            <>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7" onClick={() => setMode('edit')}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7" onClick={handleStartRefine}>
                <Sparkles className="h-3.5 w-3.5" />
                Refine with AI
              </Button>
            </>
          )}
          {mode === 'edit' && (
            <>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7" onClick={handleCancelEdit}>
                <X className="h-3.5 w-3.5" />
                Cancel
              </Button>
              <Button size="sm" className="gap-1.5 text-xs h-7" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save
              </Button>
            </>
          )}
          {mode === 'refine' && (
            <>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7" onClick={handleRefineRevert}>
                <Undo2 className="h-3.5 w-3.5" />
                Revert
              </Button>
              <Button size="sm" className="gap-1.5 text-xs h-7" onClick={handleRefineAccept}>
                <Check className="h-3.5 w-3.5" />
                Accept
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div
        className="rounded-lg border border-[var(--border-subtle)] overflow-hidden bg-white"
        style={{ height: 500 }}
      >
        <Excalidraw
          initialData={{ elements, scrollToContent: true }}
          viewModeEnabled={mode === 'view'}
          zenModeEnabled={mode === 'view'}
          gridModeEnabled={mode === 'edit'}
          onChange={handleChange}
          theme="light"
        />
      </div>

      {/* Refine input */}
      {mode === 'refine' && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={refineInput}
            onChange={(e) => setRefineInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isRefining && handleRefineSubmit()}
            placeholder="Describe your changes... e.g. 'Make the table wider and add a search bar'"
            className="flex-1 h-9 px-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg)] text-sm text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
            disabled={isRefining}
          />
          <Button
            size="sm"
            className="gap-1.5 h-9"
            onClick={handleRefineSubmit}
            disabled={isRefining || !refineInput.trim()}
          >
            {isRefining ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {isRefining ? 'Refining...' : 'Send'}
          </Button>
        </div>
      )}
    </div>
  );
}
