'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/core/components/ui/tabs';
import { CollapsibleSection } from '@/src/tickets/components/CollapsibleSection';
import { ImageAttachmentsGrid } from '@/src/tickets/components/ImageAttachmentsGrid';
import { OverviewCard } from './OverviewCard';
import { SpecificationTab } from './SpecificationTab';
import { ImplementationTab } from './ImplementationTab';
import { Button } from '@/core/components/ui/button';
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
  saveTechSpecPatch,
  fetchTicket,
}: TicketDetailLayoutProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasTechSpec = !!ticket.techSpec;

  const initialTab = searchParams.get('tab') === 'specification' ? 'specification' : 'implementation';
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
        <TabsList className="w-full grid grid-cols-2 bg-transparent h-auto p-0 border-b border-gray-200 dark:border-gray-800">
          <TabsTrigger
            value="implementation"
            className="text-sm font-medium text-gray-600 dark:text-gray-400 border-b-2 border-transparent data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-50 data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 transition-all rounded-none"
          >
            Implementation
          </TabsTrigger>
          <TabsTrigger
            value="specification"
            className="text-sm font-medium text-gray-600 dark:text-gray-400 border-b-2 border-transparent data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-50 data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 transition-all rounded-none"
          >
            Specification
          </TabsTrigger>
        </TabsList>

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
            onEditReproductionStep={onEditReproductionStep}
            onDeleteReproductionStep={onDeleteReproductionStep}
            onAddReproductionStep={onAddReproductionStep}
          />
        </TabsContent>

        <TabsContent value="specification" className="mt-6">
          <SpecificationTab
            ticket={ticket}
            onEditItem={onEditItem}
            onDeleteItem={onDeleteItem}
            onSaveAcceptanceCriteria={onSaveAcceptanceCriteria}
            onSaveAssumptions={onSaveAssumptions}
            onEditReproductionStep={onEditReproductionStep}
            onDeleteReproductionStep={onDeleteReproductionStep}
            onAddReproductionStep={onAddReproductionStep}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
