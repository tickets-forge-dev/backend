# Debugging GitHub Repositories 500 Error

## Error
```
AxiosError: Request failed with status code 500
at GitHubService.listRepositories (src/services/github.service.ts:189)
```

## Solution: Check Backend Logs

The issue is on the **backend** at the `/github/oauth/repositories` endpoint. The endpoint was returning generic 500 errors without details. **This has been fixed** with detailed logging.

### Step 1: Check Your Backend Logs

Run your backend and look for these messages when loading repositories:

```bash
# Terminal where backend is running
npm run dev  # backend
```

Look for logs like:
```
[NestFactory] Starting Nest application...
... (other logs)
[GitHubOAuthController] Fetching repositories for workspace workspace-id-123
[GitHubOAuthController] Found GitHub integration for workspace workspace-id-123, user: username
[GitHubOAuthController] Token decrypted successfully for workspace workspace-id-123
[GitHubOAuthController] Calling GitHub API to list repositories (page 1)
[GitHubOAuthController] GitHub API returned 5 repositories
[GitHubOAuthController] 📦 Fetched 5 repositories for user username (page 1)
```

### Step 2: Identify the Error

If you see an ERROR log instead, read what it says:

#### **Error: "GitHub not connected for this workspace"**
```
[GitHubOAuthController] ❌ GitHub not connected for workspace workspace-id-123
```

**Solution:**
- User hasn't connected their GitHub account yet
- Click "Connect GitHub" in Settings
- Complete the OAuth flow

#### **Error: "Token decryption failed"**
```
[GitHubOAuthController] ❌ Token decryption failed for workspace workspace-id-123: ...
```

**Solution:**
- The stored GitHub token is corrupted or invalid
- Disconnect and reconnect GitHub in Settings
- Check that your encryption keys are correct

#### **Error: "GitHub API call failed: 401 Unauthorized"**
```
[GitHubOAuthController] ❌ GitHub API call failed for workspace workspace-id-123: 401 Unauthorized
```

**Solution:**
- GitHub token has expired
- Click "Connect GitHub" again in Settings
- Authorize the new token

#### **Error: "GitHub API call failed: 403 Forbidden"**
```
[GitHubOAuthController] ❌ GitHub API call failed for workspace workspace-id-123: 403 Forbidden
```

**Solution:**
- Token doesn't have permission to list repositories
- Disconnect GitHub and reconnect
- Make sure to grant "repo" scope when authorizing

#### **Error: "GitHub API call failed: API rate limit exceeded"**
```
[GitHubOAuthController] ❌ GitHub API call failed: API rate limit exceeded by user
```

**Solution:**
- You've hit GitHub's rate limit (60 repos per minute)
- Wait a few minutes and try again
- For production, consider using GitHub App instead of OAuth token

### Step 3: Enable Detailed Logging

To see even more details, temporarily set:

**In `.env.development` or `.env`:**
```
LOG_LEVEL=debug
```

Then restart the backend:
```bash
npm run dev  # backend
```

Now you'll see debug logs:
```
[GitHubOAuthController] Checking GitHub connection status for workspace workspace-id-123
[GitHubOAuthController] Found GitHub integration for workspace workspace-id-123
[GitHubOAuthController] GitHub connected for workspace workspace-id-123, account: octocat, repos selected: 3
```

### Step 4: Use PostHog to Track Errors

With the PostHog telemetry we set up, you can also check for errors in PostHog:

1. Go to PostHog dashboard
2. Filter: `source = backend AND event = api_error AND endpoint = /github/oauth/repositories`
3. See detailed error logs from all users

### Step 5: Check Workspace Connection Status

Use this endpoint to verify connection:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/github/connection
```

Expected responses:

**Connected:**
```json
{
  "connected": true,
  "accountLogin": "octocat",
  "accountType": "User",
  "selectedRepositoryCount": 3,
  "selectedRepositories": [...]
}
```

**Not Connected:**
```json
{
  "connected": false
}
```

### Step 6: Full Debugging Checklist

```
☐ Backend is running (npm run dev)
☐ Check backend logs for ERROR messages
☐ GitHub is connected (Settings shows "Connected")
☐ Token is recent (not older than 90 days)
☐ GitHub hasn't revoked access
☐ Rate limit not exceeded
☐ Firebase is initialized (check startup logs)
☐ Environment variables set correctly
  - GITHUB_CLIENT_ID ✓
  - GITHUB_CLIENT_SECRET ✓
  - GITHUB_OAUTH_REDIRECT_URI ✓
  - ENCRYPTION_KEY ✓ (for token encryption)
```

### Step 7: Common Fixes

**Fix #1: GitHub Not Connected**
1. Go to Settings
2. Click "Connect GitHub"
3. Authorize the GitHub app
4. You should be redirected back to Settings with "✓ Connected"

**Fix #2: Token Expired**
1. Go to Settings
2. Click "Disconnect"
3. Click "Connect GitHub" again
4. Authorize again

**Fix #3: Permission Issues**
1. Go to GitHub Settings → Applications → Authorized OAuth Apps
2. Find your Forge app
3. Click "Revoke" to remove access
4. In Forge Settings, click "Connect GitHub" again
5. Make sure to grant all required permissions

**Fix #4: Clear Cache & Retry**
```bash
# Backend
npm run dev

# Frontend (in another terminal)
npm run dev
```

Then try loading repositories again.

### Step 8: Report the Bug

If you're still getting 500 error after these steps, include:

1. **Backend log output** (the ERROR line)
2. **Workspace ID** (from browser DevTools → Network → Request Headers)
3. **Timestamp** of the error
4. **Steps to reproduce**

Example bug report:
```
When clicking "Load Repositories" in ticket creation:

Backend log shows:
[GitHubOAuthController] GitHub API call failed for workspace abc123: 403 Forbidden

GitHub OAuth is connected and working (Settings shows ✓ Connected)
```

---

## Key Improvements Made

✅ **Better error messages** - Shows exactly where failure occurs
✅ **Detailed logging** - Can see full flow: lookup → decrypt → API call
✅ **Specific HTTP status codes** - 401 vs 403 vs rate limit
✅ **Full stack traces** - Complete error details in backend logs
✅ **PostHog tracking** - Can filter errors by endpoint and workspace

Now when the 500 error happens, you can look at the backend logs and see the exact issue!

