'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { WebContainer } from '@webcontainer/api';

/**
 * Standalone Preview Page — /preview?repo=owner/name&branch=main
 *
 * This page has COEP/COOP headers (via next.config.js) enabling
 * SharedArrayBuffer for WebContainer. It runs in its own tab
 * (not iframe) because cross-origin isolation can't be inherited.
 *
 * Files are passed via sessionStorage (set by PreviewPanel).
 */

type Status = 'loading' | 'booting' | 'installing' | 'starting' | 'ready' | 'error';

function PreviewRunner() {
  const searchParams = useSearchParams();
  const repo = searchParams.get('repo') || '';
  const branch = searchParams.get('branch') || 'main';

  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('Loading project files...');
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const runPreview = useCallback(async (files: Record<string, string>) => {
    try {
      if (!files['package.json']) {
        throw new Error('No package.json found');
      }

      // Boot WebContainer
      setStatus('booting');
      setMessage('Starting environment...');

      // Teardown any existing instance
      const existing = (window as any).__wc;
      if (existing) {
        try { existing.teardown(); } catch {}
      }

      const container = await WebContainer.boot();
      (window as any).__wc = container;

      // Clean package.json — strip workspace: protocol (pnpm-only, npm can't handle it)
      if (files['package.json']) {
        try {
          const pkg = JSON.parse(files['package.json']);
          const cleanDeps = (deps: Record<string, string> | undefined) => {
            if (!deps) return;
            for (const [key, value] of Object.entries(deps)) {
              if (typeof value === 'string' && value.startsWith('workspace:')) {
                delete deps[key]; // Remove workspace deps — they're internal packages not available here
              }
            }
          };
          cleanDeps(pkg.dependencies);
          cleanDeps(pkg.devDependencies);
          files['package.json'] = JSON.stringify(pkg, null, 2);
        } catch {}
      }

      // Remove lock files that confuse npm in WebContainer
      delete files['pnpm-lock.yaml'];
      delete files['yarn.lock'];
      delete files['package-lock.json'];

      // Mount files
      setMessage('Mounting files...');
      await container.mount(buildMountStructure(files));

      // Install
      setStatus('installing');
      setMessage('Installing dependencies...');
      const install = await container.spawn('npm', ['install', '--legacy-peer-deps', '--no-package-lock']);
      const installOutput: string[] = [];
      install.output.pipeTo(new WritableStream({
        write(chunk) {
          installOutput.push(chunk);
          // Show last meaningful line
          const line = chunk.trim();
          if (line && !line.startsWith('npm warn')) {
            setMessage(`Installing... ${line.slice(0, 60)}`);
          }
        },
      }));
      const code = await install.exit;
      if (code !== 0) {
        const errLines = installOutput.filter(l => l.includes('ERR') || l.includes('error')).join('\n').slice(0, 200);
        throw new Error(`npm install failed:\n${errLines || 'Check console for details'}`);
      }

      // Start dev server
      setStatus('starting');
      setMessage('Starting dev server...');
      const pkg = JSON.parse(files['package.json']);
      const script = pkg.scripts?.dev ? 'dev' : pkg.scripts?.start ? 'start' : null;
      if (!script) throw new Error('No dev or start script found');

      await container.spawn('npm', ['run', script]);

      container.on('server-ready', (_port, url) => {
        setPreviewUrl(url);
        setStatus('ready');
        setMessage('Running');
      });

      setTimeout(() => {
        if (!previewUrl) {
          setError('Dev server did not start within 60 seconds');
          setStatus('error');
        }
      }, 60000);
    } catch (err: any) {
      setError(err.message);
      setStatus('error');
    }
  }, []);

  // Read files from sessionStorage on mount
  useEffect(() => {
    const raw = sessionStorage.getItem('forge:preview-files');
    if (!raw) {
      setError('No project files found. Please run the preview from a ticket.');
      setStatus('error');
      return;
    }

    try {
      const files = JSON.parse(raw);
      // Clean up sessionStorage after reading
      sessionStorage.removeItem('forge:preview-files');
      sessionStorage.removeItem('forge:preview-meta');
      runPreview(files);
    } catch {
      setError('Failed to parse project files');
      setStatus('error');
    }
  }, [runPreview]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const wc = (window as any).__wc;
      if (wc) {
        try { wc.teardown(); } catch {}
        delete (window as any).__wc;
      }
    };
  }, []);

  return (
    <div style={{
      width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column',
      background: '#0a0a0a', color: '#e8e8e8', fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: '#a1a1aa',
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: status === 'ready' ? '#22c55e' : status === 'error' ? '#ef4444' : '#f59e0b',
          animation: status !== 'ready' && status !== 'error' ? 'pulse 1.5s infinite' : 'none',
        }} />
        <span>{message}</span>
        {repo && (
          <span style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: 11, color: '#71717a' }}>
            {repo} @ {branch}
          </span>
        )}
      </div>

      {/* Content */}
      {status !== 'ready' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          {status === 'error' ? (
            <>
              <div style={{ fontSize: 24 }}>!</div>
              <p style={{ fontSize: 13, color: '#a1a1aa', maxWidth: 400, textAlign: 'center' }}>{error}</p>
            </>
          ) : (
            <>
              <div style={{
                width: 24, height: 24, border: '2px solid #3f3f46', borderTopColor: '#a1a1aa',
                borderRadius: '50%', animation: 'spin 0.8s linear infinite',
              }} />
              <p style={{ fontSize: 13, color: '#a1a1aa' }}>{message}</p>
            </>
          )}
        </div>
      )}

      {previewUrl && (
        <iframe
          ref={iframeRef}
          src={previewUrl}
          style={{ flex: 1, border: 'none', width: '100%' }}
          title="App preview"
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div style={{ background: '#0a0a0a', width: '100vw', height: '100vh' }} />}>
      <PreviewRunner />
    </Suspense>
  );
}

function buildMountStructure(files: Record<string, string>): Record<string, any> {
  const root: Record<string, any> = {};
  for (const [filePath, content] of Object.entries(files)) {
    const parts = filePath.split('/');
    let current = root;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = { directory: {} };
      current = current[parts[i]].directory;
    }
    current[parts[parts.length - 1]] = { file: { contents: content } };
  }
  return root;
}
