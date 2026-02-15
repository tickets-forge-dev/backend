# Story 26-14: Frontend - Settings Page Integrations

**Epic:** Epic 26 - Design Link Integration with LLM Leverage
**Status:** TODO (Blocked by: Phase 1 + 26-09 + 26-11)
**Priority:** HIGH
**Effort:** 2.5 hours
**Assignee:** TBD

---

## Objective

Implement Figma and Loom OAuth integration UI in the Settings page, following the existing Jira/Linear integration pattern:
1. Create FigmaIntegration settings component with Connect/Reconnect/Disconnect buttons
2. Create LoomIntegration settings component with Connect/Reconnect/Disconnect buttons
3. Display connection status (email, workspace, last synced)
4. Initiate OAuth flows (open OAuth authorize URL in popup)
5. Handle OAuth callbacks with query params (connected=true, error=...)
6. Show integration status in Settings › Integrations page

---

## Acceptance Criteria

- ✅ FigmaIntegration component created with full OAuth flow
- ✅ LoomIntegration component created with full OAuth flow
- ✅ Display connection status: "Connected as alice@company.com" or "Not Connected"
- ✅ Display workspace/team name if available
- ✅ Display last synced timestamp
- ✅ Connect button: Opens OAuth authorize URL in popup window
- ✅ Disconnect button: Calls DELETE /figma/oauth/disconnect (or loom)
- ✅ Reconnect button: Shows when already connected
- ✅ Error handling: Query param error=invalid_state, error=figma_connection_failed, etc.
- ✅ Success handling: Query param figma_connected=true, loom_connected=true
- ✅ Close popup on callback and refresh connection status
- ✅ Keyboard: Escape to close popup
- ✅ Loading states: Disable buttons while fetching
- ✅ Uses shadcn/ui components (Button, Card)
- ✅ Follows Jira/Linear pattern exactly
- ✅ No console warnings or TypeScript errors

---

## Files Created

```
client/src/settings/components/
  ├── FigmaIntegration.tsx                    (NEW - Figma OAuth UI)
  └── LoomIntegration.tsx                     (NEW - Loom OAuth UI)

client/src/services/
  └── design-integration.service.ts           (NEW - API calls for OAuth)
```

---

## Files Modified

```
client/src/settings/components/Settings.tsx (or similar)
  - Import FigmaIntegration and LoomIntegration components
  - Add section "Design Tools" with both components
  - Position above or below existing integrations

client/src/settings/components/IntegrationsTab.tsx (if separate)
  - Same changes as above
```

---

## Implementation Notes

### 1. DesignIntegrationService

```typescript
// client/src/services/design-integration.service.ts
export interface FigmaConnectionStatus {
  connected: boolean;
  email?: string;
  workspace?: string;
  connectedAt?: string;
}

export interface LoomConnectionStatus {
  connected: boolean;
  email?: string;
  workspace?: string;
  connectedAt?: string;
}

@Injectable()
export class DesignIntegrationService {
  constructor(private readonly httpClient: HttpClient) {}

  // Figma OAuth
  async getFigmaOAuthUrl(workspaceId: string): Promise<{ oauthUrl: string; state: string }> {
    return this.httpClient
      .get<{ oauthUrl: string; state: string }>(
        `${this.apiUrl}/figma/oauth/authorize?workspaceId=${workspaceId}`,
      )
      .toPromise()
      .then(data => data!);
  }

  async getFigmaConnectionStatus(workspaceId: string): Promise<FigmaConnectionStatus> {
    return this.httpClient
      .get<FigmaConnectionStatus>(
        `${this.apiUrl}/figma/oauth/connection?workspaceId=${workspaceId}`,
      )
      .toPromise()
      .then(data => data!);
  }

  async disconnectFigma(workspaceId: string): Promise<{ success: boolean }> {
    return this.httpClient
      .post<{ success: boolean }>(`${this.apiUrl}/figma/oauth/disconnect`, {
        workspaceId,
      })
      .toPromise()
      .then(data => data!);
  }

  // Loom OAuth
  async getLoomOAuthUrl(workspaceId: string): Promise<{ oauthUrl: string; state: string }> {
    return this.httpClient
      .get<{ oauthUrl: string; state: string }>(
        `${this.apiUrl}/loom/oauth/authorize?workspaceId=${workspaceId}`,
      )
      .toPromise()
      .then(data => data!);
  }

  async getLoomConnectionStatus(workspaceId: string): Promise<LoomConnectionStatus> {
    return this.httpClient
      .get<LoomConnectionStatus>(
        `${this.apiUrl}/loom/oauth/connection?workspaceId=${workspaceId}`,
      )
      .toPromise()
      .then(data => data!);
  }

  async disconnectLoom(workspaceId: string): Promise<{ success: boolean }> {
    return this.httpClient
      .post<{ success: boolean }>(`${this.apiUrl}/loom/oauth/disconnect`, {
        workspaceId,
      })
      .toPromise()
      .then(data => data!);
  }
}
```

