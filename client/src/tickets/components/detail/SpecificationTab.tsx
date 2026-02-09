'use client';

import { useState } from 'react';
import { Code } from 'lucide-react';
import { CollapsibleSection } from '@/src/tickets/components/CollapsibleSection';
import { EditableItem } from '@/src/tickets/components/EditableItem';
import { InlineEditableList } from '@/src/tickets/components/InlineEditableList';
import { VisualExpectationsSection } from '@/src/tickets/components/VisualExpectationsSection';
import { normalizeProblemStatement } from '@/tickets/utils/normalize-problem-statement';
import type { AECResponse } from '@/services/ticket.service';

interface SpecificationTabProps {
  ticket: AECResponse;
  onEditItem: (section: string, index: number) => void;
  onDeleteItem: (section: string, index: number) => void;
  onSaveAcceptanceCriteria: (items: string[]) => Promise<void>;
  onSaveAssumptions: (items: string[]) => Promise<void>;
}

export function SpecificationTab({
  ticket,
  onEditItem,
  onDeleteItem,
  onSaveAcceptanceCriteria,
  onSaveAssumptions,
}: SpecificationTabProps) {
  const techSpec = ticket.techSpec;
  const [showFilePaths, setShowFilePaths] = useState(false);

  // Check if any solution steps have file references
  const solutionSteps = techSpec?.solution?.steps || (Array.isArray(techSpec?.solution) ? techSpec.solution : []);
  const hasFilePaths = solutionSteps.some((s: any) => typeof s !== 'string' && s.file);

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
        <CollapsibleSection title="Ticket Acceptance Criteria" id="ticket-acceptance">
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
        <CollapsibleSection title="Assumptions" id="assumptions">
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
