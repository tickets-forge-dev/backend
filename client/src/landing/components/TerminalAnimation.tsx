'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

type LineType = 'user' | 'claude' | 'tool' | 'success' | 'dim' | 'accent' | 'empty' | 'logo';

interface Line {
  text: string;
  type: LineType;
  delay: number;
}

/* ── Scene 1: plain terminal — forge login ─────────────────── */
const LOGIN_SEQUENCE: Line[] = [
  { text: '$ forge login', type: 'user', delay: 0 },
  { text: '', type: 'empty', delay: 500 },
  { text: '◆  FORGE', type: 'logo', delay: 300 },
  { text: '', type: 'empty', delay: 400 },
  { text: '   Code:  FORG-7K9X', type: 'accent', delay: 400 },
  { text: '   Paste this code in your browser', type: 'dim', delay: 300 },
  { text: '', type: 'empty', delay: 300 },
  { text: '   Waiting for login...', type: 'dim', delay: 1500 },
  { text: '', type: 'empty', delay: 600 },
  { text: '   ✔ Authenticated — alex@acme.dev', type: 'success', delay: 400 },
  { text: '   Org: Acme Engineering', type: 'dim', delay: 300 },
  { text: '', type: 'empty', delay: 1000 },
  { text: '$ claude', type: 'user', delay: 600 },
];

/* ── Scene 2: Claude Code — list tickets & develop ─────────── */
const CLAUDE_SEQUENCE: Line[] = [
  { text: '> /forge:tickets', type: 'user', delay: 0 },
  { text: '', type: 'empty', delay: 400 },
  { text: '▼  forge.list_tickets(status: "ready")', type: 'tool', delay: 300 },
  { text: '', type: 'empty', delay: 500 },
  { text: '  AEC-2437  Add webhook retry logic      Ready', type: 'dim', delay: 200 },
  { text: '  AEC-2501  Rate limiter for API v2       Ready', type: 'dim', delay: 150 },
  { text: '  AEC-2489  Fix email template rendering  Ready', type: 'dim', delay: 150 },
  { text: '', type: 'empty', delay: 300 },
  { text: '3 ready tickets. Which would you like to develop?', type: 'claude', delay: 300 },
  { text: '', type: 'empty', delay: 700 },
  { text: '> develop AEC-2437', type: 'user', delay: 0 },
  { text: '', type: 'empty', delay: 400 },
  { text: '▼  forge.start_implementation(ticket: "AEC-2437")', type: 'tool', delay: 300 },
  { text: '', type: 'empty', delay: 700 },
  { text: '✔ Branch: feat/aec-2437-webhook-retry', type: 'success', delay: 400 },
  { text: '✔ Spec loaded — 4 acceptance criteria', type: 'success', delay: 300 },
  { text: '✔ Ready to implement — start coding!', type: 'success', delay: 300 },
];

type Scene = 'login' | 'fading' | 'claude';

