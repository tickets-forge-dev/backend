'use client';

import { GenerationWizard } from '@/tickets/components/GenerationWizard';

/**
 * Create Ticket Page
 *
 * Routes to the 4-stage wizard for ticket generation:
 * 1. Input: Title + Repository selection
 * 2. Context: GitHub code analysis review
 * 3. Draft: Spec review + iterative questions (1-3 rounds)
 * 4. Review: Final ticket summary and creation
 */
export default function CreateTicketPage() {
  return (
    <div className="w-full h-full">
      <GenerationWizard />
    </div>
  );
}

