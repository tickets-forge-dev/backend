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
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            📹 Loom
            {isConnected && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium">
                ✓ Connected
              </span>
            )}
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Connect Loom to fetch video metadata including title, duration, and thumbnails to provide rich context for
            video references in ticket specifications.
          </p>

          {isConnected && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                ✓ Loom is connected. Video metadata will be automatically fetched when you add Loom links to tickets.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-900 dark:text-red-200">{error}</p>
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
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Reconnecting...' : 'Reconnect'}
            </button> */}

            <button
              onClick={handleDisconnect}
              disabled={isLoading}
              className="px-4 py-2 text-red-700 dark:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Disconnecting...' : 'Disconnect'}
            </button>
          </>
        ) : (
          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Loading...' : 'Connect Loom'}
          </button>
        )}
      </div>
    </div>
  );
}