### 2. FigmaIntegration Component

```typescript
// client/src/settings/components/FigmaIntegration.tsx
interface FigmaIntegrationProps {
  workspaceId: string;
}

export function FigmaIntegration({ workspaceId }: FigmaIntegrationProps) {
  const [status, setStatus] = useState<FigmaConnectionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const service = useServices().designIntegrationService;

  // Fetch connection status on mount
  useEffect(() => {
    loadStatus();
  }, [workspaceId]);

  // Handle OAuth callback from query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const figmaConnected = params.get('figma_connected');
    const error = params.get('error');

    if (figmaConnected === 'true') {
      // Refresh status after successful OAuth
      loadStatus();
      // Clean up query params
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (error === 'invalid_state' || error === 'figma_connection_failed') {
      // Show error toast
      toast.error(`Figma connection failed: ${error}`);
      // Clean up query params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const connectionStatus = await service.getFigmaConnectionStatus(workspaceId);
      setStatus(connectionStatus);
    } catch (error) {
      console.error('Failed to load Figma connection status:', error);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      const { oauthUrl } = await service.getFigmaOAuthUrl(workspaceId);

      // Open OAuth in popup window
      const popup = window.open(oauthUrl, 'figma-oauth', 'width=500,height=600');

      // Poll for popup close (OAuth callback)
      const interval = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(interval);
          // Refresh status after OAuth callback
          loadStatus();
        }
      }, 500);
    } catch (error) {
      console.error('Failed to initiate Figma OAuth:', error);
      toast.error('Failed to connect Figma');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Figma?')) return;

    try {
      setDisconnecting(true);
      await service.disconnectFigma(workspaceId);
      setStatus({ connected: false });
      toast.success('Figma disconnected');
    } catch (error) {
      console.error('Failed to disconnect Figma:', error);
      toast.error('Failed to disconnect Figma');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="border border-border rounded-lg p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <span>🎨</span> Figma
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            Access design files and extract metadata from Figma to enhance ticket specifications.
          </p>
        </div>

        {/* Status Badge */}
        {status?.connected && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium">
            <Check className="h-3 w-3" />
            Connected
          </span>
        )}
        {!status?.connected && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-medium">
            <X className="h-3 w-3" />
            Not Connected
          </span>
        )}
      </div>

      {/* Connection Info */}
      {status?.connected && (
        <div className="space-y-1 mb-4 text-sm">
          <p>
            <span className="text-muted-foreground">Status:</span> Connected as{' '}
            <strong>{status.email}</strong>
          </p>
          {status.workspace && (
            <p>
              <span className="text-muted-foreground">Workspace:</span> {status.workspace}
            </p>
          )}
          {status.connectedAt && (
            <p>
              <span className="text-muted-foreground">Last synced:</span> {formatDate(status.connectedAt)}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {status?.connected ? (
          <>
            <Button
              onClick={handleConnect}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? 'Reconnecting...' : 'Reconnect'}
            </Button>
            <Button
              onClick={handleDisconnect}
              disabled={disconnecting}
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
            >
              {disconnecting ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          </>
        ) : (
          <Button
            onClick={handleConnect}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? 'Connecting...' : 'Connect Figma'}
          </Button>
        )}
      </div>
    </div>
  );
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (hours < 1) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  if (days < 1) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? '2-digit' : undefined,
  });
}
```

### 3. LoomIntegration Component

