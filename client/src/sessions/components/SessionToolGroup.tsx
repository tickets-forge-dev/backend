'use client';

import { useState } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import type { SessionEvent } from '../types/session.types';
import { SessionToolCard } from './SessionToolCard';

interface SessionToolGroupProps {
  events: SessionEvent[];
}

export function SessionToolGroup({ events }: SessionToolGroupProps) {
  const [expanded, setExpanded] = useState(false);

  if (events.length === 1) {
    return <SessionToolCard event={events[0]} />;
  }

  const allCompleted = events.every(e => e.completed);
  const fileCount = events.filter(e => e.path).length;
  const cmdCount = events.filter(e => e.command).length;

  const parts: string[] = [];
  if (fileCount > 0) parts.push(`${fileCount} file${fileCount > 1 ? 's' : ''}`);
  if (cmdCount > 0) parts.push(`${cmdCount} command${cmdCount > 1 ? 's' : ''}`);
  const label = `Explored ${parts.join(', ')}`;

  return (
    <div className="ml-8">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
      >
        <Search className="w-3 h-3" />
        <span>{label}</span>
        {allCompleted && <span className="text-emerald-500">&#10003;</span>}
        <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className="space-y-1.5 mt-1">
          {events.map(event => (
            <SessionToolCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
