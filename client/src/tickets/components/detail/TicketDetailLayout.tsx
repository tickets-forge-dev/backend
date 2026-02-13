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
import { HelpCircle, MessageSquare } from 'lucide-react';
import type { AECResponse, AttachmentResponse } from '@/services/ticket.service';
import type { ApiEndpointSpec } from '@/types/question-refinement';

interface TicketDetailLayoutProps {
  ticket: AECResponse;
  ticketId: string;
  // Description / Notes
  descriptionDraft: string;
  onDescriptionChange: (value: string) => void;
  onDescriptionSave: () => void;
  isSavingDescription: boolean;
  isDescriptionDirty: boolean;
  onDescriptionExpand: () => void;
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
  // Tech spec patch
  saveTechSpecPatch: (patch: Record<string, any>) => Promise<boolean | undefined>;
  fetchTicket: (id: string) => Promise<void>;
}

export function TicketDetailLayout({
  ticket,
  ticketId,
  descriptionDraft,
  onDescriptionChange,
  onDescriptionSave,
  isSavingDescription,
  isDescriptionDirty,
  onDescriptionExpand,
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
  saveTechSpecPatch,
  fetchTicket,
}: TicketDetailLayoutProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasTechSpec = !!ticket.techSpec;

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

  // Track scroll position for scroll spy
  useEffect(() => {
    const handleScroll = () => {
      const currentTab = activeTab === 'spec' ? 'spec' : 'technical';
      const sections = activeTab === 'spec'
        ? ['reproduction-steps', 'problem-statement', 'acceptance-criteria', 'visual-qa', 'scope', 'solution', 'assets']
        : ['file-changes', 'api-endpoints', 'test-plan', 'stack'];

      for (const sectionId of sections) {
        const element = document.getElementById(`${currentTab}-${sectionId}`);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100) {
            setActiveSection(`${currentTab}-${sectionId}`);
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab]);

  // Pre-tech-spec state: show simple layout with questions + attachments
  if (!hasTechSpec) {
    const hasQuestions = ticket.questions && ticket.questions.length > 0;

    return (
      <div className="space-y-6">
        {/* Overview Card (notes only, no metrics) */}
        <OverviewCard
          ticket={ticket}
          descriptionDraft={descriptionDraft}
          onDescriptionChange={onDescriptionChange}
          onDescriptionSave={onDescriptionSave}
          isSavingDescription={isSavingDescription}
          isDescriptionDirty={isDescriptionDirty}
          onDescriptionExpand={onDescriptionExpand}
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
      {/* Overview Card */}
      <OverviewCard
        ticket={ticket}
        descriptionDraft={descriptionDraft}
        onDescriptionChange={onDescriptionChange}
        onDescriptionSave={onDescriptionSave}
        isSavingDescription={isSavingDescription}
        isDescriptionDirty={isDescriptionDirty}
        onDescriptionExpand={onDescriptionExpand}
      />

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
          <div className="flex gap-6">
            {/* Scroll spy navigator */}
            <div className="hidden lg:block w-48 flex-shrink-0">
              <nav className="sticky top-6 space-y-2">
                {[
                  { id: 'reproduction-steps', label: 'Reproduction Steps', bugOnly: true },
                  { id: 'problem-statement', label: 'Problem Statement' },
                  { id: 'acceptance-criteria', label: 'Acceptance Criteria' },
                  { id: 'visual-qa', label: 'Visual QA Expectations' },
                  { id: 'scope', label: 'Scope' },
                  { id: 'solution', label: 'Solution' },
                  { id: 'assets', label: 'Assets' },
                ]
                .filter(section => !section.bugOnly || ticket.type === 'bug')
                .map((section) => (
                  <button
                    key={section.id}
                    onClick={() => {
                      const element = document.getElementById(`spec-${section.id}`);
                      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className={`block text-sm py-1.5 px-3 rounded transition-colors ${
                      activeSection === `spec-${section.id}`
                        ? 'bg-[var(--bg-hover)] text-[var(--primary)] font-medium'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                    }`}
                  >
                    {section.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
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
          </div>
        </TabsContent>

        <TabsContent value="design" className="mt-6">
          {onAddDesignReference && onRemoveDesignReference ? (
            <DesignTab
              ticketId={ticketId}
              references={ticket.designReferences || []}
              onAddDesignReference={onAddDesignReference}
              onRemoveDesignReference={onRemoveDesignReference}
            />
          ) : (
            <div className="max-w-4xl">
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
        </TabsContent>

        <TabsContent value="technical" className="mt-6">
          <div className="flex gap-6">
            {/* Scroll spy navigator */}
            <div className="hidden lg:block w-48 flex-shrink-0">
              <nav className="sticky top-6 space-y-2">
                {[
                  { id: 'file-changes', label: 'File Changes' },
                  { id: 'api-endpoints', label: 'API Endpoints' },
                  { id: 'test-plan', label: 'Test Plan' },
                  { id: 'stack', label: 'Stack' },
                ].map((section) => (
                  <button
                    key={section.id}
                    onClick={() => {
                      const element = document.getElementById(`technical-${section.id}`);
                      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className={`block text-sm py-1.5 px-3 rounded transition-colors ${
                      activeSection === `technical-${section.id}`
                        ? 'bg-[var(--bg-hover)] text-[var(--primary)] font-medium'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                    }`}
                  >
                    {section.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
