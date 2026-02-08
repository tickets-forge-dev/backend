'use client';

import { useEffect, useState } from 'react';

/**
 * HeroAnimation — Wide 3-step animated visualization for the landing page.
 * Shows: Codebase → Executable Ticket → Shipped to Dev
 */

// Simulated code lines that appear with typing effect
const CODE_LINES = [
  { indent: 0, text: 'src/', color: 'text-blue-400' },
  { indent: 1, text: 'tickets/', color: 'text-blue-300' },
  { indent: 2, text: 'controller.ts', color: 'text-emerald-400' },
  { indent: 2, text: 'service.ts', color: 'text-emerald-400' },
  { indent: 1, text: 'auth/', color: 'text-blue-300' },
  { indent: 2, text: 'guard.ts', color: 'text-emerald-400' },
  { indent: 0, text: 'package.json', color: 'text-amber-400' },
  { indent: 0, text: 'tsconfig.json', color: 'text-amber-400' },
];

// Ticket sections that fill in
const TICKET_SECTIONS = [
  { label: 'Problem Statement', color: 'bg-emerald-500' },
  { label: 'Solution Steps', color: 'bg-blue-500' },
  { label: 'API Endpoints', color: 'bg-purple-500' },
  { label: 'Test Plan', color: 'bg-amber-500' },
  { label: 'Visual QA', color: 'bg-pink-500' },
];

