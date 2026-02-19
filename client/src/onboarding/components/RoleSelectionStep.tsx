'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingStore } from '@/stores/onboarding.store';

type Role = 'admin' | 'developer' | 'pm' | 'qa';

interface RoleOption {
  id: Role;
  name: string;
  icon: string;
  description: string;
}

const roleOptions: RoleOption[] = [
  {
    id: 'admin',
    name: 'Admin',
    icon: '👑',
    description: 'Team owner with full permissions to manage members and settings',
  },
  {
    id: 'developer',
    name: 'Developer',
    icon: '💻',
    description: 'Build and execute tickets via CLI and development tools',
  },
  {
    id: 'pm',
    name: 'Product Manager',
    icon: '📋',
    description: 'Create tickets, approve specs, and answer clarification questions',
  },
  {
    id: 'qa',
    name: 'QA Engineer',
    icon: '🧪',
    description: 'Test features, verify quality, and report issues',
  },
];

export function RoleSelectionStep() {
  const router = useRouter();
  const { selectRole } = useOnboardingStore();

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Update onboarding state
      selectRole(selectedRole);

      console.log('✅ [RoleSelectionStep] Role selected:', selectedRole);

      // Conditional routing based on role
      if (selectedRole === 'developer') {
        // Developers go to GitHub setup
        router.push('/onboarding/github-setup');
      } else {
        // Admin/PM/QA skip GitHub and go to tickets
        router.push('/tickets');
      }
    } catch (err: any) {
      console.error('❌ [RoleSelectionStep] Failed to save role:', err);
      setError(err.message || 'Failed to save role. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-2xl">
        <div className="rounded-lg bg-white p-8 shadow-sm">
          {/* Heading */}
          <h1 className="mb-2 text-2xl font-semibold text-gray-900">
            What&apos;s your role?
          </h1>
          <p className="mb-8 text-sm text-gray-600">
            This helps us customize your experience and set appropriate permissions.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Role Cards */}
            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {roleOptions.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleRoleSelect(role.id)}
                  disabled={isSubmitting}
                  className={`group relative rounded-lg border-2 p-4 text-left transition-all hover:border-blue-300 disabled:cursor-not-allowed disabled:opacity-50 ${
                    selectedRole === role.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  {/* Selection indicator */}
                  {selectedRole === role.id && (
                    <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                      <svg
                        className="h-3 w-3 text-white"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  )}

                  {/* Role content */}
                  <div className="flex items-start space-x-3">
                    <div className="text-3xl">{role.icon}</div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{role.name}</div>
                      <div className="mt-1 text-sm text-gray-600">{role.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting || !selectedRole}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isSubmitting ? (
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
      </div>
    </div>
  );
}
