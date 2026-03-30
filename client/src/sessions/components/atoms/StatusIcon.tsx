'use client';

import { Check, Loader2 } from 'lucide-react';

interface StatusIconProps {
  status: 'completed' | 'loading' | 'pending';
  size?: 'sm' | 'md';
  color?: 'emerald' | 'violet' | 'blue';
}

export function StatusIcon({ status, size = 'sm', color = 'emerald' }: StatusIconProps) {
  const sizeClass = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  const colorMap = {
    emerald: 'text-emerald-500',
    violet: 'text-violet-500',
    blue: 'text-blue-500',
  };

  switch (status) {
    case 'completed':
      return <Check className={`${sizeClass} ${colorMap[color]} shrink-0`} />;
    case 'loading':
      return <Loader2 className={`${sizeClass} ${colorMap[color]} animate-spin shrink-0`} />;
    case 'pending':
      return <div className={`${sizeClass} rounded-full bg-[var(--bg-hover)] shrink-0`} />;
  }
}
