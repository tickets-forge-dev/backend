'use client';

import { Badge } from '@/core/components/ui/badge';
import { FileCode, FilePlus, FileX } from 'lucide-react';
import { CollapsibleSection } from '@/src/tickets/components/CollapsibleSection';
import { EditableItem } from '@/src/tickets/components/EditableItem';
import { ApiReviewSection } from '@/src/tickets/components/ApiReviewSection';
import { BackendClientChanges } from '@/src/tickets/components/BackendClientChanges';
import { TestPlanSection } from '@/src/tickets/components/TestPlanSection';
import { ValidationResults } from '@/src/tickets/components/ValidationResults';
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

  return (
    <div className="space-y-8">
      {/* File Changes */}
      {techSpec?.fileChanges?.length > 0 && (
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
      )}

      {/* API Endpoints */}
      {techSpec && (
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
      )}

      {/* Backend / Frontend Changes (Layered) */}
      {techSpec?.layeredFileChanges && (
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
