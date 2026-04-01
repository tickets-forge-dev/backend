'use client';

interface ProgressDotsProps {
  color?: 'violet' | 'emerald' | 'blue';
}

const colorMap = {
  violet: 'bg-violet-500',
  emerald: 'bg-emerald-500',
  blue: 'bg-blue-500',
};

export function ProgressDots({ color = 'violet' }: ProgressDotsProps) {
  const dotColor = colorMap[color];
  return (
    <div className="flex gap-1">
      <div className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-pulse`} />
      <div className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-pulse [animation-delay:150ms]`} />
      <div className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-pulse [animation-delay:300ms]`} />
    </div>
  );
}
