'use client';

import { useState } from 'react';
import { TestTube, ChevronDown } from 'lucide-react';
import { Badge } from '@/core/components/ui/badge';
import { EditableItem } from './EditableItem';
import type { TestCaseSpec } from '@/types/question-refinement';

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  unit: { label: 'Unit', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  integration: { label: 'Integration', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  'e2e': { label: 'E2E', color: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  'edge-case': { label: 'Edge Case', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
};

interface TestGroupProps {
  title: string;
  tests: TestCaseSpec[];
  sectionKey: string;
  baseIndex: number;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

function TestGroup({ title, tests, sectionKey, baseIndex, onEdit, onDelete }: TestGroupProps) {
  const [expanded, setExpanded] = useState(true);

  if (tests.length === 0) return null;

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full mb-2"
      >
        <ChevronDown className={`h-3.5 w-3.5 text-[var(--text-tertiary)] transition-transform ${expanded ? 'rotate-180' : ''}`} />
        <h4 className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
          {title}
          <span className="ml-1.5 text-[var(--text-tertiary)]/60 normal-case font-normal">
            ({tests.length})
          </span>
        </h4>
      </button>
      {expanded && (
        <ul className="space-y-2 pl-5">
          {tests.map((test, idx) => {
            const globalIdx = baseIndex + idx;
            const typeConfig = TYPE_CONFIG[test.type] || TYPE_CONFIG.unit;

            return (
              <li key={idx}>
                <EditableItem onEdit={() => onEdit(globalIdx)} onDelete={() => onDelete(globalIdx)}>
                  <div className="space-y-1">
                    <div className="flex items-start gap-2">
                      <TestTube className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[var(--text-sm)] text-[var(--text-secondary)]">
                            {test.description}
                          </span>
                          <Badge variant="outline" className={`text-[10px] ${typeConfig.color}`}>
                            {typeConfig.label}
                          </Badge>
                        </div>
                        {test.testName && (
                          <p className="text-[10px] text-[var(--text-tertiary)] font-mono mt-0.5">
                            {test.testName}
                          </p>
                        )}
                        {test.testFile && (
                          <p className="text-[10px] text-[var(--text-tertiary)] font-mono">
                            {test.testFile}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </EditableItem>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

interface TestPlanSectionProps {
  summary?: string;
  unitTests: TestCaseSpec[];
  integrationTests: TestCaseSpec[];
  edgeCases: TestCaseSpec[];
  testingNotes?: string;
  coverageGoal?: number;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

export function TestPlanSection({
  summary,
  unitTests,
  integrationTests,
  edgeCases,
  testingNotes,
  coverageGoal,
  onEdit,
  onDelete,
}: TestPlanSectionProps) {
  const totalTests = unitTests.length + integrationTests.length + edgeCases.length;

  if (totalTests === 0) {
    return (
      <p className="text-[var(--text-sm)] text-[var(--text-tertiary)] italic">
        No test plan generated.
      </p>
    );
  }

  // Calculate base indices for global indexing
  const unitBase = 0;
  const integrationBase = unitTests.length;
  const edgeBase = unitTests.length + integrationTests.length;

  return (
    <div className="space-y-4">
      {summary && (
        <p className="text-[var(--text-sm)] text-[var(--text-secondary)] leading-relaxed">
          {summary}
        </p>
      )}

      {coverageGoal && (
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-xs)] text-[var(--text-tertiary)]">Coverage Goal:</span>
          <Badge variant="outline" className="text-[10px]">{coverageGoal}%</Badge>
        </div>
      )}

      <TestGroup
        title="Unit Tests"
        tests={unitTests}
        sectionKey="unit"
        baseIndex={unitBase}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      <TestGroup
        title="Integration Tests"
        tests={integrationTests}
        sectionKey="integration"
        baseIndex={integrationBase}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      <TestGroup
        title="Edge Cases"
        tests={edgeCases}
        sectionKey="edge"
        baseIndex={edgeBase}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      {testingNotes && (
        <div className="pt-2 border-t border-[var(--border)]">
          <p className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase mb-1">
            Notes
          </p>
          <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
            {testingNotes}
          </p>
        </div>
      )}
    </div>
  );
}
