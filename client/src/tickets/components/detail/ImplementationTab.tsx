'use client';

import { Badge } from '@/core/components/ui/badge';
import { FileCode, FilePlus, FileX, Clock, FlaskConical } from 'lucide-react';
import { CollapsibleSection } from '@/src/tickets/components/CollapsibleSection';
import { EditableItem } from '@/src/tickets/components/EditableItem';
import { ApiReviewSection } from '@/src/tickets/components/ApiReviewSection';
import { BackendClientChanges } from '@/src/tickets/components/BackendClientChanges';
import { TestPlanSection } from '@/src/tickets/components/TestPlanSection';
import { ValidationResults } from '@/src/tickets/components/ValidationResults';
import { DependenciesSection } from '@/src/tickets/components/DependenciesSection';
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
  saveTechSpecPatch,
  fetchTicket,
}: ImplementationTabProps) {
  const techSpec = ticket.techSpec;

  // Estimate string
  const estimate = ticket.estimate;
  const estimateLabel = estimate
    ? `${estimate.min}-${estimate.max}h, ${estimate.confidence}`
    : 'N/A';

  // Count file changes and API endpoints
  const fileCount = techSpec?.fileChanges?.length || 0;
  const apiCount = techSpec?.apiChanges?.endpoints?.length || 0;

  // Count tests
  const testCount = techSpec?.testPlan
    ? (techSpec.testPlan.unitTests?.length || 0) +
      (techSpec.testPlan.integrationTests?.length || 0) +
      (techSpec.testPlan.edgeCases?.length || 0)
    : 0;

  return (
    <div className="divide-y divide-[var(--border-subtle)] [&>*]:py-3 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">

      {/* File Changes */}
      {techSpec?.fileChanges?.length > 0 ? (
        <div id="technical-file-changes">
          <CollapsibleSection
            id="file-changes"
            title="File Changes"
            badge={`${techSpec.fileChanges.length}`}
            defaultExpanded={false}
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
        </div>
      ) : !ticket.repositoryContext && (
        <div id="technical-file-changes">
          <CollapsibleSection
            id="file-changes"
            title="File Changes"
            defaultExpanded={false}
          >
            <p className="text-sm text-[var(--text-secondary)]">
              No repository provided — developer should identify files to modify
            </p>
          </CollapsibleSection>
        </div>
      )}

      {/* API Endpoints */}
      {techSpec && (techSpec.apiChanges?.endpoints || []).length > 0 ? (
        <div id="technical-api-endpoints">
          <CollapsibleSection
            id="api-endpoints"
            title="API Endpoints"
            badge={`${(techSpec.apiChanges?.endpoints || []).length}`}
            defaultExpanded={false}
          >
            <ApiReviewSection
              endpoints={techSpec.apiChanges?.endpoints || []}
              onEdit={(idx) => onEditItem('apiEndpoints', idx)}
              onDelete={(idx) => onDeleteItem('apiEndpoints', idx)}
              onAdd={onAddApiEndpoint}
              onScanApis={onScanApis}
              isScanning={isScanningApis}
            />
          </CollapsibleSection>
        </div>
      ) : ticket.apiSpecDeferred ? (
        <div id="technical-api-endpoints">
          <CollapsibleSection
            id="api-endpoints"
            title="API Endpoints"
            badge="Deferred"
            defaultExpanded={false}
          >
            <div className="rounded-lg border border-blue-500/20 bg-blue-50/30 dark:bg-blue-950/10 p-4 space-y-2">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                API spec deferred to developer
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                The ticket creator chose to let the developer decide which API endpoints are needed.
                Use the &quot;Scan APIs&quot; button below to auto-detect endpoints from the codebase, or add them manually.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={onScanApis}
                  disabled={isScanningApis}
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isScanningApis ? 'Scanning...' : 'Scan APIs'}
                </button>
                <button
                  onClick={onAddApiEndpoint}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  + Add Manually
                </button>
              </div>
            </div>
          </CollapsibleSection>
        </div>
      ) : !ticket.repositoryContext && techSpec && (
        <div id="technical-api-endpoints">
          <CollapsibleSection
            id="api-endpoints"
            title="API Endpoints"
            defaultExpanded={false}
          >
            <p className="text-sm text-[var(--text-secondary)]">
              No repository provided — developer should identify API changes
            </p>
          </CollapsibleSection>
        </div>
      )}

      {/* Dependencies & Packages */}
      <div id="technical-dependencies">
        <CollapsibleSection
          id="dependencies"
          title="Dependencies & Packages"
          badge={techSpec?.dependencies?.length ? `${techSpec.dependencies.length} new` : undefined}
          defaultExpanded={false}
        >
          <DependenciesSection
            dependencies={techSpec?.dependencies || []}
            onRemove={(index) => {
              const updated = [...(techSpec?.dependencies || [])];
              updated.splice(index, 1);
              saveTechSpecPatch({ dependencies: updated });
            }}
            onAdd={(dep) => {
              const updated = [...(techSpec?.dependencies || []), dep];
              saveTechSpecPatch({ dependencies: updated });
            }}
          />
        </CollapsibleSection>
      </div>

      {/* Backend / Frontend Changes (Layered) */}
      {techSpec?.layeredFileChanges ? (
        <div id="technical-layered-changes">
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
        </div>
      ) : !ticket.repositoryContext && techSpec && (
        <div id="technical-layered-changes">
          <CollapsibleSection id="layered-changes" title="Backend / Frontend Changes">
            <p className="text-sm text-[var(--text-secondary)]">
              No repository provided
            </p>
          </CollapsibleSection>
        </div>
      )}

      {/* Test Plan */}
      {techSpec?.testPlan && (
        <div id="technical-test-plan">
          <CollapsibleSection
            id="test-plan"
            title="Test Plan"
            badge={`${(techSpec.testPlan.unitTests?.length || 0) + (techSpec.testPlan.integrationTests?.length || 0) + (techSpec.testPlan.edgeCases?.length || 0)} tests`}
            defaultExpanded={false}
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
        </div>
      )}


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
