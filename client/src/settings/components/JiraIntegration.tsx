'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/core/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/core/components/ui/dialog';
import { useServices } from '@/hooks/useServices';
import type { JiraConnectionStatus } from '@/services/jira.service';
import { Check, AlertCircle, Loader2 } from 'lucide-react';

export function JiraIntegration() {
  const { jiraService } = useServices();
  const [status, setStatus] = useState<JiraConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Form fields
  const [jiraUrl, setJiraUrl] = useState('');
  const [username, setUsername] = useState('');
  const [apiToken, setApiToken] = useState('');

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const s = await jiraService.getConnectionStatus();
      setStatus(s);
    } catch (err: any) {
      setError(err.message || 'Failed to load Jira status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!jiraUrl || !username || !apiToken) {
      setError('All fields are required');
      return;
    }

    setIsConnecting(true);
    setError(null);
    try {
      const result = await jiraService.connect(jiraUrl, username, apiToken);
      setStatus({ connected: true, jiraUrl: result.jiraUrl, username: result.username });
      setShowConnectForm(false);
      setApiToken(''); // Clear sensitive field
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await jiraService.disconnect();
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
              <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.593 24V12.518a1.005 1.005 0 0 0-1.022-1.005z" />
              <path d="M11.905 5.215h2.129v2.057a5.215 5.215 0 0 0 5.232 5.215h-7.36a1.005 1.005 0 0 1-1.001-1.005V5.215z" opacity=".65" />
              <path d="M17.373 0h-5.748a5.218 5.218 0 0 0 5.232 5.215h2.129v2.057A5.215 5.215 0 0 0 24.218 12.487V1.005A1.005 1.005 0 0 0 23.196 0h-5.823z" opacity=".35" />
            </svg>
            <h3 className="text-[var(--text-base)] font-medium text-[var(--text)]">
              Jira Integration
            </h3>
          </div>
          <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
            Export tickets as Jira issues
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
      {!isLoading && !status?.connected && !showConnectForm && (
        <div className="rounded-lg bg-[var(--bg-hover)] p-6 text-center">
          <h3 className="text-[var(--text-sm)] font-medium text-[var(--text)] mb-1">Connect Jira</h3>
          <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] mb-4">
            Export tickets directly to your Jira instance
          </p>
          <Button onClick={() => setShowConnectForm(true)} size="sm">
            Connect Jira
          </Button>
        </div>
      )}

      {/* Connect form */}
      {!isLoading && !status?.connected && showConnectForm && (
        <div className="rounded-lg border border-[var(--border)] p-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-[var(--text)] block mb-1">Jira URL</label>
            <input
              type="url"
              value={jiraUrl}
              onChange={(e) => setJiraUrl(e.target.value)}
              placeholder="https://mycompany.atlassian.net"
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text)] block mb-1">Email / Username</label>
            <input
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text)] block mb-1">API Token</label>
            <input
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="Your Jira API token"
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
            <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
              Generate at id.atlassian.com/manage-profile/security/api-tokens
            </p>
          </div>
          <div className="flex gap-2 pt-1">
            <Button onClick={handleConnect} disabled={isConnecting} size="sm">
              {isConnecting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connecting...</> : 'Connect'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setShowConnectForm(false); setError(null); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Connected */}
      {!isLoading && status?.connected && (
        <div className="flex items-center gap-2 text-[var(--text-sm)]">
          <Check className="h-4 w-4 text-green-500" />
          <span className="text-[var(--text-secondary)]">
            Connected to <span className="font-medium text-[var(--text)]">{status.jiraUrl}</span>
          </span>
        </div>
      )}

      {/* Disconnect Dialog */}
      <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Jira?</DialogTitle>
            <DialogDescription>
              This will remove your Jira connection. You can reconnect at any time.
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
