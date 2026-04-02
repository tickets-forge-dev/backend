'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { WebContainer } from '@webcontainer/api';
import { Suspense } from 'react';

/**
 * Standalone Preview Page — runs at /preview?repo=owner/name&branch=main
 *
 * This page has COEP/COOP headers (via next.config.js) that enable
 * SharedArrayBuffer for WebContainer. It's loaded inside an iframe
 * from the PreviewPanel slide-over.
 *
 * Communicates with the parent via postMessage:
 * - parent → iframe: { type: 'start', repo, branch, files }
 * - iframe → parent: { type: 'status', status, message }
 * - iframe → parent: { type: 'ready', url }
 * - iframe → parent: { type: 'error', message }
 */

type Status = 'waiting' | 'booting' | 'installing' | 'starting' | 'ready' | 'error';

// Persist WebContainer on window to survive React re-renders
function getContainer(): WebContainer | null {
  return (window as any).__wc ?? null;
}
function setContainer(wc: WebContainer) {
  (window as any).__wc = wc;
}

function PreviewRunner() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>('waiting');
  const [message, setMessage] = useState('Waiting for files...');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const notifyParent = useCallback((data: any) => {
    window.parent?.postMessage(data, '*');
  }, []);

  const runPreview = useCallback(async (files: Record<string, string>) => {
    try {
      // 1. Check for package.json
      if (!files['package.json']) {
        throw new Error('No package.json found');
      }

      // 2. Boot WebContainer (teardown existing if any)
      setStatus('booting');
      setMessage('Booting environment...');
      notifyParent({ type: 'status', status: 'booting' });

      let container = getContainer();
      if (container) {
        try { container.teardown(); } catch {}
        setContainer(null as any);
        container = null;
      }
      container = await WebContainer.boot();
      setContainer(container);

      // 3. Mount files
      setMessage('Mounting files...');
      const mountStructure = buildMountStructure(files);
      await container.mount(mountStructure);

      // 4. Install
      setStatus('installing');
      setMessage('Installing dependencies...');
      notifyParent({ type: 'status', status: 'installing' });

      const install = await container.spawn('npm', ['install', '--prefer-offline']);
      const installCode = await install.exit;
      if (installCode !== 0) {
        throw new Error(`npm install failed (exit ${installCode})`);
      }

      // 5. Start dev server
      setStatus('starting');
      setMessage('Starting dev server...');
      notifyParent({ type: 'status', status: 'starting' });

      const pkg = JSON.parse(files['package.json']);
      const script = pkg.scripts?.dev ? 'dev' : pkg.scripts?.start ? 'start' : null;
      if (!script) {
        throw new Error('No dev or start script in package.json');
      }

      await container.spawn('npm', ['run', script]);

      container.on('server-ready', (_port, url) => {
        setPreviewUrl(url);
        setStatus('ready');
        setMessage('Running');
        notifyParent({ type: 'ready', url });
      });

      // Timeout
      setTimeout(() => {
        if (!previewUrl) {
          setError('Dev server did not start within 60s');
          setStatus('error');
          notifyParent({ type: 'error', message: 'Timeout — dev server did not start' });
        }
      }, 60000);
    } catch (err: any) {
      setError(err.message);
      setStatus('error');
      notifyParent({ type: 'error', message: err.message });
    }
  }, [notifyParent]);

  // Listen for files from parent
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'start' && e.data.files) {
        runPreview(e.data.files);
      }
    };
    window.addEventListener('message', handler);

    // Also check for inline data via URL params (fallback)
    const repo = searchParams.get('repo');
    const branch = searchParams.get('branch');
    if (repo && branch) {
      // Notify parent we're ready to receive files
      notifyParent({ type: 'status', status: 'waiting' });
    }

    return () => window.removeEventListener('message', handler);
  }, [searchParams, runPreview, notifyParent]);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a', color: '#e8e8e8', fontFamily: 'system-ui' }}>
      {status !== 'ready' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          {status === 'error' ? (
            <>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 20 }}>!</span>
              </div>
              <p style={{ fontSize: 13, color: '#a1a1aa' }}>{error}</p>
            </>
          ) : (
            <>
              <div style={{ width: 20, height: 20, border: '2px solid #3f3f46', borderTopColor: '#a1a1aa', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
