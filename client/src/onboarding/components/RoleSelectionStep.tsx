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
      // Update onboarding state (localStorage)
      selectRole(selectedRole);

      console.log('✅ [RoleSelectionStep] Role selected:', selectedRole);

      // Save role to backend (update team member record)
      const { auth } = await import('@/lib/firebase');
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

        const response = await fetch(`${apiUrl}/teams/me/member/role`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role: selectedRole }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to update role');
        }

        console.log('✅ [RoleSelectionStep] Role saved to backend:', selectedRole);
      }

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
    <div className="space-y-10 w-full max-w-2xl">
      {/* Heading */}
      <div>
        <h2 className="text-[var(--text-xl)] font-semibold text-white">
          What&apos;s your role?
        </h2>
        <p className="text-[var(--text-sm)] text-[#a1a1aa] mt-1">
          This helps us customize your experience and set appropriate permissions.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Role Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {roleOptions.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => handleRoleSelect(role.id)}
              disabled={isSubmitting}
              className={`group relative rounded-lg border-2 p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                selectedRole === role.id
                  ? 'border-[#7c3aed] bg-[#7c3aed]/10'
                  : 'border-[#27272a] bg-[#18181b] hover:border-[#3f3f46] hover:bg-[#27272a]'
              }`}
            >
              {/* Selection indicator */}
              {selectedRole === role.id && (
                <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#7c3aed]">
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
                  <div className="font-medium text-white">{role.name}</div>
                  <div className="mt-1 text-sm text-[#a1a1aa]">{role.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-md bg-red-950/20 border border-red-500/30 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting || !selectedRole}
          className="w-full h-11 rounded-md bg-[#7c3aed] px-4 text-white font-medium hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:bg-[#27272a] disabled:text-[#52525b] transition-colors"
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
  );
}
