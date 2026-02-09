'use client';

import type { LucideIcon } from 'lucide-react';

interface MetricCellProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  className?: string;
}

export function MetricCell({ icon: Icon, label, value, className = '' }: MetricCellProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Icon className="h-4 w-4 text-[var(--text-tertiary)] flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase text-[var(--text-tertiary)] leading-tight">{label}</p>
        <p className="text-xs font-medium text-[var(--text)] truncate">{value}</p>
      </div>
    </div>
  );
}
