# Email Magic Link Authentication — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Firebase Magic Link (passwordless email) as a third sign-in option, with a profile setup onboarding step for magic link users who lack provider-supplied profile data.

**Architecture:** Pure Firebase client-side implementation. `sendSignInLinkToEmail()` sends the link, `isSignInWithEmailLink()` detects the callback on page load, `signInWithEmailLink()` completes auth. The backend requires zero changes — `FirebaseAuthGuard` already verifies any Firebase ID token regardless of provider.

**Tech Stack:** Firebase Auth (client SDK), Next.js, Zustand, Tailwind CSS

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `client/src/lib/firebase.ts` | Modify | Export `sendSignInLinkToEmail`, `isSignInWithEmailLink`, `signInWithEmailLink` from firebase/auth |
| `client/src/stores/auth.store.ts` | Modify | Add magic link state fields and actions (`sendMagicLink`, `completeMagicLinkSignIn`, `resetMagicLink`) |
| `client/app/(auth)/login/page.tsx` | Modify | Add email input section below OAuth buttons, "check your email" inline state, magic link detection on mount |
| `client/src/services/onboarding.service.ts` | Modify | Add `profile_setup` to `OnboardingState` type |
| `client/src/stores/onboarding.store.ts` | Modify | Add `profile_setup` state and `completeProfile` transition |
| `client/src/onboarding/components/ProfileSetupStep.tsx` | Create | Profile setup form (first name, last name, emoji avatar) |
| `client/app/(auth)/onboarding/profile-setup/page.tsx` | Create | Route page for `/onboarding/profile-setup` |

---

### Task 1: Firebase Exports

**Files:**
- Modify: `client/src/lib/firebase.ts`

- [ ] **Step 1: Add magic link imports and exports**

In `client/src/lib/firebase.ts`, update the import from `firebase/auth` at line 2 and add the action code settings:

```typescript
// Line 2 — update existing import:
import { getAuth, GoogleAuthProvider, GithubAuthProvider, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
```

Then at the bottom of the file, after the `githubProvider` export (line 119), add:

```typescript
// Magic link (passwordless email) helpers
export { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink };

export function getMagicLinkActionCodeSettings(): { url: string; handleCodeInApp: boolean } {
  return {
    url: `${window.location.origin}/login`,
    handleCodeInApp: true,
  };
}
```

- [ ] **Step 2: Verify the app builds**

Run: `cd client && npx next build --no-lint 2>&1 | tail -20`
Expected: Build succeeds (or at least no errors from firebase.ts)

- [ ] **Step 3: Commit**

```bash
git add client/src/lib/firebase.ts
git commit -m "feat(auth): export magic link helpers from firebase module"
```

---

### Task 2: Auth Store — Magic Link State & Actions

**Files:**
- Modify: `client/src/stores/auth.store.ts`

- [ ] **Step 1: Add magic link imports**

At the top of `client/src/stores/auth.store.ts`, add import for the firebase helpers (after the existing firebase imports at line 4):

```typescript
import {
  auth,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  getMagicLinkActionCodeSettings,
} from '@/lib/firebase';
```

Remove the indirect `auth` usage from `useServices` for magic link — the store already uses `useServices()` for OAuth, and we'll follow the same pattern of calling Firebase directly for magic link since it doesn't need the SignInUseCase.

- [ ] **Step 2: Extend the AuthState interface**

In `client/src/stores/auth.store.ts`, add these fields and actions to the `AuthState` interface (after line 15 `currentTeamId`):

```typescript
  // Magic link state
  magicLinkSent: boolean;
  magicLinkEmail: string | null;
  magicLinkNeedsEmail: boolean;

  // Magic link actions
  sendMagicLink: (email: string) => Promise<void>;
  completeMagicLinkSignIn: (url: string) => Promise<void>;
  resetMagicLink: () => void;
```

- [ ] **Step 3: Add magic link initial state and actions**

In the `create<AuthState>` call, after `currentTeamId: null,` (line 30), add initial state:

```typescript
  magicLinkSent: false,
  magicLinkEmail: null,
  magicLinkNeedsEmail: false,
```

Then, after the `clearError` action (line 94), add the three new actions:

