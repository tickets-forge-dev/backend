'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Maximize2, Minimize2, Loader2, RefreshCw, AlertCircle, GitBranch, ChevronDown } from 'lucide-react';
import { WebContainer } from '@webcontainer/api';
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
  booting: 'Booting WebContainer...',
  installing: 'Installing dependencies...',
  starting: 'Starting dev server...',
  ready: 'Preview ready',
  error: 'Preview failed',
};

// Singleton WebContainer instance (only one allowed per page)
// Stored on window to survive Next.js hot reloads
function getWebContainer(): WebContainer | null {
  if (typeof window === 'undefined') return null;
  return (window as any).__webcontainer ?? null;
}

function setWebContainer(instance: WebContainer) {
  if (typeof window !== 'undefined') {
    (window as any).__webcontainer = instance;
  }
}

export function PreviewPanel({ open, onClose, repoFullName, branch }: PreviewPanelProps) {
  const { gitHubService } = useServices();
  const [status, setStatus] = useState<PreviewStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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

  const startPreview = useCallback(async (branchOverride?: string) => {
    const targetBranch = branchOverride || activeBranch;
    abortRef.current = false;
    setStatus('fetching');
    setError(null);
    setPreviewUrl(null);
    setLogs([]);

    const [owner, repo] = repoFullName.split('/');
    if (!owner || !repo) {
      setError('Invalid repository name');
      setStatus('error');
      return;
    }

    try {
      // 1. Fetch repo files — fall back to default branch if target branch doesn't exist
      let usedBranch = targetBranch;
      let files: Record<string, string>;
      let truncated: boolean;

      addLog(`Fetching files from ${repoFullName}@${targetBranch}...`);
      try {
        const result = await gitHubService.getRepoContents(owner, repo, targetBranch);
        files = result.files;
        truncated = result.truncated;
      } catch (branchErr: any) {
        if (branchErr?.response?.status === 404 || branchErr?.message?.includes('404') || branchErr?.message?.includes('not found')) {
          setError(`Branch "${targetBranch}" does not exist on GitHub. The code may not have been pushed yet.`);
          setStatus('error');
          return;
        }
        throw branchErr;
      }

      const fileCount = Object.keys(files).length;
      addLog(`Fetched ${fileCount} files from ${usedBranch}${truncated ? ' (truncated)' : ''}`);

      if (abortRef.current) return;

      // Backend already detects the web app root and returns files relative to it
      const mountFiles = files;

      // Verify we have a package.json (backend should always include one)
      if (!mountFiles['package.json']) {
        setError('No previewable web app found — needs package.json with a dev/start script');
        setStatus('error');
        return;
      }

      // 2. Boot WebContainer
      setStatus('booting');
      addLog('Booting WebContainer...');

      let container = getWebContainer();
      if (!container) {
        container = await WebContainer.boot();
        setWebContainer(container);
      }

      if (abortRef.current) return;

      // 3. Mount files
      addLog(`Mounting ${Object.keys(mountFiles).length} files...`);
      const mountStructure = buildMountStructure(mountFiles);
      await container.mount(mountStructure);

      if (abortRef.current) return;

      // 4. Install dependencies
      setStatus('installing');
      addLog('Running npm install...');

      const installProcess = await container.spawn('npm', ['install']);
      installProcess.output.pipeTo(
        new WritableStream({
          write(chunk) {
            // Only log meaningful lines
            const line = chunk.trim();
            if (line && !line.startsWith('npm warn')) {
              addLog(line);
            }
          },
        }),
      );
      const installCode = await installProcess.exit;
      if (installCode !== 0) {
        setError(`npm install failed with exit code ${installCode}`);
        setStatus('error');
        return;
      }

      if (abortRef.current) return;

      // 5. Start dev server
      setStatus('starting');
      addLog('Starting dev server...');

      // Detect start command from package.json
      const pkg = JSON.parse(mountFiles['package.json']);
      const startScript = pkg.scripts?.dev ? 'dev' : pkg.scripts?.start ? 'start' : null;
      if (!startScript) {
        setError('No "dev" or "start" script found in package.json');
        setStatus('error');
        return;
      }

      await container.spawn('npm', ['run', startScript]);

      // Wait for server-ready event
      container.on('server-ready', (_port, url) => {
        addLog(`Server ready at ${url}`);
        setPreviewUrl(url);
        setStatus('ready');
      });

      // Timeout after 60s
      setTimeout(() => {
        if (status !== 'ready' && !abortRef.current) {
          setError('Dev server did not start within 60 seconds');
          setStatus('error');
        }
      }, 60_000);
    } catch (err: any) {
      if (!abortRef.current) {
        setError(err.message || 'Preview failed');
        setStatus('error');
        addLog(`Error: ${err.message}`);
      }
    }
  }, [repoFullName, activeBranch, gitHubService, addLog]);

  // Start preview when panel opens
  useEffect(() => {
    if (open && status === 'idle') {
      startPreview();
    }
    return () => {
      abortRef.current = true;
    };
  }, [open]);

  // Reset when panel closes
  useEffect(() => {
    if (!open) {
      abortRef.current = true;
      setStatus('idle');
      setPreviewUrl(null);
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
                title="Refresh preview"
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
              title="Close preview"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative overflow-hidden">
          {/* Loading / Error state */}
          {status !== 'ready' && (
            <div className="absolute inset-0 flex flex-col items-center pt-[20%] px-6">
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
                <div className="w-full max-w-xs space-y-4">
                  {/* Progress steps */}
                  {(['fetching', 'booting', 'installing', 'starting'] as PreviewStatus[]).map((step) => {
                    const stepOrder = ['fetching', 'booting', 'installing', 'starting'];
                    const currentIdx = stepOrder.indexOf(status);
                    const stepIdx = stepOrder.indexOf(step);
                    const isDone = stepIdx < currentIdx;
                    const isCurrent = step === status;

                    return (
                      <div key={step} className="flex items-center gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          isDone ? 'bg-emerald-500' :
                          isCurrent ? 'bg-amber-500 animate-pulse' :
                          'bg-[var(--border)]'
                        }`} />
                        <span className={`text-[12px] ${
                          isCurrent ? 'text-[var(--text-secondary)]' :
                          isDone ? 'text-[var(--text-tertiary)]' :
                          'text-[var(--text-tertiary)]/50'
                        }`}>
                          {STATUS_LABELS[step]}
                        </span>
                      </div>
                    );
                  })}

                  {/* Live logs */}
                  {logs.length > 0 && (
                    <div className="mt-4 rounded-md bg-[var(--bg-hover)]/40 border border-[var(--border-subtle)] p-3 max-h-40 overflow-y-auto">
                      {logs.slice(-8).map((log, i) => (
                        <p key={i} className="text-[10px] font-mono text-[var(--text-tertiary)] leading-relaxed truncate">
                          {log}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Preview iframe */}
          {previewUrl && (
            <iframe
              ref={iframeRef}
              src={previewUrl}
              className="w-full h-full border-0"
              title="Project preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
          )}
        </div>

        {/* Footer — repo info + branch selector */}
        <div className="px-4 py-2 border-t border-[var(--border-subtle)] flex items-center gap-2">
          <svg className="w-3 h-3 text-[var(--text-tertiary)] flex-shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
          <span className="text-[11px] text-[var(--text-tertiary)] font-mono truncate">{repoFullName}</span>
          <span className="text-zinc-600 mx-0.5">/</span>
          {/* Branch selector */}
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

/**
 * Detect the previewable web app root in any project structure.
 *
 * Algorithm:
 * 1. Find ALL package.json files in the repo
 * 2. Parse each one and score it based on:
 *    - Has dev/start script (required — can't preview without it)
 *    - Has web framework dependencies (react, next, vue, angular, svelte, etc.)
 *    - Is NOT a workspace root (has "workspaces" field = coordinator, not an app)
 *    - Depth in tree (prefer shallower — "client/package.json" over "packages/shared/utils/package.json")
 * 3. Return the highest-scoring one
 *
 * This works for ANY project structure — no directory name guessing.
 */
const WEB_DEPS = new Set([
  'react', 'react-dom', 'next', 'vue', 'nuxt', '@angular/core', 'svelte',
  '@sveltejs/kit', 'astro', 'remix', '@remix-run/react', 'gatsby', 'vite',
  'solid-js', 'preact', 'lit', 'qwik', '@builder.io/qwik',
]);

interface DetectedApp {
  root: string; // '' for repo root, 'client' for client/, etc.
  score: number;
}

function detectWebAppRoot(files: Record<string, string>): DetectedApp | null {
  // Find all package.json files
  const pkgPaths = Object.keys(files).filter(f => f === 'package.json' || f.endsWith('/package.json'));

  if (pkgPaths.length === 0) return null;

  const candidates: DetectedApp[] = [];

  for (const pkgPath of pkgPaths) {
    let pkg: any;
    try {
      pkg = JSON.parse(files[pkgPath]);
    } catch {
      continue;
    }

    // Must have a dev or start script — can't preview without one
    const hasDev = !!pkg.scripts?.dev;
    const hasStart = !!pkg.scripts?.start;
    if (!hasDev && !hasStart) continue;

    // Skip workspace roots (coordinators, not apps)
    if (pkg.workspaces) continue;

    // Calculate directory root
    const root = pkgPath === 'package.json' ? '' : pkgPath.replace('/package.json', '');
    const depth = root ? root.split('/').length : 0;

    // Score based on web framework presence
    let score = 0;
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    for (const dep of Object.keys(allDeps || {})) {
      if (WEB_DEPS.has(dep)) {
        score += 10; // Each web dep adds 10 points
      }
    }

    // Prefer "dev" script over just "start" (dev = development server, more likely web)
    if (hasDev) score += 5;
    if (hasStart) score += 2;

    // Prefer shallower directories (root > client/ > packages/web/)
    score -= depth * 2;

    // Root package gets a small bonus (if it's not a workspace root, it's a single-package project)
    if (root === '') score += 3;

    candidates.push({ root, score });
  }

  if (candidates.length === 0) return null;

  // Sort by score descending, then by path length ascending (prefer shallower)
  candidates.sort((a, b) => b.score - a.score || a.root.length - b.root.length);

  return candidates[0];
}

/**
 * Convert a flat { path: content } map into WebContainer's mount structure.
 * e.g., { "src/index.ts": "..." } → { src: { directory: { "index.ts": { file: { contents: "..." } } } } }
 */
function buildMountStructure(files: Record<string, string>): Record<string, any> {
  const root: Record<string, any> = {};

  for (const [filePath, content] of Object.entries(files)) {
    const parts = filePath.split('/');
    let current = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const dir = parts[i];
      if (!current[dir]) {
        current[dir] = { directory: {} };
      }
      current = current[dir].directory;
    }

    const fileName = parts[parts.length - 1];
    current[fileName] = {
      file: { contents: content },
    };
  }

  return root;
}
