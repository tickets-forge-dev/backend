'use client';

import { useEffect } from 'react';
import { Play, Zap, ArrowRight } from 'lucide-react';
import { useSessionStore } from '../../stores/session.store';
import { useSkillsStore } from '../../stores/skills.store';
import { QuotaDisplay } from '../molecules/QuotaDisplay';
import { SkillPicker } from '../molecules/SkillPicker';

interface DevelopButtonProps {
  ticketId: string;
  ticketStatus: string;
  onStart: (skillIds?: string[]) => void;
  /** Number of file changes from the ticket's tech spec */
  fileChangeCount?: number;
  /** Repository full name (owner/repo) */
  repoFullName?: string;
  /** Branch that will be created */
  branch?: string;
}

export function DevelopButton({ ticketId, ticketStatus, onStart }: DevelopButtonProps) {
  const { status, quota, fetchQuota } = useSessionStore();
  const { getEffectiveSkillIds } = useSkillsStore();
  const isLoading = status === 'provisioning' || status === 'running';
  const isDisabled = isLoading;

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  const handleStart = () => {
    const skillIds = getEffectiveSkillIds();
    onStart(skillIds);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] px-6">
      <div className="w-full max-w-sm space-y-5">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 mb-1">
            <Zap className="w-5 h-5 text-emerald-500" />
          </div>
          <h3 className="text-[15px] font-semibold text-[var(--text)]">
            Start development
          </h3>
          <p className="text-[13px] text-[var(--text-tertiary)] leading-relaxed">
            AI will implement, test, and open a PR.
          </p>
        </div>

        {/* Skill Picker */}
        <SkillPicker ticketId={ticketId} />

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={isDisabled}
          className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--bg-hover)] border border-[var(--border-subtle)] hover:bg-[var(--bg-active)] text-[var(--text)] text-[13px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Play className="w-3.5 h-3.5" fill="currentColor" />
          Start Development
          <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-50" />
        </button>

        {/* Quota */}
        <QuotaDisplay quota={quota} />
      </div>
    </div>
  );
}
