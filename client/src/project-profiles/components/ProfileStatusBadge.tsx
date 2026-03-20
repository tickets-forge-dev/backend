'use client';

import { CheckCircle2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface ProfileStatusBadgeProps {
  status: 'pending' | 'scanning' | 'ready' | 'failed' | null;
  techStack?: string[];
  onRescan?: () => void;
}

export function ProfileStatusBadge({ status, techStack, onRescan }: ProfileStatusBadgeProps) {
  if (status == null) return null;

  if (status === 'pending' || status === 'scanning') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 text-xs text-purple-600 dark:bg-purple-950/20 dark:text-purple-400">
        <Loader2 className="h-3 w-3 animate-spin" />
        Scanning...
      </span>
    );
  }

  if (status === 'ready') {
    const summary = techStack?.slice(0, 3).join(', ') ?? '';

    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
        <CheckCircle2 className="h-3 w-3" />
        {summary && <span>{summary}</span>}
        {onRescan && (
          <button
            type="button"
            onClick={onRescan}
            className="ml-0.5 inline-flex items-center gap-0.5 text-xs underline underline-offset-2 opacity-70 hover:opacity-100"
          >
            <RefreshCw className="h-2.5 w-2.5" />
            Re-scan
          </button>
        )}
      </span>
    );
  }

  if (status === 'failed') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs text-red-600 dark:bg-red-950/20 dark:text-red-400">
        <AlertCircle className="h-3 w-3" />
        Scan failed
        {onRescan && (
          <button
            type="button"
            onClick={onRescan}
            className="ml-0.5 inline-flex items-center gap-0.5 text-xs underline underline-offset-2 opacity-70 hover:opacity-100"
          >
            <RefreshCw className="h-2.5 w-2.5" />
            Retry
          </button>
        )}
      </span>
    );
  }

  return null;
}
