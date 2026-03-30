'use client';

import type { QuotaInfo } from '../../types/session.types';

interface QuotaDisplayProps {
  quota: QuotaInfo | null;
}

export function QuotaDisplay({ quota }: QuotaDisplayProps) {
  if (!quota) return null;
  return (
    <p className="text-[11px] text-[var(--text-tertiary)]">
      {quota.remaining} of {quota.limit} developments remaining &middot;{' '}
      <span className="text-violet-500">{quota.plan} plan</span>
    </p>
  );
}
