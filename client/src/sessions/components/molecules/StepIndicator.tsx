'use client';

import type { LucideIcon } from 'lucide-react';
import { StatusIcon } from '../atoms/StatusIcon';

interface StepIndicatorProps {
  icon: LucideIcon;
  label: string;
  status: 'completed' | 'active' | 'pending';
}

export function StepIndicator({ icon: Icon, label, status }: StepIndicatorProps) {
  const bgClass = status === 'active'
    ? 'bg-violet-500/5 border border-violet-500/10'
    : status === 'completed'
      ? 'bg-emerald-500/5'
      : '';

  return (
    <div className={`flex items-center gap-3 px-3.5 py-2.5 rounded-md ${bgClass}`}>
      {status === 'completed' ? (
        <StatusIcon status="completed" size="md" />
      ) : status === 'active' ? (
        <StatusIcon status="loading" size="md" color="violet" />
      ) : (
        <StatusIcon status="pending" size="md" />
      )}
      <span className={`text-[13px] ${status === 'active' ? 'text-[var(--text-primary)]' : status === 'completed' ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)]'}`}>
        {label}
      </span>
    </div>
  );
}
