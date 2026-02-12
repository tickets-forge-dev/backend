'use client';

import { Plus, Search, Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { ApiCard, type ReviewStatus } from './ApiCard';
import type { ApiEndpointSpec } from '@/types/question-refinement';

interface ApiReviewSectionProps {
  endpoints: ApiEndpointSpec[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onAdd?: () => void;
  onScanApis?: () => Promise<void>;
  isScanning?: boolean;
}

export function ApiReviewSection({
  endpoints,
  onEdit,
  onDelete,
  onAdd,
  onScanApis,
  isScanning = false,
}: ApiReviewSectionProps) {
  const reviewStatus: ReviewStatus = 'pending';

  if (!endpoints || endpoints.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-[var(--text-tertiary)]">
          No API endpoints detected.
        </p>
        <div className="flex items-center gap-2">
          {onScanApis && (
            <Button variant="outline" size="sm" onClick={onScanApis} disabled={isScanning} className="gap-1.5 text-xs h-7">
              {isScanning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
              {isScanning ? 'Scanning...' : 'Scan Codebase'}
            </Button>
          )}
          {onAdd && (
            <Button variant="outline" size="sm" onClick={onAdd} className="gap-1.5 text-xs h-7">
              <Plus className="h-3 w-3" />
              Add Endpoint
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* API Cards */}
      {endpoints.map((endpoint, idx) => (
        <ApiCard
          key={`${endpoint.method}-${endpoint.route}-${idx}`}
          endpoint={endpoint}
          reviewStatus={reviewStatus}
          onAccept={() => {}}
          onReject={() => {}}
          onEdit={() => onEdit(idx)}
          onDelete={() => onDelete(idx)}
        />
      ))}

      {/* Bottom actions */}
      <div className="flex items-center gap-2 pt-1">
        {onScanApis && (
          <Button variant="outline" size="sm" onClick={onScanApis} disabled={isScanning} className="gap-1.5 text-xs h-7">
            {isScanning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
            {isScanning ? 'Scanning...' : 'Scan Codebase'}
          </Button>
        )}
        {onAdd && (
          <Button variant="outline" size="sm" onClick={onAdd} className="gap-1.5 text-xs h-7">
            <Plus className="h-3 w-3" />
            Add Endpoint
          </Button>
        )}
      </div>
    </div>
  );
}
