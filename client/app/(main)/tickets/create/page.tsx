'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { GenerationWizard } from '@/tickets/components/GenerationWizard';

/**
 * Create Ticket Page
 *
 * Routes to the 4-stage wizard for ticket generation:
 * 1. Input: Title + Repository selection
 * 2. Context: GitHub code analysis review
 * 3. Draft: Spec review + iterative questions (1-3 rounds)
 * 4. Review: Final ticket summary and creation
 *
 * Supports ?resume={aecId} query param to resume an in-progress draft.
 */
function CreateTicketContent() {
  const searchParams = useSearchParams();
  const resumeId = searchParams.get('resume') || undefined;

  return (
    <div className="w-full h-full">
      <GenerationWizard resumeId={resumeId} />
    </div>
  );
}

export default function CreateTicketPage() {
  return (
    <Suspense>
      <CreateTicketContent />
    </Suspense>
  );
}

