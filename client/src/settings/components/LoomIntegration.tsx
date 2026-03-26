'use client';

import React, { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/stores/auth.store';

/**
 * LoomIntegration Component
 * Settings panel for connecting/disconnecting Loom OAuth
 *
 * 🚫 TEMPORARILY DISABLED (Session 2026-02-13)
 * Loom uses SDK-based key-pair authentication instead of traditional OAuth.
 * This component is hidden from the UI pending implementation of key-pair auth flow.
 * Will be re-enabled in Phase 2b once Loom SDK integration is complete.
 *
 * @see docs/EPIC-26-design-link-integration.md for implementation roadmap
 * @see backend/src/integrations/loom/loom.service.ts for service implementation
 *
 * Phase 2: Metadata Enrichment
 * Allows users to connect Loom OAuth to fetch video metadata
 * (thumbnails, duration, titles)
 */
export function LoomIntegration() {
  const currentTeamId = useAuthStore((state) => state.currentTeamId);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  // Derive workspace ID from current team
  useEffect(() => {
    if (currentTeamId) {
      setWorkspaceId(`ws_team_${currentTeamId.substring(5, 17)}`);
    } else {
      setWorkspaceId(null);
    }
  }, [currentTeamId]);

  const handleConnect = async () => {
    if (!workspaceId) {
      setError('Unable to determine workspace. Please try again.');
      return;
    }

    try {
      setIsLoading(true);

      // Get Firebase ID token for authentication
      const user = auth.currentUser;
      if (!user) {
        setError('Please log in first');
        return;
      }

      const idToken = await user.getIdToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const returnUrl = `${window.location.origin}/settings?tab=integrations`;

      // Call the OAuth start endpoint with auth header
      // Backend will redirect to Loom OAuth page
      const response = await fetch(
        `${apiUrl}/integrations/loom/oauth/start?workspaceId=${workspaceId}&returnUrl=${encodeURIComponent(returnUrl)}`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
          redirect: 'manual', // Don't follow redirects automatically
        }
      );

      // Check if backend returned a redirect
      if (response.type === 'opaqueredirect' || response.status === 302 || response.status === 301) {
        // Get the redirect URL and navigate to it
        const redirectUrl = response.headers.get('Location') || response.url;
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          setError('Backend redirect did not include a location');
        }
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        setError('Failed to start Loom OAuth: ' + errorText);
        return;
      }
    } catch (err) {
      setError('Failed to connect to Loom: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Loom connect error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!isConnected) return;

    if (!confirm('Are you sure you want to disconnect Loom?')) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/integrations/loom/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect');
      }

      setIsConnected(false);
      setError(null);
    } catch (err) {
      setError('Failed to disconnect Loom');
      console.error('Disconnect failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-[var(--border-subtle)] p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-[var(--text-base)] font-medium text-[var(--text)] flex items-center gap-2">
            Loom
            {isConnected && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs font-medium">
                ✓ Connected
              </span>
            )}
          </h3>

          <p className="text-[var(--text-sm)] text-[var(--text-secondary)] mt-2">
            Connect Loom to fetch video metadata including title, duration, and thumbnails to provide rich context for
            video references in ticket specifications.
          </p>

          {isConnected && (
            <div className="mt-3 p-3 bg-[var(--bg-subtle)] rounded border border-[var(--border-subtle)]">
              <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
                ✓ Loom is connected. Video metadata will be automatically fetched when you add Loom links to tickets.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-3 p-3 bg-red-500/10 rounded border border-red-500/20">
              <p className="text-[var(--text-sm)] text-[var(--red)]">{error}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        {isConnected ? (
          <>
            {/* <button
              onClick={handleReconnect}
              disabled={isLoading}
              className="px-4 py-2 text-[var(--text-secondary)] bg-[var(--bg-hover)] hover:bg-[var(--bg)] rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Reconnecting...' : 'Reconnect'}
            </button> */}

            <button
              onClick={handleDisconnect}
              disabled={isLoading}
              className="px-4 py-2 text-[var(--red)] bg-red-500/10 hover:bg-red-500/20 rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Disconnecting...' : 'Disconnect'}
            </button>
          </>
        ) : (
          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="px-4 py-2 bg-[var(--bg-hover)] hover:bg-[var(--bg)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text)] rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Loading...' : 'Connect Loom'}
          </button>
        )}
      </div>
    </div>
  );
}
