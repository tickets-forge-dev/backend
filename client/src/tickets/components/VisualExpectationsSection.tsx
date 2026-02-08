'use client';

import { useState } from 'react';
import { Eye, Copy, Check, ChevronDown, ArrowRight } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import type { VisualExpectationsSpec, VisualExpectationSpec } from '@/types/question-refinement';

const STATE_LABELS: Record<string, { label: string; color: string }> = {
  default: { label: 'Default', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  loading: { label: 'Loading', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  error: { label: 'Error', color: 'bg-red-500/10 text-red-600 dark:text-red-400' },
  empty: { label: 'Empty', color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400' },
  success: { label: 'Success', color: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  interaction: { label: 'Interaction', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
};

function WireframeBlock({ wireframe }: { wireframe: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(wireframe);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  };

  return (
    <div className="relative group">
      <pre className="bg-gray-950 dark:bg-gray-950 text-green-400 text-[11px] leading-relaxed font-mono p-4 rounded-lg overflow-x-auto whitespace-pre border border-gray-800">
        {wireframe}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded bg-gray-800 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
        title="Copy wireframe"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

function ExpectationCard({ expectation, index }: { expectation: VisualExpectationSpec; index: number }) {
  const [expanded, setExpanded] = useState(index === 0); // First one expanded by default
  const stateInfo = STATE_LABELS[expectation.state] || STATE_LABELS.default;

  return (
    <div className="rounded-lg border border-[var(--border)]/50 overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors text-left"
      >
        <Eye className="h-4 w-4 text-[var(--text-tertiary)] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[var(--text-sm)] font-medium text-[var(--text)] truncate">
              {expectation.screen}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${stateInfo.color}`}>
              {stateInfo.label}
            </span>
            {expectation.acceptanceCriterionRef && (
              <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
                {expectation.acceptanceCriterionRef}
              </span>
            )}
          </div>
          {!expanded && (
            <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] mt-0.5 truncate">
              {expectation.description}
            </p>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-[var(--text-tertiary)] flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Body — expanded */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-[var(--border)]/30">
          {/* Description */}
          <p className="text-[var(--text-sm)] text-[var(--text-secondary)] pt-3">
            {expectation.description}
          </p>

          {/* Steps to reach this state */}
          {expectation.steps?.length > 0 && (
            <div className="space-y-1">
              <p className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                Steps to reproduce
              </p>
              <ol className="space-y-1">
                {expectation.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-[var(--text-sm)] text-[var(--text-secondary)]">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-[10px] font-medium text-[var(--text-tertiary)] mt-0.5">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Wireframe */}
          <div className="space-y-1">
            <p className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
              Expected UI
            </p>
            <WireframeBlock wireframe={expectation.wireframe} />
          </div>
        </div>
      )}
    </div>
  );
}

interface VisualExpectationsSectionProps {
  summary: string;
  expectations: VisualExpectationSpec[];
  flowDiagram?: string;
}

export function VisualExpectationsSection({
  summary,
  expectations,
  flowDiagram,
}: VisualExpectationsSectionProps) {
  const [showFlow, setShowFlow] = useState(false);

  if (!expectations || expectations.length === 0) {
    return (
      <p className="text-[var(--text-sm)] text-[var(--text-tertiary)] italic">
        No visual expectations generated.
      </p>
    );
  }

  // Group by state for the summary bar
  const stateCounts: Record<string, number> = {};
  expectations.forEach((e) => {
    stateCounts[e.state] = (stateCounts[e.state] || 0) + 1;
  });

  return (
    <div className="space-y-4">
      {/* Summary */}
      <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
        {summary}
      </p>

      {/* State overview badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {Object.entries(stateCounts).map(([state, count]) => {
          const info = STATE_LABELS[state] || STATE_LABELS.default;
          return (
            <span key={state} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${info.color}`}>
              {info.label}: {count}
            </span>
          );
        })}
      </div>

      {/* Flow diagram toggle */}
      {flowDiagram && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFlow((v) => !v)}
            className="gap-1.5 text-xs h-7"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            {showFlow ? 'Hide' : 'Show'} User Flow
          </Button>
          {showFlow && (
            <div className="mt-2">
              <WireframeBlock wireframe={flowDiagram} />
            </div>
          )}
        </div>
      )}

      {/* Expectation cards */}
      <div className="space-y-2">
        {expectations.map((expectation, idx) => (
          <ExpectationCard key={idx} expectation={expectation} index={idx} />
        ))}
      </div>
    </div>
  );
}
