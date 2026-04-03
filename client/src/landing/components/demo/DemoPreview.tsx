'use client';

import { useState } from 'react';
import { ArrowLeft, ExternalLink, Play } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export function DemoPreview({ onBack }: Props) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-subtle)] shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Preview
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
            <ExternalLink className="w-3 h-3" />
            preview-feat-rate-limit.forge.app
          </div>
        </div>
      </div>

      {/* App preview */}
      <div className="flex-1 overflow-y-auto bg-[#0f1117]">
        {/* Loading state */}
        {!loaded && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Play className="w-4 h-4 text-emerald-500" fill="currentColor" />
            </div>
            <p className="text-[12px] text-[var(--text-tertiary)]">Loading preview...</p>
          </div>
        )}

        {/* Fake app UI - the rate limiter settings panel */}
        <div
          className={`p-5 transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0 absolute'}`}
          ref={(el) => {
            if (el && !loaded) setTimeout(() => setLoaded(true), 800);
          }}
        >
          {/* App header bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-violet-500/20 flex items-center justify-center">
                <span className="text-[10px] font-bold text-violet-400">A</span>
              </div>
              <span className="text-[13px] font-medium text-[var(--text)]">Acme API</span>
              <span className="text-[11px] text-[var(--text-tertiary)]">/</span>
              <span className="text-[13px] text-[var(--text-secondary)]">Rate Limiting</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium">Active</span>
          </div>

          {/* Settings card */}
          <div className="rounded-lg border border-[var(--border-subtle)] overflow-hidden mb-4">
            <div className="px-4 py-2.5 border-b border-[var(--border-subtle)]">
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium">Configuration</span>
            </div>
            <div className="divide-y divide-[var(--border-subtle)]">
              {[
                { label: 'Rate Limit', value: '100 req/min' },
                { label: 'Window Algorithm', value: 'sliding' },
                { label: 'Scope', value: 'per-IP' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[12px] text-[var(--text-secondary)]">{row.label}</span>
                  <span className="text-[12px] font-mono text-violet-400 bg-violet-500/8 px-2 py-0.5 rounded">{row.value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-[12px] text-[var(--text-secondary)]">Standard Headers</span>
                <div className="w-8 h-[18px] rounded-full bg-emerald-500 relative">
                  <div className="absolute top-[2px] right-[2px] w-[14px] h-[14px] rounded-full bg-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Response headers preview */}
          <div className="rounded-lg border border-[var(--border-subtle)] overflow-hidden mb-4">
            <div className="px-4 py-2.5 border-b border-[var(--border-subtle)]">
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium">Response Headers Preview</span>
            </div>
            <div className="bg-[#0d1117] px-4 py-3 font-mono text-[11px] leading-relaxed">
              <div><span className="text-blue-400">X-RateLimit-Limit:</span> <span className="text-[var(--text-secondary)]">100</span></div>
              <div><span className="text-blue-400">X-RateLimit-Remaining:</span> <span className="text-[var(--text-secondary)]">73</span></div>
              <div><span className="text-blue-400">X-RateLimit-Reset:</span> <span className="text-[var(--text-secondary)]">1712150460</span> <span className="text-[var(--text-tertiary)] italic">// resets in 38s</span></div>
              <div><span className="text-blue-400">Retry-After:</span> <span className="text-[var(--text-secondary)]">60</span> <span className="text-[var(--text-tertiary)] italic">// only on 429</span></div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex gap-4 rounded-lg border border-[var(--border-subtle)] px-4 py-3">
            {[
              { value: '847', label: 'Allowed', color: 'text-emerald-500' },
              { value: '23', label: 'Blocked', color: 'text-red-500' },
              { value: '97%', label: 'Success Rate', color: 'text-amber-500' },
              { value: '142', label: 'Unique IPs', color: 'text-[var(--text)]' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className={`text-[16px] font-semibold ${stat.color}`}>{stat.value}</div>
                <div className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