export function HeroAnimation() {
  const [cycle, setCycle] = useState(0);
  const [visibleLines, setVisibleLines] = useState(0);
  const [visibleSections, setVisibleSections] = useState(0);
  const [arrowPhase, setArrowPhase] = useState(0); // 0=hidden, 1=first arrow, 2=second arrow
  const [shipped, setShipped] = useState(false);

  useEffect(() => {
    // Reset all state at start of each cycle
    setVisibleLines(0);
    setVisibleSections(0);
    setArrowPhase(0);
    setShipped(false);

    // Phase 1: Code lines appear (0-1.6s)
    const lineTimers = CODE_LINES.map((_, i) =>
      setTimeout(() => setVisibleLines(i + 1), 300 + i * 160)
    );

    // Phase 2: First arrow appears (1.8s)
    const arrow1 = setTimeout(() => setArrowPhase(1), 1800);

    // Phase 3: Ticket sections fill in (2.0-3.5s)
    const sectionTimers = TICKET_SECTIONS.map((_, i) =>
      setTimeout(() => setVisibleSections(i + 1), 2200 + i * 250)
    );

    // Phase 4: Second arrow appears (3.8s)
    const arrow2 = setTimeout(() => setArrowPhase(2), 3800);

    // Phase 5: Shipped state (4.2s)
    const ship = setTimeout(() => setShipped(true), 4200);

    // Loop: trigger next cycle after pause
    const next = setTimeout(() => setCycle((c) => c + 1), 7500);

    return () => {
      lineTimers.forEach(clearTimeout);
      sectionTimers.forEach(clearTimeout);
      clearTimeout(arrow1);
      clearTimeout(arrow2);
      clearTimeout(ship);
      clearTimeout(next);
    };
  }, [cycle]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="relative flex items-stretch gap-0 rounded-xl border border-gray-800 bg-gray-950/80 overflow-hidden h-[200px]">

        {/* Step 1: Codebase */}
        <div className="flex-1 flex flex-col p-5 border-r border-gray-800/60">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded bg-blue-500/15 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Your Codebase</span>
          </div>

          {/* Code tree */}
          <div className="flex-1 font-mono text-[11px] leading-[18px] space-y-px overflow-hidden">
            {CODE_LINES.map((line, i) => (
              <div
                key={i}
                className={`transition-all duration-300 ${
                  i < visibleLines
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 -translate-x-3'
                }`}
                style={{ paddingLeft: `${line.indent * 12}px` }}
              >
                <span className={line.color}>{line.text}</span>
              </div>
            ))}
          </div>

          {/* Scanning indicator */}
          <div className={`flex items-center gap-1.5 mt-2 transition-opacity duration-500 ${visibleLines > 0 && visibleLines < CODE_LINES.length ? 'opacity-100' : 'opacity-0'}`}>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[10px] text-blue-400">Analyzing...</span>
          </div>
        </div>

        {/* Arrow 1 */}
        <div className="flex items-center justify-center w-12 flex-shrink-0">
          <div className={`flex flex-col items-center gap-1 transition-all duration-500 ${arrowPhase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>

        {/* Step 2: Executable Ticket */}
        <div className="flex-1 flex flex-col p-5 border-r border-gray-800/60">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded bg-emerald-500/15 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Executable Ticket</span>
          </div>

          {/* Ticket sections */}
          <div className="flex-1 space-y-1.5 overflow-hidden">
            {TICKET_SECTIONS.map((section, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 transition-all duration-400 ${
                  i < visibleSections
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-2'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${section.color} flex-shrink-0`} />
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-[11px] text-gray-300">{section.label}</span>
                  <div className={`flex-1 h-[3px] rounded-full overflow-hidden bg-gray-800`}>
                    <div
                      className={`h-full rounded-full ${section.color} transition-all duration-700 ease-out`}
                      style={{
                        width: i < visibleSections ? '100%' : '0%',
                        transitionDelay: `${i * 100}ms`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quality score */}
          <div className={`flex items-center gap-2 mt-2 transition-all duration-500 ${visibleSections >= TICKET_SECTIONS.length ? 'opacity-100' : 'opacity-0'}`}>
            <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              Score: 87/100
            </span>
          </div>
        </div>

        {/* Arrow 2 */}
        <div className="flex items-center justify-center w-12 flex-shrink-0">
          <div className={`flex flex-col items-center gap-1 transition-all duration-500 ${arrowPhase >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>

        {/* Step 3: Ship to Dev */}
        <div className="flex-1 flex flex-col p-5">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-6 h-6 rounded flex items-center justify-center transition-colors duration-500 ${shipped ? 'bg-emerald-500/15' : 'bg-gray-800'}`}>
              <svg className={`w-3.5 h-3.5 transition-colors duration-500 ${shipped ? 'text-emerald-400' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Ship to Dev</span>
          </div>

          {/* Integration targets */}
          <div className="flex-1 space-y-2.5">
            {[
              { name: 'Linear', icon: '◆', delay: 0 },
              { name: 'Jira', icon: '◈', delay: 150 },
              { name: 'GitHub', icon: '◉', delay: 300 },
            ].map((target, i) => (
              <div
                key={i}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all duration-500 ${
                  shipped
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-gray-800 bg-gray-900/50'
                }`}
                style={{ transitionDelay: shipped ? `${target.delay}ms` : '0ms' }}
              >
                <span className={`text-sm transition-colors duration-500 ${shipped ? 'text-emerald-400' : 'text-gray-600'}`}>
                  {target.icon}
                </span>
                <span className={`text-[11px] font-medium transition-colors duration-500 ${shipped ? 'text-gray-200' : 'text-gray-600'}`}>
                  {target.name}
                </span>
                {shipped && (
                  <svg className="w-3 h-3 text-emerald-400 ml-auto animate-in fade-in duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ animationDelay: `${target.delay + 200}ms` }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            ))}
          </div>

          {/* Shipped status */}
          <div className={`flex items-center gap-1.5 mt-2 transition-opacity duration-500 ${shipped ? 'opacity-100' : 'opacity-0'}`}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] text-emerald-400">Ready for development</span>
          </div>
        </div>
      </div>

      {/* Step labels below */}
      <div className="flex mt-4">
        <div className="flex-1 text-center">
          <span className="text-[11px] font-medium text-gray-500">1. Analyze</span>
        </div>
        <div className="w-12 flex-shrink-0" />
        <div className="flex-1 text-center">
          <span className="text-[11px] font-medium text-gray-500">2. Generate</span>
        </div>
        <div className="w-12 flex-shrink-0" />
        <div className="flex-1 text-center">
          <span className="text-[11px] font-medium text-gray-500">3. Ship</span>
        </div>
      </div>
    </div>
  );
}
