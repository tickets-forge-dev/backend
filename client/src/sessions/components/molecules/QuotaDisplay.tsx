'use client';

import type { QuotaInfo } from '../../types/session.types';

interface QuotaDisplayProps {
  quota: QuotaInfo | null;
}

export function QuotaDisplay({ quota }: QuotaDisplayProps) {
  if (!quota) return null;

  const usedPercent = Math.round((quota.remaining / quota.limit) * 100);

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[var(--text-tertiary)]">
          {quota.remaining} developments left
        </span>
        <span className="text-[10px] text-[var(--text-tertiary)]">
          {quota.plan}
        </span>
      </div>
      <div className="h-1 rounded-full bg-[var(--bg-hover)] overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-500/60 transition-all duration-300"
          style={{ width: `${usedPercent}%` }}
        />
      </div>
    </div>
  );
}
