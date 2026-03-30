'use client';
import { Play, Loader2, CheckCircle2 } from 'lucide-react';

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
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[12px] font-medium hover:bg-emerald-500/15 transition-colors border border-emerald-500/20"
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        View Development
      </button>
    );
  }

  if (status === 'running') {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[12px] font-medium hover:bg-emerald-500/15 transition-colors border border-emerald-500/20"
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Developing...
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 text-white text-[12px] font-medium hover:bg-emerald-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <Play className="w-3.5 h-3.5" fill="currentColor" />
      Develop
    </button>
  );
}
