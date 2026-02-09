'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useImportWizardStore } from '@/tickets/stores/import-wizard.store';
import { useWizardStore } from '@/tickets/stores/generation-wizard.store';
import { useTicketsStore } from '@/stores/tickets.store';
import { Button } from '@/core/components/ui/button';
import { RepositorySelector } from '../RepositorySelector';
import { BranchSelector } from '../BranchSelector';
import { Loader2 } from 'lucide-react';

interface Props {
  onError: (message: string) => void;
}

/**
 * ImportStage3Repository
 *
 * Final stage before handoff to GenerationWizard:
 * 1. Select repository to analyze
 * 2. Optionally select branch
 * 3. Populate GenerationWizard with imported data
 * 4. Trigger repository analysis
 * 5. Navigate to /tickets/create?mode=new to show GenerationWizard at Stage 3 (questions)
 */
export function ImportStage3Repository({ onError }: Props) {
  const router = useRouter();
  const { selectedIssue, platform, reset: resetImportWizard } = useImportWizardStore();
  const { selectedRepository, selectedBranch } = useTicketsStore();
  const wizardStore = useWizardStore();

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  if (!selectedIssue) {
    return (
      <div className="text-center py-16 text-[var(--text-tertiary)]">
        <p>No issue selected</p>
        <Button onClick={() => router.back()} variant="outline" className="mt-4">
          Back
        </Button>
      </div>
    );
  }

  const handleContinue = async () => {
    if (!selectedRepository) {
      onError('Please select a repository');
      return;
    }

    setIsAnalyzing(true);
    try {
      // Parse repository
      const [owner, repo] = selectedRepository.split('/');

      // Populate generation wizard with imported data
      wizardStore.setTitle(selectedIssue.title);
      wizardStore.setDescription(selectedIssue.description || '');
      wizardStore.setType(selectedIssue.mappedType);
      wizardStore.setPriority(selectedIssue.mappedPriority);
      wizardStore.setRepository(owner, repo);

      // Trigger repository analysis
      await wizardStore.analyzeRepository();

      // Reset import wizard state
      resetImportWizard();

      // Navigate to generation wizard
      // The wizard will be at Stage 3 (questions) after analysis completes
      router.push('/tickets/create?mode=new');
    } catch (err: any) {
      const message = err.message || 'Failed to analyze repository';
      onError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Select Repository</h1>
        <p className="text-sm text-[var(--text-tertiary)]">
          Choose which repository to analyze for: <strong>{selectedIssue.title}</strong>
        </p>
      </div>

      {/* Repository selector */}
      <div>
        <label className="block text-sm font-medium mb-3">Repository</label>
        <RepositorySelector />
        {!selectedRepository && (
          <p className="text-xs text-[var(--text-tertiary)] mt-2">
            Select a repository to continue
          </p>
        )}
      </div>

      {/* Branch selector */}
      {selectedRepository && (
        <div>
          <label className="block text-sm font-medium mb-3">Branch (optional)</label>
          <BranchSelector hideLabel />
        </div>
      )}

      {/* Handoff info */}
      <div className="p-4 bg-[var(--bg-subtle)] rounded-lg border border-[var(--border)]">
        <p className="text-sm text-[var(--text-secondary)]">
          After you select a repository, we&apos;ll analyze the code and show you up to 5 clarification
          questions to refine the specification.
        </p>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
        <Button variant="outline" onClick={() => router.back()} disabled={isAnalyzing}>
          Back
        </Button>
        <Button onClick={handleContinue} disabled={!selectedRepository || isAnalyzing}>
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Continue to Questions'
          )}
        </Button>
      </div>
    </div>
  );
}
