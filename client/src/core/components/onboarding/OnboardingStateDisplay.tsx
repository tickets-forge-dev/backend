'use client';

import { useOnboardingStore } from '@/stores/onboarding.store';

/**
 * Debug/Testing component to visualize onboarding state machine
 * Displays current state and available transitions
 */
export function OnboardingStateDisplay() {
  const {
    currentState,
    teamId,
    teamName,
    role,
    hasGitHub,
    createTeam,
    selectRole,
    setupGitHub,
    completeOnboarding,
    resumeFromStorage,
    reset,
  } = useOnboardingStore();

  const states = ['signup', 'team_created', 'role_selected', 'github_setup', 'complete'];

  return (
    <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold">Onboarding State Machine</h3>

      {/* State visualization */}
      <div className="mb-6 flex items-center space-x-2">
        {states.map((state, index) => (
          <div key={state} className="flex items-center">
            <div
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                currentState === state
                  ? 'bg-blue-500 text-white'
                  : states.indexOf(currentState) > index
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
              }`}
            >
              {state}
            </div>
            {index < states.length - 1 && (
              <div className="mx-2 h-0.5 w-8 bg-gray-300" />
            )}
          </div>
        ))}
      </div>

      {/* Current data */}
      <div className="mb-6 space-y-2 text-sm">
        <p>
          <span className="font-medium">Team ID:</span> {teamId || 'Not set'}
        </p>
        <p>
          <span className="font-medium">Team Name:</span> {teamName || 'Not set'}
        </p>
        <p>
          <span className="font-medium">Role:</span> {role || 'Not set'}
        </p>
        <p>
          <span className="font-medium">Has GitHub:</span> {hasGitHub ? 'Yes' : 'No'}
        </p>
      </div>

      {/* Test actions */}
      <div className="space-y-2">
        <h4 className="mb-2 text-sm font-medium">Test Transitions:</h4>

        <button
          onClick={() => createTeam('test-team-123', 'Test Team')}
          disabled={currentState !== 'signup'}
          className="mr-2 rounded bg-blue-500 px-3 py-1 text-sm text-white disabled:bg-gray-300"
        >
          Create Team
        </button>

        <button
          onClick={() => selectRole('developer')}
          disabled={currentState !== 'team_created'}
          className="mr-2 rounded bg-blue-500 px-3 py-1 text-sm text-white disabled:bg-gray-300"
        >
          Select Role (Developer)
        </button>

        <button
          onClick={() => selectRole('pm')}
          disabled={currentState !== 'team_created'}
          className="mr-2 rounded bg-blue-500 px-3 py-1 text-sm text-white disabled:bg-gray-300"
        >
          Select Role (PM)
        </button>

        <button
          onClick={() => setupGitHub()}
          disabled={currentState !== 'github_setup'}
          className="mr-2 rounded bg-blue-500 px-3 py-1 text-sm text-white disabled:bg-gray-300"
        >
          Setup GitHub
        </button>

        <div className="mt-4 border-t pt-4">
          <button
            onClick={() => resumeFromStorage()}
            className="mr-2 rounded bg-green-500 px-3 py-1 text-sm text-white"
          >
            Resume from Storage
          </button>

          <button
            onClick={() => reset()}
            className="rounded bg-red-500 px-3 py-1 text-sm text-white"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
