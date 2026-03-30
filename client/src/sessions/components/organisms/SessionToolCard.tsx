'use client';

import { useState } from 'react';
import { FileText, Terminal, Search, Wrench } from 'lucide-react';
import type { SessionEvent } from '../../types/session.types';
import { StatusIcon } from '../atoms/StatusIcon';
import { DiffStats } from '../atoms/DiffStats';
import { ExpandableCard } from '../molecules/ExpandableCard';

interface SessionToolCardProps {
  event: SessionEvent;
}

const TOOL_ICONS: Record<string, typeof FileText> = {
  Read: FileText,
  Edit: FileText,
  Write: FileText,
  Bash: Terminal,
  Glob: Search,
  Grep: Search,
};

export function SessionToolCard({ event }: SessionToolCardProps) {
  const [expanded, setExpanded] = useState(false);
  const completed = !!event.completed;
  const Icon = TOOL_ICONS[event.tool ?? ''] ?? Wrench;

  const label = event.path
    ? event.path
    : event.command
      ? `$ ${event.command}`
      : event.tool ?? 'Working...';

  const additions = event.type === 'event.file_diff' && event.newString
    ? event.newString.split('\n').length
    : event.type === 'event.file_create'
      ? undefined
      : undefined;

  const deletions = event.type === 'event.file_diff' && event.oldString
    ? event.oldString.split('\n').length
    : undefined;

  const detail = event.type === 'event.file_create'
    ? <span className="text-[11px] text-emerald-500">new</span>
    : <DiffStats additions={additions} deletions={deletions} />;

  const hasExpandableContent = !!(event.output || (event.type === 'event.file_diff' && event.oldString && event.newString));

  const header = (
    <>
      <Icon className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0" />
      <span className="text-[var(--text-secondary)] truncate flex-1 text-left font-mono">
        {label}
      </span>
      {detail}
      <StatusIcon
        status={completed ? 'completed' : 'loading'}
        color={completed ? 'emerald' : 'blue'}
      />
    </>
  );

  return (
    <div className="ml-8">
      <ExpandableCard header={header}>
        {event.output && (
          <div className="p-3 max-h-48 overflow-y-auto scrollbar-thin">
            <pre className="text-[11px] font-mono text-[var(--text-tertiary)] whitespace-pre-wrap break-all">
              {event.output}
            </pre>
          </div>
        )}

        {event.type === 'event.file_diff' && event.oldString && event.newString && (
          <div className="p-3 font-mono text-[11px] leading-relaxed">
            <div className="text-red-500">- {event.oldString}</div>
            <div className="text-emerald-500">+ {event.newString}</div>
          </div>
        )}
      </ExpandableCard>
    </div>
  );
}
