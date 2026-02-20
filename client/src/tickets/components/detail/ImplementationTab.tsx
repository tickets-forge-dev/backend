'use client';

import { Badge } from '@/core/components/ui/badge';
import { FileCode, FilePlus, FileX, Layers, Clock, FlaskConical } from 'lucide-react';
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

  // Build tech stack string
  const stackParts: string[] = [];
  if (techSpec?.stack?.language) stackParts.push(techSpec.stack.language);
  if (techSpec?.stack?.framework) stackParts.push(techSpec.stack.framework);
  if (techSpec?.stack?.packageManager) stackParts.push(techSpec.stack.packageManager);
  const stackLabel = stackParts.join(' / ') || 'N/A';

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
    <div className="space-y-8">
      {/* Technical Summary */}
      {techSpec && (
        <div className="rounded-lg bg-[var(--bg-subtle)] p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Stack */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-[var(--text-tertiary)]" />
                <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase">Stack</span>
              </div>
              <p className="text-sm font-medium text-[var(--text)]">{stackLabel}</p>
            </div>

            {/* Estimate */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[var(--text-tertiary)]" />
                <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase">Estimate</span>
              </div>
              <p className="text-sm font-medium text-[var(--text)]">{estimateLabel}</p>
            </div>

            {/* Scope (Files + APIs) */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <FileCode className="h-4 w-4 text-[var(--text-tertiary)]" />
                <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase">Scope</span>
              </div>
              <p className="text-sm font-medium text-[var(--text)]">
                {fileCount} files{apiCount > 0 ? `, ${apiCount} APIs` : ''}
              </p>
            </div>

            {/* Tests */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <FlaskConical className="h-4 w-4 text-[var(--text-tertiary)]" />
                <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase">Tests</span>
              </div>
              <p className="text-sm font-medium text-[var(--text)]">{testCount} tests</p>
            </div>
          </div>
        </div>
      )}

      {/* File Changes */}
      {techSpec?.fileChanges?.length > 0 ? (
        <div id="technical-file-changes">
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
        </div>
      ) : !ticket.repositoryContext && (
        <div id="technical-file-changes">
          <CollapsibleSection
            id="file-changes"
            title="File Changes"
            defaultExpanded={true}
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
            defaultExpanded={true}
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
      ) : !ticket.repositoryContext && techSpec && (
        <div id="technical-api-endpoints">
          <CollapsibleSection
            id="api-endpoints"
            title="API Endpoints"
            defaultExpanded={true}
          >
            <p className="text-sm text-[var(--text-secondary)]">
              No repository provided — developer should identify API changes
            </p>
          </CollapsibleSection>
        </div>
      )}

      {/* Dependencies & Packages */}
      {techSpec?.dependencies && techSpec.dependencies.length > 0 && (
        <div id="technical-dependencies">
          <CollapsibleSection
            id="dependencies"
            title="Dependencies & Packages"
            badge={`${techSpec.dependencies.length} new`}
            defaultExpanded={true}
          >
            <DependenciesSection dependencies={techSpec.dependencies} />
          </CollapsibleSection>
        </div>
      )}

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
        </div>
      )}

      {/* Technology Stack */}
      {techSpec?.stack && (
        <div id="technical-stack">
          <CollapsibleSection id="stack" title="Technology Stack" defaultExpanded={true}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {techSpec.stack.language && (
                <div className="p-3 rounded-lg bg-[var(--bg-hover)]">
                  <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase mb-1">Language</p>
                  <p className="text-sm font-medium text-[var(--text)]">{techSpec.stack.language}</p>
                </div>
              )}
              {techSpec.stack.framework && (
                <div className="p-3 rounded-lg bg-[var(--bg-hover)]">
                  <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase mb-1">Framework</p>
                  <p className="text-sm font-medium text-[var(--text)]">{techSpec.stack.framework}</p>
                </div>
              )}
              {techSpec.stack.packageManager && (
                <div className="p-3 rounded-lg bg-[var(--bg-hover)]">
                  <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase mb-1">Package Manager</p>
                  <p className="text-sm font-medium text-[var(--text)]">{techSpec.stack.packageManager}</p>
                </div>
              )}
            </div>
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
