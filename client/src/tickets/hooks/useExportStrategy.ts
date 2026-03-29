import { useState, useCallback } from 'react';
import { useServices } from '@/services/index';
import { useTicketsStore } from '@/stores/tickets.store';
import { toast } from 'sonner';

export type ExportPlatform = 'linear' | 'jira';

export interface ExportTarget {
  id: string;
  label: string;
}

export interface ExportStrategy {
  platform: ExportPlatform;
  label: string;
  connected: boolean | null;
  targetLabel: string;
  targets: ExportTarget[];
  selectedTarget: string;
  setSelectedTarget: (id: string) => void;
  supportsSections: boolean;
  isLoadingTargets: boolean;
  isExporting: boolean;
  loadTargets: () => Promise<void>;
  checkConnection: () => Promise<boolean>;
  doExport: (ticketId: string, sections?: string[]) => Promise<boolean>;
}

export function useExportStrategy(platform: ExportPlatform): ExportStrategy {
  const { linearService, jiraService } = useServices();
  const { exportToLinear, exportToJira } = useTicketsStore();

  const [connected, setConnected] = useState<boolean | null>(null);
  const [targets, setTargets] = useState<ExportTarget[]>([]);
  const [selectedTarget, setSelectedTarget] = useState('');
  const [isLoadingTargets, setIsLoadingTargets] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      if (platform === 'linear') {
        const status = await linearService.getConnectionStatus();
        setConnected(status.connected);
        return status.connected;
      } else {
        const status = await jiraService.getConnectionStatus();
        setConnected(status.connected);
        return status.connected;
      }
    } catch (err) {
      console.error(`[ExportStrategy] ${platform} connection check failed:`, err);
      setConnected(false);
      return false;
    }
  }, [platform, linearService, jiraService]);

  const loadTargets = useCallback(async () => {
    setIsLoadingTargets(true);
    try {
      if (platform === 'linear') {
        const teams = await linearService.getTeams();
        const mapped = teams.map((t) => ({ id: t.id, label: `${t.name} (${t.key})` }));
        setTargets(mapped);
        if (mapped.length === 1) setSelectedTarget(mapped[0].id);
      } else {
        const projects = await jiraService.getProjects();
        const mapped = projects.map((p) => ({ id: p.key, label: `${p.name} (${p.key})` }));
        setTargets(mapped);
        if (mapped.length === 1) setSelectedTarget(mapped[0].id);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || `Failed to load ${platform === 'linear' ? 'teams' : 'projects'}`);
    } finally {
      setIsLoadingTargets(false);
    }
  }, [platform, linearService, jiraService]);

  const doExport = useCallback(async (ticketId: string, sections?: string[]): Promise<boolean> => {
    if (!selectedTarget) return false;
    setIsExporting(true);
    try {
      if (platform === 'linear') {
        const result = await exportToLinear(ticketId, selectedTarget);
        if (result) {
          toast.success(
            `Issue created: ${result.identifier}`,
            { style: { backgroundColor: '#22c55e', color: '#000000' } },
          );
          return true;
        }
      } else {
        const result = await exportToJira(ticketId, selectedTarget, sections ? Array.from(sections) : undefined);
        if (result) {
          toast.success(
            `Ticket created: ${result.issueKey}`,
            { style: { backgroundColor: '#22c55e', color: '#000000' } },
          );
          return true;
        }
      }
      toast.error('Export failed');
      return false;
    } catch (err: any) {
      toast.error(err?.message || 'Export failed');
      return false;
    } finally {
      setIsExporting(false);
    }
  }, [platform, selectedTarget, exportToLinear, exportToJira]);

  return {
    platform,
    label: platform === 'linear' ? 'Linear' : 'Jira',
    connected,
    targetLabel: platform === 'linear' ? 'Team' : 'Project',
    targets,
    selectedTarget,
    setSelectedTarget,
    supportsSections: platform === 'jira',
    isLoadingTargets,
    isExporting,
    loadTargets,
    checkConnection,
    doExport,
  };
}
