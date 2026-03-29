'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Loader2, Upload, Check } from 'lucide-react';
import { useExportStrategy, type ExportPlatform } from '@/tickets/hooks/useExportStrategy';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string | null;
}

const SECTIONS = [
  { id: 'problem', label: 'Problem' },
  { id: 'solution', label: 'Solution' },
  { id: 'criteria', label: 'Criteria' },
  { id: 'files', label: 'Files' },
  { id: 'api', label: 'APIs' },
  { id: 'dependencies', label: 'Dependencies' },
  { id: 'tests', label: 'Tests' },
  { id: 'scope', label: 'Scope' },
] as const;

const ALL_SECTION_IDS = SECTIONS.map((s) => s.id);

export function ExportDialog({ open, onOpenChange, ticketId }: ExportDialogProps) {
  const [platform, setPlatform] = useState<ExportPlatform>('linear');
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set(ALL_SECTION_IDS));
  const [connectionsChecked, setConnectionsChecked] = useState(false);

  const linear = useExportStrategy('linear');
  const jira = useExportStrategy('jira');
  const strategy = platform === 'linear' ? linear : jira;

  // Check connections when dialog opens
  const checkConnections = useCallback(async () => {
    setConnectionsChecked(false);
    const [linearOk, jiraOk] = await Promise.allSettled([
      linear.checkConnection(),
      jira.checkConnection(),
    ]);

    const isLinearConnected = linearOk.status === 'fulfilled' && linearOk.value;
    const isJiraConnected = jiraOk.status === 'fulfilled' && jiraOk.value;

    // Default to connected platform (prefer Linear)
    if (isLinearConnected) {
      setPlatform('linear');
    } else if (isJiraConnected) {
      setPlatform('jira');
    }

    setConnectionsChecked(true);
  }, [linear, jira]);

  useEffect(() => {
    if (open) {
      checkConnections();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load targets when platform changes and is connected
  useEffect(() => {
    if (open && connectionsChecked && strategy.connected && strategy.targets.length === 0) {
      strategy.loadTargets();
    }
  }, [open, connectionsChecked, platform]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePlatformChange = (p: ExportPlatform) => {
    setPlatform(p);
  };

  const handleExport = async () => {
    if (!ticketId) return;
    const sections = strategy.supportsSections ? Array.from(selectedSections) : undefined;
    const success = await strategy.doExport(ticketId, sections);
    if (success) {
      onOpenChange(false);
    }
  };

  const toggleSection = (id: string) => {
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const canExport = strategy.connected && strategy.selectedTarget && !strategy.isExporting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Ticket</DialogTitle>
          <DialogDescription>
            Export this ticket to an external project management tool.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Platform segmented control */}
          {!connectionsChecked ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--text-tertiary)]" />
              <span className="ml-2 text-[13px] text-[var(--text-secondary)]">Checking connections...</span>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                  Platform
                </label>
                <div className="flex rounded-lg bg-[var(--bg-subtle)] p-0.5 border border-[var(--border-subtle)]">
                  <SegmentButton
                    active={platform === 'linear'}
                    connected={linear.connected}
                    onClick={() => handlePlatformChange('linear')}
                  >
                    Linear
                  </SegmentButton>
                  <SegmentButton
                    active={platform === 'jira'}
                    connected={jira.connected}
                    onClick={() => handlePlatformChange('jira')}
                  >
                    Jira
                  </SegmentButton>
                </div>
              </div>

              {/* Target selector */}
              {strategy.connected === false ? (
                <p className="text-[13px] text-[var(--text-tertiary)] py-2">
                  Connect {strategy.label} in Settings to export tickets.
                </p>
              ) : strategy.isLoadingTargets ? (
                <div className="flex items-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-[var(--text-tertiary)]" />
                  <span className="ml-2 text-[13px] text-[var(--text-secondary)]">Loading {strategy.targetLabel.toLowerCase()}s...</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                    {strategy.targetLabel}
                  </label>
                  <select
                    value={strategy.selectedTarget}
                    onChange={(e) => strategy.setSelectedTarget(e.target.value)}
                    className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3 py-2 text-[13px] text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--border-hover)] transition-colors"
                  >
                    <option value="">Select a {strategy.targetLabel.toLowerCase()}...</option>
                    {strategy.targets.map((target) => (
                      <option key={target.id} value={target.id}>
                        {target.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Section toggles — Jira only */}
              {strategy.supportsSections && strategy.connected && (
                <div className="space-y-1.5 pt-3 border-t border-[var(--border-subtle)]">
                  <label className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                    Sections to Export
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {SECTIONS.map((section) => {
                      const selected = selectedSections.has(section.id);
                      return (
                        <button
                          key={section.id}
                          onClick={() => toggleSection(section.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-md text-[13px] transition-colors cursor-pointer ${
                            selected
                              ? 'bg-[var(--bg-hover)] text-[var(--text)]'
                              : 'bg-transparent text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]'
                          }`}
                        >
                          <span className={`flex items-center justify-center w-3.5 h-3.5 rounded border transition-colors ${
                            selected
                              ? 'bg-[var(--text-secondary)] border-[var(--text-secondary)]'
                              : 'border-[var(--border-hover)] bg-transparent'
                          }`}>
                            {selected && <Check className="h-2.5 w-2.5 text-[var(--bg)]" strokeWidth={3} />}
                          </span>
                          {section.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={strategy.isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={!canExport}>
            {strategy.isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Export to {strategy.label}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Segmented control button */
function SegmentButton({
  active,
  connected,
  onClick,
  children,
}: {
  active: boolean;
  connected: boolean | null;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors cursor-pointer ${
        active
          ? 'bg-[var(--bg-hover)] text-[var(--text)] shadow-sm'
          : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
      }`}
    >
      {children}
      {connected === false && (
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)] opacity-50" />
      )}
    </button>
  );
}