```typescript
  sendMagicLink: async (email: string) => {
    set({ isLoading: true, error: null });

    try {
      const actionCodeSettings = getMagicLinkActionCodeSettings();
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      localStorage.setItem('forgeEmailForSignIn', email);
      set({
        isLoading: false,
        magicLinkSent: true,
        magicLinkEmail: email,
      });
    } catch (error: any) {
      console.error('[AuthStore] sendMagicLink error:', error);
      const message = getMagicLinkErrorMessage(error.code);
      set({ isLoading: false, error: message });
    }
  },

  completeMagicLinkSignIn: async (url: string) => {
    if (!isSignInWithEmailLink(auth, url)) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      let email = localStorage.getItem('forgeEmailForSignIn');

      if (!email) {
        set({ isLoading: false, magicLinkNeedsEmail: true });
        return;
      }

      await signInWithEmailLink(auth, email, url);
      localStorage.removeItem('forgeEmailForSignIn');

      // Initialize workspace (same as OAuth flow)
      const { authService } = useServices();
      const result = await authService.initializeWorkspace();
      set({
        isLoading: false,
        magicLinkSent: false,
        magicLinkEmail: null,
        magicLinkNeedsEmail: false,
        hasTeams: result.hasTeams,
        teamCount: result.teamCount,
        currentTeamId: result.currentTeamId,
      });
    } catch (error: any) {
      console.error('[AuthStore] completeMagicLinkSignIn error:', error);
      const message = getMagicLinkErrorMessage(error.code);
      set({ isLoading: false, error: message });
    }
  },

  resetMagicLink: () => {
    set({
      magicLinkSent: false,
      magicLinkEmail: null,
      magicLinkNeedsEmail: false,
      error: null,
    });
  },
```

- [ ] **Step 4: Add error message helper**

Above the `export const useAuthStore = create<AuthState>(...)` call, add this helper function:

```typescript
function getMagicLinkErrorMessage(code: string | undefined): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/missing-email':
      return 'Please enter your email address.';
    case 'auth/quota-exceeded':
      return 'Too many requests. Please try again later.';
    case 'auth/invalid-action-code':
    case 'auth/expired-action-code':
      return 'This link has expired or already been used. Please request a new one.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
```

- [ ] **Step 5: Add the `auth` import for direct use**

The store currently gets `authService` from `useServices()` but doesn't import `auth` directly. We need it for `sendSignInLinkToEmail` and `signInWithEmailLink`. The new import from Step 1 already handles this — just make sure the existing `useServices` import on line 6 is preserved since we still need it for `initializeWorkspace()`.

- [ ] **Step 6: Verify build**

Run: `cd client && npx next build --no-lint 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 7: Commit**

```bash
git add client/src/stores/auth.store.ts
git commit -m "feat(auth): add magic link state and actions to auth store"
```

---

### Task 3: Login Page — Email Input & Magic Link UI

**Files:**
- Modify: `client/app/(auth)/login/page.tsx`

- [ ] **Step 1: Add magic link state and hooks to LoginPageContent**

In `client/app/(auth)/login/page.tsx`, update the component. First, add new imports at the top:

```typescript
import { useState, useEffect, useCallback } from 'react';
```

(Replace the existing `Suspense, useEffect` import from line 3.)

Inside `LoginPageContent`, update the destructured store state (line 52):

```typescript
const {
  user,
  hasTeams,
  signInWithGoogle,
  signInWithGitHub,
  isLoading,
  error,
  clearError,
  sendMagicLink,
  completeMagicLinkSignIn,
  resetMagicLink,
  magicLinkSent,
  magicLinkEmail,
  magicLinkNeedsEmail,
} = useAuthStore();
```

Add local state for the email input and resend cooldown:

```typescript
const [email, setEmail] = useState('');
const [emailError, setEmailError] = useState<string | null>(null);
const [resendCooldown, setResendCooldown] = useState(0);
```

- [ ] **Step 2: Add magic link detection on mount**

Add a `useEffect` at the top of LoginPageContent (before the existing redirect useEffect):

```typescript
// Detect magic link callback on page load
useEffect(() => {
  completeMagicLinkSignIn(window.location.href);
}, [completeMagicLinkSignIn]);
```

- [ ] **Step 3: Add email submit and resend handlers**

Add these handlers inside LoginPageContent, after `handleGitHubSignIn`:

```typescript
const handleEmailSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setEmailError(null);

  const trimmed = email.trim();
  if (!trimmed) {
    setEmailError('Please enter your email address.');
    return;
  }

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    setEmailError('Please enter a valid email address.');
    return;
  }

  clearError();
  await sendMagicLink(trimmed);
};

