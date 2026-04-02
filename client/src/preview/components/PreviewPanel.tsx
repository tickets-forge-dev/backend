'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Maximize2, Minimize2, Loader2, RefreshCw, AlertCircle, GitBranch, ChevronDown } from 'lucide-react';
import { useServices } from '@/hooks/useServices';

type PreviewStatus = 'idle' | 'fetching' | 'booting' | 'installing' | 'starting' | 'ready' | 'error';

interface PreviewPanelProps {
  open: boolean;
  onClose: () => void;
  repoFullName: string;
  branch: string;
}

const STATUS_LABELS: Record<PreviewStatus, string> = {
  idle: 'Initializing...',
  fetching: 'Fetching repository files...',
  booting: 'Booting environment...',
  installing: 'Installing dependencies...',
  starting: 'Starting dev server...',
  ready: 'Running',
  error: 'Failed to start',
};

export function PreviewPanel({ open, onClose, repoFullName, branch }: PreviewPanelProps) {
  const { gitHubService } = useServices();
  const [status, setStatus] = useState<PreviewStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const abortRef = useRef(false);

  // Branch selection
  const [activeBranch, setActiveBranch] = useState(branch);
  const [branches, setBranches] = useState<Array<{ name: string; isDefault: boolean }>>([]);
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);

  // Fetch branches when panel opens
  useEffect(() => {
    if (!open || !repoFullName) return;
    setActiveBranch(branch);
    const [owner, repo] = repoFullName.split('/');
    if (!owner || !repo) return;
    gitHubService.getBranches(owner, repo)
      .then((res: any) => {
        const list = res.branches || res;
        setBranches(Array.isArray(list) ? list : []);
      })
      .catch(() => setBranches([]));
  }, [open, repoFullName]);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev.slice(-50), msg]);
  }, []);

  // Listen for messages from the /preview iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e.data?.type) return;
      switch (e.data.type) {
        case 'status':
          if (e.data.status) setStatus(e.data.status as PreviewStatus);
          break;
        case 'ready':
          setStatus('ready');
          break;
        case 'error':
          setError(e.data.message || 'Preview failed');
          setStatus('error');
          break;
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const startPreview = useCallback(async (branchOverride?: string) => {
    const targetBranch = branchOverride || activeBranch;
    abortRef.current = false;
    setStatus('fetching');
    setError(null);
    setLogs([]);

    const [owner, repo] = repoFullName.split('/');
    if (!owner || !repo) {
      setError('Invalid repository name');
      setStatus('error');
      return;
    }

    try {
      addLog(`Fetching files from ${repoFullName}@${targetBranch}...`);
      const result = await gitHubService.getRepoContents(owner, repo, targetBranch);

      if (abortRef.current) return;

      const fileCount = Object.keys(result.files).length;
      addLog(`Fetched ${fileCount} files${result.truncated ? ' (truncated)' : ''}`);

      if (!result.files['package.json']) {
        setError('No previewable web app found — needs package.json with a dev/start script');
        setStatus('error');
        return;
      }

      // Send files to the /preview iframe via postMessage
      addLog('Sending files to preview environment...');
      setStatus('booting');

      // Wait for iframe to load, then send files
      const sendFiles = () => {
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'start', files: result.files, repo: repoFullName, branch: targetBranch },
          '*',
        );
      };

      // If iframe is already loaded, send immediately. Otherwise wait for load.
      if (iframeRef.current?.contentWindow) {
        setTimeout(sendFiles, 500); // Small delay to ensure page is ready
      }
    } catch (err: any) {
      if (!abortRef.current) {
        setError(err.message || 'Failed to fetch repository');
        setStatus('error');
      }
    }
  }, [repoFullName, activeBranch, gitHubService, addLog]);

  // Start preview when panel opens
  useEffect(() => {
    if (open && status === 'idle') {
      startPreview();
    }
    return () => { abortRef.current = true; };
  }, [open]);

  // Reset when panel closes
  useEffect(() => {
    if (!open) {
      abortRef.current = true;
      setStatus('idle');
      setError(null);
      setLogs([]);
    }
  }, [open]);

  if (!open) return null;

  const isLoading = !['ready', 'error'].includes(status);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${isFullscreen ? 'opacity-100' : 'opacity-60'}`}
        onClick={() => { if (!isFullscreen) onClose(); }}
      />

      {/* Panel */}
      <div
        className={`fixed z-50 bg-[var(--bg)] border-l border-[var(--border-subtle)] flex flex-col transition-all duration-300 ${
          isFullscreen
            ? 'inset-0'
            : 'top-0 right-0 bottom-0 w-[55%] min-w-[480px] max-w-[900px]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
              status === 'ready' ? 'bg-emerald-500' :
              status === 'error' ? 'bg-red-500' :
              'bg-amber-500 animate-pulse'
            }`} />
            <span className="text-[13px] text-[var(--text-secondary)] truncate">
              {STATUS_LABELS[status]}
            </span>
            {isLoading && <Loader2 className="h-3.5 w-3.5 text-[var(--text-tertiary)] animate-spin flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-1">
            {status === 'ready' && (
              <button
                onClick={() => iframeRef.current?.contentWindow?.location.reload()}
                className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                title="Refresh"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
              title="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Content — the /preview iframe runs WebContainer with COEP/COOP headers */}
        <div className="flex-1 relative overflow-hidden">
          {/* Loading/error overlay */}
          {status !== 'ready' && status !== 'booting' && status !== 'installing' && status !== 'starting' && (
            <div className="absolute inset-0 flex flex-col items-center pt-[20%] px-6 z-10 bg-[var(--bg)]">
              {status === 'error' ? (
                <div className="text-center space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <p className="text-[13px] text-[var(--text-secondary)]">{error}</p>
                  <button
                    onClick={() => { setStatus('idle'); startPreview(); }}
                    className="text-[12px] text-[var(--primary)] hover:underline"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-4 h-4 text-[var(--text-tertiary)] animate-spin" />
                  <span className="text-[13px] text-[var(--text-secondary)]">{STATUS_LABELS[status]}</span>
                </div>
              )}
            </div>
          )}

          {/* The iframe — loads /preview which has COEP/COOP headers */}
          <iframe
            ref={iframeRef}
            src={`/preview?repo=${encodeURIComponent(repoFullName)}&branch=${encodeURIComponent(activeBranch)}`}
            className="w-full h-full border-0"
            title="Project preview"
            allow="cross-origin-isolated"
          />
        </div>

        {/* Footer — repo info + branch selector */}
        <div className="px-4 py-2 border-t border-[var(--border-subtle)] flex items-center gap-2">
          <svg className="w-3 h-3 text-[var(--text-tertiary)] flex-shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
          <span className="text-[11px] text-[var(--text-tertiary)] font-mono truncate">{repoFullName}</span>
          <span className="text-zinc-600 mx-0.5">/</span>
          <div className="relative">
            <button
              onClick={() => setBranchMenuOpen(!branchMenuOpen)}
              className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
              disabled={isLoading}
            >
              <GitBranch className="w-3 h-3" />
              {activeBranch}
              <ChevronDown className="w-2.5 h-2.5 text-[var(--text-tertiary)]" />
            </button>
            {branchMenuOpen && branches.length > 0 && (
              <div className="absolute bottom-full left-0 mb-1 w-56 max-h-48 overflow-y-auto bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-lg shadow-lg z-50">
                {branches.map((b) => (
                  <button
                    key={b.name}
                    onClick={() => {
                      setBranchMenuOpen(false);
                      if (b.name !== activeBranch) {
                        setActiveBranch(b.name);
                        startPreview(b.name);
                      }
                    }}
                    className={`w-full text-left px-3 py-1.5 text-[11px] font-mono transition-colors ${
                      b.name === activeBranch
                        ? 'text-[var(--text)] bg-[var(--bg-hover)]'
                        : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    {b.name}
                    {b.isDefault && <span className="ml-1.5 text-[9px] text-[var(--text-tertiary)]">default</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
