'use client';

import { useState } from 'react';
import { Badge } from '@/core/components/ui/badge';
import { FileCode, FilePlus, FileX, Code } from 'lucide-react';
import { CollapsibleSection } from '@/src/tickets/components/CollapsibleSection';
import { EditableItem } from '@/src/tickets/components/EditableItem';
import { ApiReviewSection } from '@/src/tickets/components/ApiReviewSection';
import { BackendClientChanges } from '@/src/tickets/components/BackendClientChanges';
import { TestPlanSection } from '@/src/tickets/components/TestPlanSection';
import { ValidationResults } from '@/src/tickets/components/ValidationResults';
import { AssetsSection } from '@/src/tickets/components/AssetsSection';
import type { AECResponse } from '@/services/ticket.service';
import type { ApiEndpointSpec } from '@/types/question-refinement';

interface ImplementationTabProps {
  ticket: AECResponse;
  ticketId: string;
  onEditItem: (section: string, index: number) => void;
  onDeleteItem: (section: string, index: number) => void;
  onAddApiEndpoint: () => void;
  onSaveApiEndpoints: (endpoints: ApiEndpointSpec[]) => Promise<void>;
  onScanApis: () => Promise<void>;
  isScanningApis: boolean;
  onUploadAttachment: (file: File, onProgress?: (percent: number) => void) => Promise<boolean>;
  onDeleteAttachment: (attachmentId: string) => Promise<boolean>;
  isUploadingAttachment: boolean;
  saveTechSpecPatch: (patch: Record<string, any>) => Promise<boolean | undefined>;
  fetchTicket: (id: string) => Promise<void>;
}

