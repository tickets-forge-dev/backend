'use client';

import { LayoutGrid, ClipboardList, Settings, Search, MessageCircle } from 'lucide-react';
import type { DemoScreen } from './demo-state';

interface Props {
  screen: DemoScreen;
  onOpenTickets: () => void;
  onOpenDecisionLogs: () => void;
}

const NAV_ITEMS = [
  { id: 'tickets', icon: LayoutGrid, label: 'Tickets', screens: ['ticket-list', 'ticket-detail', 'develop-session', 'delivered', 'preview'] as DemoScreen[] },
  { id: 'records', icon: ClipboardList, label: 'Decision Logs', screens: ['decision-logs', 'decision-log-detail'] as DemoScreen[] },
] as const;

const STATIC_ITEMS = [
  { icon: Settings, label: 'Settings' },
  { icon: Search, label: 'Search' },
  { icon: MessageCircle, label: 'Feedback' },
] as const;

export function DemoSidebar({ screen, onOpenTickets, onOpenDecisionLogs }: Props) {
  return (
    <div className="w-16 h-full bg-[var(--bg)] flex flex-col border-r border-[var(--border-subtle)] flex-shrink-0">
      {/* Avatar */}
      <div className="px-2.5 py-3 flex justify-center">
        <div className="w-7 h-7 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-[11px] font-medium text-[var(--text-tertiary)]">
          A
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-2">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.screens.includes(screen);
            const onClick = item.id === 'tickets' ? onOpenTickets : onOpenDecisionLogs;
            return (
              <li key={item.id}>
                <button
                  onClick={onClick}
                  className={`w-full flex items-center justify-center rounded-md px-2.5 py-1.5 transition-colors ${
                    isActive
                      ? 'bg-[var(--bg-hover)] text-[var(--text)]'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
                  }`}
                  title={item.label}
                >
                  <item.icon className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>

        {/* Separator */}
        <div className="my-3 mx-2 h-px bg-[var(--border-subtle)]" />

        {/* Static (non-clickable) items */}
        <ul className="space-y-1">
          {STATIC_ITEMS.map((item) => (
            <li key={item.label}>
              <div
                className="w-full flex items-center justify-center rounded-md px-2.5 py-1.5 text-[var(--text-tertiary)]/40 cursor-default"
                title={item.label}
              >
                <item.icon className="h-3.5 w-3.5" />
              </div>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
