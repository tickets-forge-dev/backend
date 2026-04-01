'use client';

import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { Loader2, ShieldCheck, AlertCircle, CheckCircle2, Send } from 'lucide-react';
import { useSessionStore } from '../../stores/session.store';
import { useTicketsStore } from '@/stores/tickets.store';
import type { SessionEvent } from '../../types/session.types';
import { useSkillsStore } from '../../stores/skills.store';
import { DevelopButton } from './DevelopButton';
import { SessionProvisioningView } from './SessionProvisioningView';
import { SessionMessage } from './SessionMessage';
import { SessionToolGroup } from './SessionToolGroup';
import { SessionSummary } from './SessionSummary';
import { SessionStatusHeader } from './SessionStatusHeader';
import { StreamEnrichment } from '../atoms/StreamEnrichment';

interface SessionMonitorViewProps {
  ticketId: string;
  ticketStatus: string;
  /** Number of file changes from the ticket's tech spec — used for complexity warning */
  fileChangeCount?: number;
  /** Repository full name (owner/repo) */
  repoFullName?: string;
  /** Branch that will be created */
  branch?: string;
  /** Callback to open repo connection dialog */
  onConnectRepo?: () => void;
}

function isToolEvent(type: string): boolean {
  return ['event.tool_use', 'event.file_diff', 'event.file_create', 'event.bash', 'event.search', 'event.unknown_tool'].includes(type);
}

// All tool events are visible — exploration tools are grouped into compact summaries by SessionToolGroup

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

export function SessionMonitorView({ ticketId, ticketStatus, fileChangeCount, repoFullName, branch, onConnectRepo }: SessionMonitorViewProps) {
  const { status, events, summary, error, elapsedSeconds, startSession, cancelSession, fetchQuota, reset, restoreSession: restoreSessionState } = useSessionStore();
  const currentTicket = useTicketsStore(state => state.currentTicket);

  const restorationAttempted = useRef(false);
  const [verbose, setVerbose] = useState(false);

  useEffect(() => {
    fetchQuota();
    // Restore session from sessionStorage if the store is empty but ticket is executing/delivered
    if (status === 'idle' && (ticketStatus === 'executing' || ticketStatus === 'delivered')) {
      restoreSessionState(ticketId);
      restorationAttempted.current = true;
    }
  }, [fetchQuota, ticketId, ticketStatus]);

  const renderGroups = useMemo(() => groupEvents(events), [events]);

  // Auto-scroll: stick to bottom unless user scrolled up
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    userScrolledUp.current = !isAtBottom;
  }, []);

  useEffect(() => {
    if (!userScrolledUp.current && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events.length]);

  // If store is idle but ticket is executing/delivered AND we have restored events, show resumed state
  // If restoration was attempted but found nothing, fall through to DevelopButton
  if (status === 'idle' && (ticketStatus === 'executing' || ticketStatus === 'delivered') && events.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] px-6">
        <div className="w-full max-w-sm space-y-5 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10 mb-1">
            {ticketStatus === 'executing' ? (
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            )}
          </div>
          <h3 className="text-[15px] font-semibold text-[var(--text)]">
            {ticketStatus === 'executing' ? 'Development in progress' : 'Development complete'}
          </h3>
          <p className="text-[13px] text-[var(--text-tertiary)] leading-relaxed">
            {ticketStatus === 'executing'
              ? 'The AI agent is working on this ticket. The session was started before this page loaded.'
              : 'This ticket has been developed. Check the Record tab for details.'}
          </p>
          {ticketStatus === 'executing' && (
            <button
              onClick={() => startSession(ticketId)}
              className="px-4 py-2 rounded-lg bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] text-[12px] font-medium text-[var(--text)] transition-colors"
            >
              Restart Development
            </button>
          )}
        </div>
      </div>
    );
  }

  if (status === 'idle') {
    return (
      <DevelopButton
        ticketId={ticketId}
        ticketStatus={ticketStatus}
        onStart={(skillIds) => startSession(ticketId, skillIds)}
        fileChangeCount={fileChangeCount}
        repoFullName={repoFullName}
        branch={branch}
        onConnectRepo={onConnectRepo}
      />
    );
  }

  if (status === 'provisioning') {
    return <SessionProvisioningView onCancel={cancelSession} />;
  }

  if (status === 'failed') {
    const needsApproval = (error?.toLowerCase().includes('must be approved') || error?.toLowerCase().includes('approved status'))
      && ['draft', 'defined', 'refined'].includes(ticketStatus);

    if (needsApproval) {
      return <NeedsApprovalView ticketId={ticketId} ticketStatus={ticketStatus} onReset={reset} />;
    }

    return (
      <div className="flex flex-col items-center gap-3 py-16 px-6">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/10">
          <AlertCircle className="w-5 h-5 text-red-500" />
        </div>
        <p className="text-[13px] font-medium text-[var(--text)]">Something went wrong</p>
        {error && (
          <p className="text-[12px] text-[var(--text-secondary)] text-center max-w-sm leading-relaxed">
            {error}
          </p>
        )}
        <button
          onClick={reset}
          className="mt-2 px-4 py-1.5 rounded-lg bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] text-[12px] font-medium text-[var(--text)] transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} onScroll={handleScroll} className="space-y-1 px-4 py-3">
      <SessionStatusHeader
        status={status}
        elapsedSeconds={elapsedSeconds}
        onCancel={cancelSession}
        verbose={verbose}
        onToggleVerbose={() => setVerbose(v => !v)}
      />

      {/* Event stream */}
      <div className="space-y-4">
        {renderGroups.map((group, i) => {
          if (group.type === 'tool_group') {
            return <SessionToolGroup key={`group-${i}`} events={group.events} />;
          }

          const event = group.events[0];
          if (event.type === 'event.message') {
            return (
              <div key={event.id}>
                <SessionMessage content={event.content ?? ''} />
                {currentTicket && (
                  <StreamEnrichment messageContent={event.content ?? ''} ticket={currentTicket} />
                )}
              </div>
            );
          }
          if (event.type === 'event.stderr') {
            if (!verbose || !event.content?.trim()) return null;
            return (
              <div key={event.id || `stderr-${i}`} className="ml-7 px-3 py-1.5 rounded bg-[var(--bg-hover)] text-[10px] text-[var(--text-tertiary)] font-mono whitespace-pre-wrap break-all">
                {event.content}
              </div>
            );
          }
          if (event.type === 'event.thinking') {
            if (!event.content?.trim()) return null;
            // Always show thinking — it's the most interesting part for users
            return (
              <div key={event.id || `thinking-${i}`} className="ml-7 px-2.5 py-1.5 text-[11px] text-[var(--text-tertiary)] italic leading-relaxed line-clamp-2">
                {event.content}
              </div>
            );
          }
          return null;
        })}

        {/* Live thinking indicator */}
        {status === 'running' && events.length > 0 && events[events.length - 1].type === 'event.thinking' && (
          <div className="ml-7 flex items-center gap-1.5 py-1">
            <Loader2 className="w-3 h-3 text-[var(--text-tertiary)] animate-spin" />
            <span className="text-[11px] text-[var(--text-tertiary)]">Thinking...</span>
          </div>
        )}
      </div>

      {/* Summary */}
      {status === 'completed' && summary && (
        <div className="mt-4">
          <SessionSummary summary={summary} />
        </div>
      )}

      <div ref={bottomRef} />

      {/* Follow-up input — after everything so auto-scroll reveals it */}
      {status === 'completed' && (
        <FollowUpInput
          ticketId={ticketId}
          onSubmit={(request) => {
            reset();
            startSession(ticketId, undefined, request);
          }}
        />
      )}
    </div>
  );
}

