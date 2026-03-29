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
