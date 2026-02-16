'use client';

import { useState } from 'react';
import { X, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { getFeedbackService, type FeedbackType } from '@/services/feedback.service';

interface FeedbackDialogProps {
  open: boolean;
  onClose: () => void;
}

export function FeedbackDialog({ open, onClose }: FeedbackDialogProps) {
  const [type, setType] = useState<FeedbackType>('improvement');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      setErrorMessage('Please enter your feedback');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const feedbackService = getFeedbackService();
      const currentUrl = typeof window !== 'undefined' ? window.location.href : undefined;

      await feedbackService.submitFeedback({
        type,
        message: message.trim(),
        url: currentUrl,
      });

      setSubmitStatus('success');
      setMessage('');
      setType('improvement');

      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose();
        setSubmitStatus('idle');
      }, 2000);
    } catch (error: any) {
      setSubmitStatus('error');
      setErrorMessage(error.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setMessage('');
      setType('improvement');
      setSubmitStatus('idle');
      setErrorMessage('');
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-[var(--card-bg)] p-6 shadow-lg">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text)]">
            Send us your feedback
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded p-1 hover:bg-[var(--bg-secondary)] disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success State */}
        {submitStatus === 'success' && (
          <div className="flex flex-col items-center gap-3 rounded-lg bg-green-500/10 p-4">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            <p className="text-center text-sm font-medium text-green-600 dark:text-green-400">
              Thank you for your feedback!
            </p>
          </div>
        )}

        {/* Form */}
        {submitStatus !== 'success' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text)]">
                Feedback Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['bug', 'feature', 'improvement', 'other'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    disabled={isSubmitting}
                    className={`rounded px-3 py-2 text-sm font-medium transition ${
                      type === t
                        ? 'bg-blue-600 text-white'
                        : 'border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text)] hover:bg-[var(--bg-tertiary)]'
                    } disabled:opacity-50`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text)]">
                Your Message
              </label>
              <textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setErrorMessage('');
                }}
                disabled={isSubmitting}
                placeholder="Tell us what you think..."
                className="w-full resize-none rounded border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text)] placeholder-[var(--text-secondary)] outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                rows={4}
              />
              {errorMessage && (
                <div className="flex items-center gap-2 rounded bg-red-500/10 p-2">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <p className="text-xs text-red-600 dark:text-red-400">{errorMessage}</p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="flex w-full items-center justify-center gap-2 rounded bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Sending...' : 'Send Feedback'}
            </button>
          </form>
        )}

        {/* Footer Text */}
        <p className="mt-4 text-xs text-[var(--text-secondary)]">
          Your feedback helps us improve Forge. We read every submission! 💙
        </p>
      </div>
    </>
  );
}
