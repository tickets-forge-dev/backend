# Figma OAuth Integration Progress

**Status:** ✅ Backend Infrastructure Complete | 🔄 Frontend Testing Needed

**Last Updated:** 2026-02-13
**Branch:** design
**Key Commits:**
- 8a5402d: Fix Basic Auth header for token exchange
- c7c918a: Implement token expiration handling
- 625ea54: Implement connection state persistence

---

## ✅ Completed (Phase 2 - OAuth Story 26-09)

### Backend Implementation

#### FigmaOAuthController (`backend/src/integrations/figma/figma-oauth.controller.ts`)

**GET /integrations/figma/oauth/start** - Initiate OAuth flow
- ✅ Validates workspaceId parameter
- ✅ Validates returnUrl against whitelist
- ✅ Creates state parameter with timestamp (prevents replay attacks)
- ✅ Generates Figma authorization URL
- ✅ Returns oauthUrl to frontend (no direct redirect to avoid CORS)
- ✅ Rate-limited (RateLimitGuard)
- ✅ Protected (FirebaseAuthGuard, WorkspaceGuard)
- ✅ Logs all operations

**GET /integrations/figma/oauth/callback** - Handle OAuth callback
- ✅ Validates authorization code
- ✅ Validates state parameter (decodes base64, validates structure, checks timestamp)
- ✅ Validates return URL against whitelist
- ✅ **[NEW]** Exchanges code for token using Basic Auth header:
  - Encodes `client_id:client_secret` in Base64
  - Sends in Authorization header as `Basic ${credentials}`
  - Keeps redirect_uri, code, grant_type in request body
- ✅ Verifies token with Figma API before storage
- ✅ Stores token securely in Firestore (workspace-level)
- ✅ Redirects back to returnUrl with status=success or error
- ✅ Comprehensive error handling and logging

**GET /integrations/figma/oauth/status** - Check connection status
- ✅ Returns { connected: boolean, expired?: boolean }
- ✅ Checks token existence
- ✅ Validates token expiration (calculates age in seconds)
- ✅ Protected (FirebaseAuthGuard, WorkspaceGuard)

#### FigmaIntegrationRepository (`backend/src/integrations/figma/figma-integration.repository.ts`)

- ✅ getToken(workspaceId) - Retrieve token from Firestore
- ✅ saveToken(workspaceId, token) - Persist token with savedAt timestamp
- ✅ deleteToken(workspaceId) - Remove token
- ✅ isConnected(workspaceId) - Check connection without loading full token
- ✅ Firestore path: `workspaces/{workspaceId}/integrations/figma`

#### FigmaOAuthToken Interface (`backend/src/integrations/figma/figma.types.ts`)

```typescript
export interface FigmaOAuthToken {
  accessToken: string;
  tokenType: string;
  expiresIn?: number;          // Token TTL in seconds (from Figma API)
  scope?: string;              // OAuth scopes granted
  savedAt?: number;            // Timestamp when saved (for expiration check)
}
```

### Frontend Implementation

#### FigmaIntegration Component (`client/src/settings/components/FigmaIntegration.tsx`)

- ✅ OAuth start handler (handleConnect):
  - Fetches Firebase ID token
  - Calls GET `/api/integrations/figma/oauth/start`
  - Redirects to returned oauthUrl
- ✅ OAuth callback detection (useEffect):
  - Detects `status=success&provider=figma` in URL params
  - Sets isConnected=true on success
  - Shows error message on failure
- ✅ Connection status checking:
  - Calls GET `/api/integrations/figma/oauth/status` on mount
  - Checks for expired tokens
  - Shows "reconnect needed" message if expired
- ✅ UI rendering:
  - Shows "Connected" badge when active
  - Shows "Disconnect" button when connected
  - Shows "Connect Figma" button when not connected
  - Error messaging for failures

---

## 🔄 Testing Checklist

### Backend Testing

- [ ] Verify FIGMA_CLIENT_ID and FIGMA_CLIENT_SECRET are set in .env
- [ ] Verify FIGMA_OAUTH_REDIRECT_URI matches Figma app configuration
- [ ] Test /start endpoint returns valid Figma authorization URL
- [ ] Verify state parameter encodes/decodes correctly
- [ ] Test /callback endpoint with authorization code
- [ ] Verify token is stored in Firestore with savedAt timestamp
- [ ] Test /status endpoint returns correct connection status
- [ ] Test token expiration detection (fake old timestamp)
- [ ] Verify error handling for invalid codes/states
- [ ] Check NestJS module registration (FigmaService in tickets.module.ts)

### Frontend Testing

- [ ] Navigate to /settings?tab=integrations
- [ ] Click "Connect Figma" button
- [ ] Verify redirected to Figma OAuth login
- [ ] Log in with test Figma account
- [ ] Authorize Forge application
- [ ] Verify callback redirects to /settings?tab=integrations
- [ ] Verify searchParams has status=success&provider=figma
- [ ] Verify isConnected state updates to true
- [ ] Verify "Connected" badge appears
- [ ] Verify "Connect Figma" button changes to "Disconnect"
- [ ] Refresh page and verify connection state persists (from /status API)
- [ ] Test disconnect flow
- [ ] Test error handling with invalid OAuth credentials