export function ImplementationTab({
  ticket,
  ticketId,
  onEditItem,
  onDeleteItem,
  onAddApiEndpoint,
  onSaveApiEndpoints,
  onScanApis,
  isScanningApis,
  onUploadAttachment,
  onDeleteAttachment,
  isUploadingAttachment,
  saveTechSpecPatch,
  fetchTicket,
}: ImplementationTabProps) {
  const techSpec = ticket.techSpec;
  const [showFilePaths, setShowFilePaths] = useState(false);

  // Check if any solution steps have file references
  const solutionSteps = techSpec?.solution?.steps || (Array.isArray(techSpec?.solution) ? techSpec.solution : []);
  const hasFilePaths = solutionSteps.some((s: any) => typeof s !== 'string' && s.file);

  return (
    <div className="space-y-8">
      {/* Acceptance Criteria — non-collapsible, BDD color-coded */}
      {techSpec?.acceptanceCriteria?.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-[var(--text)] pl-3 border-l-2 border-[var(--primary)]/40">
            Acceptance Criteria
          </h3>
          <ul className="space-y-3 text-[var(--text-sm)] text-[var(--text-secondary)]">
            {techSpec.acceptanceCriteria.map((ac: any, idx: number) => (
              <li key={idx}>
                <EditableItem onEdit={() => onEditItem('acceptanceCriteria', idx)} onDelete={() => onDeleteItem('acceptanceCriteria', idx)}>
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

      {/* File Changes */}
      {techSpec?.fileChanges?.length > 0 && (
        <CollapsibleSection
          id="file-changes"
          title="File Changes"
          badge={`${techSpec.fileChanges.length}`}
          defaultExpanded={true}
        >
          <ul className="space-y-2">
            {techSpec.fileChanges.map((fc: any, idx: number) => {
              const action = fc.action || fc.type || 'modify';
              const Icon = action === 'create' ? FilePlus
                : action === 'delete' ? FileX
                : FileCode;
              const colorClass = action === 'create' ? 'text-green-500'
                : action === 'delete' ? 'text-red-500'
                : 'text-amber-500';

              return (
                <li key={idx}>
                  <EditableItem onEdit={() => onEditItem('fileChanges', idx)} onDelete={() => onDeleteItem('fileChanges', idx)}>
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

      {/* API Endpoints */}
      {techSpec && (
        <CollapsibleSection
          id="api-endpoints"
          title="API Endpoints"
          badge={`${(techSpec.apiChanges?.endpoints || []).length}`}
          defaultExpanded={true}
        >
          <ApiReviewSection
            endpoints={techSpec.apiChanges?.endpoints || []}
            onEdit={(idx) => onEditItem('apiEndpoints', idx)}
            onDelete={(idx) => onDeleteItem('apiEndpoints', idx)}
            onAdd={onAddApiEndpoint}
            onSave={async (acceptedEndpoints) => {
              await saveTechSpecPatch({
                apiChanges: { ...techSpec.apiChanges, endpoints: acceptedEndpoints },
              });
              await fetchTicket(ticketId);
            }}
            onScanApis={onScanApis}
            isScanning={isScanningApis}
          />
        </CollapsibleSection>
      )}

      {/* Solution Steps — non-collapsible */}
      {techSpec?.solution && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[var(--text)] pl-3 border-l-2 border-[var(--primary)]/40">
              Solution
            </h3>
            {hasFilePaths && (
              <button
                onClick={() => setShowFilePaths(v => !v)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  showFilePaths
                    ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <Code className="h-3 w-3" />
                {showFilePaths ? 'Hide files' : 'Show files'}
              </button>
            )}
          </div>
          <div className="space-y-3">
            {typeof techSpec.solution === 'string' ? (
              <p className="text-[var(--text-sm)] text-[var(--text-secondary)] leading-relaxed">
                {techSpec.solution}
              </p>
            ) : Array.isArray(techSpec.solution) ? (
              <ol className="space-y-2 text-[var(--text-sm)] text-[var(--text-secondary)]">
                {techSpec.solution.map((step: string | any, idx: number) => (
                  <li key={idx}>
                    <EditableItem onEdit={() => onEditItem('steps', idx)} onDelete={() => onDeleteItem('steps', idx)}>
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
            ) : techSpec.solution.overview ? (
              <div className="space-y-3">
                <p className="text-[var(--text-sm)] text-[var(--text-secondary)] leading-relaxed">
                  {techSpec.solution.overview}
                </p>
                {techSpec.solution.steps?.length > 0 && (
                  <ol className="space-y-2 text-[var(--text-sm)] text-[var(--text-secondary)]">
                    {techSpec.solution.steps.map((step: any, idx: number) => (
                      <li key={idx}>
                        <EditableItem onEdit={() => onEditItem('steps', idx)} onDelete={() => onDeleteItem('steps', idx)}>
                          <div className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-medium text-[var(--text-tertiary)]">
                              {step.order || idx + 1}
                            </span>
                            <div className="pt-0.5">
                              <p>{step.description}</p>
                              {showFilePaths && step.file && (
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

      {/* Backend / Frontend Changes (Layered) */}
      {techSpec?.layeredFileChanges && (
        <CollapsibleSection id="layered-changes" title="Backend / Frontend Changes">
          <BackendClientChanges
            backendChanges={techSpec.layeredFileChanges.backend || []}
            frontendChanges={techSpec.layeredFileChanges.frontend || []}
            sharedChanges={techSpec.layeredFileChanges.shared || []}
            infrastructureChanges={techSpec.layeredFileChanges.infrastructure || []}
            documentationChanges={techSpec.layeredFileChanges.documentation || []}
            onEdit={(layer, idx) => onEditItem('fileChanges', idx)}
            onDelete={(layer, idx) => onDeleteItem('fileChanges', idx)}
          />
        </CollapsibleSection>
      )}

      {/* Test Plan */}
      {techSpec?.testPlan && (
        <CollapsibleSection
          id="test-plan"
          title="Test Plan"
          badge={`${(techSpec.testPlan.unitTests?.length || 0) + (techSpec.testPlan.integrationTests?.length || 0) + (techSpec.testPlan.edgeCases?.length || 0)} tests`}
          defaultExpanded={true}
        >
          <TestPlanSection
            summary={techSpec.testPlan.summary}
            unitTests={techSpec.testPlan.unitTests || []}
            integrationTests={techSpec.testPlan.integrationTests || []}
            edgeCases={techSpec.testPlan.edgeCases || []}
            testingNotes={techSpec.testPlan.testingNotes}
            coverageGoal={techSpec.testPlan.coverageGoal}
            onEdit={(idx) => onEditItem('testPlan', idx)}
            onDelete={(idx) => onDeleteItem('testPlan', idx)}
          />
        </CollapsibleSection>
      )}

      {/* Assets — Export documents + Attachments */}
      <CollapsibleSection
        id="assets"
        title="Assets"
        badge={ticket.attachments?.length ? `${ticket.attachments.length} files` : undefined}
        defaultExpanded={true}
      >
        <AssetsSection
          ticketId={ticketId}
          ticketTitle={ticket.title}
          ticketUpdatedAt={ticket.updatedAt}
          attachments={ticket.attachments}
          onUploadAttachment={onUploadAttachment}
          onDeleteAttachment={onDeleteAttachment}
          isUploadingAttachment={isUploadingAttachment}
        />
      </CollapsibleSection>

      {/* Affected Code */}
      {ticket.repoPaths && ticket.repoPaths.length > 0 && (
        <CollapsibleSection title="Affected Code" id="affected-code">
          <ul className="space-y-1 text-[var(--text-sm)] font-mono text-[var(--text-secondary)]">
            {ticket.repoPaths.map((path, index) => (
              <li key={index}>{path}</li>
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {/* Validation Results */}
      {ticket.validationResults && ticket.validationResults.length > 0 && (
        <CollapsibleSection title="Validation Results" id="validation-results">
          <ValidationResults
            validationResults={ticket.validationResults}
            overallScore={ticket.readinessScore}
          />
        </CollapsibleSection>
      )}
    </div>
  );
}
