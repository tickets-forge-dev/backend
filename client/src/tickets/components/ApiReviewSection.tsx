'use client';

import { useState, useMemo } from 'react';
import { Check, Plus, RotateCcw, Search, Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { ApiCard, type ReviewStatus } from './ApiCard';
import type { ApiEndpointSpec } from '@/types/question-refinement';

interface ApiReviewSectionProps {
  endpoints: ApiEndpointSpec[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onAdd?: () => void;
  onConfirmAll?: (accepted: number[], rejected: number[]) => void;
  onScanApis?: () => Promise<void>;
  isScanning?: boolean;
}

export function ApiReviewSection({
  endpoints,
  onEdit,
  onDelete,
  onAdd,
  onConfirmAll,
  onScanApis,
  isScanning = false,
}: ApiReviewSectionProps) {
  const [reviewStatuses, setReviewStatuses] = useState<Record<number, ReviewStatus>>({});

  const handleAccept = (index: number) => {
    setReviewStatuses((prev) => ({
      ...prev,
      [index]: prev[index] === 'accepted' ? 'pending' : 'accepted',
    }));
  };

  const handleReject = (index: number) => {
    setReviewStatuses((prev) => ({
      ...prev,
      [index]: prev[index] === 'rejected' ? 'pending' : 'rejected',
    }));
  };

  const handleAcceptAll = () => {
    const all: Record<number, ReviewStatus> = {};
    endpoints.forEach((_, idx) => {
      all[idx] = 'accepted';
    });
    setReviewStatuses(all);
  };

  const handleResetAll = () => {
    setReviewStatuses({});
  };

  const handleConfirm = () => {
    const accepted: number[] = [];
    const rejected: number[] = [];

    endpoints.forEach((_, idx) => {
      const status = reviewStatuses[idx] || 'pending';
      if (status === 'accepted') accepted.push(idx);
      if (status === 'rejected') rejected.push(idx);
    });

    // Delete rejected endpoints
    // Process in reverse order so indices remain valid
    const sortedRejected = [...rejected].sort((a, b) => b - a);
    for (const idx of sortedRejected) {
      onDelete(idx);
    }

    onConfirmAll?.(accepted, rejected);
  };

  const stats = useMemo(() => {
    let accepted = 0;
    let rejected = 0;
    let pending = 0;

    endpoints.forEach((_, idx) => {
      const status = reviewStatuses[idx] || 'pending';
      if (status === 'accepted') accepted++;
      else if (status === 'rejected') rejected++;
      else pending++;
    });

    return { accepted, rejected, pending, total: endpoints.length };
  }, [endpoints, reviewStatuses]);

  const allReviewed = stats.pending === 0 && stats.total > 0;

  if (!endpoints || endpoints.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-[var(--text-sm)] text-[var(--text-tertiary)] italic">
          No API endpoints detected.
        </p>
        <div className="flex items-center gap-2">
          {onScanApis && (
            <Button variant="outline" size="sm" onClick={onScanApis} disabled={isScanning} className="gap-1.5">
              {isScanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              {isScanning ? 'Scanning...' : 'Scan Codebase'}
            </Button>
          )}
          {onAdd && (
            <Button variant="outline" size="sm" onClick={onAdd} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add Endpoint
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Review toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 text-[11px] text-[var(--text-tertiary)]">
          <span>
            <span className="text-green-600 dark:text-green-400 font-medium">{stats.accepted}</span> accepted
          </span>
          <span>
            <span className="text-red-600 dark:text-red-400 font-medium">{stats.rejected}</span> rejected
          </span>
          <span>
            <span className="font-medium">{stats.pending}</span> pending
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAcceptAll}
            className="gap-1.5 text-xs h-7"
          >
            <Check className="h-3.5 w-3.5" />
            Accept All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetAll}
            className="gap-1.5 text-xs h-7"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </div>

      {/* API Cards */}
      <div className="space-y-3">
        {endpoints.map((endpoint, idx) => (
          <ApiCard
            key={`${endpoint.method}-${endpoint.route}-${idx}`}
            endpoint={endpoint}
            reviewStatus={reviewStatuses[idx] || 'pending'}
            onAccept={() => handleAccept(idx)}
            onReject={() => handleReject(idx)}
            onEdit={() => onEdit(idx)}
          />
        ))}
      </div>

      {/* Bottom actions */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]/50">
        <div className="flex items-center gap-2">
          {onScanApis && (
            <Button variant="outline" size="sm" onClick={onScanApis} disabled={isScanning} className="gap-1.5">
              {isScanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              {isScanning ? 'Scanning...' : 'Scan Codebase'}
            </Button>
          )}
          {onAdd && (
            <Button variant="outline" size="sm" onClick={onAdd} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add Endpoint
            </Button>
          )}
        </div>

        {onConfirmAll && allReviewed && (
          <Button
            size="sm"
            onClick={handleConfirm}
            className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
          >
            <Check className="h-3.5 w-3.5" />
            Confirm Review ({stats.accepted} accepted, {stats.rejected} rejected)
          </Button>
        )}
      </div>
    </div>
  );
}
