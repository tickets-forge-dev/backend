'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

type LineType = 'user' | 'claude' | 'tool' | 'success' | 'dim' | 'accent' | 'empty' | 'divider';

interface Line {
  text: string;
  type: LineType;
  delay: number;
}

const SEQUENCE: Line[] = [
  // User prompt
  { text: '> /forge:develop', type: 'user', delay: 0 },
  { text: '', type: 'empty', delay: 500 },

  // Claude responds
  { text: 'I\'ll start the guided implementation flow using', type: 'claude', delay: 300 },
  { text: 'Forge. Let me find your ticket first.', type: 'claude', delay: 80 },
  { text: '', type: 'empty', delay: 400 },

  // Tool call
  { text: '\u25bc  forge.list_tickets(status: "approved")', type: 'tool', delay: 300 },
  { text: '  Found 3 approved tickets', type: 'dim', delay: 500 },
  { text: '', type: 'empty', delay: 200 },

  { text: 'I found ticket AEC-2437 "Add webhook retry logic".', type: 'claude', delay: 400 },
  { text: 'Let me analyze the codebase for context.', type: 'claude', delay: 80 },
  { text: '', type: 'empty', delay: 300 },

  // Tool calls for analysis
  { text: '\u25bc  forge.get_repository_context()', type: 'tool', delay: 300 },
  { text: '  Scanned 4 relevant modules', type: 'dim', delay: 600 },
  { text: '  src/webhooks/dispatcher.ts', type: 'dim', delay: 150 },
  { text: '  src/webhooks/retry.ts', type: 'dim', delay: 150 },
  { text: '  src/queue/processor.ts', type: 'dim', delay: 150 },
  { text: '  src/config/webhook.config.ts', type: 'dim', delay: 150 },
  { text: '', type: 'empty', delay: 300 },

  { text: 'Based on the codebase, I have a question before', type: 'claude', delay: 400 },
  { text: 'we proceed:', type: 'claude', delay: 80 },
  { text: '', type: 'empty', delay: 200 },

  { text: 'The current dispatcher uses a fire-and-forget', type: 'claude', delay: 80 },
  { text: 'pattern. What retry strategy should failed', type: 'claude', delay: 80 },
  { text: 'webhooks use?', type: 'claude', delay: 80 },
  { text: '', type: 'empty', delay: 200 },
  { text: '  1. Exponential backoff with jitter (recommended)', type: 'dim', delay: 200 },
  { text: '  2. Fixed interval', type: 'dim', delay: 100 },
  { text: '  3. Linear backoff', type: 'dim', delay: 100 },
  { text: '', type: 'empty', delay: 600 },

  // User answers
  { text: '> 1 - exponential backoff with jitter', type: 'user', delay: 500 },
  { text: '', type: 'empty', delay: 400 },

  { text: 'Great choice. Creating your implementation branch', type: 'claude', delay: 300 },
  { text: 'and preparing the spec.', type: 'claude', delay: 80 },
  { text: '', type: 'empty', delay: 300 },

  { text: '\u25bc  forge.start_implementation(ticket: "AEC-2437")', type: 'tool', delay: 300 },
  { text: '', type: 'empty', delay: 600 },

  { text: '\u2714 Branch: feat/aec-2437-webhook-retry', type: 'success', delay: 400 },
  { text: '\u2714 Spec written with retry config, max attempts,', type: 'success', delay: 300 },
  { text: '  dead-letter queue, and monitoring hooks', type: 'success', delay: 80 },
  { text: '\u2714 Ready to implement — start coding!', type: 'success', delay: 300 },
];

export function TerminalAnimation() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [typingIndex, setTypingIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [visibleLines, typingIndex, scrollToBottom]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted.current) {
          hasStarted.current = true;
          runSequence();
        }
      },
      { threshold: 0.3 }
    );

    const el = containerRef.current;
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function runSequence() {
    let idx = 0;

    function next() {
      if (idx >= SEQUENCE.length) return;

      const line = SEQUENCE[idx];
      const currentIdx = idx;

      if (line.type === 'user') {
        setIsTyping(true);
        setTypingIndex(0);
        setVisibleLines(currentIdx + 1);

        let charIdx = 0;
        const iv = setInterval(() => {
          charIdx++;
          setTypingIndex(charIdx);
          if (charIdx >= line.text.length) {
            clearInterval(iv);
            setIsTyping(false);
            idx++;
            setTimeout(next, SEQUENCE[idx]?.delay ?? 500);
          }
        }, 40);
      } else {
        setVisibleLines(currentIdx + 1);
        idx++;
        setTimeout(next, SEQUENCE[idx]?.delay ?? 500);
      }
    }

    setTimeout(next, 600);
  }

  function lineClass(type: LineType) {
    switch (type) {
      case 'user': return 'text-[#e8e8e8] font-semibold';
      case 'claude': return 'text-[#c4c4c4]';
      case 'tool': return 'text-cyan-400 font-medium';
      case 'success': return 'text-emerald-400';
      case 'dim': return 'text-[#5a5a5a]';
      case 'accent': return 'text-amber-400';
      case 'empty': return '';
      case 'divider': return 'text-[#2a2a2a]';
    }
  }

  function renderLine(line: Line, index: number) {
    const isLast = index === visibleLines - 1;

    if (line.type === 'user' && isLast && isTyping) {
      const displayed = line.text.slice(0, typingIndex);
      return (
        <span className={lineClass(line.type)}>
          {displayed}
          <span className="inline-block w-[6px] h-[13px] bg-[#e8e8e8] ml-[1px] align-middle animate-pulse" />
        </span>
      );
    }

    if (line.type === 'empty') return <span className="block h-[10px]" />;

    return <span className={lineClass(line.type)}>{line.text}</span>;
  }

  return (
    <div ref={containerRef} className="rounded-xl border border-[var(--border-subtle)] bg-[#0c0c0c] overflow-hidden font-[var(--font-mono)] flex flex-col h-[380px]">
      {/* Claude Code top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1a1a1a] bg-[#111111] shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>
          <span className="ml-2 text-[11px] text-[#555] font-medium tracking-wide">Claude Code</span>
        </div>
        <span className="text-[10px] text-[#333]">forge-workspace</span>
      </div>

      {/* Scrolling content area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-hidden px-4 py-3 text-[12px] leading-[1.8]"
        style={{ maskImage: 'linear-gradient(transparent 0%, black 8%, black 92%, transparent 100%)' }}
      >
        {SEQUENCE.slice(0, visibleLines).map((line, i) => (
          <div key={i}>{renderLine(line, i)}</div>
        ))}
        {visibleLines === 0 && (
          <div className="text-[#555]">
            <span className="inline-block w-[6px] h-[13px] bg-[#555] animate-pulse" />
          </div>
        )}
      </div>

      {/* Bottom status bar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-[#1a1a1a] bg-[#0e0e0e] shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[#444]">Opus 4.6</span>
          <span className="text-[10px] text-emerald-600">●</span>
          <span className="text-[10px] text-[#333]">forge MCP connected</span>
        </div>
        <span className="text-[10px] text-[#333]">~/project</span>
      </div>
    </div>
  );
}
