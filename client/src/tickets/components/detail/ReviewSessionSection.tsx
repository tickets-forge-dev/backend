'use client';

import { MessageSquare, Clock } from 'lucide-react';

interface QAItem {
  question: string;
  answer: string;
}

interface ReviewSessionSectionProps {
  qaItems: QAItem[];
  submittedAt: string;
}

/**
 * ReviewSessionSection (Story 6-12 / 7-6)
 *
 * Displays the Q&A pairs submitted by a developer via `forge review`.
 * Shown when ticket status is WAITING_FOR_APPROVAL.
 * Read-only — the PM reviews these answers before re-baking.
 */
export function ReviewSessionSection({ qaItems, submittedAt }: ReviewSessionSectionProps) {
  const formattedDate = new Date(submittedAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
        <Clock className="h-3.5 w-3.5" />
        <span>Submitted by developer on {formattedDate}</span>
      </div>

      <div className="space-y-3">
        {qaItems.map((item, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-[var(--border)] overflow-hidden"
          >
            {/* Question */}
            <div className="flex items-start gap-3 px-4 py-3 bg-[var(--bg-secondary)]">
              <MessageSquare className="h-4 w-4 text-[var(--text-tertiary)] flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-[var(--text)]">{item.question}</p>
            </div>

            {/* Answer */}
            <div className="px-4 py-3 bg-[var(--bg)]">
              <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                {item.answer || <span className="italic text-[var(--text-tertiary)]">No answer provided</span>}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
