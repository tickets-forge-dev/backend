'use client';

import { useState } from 'react';
import { FileText, Terminal, Search, Check, Loader2, ChevronRight, Wrench } from 'lucide-react';
import type { SessionEvent } from '../types/session.types';

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

  const detail = event.type === 'event.file_diff'
    ? (
        <span className="flex gap-1.5 text-[11px]">
          {event.newString && <span className="text-emerald-500">+{event.newString.split('\n').length}</span>}
          {event.oldString && <span className="text-red-500">-{event.oldString.split('\n').length}</span>}
        </span>
      )
    : event.type === 'event.file_create'
      ? <span className="text-[11px] text-emerald-500">new</span>
      : null;

  return (
    <div className="ml-8 bg-[var(--bg-hover)] border border-[var(--border-subtle)] rounded-md overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-[var(--bg-active)] transition-colors"
      >
        <Icon className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0" />
        <span className="text-[var(--text-secondary)] truncate flex-1 text-left font-mono">
          {label}
        </span>
        {detail}
        {completed
          ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          : <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin shrink-0" />
        }
        <ChevronRight className={`w-3 h-3 text-[var(--text-tertiary)] transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && event.output && (
        <div className="border-t border-[var(--border-subtle)] p-3 max-h-48 overflow-y-auto scrollbar-thin">
          <pre className="text-[11px] font-mono text-[var(--text-tertiary)] whitespace-pre-wrap break-all">
            {event.output}
          </pre>
        </div>
      )}

      {expanded && event.type === 'event.file_diff' && event.oldString && event.newString && (
        <div className="border-t border-[var(--border-subtle)] p-3 font-mono text-[11px] leading-relaxed">
          <div className="text-red-500">- {event.oldString}</div>
          <div className="text-emerald-500">+ {event.newString}</div>
        </div>
      )}
    </div>
  );
}
