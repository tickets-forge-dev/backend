'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AECResponse } from '@/services/ticket.service';
import { DivergenceCard } from '../detail/DivergenceCard';
import { ExternalLink } from 'lucide-react';

interface RecordDetailPanelProps {
  ticket: AECResponse;
  onReviewDelivery: (ticketId: string, action: 'accept' | 'request_changes', note?: string) => Promise<void>;
}

export function RecordDetailPanel({ ticket, onReviewDelivery }: RecordDetailPanelProps) {
  const router = useRouter();
  const cr = ticket.changeRecord!;
  const [loading, setLoading] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const isAwaitingReview = cr.status === 'awaiting_review';

  const handleAccept = async () => {
    setLoading(true);
    try {
      await onReviewDelivery(ticket.id, 'accept');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!rejectNote.trim()) return;
    setLoading(true);
    try {
      await onReviewDelivery(ticket.id, 'request_changes', rejectNote);
      setRejectNote('');
      setShowRejectForm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-primary)] overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 border-b border-[var(--border-subtle)]">
        <div className="min-w-0">
          <button
            onClick={() => router.push(`/tickets/${ticket.slug || ticket.id}`)}
            className="text-[15px] font-semibold text-[var(--text-primary)] hover:text-purple-400 transition-colors inline-flex items-center gap-1.5"
          >
            {ticket.title}
            <ExternalLink className="w-3.5 h-3.5 opacity-40 shrink-0" />
          </button>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full shrink-0 ${
              isAwaitingReview ? 'bg-amber-500' : cr.status === 'accepted' ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className={`text-[12px] ${
              isAwaitingReview ? 'text-amber-500/70' : cr.status === 'accepted' ? 'text-green-500/70' : 'text-red-500/70'
            }`}>
              {isAwaitingReview ? 'Awaiting PM review' : cr.status === 'accepted' ? 'Accepted' : 'Changes requested'}
            </span>
            <span className="text-[12px] text-[var(--text-tertiary)]">
              · Delivered {new Date(cr.submittedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        {isAwaitingReview && (
          <div className="flex gap-2 shrink-0">
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
        <div className="px-4 sm:px-5 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-hover)]">
          <textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="What needs to change?"
            className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-md p-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] resize-none"
            rows={3}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setShowRejectForm(false)}
              className="text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
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

      {/* Review note */}
      {cr.reviewNote && (
        <div className="px-4 sm:px-5 py-3 border-b border-[var(--border-subtle)] bg-red-500/[0.03]">
          <div className="text-[11px] uppercase tracking-wider text-red-500/60 mb-1">Changes Requested</div>
          <div className="text-[13px] text-[var(--text-secondary)]">{cr.reviewNote}</div>
        </div>
      )}

      {/* Body: main + sidebar */}
      <div className="px-4 sm:px-5 py-4 flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5 font-semibold">
              Execution Summary
            </div>
            <div className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
              {cr.executionSummary}
            </div>
          </div>

          {cr.divergences.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">
                Divergences ({cr.divergences.length})
              </div>
              {cr.divergences.map((d, i) => (
                <DivergenceCard key={i} divergence={d} />
              ))}
            </div>
          )}

          {cr.filesChanged.length > 0 && (
            <div className="border-t border-[var(--border-subtle)] pt-4">
              <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] mb-2 font-semibold">
                Code Changes
                <span className="font-normal ml-2">{cr.filesChanged.length} files</span>
              </div>
              <div className="space-y-0.5">
                {cr.filesChanged.map((f, i) => (
                  <div key={i} className="flex justify-between items-center text-[12px] font-mono py-0.5">
                    <span className="text-[var(--text-tertiary)] truncate">{f.path}</span>
                    <span className="shrink-0 ml-3">
                      {f.additions > 0 && <span className="text-green-500">+{f.additions}</span>}
                      {f.deletions > 0 && <span className="text-red-500 ml-1.5">−{f.deletions}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: events */}
        {(cr.decisions.length > 0 || cr.risks.length > 0 || cr.scopeChanges.length > 0) && (
          <div className="w-full lg:w-[260px] shrink-0 border-t lg:border-t-0 lg:border-l border-[var(--border-subtle)] pt-4 lg:pt-0 lg:pl-6">
            <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] mb-3 font-semibold">
              Execution Events
            </div>
            <div className="space-y-2.5">
              {cr.decisions.map((e) => (
                <div key={e.id} className="flex gap-2 text-[12px]">
                  <span className="text-purple-400 shrink-0">💡</span>
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">{e.title}</div>
                    <div className="text-[var(--text-tertiary)] mt-0.5">{e.description}</div>
                  </div>
                </div>
              ))}
              {cr.risks.map((e) => (
                <div key={e.id} className="flex gap-2 text-[12px]">
                  <span className="text-amber-500 shrink-0">⚠️</span>
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">{e.title}</div>
                    <div className="text-[var(--text-tertiary)] mt-0.5">{e.description}</div>
                  </div>
                </div>
              ))}
              {cr.scopeChanges.map((e) => (
                <div key={e.id} className="flex gap-2 text-[12px]">
                  <span className="text-blue-400 shrink-0">📐</span>
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">{e.title}</div>
                    <div className="text-[var(--text-tertiary)] mt-0.5">{e.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
