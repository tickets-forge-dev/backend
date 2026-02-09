'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { CreationRouter } from '@/tickets/components/CreationRouter';

/**
 * Create Ticket Page
 *
 * Routes to the appropriate wizard based on URL params:
 * - ?resume={aecId}: Resume an in-progress draft (GenerationWizard)
 * - ?mode=new: Create new ticket from scratch (GenerationWizard)
 * - ?mode=import: Import from Jira/Linear (ImportWizard)
 * - no params: Show creation choice modal
 */
function CreateTicketContent() {
  const searchParams = useSearchParams();
  const resumeId = searchParams.get('resume') || undefined;
  const mode = (searchParams.get('mode') as 'new' | 'import' | undefined) || undefined;

  return (
    <div className="w-full h-full">
      <CreationRouter resumeId={resumeId} mode={mode} />
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