### End-to-End Testing

1. **Fresh Connection:**
   - Settings page → Connect Figma → Authorize → Verify connected state

2. **Token Persistence:**
   - Connect → Refresh page → Verify still connected
   - Check Firestore: `workspaces/{id}/integrations/figma` has token

3. **Token Expiration:**
   - Manually set `savedAt` to old timestamp in Firestore
   - /status endpoint should return { connected: false, expired: true }
   - Frontend should show "Figma connection expired. Please reconnect."

4. **Disconnect Flow:**
   - Connect → Disconnect → Verify "Connect" button returns
   - Verify token deleted from Firestore

---

## 🚀 Next Steps (Phase 2 Remaining - Stories 26-10, 26-13)

### Story 26-10: Figma API Service & Metadata Fetcher

**What:** Fetch design file metadata from Figma API
- Get file metadata by fileKey: thumbnail, fileName, lastModified
- Handle rate limits (200 req/min)
- Cache metadata with 24-hour TTL
- Non-blocking failure (show link without preview on error)

**Files to Create:**
- `backend/src/integrations/figma/figma.service.ts` - Figma API client with getFileMetadata()

**Location:** Used during design reference creation to enrich link with metadata

### Story 26-13: Rich Preview Cards (Frontend)

**What:** Display design link previews in ticket detail
- Figma: Show thumbnail image, file name, last modified date
- Fallback: Simple link card with platform icon if metadata missing

**Files to Create:**
- Enhanced `DesignReferenceCard.tsx` component

---

## ⚠️ Known Issues & Edge Cases

### Resolved Issues

1. **Port Mismatch (RESOLVED - commit 625ea54)**
   - Problem: FIGMA_OAUTH_REDIRECT_URI was http://localhost:3001 but backend on 3000
   - Fix: Updated to http://localhost:3000/api/integrations/figma/oauth/callback

2. **Status Endpoint 404 (RESOLVED - commit 430bde4)**
   - Problem: Frontend called `/api/integrations/figma/status` (missing /oauth)
   - Fix: Changed to `/api/integrations/figma/oauth/status`

3. **Missing Auth Token (RESOLVED - commit 6a4fefb)**
   - Problem: Status endpoint called without Firebase auth token
   - Fix: Added Authorization header with Firebase ID token

4. **Token Endpoint 404 (RESOLVED - commit 099c2d2)**
   - Problem: Used https://www.figma.com/api/oauth/token (missing /v1)
   - Fix: Updated to https://www.figma.com/api/v1/oauth/token

5. **Credentials Format (RESOLVED - commit 8a5402d)**
   - Problem: Sending credentials in request body instead of header
   - Fix: Moved to Authorization header with Basic Auth format

### Current Status

- OAuth callback handling should now work correctly after Basic Auth fix
- Token persistence and expiration handling are in place
- Frontend callback detection is implemented

### Potential Issues to Monitor

1. **State Parameter Replay:** 15-minute window prevents replay attacks (implemented)
2. **Rate Limiting:** Figma has 200 req/min limit (cache strategy needed for Phase 2)
3. **Token Expiration:** Currently checked on /status call (can be cached in localStorage)
4. **CORS:** Frontend redirects to OAuth URL directly (avoids CORS issues)

---

## 📋 Testing Quick Start

```bash
# 1. Build project
npm run build

# 2. Start backend
cd backend && npm run dev

# 3. In another terminal, start frontend
cd client && npm run dev

# 4. Navigate to http://localhost:3001/settings?tab=integrations
# 5. Click "Connect Figma" and follow OAuth flow

# Monitor logs:
# Backend: Check for "✓ Starting Figma OAuth flow" and token exchange success
# Figma: Verify app is published (or use "Allow limited OAuth for development")
```

---

## 🔐 Security Checklist

- ✅ HTTPS-only redirects (production)
- ✅ State parameter with timestamp (prevents CSRF + replay)
- ✅ Authorization code validation
- ✅ Token verification before storage
- ✅ Return URL whitelist validation
- ✅ Workspace isolation (verify user owns workspace)
- ✅ Rate limiting on OAuth endpoints
- ✅ Environment variable validation
- ✅ Basic Auth for token exchange (not in URL params)
- ⚠️ Token encryption at rest (future: consider KMS)

---

## 📊 Architecture Summary

```
Frontend (Settings Page)
    ↓
GET /oauth/start (Firebase Auth required)
    ↓
Backend validates & generates state
    ↓
Returns Figma OAuth URL
    ↓
Frontend redirects to Figma
    ↓
User authorizes
    ↓
Figma redirects to /oauth/callback?code=...&state=...
    ↓
Backend validates state, exchanges code for token
    ↓
Stores token in Firestore (workspace-level)
    ↓
Redirects to returnUrl with status=success
    ↓
Frontend detects callback, updates state
    ↓
Shows "Connected" badge
```

---

## 📝 Files Changed in This Session

- `backend/src/integrations/figma/figma-oauth.controller.ts` (line 389-396)
  - Added Basic Auth header for token exchange
  - Moved credentials from body to Authorization header

- **Build Status:** ✅ 0 TypeScript errors (both backend + frontend)
