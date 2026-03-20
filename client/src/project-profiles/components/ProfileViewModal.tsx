'use client';

import { useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/core/components/ui/dialog';
import { useProjectProfileStore } from '../stores/project-profile.store';

interface ProfileViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string | null;
}

export function ProfileViewModal({
  open,
  onOpenChange,
  profileId,
}: ProfileViewModalProps) {
  const { currentProfile, isLoading, error, loadProfileById, clearError } =
    useProjectProfileStore();

  useEffect(() => {
    if (open && profileId) {
      loadProfileById(profileId);
    }
    if (!open) {
      clearError();
    }
  }, [open, profileId, loadProfileById, clearError]);

  const scannedAt = currentProfile?.scannedAt
    ? new Date(currentProfile.scannedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Unknown';

  const fileCount = currentProfile?.fileCount ?? 0;
  const techStack = currentProfile?.techStack ?? [];
  const profileContent = currentProfile?.profileContent ?? '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            {currentProfile
              ? `${currentProfile.repoOwner}/${currentProfile.repoName} — Project Profile`
              : 'Project Profile'}
          </DialogTitle>
          {currentProfile && (
            <DialogDescription>
              Scanned {scannedAt} · {fileCount} files ·{' '}
              {techStack.length > 0 ? techStack.join(', ') : 'No tech detected'}
            </DialogDescription>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--text-tertiary)]" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg)] px-4 py-6 text-sm text-red-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="overflow-auto max-h-[60vh] rounded-md border border-[var(--border-subtle)] bg-[var(--bg)] p-4">
            <pre className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap font-mono leading-relaxed">
              {profileContent}
            </pre>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
