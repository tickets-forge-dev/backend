'use client';

import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Textarea } from '@/core/components/ui/textarea';
import { PartyPopper, Send } from 'lucide-react';

interface FirstTicketCelebrationDialogProps {
  open: boolean;
  onClose: () => void;
}

export function FirstTicketCelebrationDialog({
  open,
  onClose,
}: FirstTicketCelebrationDialogProps) {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (open) {
      // Trigger confetti when dialog opens
      const duration = 3000;
      const animationEnd = Date.now() + duration;

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);

        // Confetti from left side
        confetti({
          particleCount,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa'],
        });

        // Confetti from right side
        confetti({
          particleCount,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa'],
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [open]);

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) {
      onClose();
      return;
    }

    setIsSubmitting(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      if (!API_URL) {
        throw new Error('API_URL not configured');
      }

      const response = await fetch(`${API_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'first_ticket_feedback',
          message: feedback,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setFeedback('');
      }, 2000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      // Still close the dialog even if feedback fails
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <PartyPopper className="h-6 w-6 text-[var(--primary)]" />
            <DialogTitle className="text-xl">
              🎉 Congratulations!
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-[var(--text-secondary)]">
            You&apos;ve created your first ticket with Forge! We&apos;d love to hear
            about your experience.
          </DialogDescription>
        </DialogHeader>

        {!submitted ? (
          <>
            <div className="space-y-3 py-4">
              <p className="text-xs text-[var(--text-tertiary)]">
                What did you think? Any feedback or suggestions?
              </p>
              <Textarea
                placeholder="Share your thoughts (optional)..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-[120px] resize-none"
                disabled={isSubmitting}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                size="sm"
              >
                Skip
              </Button>
              <Button
                onClick={handleSubmitFeedback}
                disabled={isSubmitting}
                size="sm"
                className="gap-2"
              >
                <Send className="h-3.5 w-3.5" />
                {isSubmitting ? 'Sending...' : 'Send Feedback'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm text-[var(--primary)] font-medium">
              ✓ Thank you for your feedback!
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