```typescript
// client/src/settings/components/LoomIntegration.tsx
interface LoomIntegrationProps {
  workspaceId: string;
}

export function LoomIntegration({ workspaceId }: LoomIntegrationProps) {
  const [status, setStatus] = useState<LoomConnectionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const service = useServices().designIntegrationService;

  // Fetch connection status on mount
  useEffect(() => {
    loadStatus();
  }, [workspaceId]);

  // Handle OAuth callback from query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loomConnected = params.get('loom_connected');
    const error = params.get('error');

    if (loomConnected === 'true') {
      // Refresh status after successful OAuth
      loadStatus();
      // Clean up query params
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (error === 'invalid_state' || error === 'loom_connection_failed') {
      // Show error toast
      toast.error(`Loom connection failed: ${error}`);
      // Clean up query params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const connectionStatus = await service.getLoomConnectionStatus(workspaceId);
      setStatus(connectionStatus);
    } catch (error) {
      console.error('Failed to load Loom connection status:', error);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      const { oauthUrl } = await service.getLoomOAuthUrl(workspaceId);

      // Open OAuth in popup window
      const popup = window.open(oauthUrl, 'loom-oauth', 'width=500,height=600');

      // Poll for popup close (OAuth callback)
      const interval = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(interval);
          // Refresh status after OAuth callback
          loadStatus();
        }
      }, 500);
    } catch (error) {
      console.error('Failed to initiate Loom OAuth:', error);
      toast.error('Failed to connect Loom');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Loom?')) return;

    try {
      setDisconnecting(true);
      await service.disconnectLoom(workspaceId);
      setStatus({ connected: false });
      toast.success('Loom disconnected');
    } catch (error) {
      console.error('Failed to disconnect Loom:', error);
      toast.error('Failed to disconnect Loom');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="border border-border rounded-lg p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <span>📹</span> Loom
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            Connect Loom to fetch video metadata, thumbnails, and transcripts for richer design
            context.
          </p>
        </div>

        {/* Status Badge */}
        {status?.connected && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium">
            <Check className="h-3 w-3" />
            Connected
          </span>
        )}
        {!status?.connected && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-medium">
            <X className="h-3 w-3" />
            Not Connected
          </span>
        )}
      </div>

      {/* Connection Info */}
      {status?.connected && (
        <div className="space-y-1 mb-4 text-sm">
          <p>
            <span className="text-muted-foreground">Status:</span> Connected as{' '}
            <strong>{status.email}</strong>
          </p>
          {status.workspace && (
            <p>
              <span className="text-muted-foreground">Workspace:</span> {status.workspace}
            </p>
          )}
          {status.connectedAt && (
            <p>
              <span className="text-muted-foreground">Last synced:</span> {formatDate(status.connectedAt)}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {status?.connected ? (
          <>
            <Button
              onClick={handleConnect}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? 'Reconnecting...' : 'Reconnect'}
            </Button>
            <Button
              onClick={handleDisconnect}
              disabled={disconnecting}
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
            >
              {disconnecting ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          </>
        ) : (
          <Button
            onClick={handleConnect}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? 'Connecting...' : 'Connect Loom'}
          </Button>
        )}
      </div>
    </div>
  );
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (hours < 1) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  if (days < 1) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? '2-digit' : undefined,
  });
}
```

### 4. Settings Page Integration

```typescript
// In client/src/settings/components/Settings.tsx (or similar)

export function Settings() {
  const { workspaceId } = useWorkspace(); // From auth context

  return (
    <div className="space-y-6">
      {/* ... existing sections ... */}

      {/* Design Tools Section (NEW) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Design Tools</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Connect design platforms to enhance ticket specifications with metadata.
          </p>
        </div>

        <FigmaIntegration workspaceId={workspaceId} />
        <LoomIntegration workspaceId={workspaceId} />
      </div>
    </div>
  );
}
```

---

## OAuth Flow Diagram

```
1. User clicks "Connect Figma"
   ↓
2. Frontend calls GET /figma/oauth/authorize
   ↓
3. Backend returns { oauthUrl, state }
   ↓
4. Frontend opens OAuth URL in popup
   ↓
5. User approves Figma OAuth consent screen
   ↓
6. Figma redirects to GET /figma/oauth/callback?code=...&state=...
   ↓
7. Backend exchanges code for access token
   ↓
8. Backend stores encrypted token in Firestore
   ↓
9. Backend redirects to FRONTEND_URL/settings?figma_connected=true
   ↓
10. Frontend detects query param, refreshes connection status
    ↓
11. Frontend shows "Connected as alice@company.com"
```

---

## Error Handling

**Invalid State (CSRF Attack):**
- OAuth callback: error=invalid_state
- Frontend: Show error toast "Invalid state parameter"
- Reason: HMAC validation failed

**Token Exchange Failed:**
- OAuth callback: error=figma_connection_failed
- Frontend: Show error toast "Figma connection failed"
- Reasons: Invalid code, expired code, client secret mismatch

