'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useImportWizardStore } from '@/tickets/stores/import-wizard.store';
import { ImportStage1Selector } from './ImportStage1Selector';
import { ImportStage2Preview } from './ImportStage2Preview';
import { ImportStage3Repository } from './ImportStage3Repository';
import { Button } from '@/core/components/ui/button';

/**
 * ImportWizard
 *
 * Orchestrates the 3-stage import flow:
 * 1. Platform selection + issue selector (text input)
 * 2. Preview imported data + confirm
 * 3. Repository selection → hand off to GenerationWizard
 */
export function ImportWizard() {
  const router = useRouter();
  const { currentStage, reset } = useImportWizardStore();
  const [error, setError] = useState<string | null>(null);

  const handleCancel = () => {
    reset();
    router.push('/tickets');
  };

  const handleErrorDismiss = () => {
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Error banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start justify-between">
          <div className="text-sm text-red-600">{error}</div>
          <button
            onClick={handleErrorDismiss}
            className="text-red-600 hover:text-red-700 font-medium text-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stage renderer */}
      {currentStage === 1 && <ImportStage1Selector onError={setError} />}
      {currentStage === 2 && <ImportStage2Preview onError={setError} />}
      {currentStage === 3 && <ImportStage3Repository onError={setError} />}

      {/* Cancel button */}
      <div className="mt-6 pt-4 border-t border-[var(--border)]">
        <Button variant="outline" onClick={handleCancel} size="sm">
          Cancel Import
        </Button>
      </div>
    </div>
  );
}
