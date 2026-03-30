'use client';

import { Sparkles } from 'lucide-react';
import { IconBadge } from '../atoms/IconBadge';

interface SessionMessageProps {
  content: string;
}

export function SessionMessage({ content }: SessionMessageProps) {
  return (
    <div className="flex gap-2.5 items-start">
      <div className="mt-0.5">
        <IconBadge icon={Sparkles} color="violet" size="sm" />
      </div>
      <div className="text-[13px] text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
}
