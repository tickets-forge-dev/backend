'use client';

import { Clock, FlaskConical } from 'lucide-react';
import { CollapsibleSection } from '@/src/tickets/components/CollapsibleSection';
import { ApiReviewSection } from '@/src/tickets/components/ApiReviewSection';
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
  const apiCount = techSpec?.apiChanges?.endpoints?.length || 0;

  // Count tests
  const testCount = techSpec?.testPlan
    ? (techSpec.testPlan.unitTests?.length || 0) +
      (techSpec.testPlan.integrationTests?.length || 0) +
      (techSpec.testPlan.edgeCases?.length || 0)
    : 0;

  return (
    <div className="divide-y divide-[var(--border-subtle)] [&>*]:py-3 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">

      {/* API Endpoints — always visible when tech spec exists */}
      {techSpec && (
        <div id="technical-api-endpoints">
          <CollapsibleSection
            id="api-endpoints"
            title="API Endpoints"
            badge={
              (techSpec.apiChanges?.endpoints || []).length > 0
                ? `${(techSpec.apiChanges?.endpoints || []).length}`
                : ticket.apiSpecDeferred ? 'Deferred' : undefined
            }
            defaultExpanded={false}
          >
            {(techSpec.apiChanges?.endpoints || []).length > 0 ? (
              <ApiReviewSection
                endpoints={techSpec.apiChanges?.endpoints || []}
                onEdit={(idx) => onEditItem('apiEndpoints', idx)}
                onDelete={(idx) => onDeleteItem('apiEndpoints', idx)}
                onAdd={onAddApiEndpoint}
                onScanApis={onScanApis}
                isScanning={isScanningApis}
              />
            ) : (
              <div className="space-y-3">
                <p className="text-[12px] text-[var(--text-tertiary)]">
                  {ticket.apiSpecDeferred
                    ? 'API spec deferred to developer. Scan or add endpoints manually.'
                    : 'No API endpoints detected. Add them manually or scan the codebase.'}
                </p>
                <div className="flex gap-2">
                  {ticket.repositoryContext && (
                    <button
                      onClick={onScanApis}
                      disabled={isScanningApis}
                      className="px-3 py-1.5 text-[11px] font-medium rounded-md border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] disabled:opacity-50 transition-colors"
                    >
                      {isScanningApis ? 'Scanning...' : 'Scan APIs'}
                    </button>
                  )}
                  <button
                    onClick={onAddApiEndpoint}
                    className="px-3 py-1.5 text-[11px] font-medium rounded-md border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    + Add Manually
                  </button>
                </div>
              </div>
            )}
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
