'use client';

import { type ReactNode } from 'react';
import type { DemoScreen } from './demo-state';

const SCREEN_URLS: Record<DemoScreen, string> = {
  'ticket-list': 'app.forge-ai.dev/tickets',
  'ticket-detail': 'app.forge-ai.dev/tickets/FOR-127',
  'develop-session': 'app.forge-ai.dev/tickets/FOR-127',
  'delivered': 'app.forge-ai.dev/tickets/FOR-127',
  'preview': 'app.forge-ai.dev/tickets/FOR-127',
  'decision-logs': 'app.forge-ai.dev/records',
  'decision-log-detail': 'app.forge-ai.dev/records',
};

interface Props {
  screen: DemoScreen;
  children: ReactNode;
}

export function DemoBrowserChrome({ screen, children }: Props) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] overflow-hidden bg-[var(--bg)] shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
        {/* Traffic lights */}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        {/* URL bar */}
        <div className="flex-1 flex justify-center">
          <div className="px-4 py-1 rounded-md bg-[var(--bg)] text-[11px] text-[var(--text-tertiary)] font-mono min-w-[240px] text-center">
            {SCREEN_URLS[screen]}
          </div>
        </div>
        {/* Spacer to balance traffic lights */}
        <div className="w-[52px]" />
      </div>
      {/* Content */}
      <div className="relative overflow-hidden" style={{ height: '520px' }}>
        {children}
      </div>
    </div>
  );
}
