'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { useServices } from '@/hooks/useServices';

type PreviewStatus = 'idle' | 'fetching' | 'ready' | 'error';

interface PreviewPanelProps {
  open: boolean;
  onClose: () => void;
  repoFullName: string;
  branch: string;
}

/**
 * PreviewPanel — fetches repo files, stores in sessionStorage,
 * then opens /preview in a new tab (which has COEP/COOP headers
 * for WebContainer). The new tab reads files from sessionStorage.
 *
 * An iframe can't be more cross-origin isolated than its parent,
 * so we must use a separate window/tab for WebContainer to work.
 */
export function PreviewPanel({ open, onClose, repoFullName, branch }: PreviewPanelProps) {
  const { gitHubService } = useServices();
  const [status, setStatus] = useState<PreviewStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const startPreview = useCallback(async () => {
    setStatus('fetching');
    setError(null);

    const [owner, repo] = repoFullName.split('/');
    if (!owner || !repo) {
      setError('Invalid repository name');
      setStatus('error');
      return;
    }

    try {
      const result = await gitHubService.getRepoContents(owner, repo, branch);

      if (!result.files['package.json']) {
        setError('No previewable web app found — needs package.json with a dev/start script');
        setStatus('error');
        return;
      }

      // Store files in sessionStorage for the /preview tab to read
      try {
        sessionStorage.setItem('forge:preview-files', JSON.stringify(result.files));
        sessionStorage.setItem('forge:preview-meta', JSON.stringify({ repo: repoFullName, branch }));
      } catch {
        setError('Repository too large to preview — files exceed browser storage limit');
        setStatus('error');
        return;
      }

      // Open /preview in a new tab — it has its own COEP/COOP headers
      window.open(`/preview?repo=${encodeURIComponent(repoFullName)}&branch=${encodeURIComponent(branch)}`, '_blank');

      setStatus('ready');
      // Close the panel after a short delay
      setTimeout(() => onClose(), 500);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || '';
      if (err?.response?.status === 404 || /branch not found/i.test(msg)) {
        setError('Preview unavailable — this branch has been removed');
      } else {
        setError(msg || 'Failed to fetch repository');
      }
      setStatus('error');
    }
  }, [repoFullName, branch, gitHubService, onClose]);

  useEffect(() => {
    if (open && status === 'idle') {
      startPreview();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setStatus('idle');
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />

      {/* Small centered dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-lg shadow-xl p-6 w-80 text-center space-y-3">
          {status === 'fetching' && (
            <>
              <Loader2 className="w-6 h-6 text-[var(--text-tertiary)] animate-spin mx-auto" />
              <p className="text-[13px] text-[var(--text-secondary)]">Fetching project files...</p>
              <p className="text-[11px] text-[var(--text-tertiary)]">This will open in a new tab</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-[13px] text-[var(--text-secondary)]">{error}</p>
              <div className="flex gap-2 justify-center pt-1">
                <button onClick={onClose} className="text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
                  Close
                </button>
                <button onClick={() => { setStatus('idle'); startPreview(); }} className="text-[12px] text-[var(--primary)] hover:underline">
                  Try again
                </button>
              </div>
            </>
          )}

          {status === 'ready' && (
            <>
              <ExternalLink className="w-6 h-6 text-emerald-500 mx-auto" />
              <p className="text-[13px] text-[var(--text-secondary)]">Preview opened in new tab</p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
