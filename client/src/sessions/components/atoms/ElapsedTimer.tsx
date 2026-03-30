'use client';

interface ElapsedTimerProps {
  seconds: number;
}

export function ElapsedTimer({ seconds }: ElapsedTimerProps) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return (
    <span className="text-[11px] text-[var(--text-tertiary)]">
      {min}:{String(sec).padStart(2, '0')}
    </span>
  );
}
