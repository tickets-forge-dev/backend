'use client';

import { useState } from 'react';
import { FileText, Terminal, Search, Wrench, FilePlus, ChevronDown, ChevronRight } from 'lucide-react';
import type { SessionEvent } from '../../types/session.types';
import { StatusIcon } from '../atoms/StatusIcon';
import { DiffStats } from '../atoms/DiffStats';

interface SessionToolCardProps {
  event: SessionEvent;
}

const TOOL_ICONS: Record<string, typeof FileText> = {
  Read: FileText,
  Edit: FileText,
  Write: FilePlus,
  Bash: Terminal,
  Glob: Search,
  Grep: Search,
};

export function SessionToolCard({ event }: SessionToolCardProps) {
  const isDiff = event.type === 'event.file_diff' && event.oldString && event.newString;
  const isCreate = event.type === 'event.file_create';

  // Diffs and new files are expanded by default — they're the most valuable
  const [expanded, setExpanded] = useState(isDiff || isCreate);
  const completed = !!event.completed;
  const Icon = TOOL_ICONS[event.tool ?? ''] ?? Wrench;

  const label = event.path
    ? event.path
    : event.command
      ? `$ ${event.command}`
      : event.tool ?? 'Working...';

  const additions = isDiff && event.newString
    ? event.newString.split('\n').length
    : undefined;

  const deletions = isDiff && event.oldString
    ? event.oldString.split('\n').length
    : undefined;

  const hasContent = !!(event.output || isDiff || (isCreate && event.content));
  const Chevron = expanded ? ChevronDown : ChevronRight;

  return (
    <div className="ml-7">
      {/* Header — always visible */}
      <button
        onClick={() => hasContent && setExpanded(!expanded)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-[12px] transition-colors ${
          hasContent ? 'hover:bg-[var(--bg-hover)] cursor-pointer' : 'cursor-default'
        } ${expanded ? 'bg-[var(--bg-hover)]/50' : ''}`}
      >
        {hasContent && <Chevron className="w-3 h-3 text-[var(--text-tertiary)] flex-shrink-0" />}
        <Icon className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0" />
        <span className="text-[var(--text-secondary)] truncate flex-1 text-left font-mono text-[11px]">
          {label}
        </span>
        {isCreate && (
          <span className="text-[10px] font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">new</span>
        )}
        {isDiff && <DiffStats additions={additions} deletions={deletions} />}
        <StatusIcon
          status={completed ? 'completed' : 'loading'}
          color={completed ? 'emerald' : 'blue'}
        />
      </button>

      {/* Expanded content */}
      {expanded && hasContent && (
        <div className="ml-5 mt-1 rounded-md border border-[var(--border-subtle)] overflow-hidden">
          {/* Diff view */}
          {isDiff && event.oldString && event.newString && (
            <div className="font-mono text-[11px] leading-relaxed overflow-x-auto">
              {event.oldString.split('\n').map((line, i) => (
                <div key={`old-${i}`} className="px-3 py-0.5 bg-red-500/5 text-red-400">
                  <span className="select-none text-red-500/40 mr-2">-</span>{line}
                </div>
              ))}
              {event.newString.split('\n').map((line, i) => (
                <div key={`new-${i}`} className="px-3 py-0.5 bg-emerald-500/5 text-emerald-400">
                  <span className="select-none text-emerald-500/40 mr-2">+</span>{line}
                </div>
              ))}
            </div>
          )}

          {/* New file content */}
          {isCreate && event.content && (
            <div className="font-mono text-[11px] leading-relaxed overflow-x-auto max-h-64 overflow-y-auto">
              {event.content.split('\n').slice(0, 50).map((line, i) => (
                <div key={i} className="px-3 py-0.5 bg-emerald-500/5 text-emerald-400">
                  <span className="select-none text-emerald-500/20 mr-2 text-[9px] w-4 inline-block text-right">{i + 1}</span>{line}
                </div>
              ))}
              {event.content.split('\n').length > 50 && (
                <div className="px-3 py-1 text-[10px] text-[var(--text-tertiary)] bg-[var(--bg-hover)]">
                  +{event.content.split('\n').length - 50} more lines
                </div>
              )}
            </div>
          )}

          {/* Command output */}
          {event.output && (
            <div className="p-3 max-h-48 overflow-y-auto">
              <pre className="text-[11px] font-mono text-[var(--text-tertiary)] whitespace-pre-wrap break-all">
                {event.output}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
