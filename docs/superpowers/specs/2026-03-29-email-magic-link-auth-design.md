# Email Magic Link Authentication

**Date:** 2026-03-29
**Status:** Approved
**Approach:** Pure Firebase Client-Side (Approach A)

## Problem

Users are hesitant to connect their Gmail/GitHub accounts to Forge. We need a lower-friction alternative that lets users sign in with just an email address, without requiring OAuth provider connections.

## Solution

Add Firebase Magic Link (passwordless email) authentication as a third sign-in option. Users enter their email, receive a sign-in link, click it, and they're in. No passwords involved.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth method | Magic Link (passwordless) | Lowest friction, no passwords to manage |
| Implementation | Pure Firebase client-side | Zero backend changes, Firebase handles email delivery and security |
| Login page placement | Below OAuth buttons with "or" divider | OAuth stays primary, email is for those avoiding provider connections |
| Post-send UX | Inline state change on login page | Simpler than a separate route, user stays in context |
| Profile collection | Magic link users only | OAuth users already have name/photo from their provider |
| Profile fields | First name, last name, avatar emoji | Lean — no team size or analytics fields at this stage |
| Onboarding integration | New `profile_setup` step before `team_created` | Only entered by magic link users, OAuth users skip it |

## Architecture

### No Backend Changes

The existing `FirebaseAuthGuard` verifies any Firebase ID token regardless of provider. The `/api/auth/init` endpoint creates users on first login. The `/api/user/profile` and `/api/user/profile/avatar/emoji` endpoints already handle profile updates. **Zero backend code changes required.**

### Firebase Console Configuration

1. Enable "Email/Password" provider in Authentication → Sign-in method
2. Enable "Email link (passwordless sign-in)" toggle beneath it
3. Verify app domain is in Authorized domains (localhost is default for dev)

---

## Section 1: Login Page — Email Magic Link UI

### Current State

Login page (`client/app/(auth)/login/page.tsx`) has two OAuth buttons (Google, GitHub) with error handling and redirect logic.

### Changes

Below the existing OAuth buttons, add a divider and email input section:

**Default state:**
```
[Continue with Google]
[Continue with GitHub]

─────── or ───────

[Enter your email address]
[Continue with email]
```

**After sending (inline state change):**
```
[Continue with Google]
[Continue with GitHub]

─────── or ───────

Check your email

We sent a sign-in link to john@example.com.
Click the link in the email to sign in.

Check your spam folder if you don't see it.

[Resend email]   [Use different email]
```

### Behavior

- Validate email format client-side before sending
- "Resend email" has a 30-second cooldown timer (button shows countdown)
- "Use different email" resets to the input state
- Styling follows Linear-inspired design system: `text-[var(--text-secondary)]` for helper text, subtle divider, outline button variant for email

---

## Section 2: Magic Link Completion (Auth Callback)

### How It Works

When the user clicks the magic link in their email, Firebase redirects them to the login page with special URL parameters (`mode=signIn&oobCode=...&apiKey=...`).

### Flow

1. User clicks magic link → lands on `/login?mode=signIn&oobCode=...`
2. Login page loads → `useEffect` detects sign-in link via `isSignInWithEmailLink(auth, window.location.href)`
3. Retrieves email from `localStorage` key `forgeEmailForSignIn`
4. **Email found** → calls `signInWithEmailLink(auth, email, url)` → sign-in completes → normal redirect logic
5. **Email NOT found** (different browser/device) → show inline prompt: "Enter the email you used to sign in" → user enters email → complete sign-in
6. Clear `forgeEmailForSignIn` from `localStorage` after successful sign-in

### Firebase Action Code Settings

Passed to `sendSignInLinkToEmail()`:
```typescript
{
  url: `${window.location.origin}/login`,
  handleCodeInApp: true
}
```

This ensures the magic link always redirects back to the login page.

---

## Section 3: Auth Store Changes

### File: `client/src/stores/auth.store.ts`

### New State Fields

```typescript
magicLinkSent: boolean       // default: false — drives inline UI state
magicLinkEmail: string | null // default: null — "We sent a link to X"
magicLinkNeedsEmail: boolean  // default: false — cross-device re-entry prompt
```

### New Actions

**`sendMagicLink(email: string)`**
1. Calls `sendSignInLinkToEmail(auth, email, actionCodeSettings)`
2. Saves email to `localStorage` key `forgeEmailForSignIn`
3. Sets `magicLinkSent: true` and `magicLinkEmail: email`

**`completeMagicLinkSignIn(url: string)`**
1. Checks `isSignInWithEmailLink(auth, url)` — returns early if false
2. Retrieves email from `localStorage`
3. If email missing → sets `magicLinkNeedsEmail: true`, returns
4. Calls `signInWithEmailLink(auth, email, url)`
5. Clears `forgeEmailForSignIn` from `localStorage`
6. Calls existing `initializeWorkspace()` flow
7. Returns `{ hasTeams, teamCount, currentTeamId }` for redirect logic

