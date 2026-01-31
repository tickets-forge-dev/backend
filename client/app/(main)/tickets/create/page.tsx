'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';
import { useTicketsStore } from '@/stores/tickets.store';

export default function CreateTicketPage() {
  const router = useRouter();
  const { createTicket, isCreating, createError, clearCreateError } = useTicketsStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Form validation - title must be at least 3 characters
  const isValid = title.trim().length >= 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) return;

    clearCreateError();

    const aec = await createTicket(title.trim(), description.trim() || undefined);

    if (aec) {
      // Success - navigate to ticket detail page
      router.push(`/tickets/${aec.id}`);
    }
    // Error state handled by store - displayed below
  };

  const handleCancel = () => {
    router.push('/tickets');
  };

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
              htmlFor="title"
              className="block text-[var(--text-sm)] font-medium text-[var(--text)] mb-2"
            >
              Title
            </label>
            <Input
              id="title"
              placeholder="Add user authentication..."
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isCreating}
              autoFocus
            />
            {title.length > 0 && title.length < 3 && (
              <p className="mt-1 text-[var(--text-xs)] text-[var(--text-tertiary)]">
                Minimum 3 characters required
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-[var(--text-sm)] font-medium text-[var(--text)] mb-2"
            >
              Description <span className="text-[var(--text-tertiary)]">(optional)</span>
            </label>
            <Textarea
              id="description"
              placeholder="Add context to help generate a better ticket..."
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isCreating}
            />
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

