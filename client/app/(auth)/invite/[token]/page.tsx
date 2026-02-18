'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { getAuth } from 'firebase/auth';

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
      router.push(`/login`);
    }
  }, [authChecked, isAuthenticated, router]);

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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

      const response = await fetch(`${apiUrl}/teams/accept-invite`, {
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
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ margin: '0 auto', width: '32px', height: '32px', border: '3px solid #e5e7eb', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '16px', fontSize: '14px', color: '#6b7280' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div style={{ width: '100%', maxWidth: '448px', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '32px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ margin: '0 auto', width: '64px', height: '64px', color: '#10b981' }}>✓</div>
          <h1 style={{ marginTop: '16px', fontSize: '24px', fontWeight: '600' }}>
            Welcome to the team!
          </h1>
          <p style={{ marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>
            You&apos;ve successfully joined the team. Redirecting...
          </p>
        </div>
      </div>
    );
  }

  // Invite acceptance form
  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '448px', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600' }}>Join Team</h1>
          <p style={{ marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>
            You&apos;ve been invited to join a team
          </p>
        </div>

        {error && (
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px', borderRadius: '6px', border: '1px solid #fca5a5', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '12px' }}>
            <span style={{ color: '#ef4444' }}>✗</span>
            <p style={{ fontSize: '14px', color: '#ef4444' }}>{error}</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Email
            </label>
            <input
              type="email"
              value={userEmail}
              disabled
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', color: '#6b7280' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              disabled={isAccepting}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', backgroundColor: '#ffffff', color: '#000000' }}
            />
            <p style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
              This is how your name will appear to other team members
            </p>
          </div>

          <button
            onClick={handleAcceptInvite}
            disabled={isAccepting || !displayName.trim()}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: isAccepting || !displayName.trim() ? '#9ca3af' : '#3b82f6',
              color: '#ffffff',
              fontWeight: '500',
              cursor: isAccepting || !displayName.trim() ? 'not-allowed' : 'pointer'
            }}
          >
            {isAccepting ? 'Joining team...' : 'Accept Invitation'}
          </button>
        </div>

        {!error && (
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'flex-start', gap: '8px', borderRadius: '6px', border: '1px solid #e5e7eb', padding: '12px' }}>
            <span style={{ color: '#3b82f6' }}>ℹ</span>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>
              By accepting, you&apos;ll join this team and have access to shared resources.
            </p>
          </div>
        )}
      </div>
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
