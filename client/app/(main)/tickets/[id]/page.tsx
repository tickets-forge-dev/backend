'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Loader2, ArrowLeft, Trash2, AlertTriangle } from 'lucide-react';
import { useTicketsStore } from '@/stores/tickets.store';
import { InlineEditableList } from '@/src/tickets/components/InlineEditableList';
import { ValidationResults } from '@/src/tickets/components/ValidationResults';

interface TicketDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function TicketDetailPage({ params }: TicketDetailPageProps) {
  const router = useRouter();
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { currentTicket, isLoading, fetchError, isDeleting, fetchTicket, updateTicket, deleteTicket } = useTicketsStore();

  // Unwrap params (Next.js 15 async params)
  useEffect(() => {
    params.then(({ id }) => setTicketId(id));
  }, [params]);

  // Fetch ticket when ID is available
  useEffect(() => {
    if (ticketId) {
      fetchTicket(ticketId);
    }
  }, [ticketId, fetchTicket]);

  if (isLoading || !ticketId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  if (fetchError || !currentTicket) {
    return (
      <div className="p-6 border-l-[3px] border-l-[var(--red)] bg-[var(--bg-subtle)] rounded">
        <div className="text-center">
          <p className="text-[var(--text-base)] text-[var(--red)]">
            {fetchError || 'Ticket not found'}
          </p>
          <Button
            onClick={() => router.push('/tickets')}
            variant="outline"
            className="mt-4"
          >
            Back to Tickets
          </Button>
        </div>
      </div>
    );
  }

  // Compute readiness badge color
  const readinessScore = currentTicket.readinessScore || 0;
  const readinessBadgeClass =
    readinessScore >= 75
      ? 'bg-[var(--green)]'
      : readinessScore >= 50
      ? 'bg-[var(--amber)]'
      : 'bg-[var(--red)]';

  // Handle inline editing save
  const handleSaveAcceptanceCriteria = async (items: string[]) => {
    if (!ticketId) return;
    await updateTicket(ticketId, { acceptanceCriteria: items });
  };

  const handleSaveAssumptions = async (items: string[]) => {
    if (!ticketId) return;
    await updateTicket(ticketId, { assumptions: items });
  };

  const handleDelete = async () => {
    if (!ticketId) return;
    const success = await deleteTicket(ticketId);
    if (success) {
      router.push('/tickets');
    }
  };

  return (
    <div className="space-y-8">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/tickets')}
        className="-ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Tickets
      </Button>

      {/* Header with title, type, and readiness badge */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-[var(--text-xl)] font-medium text-[var(--text)]">
              {currentTicket.title}
            </h1>
            {currentTicket.type && (
              <Badge variant="outline" className="capitalize">
                {currentTicket.type}
              </Badge>
            )}
          </div>
          <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
            Ticket #{currentTicket.id}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={`${readinessBadgeClass} text-white`}>
            Ready {readinessScore}
          </Badge>
        </div>
      </div>

      {/* Validation Results */}
      {currentTicket.validationResults && currentTicket.validationResults.length > 0 && (
        <ValidationResults
          validationResults={currentTicket.validationResults}
          overallScore={currentTicket.readinessScore}
        />
      )}

      {/* Acceptance Criteria */}
      {currentTicket.acceptanceCriteria && currentTicket.acceptanceCriteria.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[var(--text-md)] font-medium text-[var(--text)]">
            Acceptance Criteria
          </h2>
          <div className="pl-4 border-l-2 border-l-[var(--border)]">
            <InlineEditableList
              items={currentTicket.acceptanceCriteria}
              type="numbered"
              onSave={handleSaveAcceptanceCriteria}
              emptyMessage="No acceptance criteria yet"
            />
          </div>
        </section>
      )}

      {/* Assumptions */}
      {currentTicket.assumptions && currentTicket.assumptions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[var(--text-md)] font-medium text-[var(--text)]">
            Assumptions
          </h2>
          <div className="pl-4 border-l-2 border-l-[var(--border)]">
            <InlineEditableList
              items={currentTicket.assumptions}
              type="bulleted"
              onSave={handleSaveAssumptions}
              emptyMessage="No assumptions yet"
            />
          </div>
        </section>
      )}

      {/* Affected Code */}
      {currentTicket.repoPaths && currentTicket.repoPaths.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[var(--text-md)] font-medium text-[var(--text)]">
            Affected Code
          </h2>
          <div className="pl-4 border-l-2 border-l-[var(--border)]">
            <ul className="space-y-1 text-[var(--text-sm)] font-mono text-[var(--text-secondary)]">
              {currentTicket.repoPaths.map((path, index) => (
                <li key={index}>{path}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Estimate */}
      {currentTicket.estimate && (
        <section className="space-y-3">
          <h2 className="text-[var(--text-md)] font-medium text-[var(--text)]">
            Estimate
          </h2>
          <div className="pl-4 border-l-2 border-l-[var(--border)]">
            <div className="space-y-2">
              <p className="text-[var(--text-base)] text-[var(--text)]">
                {currentTicket.estimate.min}-{currentTicket.estimate.max} hours{' '}
                <span className="text-[var(--text-tertiary)] capitalize">
                  ({currentTicket.estimate.confidence} confidence)
                </span>
              </p>
              {currentTicket.estimate.drivers && currentTicket.estimate.drivers.length > 0 && (
                <ul className="space-y-1 text-[var(--text-sm)] text-[var(--text-secondary)]">
                  {currentTicket.estimate.drivers.map((driver: string, index: number) => (
                    <li key={index}>• {driver}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Questions (if readiness < 75) */}
      {currentTicket.questions && currentTicket.questions.length > 0 && readinessScore < 75 && (
        <section className="space-y-3">
          <h2 className="text-[var(--text-md)] font-medium text-[var(--text)]">
            Clarification Needed
          </h2>
          <div className="pl-4 border-l-[3px] border-l-[var(--amber)]">
            <div className="space-y-4">
              {currentTicket.questions.slice(0, 3).map((question, index) => (
                <div key={question.id || index} className="space-y-2">
                  <p className="text-[var(--text-base)] text-[var(--text)]">
                    {index + 1}. {question.text}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {question.options.map((option: { value: string; label: string }) => (
                      <Badge
                        key={option.value}
                        variant="outline"
                        className="cursor-pointer hover:bg-[var(--bg-hover)]"
                      >
                        {option.label}
                      </Badge>
                    ))}
                  </div>
                  {question.defaultAssumption && (
                    <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] italic">
                      Default: {question.defaultAssumption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer with export and delete buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-[var(--border)]">
        <Button
          variant="ghost"
          onClick={() => setShowDeleteConfirm(true)}
          className="text-[var(--red)] hover:text-[var(--red)] hover:bg-[var(--red)]/10"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Ticket
        </Button>
        <Button disabled title="Export functionality coming in Epic 5">
          Export to Jira
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[var(--red)]" />
              Delete Ticket
            </DialogTitle>
            <DialogDescription className="text-[var(--text-base)]">
              Are you sure you want to delete this ticket? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
              <strong className="text-[var(--text)]">Ticket:</strong> {currentTicket.title}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Ticket
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
