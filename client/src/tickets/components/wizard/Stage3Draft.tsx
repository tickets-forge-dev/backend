'use client';

import React from 'react';
import { useWizardStore } from '@/tickets/stores/generation-wizard.store';
import { Button } from '@/core/components/ui/button';

/**
 * Stage 3: Draft Review Component (LEGACY)
 *
 * NOTE: This component is deprecated. Questions are now handled in the ticket detail page.
 * Kept as placeholder for backward compatibility with GenerationWizard.
 */
export function Stage3Draft() {
  const { goBackToContext, confirmSpecContinue } = useWizardStore();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-medium text-gray-900 dark:text-gray-50 mb-4">
          Ticket Created - Questions in Detail View
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Your ticket has been created. You can now answer clarification questions in the ticket detail page.
        </p>
      </div>

      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={goBackToContext}>
          Back
        </Button>
        <Button onClick={confirmSpecContinue}>
          Continue to Review
        </Button>
      </div>
    </div>
  );
}
