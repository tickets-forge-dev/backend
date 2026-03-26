'use client';

import { RefreshCw, Eye, Trash2, GitBranch, FileText, Clock, GitCommit, Scan } from 'lucide-react';
import { ProfileStatusBadge } from './ProfileStatusBadge';

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

interface ProfileStatusCardProps {
  profile: {
    id: string;
    repoOwner: string;
    repoName: string;
    branch: string;
    status: 'pending' | 'scanning' | 'ready' | 'failed' | null;
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
  const { repoOwner, repoName, branch, status, scannedAt, fileCount, commitSha, error } = profile;

  return (
    <div className="flex items-center gap-3 py-3">
      {/* Left: repo info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-medium text-[var(--text)]">
            {repoOwner}/{repoName}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-tertiary)]">
            <GitBranch className="h-3 w-3" />
            {branch}
          </span>
          {status !== null ? (
            <ProfileStatusBadge status={status} techStack={profile.techStack} />
          ) : (
            <span className="text-[11px] text-[var(--text-tertiary)]">Not profiled</span>
          )}
        </div>
        {/* Metadata row */}
        {status === 'ready' && (
          <div className="flex items-center gap-3 mt-0.5 text-[11px] text-[var(--text-tertiary)]">
            <span className="inline-flex items-center gap-1">
              <FileText className="h-2.5 w-2.5" />
              {fileCount} files
            </span>
            {scannedAt && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                {timeAgo(scannedAt)}
              </span>
            )}
            {commitSha && (
              <span className="inline-flex items-center gap-1 font-mono">
                <GitCommit className="h-2.5 w-2.5" />
                {commitSha.slice(0, 7)}
              </span>
            )}
          </div>
        )}
        {status === 'failed' && error && (
          <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{error}</p>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {status === null && onRescan && (
          <button onClick={onRescan} className="h-7 w-7 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] transition-colors" title="Scan Now">
            <Scan className="h-3.5 w-3.5" />
          </button>
        )}
        {status !== null && onRescan && (
          <button onClick={onRescan} className="h-7 w-7 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] transition-colors" title="Re-scan">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        )}
        {status === 'ready' && onView && (
          <button onClick={onView} className="h-7 w-7 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] transition-colors" title="View Profile">
            <Eye className="h-3.5 w-3.5" />
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete} className="h-7 w-7 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] transition-colors" title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
