'use client';

import React, { useEffect, useState } from 'react';
import { useServices } from '@/hooks/useServices';
import { auth } from '@/lib/firebase';
import { useSearchParams } from 'next/navigation';

/**
 * FigmaIntegration Component
 * Settings panel for connecting/disconnecting Figma OAuth
 *
 * Phase 2: Metadata Enrichment
 * Allows users to connect Figma OAuth to fetch design file metadata
 * (thumbnails, file names, last modified dates)
 */
export function FigmaIntegration() {
  const { ticketService } = useServices();
  const searchParams = useSearchParams();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  // Get workspace ID and check if Figma is already connected
  useEffect(() => {
    const initialize = async () => {
      try {
        // Try to get workspace ID from the first ticket
        const tickets = await ticketService.list();
        if (tickets.length > 0) {
          setWorkspaceId(tickets[0].workspaceId);
        } else {
          // Fallback: use a temporary workspace ID that will be validated by backend
          // Backend will extract the actual workspace from the JWT token
          // For now, use a placeholder that the backend will override
          setWorkspaceId('current');
        }

        // Check if we're returning from OAuth callback
        const status = searchParams.get('status');
        const provider = searchParams.get('provider');

        if (provider === 'figma') {
          if (status === 'success') {
            setIsConnected(true);
            setError(null);
            return;
          } else if (status === 'error') {
            const errorMsg = searchParams.get('error') || 'Unknown error during OAuth';
            setError(`Failed to connect Figma: ${errorMsg}`);
            setIsConnected(false);
            return;
          }
        }

        // Check if Figma is already connected
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
        const response = await fetch(`${apiUrl}/integrations/figma/oauth/status`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.connected) {
            setIsConnected(true);
            setError(null);
          }
        }
      } catch (err) {
        console.warn('Failed to check Figma connection status', err);
        // Don't show error - connection check is optional
      }
    };

    initialize();
  }, [ticketService, searchParams]);

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
      // The endpoint returns the OAuth URL instead of redirecting (to avoid CORS issues)
      const response = await fetch(
        `${apiUrl}/integrations/figma/oauth/start?workspaceId=${workspaceId}&returnUrl=${encodeURIComponent(returnUrl)}`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        setError('Failed to start Figma OAuth: ' + errorText);
        return;
      }

      // Backend returns the OAuth URL as JSON
      const data = await response.json();
      if (data.oauthUrl) {
        // Redirect to Figma OAuth endpoint
        window.location.href = data.oauthUrl;
      } else {
        setError('Invalid response from server');
      }
    } catch (err) {
      setError('Failed to connect to Figma: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Figma connect error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!isConnected) return;

    if (!confirm('Are you sure you want to disconnect Figma?')) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/integrations/figma/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect');
      }

      setIsConnected(false);
      setError(null);
    } catch (err) {
      setError('Failed to disconnect Figma');
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
            🎨 Figma
            {isConnected && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium">
                ✓ Connected
              </span>
            )}
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Connect Figma to fetch design file metadata, thumbnails, and file information to enrich ticket
            specifications with design context.
          </p>

          {isConnected && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                ✓ Figma is connected. Design file metadata will be automatically fetched when you add Figma links to
                tickets.
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
            {isLoading ? 'Loading...' : 'Connect Figma'}
          </button>
        )}
      </div>
    </div>
  );
}
