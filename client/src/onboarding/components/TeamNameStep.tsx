'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { Input } from '@/core/components/ui/input';
import { useOnboardingStore } from '@/stores/onboarding.store';
import { TeamService } from '@/services/team.service';

const teamService = new TeamService();

export function TeamNameStep() {
  const router = useRouter();
  const { createTeam } = useOnboardingStore();

  const [teamName, setTeamName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Validate team name
  const validateTeamName = (name: string): string | null => {
    const trimmed = name.trim();

    if (!trimmed) {
      return 'Team name is required';
    }

    if (trimmed.length < 3) {
      return 'Team name must be at least 3 characters';
    }

    if (trimmed.length > 50) {
      return 'Team name must not exceed 50 characters';
    }

    return null;
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTeamName(value);

    // Clear errors when user types
    if (validationError) {
      setValidationError(null);
    }
    if (error) {
      setError(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const validationErr = validateTeamName(teamName);
    if (validationErr) {
      setValidationError(validationErr);
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Get Firebase ID token
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be signed in to create a team');
      }

      const idToken = await user.getIdToken();

      // Call API to create team
      const team = await teamService.createTeam(
        {
          name: teamName.trim(),
          allowMemberInvites: true,
        },
        idToken
      );

      console.log('✅ [TeamNameStep] Team created:', team.id);

      // Update onboarding state
      createTeam(team.id, team.name);

      // Navigate to next step
      router.push('/onboarding/role-selection');
    } catch (err: any) {
      console.error('❌ [TeamNameStep] Failed to create team:', err);
      setError(err.message || 'Failed to create team. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Heading */}
      <div>
        <h2 className="text-[var(--text-xl)] font-semibold text-white">
          Name your team
        </h2>
        <p className="text-[var(--text-sm)] text-[#a1a1aa] mt-1">
          This will be your workspace for managing tickets and collaborating with your team.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Input
            type="text"
            value={teamName}
            onChange={handleChange}
            placeholder="e.g., Acme Corp, Sarah's Team"
            disabled={isCreating}
            className={`bg-[#18181b] border-[#27272a] text-white placeholder:text-[#71717a] ${
              validationError ? 'border-red-500' : ''
            }`}
            autoFocus
          />

          {/* Validation error */}
          {validationError && (
            <p className="mt-2 text-sm text-red-400">{validationError}</p>
          )}
        </div>

        {/* API error */}
        {error && (
          <div className="rounded-md bg-red-950/20 border border-red-500/30 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isCreating || !teamName.trim()}
          className="w-full h-11 rounded-md bg-[#7c3aed] px-4 text-white font-medium hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:bg-[#27272a] disabled:text-[#52525b] transition-colors"
        >
          {isCreating ? (
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
              Creating...
            </span>
          ) : (
            'Create Team'
          )}
        </button>
      </form>
    </div>
  );
}