const handleResend = useCallback(async () => {
  if (resendCooldown > 0 || !magicLinkEmail) return;

  clearError();
  await sendMagicLink(magicLinkEmail);
  setResendCooldown(30);
}, [resendCooldown, magicLinkEmail, clearError, sendMagicLink]);

// Resend cooldown timer
useEffect(() => {
  if (resendCooldown <= 0) return;
  const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
  return () => clearTimeout(timer);
}, [resendCooldown]);

const handleDifferentEmail = () => {
  resetMagicLink();
  setEmail('');
  setEmailError(null);
};

// Handle cross-device email re-entry
const handleCrossDeviceSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const trimmed = email.trim();
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    setEmailError('Please enter a valid email address.');
    return;
  }
  localStorage.setItem('forgeEmailForSignIn', trimmed);
  await completeMagicLinkSignIn(window.location.href);
};
```

- [ ] **Step 4: Add the email section JSX**

Replace the existing empty divider section (lines 154-159, the `{/* Divider */}` block) with the full email magic link section:

```tsx
{/* Divider */}
<div className="relative">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-[#27272a]" />
  </div>
  <div className="relative flex justify-center text-xs">
    <span className="bg-[#0a0a0a] px-3 text-[#71717a]">or</span>
  </div>
</div>

{/* Magic Link Email Section */}
{magicLinkNeedsEmail ? (
  /* Cross-device: user opened link in different browser */
  <form onSubmit={handleCrossDeviceSubmit} className="space-y-3">
    <p className="text-[13px] text-[#a1a1aa] text-center">
      Enter the email you used to sign in
    </p>
    <input
      type="email"
      value={email}
      onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
      placeholder="you@example.com"
      className="w-full h-11 rounded-md border border-[#27272a] bg-[#18181b] px-3 text-white text-[13px] placeholder:text-[#71717a] focus:outline-none focus:border-[#7c3aed] transition-colors"
      autoFocus
    />
    {emailError && (
      <p className="text-[12px] text-red-400">{emailError}</p>
    )}
    <button
      type="submit"
      disabled={isLoading || !email.trim()}
      className="w-full h-11 rounded-md bg-[#7c3aed] px-4 text-white text-[13px] font-medium hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:bg-[#27272a] disabled:text-[#52525b] transition-colors"
    >
      {isLoading ? 'Signing in...' : 'Continue'}
    </button>
  </form>
) : magicLinkSent ? (
  /* Email sent — check your inbox */
  <div className="space-y-4 text-center">
    <div className="text-3xl">✉️</div>
    <div>
      <p className="text-[13px] font-medium text-white">Check your email</p>
      <p className="text-[12px] text-[#a1a1aa] mt-1">
        We sent a sign-in link to{' '}
        <span className="text-white">{magicLinkEmail}</span>
      </p>
    </div>
    <p className="text-[11px] text-[#71717a]">
      Check your spam folder if you don&apos;t see it.
    </p>
    <div className="flex items-center justify-center gap-3 text-[12px]">
      <button
        onClick={handleResend}
        disabled={resendCooldown > 0 || isLoading}
        className="text-[#a1a1aa] hover:text-white disabled:text-[#52525b] transition-colors"
      >
        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend email'}
      </button>
      <span className="text-[#27272a]">|</span>
      <button
        onClick={handleDifferentEmail}
        className="text-[#a1a1aa] hover:text-white transition-colors"
      >
        Use different email
      </button>
    </div>
  </div>
) : (
  /* Default: email input */
  <form onSubmit={handleEmailSubmit} className="space-y-3">
    <input
      type="email"
      value={email}
      onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
      placeholder="Enter your email address"
      disabled={isLoading}
      className="w-full h-11 rounded-md border border-[#27272a] bg-[#18181b] px-3 text-white text-[13px] placeholder:text-[#71717a] focus:outline-none focus:border-[#7c3aed] transition-colors"
    />
    {emailError && (
      <p className="text-[12px] text-red-400">{emailError}</p>
    )}
    <button
      type="submit"
      disabled={isLoading || !email.trim()}
      className="w-full h-11 rounded-md border border-[#27272a] bg-[#18181b] px-4 text-white text-[13px] font-medium hover:bg-[#27272a] hover:border-[#3f3f46] disabled:cursor-not-allowed disabled:bg-[#18181b] disabled:text-[#52525b] transition-colors"
    >
      {isLoading ? 'Sending...' : 'Continue with email'}
    </button>
  </form>
)}
```

- [ ] **Step 5: Verify the page renders**

Run: `cd client && npx next build --no-lint 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add client/app/\(auth\)/login/page.tsx
git commit -m "feat(auth): add magic link email UI to login page"
```

---

### Task 4: Onboarding State Machine — Add `profile_setup` Step

**Files:**
- Modify: `client/src/services/onboarding.service.ts`
- Modify: `client/src/stores/onboarding.store.ts`

- [ ] **Step 1: Add `profile_setup` to OnboardingState type**

In `client/src/services/onboarding.service.ts`, update line 6:

```typescript
export type OnboardingState = 'signup' | 'profile_setup' | 'team_created' | 'role_selected' | 'github_setup' | 'complete';
```

Also update the `validStates` array inside `loadProgress()` at line 42:

```typescript
const validStates: OnboardingState[] = ['signup', 'profile_setup', 'team_created', 'role_selected', 'github_setup', 'complete'];
```

- [ ] **Step 2: Add profile fields to OnboardingProgress**

In the same file, update the `OnboardingProgress` interface (after line 12, before the closing `}`):

```typescript
  firstName?: string;
  lastName?: string;
  avatarEmoji?: string;
