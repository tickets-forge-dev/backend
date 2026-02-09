'use client';

import { Skeleton } from '@/core/components/ui/skeleton';

export function TicketSkeletonRow() {
  return (
    <div className="rounded-lg px-4 py-3.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Title row skeleton */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Title row with icon, title, priority, status */}
          <div className="flex items-center gap-2.5">
            {/* Icon */}
            <Skeleton className="h-3.5 w-3.5 flex-shrink-0 rounded" />

            {/* Title */}
            <Skeleton className="h-4 w-32 flex-1" />

            {/* Priority indicator */}
            <Skeleton className="h-4 w-12 flex-shrink-0" />

            {/* Status badge */}
            <Skeleton className="h-4 w-16 flex-shrink-0" />
          </div>

          {/* Metadata row (time) */}
          <div className="ml-6">
            <Skeleton className="h-3 w-20" />
          </div>
        </div>

        {/* Right: Progress ring skeleton */}
        <div className="flex-shrink-0 h-8 w-8">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}
