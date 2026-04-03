// DemoTicketList.tsx
'use client';

import { ChevronDown, FolderOpen, Plus, Circle, Bug, Zap, CheckSquare } from 'lucide-react';
import { DEMO_FOLDERS, DEMO_TICKETS, DEMO_TAGS } from './demo-data';
import type { DemoTicket } from './demo-data';

interface Props {
  onOpenTicket: () => void;
  hasInteracted: boolean;
}

const STATUS_DOTS: Record<string, string> = {
  draft: 'bg-[var(--text-tertiary)]/50',
  defined: 'bg-purple-500',
  refined: 'bg-amber-500',
  approved: 'bg-emerald-500',
  executing: 'bg-blue-500',
  delivered: 'bg-green-500',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  defined: 'Define',
  refined: 'Refined',
  approved: 'Ready',
  executing: 'In Progress',
  delivered: 'Delivered',
};

const TAG_COLORS: Record<string, string> = {
  red: 'bg-red-500/15 text-red-500',
  orange: 'bg-orange-500/15 text-orange-500',
  yellow: 'bg-yellow-500/15 text-yellow-500',
  green: 'bg-green-500/15 text-green-500',
  teal: 'bg-teal-500/15 text-teal-500',
  blue: 'bg-blue-500/15 text-blue-500',
  purple: 'bg-purple-500/15 text-purple-500',
  pink: 'bg-pink-500/15 text-pink-500',
};

function TypeIcon({ type }: { type: DemoTicket['type'] }) {
  switch (type) {
    case 'bug': return <Bug className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />;
    case 'task': return <CheckSquare className="h-3.5 w-3.5 text-[var(--text-tertiary)] flex-shrink-0" />;
    default: return <Circle className="h-3.5 w-3.5 text-violet-500 flex-shrink-0" />;
  }
}

export function DemoTicketList({ onOpenTicket, hasInteracted }: Props) {
  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      {/* Column headers */}
      <div className="grid grid-cols-[1fr_80px_60px] items-center px-4 py-2 text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider select-none border-b border-[var(--border-subtle)]">
        <span className="pl-6">Title</span>
        <span>Status</span>
        <span>Priority</span>
      </div>

      {/* Folders */}
      {DEMO_FOLDERS.map((folder) => {
        const tickets = folder.ticketIds
          .map((id) => DEMO_TICKETS[id])
          .filter(Boolean);
        const ticketCount = folder.ticketIds.length;

        return (
          <div key={folder.id}>
            {/* Folder header */}
            <div className="flex items-center gap-2 px-2 py-2 hover:bg-[var(--bg-hover)] transition-all border-b border-[var(--border-subtle)] cursor-default">
              <ChevronDown className={`h-4 w-4 text-[var(--text-tertiary)] transition-transform flex-shrink-0 ${!folder.expanded ? '-rotate-90' : ''}`} />
              <FolderOpen className="h-4 w-4 text-[var(--text-tertiary)] flex-shrink-0" />
              <h3 className="text-sm font-medium text-[var(--text-secondary)] truncate flex-1">{folder.name}</h3>
              <span className="text-xs font-medium text-[var(--text-tertiary)] flex-shrink-0 tabular-nums">{ticketCount}</span>
            </div>

            {/* Ticket rows */}
            {folder.expanded && tickets.map((ticket, idx) => {
              const tags = ticket.tagIds.map((id) => DEMO_TAGS.find((t) => t.id === id)).filter(Boolean);
              const showPulse = !hasInteracted && folder.id === 'f1' && idx === 0;

              return (
                <div
                  key={ticket.id}
                  onClick={onOpenTicket}
                  className="group grid grid-cols-[1fr_80px_60px] items-center px-4 py-0 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                >
                  {/* Title cell */}
                  <div className={`flex items-center gap-2 py-2.5 min-w-0 pr-3 ${showPulse ? 'relative' : ''}`}>
                    {showPulse && (
                      <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    )}
                    <TypeIcon type={ticket.type} />
                    <span className="text-[13px] truncate group-hover:text-[var(--text)] transition-colors font-normal text-[var(--text-secondary)]">
                      {ticket.title}
                    </span>
                    {ticket.status === 'draft' && (
                      <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium text-[var(--text-tertiary)] bg-[var(--bg-hover)]">
                        Draft
                      </span>
                    )}
                    {tags.map((tag) => tag && (
                      <span key={tag.id} className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${TAG_COLORS[tag.color]}`}>
                        {tag.name}
                      </span>
                    ))}
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-1.5 py-2.5">
                    <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${STATUS_DOTS[ticket.status]}`} />
                    <span className="text-[11px] text-[var(--text-tertiary)] truncate">{STATUS_LABELS[ticket.status]}</span>
                  </div>

                  {/* Priority */}
                  <div className="py-2.5">
                    <span className="text-[11px] text-[var(--text-tertiary)]">
                      {ticket.priority === 'urgent' ? 'Urgent' : ticket.priority === 'high' ? 'High' : ticket.priority === 'medium' ? 'Medium' : 'Low'}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* New ticket row */}
            {folder.expanded && (
              <div className="flex items-center gap-2 pl-10 pr-4 py-2 text-xs text-[var(--text-tertiary)]/40 cursor-default">
                <Plus className="h-3 w-3" />
                <span>New ticket</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