```

- [ ] **Step 3: Add `completeProfile` transition to onboarding store**

In `client/src/stores/onboarding.store.ts`, add to the `OnboardingStore` interface (after `createTeam` on line 16):

```typescript
  completeProfile: (firstName: string, lastName: string, avatarEmoji?: string) => void;
```

Add the corresponding state fields to the interface (after `role` on line 10):

```typescript
  firstName: string | null;
  lastName: string | null;
  avatarEmoji: string | null;
```

Add initial state in the `create` call (after `role: null,` on line 30):

```typescript
  firstName: null,
  lastName: null,
  avatarEmoji: null,
```

Add the action implementation after `createTeam` (after the `createTeam` action's closing `},`):

```typescript
  /**
   * Transition: signup → profile_setup (for magic link users without profile data)
   * Or: profile_setup → team_created (after profile is saved)
   */
  completeProfile: (firstName: string, lastName: string, avatarEmoji?: string) => {
    const state = get();

    if (state.currentState !== 'signup' && state.currentState !== 'profile_setup') {
      console.error('❌ [OnboardingStore] Invalid transition: completeProfile can only be called from signup or profile_setup state');
      return;
    }

    const newState: OnboardingState = 'team_created';
    set({
      currentState: newState,
      firstName,
      lastName,
      avatarEmoji: avatarEmoji || null,
    });

    onboardingService.saveProgress({
      currentState: newState,
      firstName,
      lastName,
      avatarEmoji,
    });
  },
```

- [ ] **Step 4: Update `createTeam` to accept `profile_setup` as valid source state**

In the `createTeam` action, update the state validation (line 44):

```typescript
    if (state.currentState !== 'signup' && state.currentState !== 'profile_setup') {
      console.error('❌ [OnboardingStore] Invalid transition: createTeam can only be called from signup or profile_setup state');
      return;
    }
```

This allows the flow: `signup → profile_setup → team_created` for magic link users, while keeping `signup → team_created` for OAuth users.

- [ ] **Step 5: Update `resumeFromStorage` to restore profile fields**

In the `resumeFromStorage` action, add the profile fields to the `set()` call:

```typescript
    set({
      currentState: progress.currentState,
      teamId: progress.teamId || null,
      teamName: progress.teamName || null,
      role: progress.role || null,
      hasGitHub: progress.hasGitHub || false,
      firstName: progress.firstName || null,
      lastName: progress.lastName || null,
      avatarEmoji: progress.avatarEmoji || null,
    });
```

- [ ] **Step 6: Update `reset` to clear profile fields**

In the `reset` action, add:

```typescript
    set({
      currentState: 'signup',
      teamId: null,
      teamName: null,
      role: null,
      hasGitHub: false,
      isLoading: false,
      error: null,
      firstName: null,
      lastName: null,
      avatarEmoji: null,
    });
```

- [ ] **Step 7: Verify build**

Run: `cd client && npx next build --no-lint 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 8: Commit**

```bash
git add client/src/services/onboarding.service.ts client/src/stores/onboarding.store.ts
git commit -m "feat(onboarding): add profile_setup step to state machine"
```

