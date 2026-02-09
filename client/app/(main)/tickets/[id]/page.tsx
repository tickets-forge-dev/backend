'use client';

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Loader2, ArrowLeft, Trash2, AlertTriangle, CheckCircle, Save, FileText, Lightbulb, Bug, ClipboardList, Pencil, Eye, ExternalLink, Upload } from 'lucide-react';
import { MarkdownHooks as Markdown } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTicketsStore } from '@/stores/tickets.store';
import { useServices } from '@/services/index';
import { EditItemDialog, type EditState } from '@/src/tickets/components/EditItemDialog';
import { ApiScanDialog } from '@/src/tickets/components/ApiScanDialog';
import { StageIndicator } from '@/src/tickets/components/wizard/StageIndicator';
import { TicketDetailLayout } from '@/src/tickets/components/detail/TicketDetailLayout';
import { toast } from 'sonner';

interface TicketDetailPageProps {
  params: Promise<{ id: string }>;
}

function TicketDetailContent({ params }: TicketDetailPageProps) {
  const router = useRouter();
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [editContext, setEditContext] = useState<{ section: string; index: number } | null>(null);
  const [descriptionDraft, setDescriptionDraft] = useState<string>('');
  const [isDescriptionDirty, setIsDescriptionDirty] = useState(false);
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [descriptionMode, setDescriptionMode] = useState<'edit' | 'preview'>('edit');
  const [isScanningApis, setIsScanningApis] = useState(false);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [scannedApis, setScannedApis] = useState<import('@/types/question-refinement').ApiEndpointSpec[]>([]);
  const expandedDescriptionRef = useRef<HTMLTextAreaElement>(null);
  const { currentTicket, isLoading, fetchError, isUpdating, isDeleting, isUploadingAttachment, fetchTicket, updateTicket, deleteTicket, uploadAttachment, deleteAttachment, exportToLinear, exportToJira } = useTicketsStore();
  const { ticketService, linearService, jiraService } = useServices();
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportPlatform, setExportPlatform] = useState<'linear' | 'jira'>('linear');
  const [exportTeams, setExportTeams] = useState<Array<{ id: string; name: string; key: string }>>([]);
  const [exportProjects, setExportProjects] = useState<Array<{ id: string; key: string; name: string }>>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedProjectKey, setSelectedProjectKey] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingExportOptions, setIsLoadingExportOptions] = useState(false);
  const [linearConnected, setLinearConnected] = useState<boolean | null>(null);
  const [jiraConnected, setJiraConnected] = useState<boolean | null>(null);

  // Unwrap params (Next.js 15 async params)
  useEffect(() => {
    params.then(({ id }) => setTicketId(id));
  }, [params]);

  // Fetch ticket when ID is available
  useEffect(() => {
    if (ticketId) {
      fetchTicket(ticketId);
    }
  }, [ticketId, fetchTicket]);


  // Sync description draft when ticket loads
  useEffect(() => {
    if (currentTicket) {
      setDescriptionDraft(currentTicket.description || '');
      setIsDescriptionDirty(false);
    }
  }, [currentTicket?.id, currentTicket?.description]);

  const handleSaveDescription = async () => {
    if (!ticketId) return;
    setIsSavingDescription(true);
    await updateTicket(ticketId, { description: descriptionDraft });
    setIsDescriptionDirty(false);
    setIsSavingDescription(false);
  };

  const handleScanApis = useCallback(async () => {
    if (!ticketId) return;
    setScanDialogOpen(true);
    setScannedApis([]);
    setIsScanningApis(true);
    try {
      const result = await ticketService.detectApis(ticketId);
      const endpoints = result.apis.map((api) => ({
        method: api.method as any,
        route: api.path,
        description: api.description,
        authentication: 'none' as const,
        status: 'modified' as const,
        controller: api.sourceFile,
        dto: {
          request: api.request?.shape || undefined,
          response: api.response?.shape || undefined,
        },
      }));
      setScannedApis(endpoints);
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to scan APIs';
      toast.error(msg);
      setScanDialogOpen(false);
    } finally {
      setIsScanningApis(false);
    }
  }, [ticketId, ticketService]);

  const handleSaveScanSelection = useCallback(async (selected: import('@/types/question-refinement').ApiEndpointSpec[]) => {
    if (!ticketId) return;
    const existingEndpoints = currentTicket?.techSpec?.apiChanges?.endpoints || [];
    const existingRoutes = new Set(existingEndpoints.map((e: any) => `${e.method}:${e.route}`));
    const uniqueNew = selected.filter((e) => !existingRoutes.has(`${e.method}:${e.route}`));

    if (uniqueNew.length === 0) {
      toast.info('All selected APIs already present in spec');
      return;
    }

    const merged = [...existingEndpoints, ...uniqueNew];
    await saveTechSpecPatch({
      apiChanges: { ...currentTicket?.techSpec?.apiChanges, endpoints: merged },
    });
    await fetchTicket(ticketId);
    toast.success(`Added ${uniqueNew.length} API endpoint${uniqueNew.length !== 1 ? 's' : ''}`);
  }, [ticketId, currentTicket, fetchTicket]);

  // Loading state
  if (isLoading || !ticketId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <img
          src="/forge-icon.png"
          alt="Forge"
          className="h-12 w-12 animate-pulse"
        />
        <p className="text-sm text-[var(--text-tertiary)]">Loading...</p>
      </div>
    );
  }

  // Error state
  if (fetchError || !currentTicket) {
    return (
      <div className="rounded-lg bg-[var(--bg-subtle)] p-6">
        <div className="text-center">
          <p className="text-[var(--text-base)] text-[var(--red)]">
            {fetchError || 'Ticket not found'}
          </p>
          <Button onClick={() => router.push('/tickets')} variant="outline" className="mt-4">
            Back to Tickets
          </Button>
        </div>
      </div>
    );
  }

  // Derive wizard stage
  const deriveCurrentStage = (): 1 | 2 | 3 | 4 => {
    if (currentTicket.techSpec) return 4;
    if (currentTicket.maxRounds === 0) return 4;
    if ((currentTicket.currentRound ?? 0) > (currentTicket.maxRounds ?? 3)) return 4;
    return 3;
  };

  const currentStage = deriveCurrentStage();
  const techSpec = currentTicket.techSpec;

  // Quality score tooltip tips
  const qualityTips: string[] = [];
  if (techSpec?.qualityScore !== undefined) {
    const ps = techSpec.problemStatement;
    const sol = techSpec.solution;
    const ac = techSpec.acceptanceCriteria;
    if (!ps || typeof ps === 'string') qualityTips.push('Add a detailed problem statement');
    else {
      if (!ps.narrative || ps.narrative.length < 50) qualityTips.push('Expand the problem narrative');
      if (!ps.whyItMatters || ps.whyItMatters.length < 50) qualityTips.push('Explain why this matters');
      if (!ps.assumptions || ps.assumptions.length < 2) qualityTips.push('Add more assumptions');
    }
    const steps = sol?.steps || (Array.isArray(sol) ? sol : []);
    if (steps.length < 3) qualityTips.push('Add more solution steps');
    if (steps.length > 0 && !steps.some((s: any) => s.file || s.codeSnippet)) qualityTips.push('Add file paths to solution steps');
    if (!ac || ac.length < 3) qualityTips.push('Add more acceptance criteria');
    else if (!ac.some((c: any) => c.given && c.when && c.then)) qualityTips.push('Use BDD format (Given/When/Then)');
    if (!techSpec.fileChanges || techSpec.fileChanges.length === 0) qualityTips.push('Identify file changes');
    if (!techSpec.testPlan) qualityTips.push('Add a test plan');
    if (!techSpec.apiChanges?.endpoints?.length) qualityTips.push('Document API endpoints');
  }

  // Handler: inline editing
  const handleSaveAcceptanceCriteria = async (items: string[]) => {
    if (!ticketId) return;
    await updateTicket(ticketId, { acceptanceCriteria: items });
  };

  const handleSaveAssumptions = async (items: string[]) => {
    if (!ticketId) return;
    await updateTicket(ticketId, { assumptions: items });
  };

  const saveTechSpecPatch = async (patch: Record<string, any>) => {
    if (!ticketId) return false;
    return updateTicket(ticketId, { techSpec: patch });
  };

  const openEdit = (section: string, index: number) => {
    const ts = currentTicket?.techSpec;
    if (!ts) return;

    let state: EditState | null = null;

    if (section === 'assumptions') {
      const item = ts.problemStatement?.assumptions?.[index];
      if (item) state = { mode: 'string', value: item, label: 'Assumption' };
    } else if (section === 'constraints') {
      const item = ts.problemStatement?.constraints?.[index];
      if (item) state = { mode: 'string', value: item, label: 'Constraint' };
    } else if (section === 'steps') {
      const steps = ts.solution?.steps ?? (Array.isArray(ts.solution) ? ts.solution : null);
      const step = steps?.[index];
      if (step) {
        const desc = typeof step === 'string' ? step : step.description || JSON.stringify(step);
        state = { mode: 'string', value: desc, label: 'Step' };
      }
    } else if (section === 'acceptanceCriteria') {
      const ac = ts.acceptanceCriteria?.[index];
      if (ac) {
        if (typeof ac === 'string') {
          state = { mode: 'string', value: ac, label: 'Acceptance Criterion' };
        } else {
          state = {
            mode: 'bdd',
            given: ac.given || '',
            when: ac.when || '',
            then: ac.then || '',
            implementationNotes: ac.implementationNotes || '',
          };
        }
      }
    } else if (section === 'fileChanges') {
      const fc = ts.fileChanges?.[index];
      if (fc) state = { mode: 'fileChange', path: fc.path, action: fc.action || fc.type || 'modify' };
    } else if (section === 'apiEndpoints') {
      const endpoint = ts.apiChanges?.endpoints?.[index];
      if (endpoint) state = {
        mode: 'apiEndpoint',
        method: endpoint.method || 'GET',
        route: endpoint.route || '',
        description: endpoint.description || '',
        authentication: endpoint.authentication || 'none',
        status: endpoint.status || 'new',
        requestDto: endpoint.dto?.request || '',
        responseDto: endpoint.dto?.response || '',
        headers: endpoint.headers || '',
        requestBody: endpoint.requestBody || '',
      };
    } else if (section === 'testPlan') {
      const allTests = [
        ...(ts.testPlan?.unitTests || []),
        ...(ts.testPlan?.integrationTests || []),
        ...(ts.testPlan?.edgeCases || []),
      ];
      const test = allTests[index];
      if (test) state = {
        mode: 'testCase',
        description: test.description || '',
        type: test.type || 'unit',
        testFile: test.testFile || '',
        testName: test.testName || '',
        action: test.action || '',
        assertion: test.assertion || '',
      };
    } else if (section === 'layeredChanges') {
      const fc = ts.fileChanges?.[index];
      if (fc) state = { mode: 'fileChange', path: fc.path, action: fc.action || 'modify' };
    } else if (section === 'inScope') {
      const item = ts.inScope?.[index];
      if (item) state = { mode: 'string', value: item, label: 'In-Scope Item' };
    } else if (section === 'outOfScope') {
      const item = ts.outOfScope?.[index];
      if (item) state = { mode: 'string', value: item, label: 'Out-of-Scope Item' };
    }

    if (state) {
      setEditState(state);
      setEditContext({ section, index });
      setEditDialogOpen(true);
    }
  };

  const handleEditSave = async (updated: EditState) => {
    if (!editContext || !currentTicket?.techSpec) return;
    const { section, index } = editContext;
    const ts = currentTicket.techSpec;
    const patch: Record<string, any> = {};

    if (section === 'assumptions' && updated.mode === 'string') {
      const arr = [...(ts.problemStatement?.assumptions || [])];
      arr[index] = updated.value;
      patch.problemStatement = { ...ts.problemStatement, assumptions: arr };
    } else if (section === 'constraints' && updated.mode === 'string') {
      const arr = [...(ts.problemStatement?.constraints || [])];
      arr[index] = updated.value;
      patch.problemStatement = { ...ts.problemStatement, constraints: arr };
    } else if (section === 'steps' && updated.mode === 'string') {
      if (Array.isArray(ts.solution)) {
        const arr = [...ts.solution];
        arr[index] = updated.value;
        patch.solution = arr;
      } else if (ts.solution?.steps) {
        const arr = [...ts.solution.steps];
        arr[index] = typeof arr[index] === 'string' ? updated.value : { ...arr[index], description: updated.value };
        patch.solution = { ...ts.solution, steps: arr };
      }
    } else if (section === 'acceptanceCriteria') {
      const arr = [...(ts.acceptanceCriteria || [])];
      if (updated.mode === 'string') {
        arr[index] = updated.value;
      } else if (updated.mode === 'bdd') {
        arr[index] = {
          given: updated.given,
          when: updated.when,
          then: updated.then,
          implementationNotes: updated.implementationNotes || undefined,
        };
      }
      patch.acceptanceCriteria = arr;
    } else if (section === 'fileChanges' && updated.mode === 'fileChange') {
      const arr = [...(ts.fileChanges || [])];
      arr[index] = { ...arr[index], path: updated.path, action: updated.action };
      patch.fileChanges = arr;
    } else if (section === 'apiEndpoints' && updated.mode === 'apiEndpoint') {
      const endpoints = [...(ts.apiChanges?.endpoints || [])];
      const newEndpoint = {
        method: updated.method as any,
        route: updated.route,
        description: updated.description,
        authentication: updated.authentication as any,
        status: updated.status as any,
        dto: {
          request: updated.requestDto || undefined,
          response: updated.responseDto || undefined,
        },
        headers: updated.headers || undefined,
        requestBody: updated.requestBody || undefined,
      };
      if (index === -1) {
        endpoints.push(newEndpoint);
      } else {
        endpoints[index] = newEndpoint;
      }
      patch.apiChanges = { ...ts.apiChanges, endpoints };
    } else if (section === 'testPlan' && updated.mode === 'testCase') {
      const unitTests = [...(ts.testPlan?.unitTests || [])];
      const integrationTests = [...(ts.testPlan?.integrationTests || [])];
      const edgeCases = [...(ts.testPlan?.edgeCases || [])];
      const updatedTest = {
        type: updated.type as any,
        description: updated.description,
        testFile: updated.testFile,
        testName: updated.testName,
        action: updated.action,
        assertion: updated.assertion,
      };
      if (index < unitTests.length) {
        unitTests[index] = { ...unitTests[index], ...updatedTest };
      } else if (index < unitTests.length + integrationTests.length) {
        integrationTests[index - unitTests.length] = { ...integrationTests[index - unitTests.length], ...updatedTest };
      } else {
        edgeCases[index - unitTests.length - integrationTests.length] = { ...edgeCases[index - unitTests.length - integrationTests.length], ...updatedTest };
      }
      patch.testPlan = { ...ts.testPlan, unitTests, integrationTests, edgeCases };
    } else if (section === 'inScope' && updated.mode === 'string') {
      const arr = [...(ts.inScope || [])];
      arr[index] = updated.value;
      patch.inScope = arr;
    } else if (section === 'outOfScope' && updated.mode === 'string') {
      const arr = [...(ts.outOfScope || [])];
      arr[index] = updated.value;
      patch.outOfScope = arr;
    }

    if (Object.keys(patch).length > 0) {
      await saveTechSpecPatch(patch);
    }
    setEditDialogOpen(false);
    setEditState(null);
    setEditContext(null);
  };

  const deleteTechSpecItem = async (section: string, index: number) => {
    if (!currentTicket?.techSpec) return;
    const ts = currentTicket.techSpec;
    const deletePatch: Record<string, any> = {};
    const restorePatch: Record<string, any> = {};
    let itemLabel = '';

    if (section === 'assumptions') {
      const original = [...(ts.problemStatement?.assumptions || [])];
      itemLabel = original[index] || 'Assumption';
      const updated = original.filter((_: any, i: number) => i !== index);
      deletePatch.problemStatement = { ...ts.problemStatement, assumptions: updated };
      restorePatch.problemStatement = { ...ts.problemStatement, assumptions: original };
    } else if (section === 'constraints') {
      const original = [...(ts.problemStatement?.constraints || [])];
      itemLabel = original[index] || 'Constraint';
      const updated = original.filter((_: any, i: number) => i !== index);
      deletePatch.problemStatement = { ...ts.problemStatement, constraints: updated };
      restorePatch.problemStatement = { ...ts.problemStatement, constraints: original };
    } else if (section === 'steps') {
      if (Array.isArray(ts.solution)) {
        const original = [...ts.solution];
        const step = original[index];
        itemLabel = typeof step === 'string' ? step : step?.description || 'Step';
        const updated = original.filter((_: any, i: number) => i !== index);
        deletePatch.solution = updated;
        restorePatch.solution = original;
      } else if (ts.solution?.steps) {
        const original = [...ts.solution.steps];
        const step = original[index];
        itemLabel = typeof step === 'string' ? step : step?.description || 'Step';
        const updated = original.filter((_: any, i: number) => i !== index);
        deletePatch.solution = { ...ts.solution, steps: updated };
        restorePatch.solution = { ...ts.solution, steps: original };
      }
    } else if (section === 'acceptanceCriteria') {
      const original = [...(ts.acceptanceCriteria || [])];
      const ac = original[index];
      itemLabel = typeof ac === 'string' ? ac : ac?.then || 'Criterion';
      const updated = original.filter((_: any, i: number) => i !== index);
      deletePatch.acceptanceCriteria = updated;
      restorePatch.acceptanceCriteria = original;
    } else if (section === 'fileChanges') {
      const original = [...(ts.fileChanges || [])];
      itemLabel = original[index]?.path || 'File change';
      const updated = original.filter((_: any, i: number) => i !== index);
      deletePatch.fileChanges = updated;
      restorePatch.fileChanges = original;
    } else if (section === 'apiEndpoints') {
      const originalEndpoints = [...(ts.apiChanges?.endpoints || [])];
      const endpoint = originalEndpoints[index];
      itemLabel = endpoint ? `${endpoint.method} ${endpoint.route}` : 'API endpoint';
      const updatedEndpoints = originalEndpoints.filter((_: any, i: number) => i !== index);
      deletePatch.apiChanges = { ...ts.apiChanges, endpoints: updatedEndpoints };
      restorePatch.apiChanges = { ...ts.apiChanges, endpoints: originalEndpoints };
    } else if (section === 'testPlan') {
      const unitTests = [...(ts.testPlan?.unitTests || [])];
      const integrationTests = [...(ts.testPlan?.integrationTests || [])];
      const edgeCases = [...(ts.testPlan?.edgeCases || [])];
      const allTests = [...unitTests, ...integrationTests, ...edgeCases];
      itemLabel = allTests[index]?.description || 'Test case';

      if (index < unitTests.length) {
        const updated = unitTests.filter((_: any, i: number) => i !== index);
        deletePatch.testPlan = { ...ts.testPlan, unitTests: updated, integrationTests, edgeCases };
        restorePatch.testPlan = { ...ts.testPlan, unitTests, integrationTests, edgeCases };
      } else if (index < unitTests.length + integrationTests.length) {
        const localIdx = index - unitTests.length;
        const updated = integrationTests.filter((_: any, i: number) => i !== localIdx);
        deletePatch.testPlan = { ...ts.testPlan, unitTests, integrationTests: updated, edgeCases };
        restorePatch.testPlan = { ...ts.testPlan, unitTests, integrationTests, edgeCases };
      } else {
        const localIdx = index - unitTests.length - integrationTests.length;
        const updated = edgeCases.filter((_: any, i: number) => i !== localIdx);
        deletePatch.testPlan = { ...ts.testPlan, unitTests, integrationTests, edgeCases: updated };
        restorePatch.testPlan = { ...ts.testPlan, unitTests, integrationTests, edgeCases };
      }
    } else if (section === 'inScope') {
      const original = [...(ts.inScope || [])];
      itemLabel = original[index] || 'In-scope item';
      const updated = original.filter((_: any, i: number) => i !== index);
      deletePatch.inScope = updated;
      restorePatch.inScope = original;
    } else if (section === 'outOfScope') {
      const original = [...(ts.outOfScope || [])];
      itemLabel = original[index] || 'Out-of-scope item';
      const updated = original.filter((_: any, i: number) => i !== index);
      deletePatch.outOfScope = updated;
      restorePatch.outOfScope = original;
    }

    if (Object.keys(deletePatch).length > 0) {
      await saveTechSpecPatch(deletePatch);
      const truncated = itemLabel.length > 60 ? itemLabel.slice(0, 57) + '...' : itemLabel;
      toast('Item deleted', {
        description: truncated,
        action: { label: 'Undo', onClick: () => { saveTechSpecPatch(restorePatch); } },
        duration: 3000,
      });
    }
  };


  const handleToggleStatus = async () => {
    if (!ticketId) return;
    const newStatus = currentTicket.status === 'complete' ? 'draft' : 'complete';
    const success = await updateTicket(ticketId, { status: newStatus });
    if (success) {
      setShowStatusConfirm(false);
    }
  };

  const isComplete = currentTicket.status === 'complete';
  const canToggleStatus = currentTicket.status === 'draft' || currentTicket.status === 'complete';

  const handleOpenExport = async () => {
    setShowExportDialog(true);
    setSelectedTeamId('');
    setSelectedProjectKey('');
    setExportTeams([]);
    setExportProjects([]);

    // Check which integrations are connected
    try {
      const [linearStatus, jiraStatus] = await Promise.allSettled([
        linearService.getConnectionStatus(),
        jiraService.getConnectionStatus(),
      ]);
      const isLinearConnected = linearStatus.status === 'fulfilled' && linearStatus.value.connected;
      const isJiraConnected = jiraStatus.status === 'fulfilled' && jiraStatus.value.connected;
      setLinearConnected(isLinearConnected);
      setJiraConnected(isJiraConnected);

      // Auto-select the first connected platform
      if (isLinearConnected) {
        setExportPlatform('linear');
        loadLinearTeams();
      } else if (isJiraConnected) {
        setExportPlatform('jira');
        loadJiraProjects();
      }
    } catch {
      setLinearConnected(false);
      setJiraConnected(false);
    }
  };

  const loadLinearTeams = async () => {
    setIsLoadingExportOptions(true);
    try {
      const teams = await linearService.getTeams();
      setExportTeams(teams);
      if (teams.length === 1) setSelectedTeamId(teams[0].id);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to load Linear teams');
    } finally {
      setIsLoadingExportOptions(false);
    }
  };

  const loadJiraProjects = async () => {
    setIsLoadingExportOptions(true);
    try {
      const projects = await jiraService.getProjects();
      setExportProjects(projects);
      if (projects.length === 1) setSelectedProjectKey(projects[0].key);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to load Jira projects');
    } finally {
      setIsLoadingExportOptions(false);
    }
  };

  const handlePlatformChange = (platform: 'linear' | 'jira') => {
    setExportPlatform(platform);
    setSelectedTeamId('');
    setSelectedProjectKey('');
    if (platform === 'linear') loadLinearTeams();
    else loadJiraProjects();
  };

  const handleExport = async () => {
    if (!ticketId) return;
    setIsExporting(true);
    try {
      if (exportPlatform === 'linear') {
        if (!selectedTeamId) return;
        const result = await exportToLinear(ticketId, selectedTeamId);
        if (result) {
          toast.success(
            <span>
              Exported as <a href={result.issueUrl} target="_blank" rel="noopener noreferrer" className="underline font-medium">{result.identifier}</a>
            </span>,
          );
          setShowExportDialog(false);
        } else {
          toast.error('Export failed');
        }
      } else {
        if (!selectedProjectKey) return;
        const result = await exportToJira(ticketId, selectedProjectKey);
        if (result) {
          toast.success(
            <span>
              Exported as <a href={result.issueUrl} target="_blank" rel="noopener noreferrer" className="underline font-medium">{result.issueKey}</a>
            </span>,
          );
          setShowExportDialog(false);
        } else {
          toast.error('Export failed');
        }
      }
    } catch (err: any) {
      toast.error(err?.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!ticketId) return;
    const success = await deleteTicket(ticketId);
    if (success) {
      router.push('/tickets');
    }
  };

  const handleAddApiEndpoint = () => {
    setEditContext({ section: 'apiEndpoints', index: -1 });
    setEditState({
      mode: 'apiEndpoint',
      method: 'GET',
      route: '/api/',
      description: '',
      authentication: 'none',
      status: 'new',
      requestDto: '',
      responseDto: '',
      headers: '',
      requestBody: '',
    });
    setEditDialogOpen(true);
  };

  const handleSaveApiEndpoints = async (acceptedEndpoints: import('@/types/question-refinement').ApiEndpointSpec[]) => {
    await saveTechSpecPatch({
      apiChanges: { ...currentTicket?.techSpec?.apiChanges, endpoints: acceptedEndpoints },
    });
    if (ticketId) await fetchTicket(ticketId);
    toast.success(`Saved ${acceptedEndpoints.length} API endpoint${acceptedEndpoints.length !== 1 ? 's' : ''}`);
  };

  return (
    <div className="space-y-8">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push('/tickets')} className="-ml-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tickets
        </Button>
      </div>

      {/* Progress Stepper */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 -mx-4 sm:-mx-6 px-4 sm:px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <StageIndicator currentStage={currentStage} />
        </div>
      </div>

      {/* Hero Header — Title + Quality Badge */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-semibold text-[var(--text)] leading-tight">
            {currentTicket.title}
          </h1>
          {techSpec?.qualityScore !== undefined && (
            <div className="relative group flex-shrink-0">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white cursor-default ${
                techSpec.qualityScore >= 75
                  ? 'bg-green-500'
                  : techSpec.qualityScore >= 50
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}>
                {techSpec.qualityScore}/100
              </span>
              {qualityTips.length > 0 && (
                <div className="absolute right-0 top-full mt-2 w-64 p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <p className="text-[11px] font-medium text-[var(--text)] mb-2">
                    To improve your score:
                  </p>
                  <ul className="space-y-1">
                    {qualityTips.slice(0, 5).map((tip, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[11px] text-[var(--text-secondary)]">
                        <span className="text-amber-500 mt-px">*</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Type, Priority & Status row */}
        <div className="flex items-center gap-2">
          {currentTicket.type && (
            <Badge variant="outline" className="capitalize gap-1.5">
              {currentTicket.type === 'bug' ? <Bug className="h-3 w-3 text-red-500" />
                : currentTicket.type === 'task' ? <ClipboardList className="h-3 w-3 text-blue-500" />
                : <Lightbulb className="h-3 w-3 text-amber-500" />}
              {currentTicket.type}
            </Badge>
          )}
          {currentTicket.priority && (
            <Badge variant="outline" className="capitalize gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${
                currentTicket.priority === 'urgent' ? 'bg-red-500'
                  : currentTicket.priority === 'high' ? 'bg-orange-500'
                  : currentTicket.priority === 'medium' ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`} />
              {currentTicket.priority}
            </Badge>
          )}
          <div className="flex-1" />
          {canToggleStatus && (
            <button
              onClick={() => setShowStatusConfirm(true)}
              className={`
                inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border
                ${isComplete
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-green-500/20 hover:border-green-500/30'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--bg-hover)] hover:border-[var(--text-tertiary)]'
                }
              `}
            >
              {isComplete ? (
                <>
                  <CheckCircle className="h-3.5 w-3.5" />
                  <div className="text-left">
                    <span className="block leading-tight">Complete</span>
                    <span className="block text-[10px] font-normal opacity-60">Click to revert</span>
                  </div>
                </>
              ) : (
                <div className="text-left">
                  <span className="block leading-tight">Draft</span>
                  <span className="block text-[10px] font-normal opacity-60">Click to complete</span>
                </div>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Content — TicketDetailLayout handles tabs vs pre-spec */}
      <TicketDetailLayout
        ticket={currentTicket}
        ticketId={ticketId}
        descriptionDraft={descriptionDraft}
        onDescriptionChange={(value) => {
          setDescriptionDraft(value);
          setIsDescriptionDirty(value !== (currentTicket?.description || ''));
        }}
        onDescriptionSave={handleSaveDescription}
        isSavingDescription={isSavingDescription}
        isDescriptionDirty={isDescriptionDirty}
        onDescriptionExpand={() => { setDescriptionExpanded(true); setDescriptionMode('edit'); }}
        onEditItem={openEdit}
        onDeleteItem={deleteTechSpecItem}
        onSaveAcceptanceCriteria={handleSaveAcceptanceCriteria}
        onSaveAssumptions={handleSaveAssumptions}
        onAddApiEndpoint={handleAddApiEndpoint}
        onSaveApiEndpoints={handleSaveApiEndpoints}
        onScanApis={handleScanApis}
        isScanningApis={isScanningApis}
        onUploadAttachment={async (file, onProgress) => uploadAttachment(ticketId!, file, onProgress)}
        onDeleteAttachment={async (attachmentId) => deleteAttachment(ticketId!, attachmentId)}
        isUploadingAttachment={isUploadingAttachment}
        saveTechSpecPatch={saveTechSpecPatch}
        fetchTicket={fetchTicket}
      />

      {/* Footer with actions */}
      <div className="flex items-center justify-between pt-6 border-t border-[var(--border)]">
        <Button
          variant="ghost"
          onClick={() => setShowDeleteConfirm(true)}
          className="text-[var(--red)] hover:text-[var(--red)] hover:bg-[var(--red)]/10"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Ticket
        </Button>

        {techSpec && (
          <div className="flex items-center gap-2">
            {currentTicket.externalIssue ? (
              <a
                href={currentTicket.externalIssue.issueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View in {currentTicket.externalIssue.platform === 'linear' ? 'Linear' : 'Jira'}
              </a>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenExport}
            >
              <Upload className="h-3.5 w-3.5 mr-2" />
              Export
            </Button>
          </div>
        )}
      </div>

      {/* Status Toggle Confirmation Dialog */}
      <Dialog open={showStatusConfirm} onOpenChange={setShowStatusConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isComplete ? 'Revert to Draft?' : 'Mark as Complete?'}
            </DialogTitle>
            <DialogDescription className="text-[var(--text-base)]">
              {isComplete
                ? 'This will move the ticket back to draft status for further editing.'
                : 'This will mark the ticket as complete. You can revert it to draft later if needed.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
              <strong className="text-[var(--text)]">Ticket:</strong> {currentTicket.title}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusConfirm(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button onClick={handleToggleStatus} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : isComplete ? (
                'Revert to Draft'
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Complete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <EditItemDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        editState={editState}
        onSave={handleEditSave}
        isSaving={isUpdating}
      />

      {/* API Scan Dialog */}
      <ApiScanDialog
        open={scanDialogOpen}
        onOpenChange={setScanDialogOpen}
        endpoints={scannedApis}
        isLoading={isScanningApis}
        onSave={handleSaveScanSelection}
      />

      {/* Expanded Description Dialog */}
      <Dialog open={descriptionExpanded} onOpenChange={setDescriptionExpanded}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col gap-0 p-0">
          <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-[var(--border)]">
            <div className="flex items-center justify-between pr-8">
              <DialogTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-[var(--text-tertiary)]" />
                Notes
              </DialogTitle>
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-md border border-[var(--border)]/50 p-0.5">
                  <button
                    onClick={() => setDescriptionMode('edit')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      descriptionMode === 'edit'
                        ? 'bg-[var(--bg-hover)] text-[var(--text)]'
                        : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => setDescriptionMode('preview')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      descriptionMode === 'preview'
                        ? 'bg-[var(--bg-hover)] text-[var(--text)]'
                        : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    <Eye className="h-3 w-3" />
                    Preview
                  </button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!isDescriptionDirty || isSavingDescription}
                  onClick={handleSaveDescription}
                  className={`h-7 px-2.5 text-xs ${isDescriptionDirty ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)]'}`}
                >
                  {isSavingDescription ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Save className="h-3 w-3 mr-1" />
                  )}
                  Save
                </Button>
              </div>
            </div>
            <DialogDescription className="sr-only">Edit or preview ticket notes</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto px-6 py-4">
            {descriptionMode === 'edit' ? (
              <textarea
                ref={expandedDescriptionRef}
                value={descriptionDraft}
                onChange={(e) => {
                  setDescriptionDraft(e.target.value);
                  setIsDescriptionDirty(e.target.value !== (currentTicket?.description || ''));
                }}
                onKeyDown={(e) => {
                  if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    if (isDescriptionDirty) handleSaveDescription();
                  }
                }}
                placeholder="Add notes... (supports Markdown)"
                className="w-full h-full bg-transparent text-[var(--text-sm)] text-[var(--text-secondary)] leading-relaxed font-mono resize-none rounded-md border border-[var(--border)]/30 px-4 py-3 placeholder:text-[var(--text-tertiary)]/50 focus:outline-none focus:border-[var(--primary)]/50 focus:ring-1 focus:ring-[var(--primary)]/20 transition-colors"
              />
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-[var(--text)] prose-p:text-[var(--text-secondary)] prose-strong:text-[var(--text)] prose-code:text-[var(--primary)] prose-code:bg-[var(--bg-hover)] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-[var(--bg-hover)] prose-pre:border prose-pre:border-[var(--border)]/30 prose-a:text-[var(--primary)] prose-blockquote:border-[var(--border)] prose-blockquote:text-[var(--text-secondary)] prose-table:w-full prose-th:bg-[var(--bg-hover)] prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:text-[var(--text)] prose-th:font-medium prose-td:px-3 prose-td:py-2 prose-td:text-[var(--text-secondary)] prose-tr:border-b prose-tr:border-[var(--border)]/40">
                {descriptionDraft ? (
                  <Markdown remarkPlugins={[remarkGfm]}>{descriptionDraft}</Markdown>
                ) : (
                  <p className="text-[var(--text-tertiary)] italic">No notes yet. Switch to Edit mode to add some.</p>
                )}
              </div>
            )}
          </div>

          {isDescriptionDirty && (
            <div className="flex-shrink-0 px-6 py-3 border-t border-[var(--border)]">
              <p className="text-[10px] text-[var(--text-tertiary)]">
                Unsaved changes. Press <kbd className="px-1 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-tertiary)] font-mono text-[9px]">Cmd+S</kbd> or click Save.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Ticket</DialogTitle>
            <DialogDescription>
              Export this ticket to an external project management tool.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Platform selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text)]">Platform</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => linearConnected && handlePlatformChange('linear')}
                  disabled={!linearConnected}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    exportPlatform === 'linear'
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                      : linearConnected
                      ? 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]'
                      : 'border-[var(--border)] text-[var(--text-tertiary)] opacity-50 cursor-not-allowed'
                  }`}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.633 11.2a9.553 9.553 0 0 1 .776-2.297l4.324 4.324a3.04 3.04 0 0 0 3.34 3.34l4.324 4.324A9.6 9.6 0 0 1 2.633 11.2z" />
                    <path d="M5.265 6.265l12.47 12.47A9.6 9.6 0 0 0 5.265 6.265z" />
                  </svg>
                  Linear
                  {!linearConnected && <span className="text-[10px] ml-auto">(not connected)</span>}
                </button>
                <button
                  onClick={() => jiraConnected && handlePlatformChange('jira')}
                  disabled={!jiraConnected}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    exportPlatform === 'jira'
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                      : jiraConnected
                      ? 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]'
                      : 'border-[var(--border)] text-[var(--text-tertiary)] opacity-50 cursor-not-allowed'
                  }`}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.593 24V12.518a1.005 1.005 0 0 0-1.022-1.005z" />
                    <path d="M17.373 0h-5.748a5.218 5.218 0 0 0 5.232 5.215h2.129v2.057A5.215 5.215 0 0 0 24.218 12.487V1.005A1.005 1.005 0 0 0 23.196 0h-5.823z" opacity=".5" />
                  </svg>
                  Jira
                  {!jiraConnected && <span className="text-[10px] ml-auto">(not connected)</span>}
                </button>
              </div>
              {!linearConnected && !jiraConnected && (
                <p className="text-xs text-[var(--text-tertiary)]">
                  Connect Linear or Jira in Settings to export tickets.
                </p>
              )}
            </div>

            {/* Platform-specific options */}
            {isLoadingExportOptions ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-[var(--text-tertiary)]" />
                <span className="ml-2 text-sm text-[var(--text-secondary)]">Loading...</span>
              </div>
            ) : exportPlatform === 'linear' && linearConnected ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text)]">Team</label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                >
                  <option value="">Select a team...</option>
                  {exportTeams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name} ({team.key})
                    </option>
                  ))}
                </select>
              </div>
            ) : exportPlatform === 'jira' && jiraConnected ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text)]">Project</label>
                <select
                  value={selectedProjectKey}
                  onChange={(e) => setSelectedProjectKey(e.target.value)}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                >
                  <option value="">Select a project...</option>
                  {exportProjects.map((project) => (
                    <option key={project.id} value={project.key}>
                      {project.name} ({project.key})
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)} disabled={isExporting}>
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={
                isExporting ||
                (exportPlatform === 'linear' && !selectedTeamId) ||
                (exportPlatform === 'jira' && !selectedProjectKey) ||
                (!linearConnected && !jiraConnected)
              }
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Export to {exportPlatform === 'linear' ? 'Linear' : 'Jira'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[var(--red)]" />
              Delete Ticket
            </DialogTitle>
            <DialogDescription className="text-[var(--text-base)]">
              Are you sure you want to delete this ticket? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
              <strong className="text-[var(--text)]">Ticket:</strong> {currentTicket.title}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Ticket
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TicketDetailPage(props: TicketDetailPageProps) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--text-tertiary)]" />
      </div>
    }>
      <TicketDetailContent {...props} />
    </Suspense>
  );
}
