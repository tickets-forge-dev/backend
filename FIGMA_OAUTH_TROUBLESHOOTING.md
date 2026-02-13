# Figma OAuth 404 Troubleshooting Guide

**Issue:** Token endpoint returning 404 after successful authorization code generation

**Error Log:**
```
Figma token exchange failed: 404 - Not Found
- URL: https://www.figma.com/api/v1/oauth/token
- Client ID: jv4nt...
- Code length: 25
- Response: Not Found
```

---

## 🔍 Diagnosis

The 404 error on Figma's token endpoint typically means **one of these**:

1. **Invalid Client ID/Secret** - Credentials don't match any registered app
2. **App Not Properly Configured** - OAuth settings incomplete or incorrect
3. **Code Already Consumed** - Authorization code was used more than once
4. **Request Format Issue** - Missing headers or wrong content-type (unlikely, but possible)

---

## ✅ Verification Checklist

### Step 1: Verify Figma App Credentials

Go to https://www.figma.com/developers/settings and check:

- [ ] **App Name:** Displayed correctly
- [ ] **Client ID:** Matches `FIGMA_CLIENT_ID` in .env (should be: `jv4ntIEHBRIoLUTAbX2Loq`)
- [ ] **Client Secret:** Matches `FIGMA_CLIENT_SECRET` in .env
- [ ] **Redirect URI:** Exactly matches `FIGMA_OAUTH_REDIRECT_URI` in .env
  - Expected: `http://localhost:3000/api/integrations/figma/oauth/callback`
  - **CRITICAL:** Must be exact match (protocol, domain, port, path)

### Step 2: Check OAuth Configuration

In Figma app settings, verify:

- [ ] **OAuth is Enabled** - Toggle should be ON
- [ ] **Redirect URIs** - Should list: `http://localhost:3000/api/integrations/figma/oauth/callback`
- [ ] **Scopes** - Should include:
  - `file_content:read`
  - `file_metadata:read`
- [ ] **API Access** - Should be enabled
- [ ] **App Status** - Shows as "Active" (not Draft or Pending)

### Step 3: Verify .env Variables

```bash
# Check backend/.env has:
FIGMA_CLIENT_ID=jv4ntIEHBRIoLUTAbX2Loq
FIGMA_CLIENT_SECRET=<your_secret_here>
FIGMA_OAUTH_REDIRECT_URI=http://localhost:3000/api/integrations/figma/oauth/callback

# ❌ DO NOT INCLUDE:
# FIGMA_CLIENT_ID=https://www.figma.com/...
# FIGMA_OAUTH_REDIRECT_URI=http://localhost:3001/...  (wrong port)
```

### Step 4: Test Token Endpoint Directly

```bash
# Using curl (replace with real values)
CLIENT_ID="jv4ntIEHBRIoLUTAbX2Loq"
CLIENT_SECRET="your_secret_here"
REDIRECT_URI="http://localhost:3000/api/integrations/figma/oauth/callback"
CODE="auth_code_from_callback"

# Test the token exchange directly
curl -X POST https://www.figma.com/api/v1/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Authorization: Basic $(echo -n "$CLIENT_ID:$CLIENT_SECRET" | base64)" \
  -d "redirect_uri=$REDIRECT_URI&code=$CODE&grant_type=authorization_code"

# Should return:
# {"access_token":"...","token_type":"Bearer","expires_in":3600}

# If it returns 404, the issue is with Figma app configuration
```

### Step 5: Check for Credential Mismatch

**Common Issue:** Client Secret was regenerated

If you regenerated the Client Secret in Figma:
- [ ] Updated `FIGMA_CLIENT_SECRET` in `.env`
- [ ] Restarted backend (`npm run dev` in backend directory)
- [ ] Cleared browser cache / logged out
- [ ] Tried OAuth flow again

---

## 🔧 Fix Options

### Option A: Regenerate Credentials (Safest)

1. Go to Figma app settings
2. Delete existing Client Secret
3. Generate new Client Secret
4. Copy full secret (don't truncate)
5. Update `.env` with new secret
6. Restart backend
7. Try OAuth flow again

### Option B: Create New App (Nuclear Option)

If still failing after Option A:

1. Create brand new Figma app
2. Configure OAuth from scratch:
   - Set redirect URI to exactly: `http://localhost:3000/api/integrations/figma/oauth/callback`
   - Enable scopes: `file_content:read`, `file_metadata:read`
3. Copy new Client ID and Client Secret
4. Update `.env`
5. Restart backend
6. Try OAuth flow again

### Option C: Check Figma API Status

1. Verify Figma API is accessible:
   ```bash
   curl -I https://www.figma.com/api/v1/oauth/token
   # Should return 405 (Method Not Allowed) for GET, which is expected
   ```

2. If unreachable or different error, Figma services might be down

---

## 📋 Next Steps

After verification:

1. **Restart Backend:**
   ```bash
   # Kill any existing process
   # cd backend && npm run dev
   ```

2. **Clear Browser Cache:**
   - DevTools > Application > Clear site data
   - Or: Open incognito window and try again

3. **Test OAuth Flow:**
   - Navigate to http://localhost:3001/settings?tab=integrations
   - Click "Connect Figma"
   - Check backend logs for detailed diagnostic info

4. **Monitor Logs:**
   ```
   [FigmaOAuthController] Figma token exchange request:
     - URL: https://www.figma.com/api/v1/oauth/token
     - Auth header present: yes
     - Auth header length: 64
     - Client ID length: 22
     - Client Secret length: 32
     ...
   ```

---

## 🆘 If Still Failing

Please provide:

1. **Figma App Settings:**
   - Client ID (can be public)
   - Confirm Client Secret length (don't share the value)
   - Confirm redirect URI exactly

2. **Backend Environment:**
   - Confirm variables are set: `echo $FIGMA_CLIENT_ID`
   - Check `.env` file doesn't have syntax errors

3. **Browser Console Errors:**
   - Open DevTools > Console
   - Click "Connect Figma"
   - Screenshot any errors

4. **Backend Logs:**
   - Full output from "Figma token exchange request" log block
   - This shows what headers and body we're actually sending

---

## 🔐 Security Reminder

**NEVER commit `.env` file to git!**

If you accidentally committed credentials:
1. Regenerate Client Secret immediately in Figma
2. Remove `.env` from git history: `git rm --cached backend/.env`
3. Add to `.gitignore`: `echo "backend/.env" >> .gitignore`
4. Update credentials in `.env` locally

---

## 📚 Figma OAuth References

- [Figma OAuth2 Guide](https://www.figma.com/developers/docs#oauth-2-0)
- [Figma API Scopes](https://www.figma.com/developers/docs#api-scopes)
- [Figma Developer Settings](https://www.figma.com/developers/settings)

---

## 🎯 Expected Success Flow

```
1. User clicks "Connect Figma"
   ↓
2. Backend returns Figma OAuth URL
   ↓
3. Frontend redirects to Figma authorization page
   ↓
4. User logs in and authorizes
   ↓
5. Figma redirects to /oauth/callback with authorization code
   ↓
6. Backend exchanges code for token using Basic Auth
   ✅ Should get access token from Figma
   ↓
7. Backend stores token in Firestore
   ↓
8. Backend redirects to /settings with status=success
   ↓
9. Frontend detects status=success, sets isConnected=true
   ↓
10. UI shows "Connected" badge
```

Current status: **Stuck at step 6** (token exchange returns 404)
