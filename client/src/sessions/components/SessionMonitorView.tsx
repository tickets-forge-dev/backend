'use client';

import { useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useSessionStore } from '../stores/session.store';
import type { SessionEvent } from '../types/session.types';
import { DevelopButton } from './DevelopButton';
import { SessionProvisioningView } from './SessionProvisioningView';
import { SessionMessage } from './SessionMessage';
import { SessionToolCard } from './SessionToolCard';
import { SessionToolGroup } from './SessionToolGroup';
import { SessionSummary } from './SessionSummary';

interface SessionMonitorViewProps {
  ticketId: string;
  ticketStatus: string;
}

function isToolEvent(type: string): boolean {
  return ['event.tool_use', 'event.file_diff', 'event.file_create', 'event.bash', 'event.search', 'event.unknown_tool'].includes(type);
}

interface RenderGroup {
  type: 'single' | 'tool_group';
  events: SessionEvent[];
}

function groupEvents(events: SessionEvent[]): RenderGroup[] {
  const groups: RenderGroup[] = [];
  let currentToolGroup: SessionEvent[] = [];

  for (const event of events) {
    if (isToolEvent(event.type)) {
      currentToolGroup.push(event);
    } else {
      if (currentToolGroup.length > 0) {
        groups.push({ type: 'tool_group', events: [...currentToolGroup] });
        currentToolGroup = [];
      }
      groups.push({ type: 'single', events: [event] });
    }
  }
  if (currentToolGroup.length > 0) {
    groups.push({ type: 'tool_group', events: currentToolGroup });
  }
  return groups;
}

export function SessionMonitorView({ ticketId, ticketStatus }: SessionMonitorViewProps) {
  const { status, events, summary, error, elapsedSeconds, startSession, cancelSession, fetchQuota, reset } = useSessionStore();

  useEffect(() => {
    fetchQuota();
    return () => reset();
  }, [fetchQuota, reset]);

  const renderGroups = useMemo(() => groupEvents(events), [events]);

  const elapsed = `${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, '0')}`;

  if (status === 'idle') {
    return (
      <DevelopButton
        ticketId={ticketId}
        ticketStatus={ticketStatus}
        onStart={() => startSession(ticketId)}
      />
    );
  }

  if (status === 'provisioning') {
    return <SessionProvisioningView onCancel={cancelSession} />;
  }

  if (status === 'failed') {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <div className="text-[13px] text-red-500">{error || 'Session failed'}</div>
        <button onClick={reset} className="text-[12px] text-violet-500 hover:underline">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center justify-between py-2 mb-2">
        <div className="flex items-center gap-2">
          {status === 'running' ? (
            <>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse [animation-delay:150ms]" />
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse [animation-delay:300ms]" />
              </div>
              <span className="text-[12px] text-violet-500 font-medium">Claude is working</span>
            </>
          ) : status === 'completed' ? (
            <>
              <span className="text-emerald-500 text-[13px]">&#10003;</span>
              <span className="text-[12px] text-emerald-500 font-medium">Development complete</span>
            </>
          ) : (
            <span className="text-[12px] text-[var(--text-tertiary)]">{status}</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[var(--text-tertiary)]">
          <span>{elapsed}</span>
          {status === 'running' && (
            <button onClick={cancelSession} className="text-red-500 hover:text-red-400">
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Event stream */}
      <div className="space-y-3">
        {renderGroups.map((group, i) => {
          if (group.type === 'tool_group') {
            return <SessionToolGroup key={`group-${i}`} events={group.events} />;
          }

          const event = group.events[0];
          if (event.type === 'event.message') {
            return <SessionMessage key={event.id} content={event.content ?? ''} />;
          }
          if (event.type === 'event.thinking') {
            return (
              <div key={event.id} className="ml-8 flex items-center gap-1.5 py-1">
                <Loader2 className="w-3 h-3 text-violet-500 animate-spin" />
                <span className="text-[11px] text-[var(--text-tertiary)]">Thinking...</span>
              </div>
            );
          }
          return null;
        })}
      </div>

      {/* Summary */}
      {status === 'completed' && summary && (
        <div className="mt-4">
          <SessionSummary summary={summary} />
        </div>
      )}
    </div>
  );
}
