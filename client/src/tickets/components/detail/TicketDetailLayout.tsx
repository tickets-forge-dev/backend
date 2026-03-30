'use client';

import { useState, useEffect, useRef, useMemo, type ReactPortal } from 'react';
import { createPortal } from 'react-dom';
import { useUIStore } from '@/stores/ui.store';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/core/components/ui/tabs';
import { CollapsibleSection } from '@/src/tickets/components/CollapsibleSection';
import { ImageAttachmentsGrid } from '@/src/tickets/components/ImageAttachmentsGrid';
import { OverviewCard } from './OverviewCard';
import { SpecificationTab } from './SpecificationTab';
import { ImplementationTab } from './ImplementationTab';
import { DesignTab } from './DesignTab';
import { ChangeRecordTab } from './ChangeRecordTab';
import { Button } from '@/core/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/core/components/ui/alert-dialog';
import { HelpCircle, MessageSquare, CheckCircle2, Loader2, RefreshCw, ShieldCheck, FileCode2, GitPullRequest, TestTube, Target, ChevronDown, ChevronUp, ChevronRight, FileText, Palette, Code2, UserPlus, ArrowRight, Copy, Check, StickyNote, Save } from 'lucide-react';
import type { AECResponse, AttachmentResponse } from '@/services/ticket.service';
import { useServices } from '@/services/index';
import type { ApiEndpointSpec } from '@/types/question-refinement';
import { ReviewSessionSection } from './ReviewSessionSection';
import { ReEnrichProgressDialog } from './ReEnrichProgressDialog';
import { DevelopSessionBlade } from '@/src/sessions/components/organisms/DevelopSessionBlade';
import { TicketDevelopButton } from '@/src/sessions/components/atoms/TicketDevelopButton';
import { useSessionStore } from '@/src/sessions/stores/session.store';
import { TICKET_STATUS_CONFIG, EXECUTE_STATUSES } from '../../config/ticketStatusConfig';
import { useTicketsStore } from '@/stores/tickets.store';
import { toast } from 'sonner';

interface TicketDetailLayoutProps {
  ticket: AECResponse;
  ticketId: string;
  // Story 3.5-5: Assignment
  onAssignTicket: (userId: string | null) => Promise<boolean>;
  qualityScore?: number;
  // Edit callbacks
  onEditItem: (section: string, index: number) => void;
  onDeleteItem: (section: string, index: number) => void;
  onSaveAcceptanceCriteria: (items: string[]) => Promise<void>;
  onSaveAssumptions: (items: string[]) => Promise<void>;
  // Reproduction steps (bug tickets)
  onEditReproductionStep?: (index: number) => void;
  onDeleteReproductionStep?: (index: number) => void;
  onAddReproductionStep?: () => void;
  // API
  onAddApiEndpoint: () => void;
  onSaveApiEndpoints: (endpoints: ApiEndpointSpec[]) => Promise<void>;
  onScanApis: () => Promise<void>;
  isScanningApis: boolean;
  // Attachments
  onUploadAttachment: (file: File, onProgress?: (percent: number) => void) => Promise<boolean>;
  onDeleteAttachment: (attachmentId: string) => Promise<boolean>;
  isUploadingAttachment: boolean;
  // Design references
  onAddDesignReference?: (url: string, title?: string) => Promise<void>;
  onRemoveDesignReference?: (referenceId: string) => Promise<void>;
  onRefreshDesignReference?: (referenceId: string) => Promise<void>;
  // Tech spec patch
  saveTechSpecPatch: (patch: Record<string, any>) => Promise<boolean | undefined>;
  fetchTicket: (id: string) => Promise<void>;
  // Lifecycle transitions
  onStatusTransition?: (status: string) => void;
  // Assign dialog control (for lifecycle warning)
  assignDialogOpen?: boolean;
  onAssignDialogOpenChange?: (open: boolean) => void;
  // Delivery review
  // Notes
  descriptionDraft: string;
  onDescriptionChange: (value: string) => void;
  isDescriptionDirty: boolean;
  isSavingDescription: boolean;
  onSaveDescription: () => void;
}

