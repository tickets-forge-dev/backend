'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { SessionEvent } from '../../types/session.types';
import { SessionToolCard } from './SessionToolCard';

interface SessionToolGroupProps {
  events: SessionEvent[];
}

export function SessionToolGroup({ events }: SessionToolGroupProps) {
  const [expanded, setExpanded] = useState(false);

  if (events.length === 1) {
    return <SessionToolCard event={events[0]} />;
  }

  // Extract meaningful labels from events
  const labels: string[] = [];
  for (const e of events) {
    if (e.path) {
      // Show just the filename, not the full path
      const filename = e.path.split('/').pop() || e.path;
      if (!labels.includes(filename)) labels.push(filename);
    } else if (e.command) {
      const shortCmd = e.command.length > 40 ? e.command.slice(0, 40) + '...' : e.command;
      labels.push(`$ ${shortCmd}`);
    } else if (e.tool) {
      if (!labels.includes(e.tool)) labels.push(e.tool);
    }
  }

  // Show the first few items inline, rest behind expand
  const visible = labels.slice(0, 3);
  const remaining = labels.length - visible.length;

  return (
    <div className="ml-7">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-start gap-2 px-2 py-1 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors rounded hover:bg-[var(--bg-hover)]"
      >
        <ChevronRight className={`w-3 h-3 mt-0.5 shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        <span className="text-left leading-relaxed">
          {visible.map((label, i) => (
            <span key={i}>
              <span className="font-mono">{label}</span>
              {i < visible.length - 1 && <span className="text-[var(--text-tertiary)]/40"> · </span>}
            </span>
          ))}
          {remaining > 0 && (
            <span className="text-[var(--text-tertiary)]/50"> +{remaining} more</span>
          )}
        </span>
      </button>

      {expanded && (
        <div className="space-y-1 mt-1">
          {events.map(event => (
            <SessionToolCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
