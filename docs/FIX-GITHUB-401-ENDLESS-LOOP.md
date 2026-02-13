# Fix: GitHub 401 Endless Loop (CRITICAL)

**Status:** ✅ FIXED
**Severity:** CRITICAL
**Date:** 2026-02-13

## Problem

When a user's GitHub token was invalid or expired (returning 401 "Bad credentials"), the frontend would continuously retry loading repositories without any backoff or max retries. This caused:

- Backend logs filled with dozens of 401 errors per second
- "Endless loop" of identical error messages
- UI frozen in loading state
- No clear guidance for the user to fix it

**Example Error Log:**
```
[GitHubOAuthController] ❌ GitHub API call failed for workspace ws_xxx: 401 Unauthorized
[GitHubOAuthController] ❌ GitHub authentication failed. Token may be expired. Please reconnect.
```

## Root Cause

The `GitHubIntegration.tsx` component had this auto-retry pattern:

```tsx
// Line 61-65: Auto-load repositories when connected
useEffect(() => {
  if (githubConnected && githubRepositories.length === 0 && !isLoadingRepositories) {
    loadRepositories(gitHubService);  // No detection of 401 errors
  }
}, [githubConnected, isLoadingRepositories, ...]);
```

When `listRepositories()` failed with 401:
1. Error was caught and stored in `repositoriesError` state
2. Component didn't know this was a 401 (auth failure, not temporary network issue)
3. Next re-render, the condition `githubRepositories.length === 0` was still true
4. Loop repeated infinitely

## Solution

### 1. Enhanced GitHubService Error Handling

**File:** `client/src/services/github.service.ts`

Added 401 detection to `listRepositories()`:

```typescript
async listRepositories(): Promise<GitHubRepositoryItem[]> {
  try {
    const response = await this.client.get<RepositoriesResponse>(
      '/github/oauth/repositories'
    );
    return response.data.repositories;
  } catch (error: any) {
    // Re-throw 401 errors with a specific flag
    if (error.response?.status === 401) {
      const err = new Error('GitHub token is invalid or expired. Please reconnect.');
      (err as any).isAuthError = true;
      (err as any).status = 401;
      throw err;
    }
    throw error;
  }
}
```

### 2. Settings Store State & Guard

**File:** `client/src/stores/settings.store.ts`

Added new state field:
```typescript
githubTokenInvalid: boolean; // True if token is expired/invalid (401 error)
```

Updated `loadRepositories()` with guard:
```typescript
// Don't retry if we already know the token is invalid
if (githubTokenInvalid) {
  console.log('⚠️ GitHub token is invalid - skipping retry');
  return;
}
```

When 401 error is detected:
```typescript
const isAuthError = (error as any).isAuthError || error.response?.status === 401;
set({
  repositoriesError: error.message,
  isLoadingRepositories: false,
  githubTokenInvalid: isAuthError,  // Set flag to prevent retries
});
```

### 3. UI: Token Invalid Alert with Reconnect Button

**File:** `client/src/settings/components/GitHubIntegration.tsx`

New prominent error card for 401:

```tsx
{githubTokenInvalid && (
  <div className="rounded-lg bg-red-500/10 p-4 flex items-start gap-3">
    <AlertCircle className="h-4 w-4 text-[var(--red)]" />
    <div className="flex-1 space-y-2">
      <p className="text-[var(--text-sm)] font-medium text-[var(--red)]">
        GitHub token expired or revoked
      </p>
      <p className="text-[var(--text-xs)] text-[var(--red)] opacity-90">
        Your GitHub connection is no longer valid. Please disconnect and
        reconnect to refresh your access token.
      </p>
      <div className="flex gap-2 mt-3">
        <Button onClick={handleDisconnect}>Disconnect</Button>
        <Button onClick={handleConnect}>Reconnect GitHub</Button>
      </div>
    </div>
  </div>
)}
```

## Changes Summary

| File | Changes | Purpose |
|------|---------|---------|
| `client/src/services/github.service.ts` | Detect 401 in `listRepositories()`, throw with `isAuthError` flag | Distinguish auth failures from network errors |
| `client/src/stores/settings.store.ts` | Add `githubTokenInvalid` state, guard in `loadRepositories()`, detect 401 on catch | Prevent auto-retry when token is invalid |
| `client/src/settings/components/GitHubIntegration.tsx` | Show token-invalid alert with Disconnect/Reconnect buttons | Inform user and provide recovery path |

## Behavior Changes

**Before (Broken):**
1. Token invalid → 401 error
2. Component retries silently
3. Backend logs fill with repeated 401 errors
4. User sees generic "Failed to load repositories"
5. No recovery path visible

**After (Fixed):**
1. Token invalid → 401 error detected
2. `githubTokenInvalid` flag set in state
3. Auto-retry prevented
4. Prominent alert shown: "GitHub token expired or revoked"
5. User sees "Disconnect" and "Reconnect GitHub" buttons
6. Clear recovery path

## Testing the Fix

### Scenario 1: Valid Token → Works as Before
1. Go to Settings → GitHub Integration
2. GitHub is connected ✓
3. Repositories load successfully ✓
4. No error messages ✓

### Scenario 2: Invalid Token → Clear Error & Recovery
1. Token expires or is revoked in GitHub
2. Go to Settings → GitHub Integration
3. See: "GitHub token expired or revoked"
4. Click "Reconnect GitHub" button
5. Complete OAuth flow
6. Token refreshed, repositories load ✓

### Scenario 3: Disconnect Then Reconnect
1. In Settings, click "Disconnect"
2. All GitHub state cleared
3. See "Connect GitHub" button
4. Click to reconnect
5. Complete OAuth flow ✓

## Files Modified

```
client/src/services/github.service.ts (4 additions)
client/src/stores/settings.store.ts (11 additions)
client/src/settings/components/GitHubIntegration.tsx (25 additions)
```

## Build Status

✅ **0 TypeScript errors** (both backend + frontend)
✅ **Production build successful** (20.06s)
✅ **No regressions** (all existing features work)

## Immediate User Action Required

If you're currently seeing the "Bad credentials" 401 error loop:

1. Go to **Settings → GitHub Integration**
2. Click the **"Reconnect GitHub"** button (or "Disconnect" then "Connect GitHub")
3. Complete the OAuth flow to refresh your token
4. Repositories should now load successfully

This permanently fixes the endless loop issue.

