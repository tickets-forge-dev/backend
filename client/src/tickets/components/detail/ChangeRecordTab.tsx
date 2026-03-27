'use client';

import { useState } from 'react';
import type { ChangeRecordResponse } from '@/services/ticket.service';
import { DivergenceCard } from './DivergenceCard';

interface ChangeRecordTabProps {
  ticketId: string;
  changeRecord: ChangeRecordResponse;
  onReviewDelivery: (action: 'accept' | 'request_changes', note?: string) => Promise<void>;
}

export function ChangeRecordTab({ ticketId, changeRecord, onReviewDelivery }: ChangeRecordTabProps) {
  const [loading, setLoading] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      await onReviewDelivery('accept');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!rejectNote.trim()) return;
    setLoading(true);
    try {
      await onReviewDelivery('request_changes', rejectNote);
    } finally {
      setLoading(false);
    }
  };

  const isAwaitingReview = changeRecord.status === 'awaiting_review';

  return (
    <div className="space-y-5">
      {/* Status Banner */}
      <div className={`rounded-lg p-3.5 flex items-center justify-between border ${
        isAwaitingReview
          ? 'bg-amber-500/5 border-amber-500/15'
          : changeRecord.status === 'accepted'
            ? 'bg-green-500/5 border-green-500/15'
            : 'bg-red-500/5 border-red-500/15'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full ${
            isAwaitingReview ? 'bg-amber-500' : changeRecord.status === 'accepted' ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-sm text-[var(--text-secondary)]">
            {isAwaitingReview ? 'Awaiting PM review' : changeRecord.status === 'accepted' ? 'Accepted' : 'Changes requested'}
          </span>
        </div>
        {isAwaitingReview && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowRejectForm(!showRejectForm)}
              disabled={loading}
              className="bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] px-3 py-1.5 rounded-md text-[13px] hover:bg-[var(--bg-active)] transition-colors"
            >
              Request Changes
            </button>
            <button
              onClick={handleAccept}
              disabled={loading}
              className="bg-green-600 text-white px-3 py-1.5 rounded-md text-[13px] font-medium hover:bg-green-700 transition-colors"
            >
              Accept
            </button>
          </div>
        )}
      </div>

      {/* Reject form */}
      {showRejectForm && isAwaitingReview && (
        <div className="border border-[var(--border-subtle)] rounded-lg p-3.5 space-y-2.5">
          <textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="What needs to change?"
            className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-md p-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] resize-none"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowRejectForm(false)}
              className="text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            >
              Cancel
            </button>
            <button
              onClick={handleRequestChanges}
              disabled={loading || !rejectNote.trim()}
              className="bg-red-600 text-white px-3 py-1.5 rounded-md text-[13px] font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              Send Back
            </button>
          </div>
        </div>
      )}

      {/* Review note (if changes were requested) */}
      {changeRecord.reviewNote && (
        <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-3.5">
          <div className="text-[12px] uppercase tracking-wider text-red-500/60 mb-1">Changes Requested</div>
          <div className="text-[13px] text-[var(--text-secondary)]">{changeRecord.reviewNote}</div>
        </div>
      )}

      {/* Execution Summary */}
      <div className="border border-[var(--border-subtle)] rounded-lg p-4">
        <div className="text-sm font-semibold text-[var(--text-primary)] mb-2">Execution Summary</div>
        <div className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
          {changeRecord.executionSummary}
        </div>
      </div>

      {/* Divergences */}
      {changeRecord.divergences.length > 0 && (
        <div className="space-y-2.5">
          <div className="text-sm font-semibold text-[var(--text-primary)]">
            Divergences ({changeRecord.divergences.length})
          </div>
          {changeRecord.divergences.map((d, i) => (
            <DivergenceCard key={i} divergence={d} />
          ))}
        </div>
      )}

      {/* Decisions / Risks / Scope Changes */}
      {(changeRecord.decisions.length > 0 || changeRecord.risks.length > 0 || changeRecord.scopeChanges.length > 0) && (
        <div className="border border-[var(--border-subtle)] rounded-lg p-4 space-y-3">
          <div className="text-sm font-semibold text-[var(--text-primary)]">Execution Events</div>
          {changeRecord.decisions.map((e) => (
            <div key={e.id} className="flex gap-2 text-[13px]">
              <span className="text-purple-500 shrink-0">💡</span>
              <div>
                <span className="font-medium text-[var(--text-primary)]">{e.title}</span>
                <span className="text-[var(--text-tertiary)]"> — {e.description}</span>
              </div>
            </div>
          ))}
          {changeRecord.risks.map((e) => (
            <div key={e.id} className="flex gap-2 text-[13px]">
              <span className="text-amber-500 shrink-0">⚠️</span>
              <div>
                <span className="font-medium text-[var(--text-primary)]">{e.title}</span>
                <span className="text-[var(--text-tertiary)]"> — {e.description}</span>
              </div>
            </div>
          ))}
          {changeRecord.scopeChanges.map((e) => (
            <div key={e.id} className="flex gap-2 text-[13px]">
              <span className="text-blue-500 shrink-0">📐</span>
              <div>
                <span className="font-medium text-[var(--text-primary)]">{e.title}</span>
                <span className="text-[var(--text-tertiary)]"> — {e.description}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File Changes */}
      {changeRecord.filesChanged.length > 0 && (
        <div className="border border-[var(--border-subtle)] rounded-lg overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-[var(--text-primary)]">Code Changes</div>
            <span className="text-[12px] text-[var(--text-tertiary)] bg-[var(--bg-hover)] px-2 py-0.5 rounded-full">
              {changeRecord.filesChanged.length} files
            </span>
          </div>
          <div className="border-t border-[var(--border-subtle)] px-4 py-2 space-y-1">
            {changeRecord.filesChanged.map((f, i) => (
              <div key={i} className="flex justify-between items-center text-[12px] font-mono">
                <span className="text-[var(--text-tertiary)] truncate">{f.path}</span>
                <span className="shrink-0 ml-3">
                  {f.additions > 0 && <span className="text-green-500">+{f.additions}</span>}
                  {f.deletions > 0 && <span className="text-red-500 ml-1.5">-{f.deletions}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
