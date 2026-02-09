'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
import { Loader2, ArrowLeft, Trash2, AlertTriangle, CheckCircle, FileCode, FilePlus, FileX, Upload, Save, FileText, Lightbulb, Bug, ClipboardList, Expand, Eye, Pencil, ChevronDown } from 'lucide-react';
import { MarkdownHooks as Markdown } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTicketsStore } from '@/stores/tickets.store';
import { useServices } from '@/services/index';
import { InlineEditableList } from '@/src/tickets/components/InlineEditableList';
import { ValidationResults } from '@/src/tickets/components/ValidationResults';
import { QuestionRoundsSection } from '@/src/tickets/components/QuestionRoundsSection';
import { CollapsibleSection } from '@/src/tickets/components/CollapsibleSection';
import { StageIndicator } from '@/src/tickets/components/wizard/StageIndicator';
import { EditableItem } from '@/src/tickets/components/EditableItem';
import { EditItemDialog, type EditState } from '@/src/tickets/components/EditItemDialog';
import { ApiEndpointsList } from '@/src/tickets/components/ApiEndpointsList';
import { ApiReviewSection } from '@/src/tickets/components/ApiReviewSection';
import { ApiScanDialog } from '@/src/tickets/components/ApiScanDialog';
import { BackendClientChanges } from '@/src/tickets/components/BackendClientChanges';
import { TestPlanSection } from '@/src/tickets/components/TestPlanSection';
import { VisualExpectationsSection } from '@/src/tickets/components/VisualExpectationsSection';
import { toast } from 'sonner';
import type { RoundAnswers } from '@/types/question-refinement';
import { normalizeProblemStatement } from '@/tickets/utils/normalize-problem-statement';
import { AssetsSection } from '@/src/tickets/components/AssetsSection';
import { ImageAttachmentsGrid } from '@/src/tickets/components/ImageAttachmentsGrid';

interface TicketDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function TicketDetailPage({ params }: TicketDetailPageProps) {
  const router = useRouter();
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [isSubmittingAnswers, setIsSubmittingAnswers] = useState(false);
  const [answerSubmitError, setAnswerSubmitError] = useState<string | null>(null);
  const [isStartingRound, setIsStartingRound] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [editContext, setEditContext] = useState<{ section: string; index: number } | null>(null);
  const [descriptionDraft, setDescriptionDraft] = useState<string>('');
  const [isDescriptionDirty, setIsDescriptionDirty] = useState(false);
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [descriptionMode, setDescriptionMode] = useState<'edit' | 'preview'>('edit');
  const [questionsExpanded, setQuestionsExpanded] = useState(false);
  const [isScanningApis, setIsScanningApis] = useState(false);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [scannedApis, setScannedApis] = useState<import('@/types/question-refinement').ApiEndpointSpec[]>([]);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const expandedDescriptionRef = useRef<HTMLTextAreaElement>(null);
  const { currentTicket, isLoading, fetchError, isUpdating, isDeleting, isUploadingAttachment, fetchTicket, updateTicket, deleteTicket, uploadAttachment, deleteAttachment } = useTicketsStore();
  const { questionRoundService, ticketService } = useServices();

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

  const startQuestionRound1 = useCallback(async () => {
    if (!ticketId || !currentTicket) return;

    // Guard: Don't start if maxRounds is 0
    if (currentTicket.maxRounds === 0) {
      console.log('⏭️  Skipping questions (maxRounds=0, auto-finalized)');
      return;
    }

    // Guard: Already started
    if ((currentTicket.currentRound ?? 0) > 0) return;

    setIsStartingRound(true);
    setAnswerSubmitError(null);
    try {
      console.log('🎯 Auto-starting Round 1');
      await questionRoundService.startRound(ticketId, 1);
      await fetchTicket(ticketId);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message
        || error?.message
        || 'Failed to start question round';
      console.error('❌ Failed to start Round 1:', errorMessage);
      setAnswerSubmitError(errorMessage);
    } finally {
      setIsStartingRound(false);
    }
  }, [ticketId, currentTicket, questionRoundService, fetchTicket]);