**Network Error:**
- Frontend catch block: Show error toast
- Log to console for debugging

---

## Testing Strategy

### Unit Tests

1. **FigmaIntegration Component**
   - ✅ Display "Not Connected" badge initially
   - ✅ Fetch connection status on mount
   - ✅ Display "Connected as..." when connected
   - ✅ Click "Connect" button opens OAuth popup
   - ✅ Handle figma_connected=true query param
   - ✅ Handle error query param with error toast
   - ✅ Disconnect button shows confirmation dialog
   - ✅ Disconnect calls service and updates status

2. **LoomIntegration Component**
   - ✅ Display "Not Connected" badge initially
   - ✅ Fetch connection status on mount
   - ✅ Display "Connected as..." when connected
   - ✅ Click "Connect" button opens OAuth popup
   - ✅ Handle loom_connected=true query param
   - ✅ Handle error query param with error toast
   - ✅ Disconnect button shows confirmation dialog
   - ✅ Disconnect calls service and updates status

3. **DesignIntegrationService**
   - ✅ getFigmaOAuthUrl: Returns OAuth URL and state
   - ✅ getFigmaConnectionStatus: Returns connection status
   - ✅ disconnectFigma: Calls DELETE endpoint
   - ✅ getLoomOAuthUrl: Returns OAuth URL and state
   - ✅ getLoomConnectionStatus: Returns connection status
   - ✅ disconnectLoom: Calls DELETE endpoint

### Integration Tests

1. **OAuth Flow**
   - ✅ Click "Connect Figma" → Opens popup
   - ✅ OAuth callback with code → Saves token
   - ✅ Refresh status → Shows connected
   - ✅ Click "Disconnect" → Removes token

---

## Integration Points

**Upstream (Depends On):**
- Story 26-09: Figma OAuth backend endpoints
- Story 26-11: Loom OAuth backend endpoints
- useWorkspace() hook (from auth context)
- useServices() hook (for dependency injection)

**Downstream (Feeds Into):**
- Story 26-13: Rich Preview Cards (uses connected status)
- Story 26-17: TechSpec Generator (uses connected status)

---

## Dependencies

**React:**
- hooks (useState, useEffect)
- useServices() from dependency injection
- useWorkspace() from auth context

**UI Components:**
- lucide-react: Check, X
- shadcn/ui: Button

**Services:**
- DesignIntegrationService (new)
- HttpClient (from NestJS)

**Utilities:**
- toast notifications (from UI library)

---

## Rollout Plan

1. **30 minutes:** Create DesignIntegrationService with API calls
2. **45 minutes:** Create FigmaIntegration component
3. **45 minutes:** Create LoomIntegration component
4. **30 minutes:** Integrate into Settings page
5. **15 minutes:** Test OAuth flows manually
6. **Commit:** After manual testing passes

---

## Known Risks

1. **Popup Blocking:** Browser might block OAuth popup
   - *Mitigation:* Open popup on user click (already doing this)
   - *Enhancement:* Detect popup blocked, show alternative flow (future)

2. **Cross-Tab State:** User opens Settings in multiple tabs, connects Figma in one tab
   - *Mitigation:* Other tab doesn't know about connection until refresh
   - *Enhancement:* Use localStorage event listener to sync tabs (future)

3. **Stale Connection Status:** User connects Figma, then disconnects in another app
   - *Mitigation:* User refreshes Settings page
   - *Enhancement:* Poll connection status every 30s (future)

4. **OAuth Token Expiry:** Figma/Loom token expires during session
   - *Mitigation:* Automatic refresh on API error (Story 26-10/26-12 handles this)

---

## Success Metrics

- ✅ Can connect Figma via OAuth popup
- ✅ Can connect Loom via OAuth popup
- ✅ Connection status displays correctly
- ✅ Can disconnect without errors
- ✅ Query params (connected=true, error=...) handled correctly
- ✅ Error toasts show for failures
- ✅ Buttons disabled while loading
- ✅ No console errors
- ✅ All unit tests pass (>80% coverage)
- ✅ 0 TypeScript errors

---

## Follow-Up Stories

- **26-13:** Frontend - Rich Preview Cards (uses connection status)
- **26-17:** Backend - TechSpec Generator Design Injection (uses connection status)

---

**Created:** 2026-02-14
**Last Updated:** 2026-02-14
**Status:** TODO (Blocked by: Phase 1 + 26-09 + 26-11)