export function TerminalAnimation() {
  const [scene, setScene] = useState<Scene>('login');
  const [visibleLines, setVisibleLines] = useState(0);
  const [typingIndex, setTypingIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  const activeSequence = scene === 'claude' ? CLAUDE_SEQUENCE : LOGIN_SEQUENCE;
  const isLoginScene = scene !== 'claude';
  const isFading = scene === 'fading';

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
          startAnimation();
        }
      },
      { threshold: 0.3 }
    );

    const el = containerRef.current;
    if (el) observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Sequence runner (shared between both scenes) ── */
  function runSequence(sequence: Line[], onComplete: () => void) {
    let idx = 0;

    function next() {
      if (idx >= sequence.length) {
        onComplete();
        return;
      }

      const line = sequence[idx];
      const currentIdx = idx;

      if (line.type === 'user') {
        // Typing effect for user input lines
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
            setTimeout(next, sequence[idx]?.delay ?? 500);
          }
        }, 40);
      } else {
        setVisibleLines(currentIdx + 1);
        idx++;
        setTimeout(next, sequence[idx]?.delay ?? 500);
      }
    }

    setTimeout(next, 600);
  }

  /* ── Main animation: login → fade → Claude Code ── */
  function startAnimation() {
    // Phase 1: run the login sequence in a plain terminal
    runSequence(LOGIN_SEQUENCE, () => {
      // Pause after "$ claude" is typed, then cross-fade
      setTimeout(() => {
        setScene('fading');
        setTimeout(() => {
          // Reset state and switch to Claude Code scene
          setVisibleLines(0);
          setIsTyping(false);
          if (scrollRef.current) scrollRef.current.scrollTop = 0;
          setScene('claude');
          // Phase 2: run the Claude Code sequence
          runSequence(CLAUDE_SEQUENCE, () => {});
        }, 600); // wait for fade-out to complete
      }, 800); // brief pause after typing "$ claude"
    });
  }

  /* ── Styling ── */
  function lineClass(type: LineType) {
    switch (type) {
      case 'user': return 'text-[#e8e8e8] font-semibold';
      case 'claude': return 'text-[#c4c4c4]';
      case 'tool': return 'text-cyan-400 font-medium';
      case 'success': return 'text-emerald-400';
      case 'dim': return 'text-[#5a5a5a]';
      case 'accent': return 'text-amber-400 font-medium';
      case 'empty': return '';
      case 'logo': return 'text-amber-400 font-bold text-[14px] tracking-wider';
    }
  }

  function renderLine(line: Line, index: number) {
    const isLast = index === visibleLines - 1;

    // Typing cursor for user input
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

    // Forge emblem
    if (line.type === 'logo') {
      return (
        <span className={lineClass(line.type)}>
          <span className="text-amber-500">◆</span>{'  '}FORGE
        </span>
      );
    }

    return <span className={lineClass(line.type)}>{line.text}</span>;
  }

  return (
    <div
      ref={containerRef}
      className="rounded-xl border border-[var(--border-subtle)] bg-[#0c0c0c] overflow-hidden font-[var(--font-mono)] flex flex-col h-[380px]"
    >
      {/* ── Top bar: plain terminal vs Claude Code chrome ── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1a1a1a] bg-[#111111] shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>
          <span className="ml-2 text-[11px] text-[#555] font-medium tracking-wide">
            {isLoginScene ? 'Terminal' : 'Claude Code'}
          </span>
        </div>
        <span className="text-[10px] text-[#333]">
          {isLoginScene ? '~/project' : 'forge-workspace'}
        </span>
      </div>

      {/* ── Content area with cross-fade transition ── */}
      <div
        ref={scrollRef}
        className={`flex-1 overflow-hidden px-4 py-3 text-[12px] leading-[1.8] transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}
        style={{ maskImage: 'linear-gradient(transparent 0%, black 8%, black 92%, transparent 100%)' }}
      >
        {activeSequence.slice(0, visibleLines).map((line, i) => (
          <div key={`${scene}-${i}`}>{renderLine(line, i)}</div>
        ))}
        {visibleLines === 0 && !isFading && (
          <div className="text-[#555]">
            <span className="inline-block w-[6px] h-[13px] bg-[#555] animate-pulse" />
          </div>
        )}
      </div>

      {/* ── Bottom status bar ── */}
      {scene === 'claude' ? (
        <div className="flex items-center justify-between px-4 py-1.5 border-t border-[#1a1a1a] bg-[#0e0e0e] shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[#444]">Opus 4.6</span>
            <span className="text-[10px] text-emerald-600">●</span>
            <span className="text-[10px] text-[#333]">forge MCP connected</span>
          </div>
          <span className="text-[10px] text-[#333]">~/project</span>
        </div>
      ) : (
        <div className="flex items-center justify-between px-4 py-1.5 border-t border-[#1a1a1a] bg-[#0e0e0e] shrink-0">
          <span className="text-[10px] text-[#333]">zsh</span>
          <span className="text-[10px] text-[#333]">~/project</span>
        </div>
      )}
    </div>
  );
}
