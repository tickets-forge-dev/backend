# Forge Setup Troubleshooting Guide

This guide helps you resolve common configuration issues when setting up Forge for local development.

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Firebase Configuration](#firebase-config)
- [PostHog API Key](#posthog-api-key)
- [API URL Configuration](#api-url)
- [Backend Connectivity](#backend-connectivity)
- [Environment Variables](#environment-variables)

---

## Quick Diagnostics

### Run the Setup Validator

Before starting the dev server, run the setup validation script:

```bash
cd client
npm run validate-setup
```

This will check all configuration and show specific errors with remediation steps.

### Check Development Health Banner

When you start the dev server, a health check banner will appear at the top of the page if there are configuration issues. This banner:
- Shows the status of each configuration item
- Provides actionable next steps
- Can be dismissed (will reappear on next page load)

---

## Firebase Config

### Error: "Firebase Config Fetch Failed"

**Full Error Message:**
```
❌ Firebase Config Fetch Failed
Cause: Backend not responding or NEXT_PUBLIC_API_URL misconfigured
Actions:
  1. Start backend: cd backend && pnpm dev
  2. Verify NEXT_PUBLIC_API_URL in .env.local
  3. Check that backend is running on the correct port
Fallback: Using environment variables (if set)
```

**What This Means:**
The frontend tried to fetch Firebase configuration from the backend but couldn't connect. This is usually because:
1. The backend server isn't running
2. The `NEXT_PUBLIC_API_URL` is wrong or missing
3. There's a port conflict

**How to Fix:**

#### Step 1: Start the Backend

Open a separate terminal and start the backend:

```bash
cd backend
pnpm dev
```

The backend should start on port 3000 by default. You should see:
```
[Nest] INFO [NestApplication] Nest application successfully started +X ms
```

#### Step 2: Verify API URL

Check your `client/.env.local` file has:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

If the backend is running on a different port, update the URL accordingly.

#### Step 3: Check Port Conflicts

If the backend won't start, check if port 3000 is already in use:

```bash
# macOS/Linux
lsof -i :3000

# Windows
netstat -ano | findstr :3000
```

Kill the conflicting process or configure the backend to use a different port.

#### Fallback Behavior

If the backend is unavailable, the frontend will use Firebase environment variables directly (see [Environment Variables](#environment-variables) below).

---

## PostHog API Key

### Error: "PostHog API Key Format Error"

**Full Error Message:**
```
❌ PostHog API Key Format Error
Cause: Using Personal API Key (phx_*) instead of Project API Key (phc_*)
Actions:
  1. Go to PostHog → Project Settings → API Keys
  2. Copy the "Project API Key" (starts with phc_, NOT phx_)
  3. Update NEXT_PUBLIC_POSTHOG_KEY in .env.local
Fallback: Analytics disabled
```

**What This Means:**
You're using a Personal API Key (`phx_...`) when you need a Project API Key (`phc_...`). Personal keys are for admin operations, while Project keys are for client-side analytics.

**How to Fix:**

#### Step 1: Log into PostHog

Go to [PostHog](https://app.posthog.com) and log in to your account.

#### Step 2: Navigate to Project Settings

1. Click on your project name in the top navigation
2. Go to **Project Settings** (gear icon)
3. Click on **API Keys** in the left sidebar

#### Step 3: Copy the Correct Key

Look for the **"Project API Key"** section. The key should start with `phc_`.

**DO NOT** copy keys from:
- "Personal API Key" (starts with `phx_`) ❌
- "Team API Key" ❌

#### Step 4: Update Your Environment

Add or update in `client/.env.local`:

```env
NEXT_PUBLIC_POSTHOG_KEY=phc_YOUR_PROJECT_KEY_HERE
```

#### Step 5: Restart Dev Server

```bash
cd client
npm run dev
```

#### Is PostHog Required?

**No.** PostHog is optional. If you don't configure it:
- Analytics will be disabled
- The app will work normally
- You'll see a warning in the health check banner

To disable the warning, simply don't set `NEXT_PUBLIC_POSTHOG_KEY` at all.

---

## API URL

### Error: "API URL Not Configured"

**Full Error Message:**
```
❌ API URL Not Configured
Cause: NEXT_PUBLIC_API_URL environment variable is missing
Actions:
  1. Create .env.local in the client directory if it doesn't exist
  2. Add: NEXT_PUBLIC_API_URL=http://localhost:3000/api
  3. Restart the dev server
```

**What This Means:**
The frontend doesn't know where to find the backend API.

**How to Fix:**

#### Step 1: Create .env.local

If it doesn't exist, create `client/.env.local`:

```bash
cd client
touch .env.local
```

#### Step 2: Add API URL

Add this line to `client/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

#### Step 3: Restart Dev Server

```bash
npm run dev
```

---

## Backend Connectivity

### Warning: "Backend Not Responding"

**What This Means:**
The frontend can reach the configured API URL, but the backend isn't responding. This could be:
1. Backend not started
2. Backend crashed
3. Backend running on a different port
4. Firewall blocking the connection

**How to Fix:**

#### Step 1: Check Backend Status

Look for a terminal window running the backend. You should see logs like:
```
[Nest] INFO [RouterExplorer] Mapped {/api/tickets, GET} route
```

If you don't see this, the backend isn't running.

#### Step 2: Start the Backend

```bash
cd backend
pnpm install  # If first time
pnpm dev
```

#### Step 3: Verify Port

Check that the backend is listening on port 3000:
```bash
curl http://localhost:3000/api/config/firebase
```

You should get a JSON response with Firebase config.

#### Step 4: Check Backend Logs

If the backend starts but crashes immediately, check the logs for errors. Common issues:
- Missing environment variables (e.g., `SESSION_SECRET`)
- Database connection failures
- Port already in use

---

## Environment Variables

### Required Variables

The app requires these environment variables to work correctly:

#### Client (.env.local in /client)

```env
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Firebase Configuration (6 required fields)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# PostHog (Optional)
NEXT_PUBLIC_POSTHOG_KEY=phc_YOUR_PROJECT_KEY
```

#### Backend (.env in /backend)

```env
# Session
SESSION_SECRET=your-session-secret-here

# Firebase Admin (for backend operations)
# Add your Firebase service account credentials here

# Database (if using Firestore)
# Firestore configuration
```

### Getting Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click the gear icon → Project Settings
4. Scroll down to "Your apps"
5. Click "Add app" or select your existing web app
6. Copy the configuration values to your `.env.local`

### Verifying Configuration

Run the validation script to check all variables:

```bash
cd client
npm run validate-setup
```

This will show which variables are set, missing, or misconfigured.

---

## Still Having Issues?

### Check the Logs

1. **Frontend Logs**: Check your browser console (F12 → Console)
2. **Backend Logs**: Check the terminal where you ran `pnpm dev`

### Common Patterns

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| "Network Error" | Backend not running | Start backend: `cd backend && pnpm dev` |
| "Invalid API Key" (Firebase) | Wrong Firebase config | Copy config from Firebase Console |
| "Personal API Key" (PostHog) | Wrong PostHog key type | Get Project API Key (phc_*) |
| "Port already in use" | Another process on port 3000/3001 | Kill the process or change ports |
| "Module not found" | Dependencies not installed | Run `pnpm install` in both client and backend |

### Get Help

If you're still stuck:
1. Run `npm run validate-setup` and share the output
2. Check browser console and backend logs for specific errors
3. Open an issue with the error messages and steps you've tried

---

## Appendix: Configuration Checklist

Use this checklist to verify your setup:

- [ ] `.env.local` exists in `/client`
- [ ] `NEXT_PUBLIC_API_URL` is set
- [ ] All 6 Firebase variables are set (or backend is providing them)
- [ ] PostHog key is either not set, or starts with `phc_`
- [ ] Backend `.env` has `SESSION_SECRET`
- [ ] Backend starts successfully on port 3000
- [ ] Frontend can reach backend (`curl http://localhost:3000/api/config/firebase`)
- [ ] Validation script passes: `npm run validate-setup`
- [ ] No errors in browser console on startup
- [ ] No errors in backend terminal on startup

If all boxes are checked, your setup is complete! 🎉