---

### Task 5: Profile Setup Component

**Files:**
- Create: `client/src/onboarding/components/ProfileSetupStep.tsx`

- [ ] **Step 1: Create the ProfileSetupStep component**

Create `client/src/onboarding/components/ProfileSetupStep.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { Input } from '@/core/components/ui/input';
import { useOnboardingStore } from '@/stores/onboarding.store';

const AVATAR_EMOJIS = ['😀', '🚀', '💻', '🎨', '🔥', '⚡', '🎯', '🦊', '🐻', '🌟', '🎸', '🏔️'];

function getRandomEmoji(): string {
  return AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)];
}

export function ProfileSetupStep() {
  const router = useRouter();
  const { completeProfile } = useOnboardingStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState(getRandomEmoji);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ firstName?: string; lastName?: string }>({});

  const validate = (): boolean => {
    const errors: { firstName?: string; lastName?: string } = {};

    if (!firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (firstName.trim().length > 50) {
      errors.firstName = 'First name must not exceed 50 characters';
    }

    if (!lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (lastName.trim().length > 50) {
      errors.lastName = 'Last name must not exceed 50 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSaving(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be signed in');
      }

      const idToken = await user.getIdToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

      // Update profile (name)
      const profileRes = await fetch(`${apiUrl}/user/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      });

      if (!profileRes.ok) {
        throw new Error('Failed to update profile');
      }

      // Update avatar emoji
      if (avatarEmoji) {
        const avatarRes = await fetch(`${apiUrl}/user/profile/avatar/emoji`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ emoji: avatarEmoji }),
        });

        if (!avatarRes.ok) {
          console.warn('[ProfileSetup] Failed to set avatar emoji, continuing...');
        }
      }

      // Update onboarding state
      completeProfile(firstName.trim(), lastName.trim(), avatarEmoji);

      // Navigate to team name step
      router.push('/onboarding/team-name');
    } catch (err: any) {
      console.error('❌ [ProfileSetup] Failed:', err);
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Heading */}
      <div>
        <h2 className="text-[var(--text-xl)] font-semibold text-white">
          Welcome to Forge
        </h2>
        <p className="text-[var(--text-sm)] text-[#a1a1aa] mt-1">
          Tell us a bit about yourself to get started.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Emoji Picker */}
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="w-16 h-16 rounded-full bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46] flex items-center justify-center text-3xl transition-colors"
          >
            {avatarEmoji}
          </button>

          {showEmojiPicker && (
            <div className="grid grid-cols-6 gap-2 p-3 rounded-lg bg-[#18181b] border border-[#27272a]">
              {AVATAR_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setAvatarEmoji(emoji);
                    setShowEmojiPicker(false);
                  }}
                  className={`w-10 h-10 rounded-md flex items-center justify-center text-xl hover:bg-[#27272a] transition-colors ${
                    avatarEmoji === emoji ? 'bg-[#27272a] ring-1 ring-[#7c3aed]' : ''
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <p className="text-[11px] text-[#71717a]">Click to choose your avatar</p>
        </div>

        {/* Name Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-[12px] text-[#a1a1aa] mb-1.5">First name</label>
            <Input
              type="text"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                if (validationErrors.firstName) setValidationErrors((v) => ({ ...v, firstName: undefined }));
              }}
              placeholder="Jane"
              disabled={isSaving}
              className={`bg-[#18181b] border-[#27272a] text-white placeholder:text-[#71717a] ${
                validationErrors.firstName ? 'border-red-500' : ''
              }`}
              autoFocus
            />
            {validationErrors.firstName && (
              <p className="mt-1.5 text-[12px] text-red-400">{validationErrors.firstName}</p>
            )}
          </div>

          <div>
            <label className="block text-[12px] text-[#a1a1aa] mb-1.5">Last name</label>
            <Input
              type="text"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                if (validationErrors.lastName) setValidationErrors((v) => ({ ...v, lastName: undefined }));
              }}
              placeholder="Smith"
              disabled={isSaving}
              className={`bg-[#18181b] border-[#27272a] text-white placeholder:text-[#71717a] ${
                validationErrors.lastName ? 'border-red-500' : ''
              }`}
            />
            {validationErrors.lastName && (
              <p className="mt-1.5 text-[12px] text-red-400">{validationErrors.lastName}</p>
            )}
          </div>
        </div>

        {/* API error */}
        {error && (
          <div className="rounded-md bg-red-950/20 border border-red-500/30 p-3 text-[13px] text-red-400">
            {error}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSaving || !firstName.trim() || !lastName.trim()}
          className="w-full h-11 rounded-md bg-[#7c3aed] px-4 text-white font-medium hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:bg-[#27272a] disabled:text-[#52525b] transition-colors"
        >
          {isSaving ? (
            <span className="flex items-center justify-center">
              <svg
                className="mr-2 h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Saving...
            </span>
          ) : (
            'Continue'
          )}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd client && npx next build --no-lint 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add client/src/onboarding/components/ProfileSetupStep.tsx
git commit -m "feat(onboarding): create ProfileSetupStep component"
```

---

### Task 6: Profile Setup Route Page & Redirect Logic

**Files:**
- Create: `client/app/(auth)/onboarding/profile-setup/page.tsx`
- Modify: `client/app/(auth)/login/page.tsx`

- [ ] **Step 1: Create the route page**

Create `client/app/(auth)/onboarding/profile-setup/page.tsx`:

```tsx
import { ProfileSetupStep } from '@/src/onboarding/components/ProfileSetupStep';

export default function ProfileSetupPage() {
  return <ProfileSetupStep />;
}
```

- [ ] **Step 2: Add profile setup redirect logic to login page**

In `client/app/(auth)/login/page.tsx`, update the existing redirect `useEffect` (the one that checks `user && hasTeams !== null`). The current logic at lines 54-65 needs to also check if the user needs profile setup:

```typescript
useEffect(() => {
  if (user && hasTeams !== null) {
    const returnTo = searchParams.get('returnTo');
    if (returnTo?.startsWith('/')) {
      router.push(returnTo);
    } else if (hasTeams) {
      router.push('/tickets');
    } else {
      // Check if user needs profile setup (magic link users without display name)
      const needsProfileSetup = user.providerData.length > 0
        && user.providerData.every((p) => p.providerId === 'password')
        && !user.displayName;

      if (needsProfileSetup) {
        router.push('/onboarding/profile-setup');
      } else {
        router.push('/onboarding/team-name');
      }
    }
  }
}, [user, hasTeams, router, searchParams]);
```

- [ ] **Step 3: Verify build**

Run: `cd client && npx next build --no-lint 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add client/app/\(auth\)/onboarding/profile-setup/page.tsx client/app/\(auth\)/login/page.tsx
git commit -m "feat(onboarding): add profile-setup route and redirect logic for magic link users"
```

---

### Task 7: Manual Integration Test

**Files:** None (testing only)

- [ ] **Step 1: Verify Firebase Console setup requirements**

Print a checklist for the developer to configure Firebase Console:

```
Firebase Console Setup Checklist:
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable "Email/Password" provider
3. Under "Email/Password", enable "Email link (passwordless sign-in)" toggle
4. Go to Authentication → Settings → Authorized domains
5. Verify localhost is listed (should be by default)
```

- [ ] **Step 2: Test the happy path (same browser)**

1. Navigate to `/login`
2. See OAuth buttons (Google, GitHub) + divider + email input
3. Enter a valid email → click "Continue with email"
4. See "Check your email" inline state with the email displayed
5. Check email inbox → click the magic link
6. Should be redirected back to `/login`, auto-complete sign-in
7. If new user → redirect to `/onboarding/profile-setup`
8. Fill in first name, last name, pick an emoji → click Continue
9. Should redirect to `/onboarding/team-name`
10. Continue normal onboarding flow

- [ ] **Step 3: Test cross-device scenario**

1. Send magic link from Browser A
2. Open the link in Browser B (different browser / incognito)
3. Should see "Enter the email you used to sign in" prompt
4. Enter the same email → should complete sign-in

- [ ] **Step 4: Test resend and different email**

1. Send magic link → see "Check your email" state
2. Click "Resend email" → should show 30s countdown → re-send
3. Click "Use different email" → should reset to email input

- [ ] **Step 5: Test OAuth users skip profile setup**

1. Sign in with Google/GitHub (existing OAuth flow)
2. If new user without teams → should go to `/onboarding/team-name` (NOT profile-setup)
3. Verify OAuth flow is unaffected

- [ ] **Step 6: Commit any fixes from testing**

```bash
git add -A
git commit -m "fix(auth): integration test fixes for magic link flow"
```
