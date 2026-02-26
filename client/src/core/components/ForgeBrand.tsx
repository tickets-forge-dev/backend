'use client';

interface ForgeBrandProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'text-[20px]',
  md: 'text-[32px]',
  lg: 'text-[48px]',
} as const;

export function ForgeBrand({ size = 'md', className = '' }: ForgeBrandProps) {
  return (
    <span
      className={`font-bold tracking-tight font-[family-name:var(--font-unbounded)] ${sizeMap[size]} ${className}`}
    >
      Forge
    </span>
  );
}
