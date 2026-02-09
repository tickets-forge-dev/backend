'use client';

import { useImportWizardStore } from '@/tickets/stores/import-wizard.store';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';

interface Props {
  onError: (message: string) => void;
}

/**
 * ImportStage2Preview
 *
 * Shows preview of the imported issue:
 * - Title, key/identifier, type, priority
 * - Description snippet
 * - Confirmation of how it will be imported
 */
export function ImportStage2Preview({ onError }: Props) {
  const { selectedIssue, platform, goToStage } = useImportWizardStore();

  if (!selectedIssue) {
    return (
      <div className="text-center py-16 text-[var(--text-tertiary)]">
        <p>No issue selected</p>
        <Button onClick={() => goToStage(1)} variant="outline" className="mt-4">
          Back
        </Button>
      </div>
    );
  }

  const handleContinue = () => {
    goToStage(3);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Preview Import</h1>
        <p className="text-sm text-[var(--text-tertiary)]">
          Review the ticket that will be imported
        </p>
      </div>

      {/* Issue preview card */}
      <div className="border border-[var(--border)] rounded-lg p-6 space-y-4">
        {/* Header */}
        <div>
          <div className="text-xl font-semibold">{selectedIssue.title}</div>
          <div className="text-sm text-[var(--text-tertiary)] mt-1 font-mono">
            {selectedIssue.key || selectedIssue.identifier}
          </div>
        </div>

        {/* Type and priority badges */}
        <div className="flex gap-2">
          <Badge variant={selectedIssue.mappedType === 'bug' ? 'destructive' : 'secondary'}>
            {selectedIssue.mappedType}
          </Badge>
          <Badge variant="outline">
            {selectedIssue.mappedPriority}
          </Badge>
        </div>

        {/* Description */}
        {selectedIssue.description && (
          <div>
            <div className="text-xs font-medium text-[var(--text-tertiary)] mb-2 uppercase">
              Description
            </div>
            <div className="text-sm whitespace-pre-wrap bg-[var(--bg-subtle)] p-4 rounded-md max-h-64 overflow-y-auto">
              {selectedIssue.description}
            </div>
          </div>
        )}

        {/* How it will be imported */}
        <div className="border-t border-[var(--border)] pt-4">
          <div className="text-xs font-medium text-[var(--text-tertiary)] mb-3 uppercase">
            Will be imported as
          </div>
          <ul className="text-sm text-[var(--text-secondary)] space-y-2">
            <li className="flex items-center gap-2">
              <span className="text-[var(--text-tertiary)]">Title:</span>
              <span className="font-medium">{selectedIssue.title}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[var(--text-tertiary)]">Type:</span>
              <Badge variant="secondary">{selectedIssue.mappedType}</Badge>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[var(--text-tertiary)]">Priority:</span>
              <Badge variant="outline">{selectedIssue.mappedPriority}</Badge>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[var(--text-tertiary)]">Status:</span>
              <Badge>Draft</Badge>
            </li>
          </ul>
        </div>

        {/* Source info */}
        <div className="border-t border-[var(--border)] pt-4">
          <div className="text-xs font-medium text-[var(--text-tertiary)] mb-2">Source</div>
          <div className="text-sm text-[var(--text-secondary)]">
            Importing from <strong className="font-medium">{platform}</strong>
            {selectedIssue.url && (
              <>
                {' '}
                {/* Show link if available */}
                <a
                  href={selectedIssue.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--primary)] hover:underline ml-1"
                >
                  View original
                </a>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
        <Button variant="outline" onClick={() => goToStage(1)}>
          Back
        </Button>
        <Button onClick={handleContinue}>
          Confirm & Continue
        </Button>
      </div>
    </div>
  );
}