**`resetMagicLink()`**
- Resets `magicLinkSent`, `magicLinkEmail`, `magicLinkNeedsEmail` to defaults
- Used by "Use different email" button

### No Changes To

- `signInWithGoogle()`, `signInWithGitHub()`, `signOut()`, `setUser()`
- `SignInUseCase` — magic link actions live in the store, matching existing OAuth pattern

---

## Section 4: Profile Setup Step (Magic Link Users Only)

### Problem

OAuth users get `displayName` and `photoURL` from their provider. Magic link users have nothing — just an email address.

### Solution

New onboarding step at `/onboarding/profile-setup` that runs before team name, only for users without provider-supplied profile data.

### Detection Logic

After `/api/auth/init` returns, check the Firebase user's `providerData` array. If the user's only provider is `password` (Firebase's identifier for email link auth) and they have no `displayName` set → route to profile setup. If the user has an OAuth provider (Google/GitHub) → skip to team name. This is more reliable than checking displayName content, since it directly identifies the auth method.

### UI

```
Welcome to Forge

┌───────────────────────────────────────┐
│                                       │
│       [emoji] ← clickable picker      │
│                                       │
│  First name    [ _____________ ]      │
│  Last name     [ _____________ ]      │
│                                       │
│            [ Continue ]               │
│                                       │
└───────────────────────────────────────┘
```

### Fields

- **First name** — required, 1-50 chars
- **Last name** — required, 1-50 chars
- **Avatar emoji** — optional, defaults to a random emoji from curated set

### Emoji Picker

A small grid of 12-16 curated icons: `['😀', '🚀', '💻', '🎨', '🔥', '⚡', '🎯', '🦊', '🐻', '🌟', '🎸', '🏔️']`. Clicking the current emoji opens the grid. Selecting one updates the preview.

### Compose Display Name

`displayName = "${firstName} ${lastName}"`

### Backend Calls

Both endpoints already exist — no backend changes:
- `PUT /api/user/profile` with `{ firstName, lastName }` to update name
- `PUT /api/user/profile/avatar/emoji` with `{ emoji }` to set avatar

### Onboarding State Machine Update

```
Current: signup → team_created → role_selected → [github_setup] → complete
New:     signup → profile_setup → team_created → role_selected → [github_setup] → complete
```

The `profile_setup` state is only entered for magic link users. OAuth users skip it — state goes `signup → team_created` as before.

### Changes to `onboarding.store.ts`

- Add `profile_setup` as a valid step in the state machine
- Add transition: `signup → profile_setup` (when profile data missing)
- Add transition: `profile_setup → team_created` (after profile saved)
- Detection logic in redirect: check if user needs profile setup based on displayName

---

## Section 5: Error Handling

### Email-Specific Errors

| Firebase Error Code | User-Facing Message |
|---------------------|---------------------|
| `auth/invalid-email` | "Please enter a valid email address" |
| `auth/missing-email` | "Please enter your email address" |
| `auth/quota-exceeded` | "Too many requests. Please try again later." |
| `auth/invalid-action-code` | "This link has expired or already been used." + Resend button |
| `auth/expired-action-code` | "This link has expired or already been used." + Resend button |
| Network error | "Failed to send email. Please check your connection and try again." |

### Account Linking

If a magic link user's email matches an existing Google/GitHub account, Firebase automatically links them (same email = same account). No special handling needed. This is a benefit — users can add email sign-in to their existing account.

### Rate Limiting

- Client-side: 30-second cooldown on "Resend" button
- Server-side: Firebase has built-in rate limits on email sends

---

## Files Changed

| File | Change |
|------|--------|
| `client/app/(auth)/login/page.tsx` | Add email input, magic link send UI, inline "check your email" state, magic link detection on mount |
| `client/src/stores/auth.store.ts` | Add `sendMagicLink()`, `completeMagicLinkSignIn()`, `resetMagicLink()` actions and state fields |
| `client/src/stores/onboarding.store.ts` | Add `profile_setup` step to state machine |
| `client/app/(auth)/onboarding/profile-setup/page.tsx` | **New file** — profile setup step (name + emoji) |
| `client/src/lib/firebase.ts` | Export `EmailAuthProvider` if needed for linking scenarios |

## Files NOT Changed

| File | Reason |
|------|--------|
| Backend auth guard | `FirebaseAuthGuard` already accepts any Firebase ID token |
| Backend auth controller | `/api/auth/init` already handles new users from any provider |
| Backend user controller | Profile update endpoints already exist |
| Backend user domain | `avatarEmoji` field already exists on User entity |
