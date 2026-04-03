'use client';

import { type ReactNode, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, X } from 'lucide-react';
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

interface Props {
  screen: DemoScreen;
  children: ReactNode;
}

export function DemoBrowserChrome({ screen, children }: Props) {
  const [expanded, setExpanded] = useState(false);

  // Lock body scroll when expanded
  useEffect(() => {
    if (expanded) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [expanded]);

  // Close on Escape
  useEffect(() => {
    if (!expanded) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [expanded]);

  const browserFrame = (
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
      {/* Expand/close button */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
        title={expanded ? 'Close' : 'Expand'}
      >
        {expanded ? (
          <X className="w-3.5 h-3.5" />
        ) : (
          <Maximize2 className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );

  return (
    <>
      {/* Inline (compact) view */}
      <div className="rounded-xl border border-[var(--border-subtle)] overflow-hidden bg-[var(--bg)] shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
        {browserFrame}
        <div className="relative overflow-hidden" style={{ height: COMPACT_HEIGHT }}>
          {children}
        </div>
      </div>

      {/* Expanded overlay modal */}
      <AnimatePresence>
        {expanded && (
          <>
            {/* Backdrop — below the landing header (h-16 = 64px, z-50) */}
            <motion.div
              className="fixed inset-0 top-16 z-[100] bg-black/60 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              onClick={() => setExpanded(false)}
            />
            {/* Modal window */}
            {/* Modal — starts well below the fixed header (64px + padding) */}
            <motion.div
              className="fixed left-4 right-4 bottom-4 sm:left-8 sm:right-8 sm:bottom-8 lg:left-12 lg:right-12 lg:bottom-12 z-[101] flex items-center justify-center"
              style={{ top: 'calc(64px + 2rem)' }}
              initial={{ opacity: 0, scale: 0.85, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="w-full h-full max-w-[1400px] max-h-[900px] rounded-2xl border border-[var(--border-subtle)] overflow-hidden bg-[var(--bg)] shadow-[0_40px_100px_rgba(0,0,0,0.6)] flex flex-col">
                {browserFrame}
                <div className="relative flex-1 overflow-hidden">
                  {children}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
