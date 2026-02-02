'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';
import { useTicketsStore } from '@/stores/tickets.store';
import { GenerationProgress } from '@/src/tickets/components/GenerationProgress';
import { RepositorySelector } from '@/src/tickets/components/RepositorySelector';
import { BranchSelector } from '@/src/tickets/components/BranchSelector';
import { useAuthStore } from '@/stores/auth.store';

export default function CreateTicketPage() {
  const router = useRouter();
  const { createTicket, isCreating, createError, clearCreateError } = useTicketsStore();
  const { user } = useAuthStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [createdAecId, setCreatedAecId] = useState<string | null>(null);

  // Form validation - title must be at least 3 characters
  const isValid = title.trim().length >= 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) return;

    clearCreateError();

    const aec = await createTicket(title.trim(), description.trim() || undefined);

    if (aec) {
      // Success - show generation progress
      setCreatedAecId(aec.id);
    }
    // Error state handled by store - displayed below
  };

  const handleGenerationComplete = () => {
    console.log('🎉 [CreateTicketPage] User clicked View Ticket, navigating to detail');
    if (createdAecId) {
      router.push(`/tickets/${createdAecId}`);
    }
  };

  const handleCancel = () => {
    router.push('/tickets');
  };

  // Show generation progress after ticket created
  if (createdAecId && user) {
    // Match backend's workspace ID format: ws_{first 12 chars of uid}
    const workspaceId = `ws_${user.uid.substring(0, 12)}`;
    
    return (
      <div className="mx-auto max-w-[var(--content-max)]">
        <div className="mb-8">
          <h1 className="text-[var(--text-xl)] font-medium text-[var(--text)]">
            Generating Ticket
          </h1>
          <p className="mt-1 text-[var(--text-sm)] text-[var(--text-secondary)]">
            AI is analyzing your request and building an executable ticket
          </p>
        </div>

        <GenerationProgress
          aecId={createdAecId}
          workspaceId={workspaceId}
          onComplete={handleGenerationComplete}
          showContinueButton={true}
        />
      </div>
    );
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

