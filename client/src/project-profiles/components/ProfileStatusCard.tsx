'use client';

import { RefreshCw, Eye, Trash2, GitBranch, FileText, Clock, GitCommit } from 'lucide-react';
import { Button } from '@/core/components/ui/button';

/** Simple relative time — avoids date-fns dependency */
function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
import { ProfileStatusBadge } from './ProfileStatusBadge';

interface ProfileStatusCardProps {
  profile: {
    id: string;
    repoOwner: string;
    repoName: string;
    branch: string;
    status: 'pending' | 'scanning' | 'ready' | 'failed';
    scannedAt: string | null;
    fileCount: number;
    techStack: string[];
    commitSha: string | null;
    error: string | null;
  };
  onRescan?: () => void;
  onDelete?: () => void;
  onView?: () => void;
}

export function ProfileStatusCard({ profile, onRescan, onDelete, onView }: ProfileStatusCardProps) {
  const { repoOwner, repoName, branch, status, scannedAt, fileCount, techStack, commitSha, error } = profile;

  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg)] p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[13px] font-medium text-[var(--text)]">
          {repoOwner}/{repoName}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-subtle)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
          <GitBranch className="h-3 w-3" />
          {branch}
        </span>
        <ProfileStatusBadge status={status} techStack={techStack} />
      </div>

      {/* Body — Ready */}
      {status === 'ready' && (
        <div className="space-y-2">
          {techStack.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {techStack.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-[var(--bg-hover)] px-2 py-0.5 text-xs text-[var(--text-secondary)]"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-tertiary)]">
            <span className="inline-flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {fileCount} files
            </span>
            {scannedAt && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {timeAgo(scannedAt)}
              </span>
            )}
            {commitSha && (
              <span className="inline-flex items-center gap-1 font-mono">
                <GitCommit className="h-3 w-3" />
                {commitSha.slice(0, 7)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Body — Failed */}
      {status === 'failed' && error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-1.5 pt-1">
        {onRescan && (
          <Button variant="ghost" size="sm" onClick={onRescan}>
            <RefreshCw className="h-3.5 w-3.5" />
            Re-scan
          </Button>
        )}
        {status === 'ready' && onView && (
          <Button variant="ghost" size="sm" onClick={onView}>
            <Eye className="h-3.5 w-3.5" />
            View Profile
          </Button>
        )}
        {onDelete && (
          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}
