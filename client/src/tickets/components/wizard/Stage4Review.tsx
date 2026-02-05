'use client';

import React from 'react';
import { useWizardStore } from '@/tickets/stores/generation-wizard.store';
import { Button } from '@/core/components/ui/button';

/**
 * Stage 4: Review Component (LEGACY)
 *
 * NOTE: This component is deprecated. Use the ticket detail page instead.
 * Kept as placeholder for backward compatibility with GenerationWizard.
 */
export function Stage4Review() {
  const { reset } = useWizardStore();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-medium text-gray-900 dark:text-gray-50 mb-4">
          Ticket Successfully Created
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Your ticket is now ready. Visit the ticket detail page to view and edit it.
        </p>
      </div>

      <div className="flex justify-center">
        <Button onClick={reset}>
          Create Another Ticket
        </Button>
      </div>
    </div>
  );
}
