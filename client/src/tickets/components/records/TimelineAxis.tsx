'use client';

import { useRef, useEffect } from 'react';
import type { AECResponse } from '@/services/ticket.service';

interface TimelineAxisProps {
  tickets: AECResponse[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isCardMode: boolean;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function TimelineAxis({ tickets, selectedId, onSelect, isCardMode }: TimelineAxisProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to end (most recent) on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [tickets.length]);

  if (tickets.length === 0) return null;

  return (
    <div className="rounded-[10px] border border-[#8b5cf620] overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #110d1c 0%, #13101e 50%, var(--bg-subtle) 100%)' }}
    >
      {/* Subtle radial glow */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-1/2 h-[60px] bg-[radial-gradient(ellipse,#8b5cf60d,transparent_70%)]" />
        </div>

        <div ref={scrollRef} className="overflow-x-auto px-6 pt-6 pb-4 scrollbar-thin">
          <div className="relative min-w-max" style={{ minWidth: `${Math.max(tickets.length * 90, 300)}px` }}>
            {/* The glowing purple line */}
            <div
              className="absolute left-0 right-0 h-[1.5px]"
              style={{
                top: isCardMode ? '50%' : '24px',
                background: 'linear-gradient(90deg, var(--bg-hover), #7c3aed44 12%, #8b5cf6 40%, #a78bfa 55%, #8b5cf6 70%, #7c3aed44 88%, var(--bg-hover))',
                boxShadow: '0 0 6px #8b5cf622',
                transition: 'top 300ms ease-out',
              }}
            />

            {/* Dots / Cards */}
            <div className="relative flex justify-between" style={{ minHeight: isCardMode ? '120px' : '52px', transition: 'min-height 300ms ease-out' }}>
              {tickets.map((t, i) => {
                const cr = t.changeRecord!;
                const isSelected = t.id === selectedId;
                const isAbove = i % 2 === 0;
                const totalAdditions = cr.filesChanged.reduce((s, f) => s + f.additions, 0);
                const totalDeletions = cr.filesChanged.reduce((s, f) => s + f.deletions, 0);

                return (
                  <button
                    key={t.id}
                    onClick={() => onSelect(t.id)}
                    className="flex-1 flex flex-col items-center relative z-[1] group"
                    style={{
                      transitionDelay: `${i * 50}ms`,
                    }}
                  >
                    {/* DOT MODE */}
                    {!isCardMode && (
                      <>
                        <div className={`text-[8px] mb-[7px] transition-colors ${
                          isSelected ? 'text-[#c4b5fd] font-medium' : 'text-[#52525b]'
                        }`}>
                          {formatDate(cr.submittedAt)}
                        </div>
                        <div
                          className="rounded-full transition-all duration-300"
                          style={{
                            width: isSelected ? 8 : 6,
                            height: isSelected ? 8 : 6,
                            background: isSelected ? '#a78bfa' : '#8b5cf6',
                            boxShadow: isSelected
                              ? '0 0 0 2px #13101e, 0 0 0 3.5px #8b5cf644, 0 0 12px #8b5cf644'
                              : '0 0 4px #8b5cf633',
                            opacity: isSelected ? 1 : 0.7,
                          }}
                        />
                        <div className={`text-[7px] mt-[7px] max-w-[60px] truncate transition-colors ${
                          isSelected ? 'text-[#c4b5fd] font-medium' : 'text-[var(--text-tertiary)]'
                        }`}>
                          {t.title}
                        </div>
                      </>
                    )}

                    {/* CARD MODE */}
                    {isCardMode && (
                      <div className="flex flex-col items-center" style={{ minHeight: '120px' }}>
                        {/* Top area: card if above, date if below */}
                        <div className="flex-1 flex flex-col justify-end items-center pb-2">
                          {isAbove ? (
                            <div
                              className={`w-[100px] rounded-md border p-2 text-left transition-all duration-300 ${
                                isSelected
                                  ? 'border-[#8b5cf644] bg-[#8b5cf608]'
                                  : 'border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:border-[#8b5cf622]'
                              }`}
                            >
                              <div className={`text-[9px] font-medium truncate ${
                                isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                              }`}>{t.title}</div>
                              <div className="text-[7px] text-[var(--text-tertiary)] mt-0.5">
                                {cr.filesChanged.length} files
                                {(totalAdditions > 0 || totalDeletions > 0) && (
                                  <> · <span className="text-green-500">+{totalAdditions}</span> <span className="text-red-500">-{totalDeletions}</span></>
                                )}
                              </div>
                              {cr.hasDivergence && (
                                <div className="text-[7px] text-amber-500 mt-0.5">⚡ divergence</div>
                              )}
                            </div>
                          ) : (
                            <div className={`text-[7px] ${isSelected ? 'text-[#c4b5fd]' : 'text-[#52525b]'}`}>
                              {formatDate(cr.submittedAt)}
                            </div>
                          )}
                        </div>

                        {/* Dot on the line */}
                        <div
                          className="rounded-full shrink-0 transition-all duration-300"
                          style={{
                            width: isSelected ? 8 : 6,
                            height: isSelected ? 8 : 6,
                            background: isSelected ? '#a78bfa' : '#8b5cf6',
                            boxShadow: isSelected
                              ? '0 0 0 2px #13101e, 0 0 0 3.5px #8b5cf644, 0 0 12px #8b5cf644'
                              : '0 0 4px #8b5cf633',
                            opacity: isSelected ? 1 : 0.7,
                          }}
                        />

                        {/* Bottom area: date if above, card if below */}
                        <div className="flex-1 flex flex-col justify-start items-center pt-2">
                          {!isAbove ? (
                            <div
                              className={`w-[100px] rounded-md border p-2 text-left transition-all duration-300 ${
                                isSelected
                                  ? 'border-[#8b5cf644] bg-[#8b5cf608]'
                                  : 'border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:border-[#8b5cf622]'
                              }`}
                            >
                              <div className={`text-[9px] font-medium truncate ${
                                isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                              }`}>{t.title}</div>
                              <div className="text-[7px] text-[var(--text-tertiary)] mt-0.5">
                                {cr.filesChanged.length} files
                                {(totalAdditions > 0 || totalDeletions > 0) && (
                                  <> · <span className="text-green-500">+{totalAdditions}</span> <span className="text-red-500">-{totalDeletions}</span></>
                                )}
                              </div>
                              {cr.hasDivergence && (
                                <div className="text-[7px] text-amber-500 mt-0.5">⚡ divergence</div>
                              )}
                            </div>
                          ) : (
                            <div className={`text-[7px] ${isSelected ? 'text-[#c4b5fd]' : 'text-[#52525b]'}`}>
                              {formatDate(cr.submittedAt)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
