'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/core/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/core/components/ui/dialog';
import { useServices } from '@/hooks/useServices';
import type { LinearConnectionStatus } from '@/services/linear.service';
import { Check, AlertCircle, Loader2, ExternalLink } from 'lucide-react';

export function LinearIntegration() {
  const { linearService } = useServices();
  const [status, setStatus] = useState<LinearConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('linear_connected') === 'true') {
      loadStatus();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const loadStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const s = await linearService.getConnectionStatus();
      setStatus(s);
    } catch (err: any) {
      setError(err.message || 'Failed to load Linear status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const url = await linearService.getOAuthUrl();
      window.location.href = url;
    } catch (err: any) {
      setError(err.message || 'Failed to connect');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await linearService.disconnect();
      setStatus({ connected: false });
      setShowDisconnectDialog(false);
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect');
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <svg className="h-5 w-5 text-[var(--text-secondary)]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.633 11.2a9.553 9.553 0 0 1 .776-2.297l4.324 4.324a3.04 3.04 0 0 0 3.34 3.34l4.324 4.324A9.6 9.6 0 0 1 2.633 11.2z" />
              <path d="M5.265 6.265l12.47 12.47A9.6 9.6 0 0 0 5.265 6.265z" />
              <path d="M21.367 12.8a9.553 9.553 0 0 1-.776 2.297l-4.324-4.324a3.04 3.04 0 0 0-3.34-3.34L8.603 3.109A9.6 9.6 0 0 1 21.367 12.8z" />
              <path d="M18.735 17.735L6.265 5.265A9.6 9.6 0 0 1 18.735 17.735z" />
            </svg>
            <h3 className="text-[var(--text-base)] font-medium text-[var(--text)]">
              Linear Integration
            </h3>
          </div>
          <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
            Export tickets as Linear issues
          </p>
        </div>
        {status?.connected && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDisconnectDialog(true)}
            disabled={isDisconnecting}
            className="text-[var(--text-secondary)] hover:text-[var(--text)]"
          >
            {isDisconnecting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Disconnecting...</> : 'Disconnect'}
          </Button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-500/10 p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-[var(--red)] mt-0.5" />
          <p className="text-[var(--text-sm)] text-[var(--red)]">{error}</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--text-tertiary)]" />
        </div>
      )}

      {/* Not connected */}
      {!isLoading && !status?.connected && (
        <div className="rounded-lg bg-[var(--bg-hover)] p-6 text-center">
          <h3 className="text-[var(--text-sm)] font-medium text-[var(--text)] mb-1">Connect Linear</h3>
          <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] mb-4">
            Export tickets directly to your Linear workspace
          </p>
          <Button onClick={handleConnect} disabled={isConnecting} size="sm">
            {isConnecting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connecting...</> : 'Connect Linear'}
          </Button>
        </div>
      )}

      {/* Connected */}
      {!isLoading && status?.connected && (
        <div className="flex items-center gap-2 text-[var(--text-sm)]">
          <Check className="h-4 w-4 text-green-500" />
          <span className="text-[var(--text-secondary)]">
            Connected as <span className="font-medium text-[var(--text)]">{status.userName}</span>
          </span>
        </div>
      )}

      {/* Disconnect Dialog */}
      <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Linear?</DialogTitle>
            <DialogDescription>
              This will remove your Linear connection. You can reconnect at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisconnectDialog(false)}>Cancel</Button>
            <Button onClick={handleDisconnect}>Disconnect</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
