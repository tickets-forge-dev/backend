'use client';

import { useState, useEffect } from 'react';
import { Settings, Loader2, Sparkles, Layers, FlaskConical, ShieldCheck, GitPullRequest, Gauge, ScanEye, Plug, ShieldAlert, FileText, Database, type LucideIcon } from 'lucide-react';
import { useSkillsStore } from '../../stores/skills.store';
import type { SkillCatalogItem } from '../../stores/skills.store';

const ICON_MAP: Record<string, LucideIcon> = { Layers, FlaskConical, ShieldCheck, GitPullRequest, Gauge, ScanEye, Plug, ShieldAlert, FileText, Database };

interface SkillPickerProps {
  ticketId: string;
}

function SkillIcon({ name }: { name: string }) {
  const Icon = ICON_MAP[name];
  if (!Icon) return <Settings className="w-4 h-4 text-[var(--text-tertiary)]" />;
  return <Icon className="w-4 h-4 text-[var(--text-tertiary)]" />;
}

export function SkillPicker({ ticketId }: SkillPickerProps) {
  const {
    catalog, recommended, selectedIds, mode,
    isLoadingCatalog, isLoadingRecommendations,
    fetchCatalog, fetchRecommendations, toggleSkill, setMode,
  } = useSkillsStore();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchCatalog();
    fetchRecommendations(ticketId);
  }, [ticketId, fetchCatalog, fetchRecommendations]);

  const effectiveIds = mode === 'auto'
    ? recommended.map(r => r.skillId)
    : selectedIds;
  const count = effectiveIds.length;
  const isLoading = isLoadingCatalog || isLoadingRecommendations;

  return (
    <div className="border border-[var(--border-subtle)] rounded-lg overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-[var(--bg-hover)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
          <span className="text-[12px] font-medium text-[var(--text-secondary)]">Skills</span>
        </div>
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="w-3 h-3 text-[var(--text-tertiary)] animate-spin" />
          ) : (
            <span className="text-[10px] text-[var(--text-tertiary)]">
              {mode === 'auto' ? `Auto · ${count} recommended` : `Manual · ${count} of 3`}
            </span>
          )}
          <span className="text-[10px] text-[var(--text-tertiary)]">{expanded ? '▴' : '▾'}</span>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-[var(--border-subtle)]">
          {/* Mode toggle */}
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-[var(--border-subtle)]">
            <div className="inline-flex rounded-md bg-[var(--bg-hover)] p-0.5">
              {(['auto', 'manual'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                    mode === m
                      ? 'bg-[var(--bg)] text-[var(--text)] shadow-sm'
                      : 'text-[var(--text-tertiary)]'
                  }`}
                >
                  {m === 'auto' ? 'Auto' : 'Manual'}
                </button>
              ))}
            </div>
            {mode === 'auto' && (
              <span className="text-[9px] text-[var(--text-tertiary)] flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> AI recommended
              </span>
            )}
          </div>

          {/* Skill cards */}
          <div className="divide-y divide-[var(--border-subtle)]">
            {catalog.map(skill => {
              const isSelected = effectiveIds.includes(skill.id);
              const isDisabled = !isSelected && effectiveIds.length >= 3 && mode === 'manual';
              const rec = recommended.find(r => r.skillId === skill.id);
              const isDimmedInAuto = mode === 'auto' && !rec;

              return (
                <div
                  key={skill.id}
                  className={`flex items-center gap-3 px-3.5 py-2.5 ${isDisabled || isDimmedInAuto ? 'opacity-35' : ''}`}
                >
                  <span className="shrink-0">
                    <SkillIcon name={skill.icon} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-medium text-[var(--text)]">{skill.name}</span>
                      {mode === 'auto' && rec && (
                        <span className="text-[8px] px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-medium">REC</span>
                      )}
                    </div>
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 line-clamp-1">{skill.description}</p>
                    {mode === 'auto' && rec && (
                      <p className="text-[9px] text-[var(--text-tertiary)]/60 mt-0.5 italic">{rec.reason}</p>
                    )}
                  </div>
                  <button
                    onClick={() => mode === 'manual' && !isDisabled && toggleSkill(skill.id)}
                    disabled={mode === 'auto' || isDisabled}
                    className="shrink-0"
                  >
                    <div className={`w-8 h-[18px] rounded-full transition-colors relative ${
                      isSelected ? 'bg-emerald-500' : 'bg-[var(--bg-hover)]'
                    } ${mode === 'auto' ? 'opacity-60' : ''}`}>
                      <div className={`w-[14px] h-[14px] rounded-full bg-white absolute top-[2px] transition-all ${
                        isSelected ? 'right-[2px]' : 'left-[2px]'
                      }`} />
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Max hint */}
          {mode === 'manual' && effectiveIds.length >= 3 && (
            <div className="px-3.5 py-2 text-center text-[9px] text-[var(--text-tertiary)] bg-[var(--bg-hover)]/50">
              Max 3 skills per session
            </div>
          )}
        </div>
      )}
    </div>
  );
}
