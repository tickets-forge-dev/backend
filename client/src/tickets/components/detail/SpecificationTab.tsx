'use client';

import { CollapsibleSection } from '@/src/tickets/components/CollapsibleSection';
import { EditableItem } from '@/src/tickets/components/EditableItem';
import { InlineEditableList } from '@/src/tickets/components/InlineEditableList';
import { VisualExpectationsSection } from '@/src/tickets/components/VisualExpectationsSection';
import { ReproductionStepsSection } from './ReproductionStepsSection';
import { normalizeProblemStatement } from '@/tickets/utils/normalize-problem-statement';
import type { AECResponse } from '@/services/ticket.service';

interface SpecificationTabProps {
  ticket: AECResponse;
  onEditItem: (section: string, index: number) => void;
  onDeleteItem: (section: string, index: number) => void;
  onSaveAcceptanceCriteria: (items: string[]) => Promise<void>;
  onSaveAssumptions: (items: string[]) => Promise<void>;
  onEditReproductionStep?: (index: number) => void;
  onDeleteReproductionStep?: (index: number) => void;
  onAddReproductionStep?: () => void;
}

export function SpecificationTab({
  ticket,
  onEditItem,
  onDeleteItem,
  onSaveAcceptanceCriteria,
  onSaveAssumptions,
  onEditReproductionStep,
  onDeleteReproductionStep,
  onAddReproductionStep,
}: SpecificationTabProps) {
  const techSpec = ticket.techSpec;

  return (
    <div className="space-y-8">
      {/* Problem Statement — non-collapsible */}
      {techSpec?.problemStatement && (() => {
        const ps = normalizeProblemStatement(techSpec.problemStatement);
        return ps.narrative ? (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-[var(--text)] pl-3 border-l-2 border-[var(--primary)]/40">
              Problem Statement
            </h3>
            <div className="space-y-3">
              <p className="text-[var(--text-sm)] text-[var(--text-secondary)] leading-relaxed">
                {ps.narrative}
              </p>
              {ps.whyItMatters && (
                <div className="pt-2 border-t border-[var(--border)]">
                  <p className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase mb-1">
                    Why it matters
                  </p>
                  <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
                    {ps.whyItMatters}
                  </p>
                </div>
              )}
              {ps.assumptions.length > 0 && (
                <div className="pt-2 border-t border-[var(--border)]">
                  <p className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase mb-1">
                    Assumptions
                  </p>
                  <ul className="space-y-2 text-[var(--text-sm)] text-[var(--text-secondary)]">
                    {ps.assumptions.map((a: string, i: number) => (
                      <li key={i}>
                        <EditableItem onEdit={() => onEditItem('assumptions', i)} onDelete={() => onDeleteItem('assumptions', i)}>
                          <span className="text-[var(--text-tertiary)] mr-2">-</span>{a}
                        </EditableItem>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {ps.constraints.length > 0 && (
                <div className="pt-2 border-t border-[var(--border)]">
                  <p className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase mb-1">
                    Constraints
                  </p>
                  <ul className="space-y-2 text-[var(--text-sm)] text-[var(--text-secondary)]">
                    {ps.constraints.map((c: string, i: number) => (
                      <li key={i}>
                        <EditableItem onEdit={() => onEditItem('constraints', i)} onDelete={() => onDeleteItem('constraints', i)}>
                          <span className="text-[var(--text-tertiary)] mr-2">-</span>{c}
                        </EditableItem>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : null;
      })()}

      {/* Reproduction Steps — only for bug tickets */}
      {ticket.type === 'bug' && techSpec?.bugDetails && (
        <ReproductionStepsSection
          bugDetails={techSpec.bugDetails}
          onEdit={onEditReproductionStep || (() => {})}
          onDelete={onDeleteReproductionStep || (() => {})}
          onAdd={onAddReproductionStep || (() => {})}
          readOnly={false}
        />
      )}

      {/* Visual QA Expectations */}
      {techSpec?.visualExpectations && (
        <CollapsibleSection
          id="visual-qa"
          title="Visual QA Expectations"
          badge={`${techSpec.visualExpectations.expectations?.length || 0} screens`}
          defaultExpanded={true}
        >
          <VisualExpectationsSection
            summary={techSpec.visualExpectations.summary}
            expectations={techSpec.visualExpectations.expectations || []}
            flowDiagram={techSpec.visualExpectations.flowDiagram}
          />
        </CollapsibleSection>
      )}

      {/* Scope */}
      {(techSpec?.inScope?.length > 0 || techSpec?.outOfScope?.length > 0) && (
        <CollapsibleSection id="scope" title="Scope">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {techSpec.inScope?.length > 0 && (
              <div className="rounded-lg bg-[var(--bg-hover)] p-3 space-y-2">
                <h4 className="text-[var(--text-xs)] font-medium text-green-600 dark:text-green-400 uppercase">
                  In Scope
                </h4>
                <ul className="space-y-2 text-[var(--text-sm)] text-[var(--text-secondary)]">
                  {techSpec.inScope.map((item: string, idx: number) => (
                    <li key={idx}>
                      <EditableItem onEdit={() => onEditItem('inScope', idx)} onDelete={() => onDeleteItem('inScope', idx)}>
                        <span className="text-[var(--text-tertiary)] mr-2">-</span>{item}
                      </EditableItem>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {techSpec.outOfScope?.length > 0 && (
              <div className="rounded-lg bg-[var(--bg-hover)] p-3 space-y-2">
                <h4 className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                  Out of Scope
                </h4>
                <ul className="space-y-2 text-[var(--text-sm)] text-[var(--text-secondary)]">
                  {techSpec.outOfScope.map((item: string, idx: number) => (
                    <li key={idx}>
                      <EditableItem onEdit={() => onEditItem('outOfScope', idx)} onDelete={() => onDeleteItem('outOfScope', idx)}>
                        <span className="text-[var(--text-tertiary)] mr-2">-</span>{item}
                      </EditableItem>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Ticket Acceptance Criteria */}
      {ticket.acceptanceCriteria && ticket.acceptanceCriteria.length > 0 && (
        <CollapsibleSection title="Ticket Acceptance Criteria" id="ticket-acceptance" previewMode={true}>
          <InlineEditableList
            items={ticket.acceptanceCriteria}
            type="numbered"
            onSave={onSaveAcceptanceCriteria}
            emptyMessage="No acceptance criteria yet"
          />
        </CollapsibleSection>
      )}

      {/* Assumptions */}
      {ticket.assumptions && ticket.assumptions.length > 0 && (
        <CollapsibleSection title="Assumptions" id="assumptions" previewMode={true}>
          <InlineEditableList
            items={ticket.assumptions}
            type="bulleted"
            onSave={onSaveAssumptions}
            emptyMessage="No assumptions yet"
          />
        </CollapsibleSection>
      )}
    </div>
  );
}
