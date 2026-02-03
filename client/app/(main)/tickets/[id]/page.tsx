'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';
import { Loader2, ArrowLeft, Trash2 } from 'lucide-react';
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
      <Card className="p-6">
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
      </Card>
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
        className="mb-4"
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
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-sm)] text-[var(--text-secondary)]">
                Delete this ticket?
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Confirm'
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-[var(--red)] hover:text-[var(--red)] hover:bg-[var(--red)]/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
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
          <Card className="p-4">
            <InlineEditableList
              items={currentTicket.acceptanceCriteria}
              type="numbered"
              onSave={handleSaveAcceptanceCriteria}
              emptyMessage="No acceptance criteria yet"
            />
          </Card>
        </section>
      )}

      {/* Assumptions */}
      {currentTicket.assumptions && currentTicket.assumptions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[var(--text-md)] font-medium text-[var(--text)]">
            Assumptions
          </h2>
          <Card className="p-4">
            <InlineEditableList
              items={currentTicket.assumptions}
              type="bulleted"
              onSave={handleSaveAssumptions}
              emptyMessage="No assumptions yet"
            />
          </Card>
        </section>
      )}

      {/* Affected Code */}
      {currentTicket.repoPaths && currentTicket.repoPaths.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[var(--text-md)] font-medium text-[var(--text)]">
            Affected Code
          </h2>
          <Card className="p-4">
            <ul className="space-y-1 text-[var(--text-sm)] font-mono text-[var(--text-secondary)]">
              {currentTicket.repoPaths.map((path, index) => (
                <li key={index}>{path}</li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      {/* Estimate */}
      {currentTicket.estimate && (
        <section className="space-y-3">
          <h2 className="text-[var(--text-md)] font-medium text-[var(--text)]">
            Estimate
          </h2>
          <Card className="p-4">
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
          </Card>
        </section>
      )}

      {/* Questions (if readiness < 75) */}
      {currentTicket.questions && currentTicket.questions.length > 0 && readinessScore < 75 && (
        <section className="space-y-3">
          <h2 className="text-[var(--text-md)] font-medium text-[var(--text)]">
            Clarification Needed
          </h2>
          <Card className="p-4">
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
          </Card>
        </section>
      )}

      {/* Footer with export button (disabled placeholder) */}
      <div className="flex justify-end pt-4 border-t border-[var(--border)]">
        <Button disabled title="Export functionality coming in Epic 5">
          Export to Jira
        </Button>
      </div>
    </div>
  );
}
