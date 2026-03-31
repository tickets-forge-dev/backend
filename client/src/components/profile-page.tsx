'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { useAuthStore } from '@/stores/auth.store';
import { useUserStore } from '@/stores/user-store';
import { UserApiService } from '@/src/api/user-api';
import { validateProfileField } from '@/src/utils/validation';
import { AvatarEditor } from './avatar-editor';

const userApi = new UserApiService();

/** Split a display name string into [firstName, lastName] */
function splitDisplayName(displayName: string | null): [string, string] {
  if (!displayName) return ['', ''];
  const parts = displayName.trim().split(/\s+/);
  const first = parts[0] || '';
  const last = parts.slice(1).join(' ') || '';
  return [first, last];
}

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const { profile, isLoading, isSaving, errors, serverError, loadProfile, updateProfile, clearErrors } = useUserStore();

  // Derive initial values from Firebase auth as fallback
  const [authFirst, authLast] = splitDisplayName(user?.displayName ?? null);

  const [firstName, setFirstName] = useState(authFirst);
  const [lastName, setLastName] = useState(authLast);
  const [localErrors, setLocalErrors] = useState<Record<string, string | undefined>>({});
  const [successMessage, setSuccessMessage] = useState('');

  // Load persisted profile from backend
  useEffect(() => {
    loadProfile(userApi);
  }, [loadProfile]);

  // When profile loads from API, use those values (they're the source of truth)
  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
    }
  }, [profile]);

  const handleFieldBlur = useCallback((field: string, label: string, value: string) => {
    const error = validateProfileField(label, value);
    setLocalErrors((prev) => ({ ...prev, [field]: error }));
    if (!error) {
      clearErrors();
    }
  }, [clearErrors]);

  const handleFieldChange = useCallback((field: string, label: string, value: string, setter: (v: string) => void) => {
    setter(value);
    setSuccessMessage('');

    if (localErrors[field] || errors[field as keyof typeof errors]) {
      const error = validateProfileField(label, value);
      if (!error) {
        setLocalErrors((prev) => ({ ...prev, [field]: undefined }));
        clearErrors();
      }
    }
  }, [localErrors, errors, clearErrors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');

    const success = await updateProfile(userApi, { firstName, lastName });

    if (success) {
      setSuccessMessage('Profile updated successfully');
      setLocalErrors({});
    }
  };

  const getFieldError = (field: string): string | undefined => {
    return localErrors[field] || errors[field as keyof typeof errors];
  };

  if (isLoading) {
    return (
      <div className="max-w-[var(--content-max)] mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-[var(--bg-subtle)]" />
          <div className="h-64 rounded-lg bg-[var(--bg-subtle)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[var(--content-max)] mx-auto px-6 py-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[var(--text-xl)] font-medium text-[var(--text)]">
            Profile
          </h1>
          <p className="mt-2 text-[var(--text-md)] text-[var(--text-secondary)]">
            Manage your profile information
          </p>
        </div>
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <X className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Avatar */}
      <section className="rounded-lg bg-[var(--bg-subtle)] p-6 space-y-4">
        <div>
          <h2 className="text-[var(--text-md)] font-medium text-[var(--text)]">
            Avatar
          </h2>
          <p className="mt-1 text-[var(--text-sm)] text-[var(--text-secondary)]">
            Upload a photo or choose an emoji
          </p>
        </div>
        <AvatarEditor />
      </section>

      {/* Profile Form */}
      <section className="rounded-lg bg-[var(--bg-subtle)] p-6 space-y-6">
        <div>
          <h2 className="text-[var(--text-md)] font-medium text-[var(--text)]">
            Personal Information
          </h2>
          <p className="mt-1 text-[var(--text-sm)] text-[var(--text-secondary)]">
            Update your first name and last name
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-[var(--text)]">
              First Name
            </Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => handleFieldChange('firstName', 'First name', e.target.value, setFirstName)}
              onBlur={() => handleFieldBlur('firstName', 'First name', firstName)}
              placeholder="Enter first name"
              aria-invalid={!!getFieldError('firstName')}
              aria-describedby={getFieldError('firstName') ? 'firstName-error' : undefined}
            />
            {getFieldError('firstName') && (
              <p id="firstName-error" className="text-[var(--text-sm)] text-red-500">
                {getFieldError('firstName')}
              </p>
            )}
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-[var(--text)]">
              Last Name
            </Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => handleFieldChange('lastName', 'Last name', e.target.value, setLastName)}
              onBlur={() => handleFieldBlur('lastName', 'Last name', lastName)}
              placeholder="Enter last name"
              aria-invalid={!!getFieldError('lastName')}
              aria-describedby={getFieldError('lastName') ? 'lastName-error' : undefined}
            />
            {getFieldError('lastName') && (
              <p id="lastName-error" className="text-[var(--text-sm)] text-red-500">
                {getFieldError('lastName')}
              </p>
            )}
          </div>

          {/* Server Error */}
          {serverError && (
            <p className="text-[var(--text-sm)] text-red-500">{serverError}</p>
          )}

          {/* Success Message */}
          {successMessage && (
            <p className="text-[var(--text-sm)] text-emerald-500">{successMessage}</p>
          )}

          {/* Submit */}
          <div className="pt-2">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
