'use client';

import React, { useEffect, useState } from 'react';
import { useServices } from '@/hooks/useServices';
import { auth } from '@/lib/firebase';
import { useSearchParams } from 'next/navigation';

/**
 * FigmaIntegration Component
 * Settings panel for connecting/disconnecting Figma
 * Supports both OAuth (requires public app approval) and Personal Access Tokens (immediate)
 */
export function FigmaIntegration() {
  const { ticketService } = useServices();
  const searchParams = useSearchParams();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionMethod, setConnectionMethod] = useState<'oauth' | 'personal_token' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [personalToken, setPersonalToken] = useState('');

  // Get workspace ID and check if Figma is already connected
  useEffect(() => {
    const initialize = async () => {
      try {
        // Try to get workspace ID from the first ticket
        const tickets = await ticketService.list();
        if (tickets.length > 0) {
          setWorkspaceId(tickets[0].workspaceId);
        } else {
          setWorkspaceId('current');
        }

        // Check if we're returning from OAuth callback
        const status = searchParams.get('status');
        const provider = searchParams.get('provider');

        if (provider === 'figma') {
          if (status === 'success') {
            setIsConnected(true);
            setConnectionMethod('oauth');
            setError(null);
            return;
          } else if (status === 'error') {
            const errorMsg = searchParams.get('error') || 'Unknown error during OAuth';
            setError(`Failed to connect Figma: ${errorMsg}`);
            setIsConnected(false);
            return;
          }
        }

        // Check if Figma is already connected via status endpoint
        const user = auth.currentUser;
        if (user) {
          const idToken = await user.getIdToken();
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
          const response = await fetch(`${apiUrl}/integrations/figma/oauth/status`, {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.connected) {
              setIsConnected(true);
              setConnectionMethod(data.connectionMethod || 'oauth');
              setError(null);
            } else if (data.expired) {
              setIsConnected(false);
              setError('Figma connection expired. Please reconnect.');
            }
          }
        }
      } catch (err) {
        console.warn('Failed to check Figma connection status', err);
        // Don't show error - connection check is optional
      }
    };

    initialize();
  }, [ticketService, searchParams]);

  const handleConnectOAuth = async () => {
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
      if (data.authUrl) {
        // Redirect to Figma OAuth endpoint
        window.location.href = data.authUrl;
      } else {
        setError('Invalid response from server: ' + JSON.stringify(data));
      }
    } catch (err) {
      setError('Failed to connect to Figma: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Figma connect error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToken = async () => {
    if (!personalToken.trim()) {
      setError('Please enter your Figma Personal Access Token');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const user = auth.currentUser;
      if (!user) {
        setError('Please log in first');
        return;
      }

      const idToken = await user.getIdToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

      const response = await fetch(`${apiUrl}/integrations/figma/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ token: personalToken.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save token');
        return;
      }

      const data = await response.json();
      setIsConnected(true);
      setConnectionMethod('personal_token');
      setShowTokenInput(false);
      setPersonalToken('');
      setError(null);
    } catch (err) {
      setError('Failed to save token: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Token save error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!isConnected) return;

    if (!confirm('Are you sure you want to disconnect Figma?')) return;

    try {
      setIsLoading(true);

      const user = auth.currentUser;
      if (!user) {
        setError('Please log in first');
        return;
      }

      const idToken = await user.getIdToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

      const response = await fetch(`${apiUrl}/integrations/figma/oauth/disconnect`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect');
      }

      setIsConnected(false);
      setConnectionMethod(null);
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
                ✓ Connected ({connectionMethod === 'oauth' ? 'OAuth' : 'Token'})
              </span>
            )}
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Connect Figma to fetch design file metadata, thumbnails, and extract design tokens to enrich ticket
            specifications with design context.
          </p>

          {isConnected && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                ✓ Figma is connected via {connectionMethod === 'oauth' ? 'OAuth' : 'Personal Access Token'}. Design file metadata will be automatically fetched when you add Figma links to
                tickets.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-900 dark:text-red-200">{error}</p>
            </div>
          )}

          {!isConnected && (
            <div className="mt-4 space-y-3">
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-900 dark:text-yellow-200">
                  <strong>Note:</strong> OAuth requires public app approval (several days). Use Personal Access Token for immediate access.
                </p>
              </div>

              {showTokenInput && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Personal Access Token
                  </label>
                  <input
                    type="password"
                    value={personalToken}
                    onChange={(e) => setPersonalToken(e.target.value)}
                    placeholder="figd_xxxxxxxxxxxx"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Get your token from{' '}
                    <a
                      href="https://www.figma.com/settings"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Figma Settings → Security → Personal Access Tokens
                    </a>
                    <br />
                    <strong className="text-gray-700 dark:text-gray-300">Required scopes:</strong> file_content:read, file_metadata:read, current_user:read
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        {isConnected ? (
          <button
            onClick={handleDisconnect}
            disabled={isLoading}
            className="px-4 py-2 text-red-700 dark:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Disconnecting...' : 'Disconnect'}
          </button>
        ) : (
          <>
            {!showTokenInput ? (
              <>
                <button
                  onClick={() => setShowTokenInput(true)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  Use Personal Access Token (Recommended)
                </button>
                <button
                  onClick={handleConnectOAuth}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Loading...' : 'Connect with OAuth (requires approval)'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSaveToken}
                  disabled={isLoading || !personalToken.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Saving...' : 'Save Token'}
                </button>
                <button
                  onClick={() => {
                    setShowTokenInput(false);
                    setPersonalToken('');
                    setError(null);
                  }}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
