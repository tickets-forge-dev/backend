'use client';

import type { LucideIcon } from 'lucide-react';

interface IconBadgeProps {
  icon: LucideIcon;
  color?: 'violet' | 'emerald' | 'blue';
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { container: 'w-6 h-6', icon: 'w-3.5 h-3.5' },
  md: { container: 'w-10 h-10', icon: 'w-5 h-5' },
  lg: { container: 'w-14 h-14', icon: 'w-6 h-6' },
};

const colorMap = {
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-500' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
};

export function IconBadge({ icon: Icon, color = 'violet', size = 'sm' }: IconBadgeProps) {
  const s = sizeMap[size];
  const c = colorMap[color];
  const rounded = size === 'lg' ? 'rounded-xl' : 'rounded-full';

  return (
    <div className={`${s.container} ${rounded} ${c.bg} flex items-center justify-center shrink-0`}>
      <Icon className={`${s.icon} ${c.text}`} />
    </div>
  );
}
