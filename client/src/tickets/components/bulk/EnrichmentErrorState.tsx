'use client';

import { AlertCircle } from 'lucide-react';
import { Button } from '@/core/components/ui/button';

/**
 * EnrichmentErrorState - Error display and recovery UI
 *
 * Shows errors that occurred during enrichment/finalization
 * and provides retry options for failed tickets
 */

export interface EnrichmentErrorStateProps {
  errors: Map<string, string>;
  failedCount: number;
  onRetry?: (ticketIds: string[]) => void;
  onCancel?: () => void;
}

export function EnrichmentErrorState({
  errors,
  failedCount,
  onRetry,
  onCancel,
}: EnrichmentErrorStateProps) {
  if (failedCount === 0) {
    return null;
  }

  const errorArray = Array.from(errors.entries());
  const allFailed = failedCount > 0 && errorArray.length > 0;

  return (
    <div className="space-y-4">
      {/* Error summary */}
      <div
        className="p-4 rounded-lg border flex gap-3"
        style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'var(--red)',
        }}
      >
        <AlertCircle
          className="w-5 h-5 flex-shrink-0 mt-0.5"
          style={{ color: 'var(--red)' }}
        />
        <div className="flex-1">
          <p className="font-medium text-sm" style={{ color: 'var(--red)' }}>
            {failedCount} {failedCount === 1 ? 'ticket' : 'tickets'} failed to{' '}
            {failedCount > 0 ? 'enrich' : 'finalize'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            {allFailed ? 'All tickets failed. Please try again or contact support.' : 'Some tickets were skipped due to errors.'}
          </p>
        </div>
      </div>

      {/* Error details */}
      {errorArray.length > 0 && (
        <div
          className="p-4 rounded-lg border space-y-2 max-h-64 overflow-y-auto"
          style={{
            backgroundColor: 'var(--bg-subtle)',
            borderColor: 'var(--border)',
          }}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Error Details
          </p>
          {errorArray.slice(0, 5).map(([ticketId, error]) => (
            <div key={ticketId} className="text-xs space-y-0.5">
              <p style={{ color: 'var(--text)' }}>
                <code style={{ backgroundColor: 'rgba(0,0,0,0.1)', padding: '2px 4px' }}>
                  {ticketId}
                </code>
              </p>
              <p style={{ color: 'var(--red)' }} className="ml-2">
                {error}
              </p>
            </div>
          ))}
          {errorArray.length > 5 && (
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              ... and {errorArray.length - 5} more errors
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {onRetry && !allFailed && (
          <Button
            onClick={() => onRetry(Array.from(errors.keys()))}
            className="flex-1"
          >
            Retry Failed Tickets
          </Button>
        )}
        {onCancel && (
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1"
          >
            {allFailed ? 'Cancel' : 'Continue'}
          </Button>
        )}
      </div>
    </div>
  );
}
