'use client';

import { useState } from 'react';
import { CollapsibleSection } from '@/src/tickets/components/CollapsibleSection';
import { EditableItem } from '@/src/tickets/components/EditableItem';
import { InlineEditableList } from '@/src/tickets/components/InlineEditableList';
import { VisualExpectationsSection } from '@/src/tickets/components/VisualExpectationsSection';
import { ReproductionStepsSection } from './ReproductionStepsSection';
import { AssetsSection } from '@/src/tickets/components/AssetsSection';
import { normalizeProblemStatement } from '@/tickets/utils/normalize-problem-statement';
import type { AECResponse } from '@/services/ticket.service';

interface SpecificationTabProps {
  ticket: AECResponse;
  ticketId?: string;
  onEditItem: (section: string, index: number) => void;
  onDeleteItem: (section: string, index: number) => void;
  onSaveAcceptanceCriteria: (items: string[]) => Promise<void>;
  onSaveAssumptions: (items: string[]) => Promise<void>;
  onEditReproductionStep?: (index: number) => void;
  onDeleteReproductionStep?: (index: number) => void;
  onAddReproductionStep?: () => void;
  onUploadAttachment?: (file: File, onProgress?: (percent: number) => void) => Promise<boolean>;
  onDeleteAttachment?: (attachmentId: string) => Promise<boolean>;
  isUploadingAttachment?: boolean;
  saveTechSpecPatch?: (patch: Record<string, any>) => Promise<boolean | undefined>;
  fetchTicket?: (id: string) => Promise<void>;
}

export function SpecificationTab({
  ticket,
  ticketId,
  onEditItem,
  onDeleteItem,
  onSaveAcceptanceCriteria,
  onSaveAssumptions,
  onEditReproductionStep,
  onDeleteReproductionStep,
  onAddReproductionStep,
  onUploadAttachment,
  onDeleteAttachment,
  isUploadingAttachment,
  saveTechSpecPatch,
  fetchTicket,
}: SpecificationTabProps) {
  const techSpec = ticket.techSpec;
  const isBugTicket = ticket.type === 'bug';

  return (
    <div className="space-y-8">
      {/* 1. Reproduction Steps — FIRST for bug tickets */}
      {isBugTicket && techSpec?.bugDetails && (
        <div id="spec-reproduction-steps">
          <ReproductionStepsSection
            bugDetails={techSpec.bugDetails}
            onEdit={onEditReproductionStep || (() => {})}
            onDelete={onDeleteReproductionStep || (() => {})}
            onAdd={onAddReproductionStep || (() => {})}
            readOnly={false}
          />
        </div>
      )}

      {/* 2. Problem Statement — FIRST for features */}
      {techSpec?.problemStatement && (
        <div id="spec-problem-statement">
          {(() => {
            const ps = normalizeProblemStatement(techSpec.problemStatement);
            return ps.narrative ? (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-[var(--text)] pl-3 border-l-2 border-[var(--primary)]/40">
                  Problem Statement
                </h3>
                <div className="space-y-3">
                  <EditableItem onEdit={() => onEditItem('narrative', 0)} onDelete={() => {}}>
                    <p className="text-[var(--text-sm)] text-[var(--text-secondary)] leading-relaxed">
                      {ps.narrative}
                    </p>
                  </EditableItem>
                  {ps.whyItMatters && (
                    <div className="pt-2 border-t border-[var(--border)]">
                      <p className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase mb-1">
                        Why it matters
                      </p>
                      <EditableItem onEdit={() => onEditItem('whyItMatters', 0)} onDelete={() => {}}>
                        <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
                          {ps.whyItMatters}
                        </p>
                      </EditableItem>
                    </div>
                  )}
                </div>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* 3. Acceptance Criteria — SECOND */}
      {techSpec?.acceptanceCriteria?.length > 0 && (
        <div id="spec-acceptance-criteria">
          <CollapsibleSection
            id="acceptance-criteria"
            title="Acceptance Criteria"
            badge={`${techSpec.acceptanceCriteria.length}`}
            defaultExpanded={true}
          >
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
                      </div>
                    )}
                  </EditableItem>
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        </div>
      )}

      {/* 4. Visual QA Expectations */}
      {techSpec?.visualExpectations && (
        <div id="spec-visual-qa">
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
        </div>
      )}

      {/* 5. Scope */}
      {(techSpec?.inScope?.length > 0 || techSpec?.outOfScope?.length > 0) && (
        <div id="spec-scope">
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
        </div>
      )}

      {/* 6. Solution */}
      {techSpec?.solution && (
        <div id="spec-solution">
          <CollapsibleSection id="solution" title="Solution" defaultExpanded={true}>
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
                          <span className="pt-0.5">{typeof step === 'string' ? step : step.description || JSON.stringify(step)}</span>
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
                              <span className="pt-0.5">{step.description}</span>
                            </div>
                          </EditableItem>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              ) : null}
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* 7. Assets */}
      {ticketId && (
        <div id="spec-assets">
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
              onUploadAttachment={onUploadAttachment || (() => Promise.resolve(false))}
              onDeleteAttachment={onDeleteAttachment || (() => Promise.resolve(false))}
              isUploadingAttachment={isUploadingAttachment || false}
            />
          </CollapsibleSection>
        </div>
      )}
    </div>
  );
}
