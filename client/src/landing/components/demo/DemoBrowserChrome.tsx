'use client';

import { type ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { Maximize2, Minimize2 } from 'lucide-react';
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

const COMPACT_HEIGHT = 520;
const EXPANDED_HEIGHT = Math.round(COMPACT_HEIGHT * 1.3); // 30% larger

interface Props {
  screen: DemoScreen;
  children: ReactNode;
}

export function DemoBrowserChrome({ screen, children }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      className="rounded-xl border border-[var(--border-subtle)] overflow-hidden bg-[var(--bg)] shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
      layout
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
    >
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
        {/* Expand/collapse button */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          title={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? (
            <Minimize2 className="w-3.5 h-3.5" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
      {/* Content */}
      <motion.div
        className="relative overflow-hidden"
        animate={{ height: expanded ? EXPANDED_HEIGHT : COMPACT_HEIGHT }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
