'use client';

import { MessageSquare, Clock, UserCheck } from 'lucide-react';

interface QAItem {
  question: string;
  answer: string;
}

interface ReviewSessionSectionProps {
  qaItems: QAItem[];
  submittedAt: string;
  developerName?: string | null;
}

/**
 * ReviewSessionSection (Story 6-12 / 7-6)
 *
 * Displays the Q&A pairs submitted by a developer via `forge review`.
 * Shows who reviewed, when, and the impact of each answer.
 */
export function ReviewSessionSection({ qaItems, submittedAt, developerName }: ReviewSessionSectionProps) {
  const formattedDate = new Date(submittedAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="space-y-4">
      {/* Reviewer header */}
      <div className="flex items-center gap-3 rounded-lg bg-[var(--bg-hover)]/40 border border-[var(--border-subtle)] px-4 py-3">
        <div className="w-7 h-7 rounded-full bg-violet-500/10 flex items-center justify-center flex-shrink-0">
          <UserCheck className="h-3.5 w-3.5 text-violet-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-[var(--text-secondary)]">
            {developerName ? (
              <><span className="font-medium text-[var(--text)]">{developerName}</span> reviewed this ticket</>
            ) : (
              'Developer reviewed this ticket'
            )}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Clock className="h-3 w-3 text-[var(--text-tertiary)]" />
            <span className="text-[11px] text-[var(--text-tertiary)]">{formattedDate}</span>
            <span className="text-[var(--text-tertiary)]/30 mx-1">&middot;</span>
            <span className="text-[11px] text-[var(--text-tertiary)]">{qaItems.length} question{qaItems.length !== 1 ? 's' : ''} answered</span>
          </div>
        </div>
      </div>

      {/* Q&A pairs */}
      <div className="space-y-3">
        {qaItems.map((item, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-[var(--border-subtle)] overflow-hidden"
          >
            {/* Question */}
            <div className="flex items-start gap-3 px-4 py-3 bg-[var(--bg-hover)]/30">
              <MessageSquare className="h-3.5 w-3.5 text-[var(--text-tertiary)] flex-shrink-0 mt-0.5" />
              <p className="text-[13px] text-[var(--text-secondary)]">{item.question}</p>
            </div>

            {/* Answer */}
            <div className="px-4 py-3">
              <p className="text-[13px] text-[var(--text)] whitespace-pre-wrap leading-relaxed">
                {item.answer || <span className="italic text-[var(--text-tertiary)]">No answer provided</span>}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