/** Shows which skills are active for this session */
function ActiveSkillsBanner() {
  const { catalog, getEffectiveSkillIds } = useSkillsStore();
  const activeIds = getEffectiveSkillIds();

  if (activeIds.length === 0) return null;

  const activeSkills = catalog.filter(s => activeIds.includes(s.id));
  if (activeSkills.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap py-1.5">
      <span className="text-[10px] text-[var(--text-tertiary)]">Skills:</span>
      {activeSkills.map(skill => (
        <span
          key={skill.id}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-[var(--text-tertiary)] bg-[var(--bg-hover)]"
        >
          {skill.name}
        </span>
      ))}
    </div>
  );
}

/** Follow-up input — lets user request changes after development completes */
function FollowUpInput({ ticketId, onSubmit }: { ticketId: string; onSubmit: (request: string) => void }) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSubmit(text);
  };

  return (
    <div className="mt-6 border-t border-[var(--border-subtle)] pt-4 pb-2">
      <div className="flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Describe what to change or add..."
          rows={2}
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-[13px] text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--text-tertiary)] resize-none scrollbar-thin"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="p-2.5 rounded-lg bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] text-[var(--text)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/** Shown when the backend rejects because the ticket isn't approved yet */
function NeedsApprovalView({ ticketId, ticketStatus, onReset }: { ticketId: string; ticketStatus: string; onReset: () => void }) {
  const { approveTicket } = useTicketsStore();
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);

  // Can approve from draft, defined, or refined
  const canApprove = ['draft', 'defined', 'refined'].includes(ticketStatus);

  const handleApprove = async () => {
    setApproving(true);
    const success = await approveTicket(ticketId);
    setApproving(false);
    if (success) {
      setApproved(true);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 py-16 px-6">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10">
        <ShieldCheck className="w-5 h-5 text-amber-500" />
      </div>

      <div className="text-center space-y-1.5">
        <p className="text-[14px] font-medium text-[var(--text)]">
          Ticket needs approval
        </p>
        <p className="text-[12px] text-[var(--text-secondary)] max-w-xs leading-relaxed">
          Approve this ticket to start development.
        </p>
      </div>

      {approved ? (
        <div className="space-y-3 w-full max-w-xs">
          <p className="text-[12px] text-emerald-500 font-medium text-center">Approved</p>
          <button
            onClick={onReset}
            className="w-full px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-medium transition-colors"
          >
            Start Development
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={handleApprove}
            disabled={approving}
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-medium transition-colors disabled:opacity-50"
          >
            {approving ? 'Approving...' : 'Approve & Develop'}
          </button>
          <button
            onClick={onReset}
            className="px-4 py-1.5 rounded-lg bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] text-[12px] text-[var(--text-secondary)] font-medium transition-colors"
          >
            Go back
          </button>
        </div>
      )}
    </div>
  );
}