  // Auto-start round 1 when ticket loads (if not started and maxRounds > 0)
  useEffect(() => {
    if (currentTicket && (currentTicket.currentRound ?? 0) === 0 && (currentTicket.maxRounds ?? 0) > 0) {
      startQuestionRound1();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTicket?.id]);

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
      // Convert to ApiEndpointSpec format
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

  // Track active section for left nav scroll spy
  useEffect(() => {
    const handleScroll = () => {
      const sectionEls = document.querySelectorAll('[data-nav-section]');
      let current = '';
      sectionEls.forEach(el => {
        if (el.getBoundingClientRect().top <= 120) {
          current = el.id;
        }
      });
      if (current) setActiveSection(current);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isLoading || !ticketId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  if (fetchError || !currentTicket) {
    return (
      <div className="rounded-lg bg-[var(--bg-subtle)] p-6">
        <div className="text-center">
          <p className="text-[var(--text-base)] text-[var(--red)]">
            {fetchError || 'Ticket not found'}
          </p>
          <Button
            onClick={() => router.push('/tickets')}
            variant="outline"
            className="mt-4"
          >
            Back to Tickets
          </Button>
        </div>
      </div>
    );
  }

  // Compute readiness badge color
  const readinessScore = currentTicket.readinessScore || 0;
  const readinessBadgeClass =
    readinessScore >= 75
      ? 'bg-[var(--green)]'
      : readinessScore >= 50
      ? 'bg-[var(--amber)]'
      : 'bg-[var(--red)]';

  // Derive wizard stage from ticket state
  const deriveCurrentStage = (): 1 | 2 | 3 | 4 => {
    // Stage 1-2 completed (ticket exists)
    // Stage 4: Finalized (has tech spec or rounds completed)
    if (currentTicket.techSpec) return 4;
    if (currentTicket.maxRounds === 0) return 4;
    if ((currentTicket.currentRound ?? 0) > (currentTicket.maxRounds ?? 3)) return 4;

    // Stage 3: Questions/draft phase
    return 3;
  };

  const currentStage = deriveCurrentStage();

  // Build section nav items based on what's actually rendered
  const techSpec = currentTicket.techSpec;
  const navSections = [
    { id: 'notes', label: 'Notes' },
    techSpec?.problemStatement && { id: 'problem-statement', label: 'Problem' },
    techSpec?.solution && { id: 'solution', label: 'Solution' },
    techSpec?.acceptanceCriteria?.length > 0 && { id: 'spec-acceptance', label: 'Acceptance Criteria' },
    techSpec && { id: 'api-endpoints', label: 'API Endpoints' },
    techSpec?.fileChanges?.length > 0 && { id: 'file-changes', label: 'File Changes' },
    techSpec?.layeredFileChanges && { id: 'layered-changes', label: 'BE/FE Changes' },
    techSpec?.testPlan && { id: 'test-plan', label: 'Test Plan' },
    techSpec?.visualExpectations && { id: 'visual-qa', label: 'Visual QA' },
    (techSpec || (currentTicket.attachments && currentTicket.attachments.length > 0)) && { id: 'assets', label: 'Assets' },
    (techSpec?.inScope?.length > 0 || techSpec?.outOfScope?.length > 0) && { id: 'scope', label: 'Scope' },
    currentTicket.acceptanceCriteria?.length > 0 && { id: 'ticket-acceptance', label: 'Criteria' },
    currentTicket.assumptions?.length > 0 && { id: 'assumptions', label: 'Assumptions' },
    currentTicket.repoPaths?.length > 0 && { id: 'affected-code', label: 'Affected Code' },
    currentTicket.estimate && { id: 'estimate', label: 'Estimate' },
    (currentTicket.currentRound ?? 0) > 0 && (currentTicket.questionRounds?.length ?? 0) > 0 && { id: 'question-refinement', label: 'Questions' },
  ].filter(Boolean) as { id: string; label: string }[];

  // Handle inline editing save
  const handleSaveAcceptanceCriteria = async (items: string[]) => {
    if (!ticketId) return;
    await updateTicket(ticketId, { acceptanceCriteria: items });
  };

  const handleSaveAssumptions = async (items: string[]) => {
    if (!ticketId) return;
    await updateTicket(ticketId, { assumptions: items });
  };

  // Build a techSpec patch and send to backend
  const saveTechSpecPatch = async (patch: Record<string, any>) => {
    if (!ticketId) return false;
    return updateTicket(ticketId, { techSpec: patch });
  };

  // Open edit dialog for a specific item
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
      // Flatten all test arrays and find by global index
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
      // Layered changes use file change edit mode
      // Decode: layer is stored in editContext as section 'layeredChanges:backend', etc.
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

  // Save edited item back to techSpec
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
      // Reconstruct the test plan arrays from global index
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

  // Delete an item from a techSpec array (with undo toast)
  const deleteTechSpecItem = async (section: string, index: number) => {
    if (!currentTicket?.techSpec) return;
    const ts = currentTicket.techSpec;
    const deletePatch: Record<string, any> = {};
    const restorePatch: Record<string, any> = {};
    let itemLabel = '';

    if (section === 'assumptions') {
      const original = [...(ts.problemStatement?.assumptions || [])];
      itemLabel = original[index] || 'Assumption';
      const updated = original.filter((_, i) => i !== index);
      deletePatch.problemStatement = { ...ts.problemStatement, assumptions: updated };
      restorePatch.problemStatement = { ...ts.problemStatement, assumptions: original };
    } else if (section === 'constraints') {
      const original = [...(ts.problemStatement?.constraints || [])];
      itemLabel = original[index] || 'Constraint';
      const updated = original.filter((_, i) => i !== index);
      deletePatch.problemStatement = { ...ts.problemStatement, constraints: updated };
      restorePatch.problemStatement = { ...ts.problemStatement, constraints: original };
    } else if (section === 'steps') {
      if (Array.isArray(ts.solution)) {
        const original = [...ts.solution];
        const step = original[index];
        itemLabel = typeof step === 'string' ? step : step?.description || 'Step';
        const updated = original.filter((_, i) => i !== index);
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
      const updated = original.filter((_, i) => i !== index);
      deletePatch.acceptanceCriteria = updated;
      restorePatch.acceptanceCriteria = original;
    } else if (section === 'fileChanges') {
      const original = [...(ts.fileChanges || [])];
      itemLabel = original[index]?.path || 'File change';
      const updated = original.filter((_, i) => i !== index);
      deletePatch.fileChanges = updated;
      restorePatch.fileChanges = original;
    } else if (section === 'apiEndpoints') {
      const originalEndpoints = [...(ts.apiChanges?.endpoints || [])];
      const endpoint = originalEndpoints[index];
      itemLabel = endpoint ? `${endpoint.method} ${endpoint.route}` : 'API endpoint';
      const updatedEndpoints = originalEndpoints.filter((_, i) => i !== index);
      deletePatch.apiChanges = { ...ts.apiChanges, endpoints: updatedEndpoints };
      restorePatch.apiChanges = { ...ts.apiChanges, endpoints: originalEndpoints };
    } else if (section === 'testPlan') {
      // Flatten, delete from global index, rebuild
      const unitTests = [...(ts.testPlan?.unitTests || [])];
      const integrationTests = [...(ts.testPlan?.integrationTests || [])];
      const edgeCases = [...(ts.testPlan?.edgeCases || [])];
      const allTests = [...unitTests, ...integrationTests, ...edgeCases];
      itemLabel = allTests[index]?.description || 'Test case';

      if (index < unitTests.length) {
        const updated = unitTests.filter((_, i) => i !== index);
        deletePatch.testPlan = { ...ts.testPlan, unitTests: updated, integrationTests, edgeCases };
        restorePatch.testPlan = { ...ts.testPlan, unitTests, integrationTests, edgeCases };
      } else if (index < unitTests.length + integrationTests.length) {
        const localIdx = index - unitTests.length;
        const updated = integrationTests.filter((_, i) => i !== localIdx);
        deletePatch.testPlan = { ...ts.testPlan, unitTests, integrationTests: updated, edgeCases };
        restorePatch.testPlan = { ...ts.testPlan, unitTests, integrationTests, edgeCases };
      } else {
        const localIdx = index - unitTests.length - integrationTests.length;
        const updated = edgeCases.filter((_, i) => i !== localIdx);
        deletePatch.testPlan = { ...ts.testPlan, unitTests, integrationTests, edgeCases: updated };
        restorePatch.testPlan = { ...ts.testPlan, unitTests, integrationTests, edgeCases };
      }
    } else if (section === 'inScope') {
      const original = [...(ts.inScope || [])];
      itemLabel = original[index] || 'In-scope item';
      const updated = original.filter((_, i) => i !== index);
      deletePatch.inScope = updated;
      restorePatch.inScope = original;
    } else if (section === 'outOfScope') {
      const original = [...(ts.outOfScope || [])];
      itemLabel = original[index] || 'Out-of-scope item';
      const updated = original.filter((_, i) => i !== index);
      deletePatch.outOfScope = updated;
      restorePatch.outOfScope = original;
    }

    if (Object.keys(deletePatch).length > 0) {
      await saveTechSpecPatch(deletePatch);

      const truncated = itemLabel.length > 60 ? itemLabel.slice(0, 57) + '...' : itemLabel;
      toast('Item deleted', {
        description: truncated,
        action: {
          label: 'Undo',
          onClick: () => { saveTechSpecPatch(restorePatch); },
        },
        duration: 3000,
      });
    }
  };

  // Handle submitting answers for a question round
  const handleSubmitRoundAnswers = async (roundNumber: number, answers: RoundAnswers) => {
    if (!ticketId) return;
    setIsSubmittingAnswers(true);
    setAnswerSubmitError(null);

    try {
      const result = await questionRoundService.submitAnswers(ticketId, roundNumber as 1 | 2 | 3, answers);

      // Refresh ticket to see updated state (next round or finalize button)
      await fetchTicket(ticketId);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message
        || error?.message
        || 'Failed to submit answers';
      setAnswerSubmitError(errorMessage);
    } finally {
      setIsSubmittingAnswers(false);
    }
  };

  // Handle skipping to finalize
  const handleSkipToFinalize = async () => {
    if (!ticketId) return;
    setIsSubmittingAnswers(true);
    setAnswerSubmitError(null);

    try {
      await questionRoundService.skipToFinalize(ticketId);
      // Refresh to show finalize button or final spec
      await fetchTicket(ticketId);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message
        || error?.message
        || 'Failed to skip to finalize';
      setAnswerSubmitError(errorMessage);
    } finally {
      setIsSubmittingAnswers(false);
    }
  };

  // Handle finalizing the spec
  const handleFinalizeSpec = async () => {
    if (!ticketId || !currentTicket?.questionRounds) return;
    setIsSubmittingAnswers(true);
    setAnswerSubmitError(null);

    try {
      // Collect all answers from all rounds
      const allAnswers = currentTicket.questionRounds.map(round => round.answers || {});

      await questionRoundService.finalizeSpec(ticketId, allAnswers);
      // Refresh to show final spec with quality score
      await fetchTicket(ticketId);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message
        || error?.message
        || 'Failed to finalize spec';
      setAnswerSubmitError(errorMessage);
    } finally {
      setIsSubmittingAnswers(false);
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

  const handleDelete = async () => {
    if (!ticketId) return;
    const success = await deleteTicket(ticketId);
    if (success) {
      router.push('/tickets');
    }
  };

  return (
    <div className="space-y-8">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/tickets')}
          className="-ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tickets
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!techSpec}
          title={techSpec ? 'Scroll to Assets section' : 'Generate a spec first'}
          onClick={() => {
            const el = document.getElementById('assets');
            if (el) {
              const y = el.getBoundingClientRect().top + window.scrollY - 100;
              window.scrollTo({ top: y, behavior: 'smooth' });
            }
          }}
        >
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          Export
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
          {techSpec?.qualityScore !== undefined && (() => {
            const tips: string[] = [];
            const ps = techSpec.problemStatement;
            const sol = techSpec.solution;
            const ac = techSpec.acceptanceCriteria;
            // Problem statement checks
            if (!ps || typeof ps === 'string') tips.push('Add a detailed problem statement');
            else {
              if (!ps.narrative || ps.narrative.length < 50) tips.push('Expand the problem narrative');
              if (!ps.whyItMatters || ps.whyItMatters.length < 50) tips.push('Explain why this matters');
              if (!ps.assumptions || ps.assumptions.length < 2) tips.push('Add more assumptions');
            }
            // Solution checks
            const steps = sol?.steps || (Array.isArray(sol) ? sol : []);
            if (steps.length < 3) tips.push('Add more solution steps');
            if (steps.length > 0 && !steps.some((s: any) => s.file || s.codeSnippet)) tips.push('Add file paths to solution steps');
            // Acceptance criteria
            if (!ac || ac.length < 3) tips.push('Add more acceptance criteria');
            else if (!ac.some((c: any) => c.given && c.when && c.then)) tips.push('Use BDD format (Given/When/Then)');
            // File changes
            if (!techSpec.fileChanges || techSpec.fileChanges.length === 0) tips.push('Identify file changes');
            // Test plan
            if (!techSpec.testPlan) tips.push('Add a test plan');
            // API
            if (!techSpec.apiChanges?.endpoints?.length) tips.push('Document API endpoints');

            return (
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
                {tips.length > 0 && (
                  <div className="absolute right-0 top-full mt-2 w-64 p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <p className="text-[11px] font-medium text-[var(--text)] mb-2">
                      To improve your score:
                    </p>
                    <ul className="space-y-1">
                      {tips.slice(0, 5).map((tip, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[11px] text-[var(--text-secondary)]">
                          <span className="text-amber-500 mt-px">*</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })()}
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

      {/* Content with section nav */}
      <div className="relative space-y-8">
        {/* Section Navigator — sticky left sidebar on wide screens */}
        {navSections.length > 0 && (
          <nav className="hidden xl:block absolute right-full mr-6 top-0 bottom-0 w-40">
            <div className="sticky top-24 space-y-0.5">
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[3px] top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-800" />
                <div className="space-y-0.5">
                  {navSections.map(section => {
                    const isActive = activeSection === section.id;
                    return (
                      <button
                        key={section.id}
                        onClick={() => {
                          const el = document.getElementById(section.id);
                          if (el) {
                            const y = el.getBoundingClientRect().top + window.scrollY - 100;
                            window.scrollTo({ top: y, behavior: 'smooth' });
                          }
                        }}
                        className={`
                          relative flex items-center gap-3 text-left text-xs w-full py-1.5 transition-colors
                          ${isActive ? 'text-[var(--text)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'}
                        `}
                      >
                        <div className={`
                          w-[7px] h-[7px] rounded-full flex-shrink-0 z-10 transition-colors
                          ${isActive ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-600'}
                        `} />
                        <span className={isActive ? 'font-medium' : ''}>
                          {section.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </nav>
        )}


      {/* Error message */}
      {answerSubmitError && (
        <div className="rounded-lg p-4 bg-red-50 dark:bg-red-950/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-[var(--red)] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[var(--text-sm)] font-medium text-[var(--red)]">
                {answerSubmitError.includes('Maximum') ? 'Cannot start round' : 'Something went wrong'}
              </p>
              <p className="text-[var(--text-xs)] text-[var(--red)] mt-1">
                {answerSubmitError}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAnswerSubmitError(null)}
              className="text-[var(--red)]"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Validation Results */}
      {currentTicket.validationResults && currentTicket.validationResults.length > 0 && (
        <ValidationResults
          validationResults={currentTicket.validationResults}
          overallScore={currentTicket.readinessScore}
        />
      )}

      {/* Special case: maxRounds=0 (no questions needed) */}
      {!isStartingRound && currentTicket.maxRounds === 0 && !currentTicket.techSpec && (
        <div className="rounded-lg bg-[var(--bg-subtle)] p-6">
          <div className="flex flex-col items-center justify-center gap-3">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <div className="text-center">
              <h3 className="text-[var(--text-md)] font-medium text-[var(--text)] mb-1">
                No Clarification Needed
              </h3>
              <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
                This task is straightforward enough to generate a spec directly
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading state while scanning GitHub code and generating questions */}
      {isStartingRound && (
        <div className="rounded-lg bg-[var(--bg-subtle)] p-8">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--text-tertiary)]" />
            <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
              📋 Generating questions...
            </p>
          </div>
        </div>
      )}

      {/* Tech Spec - Main content for Stage 4 (Review) */}
      {currentTicket.techSpec && (
        <section className="space-y-8">
          {/* Technology Stack */}
          {currentTicket.techSpec.stack && (
            <CollapsibleSection id="technology-stack" title="Technology Stack">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {currentTicket.techSpec.stack.language && (
                  <div className="space-y-1">
                    <p className="text-[var(--text-xs)] uppercase text-[var(--text-tertiary)]">Language</p>
                    <p className="text-[var(--text-sm)] font-medium text-[var(--text)]">{currentTicket.techSpec.stack.language}</p>
                  </div>
                )}
                {currentTicket.techSpec.stack.framework && (
                  <div className="space-y-1">
                    <p className="text-[var(--text-xs)] uppercase text-[var(--text-tertiary)]">Framework</p>
                    <p className="text-[var(--text-sm)] font-medium text-[var(--text)]">{currentTicket.techSpec.stack.framework}</p>
                  </div>
                )}
                {currentTicket.techSpec.stack.packageManager && (
                  <div className="space-y-1">
                    <p className="text-[var(--text-xs)] uppercase text-[var(--text-tertiary)]">Package Manager</p>
                    <p className="text-[var(--text-sm)] font-medium text-[var(--text)]">{currentTicket.techSpec.stack.packageManager}</p>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* Problem Statement — non-collapsible */}
          {currentTicket.techSpec.problemStatement && (() => {
            const ps = normalizeProblemStatement(currentTicket.techSpec.problemStatement);
            return ps.narrative ? (
            <div id="problem-statement" data-nav-section className="space-y-3">
              <h3 className="text-sm font-medium text-[var(--text)] pl-3 border-l-2 border-[var(--primary)]/40">
                Problem Statement
              </h3>
              <div className="space-y-3">
                <p className="text-[var(--text-sm)] text-[var(--text-secondary)] leading-relaxed">
                  {ps.narrative}
                </p>
                {ps.whyItMatters && (
                  <div className="pt-2 border-t border-[var(--border)]">
                    <p className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase mb-1">
                      Why it matters
                    </p>
                    <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
                      {ps.whyItMatters}
                    </p>
                  </div>
                )}
                {ps.assumptions.length > 0 && (
                  <div className="pt-2 border-t border-[var(--border)]">
                    <p className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase mb-1">
                      Assumptions
                    </p>
                    <ul className="space-y-2 text-[var(--text-sm)] text-[var(--text-secondary)]">
                      {ps.assumptions.map((a: string, i: number) => (
                        <li key={i}>
                          <EditableItem onEdit={() => openEdit('assumptions', i)} onDelete={() => deleteTechSpecItem('assumptions', i)}>
                            <span className="text-[var(--text-tertiary)] mr-2">-</span>{a}
                          </EditableItem>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {ps.constraints.length > 0 && (
                  <div className="pt-2 border-t border-[var(--border)]">
                    <p className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase mb-1">
                      Constraints
                    </p>
                    <ul className="space-y-2 text-[var(--text-sm)] text-[var(--text-secondary)]">
                      {ps.constraints.map((c: string, i: number) => (
                        <li key={i}>
                          <EditableItem onEdit={() => openEdit('constraints', i)} onDelete={() => deleteTechSpecItem('constraints', i)}>
                            <span className="text-[var(--text-tertiary)] mr-2">-</span>{c}
                          </EditableItem>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            ) : null;
          })()}

          {/* Visual QA Expectations */}
          {currentTicket.techSpec.visualExpectations && (
            <CollapsibleSection
              id="visual-qa"
              title="Visual QA Expectations"
              badge={`${currentTicket.techSpec.visualExpectations.expectations?.length || 0} screens`}
              defaultExpanded={true}
            >
              <VisualExpectationsSection
                summary={currentTicket.techSpec.visualExpectations.summary}
                expectations={currentTicket.techSpec.visualExpectations.expectations || []}
                flowDiagram={currentTicket.techSpec.visualExpectations.flowDiagram}
              />
            </CollapsibleSection>
          )}

          {/* Assets — Export documents + Attachments */}
          <CollapsibleSection id="assets" title="Assets" badge={currentTicket.attachments?.length ? `${currentTicket.attachments.length} files` : undefined} defaultExpanded={true}>
            <AssetsSection
              ticketId={ticketId!}
              ticketTitle={currentTicket.title}
              ticketUpdatedAt={currentTicket.updatedAt}
              attachments={currentTicket.attachments}
              onUploadAttachment={async (file) => uploadAttachment(ticketId!, file)}
              onDeleteAttachment={async (attachmentId) => deleteAttachment(ticketId!, attachmentId)}
              isUploadingAttachment={isUploadingAttachment}
            />
          </CollapsibleSection>

          {/* Solution Steps — non-collapsible */}
          {currentTicket.techSpec.solution && (
            <div id="solution" data-nav-section className="space-y-3">
              <h3 className="text-sm font-medium text-[var(--text)] pl-3 border-l-2 border-[var(--primary)]/40">
                Solution
              </h3>
              <div className="space-y-3">
                {typeof currentTicket.techSpec.solution === 'string' ? (
                  <p className="text-[var(--text-sm)] text-[var(--text-secondary)] leading-relaxed">
                    {currentTicket.techSpec.solution}
                  </p>
                ) : Array.isArray(currentTicket.techSpec.solution) ? (
                  <ol className="space-y-2 text-[var(--text-sm)] text-[var(--text-secondary)]">
                    {currentTicket.techSpec.solution.map((step: string | any, idx: number) => (
                      <li key={idx}>
                        <EditableItem onEdit={() => openEdit('steps', idx)} onDelete={() => deleteTechSpecItem('steps', idx)}>
                          <div className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-medium text-[var(--text-tertiary)]">
                              {idx + 1}
                            </span>
                            <span className="pt-0.5">
                              {typeof step === 'string' ? step : step.description || JSON.stringify(step)}
                            </span>
                          </div>
                        </EditableItem>
                      </li>
                    ))}
                  </ol>
                ) : currentTicket.techSpec.solution.overview ? (
                  <div className="space-y-3">
                    <p className="text-[var(--text-sm)] text-[var(--text-secondary)] leading-relaxed">
                      {currentTicket.techSpec.solution.overview}
                    </p>
                    {currentTicket.techSpec.solution.steps?.length > 0 && (
                      <ol className="space-y-2 text-[var(--text-sm)] text-[var(--text-secondary)]">
                        {currentTicket.techSpec.solution.steps.map((step: any, idx: number) => (
                          <li key={idx}>
                            <EditableItem onEdit={() => openEdit('steps', idx)} onDelete={() => deleteTechSpecItem('steps', idx)}>
                              <div className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-medium text-[var(--text-tertiary)]">
                                  {step.order || idx + 1}
                                </span>
                                <div className="pt-0.5">
                                  <p>{step.description}</p>
                                  {step.file && (
                                    <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] font-mono mt-1">
                                      {step.file}{step.lineNumbers ? `:${step.lineNumbers[0]}-${step.lineNumbers[1]}` : ''}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </EditableItem>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Acceptance Criteria — non-collapsible, BDD color-coded */}
          {currentTicket.techSpec.acceptanceCriteria?.length > 0 && (
            <div id="spec-acceptance" data-nav-section className="space-y-3">
              <h3 className="text-sm font-medium text-[var(--text)] pl-3 border-l-2 border-[var(--primary)]/40">
                Acceptance Criteria
              </h3>
              <ul className="space-y-3 text-[var(--text-sm)] text-[var(--text-secondary)]">
                {currentTicket.techSpec.acceptanceCriteria.map((ac: any, idx: number) => (
                  <li key={idx}>
                    <EditableItem onEdit={() => openEdit('acceptanceCriteria', idx)} onDelete={() => deleteTechSpecItem('acceptanceCriteria', idx)}>
                      {typeof ac === 'string' ? (
                        <span><span className="text-[var(--text-tertiary)] mr-2">-</span>{ac}</span>
                      ) : (
                        <div className="space-y-1.5 bg-gray-50 dark:bg-gray-900 rounded-lg px-4 py-3">
                          <p><span className="font-medium text-blue-500 mr-1">Given</span> {ac.given}</p>
                          <p><span className="font-medium text-amber-500 mr-1">When</span> {ac.when}</p>
                          <p><span className="font-medium text-green-500 mr-1">Then</span> {ac.then}</p>
                          {ac.implementationNotes && (
                            <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] italic mt-1.5">
                              {ac.implementationNotes}
                            </p>
                          )}
                        </div>
                      )}
                    </EditableItem>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* API Endpoints */}
          <CollapsibleSection id="api-endpoints" title="API Endpoints" badge={`${(currentTicket.techSpec.apiChanges?.endpoints || []).length}`} defaultExpanded={true}>
            <ApiReviewSection
              endpoints={currentTicket.techSpec.apiChanges?.endpoints || []}
              onEdit={(idx) => openEdit('apiEndpoints', idx)}
              onDelete={(idx) => deleteTechSpecItem('apiEndpoints', idx)}
              onAdd={() => {
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
              }}
              onSave={async (acceptedEndpoints) => {
                await saveTechSpecPatch({
                  apiChanges: { ...currentTicket?.techSpec?.apiChanges, endpoints: acceptedEndpoints },
                });
                if (ticketId) await fetchTicket(ticketId);
                toast.success(`Saved ${acceptedEndpoints.length} API endpoint${acceptedEndpoints.length !== 1 ? 's' : ''}`);
              }}
              onScanApis={handleScanApis}
              isScanning={isScanningApis}
            />
          </CollapsibleSection>

          {/* File Changes */}
          {currentTicket.techSpec.fileChanges?.length > 0 && (
            <CollapsibleSection id="file-changes" title="File Changes" badge={`${currentTicket.techSpec.fileChanges.length}`}>
              <ul className="space-y-2">
                {currentTicket.techSpec.fileChanges.map((fc: any, idx: number) => {
                  const action = fc.action || fc.type || 'modify';
                  const Icon = action === 'create' ? FilePlus
                    : action === 'delete' ? FileX
                    : FileCode;
                  const colorClass = action === 'create' ? 'text-green-500'
                    : action === 'delete' ? 'text-red-500'
                    : 'text-amber-500';

                  return (
                    <li key={idx}>
                      <EditableItem onEdit={() => openEdit('fileChanges', idx)} onDelete={() => deleteTechSpecItem('fileChanges', idx)}>
                        <div className="flex items-center gap-2 text-[var(--text-sm)]">
                          <Icon className={`h-4 w-4 flex-shrink-0 ${colorClass}`} />
                          <span className="font-mono text-[var(--text-secondary)]">{fc.path}</span>
                          <Badge variant="outline" className="text-[var(--text-xs)] capitalize">
                            {action}
                          </Badge>
                        </div>
                      </EditableItem>
                    </li>
                  );
                })}
              </ul>
            </CollapsibleSection>
          )}

          {/* Backend / Frontend Changes (Layered) */}
          {currentTicket.techSpec.layeredFileChanges && (
            <CollapsibleSection id="layered-changes" title="Backend / Frontend Changes">
              <BackendClientChanges
                backendChanges={currentTicket.techSpec.layeredFileChanges.backend || []}
                frontendChanges={currentTicket.techSpec.layeredFileChanges.frontend || []}
                sharedChanges={currentTicket.techSpec.layeredFileChanges.shared || []}
                infrastructureChanges={currentTicket.techSpec.layeredFileChanges.infrastructure || []}
                documentationChanges={currentTicket.techSpec.layeredFileChanges.documentation || []}
                onEdit={(layer, idx) => openEdit('fileChanges', idx)}
                onDelete={(layer, idx) => deleteTechSpecItem('fileChanges', idx)}
              />
            </CollapsibleSection>
          )}

          {/* Test Plan */}
          {currentTicket.techSpec.testPlan && (
            <CollapsibleSection id="test-plan" title="Test Plan" badge={`${(currentTicket.techSpec.testPlan.unitTests?.length || 0) + (currentTicket.techSpec.testPlan.integrationTests?.length || 0) + (currentTicket.techSpec.testPlan.edgeCases?.length || 0)} tests`} defaultExpanded={true}>
              <TestPlanSection
                summary={currentTicket.techSpec.testPlan.summary}
                unitTests={currentTicket.techSpec.testPlan.unitTests || []}
                integrationTests={currentTicket.techSpec.testPlan.integrationTests || []}
                edgeCases={currentTicket.techSpec.testPlan.edgeCases || []}
                testingNotes={currentTicket.techSpec.testPlan.testingNotes}
                coverageGoal={currentTicket.techSpec.testPlan.coverageGoal}
                onEdit={(idx) => openEdit('testPlan', idx)}
                onDelete={(idx) => deleteTechSpecItem('testPlan', idx)}
              />
            </CollapsibleSection>
          )}

          {/* Scope */}
          {(currentTicket.techSpec.inScope?.length > 0 || currentTicket.techSpec.outOfScope?.length > 0) && (
            <CollapsibleSection id="scope" title="Scope">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentTicket.techSpec.inScope?.length > 0 && (
                  <div className="rounded-lg bg-[var(--bg-hover)] p-3 space-y-2">
                    <h4 className="text-[var(--text-xs)] font-medium text-green-600 dark:text-green-400 uppercase">
                      In Scope
                    </h4>
                    <ul className="space-y-2 text-[var(--text-sm)] text-[var(--text-secondary)]">
                      {currentTicket.techSpec.inScope.map((item: string, idx: number) => (
                        <li key={idx}>
                          <EditableItem onEdit={() => openEdit('inScope', idx)} onDelete={() => deleteTechSpecItem('inScope', idx)}>
                            <span className="text-[var(--text-tertiary)] mr-2">-</span>{item}
                          </EditableItem>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {currentTicket.techSpec.outOfScope?.length > 0 && (
                  <div className="rounded-lg bg-[var(--bg-hover)] p-3 space-y-2">
                    <h4 className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                      Out of Scope
                    </h4>
                    <ul className="space-y-2 text-[var(--text-sm)] text-[var(--text-secondary)]">
                      {currentTicket.techSpec.outOfScope.map((item: string, idx: number) => (
                        <li key={idx}>
                          <EditableItem onEdit={() => openEdit('outOfScope', idx)} onDelete={() => deleteTechSpecItem('outOfScope', idx)}>
                            <span className="text-[var(--text-tertiary)] mr-2">-</span>{item}
                          </EditableItem>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          )}
        </section>
      )}

      {/* Assets section when no tech spec (attachments only) */}
      {!currentTicket.techSpec && (
        <section id="assets" data-nav-section>
          <CollapsibleSection id="assets-attachments" title="Attachments" badge={currentTicket.attachments?.length ? `${currentTicket.attachments.length} files` : undefined} defaultExpanded={true}>
            <ImageAttachmentsGrid
              attachments={currentTicket.attachments || []}
              onUpload={async (file) => uploadAttachment(ticketId!, file)}
              onDelete={async (attachmentId) => deleteAttachment(ticketId!, attachmentId)}
              isUploading={isUploadingAttachment}
            />
          </CollapsibleSection>
        </section>
      )}

      {/* Acceptance Criteria */}
      {currentTicket.acceptanceCriteria && currentTicket.acceptanceCriteria.length > 0 && (
        <section id="ticket-acceptance" data-nav-section>
          <CollapsibleSection title="Acceptance Criteria" id="ticket-acceptance-collapsible" defaultExpanded={false}>
            <InlineEditableList
              items={currentTicket.acceptanceCriteria}
              type="numbered"
              onSave={handleSaveAcceptanceCriteria}
              emptyMessage="No acceptance criteria yet"
            />
          </CollapsibleSection>
        </section>
      )}

      {/* Assumptions */}
      {currentTicket.assumptions && currentTicket.assumptions.length > 0 && (
        <section id="assumptions" data-nav-section>
          <CollapsibleSection title="Assumptions" id="assumptions-collapsible" defaultExpanded={false}>
            <InlineEditableList
              items={currentTicket.assumptions}
              type="bulleted"
              onSave={handleSaveAssumptions}
              emptyMessage="No assumptions yet"
            />
          </CollapsibleSection>
        </section>
      )}

      {/* Affected Code */}
      {currentTicket.repoPaths && currentTicket.repoPaths.length > 0 && (
        <section id="affected-code" data-nav-section>
          <CollapsibleSection title="Affected Code" id="affected-code-collapsible" defaultExpanded={false}>
            <ul className="space-y-1 text-[var(--text-sm)] font-mono text-[var(--text-secondary)]">
              {currentTicket.repoPaths.map((path, index) => (
                <li key={index}>{path}</li>
              ))}
            </ul>
          </CollapsibleSection>
        </section>
      )}

      {/* Estimate */}
      {currentTicket.estimate && (
        <section id="estimate" data-nav-section>
          <CollapsibleSection title="Estimate" id="estimate-collapsible" defaultExpanded={false}>
            <div className="space-y-2">
              <p className="text-[var(--text-base)] text-[var(--text)]">
                {currentTicket.estimate.min}-{currentTicket.estimate.max} hours{' '}
                <span className="text-[var(--text-tertiary)] capitalize">
                  ({currentTicket.estimate.confidence} confidence)
                </span>
              </p>
              {currentTicket.estimate.drivers && currentTicket.estimate.drivers.length > 0 && (
                <ul className="space-y-1 text-[var(--text-sm)] text-[var(--text-secondary)]">
                  {currentTicket.estimate.drivers.map((driver: string, index: number) => (
                    <li key={index}>• {driver}</li>
                  ))}
                </ul>
              )}
            </div>
          </CollapsibleSection>
        </section>
      )}

      {/* Question Refinement — collapsible, at bottom, only show if NOT finalized */}
      {!isStartingRound &&
       !currentTicket.techSpec &&
       (currentTicket.currentRound ?? 0) > 0 &&
       currentTicket.questionRounds &&
       currentTicket.questionRounds.length > 0 && (
        <section id="question-refinement" data-nav-section>
          <div className="rounded-lg bg-[var(--bg-subtle)] p-4">
            <button
              onClick={() => setQuestionsExpanded(v => !v)}
              className="flex items-center justify-between w-full"
            >
              <h3 className="text-[var(--text-sm)] font-medium text-[var(--text)]">
                Question Refinement
              </h3>
              <ChevronDown className={`h-4 w-4 text-[var(--text-tertiary)] transition-transform ${questionsExpanded ? 'rotate-180' : ''}`} />
            </button>
            {questionsExpanded && (
              <div className="pt-4 mt-4 border-t border-[var(--border)]">
                <QuestionRoundsSection
                  questionRounds={currentTicket.questionRounds}
                  currentRound={currentTicket.currentRound!}
                  maxRounds={currentTicket.maxRounds ?? 3}
                  onSubmitAnswers={handleSubmitRoundAnswers}
                  onSkipToFinalize={handleSkipToFinalize}
                  onFinalizeSpec={handleFinalizeSpec}
                  isSubmitting={isSubmittingAnswers}
                  error={answerSubmitError}
                  onDismissError={() => setAnswerSubmitError(null)}
                  useModalUI={true}
                />
              </div>
            )}
          </div>
        </section>
      )}


      {/* Notes — PM custom markdown notes */}
      <div id="notes" data-nav-section className="rounded-lg bg-[var(--bg-subtle)] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[var(--text-sm)] font-medium text-[var(--text)] flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
            Notes
          </h3>
          <div className="flex items-center gap-1">
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setDescriptionExpanded(true); setDescriptionMode('edit'); }}
              className="h-7 w-7 p-0 text-[var(--text-tertiary)] hover:text-[var(--text)]"
              title="Expand editor"
            >
              <Expand className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <textarea
          ref={descriptionRef}
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
          rows={3}
          className="w-full bg-transparent text-[var(--text-sm)] text-[var(--text-secondary)] leading-relaxed font-mono resize-y rounded-md border border-[var(--border)]/30 px-3 py-2 placeholder:text-[var(--text-tertiary)]/50 focus:outline-none focus:border-[var(--primary)]/50 focus:ring-1 focus:ring-[var(--primary)]/20 transition-colors"
        />
        {isDescriptionDirty && (
          <p className="text-[10px] text-[var(--text-tertiary)]">
            Unsaved changes. Press <kbd className="px-1 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-tertiary)] font-mono text-[9px]">Cmd+S</kbd> or click Save.
          </p>
        )}
      </div>

      {/* Footer with export and delete buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-[var(--border)]">
        <Button
          variant="ghost"
          onClick={() => setShowDeleteConfirm(true)}
          className="text-[var(--red)] hover:text-[var(--red)] hover:bg-[var(--red)]/10"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Ticket
        </Button>
      </div>
      </div> {/* End relative wrapper for section nav */}

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
            <Button
              variant="outline"
              onClick={() => setShowStatusConfirm(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleToggleStatus}
              disabled={isUpdating}
            >
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
                {/* Edit / Preview toggle */}
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

          {/* Body */}
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

          {/* Footer */}
          {isDescriptionDirty && (
            <div className="flex-shrink-0 px-6 py-3 border-t border-[var(--border)]">
              <p className="text-[10px] text-[var(--text-tertiary)]">
                Unsaved changes. Press <kbd className="px-1 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-tertiary)] font-mono text-[9px]">Cmd+S</kbd> or click Save.
              </p>
            </div>
          )}
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
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
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