export function TicketDetailLayout({
  ticket,
  ticketId,
  onAssignTicket,
  qualityScore,
  onEditItem,
  onDeleteItem,
  onSaveAcceptanceCriteria,
  onSaveAssumptions,
  onEditReproductionStep,
  onDeleteReproductionStep,
  onAddReproductionStep,
  onAddApiEndpoint,
  onSaveApiEndpoints,
  onScanApis,
  isScanningApis,
  onUploadAttachment,
  onDeleteAttachment,
  isUploadingAttachment,
  onAddDesignReference,
  onRemoveDesignReference,
  onRefreshDesignReference,
  saveTechSpecPatch,
  fetchTicket,
  onStatusTransition,
  assignDialogOpen,
  onAssignDialogOpenChange,
  descriptionDraft,
  onDescriptionChange,
  isDescriptionDirty,
  isSavingDescription,
  onSaveDescription,
}: TicketDetailLayoutProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasTechSpec = !!ticket.techSpec;
  const { approveTicket, reEnrichTicket } = useTicketsStore();
  const { ticketService } = useServices();
  const { sidebarCollapsed } = useUIStore();
  const sideNavLeft = sidebarCollapsed ? 'left-[calc(4rem+1rem)]' : 'left-[calc(var(--nav-width)+1rem)]';
  const [isApproving, setIsApproving] = useState(false);
  const [isReEnriching, setIsReEnriching] = useState(false);
  const [cliCopied, setCliCopied] = useState(false);
  const [cliHowToOpen, setCliHowToOpen] = useState(false);
  const [isAecExpanded, setIsAecExpanded] = useState(false);
  const [aecXml, setAecXml] = useState<string | null>(null);
  const [isLoadingXml, setIsLoadingXml] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const assignedDuringNudge = useRef(false);
  const assignAttempted = useRef(false);

  const [developBladeOpen, setDevelopBladeOpen] = useState(false);
  const sessionStatus = useSessionStore(state => state.status);

  const validTabs = ['spec', 'technical', 'design', 'delivered', 'notes'];
  const tabParam = searchParams.get('tab');
  const initialTab = tabParam && validTabs.includes(tabParam) ? tabParam : 'spec';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setActiveSection(null); // Reset scroll spy when switching tabs
    const url = new URL(window.location.href);
    if (value === 'spec') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', value);
    }
    window.history.replaceState({}, '', url.toString());
  };

  // Section definitions
  const specSections = [
    { id: 'reproduction-steps', label: 'Reproduction Steps', short: 'Repro', bugOnly: true },
    { id: 'problem-statement', label: 'Problem Statement', short: 'Problem' },
    { id: 'acceptance-criteria', label: 'Acceptance Criteria', short: 'AC' },
    { id: 'scope', label: 'Scope', short: 'Scope' },
    { id: 'solution', label: 'Solution', short: 'Solution' },
    { id: 'assets', label: 'Assets', short: 'Assets' },
  ].filter(s => !s.bugOnly || ticket.type === 'bug');

  const techSections = [
    { id: 'file-changes', label: 'File Changes', short: 'Files' },
    { id: 'api-endpoints', label: 'API Endpoints', short: 'APIs' },
    { id: 'dependencies', label: 'Dependencies', short: 'Deps' },
    { id: 'test-plan', label: 'Test Plan', short: 'Tests' },
    { id: 'stack', label: 'Stack', short: 'Stack' },
  ];

  const scrollTo = (tabPrefix: string, sectionId: string) => {
    document.getElementById(`${tabPrefix}-${sectionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Track scroll position for scroll spy
  useEffect(() => {
    const handleScroll = () => {
      const currentTab = activeTab === 'spec' ? 'spec' : 'technical';
      const sections = activeTab === 'spec' ? specSections : techSections;

      for (const section of sections) {
        const element = document.getElementById(`${currentTab}-${section.id}`);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100) {
            setActiveSection(`${currentTab}-${section.id}`);
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab]);

  const hasReviewSession = !!ticket.reviewSession?.qaItems?.length;
  const hasTechSpecContent = !!ticket.techSpec;
  const isWaitingForApproval = ticket.status === 'refined';
  const isDevRefining = ticket.status === 'defined';
  const isDraft = ticket.status === 'draft';
  const canApprove = isWaitingForApproval || (isDevRefining && hasTechSpecContent) || (isDraft && hasTechSpecContent);
  const [showSkipReviewWarning, setShowSkipReviewWarning] = useState(false);

  const handleSendToReview = () => {
    if (!ticket.assignedTo) {
      // Open assign dialog — after assignment, user can transition to defined
      onAssignDialogOpenChange?.(true);
      return;
    }
    // Transition to defined (developer review)
    onStatusTransition?.('defined');
  };

  const handleApprove = async () => {
    // If approving from DEV_REFINING (skipping developer review), show warning first
    if (isDevRefining) {
      setShowSkipReviewWarning(true);
      return;
    }

    // If unassigned, nudge PM to assign a developer first
    if (!ticket.assignedTo) {
      assignedDuringNudge.current = false;
      assignAttempted.current = false;
      setPendingApproval(true);
      onAssignDialogOpenChange?.(true);
      return;
    }
    await executeApproval();
  };

  const executeApproval = async (wasJustAssigned = false) => {
    setIsApproving(true);
    try {
      const success = await approveTicket(ticketId);
      if (success) {
        await fetchTicket(ticketId);
        toast.success(
          wasJustAssigned
            ? 'Ticket approved and assigned — developer has been notified'
            : 'Ticket approved'
        );
      } else {
        toast.error('Failed to approve ticket. Please try again.');
      }
    } finally {
      setIsApproving(false);
      setPendingApproval(false);
    }
  };

  // Wrap onAssignTicket to chain approval after assignment when pending
  const handleAssignTicket = async (userId: string | null): Promise<boolean> => {
    if (pendingApproval && userId) {
      assignAttempted.current = true;
    }
    const success = await onAssignTicket(userId);
    if (success && pendingApproval && userId) {
      // Assignment succeeded during approval nudge — auto-approve
      assignedDuringNudge.current = true;
      await executeApproval(true);
    }
    return success;
  };

  // Handle assign dialog closing — decide what to do based on nudge flow state
  const handleAssignDialogOpenChange = (open: boolean) => {
    onAssignDialogOpenChange?.(open);
    if (!open && pendingApproval) {
      if (assignedDuringNudge.current) {
        // Assignment succeeded — executeApproval already fired from handleAssignTicket, nothing to do
        return;
      }
      if (!assignAttempted.current) {
        // User explicitly skipped (closed without attempting any assignment) — approve without assignment
        executeApproval(false);
      } else {
        // Assignment was attempted but failed — do NOT approve, just reset pending state
        setPendingApproval(false);
      }
    }
  };

  const handleReEnrich = async () => {
    setIsReEnriching(true);
    try {
      const success = await reEnrichTicket(ticketId);
      if (success) {
        await fetchTicket(ticketId);
        toast.success('Spec regenerated with developer insights');
      } else {
        toast.error('Failed to regenerate spec. Please try again.');
      }
    } finally {
      setIsReEnriching(false);
    }
  };

  // Pre-tech-spec state: show simple layout with questions + attachments
  if (!hasTechSpec) {
    const hasQuestions = ticket.questions && ticket.questions.length > 0;

    return (
      <div className="space-y-6">
        {/* Regeneration progress dialog */}
        <ReEnrichProgressDialog isVisible={isReEnriching} />

        {/* Overview Card (metadata bar) */}
        <OverviewCard
          ticket={ticket}
          onAssignTicket={handleAssignTicket}
          qualityScore={qualityScore}
          onTransition={onStatusTransition}
          assignDialogOpen={assignDialogOpen}
          onAssignDialogOpenChange={handleAssignDialogOpenChange}
          pendingApproval={pendingApproval}
        />

        {/* Pending Questions */}
        {hasQuestions && (
          <CollapsibleSection
            id="pending-questions"
            title="Questions to Answer"
            badge={`${ticket.questions.length} question${ticket.questions.length !== 1 ? 's' : ''}`}
            defaultExpanded={true}
          >
            <div className="space-y-6">
              {ticket.questions.map((question: any, idx: number) => (
                <div key={idx} className="p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)]">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--text)] mb-1">
                        Question {idx + 1} of {ticket.questions.length}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {question.question || question.text || 'No question text'}
                      </p>
                      {question.context && (
                        <p className="text-xs text-[var(--text-tertiary)] mt-2 italic">
                          Context: {question.context}
                        </p>
                      )}
                    </div>
                    <div className="text-xs font-medium px-2 py-1 bg-[var(--bg-hover)] text-[var(--text-tertiary)] rounded">
                      {question.type === 'multiline' ? 'Text' : question.type === 'checkbox' ? 'Multiple' : question.type === 'radio' ? 'Single' : 'Input'}
                    </div>
                  </div>

                  {/* Answer preview */}
                  {question.type === 'radio' || question.type === 'checkbox' ? (
                    <div className="space-y-2">
                      {question.options?.map((option: string, optIdx: number) => (
                        <div key={optIdx} className="flex items-center gap-2 text-sm">
                          <input
                            type={question.type}
                            disabled
                            className="text-[var(--primary)] cursor-not-allowed opacity-50"
                          />
                          <span className="text-[var(--text-secondary)]">{option}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-[var(--bg-tertiary)] rounded border border-[var(--border)]/50 font-mono text-xs text-[var(--text-tertiary)] min-h-[60px] flex items-center justify-center">
                      Your answer will appear here
                    </div>
                  )}
                </div>
              ))}

              <div className="p-4 border border-[var(--border-subtle)] bg-[var(--bg-subtle)] rounded-lg space-y-3">
                <p className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 flex-shrink-0 mt-0.5 text-[var(--text-tertiary)]" />
                  <span><strong>Answer these questions</strong> to generate the technical specification</span>
                </p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  The system will guide you through each question one by one, and then automatically create the full technical specification based on your answers.
                </p>
                <Link href={`/tickets/create?resume=${ticketId}`}>
                  <Button className="w-full mt-3" variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Answer Questions Now
                  </Button>
                </Link>
              </div>
            </div>
          </CollapsibleSection>
        )}

        {/* Review Session Q&A (Story 6-12 / 7-6) */}
        {hasReviewSession && (
          <CollapsibleSection
            id="review-session"
            title="Developer Review Q&A"
            badge={`${ticket.reviewSession!.qaItems.length} answer${ticket.reviewSession!.qaItems.length !== 1 ? 's' : ''}`}
            defaultExpanded={true}
            variant={isWaitingForApproval ? 'attention' : 'default'}
            attentionLabel={isWaitingForApproval ? 'Action needed' : undefined}
          >
            <ReviewSessionSection
              qaItems={ticket.reviewSession!.qaItems}
              submittedAt={ticket.reviewSession!.submittedAt}
            />
            {/* Approve & Forge — single action: re-bake with dev context + approve */}
            {isWaitingForApproval && (
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <p className="text-xs text-[var(--text-tertiary)] mb-3">
                  The spec will be refined with the developer&apos;s feedback. Once approved, the developer can pick it up when ready.
                </p>
                <Button
                  onClick={handleApprove}
                  disabled={isApproving}
                  variant="outline"
                  className="w-full"
                >
                  {isApproving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 mr-2" />
                  )}
                  {isApproving ? 'Approving...' : 'Approve Ticket'}
                </Button>
              </div>
            )}
          </CollapsibleSection>
        )}

        {/* Attachments */}
        <CollapsibleSection
          id="assets-attachments"
          title="Attachments"
          badge={ticket.attachments?.length ? `${ticket.attachments.length} files` : undefined}
          defaultExpanded={true}
        >
          <ImageAttachmentsGrid
            attachments={ticket.attachments || []}
            onUpload={onUploadAttachment}
            onDelete={onDeleteAttachment}
            isUploading={isUploadingAttachment}
          />
        </CollapsibleSection>
      </div>
    );
  }

  // Post-tech-spec: 2-tab layout
  return (
    <div className="space-y-6">
      {/* Regeneration progress dialog */}
      <ReEnrichProgressDialog isVisible={isReEnriching} />

      {/* Overview Card */}
      <OverviewCard
        ticket={ticket}
        onAssignTicket={handleAssignTicket}
        qualityScore={qualityScore}
        onTransition={onStatusTransition}
        assignDialogOpen={assignDialogOpen}
        onAssignDialogOpenChange={handleAssignDialogOpenChange}
        pendingApproval={pendingApproval}
      />

      {/* Develop button — standalone prominent action */}
      {['approved', 'executing', 'delivered'].includes(ticket.status) && (
        <div className="flex items-center">
          <TicketDevelopButton
            onClick={() => setDevelopBladeOpen(true)}
            disabled={false}
            status={
              sessionStatus === 'running' || sessionStatus === 'provisioning' ? 'running'
              : ticket.status === 'delivered' || sessionStatus === 'completed' ? 'completed'
              : 'idle'
            }
          />
        </div>
      )}

      {/* Approval banner — always visible when ticket is in review with developer Q&A */}
      {isWaitingForApproval && hasReviewSession && (
        <div className="flex items-center gap-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-5 py-4">
          <ShieldCheck className="h-5 w-5 text-[var(--text-tertiary)] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Developer review complete — {ticket.reviewSession!.qaItems.length} question{ticket.reviewSession!.qaItems.length !== 1 ? 's' : ''} answered
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              The spec will be refined with the developer&apos;s feedback. Once approved, the developer can pick it up when ready.
            </p>
          </div>
          <Button
            onClick={handleApprove}
            disabled={isApproving}
            variant="outline"
            className="flex-shrink-0"
          >
            {isApproving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4 mr-2" />
            )}
            {isApproving ? 'Approving...' : 'Approve Ticket'}
          </Button>
        </div>
      )}

      {/* Draft CTA — guide PM toward developer review (refine-first flow) */}
      {isDraft && hasTechSpecContent && (
        <div>
        <p className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)]/50 mb-2">Next Action</p>
        <div className="flex items-center gap-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-5 py-4">
          {ticket.assignedTo ? (
            <>
              <ArrowRight className="h-5 w-5 text-blue-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Ready for developer review
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                  Send the spec to the developer for code-aware refinement
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  {isApproving ? 'Approving...' : 'or approve directly →'}
                </button>
                <Button
                  onClick={handleSendToReview}
                  variant="outline"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Send to Review
                </Button>
              </div>
            </>
          ) : (
            <>
              <UserPlus className="h-5 w-5 text-[var(--text-tertiary)] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Ready for developer review
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                  Assign a developer to refine the spec with code context
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  {isApproving ? 'Approving...' : 'or approve without review →'}
                </button>
                <Button
                  onClick={handleSendToReview}
                  variant="outline"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Developer
                </Button>
              </div>
            </>
          )}
        </div>
        </div>
      )}

      {/* Approve without developer review — for DEV_REFINING tickets with a spec */}
      {isDevRefining && hasTechSpecContent && !hasReviewSession && (
        <div className="flex items-center gap-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-5 py-4">
          <ShieldCheck className="h-5 w-5 text-[var(--text-tertiary)] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Spec is ready — approve without developer review?
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              Approve now or wait for a developer to refine the spec first.
            </p>
            <button
              onClick={() => setCliHowToOpen(!cliHowToOpen)}
              className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
            >
              <ChevronRight className={`h-3 w-3 transition-transform ${cliHowToOpen ? 'rotate-90' : ''}`} />
              How it works
            </button>
            {cliHowToOpen && (
              <div className="mt-2 pl-4 space-y-2">
                <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed">
                  <span className="text-[var(--text-secondary)] font-medium">Stage: Dev Review</span> — The developer runs <code className="text-[var(--text-secondary)] bg-[var(--bg-hover)] px-1 py-px rounded text-[10px]">forge review</code> (or <code className="text-[var(--text-secondary)] bg-[var(--bg-hover)] px-1 py-px rounded text-[10px]">/forge:review</code> in Claude Code) to enrich the spec with real code context. Next, the PM approves the ticket. Then the developer can run <code className="text-[var(--text-secondary)] bg-[var(--bg-hover)] px-1 py-px rounded text-[10px]">forge develop</code> to implement it.
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('npm i forge-aec');
                    setCliCopied(true);
                    setTimeout(() => setCliCopied(false), 2000);
                  }}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--bg-hover)] border border-[var(--border-subtle)] hover:border-[var(--border)] transition-colors group"
                >
                  <code className="text-[10px] text-[var(--text-secondary)] font-mono">npm i forge-aec</code>
                  {cliCopied ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-3 w-3 text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]" />
                  )}
                </button>
              </div>
            )}
          </div>
          <Button
            onClick={handleApprove}
            disabled={isApproving}
            variant="outline"
            className="flex-shrink-0"
          >
            {isApproving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4 mr-2" />
            )}
            {isApproving ? 'Approving...' : 'Approve Ticket'}
          </Button>
        </div>
      )}

      {/* Warning dialog when approving without developer review */}
      <AlertDialog open={showSkipReviewWarning} onOpenChange={setShowSkipReviewWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve without developer review?</AlertDialogTitle>
            <AlertDialogDescription>
              This ticket hasn&apos;t been reviewed by a developer yet. <strong>The spec may miss technical details</strong> that only a developer would catch.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowSkipReviewWarning(false);
                // Go straight to approval flow — skip the warning check
                if (!ticket.assignedTo) {
                  assignedDuringNudge.current = false;
                  assignAttempted.current = false;
                  setPendingApproval(true);
                  onAssignDialogOpenChange?.(true);
                } else {
                  executeApproval(false);
                }
              }}
            >
              Approve anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Refine with Questions — shown only when the creator skipped clarification questions */}
      {ticket.status === 'draft' && hasTechSpec && ticket.maxRounds === 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-4 py-3">
          <MessageSquare className="h-4 w-4 text-[var(--text-tertiary)] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[var(--text-secondary)]">
              Want a better spec? Answer clarification questions to refine it.
            </p>
          </div>
          <Link href={`/tickets/create?resume=${ticketId}`}>
            <Button variant="outline" size="sm">
              Refine with Questions
            </Button>
          </Link>
        </div>
      )}

      {/* Review Session Q&A (Story 6-12 / 7-6) — shown above tabs when present */}
      {hasReviewSession && (
        <CollapsibleSection
          id="review-session"
          title="Developer Review Q&A"
          badge={`${ticket.reviewSession!.qaItems.length} answer${ticket.reviewSession!.qaItems.length !== 1 ? 's' : ''}`}
          defaultExpanded={false}
          variant={isWaitingForApproval ? 'attention' : 'default'}
          attentionLabel={isWaitingForApproval ? 'Action needed' : undefined}
        >
          <ReviewSessionSection
            qaItems={ticket.reviewSession!.qaItems}
            submittedAt={ticket.reviewSession!.submittedAt}
          />
          {/* Approve & Forge — single action: re-bake with dev context + approve */}
          {isWaitingForApproval && (
            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--text-tertiary)] mb-3">
                The spec will be refined with the developer&apos;s feedback. Once approved, the developer can pick it up when ready.
              </p>
              <Button
                onClick={handleApprove}
                disabled={isApproving}
                variant="outline"
                className="w-full"
              >
                {isApproving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4 mr-2" />
                )}
                {isApproving ? 'Approving...' : 'Approve Ticket'}
              </Button>
            </div>
          )}
        </CollapsibleSection>
      )}

      {/* Tabbed content */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="border-b border-gray-200 dark:border-gray-800">
          <TabsList className="flex bg-transparent h-auto p-0 border-b-0">

          <TabsTrigger
            value="spec"
            className="text-sm font-medium text-gray-600 dark:text-gray-400 border-b-2 border-transparent data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-50 data-[state=active]:border-[var(--text)] transition-all rounded-none gap-1.5"
          >
            <FileText className="h-3.5 w-3.5" />
            Spec
          </TabsTrigger>
          <TabsTrigger
            value="design"
            className="text-sm font-medium text-gray-600 dark:text-gray-400 border-b-2 border-transparent data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-50 data-[state=active]:border-[var(--text)] transition-all rounded-none gap-1.5"
          >
            <Palette className="h-3.5 w-3.5" />
            Design
          </TabsTrigger>
          <TabsTrigger
            value="technical"
            className="text-sm font-medium text-gray-600 dark:text-gray-400 border-b-2 border-transparent data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-50 data-[state=active]:border-[var(--text)] transition-all rounded-none gap-1.5"
          >
            <Code2 className="h-3.5 w-3.5" />
            Technical
          </TabsTrigger>
          <TabsTrigger
            value="delivered"
            className="text-sm font-medium text-gray-600 dark:text-gray-400 border-b-2 border-transparent data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-50 data-[state=active]:border-[var(--text)] transition-all rounded-none gap-1.5"
          >
            <GitPullRequest className="h-3.5 w-3.5" />
            Record
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="text-sm font-medium text-gray-600 dark:text-gray-400 border-b-2 border-transparent data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-50 data-[state=active]:border-[var(--text)] transition-all rounded-none gap-1.5"
          >
            <StickyNote className="h-3.5 w-3.5" />
            Notes
          </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="spec" className="mt-6">
          {/* Mobile section pills — shown below xl only */}
          <div className="hidden sm:flex xl:hidden gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            {specSections.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo('spec', s.id)}
                className={`flex-shrink-0 text-[11px] px-2.5 py-1 rounded-full transition-colors ${
                  activeSection === `spec-${s.id}`
                    ? 'bg-[var(--primary)]/15 text-[var(--primary)] font-medium'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text)]'
                }`}
              >
                {s.short}
              </button>
            ))}
          </div>

          <div className="max-w-3xl xl:max-w-4xl mx-auto">
            <SpecificationTab
              ticket={ticket}
              ticketId={ticketId}
              onEditItem={onEditItem}
              onDeleteItem={onDeleteItem}
              onSaveAcceptanceCriteria={onSaveAcceptanceCriteria}
              onSaveAssumptions={onSaveAssumptions}
              onEditReproductionStep={onEditReproductionStep}
              onDeleteReproductionStep={onDeleteReproductionStep}
              onAddReproductionStep={onAddReproductionStep}
              onUploadAttachment={onUploadAttachment}
              onDeleteAttachment={onDeleteAttachment}
              isUploadingAttachment={isUploadingAttachment}
              saveTechSpecPatch={saveTechSpecPatch}
              fetchTicket={fetchTicket}
            />
          </div>

          {/* Side scroll spy — xl+ (compact, fits between sidebar and content at 1280px) */}
          <div className={`hidden xl:block fixed ${sideNavLeft} top-32 w-[88px] z-10`}>
            <nav className="space-y-0.5">
              {specSections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo('spec', s.id)}
                  className={`block text-[11px] leading-tight py-1 px-1.5 rounded transition-colors text-left w-full border-l-2 truncate ${
                    activeSection === `spec-${s.id}`
                      ? 'border-[var(--primary)] text-[var(--primary)] font-medium bg-[var(--primary)]/5'
                      : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text)] hover:border-[var(--border-subtle)]'
                  }`}
                  title={s.label}
                >
                  {s.short}
                </button>
              ))}
            </nav>
          </div>
        </TabsContent>

        <TabsContent value="technical" className="mt-6">
          {/* AEC Crown Card */}
          {(() => {
            const isForged = EXECUTE_STATUSES.has(ticket.status);
            const statusCfg = TICKET_STATUS_CONFIG[ticket.status] ?? TICKET_STATUS_CONFIG.draft;

            return (
              <div className={`max-w-3xl xl:max-w-4xl mx-auto mb-6 relative rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/50 overflow-hidden`}>
                <div className="px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--bg-hover)]">
                      <ShieldCheck className="w-4.5 h-4.5 text-[var(--text-tertiary)]" />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${isForged ? 'text-[var(--text)]' : 'text-[var(--text-secondary)]'}`}>
                        Agent Execution Contract
                      </p>
                      <p className="text-[10px] text-[var(--text-tertiary)]">
                        {isForged ? 'Verified and ready for execution' : 'Draft — pending approval'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        if (isAecExpanded) {
                          setIsAecExpanded(false);
                          return;
                        }
                        if (!aecXml) {
                          setIsLoadingXml(true);
                          try {
                            const xml = await ticketService.exportXml(ticketId);
                            setAecXml(xml);
                          } catch {
                            toast.error('Failed to load AEC XML');
                          } finally {
                            setIsLoadingXml(false);
                          }
                        }
                        setIsAecExpanded(true);
                      }}
                      disabled={isLoadingXml}
                      className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      {isLoadingXml ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isAecExpanded ? (
                        <>Hide <ChevronUp className="w-3.5 h-3.5" /></>
                      ) : (
                        <>Show <ChevronDown className="w-3.5 h-3.5" /></>
                      )}
                    </button>
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border border-current/15 ${statusCfg.badgeClass}`}>
                      {statusCfg.label}
                    </span>
                  </div>
                </div>

                {isAecExpanded && aecXml && (
                  <div className="border-t border-[var(--border-subtle)]">
                    <div className="relative">
                      <pre className="px-5 py-4 overflow-x-auto text-[12px] leading-relaxed font-mono max-h-[500px] overflow-y-auto scrollbar-thin">
                        {aecXml.split('\n').map((line, i) => {
                          const highlighted = line
                            .replace(/(<\?.*?\?>)/g, '<span class="text-[#71717a]">$1</span>')
                            .replace(/(<!--.*?-->)/g, '<span class="text-[#525252]">$1</span>')
                            .replace(/(<!\[CDATA\[)(.*?)(\]\]>)/g, '<span class="text-[#71717a]">$1</span><span class="text-amber-300/80">$2</span><span class="text-[#71717a]">$3</span>')
                            .replace(/(<\/)([\w-]+)(>)/g, '<span class="text-[#525252]">$1</span><span class="text-blue-400/80">$2</span><span class="text-[#525252]">$3</span>')
                            .replace(/(<)([\w-]+)((?:\s+[\w-]+="[^"]*")*)(\/?>)/g, (_m, lt, tag, attrs, gt) => {
                              const highlightedAttrs = attrs.replace(/([\w-]+)=("(?:[^"])*")/g, '<span class="text-purple-400/70">$1</span>=<span class="text-green-400/70">$2</span>');
                              return `<span class="text-[#525252]">${lt}</span><span class="text-blue-400/80">${tag}</span>${highlightedAttrs}<span class="text-[#525252]">${gt}</span>`;
                            });

                          return (
                            <div key={i} className="flex">
                              <span className="select-none text-[#3f3f46] w-8 text-right mr-4 flex-shrink-0">{i + 1}</span>
                              <span className="text-[var(--text-secondary)]" dangerouslySetInnerHTML={{ __html: highlighted }} />
                            </div>
                          );
                        })}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Stats summary */}
          {(() => {
            const ts = ticket.techSpec;
            const ac = ts?.acceptanceCriteria?.length || 0;
            const api = ts?.apiChanges?.endpoints?.length || 0;
            const files = ts?.fileChanges?.length || 0;
            const tests = (ts?.testPlan?.unitTests?.length || 0) +
              (ts?.testPlan?.integrationTests?.length || 0) +
              (ts?.testPlan?.edgeCases?.length || 0);
            const scope = (ts?.inScope?.length > 0 || ts?.outOfScope?.length > 0);
            const hasAny = ac > 0 || api > 0 || files > 0 || tests > 0 || scope;
            if (!hasAny) return null;
            return (
              <div className="max-w-3xl xl:max-w-4xl mx-auto mb-5 flex flex-wrap gap-x-5 gap-y-2 px-1">
                {ac > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                    <span className="text-[11px] text-[var(--text-tertiary)]">{ac} acceptance criteria</span>
                  </div>
                )}
                {api > 0 && (
                  <div className="flex items-center gap-1.5">
                    <GitPullRequest className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                    <span className="text-[11px] text-[var(--text-tertiary)]">{api} API endpoints</span>
                  </div>
                )}
                {files > 0 && (
                  <div className="flex items-center gap-1.5">
                    <FileCode2 className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                    <span className="text-[11px] text-[var(--text-tertiary)]">{files} files affected</span>
                  </div>
                )}
                {tests > 0 && (
                  <div className="flex items-center gap-1.5">
                    <TestTube className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                    <span className="text-[11px] text-[var(--text-tertiary)]">{tests} tests</span>
                  </div>
                )}
                {scope && (
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                    <span className="text-[11px] text-[var(--text-tertiary)]">Scope defined</span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Mobile section pills — shown below xl only */}
          <div className="hidden sm:flex xl:hidden gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            {techSections.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo('technical', s.id)}
                className={`flex-shrink-0 text-[11px] px-2.5 py-1 rounded-full transition-colors ${
                  activeSection === `technical-${s.id}`
                    ? 'bg-[var(--primary)]/15 text-[var(--primary)] font-medium'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text)]'
                }`}
              >
                {s.short}
              </button>
            ))}
          </div>

          <div className="max-w-3xl xl:max-w-4xl mx-auto">
            <ImplementationTab
              ticket={ticket}
              ticketId={ticketId}
              onEditItem={onEditItem}
              onDeleteItem={onDeleteItem}
              onAddApiEndpoint={onAddApiEndpoint}
              onSaveApiEndpoints={onSaveApiEndpoints}
              onScanApis={onScanApis}
              isScanningApis={isScanningApis}
              saveTechSpecPatch={saveTechSpecPatch}
              fetchTicket={fetchTicket}
            />
          </div>

          {/* Side scroll spy — xl+ (compact, fits between sidebar and content at 1280px) */}
          <div className={`hidden xl:block fixed ${sideNavLeft} top-32 w-[88px] z-10`}>
            <nav className="space-y-0.5">
              {techSections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo('technical', s.id)}
                  className={`block text-[11px] leading-tight py-1 px-1.5 rounded transition-colors text-left w-full border-l-2 truncate ${
                    activeSection === `technical-${s.id}`
                      ? 'border-[var(--primary)] text-[var(--primary)] font-medium bg-[var(--primary)]/5'
                    : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text)] hover:border-[var(--border-subtle)]'
                  }`}
                  title={s.label}
                >
                  {s.short}
                </button>
              ))}
            </nav>
          </div>
        </TabsContent>

        <TabsContent value="design" className="mt-6">
          <div className="max-w-3xl xl:max-w-4xl mx-auto">
            {onAddDesignReference && onRemoveDesignReference ? (
              <DesignTab
                ticketId={ticketId}
                ticketTitle={ticket.title}
                ticketDescription={ticket.description}
                references={ticket.designReferences || []}
                visualExpectations={ticket.techSpec?.visualExpectations}
                wireframeHtml={ticket.techSpec?.wireframeHtml}
                onAddDesignReference={onAddDesignReference}
                onRemoveDesignReference={onRemoveDesignReference}
                onRefreshDesignReference={onRefreshDesignReference}
                onRefresh={() => fetchTicket(ticketId)}
              />
            ) : (
              <div>
                <h2 className="text-sm font-medium text-[var(--text)] mb-4">Design References</h2>
                <div className="flex items-center justify-center min-h-[200px] rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-secondary)]">
                  <div className="text-center">
                    <div className="text-4xl mb-3">🎨</div>
                    <p className="text-sm font-medium text-[var(--text-secondary)]">No design references added yet</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">Design links (Figma, Loom, etc.) will appear here</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="delivered" className="mt-6">
          <div className="max-w-3xl xl:max-w-4xl mx-auto">
            {ticket.changeRecord ? (
              <ChangeRecordTab
                ticket={ticket}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-hover)] flex items-center justify-center mb-3">
                  <GitPullRequest className="h-5 w-5 text-[var(--text-tertiary)]" />
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">No Change Record yet</p>
                <p className="text-[13px] text-[var(--text-tertiary)] max-w-sm">
                  {ticket.status === 'executing'
                    ? 'A developer is working on this ticket. The Change Record will appear here when they deliver their work.'
                    : ticket.status === 'approved'
                      ? 'The Change Record will be created when a developer starts and completes implementation.'
                      : 'The Change Record is created when the ticket is implemented and delivered for review.'}
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          <div className="max-w-3xl xl:max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1">
                {isDescriptionDirty && (
                  <span className="text-[10px] text-[var(--text-tertiary)] mr-2">Unsaved</span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!isDescriptionDirty || isSavingDescription}
                  onClick={onSaveDescription}
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
            <textarea
              value={descriptionDraft}
              onChange={(e) => onDescriptionChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  if (isDescriptionDirty) onSaveDescription();
                }
              }}
              placeholder="Add notes... (supports Markdown)"
              rows={8}
              className="w-full bg-[var(--bg-subtle)] text-sm text-[var(--text-secondary)] leading-relaxed rounded-lg px-3 py-2 placeholder:text-[var(--text-tertiary)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/30 transition-colors resize-y"
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Develop blade (slide-over panel) — rendered via portal for full viewport coverage */}
      {typeof window !== 'undefined' && createPortal(
        <DevelopSessionBlade
          open={developBladeOpen}
          onClose={() => setDevelopBladeOpen(false)}
          ticketId={ticket.id}
          ticketTitle={ticket.title}
          ticketStatus={ticket.status}
          repoFullName={ticket.repositoryContext?.repositoryFullName}
          branch={ticket.repositoryContext?.branchName}
        />,
        document.body
      )}
    </div>
  );
}
