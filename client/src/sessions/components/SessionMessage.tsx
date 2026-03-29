'use client';

import { Sparkles } from 'lucide-react';

interface SessionMessageProps {
  content: string;
}

export function SessionMessage({ content }: SessionMessageProps) {
  return (
    <div className="flex gap-2.5 items-start">
      <div className="w-6 h-6 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles className="w-3.5 h-3.5 text-violet-500" />
      </div>
      <div className="text-[13px] text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
}
