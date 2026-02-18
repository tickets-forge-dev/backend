'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';

/**
 * Team Invite Acceptance Page
 *
 * Handles team invitation acceptance flow:
 * 1. Checks if user is authenticated
 * 2. Prompts for display name
 * 3. Accepts the invite via API
 * 4. Redirects to team page
 */
export default function AcceptInvitePage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [teamId, setTeamId] = useState<string | null>(null);

  // Check authentication status
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthChecked(true);
      if (user) {
        setIsAuthenticated(true);
        setUserEmail(user.email || '');
        setDisplayName(user.displayName || '');
      } else {
        setIsAuthenticated(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (authChecked && !isAuthenticated) {
      // Redirect to sign-in page with return URL
      router.push(`/sign-in?returnUrl=/invite/${token}`);
    }
  }, [authChecked, isAuthenticated, router, token]);

  const handleAcceptInvite = async () => {
    if (!displayName.trim()) {
      setError('Please enter your display name');
      return;
    }

    setIsAccepting(true);
    setError(null);

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error('Not authenticated');
      }

      const idToken = await user.getIdToken();

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams/accept-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          token,
          displayName: displayName.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to accept invitation');
      }

      const data = await response.json();
      setTeamId(data.teamId);
      setSuccess(true);

      // Redirect to team page after 2 seconds
      setTimeout(() => {
        router.push(`/teams/${data.teamId}`);
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept invitation';
      setError(errorMessage);
      setIsAccepting(false);
    }
  };

  // Loading state while checking auth
  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--primary)]" />
          <p className="mt-4 text-sm text-[var(--text-muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg)]">
        <div className="w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
          <h1 className="mt-4 text-2xl font-semibold text-[var(--text)]">
            Welcome to the team!
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            You've successfully joined the team. Redirecting...
          </p>
          <Loader2 className="mx-auto mt-4 h-6 w-6 animate-spin text-[var(--primary)]" />
        </div>
      </div>
    );
  }

  // Invite acceptance form
  return (
    <div className="flex h-screen items-center justify-center bg-[var(--bg)] p-4">
      <div className="w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-[var(--text)]">Join Team</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            You've been invited to join a team
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-md border border-red-500/50 bg-red-500/10 p-3">
            <XCircle className="h-5 w-5 shrink-0 text-red-500" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text)]">
              Email
            </label>
            <Input
              type="email"
              value={userEmail}
              disabled
              className="bg-[var(--input-bg)] text-[var(--text-muted)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text)]">
              Display Name
            </label>
            <Input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              disabled={isAccepting}
              className="bg-[var(--input-bg)] text-[var(--text)]"
            />
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              This is how your name will appear to other team members
            </p>
          </div>

          <Button
            onClick={handleAcceptInvite}
            disabled={isAccepting || !displayName.trim()}
            className="w-full"
          >
            {isAccepting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining team...
              </>
            ) : (
              'Accept Invitation'
            )}
          </Button>
        </div>

        {!error && (
          <div className="mt-4 flex items-start gap-2 rounded-md border border-[var(--border)] bg-[var(--bg)] p-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-[var(--primary)]" />
            <p className="text-xs text-[var(--text-muted)]">
              By accepting, you'll join this team and have access to shared resources.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
