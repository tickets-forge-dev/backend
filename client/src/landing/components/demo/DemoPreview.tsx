// DemoPreview.tsx
'use client';

import { ArrowLeft, Terminal } from 'lucide-react';
import { DEMO_PREVIEW_LINES } from './demo-data';

interface Props {
  onBack: () => void;
}

const LINE_STYLES: Record<string, string> = {
  command: 'text-[var(--text)] font-semibold',
  output: '',
  header: 'text-blue-400',
  json: 'text-emerald-400',
  comment: 'text-[var(--text-tertiary)] italic',
  'error-header': 'text-red-400 font-semibold',
  'error-json': 'text-red-400',
};

export function DemoPreview({ onBack }: Props) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Change Record</span>
        </button>
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)]">
          <Terminal className="h-3.5 w-3.5" />
          <span>Preview</span>
        </div>
      </div>

      {/* Terminal */}
      <div className="flex-1 bg-[#0d1117] rounded-lg m-3 p-4 overflow-y-auto font-mono text-[11px] leading-relaxed">
        {DEMO_PREVIEW_LINES.map((line, i) => (
          <div key={i} className={LINE_STYLES[line.type] || 'text-[var(--text-tertiary)]'}>
            {line.text || '\u00A0'}
          </div>
        ))}
      </div>
    </div>
  );
}
