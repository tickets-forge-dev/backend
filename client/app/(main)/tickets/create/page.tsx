'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Textarea } from '@/core/components/ui/textarea';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';
import { useTicketsStore } from '@/stores/tickets.store';
import { RepositorySelector } from '@/src/tickets/components/RepositorySelector';
import { BranchSelector } from '@/src/tickets/components/BranchSelector';

export default function CreateTicketPage() {
  const router = useRouter();
  const { createTicket, isCreating, createError, clearCreateError } = useTicketsStore();

  const [description, setDescription] = useState('');
  const [createdAecId, setCreatedAecId] = useState<string | null>(null);

  // Form validation - description must be at least 3 characters
  const isValid = description.trim().length >= 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) return;

    clearCreateError();

    // Use description as both title and description for the ticket
    const descriptionTrimmed = description.trim();
    const aec = await createTicket(descriptionTrimmed, descriptionTrimmed);

    if (aec) {
      // Success - show generation progress
      setCreatedAecId(aec.id);
    }
    // Error state handled by store - displayed below
  };

  const handleCancel = () => {
    router.push('/tickets');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Alt + Enter to submit
    if (e.altKey && e.key === 'Enter' && isValid && !isCreating) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // After ticket created, navigate to ticket detail
  if (createdAecId) {
    router.push(`/tickets/${createdAecId}`);
    return null;
  }

  return (
    <div className="mx-auto max-w-[var(--content-narrow)]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[var(--text-xl)] font-medium text-[var(--text)]">
          Create Ticket
        </h1>
        <p className="mt-1 text-[var(--text-sm)] text-[var(--text-secondary)]">
          Provide minimal intent to generate an executable ticket
        </p>
      </div>

      {/* Error message */}
      {createError && (
        <Card className="mb-6 p-4 border-[var(--red)] bg-red-50 dark:bg-red-950/20">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-[var(--text-sm)] font-medium text-[var(--red)]">
                Failed to create ticket
              </p>
              <p className="mt-1 text-[var(--text-sm)] text-[var(--text-secondary)]">
                {createError}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCreateError}
              className="text-[var(--red)]"
            >
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      {/* Minimal centered form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="description"
              className="block text-[var(--text-sm)] font-medium text-[var(--text)] mb-2"
            >
              Describe your ticket, what are we doing?
            </label>
            <Textarea
              id="description"
              placeholder="Add user authentication to the login flow..."
              rows={8}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isCreating}
              autoFocus
              required
            />
            {description.length > 0 && description.length < 3 && (
              <p className="mt-1 text-[var(--text-xs)] text-[var(--text-tertiary)]">
                Minimum 3 characters required
              </p>
            )}
          </div>

          {/* Repository & Branch Section (AC#5, Task 8) */}
          <div className="border-t border-[var(--border)] pt-6 space-y-4">
            <div>
              <h3 className="text-[var(--text-sm)] font-medium text-[var(--text)] mb-1">
                Repository Context{' '}
                <span className="text-[var(--text-tertiary)] font-normal">(optional)</span>
              </h3>
              <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] mb-4">
                Select a repository for code-aware ticket generation
              </p>
            </div>
            <RepositorySelector />
            <BranchSelector />
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isCreating}>
              {isCreating ? 'Creating...' : 'Generate Ticket'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

