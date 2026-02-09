'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/core/components/ui/tabs';
import { CollapsibleSection } from '@/src/tickets/components/CollapsibleSection';
import { QuestionRoundsSection } from '@/src/tickets/components/QuestionRoundsSection';
import { ImageAttachmentsGrid } from '@/src/tickets/components/ImageAttachmentsGrid';
import { OverviewCard } from './OverviewCard';
import { SpecificationTab } from './SpecificationTab';
import { ImplementationTab } from './ImplementationTab';
import { Loader2, CheckCircle, ChevronDown, AlertTriangle } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import type { AECResponse, AttachmentResponse } from '@/services/ticket.service';
import type { RoundAnswers } from '@/types/question-refinement';
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
  // API
  onAddApiEndpoint: () => void;
  onSaveApiEndpoints: (endpoints: ApiEndpointSpec[]) => Promise<void>;
  onScanApis: () => Promise<void>;
  isScanningApis: boolean;
  // Attachments
  onUploadAttachment: (file: File, onProgress?: (percent: number) => void) => Promise<boolean>;
  onDeleteAttachment: (attachmentId: string) => Promise<boolean>;
  isUploadingAttachment: boolean;
  // Tech spec patch
  saveTechSpecPatch: (patch: Record<string, any>) => Promise<boolean | undefined>;
  fetchTicket: (id: string) => Promise<void>;
  // Question refinement
  isStartingRound: boolean;
  questionsExpanded: boolean;
  onToggleQuestions: () => void;
  onSubmitRoundAnswers: (roundNumber: number, answers: RoundAnswers) => Promise<void>;
  onSkipToFinalize: () => Promise<void>;
  onFinalizeSpec: () => Promise<void>;
  isSubmittingAnswers: boolean;
  answerSubmitError: string | null;
  onDismissError: () => void;
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
  onAddApiEndpoint,
  onSaveApiEndpoints,
  onScanApis,
  isScanningApis,
  onUploadAttachment,
  onDeleteAttachment,
  isUploadingAttachment,
  saveTechSpecPatch,
  fetchTicket,
  isStartingRound,
  questionsExpanded,
  onToggleQuestions,
  onSubmitRoundAnswers,
  onSkipToFinalize,
  onFinalizeSpec,
  isSubmittingAnswers,
  answerSubmitError,
  onDismissError,
}: TicketDetailLayoutProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasTechSpec = !!ticket.techSpec;

  const initialTab = searchParams.get('tab') === 'implementation' ? 'implementation' : 'specification';
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const url = new URL(window.location.href);
    if (value === 'specification') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', value);
    }
    window.history.replaceState({}, '', url.toString());
  };

  // Pre-tech-spec state: show simple layout with questions + attachments
  if (!hasTechSpec) {
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
              <Button variant="ghost" size="sm" onClick={onDismissError} className="text-[var(--red)]">
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Special case: maxRounds=0 (no questions needed) */}
        {!isStartingRound && ticket.maxRounds === 0 && (
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

        {/* Loading state while generating questions */}
        {isStartingRound && (
          <div className="rounded-lg bg-[var(--bg-subtle)] p-8">
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--text-tertiary)]" />
              <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
                Generating questions...
              </p>
            </div>
          </div>
        )}

        {/* Question Refinement */}
        {!isStartingRound &&
         (ticket.currentRound ?? 0) > 0 &&
         ticket.questionRounds &&
         ticket.questionRounds.length > 0 && (
          <div className="rounded-lg bg-[var(--bg-subtle)] p-4">
            <button
              onClick={onToggleQuestions}
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
                  questionRounds={ticket.questionRounds}
                  currentRound={ticket.currentRound!}
                  maxRounds={ticket.maxRounds ?? 3}
                  onSubmitAnswers={onSubmitRoundAnswers}
                  onSkipToFinalize={onSkipToFinalize}
                  onFinalizeSpec={onFinalizeSpec}
                  isSubmitting={isSubmittingAnswers}
                  error={answerSubmitError}
                  onDismissError={onDismissError}
                  useModalUI={true}
                />
              </div>
            )}
          </div>
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
        <TabsList className="w-full grid grid-cols-2 bg-[var(--bg-subtle)] h-12 rounded-lg p-1">
          <TabsTrigger
            value="specification"
            className="text-sm font-medium data-[state=active]:bg-[var(--primary)] data-[state=active]:text-white data-[state=active]:shadow-md text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors rounded-md"
          >
            Specification
          </TabsTrigger>
          <TabsTrigger
            value="implementation"
            className="text-sm font-medium data-[state=active]:bg-[var(--primary)] data-[state=active]:text-white data-[state=active]:shadow-md text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors rounded-md"
          >
            Implementation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="specification" className="mt-6">
          <SpecificationTab
            ticket={ticket}
            onEditItem={onEditItem}
            onDeleteItem={onDeleteItem}
            onSaveAcceptanceCriteria={onSaveAcceptanceCriteria}
            onSaveAssumptions={onSaveAssumptions}
          />
        </TabsContent>

        <TabsContent value="implementation" className="mt-6">
          <ImplementationTab
            ticket={ticket}
            ticketId={ticketId}
            onEditItem={onEditItem}
            onDeleteItem={onDeleteItem}
            onAddApiEndpoint={onAddApiEndpoint}
            onSaveApiEndpoints={onSaveApiEndpoints}
            onScanApis={onScanApis}
            isScanningApis={isScanningApis}
            onUploadAttachment={onUploadAttachment}
            onDeleteAttachment={onDeleteAttachment}
            isUploadingAttachment={isUploadingAttachment}
            saveTechSpecPatch={saveTechSpecPatch}
            fetchTicket={fetchTicket}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
