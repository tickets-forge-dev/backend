// DemoDevelopSession.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Terminal, FilePlus, FileText, Search, Check, Sparkles, X } from 'lucide-react';
import { DEMO_SESSION_EVENTS, DEMO_SESSION_SUMMARY } from './demo-data';
import type { DemoSessionEvent } from './demo-data';

interface Props {
  onComplete: () => void;
  onClose: () => void;
}

function ToolIcon({ tool }: { tool?: DemoSessionEvent['tool'] }) {
  switch (tool) {
    case 'bash': return <Terminal className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />;
    case 'file_create': return <FilePlus className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />;
    case 'file_edit': return <FileText className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />;
    case 'read': return <Search className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />;
    default: return <Sparkles className="w-3.5 h-3.5 text-violet-500" />;
  }
}

export function DemoDevelopSession({ onComplete, onClose }: Props) {
  const [visibleEvents, setVisibleEvents] = useState<DemoSessionEvent[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const eventTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Start elapsed timer
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

    // Schedule events
    DEMO_SESSION_EVENTS.forEach((event) => {
      const timer = setTimeout(() => {
        setVisibleEvents((prev) => [...prev, event]);
        // Auto-scroll
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        });
        if (event.type === 'summary') {
          setIsComplete(true);
          if (timerRef.current) clearInterval(timerRef.current);
          setElapsed(DEMO_SESSION_SUMMARY.durationSeconds);
        }
      }, event.delayMs);
      eventTimersRef.current.push(timer);
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      eventTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="absolute inset-y-0 right-0 w-[340px] bg-[var(--bg)] border-l border-[var(--border-subtle)] flex flex-col z-20">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] shrink-0">
        <div>
          <h3 className="text-[13px] font-medium text-[var(--text)]">Cloud Develop</h3>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5 truncate">Rate limit API responses to 100 req/min</p>
        </div>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-[var(--bg-hover)]">
          <X className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
        </button>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[12px] font-medium text-emerald-500">Complete</span>
            </>
          ) : (
            <>
              <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
              <span className="text-[12px] font-medium text-blue-400">Working...</span>
            </>
          )}
        </div>
        <span className="text-[11px] font-mono text-[var(--text-tertiary)] tabular-nums">{formatTime(elapsed)}</span>
      </div>

      {/* Events stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-2">
        {visibleEvents.map((event) => {
          if (event.type === 'provisioning') {
            return (
              <div key={event.id} className="flex items-center gap-2 text-[12px] text-[var(--text-tertiary)]">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                <span>{event.label}</span>
              </div>
            );
          }

          if (event.type === 'message') {
            return (
              <div key={event.id} className="flex gap-2 items-start">
                <div className="w-5 h-5 rounded-full bg-violet-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-3 h-3 text-violet-500" />
                </div>
                <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{event.label}</p>
              </div>
            );
          }

          if (event.type === 'tool_use') {
            return (
              <div key={event.id} className="ml-4">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] bg-[var(--bg-hover)]/50">
                  <ToolIcon tool={event.tool} />
                  <span className="text-[var(--text-secondary)] truncate flex-1 font-mono">{event.label}</span>
                  {event.isCreate && (
                    <span className="text-[10px] font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">new</span>
                  )}
                  {event.diff && (
                    <span className="flex gap-1 text-[10px]">
                      <span className="text-emerald-500">+{event.diff.additions}</span>
                      {event.diff.deletions > 0 && <span className="text-red-500">-{event.diff.deletions}</span>}
                    </span>
                  )}
                  <Check className="w-3 h-3 text-emerald-500" />
                </div>
                {event.content && (
                  <div className="ml-5 mt-1 rounded-md border border-[var(--border-subtle)] overflow-hidden">
                    <pre className="text-[10px] font-mono p-2 overflow-x-auto text-[var(--text-tertiary)] leading-relaxed whitespace-pre-wrap">
                      {event.content.split('\n').map((line, i) => (
                        <div key={i} className={
                          line.startsWith('+') ? 'text-emerald-400 bg-emerald-500/5' :
                          line.startsWith('-') ? 'text-red-400 bg-red-500/5' :
                          line.startsWith('  ✓') ? 'text-emerald-400' :
                          line.includes('passing') ? 'text-emerald-400' :
                          line.includes('github.com') ? 'text-blue-400' : ''
                        }>
                          {line}
                        </div>
                      ))}
                    </pre>
                  </div>
                )}
              </div>
            );
          }

          if (event.type === 'summary') {
            const s = DEMO_SESSION_SUMMARY;
            return (
              <div key={event.id} className="rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-3 space-y-2 mt-3">
                <div className="flex items-center gap-2 text-[12px] font-medium text-emerald-500">
                  <Check className="w-3.5 h-3.5" />
                  <span>Development complete</span>
                  <span className="text-emerald-500/50">·</span>
                  <span>{formatTime(s.durationSeconds)}</span>
                </div>
                <div className="flex gap-4 text-[11px]">
                  <div>
                    <div className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">Files</div>
                    <div className="text-[var(--text)] font-medium">{s.filesChanged}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">Changes</div>
                    <div className="font-medium">
                      <span className="text-emerald-500">+{s.additions}</span>
                      {s.deletions > 0 && <span className="text-red-500 ml-1">-{s.deletions}</span>}
                    </div>
                  </div>
                </div>
                <button
                  onClick={onComplete}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 transition-colors text-[12px] font-medium text-emerald-400 mt-1"
                >
                  View Change Record →
                </button>
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
