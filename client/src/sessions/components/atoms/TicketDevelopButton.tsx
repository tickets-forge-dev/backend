'use client';
import { Zap } from 'lucide-react';

interface TicketDevelopButtonProps {
  onClick: () => void;
  disabled?: boolean;
  status?: 'idle' | 'running' | 'completed';
}

export function TicketDevelopButton({ onClick, disabled = false, status = 'idle' }: TicketDevelopButtonProps) {
  if (status === 'completed') {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[12px] font-medium hover:bg-emerald-500/15 transition-colors"
      >
        <span className="text-[11px]">&#10003;</span>
        View Development
      </button>
    );
  }

  if (status === 'running') {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-violet-500/10 text-violet-500 text-[12px] font-medium hover:bg-violet-500/15 transition-colors"
      >
        <Zap className="w-3.5 h-3.5 animate-pulse" />
        Developing...
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-violet-500 text-white text-[12px] font-medium hover:bg-violet-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <Zap className="w-3.5 h-3.5" />
      Develop
    </button>
  );
}
