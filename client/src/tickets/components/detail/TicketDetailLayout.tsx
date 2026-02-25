'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/core/components/ui/tabs';
import { CollapsibleSection } from '@/src/tickets/components/CollapsibleSection';
import { ImageAttachmentsGrid } from '@/src/tickets/components/ImageAttachmentsGrid';
import { OverviewCard } from './OverviewCard';
import { SpecificationTab } from './SpecificationTab';
import { ImplementationTab } from './ImplementationTab';
import { DesignTab } from './DesignTab';
import { Button } from '@/core/components/ui/button';
import { HelpCircle, MessageSquare, CheckCircle2, Loader2, RefreshCw, ShieldCheck, FileCode2, GitPullRequest, TestTube, Target, ChevronDown, ChevronUp } from 'lucide-react';
import type { AECResponse, AttachmentResponse } from '@/services/ticket.service';
import { useServices } from '@/services/index';
import type { ApiEndpointSpec } from '@/types/question-refinement';
import { ReviewSessionSection } from './ReviewSessionSection';
import { ReEnrichProgressDialog } from './ReEnrichProgressDialog';
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
}: TicketDetailLayoutProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasTechSpec = !!ticket.techSpec;
  const { approveTicket, reEnrichTicket } = useTicketsStore();
  const { ticketService } = useServices();
  const [isApproving, setIsApproving] = useState(false);
  const [isReEnriching, setIsReEnriching] = useState(false);
  const [isAecExpanded, setIsAecExpanded] = useState(false);
  const [aecXml, setAecXml] = useState<string | null>(null);
  const [isLoadingXml, setIsLoadingXml] = useState(false);

  const initialTab = searchParams.get('tab') === 'technical' ? 'technical' : 'spec';
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
    { id: 'visual-qa', label: 'Visual QA Expectations', short: 'Visual QA' },
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
  const isWaitingForApproval = ticket.status === 'waiting-for-approval';

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      // Re-enrich first (re-bake spec + AEC with developer context), then approve
      const reEnrichSuccess = await reEnrichTicket(ticketId);
      if (!reEnrichSuccess) {
        toast.error('Failed to re-bake the ticket. Please try again.');
        setIsApproving(false);
        return;
      }

      const success = await approveTicket(ticketId);
      if (success) {
        await fetchTicket(ticketId);
        toast.success('AEC forged — ticket is ready for execution');
      } else {
        toast.error('Failed to approve ticket. Please try again.');
      }
    } finally {
      setIsApproving(false);
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
          onAssignTicket={onAssignTicket}
          qualityScore={qualityScore}
          onTransition={onStatusTransition}
          assignDialogOpen={assignDialogOpen}
          onAssignDialogOpenChange={onAssignDialogOpenChange}
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

              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg space-y-3">
                <p className="text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span><strong>Answer these questions</strong> to generate the technical specification</span>
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  The system will guide you through each question one by one, and then automatically create the full technical specification based on your answers.
                </p>
                <Link href={`/tickets/create?resume=${ticketId}`}>
                  <Button className="w-full mt-3 bg-amber-600 hover:bg-amber-700 text-white">
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
          >
            <ReviewSessionSection
              qaItems={ticket.reviewSession!.qaItems}
              submittedAt={ticket.reviewSession!.submittedAt}
            />
            {/* Approve & Forge — single action: re-bake with dev context + approve */}
            {isWaitingForApproval && (
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <p className="text-xs text-[var(--text-tertiary)] mb-3">
                  Approving will re-bake the ticket with the developer&apos;s insights and forge the final AEC.
                </p>
                <Button
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {isApproving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 mr-2" />
                  )}
                  {isApproving ? 'Forging AEC...' : 'Approve & Forge AEC'}
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
        onAssignTicket={onAssignTicket}
        qualityScore={qualityScore}
        onTransition={onStatusTransition}
        assignDialogOpen={assignDialogOpen}
        onAssignDialogOpenChange={onAssignDialogOpenChange}
      />

      {/* AEC Crown Card — the first-class artifact */}
      {(() => {
        const techSpec = ticket.techSpec;
        const acCount = techSpec?.acceptanceCriteria?.length || 0;
        const apiCount = techSpec?.apiChanges?.endpoints?.length || 0;
        const fileCount = techSpec?.fileChanges?.length || 0;
        const testCount = (techSpec?.testPlan?.unitTests?.length || 0) +
          (techSpec?.testPlan?.integrationTests?.length || 0) +
          (techSpec?.testPlan?.edgeCases?.length || 0);
        const hasScope = (techSpec?.inScope?.length > 0 || techSpec?.outOfScope?.length > 0);
        const isForged = ticket.status === 'ready' || ticket.status === 'done';

        return (
          <div className={`relative rounded-xl border-2 ${isForged ? 'border-amber-500/60' : 'border-amber-500/25'} bg-gradient-to-r ${isForged ? 'from-amber-500/[0.06] via-transparent to-amber-500/[0.06]' : 'from-amber-500/[0.03] via-transparent to-amber-500/[0.03]'} overflow-hidden`}>
            {/* Header */}
            <div className="px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isForged ? 'bg-amber-500/20' : 'bg-amber-500/10'}`}>
                  <ShieldCheck className={`w-4.5 h-4.5 ${isForged ? 'text-amber-400' : 'text-amber-500/60'}`} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${isForged ? 'text-amber-400' : 'text-amber-500/70'}`}>
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
                  className={`flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                    isForged
                      ? 'border-amber-500/20 text-amber-400 hover:bg-amber-500/10'
                      : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
                  }`}
                >
                  {isLoadingXml ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isAecExpanded ? (
                    <>Hide <ChevronUp className="w-3.5 h-3.5" /></>
                  ) : (
                    <>Show <ChevronDown className="w-3.5 h-3.5" /></>
                  )}
                </button>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                  isForged
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-tertiary)] border-[var(--border-subtle)]'
                }`}>
                  {isForged ? 'FORGED' : 'DRAFT'}
                </span>
              </div>
            </div>

            {/* Stats row */}
            <div className="px-5 pb-4 flex flex-wrap gap-x-5 gap-y-2">
              {acCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-purple-400/70" />
                  <span className="text-[11px] text-[var(--text-secondary)]">{acCount} acceptance criteria</span>
                </div>
              )}
              {apiCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <GitPullRequest className="w-3.5 h-3.5 text-blue-400/70" />
                  <span className="text-[11px] text-[var(--text-secondary)]">{apiCount} API endpoints</span>
                </div>
              )}
              {fileCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <FileCode2 className="w-3.5 h-3.5 text-green-400/70" />
                  <span className="text-[11px] text-[var(--text-secondary)]">{fileCount} files affected</span>
                </div>
              )}
              {testCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <TestTube className="w-3.5 h-3.5 text-amber-400/70" />
                  <span className="text-[11px] text-[var(--text-secondary)]">{testCount} tests</span>
                </div>
              )}
              {hasScope && (
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400/70" />
                  <span className="text-[11px] text-[var(--text-secondary)]">Scope defined</span>
                </div>
              )}
            </div>

            {/* Expanded AEC XML Viewer */}
            {isAecExpanded && aecXml && (
              <div className="border-t border-amber-500/15">
                <div className="relative">
                  <pre className="px-5 py-4 overflow-x-auto text-[12px] leading-relaxed font-mono max-h-[500px] overflow-y-auto scrollbar-thin">
                    {aecXml.split('\n').map((line, i) => {
                      // Syntax highlight XML
                      const highlighted = line
                        // Processing instructions
                        .replace(/(<\?.*?\?>)/g, '<span class="text-[#71717a]">$1</span>')
                        // Comments
                        .replace(/(<!--.*?-->)/g, '<span class="text-[#525252]">$1</span>')
                        // CDATA
                        .replace(/(<!\[CDATA\[)(.*?)(\]\]>)/g, '<span class="text-[#71717a]">$1</span><span class="text-amber-300/80">$2</span><span class="text-[#71717a]">$3</span>')
                        // Closing tags
                        .replace(/(<\/)([\w-]+)(>)/g, '<span class="text-[#525252]">$1</span><span class="text-blue-400/80">$2</span><span class="text-[#525252]">$3</span>')
                        // Opening tags with attributes
                        .replace(/(<)([\w-]+)((?:\s+[\w-]+="[^"]*")*)(\/?>)/g, (_m, lt, tag, attrs, gt) => {
                          const highlightedAttrs = attrs.replace(/([\w-]+)=("(?:[^"])*")/g, '<span class="text-purple-400/70">$1</span>=<span class="text-green-400/70">$2</span>');
                          return `<span class="text-[#525252]">${lt}</span><span class="text-blue-400/80">${tag}</span>${highlightedAttrs}<span class="text-[#525252]">${gt}</span>`;
                        })
                        // Text content between tags (already handled by above, just color remaining text)
                        ;

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

      {/* Review Session Q&A (Story 6-12 / 7-6) — shown above tabs when present */}
      {hasReviewSession && (
        <CollapsibleSection
          id="review-session"
          title="Developer Review Q&A"
          badge={`${ticket.reviewSession!.qaItems.length} answer${ticket.reviewSession!.qaItems.length !== 1 ? 's' : ''}`}
          defaultExpanded={true}
        >
          <ReviewSessionSection
            qaItems={ticket.reviewSession!.qaItems}
            submittedAt={ticket.reviewSession!.submittedAt}
          />
          {/* Approve & Forge — single action: re-bake with dev context + approve */}
          {isWaitingForApproval && (
            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--text-tertiary)] mb-3">
                Approving will re-bake the ticket with the developer&apos;s insights and forge the final AEC.
              </p>
              <Button
                onClick={handleApprove}
                disabled={isApproving}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isApproving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4 mr-2" />
                )}
                {isApproving ? 'Forging AEC...' : 'Approve & Forge AEC'}
              </Button>
            </div>
          )}
        </CollapsibleSection>
      )}

      {/* Tabbed content */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full grid grid-cols-3 bg-transparent h-auto p-0 border-b border-gray-200 dark:border-gray-800">
          <TabsTrigger
            value="spec"
            className="text-sm font-medium text-gray-600 dark:text-gray-400 border-b-2 border-transparent data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-50 data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 transition-all rounded-none"
          >
            Spec
          </TabsTrigger>
          <TabsTrigger
            value="design"
            className="text-sm font-medium text-gray-600 dark:text-gray-400 border-b-2 border-transparent data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-50 data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 transition-all rounded-none"
          >
            Design
          </TabsTrigger>
          <TabsTrigger
            value="technical"
            className="text-sm font-medium text-gray-600 dark:text-gray-400 border-b-2 border-transparent data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-50 data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 transition-all rounded-none"
          >
            Technical
          </TabsTrigger>
        </TabsList>

        <TabsContent value="spec" className="mt-6">
          {/* Mobile section pills — shown below xl only */}
          <div className="xl:hidden flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-hide">
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

          <div className="max-w-3xl mx-auto">
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
          <div className="hidden xl:block fixed left-[calc(var(--nav-width)+1rem)] top-32 w-[88px] z-10">
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

        <TabsContent value="design" className="mt-6">
          <div className="max-w-3xl mx-auto">
            {onAddDesignReference && onRemoveDesignReference ? (
              <DesignTab
                ticketId={ticketId}
                references={ticket.designReferences || []}
                onAddDesignReference={onAddDesignReference}
                onRemoveDesignReference={onRemoveDesignReference}
                onRefreshDesignReference={onRefreshDesignReference}
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

        <TabsContent value="technical" className="mt-6">
          {/* Mobile section pills — shown below xl only */}
          <div className="xl:hidden flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-hide">
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

          <div className="max-w-3xl mx-auto">
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
          <div className="hidden xl:block fixed left-[calc(var(--nav-width)+1rem)] top-32 w-[88px] z-10">
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
      </Tabs>
    </div>
  );
}
