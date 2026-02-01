'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';
import { useAuthStore } from '@/stores/auth.store';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const { user, signInWithGoogle, signInWithGitHub, isLoading, error, clearError } = useAuthStore();

  // If already authenticated, redirect to tickets
  useEffect(() => {
    if (user) {
      router.push('/tickets');
    }
  }, [user, router]);

  const handleGoogleSignIn = async () => {
    clearError();
    await signInWithGoogle();

    // Check if sign in was successful (user will be set by onAuthStateChanged)
    // Navigation happens in AuthCheck component
  };

  const handleGitHubSignIn = async () => {
    clearError();
    await signInWithGitHub();
  };

  return (
    <div className="space-y-8">
      {/* Logo and Title */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Image
            src="/forge-icon.png"
            alt="Forge"
            width={80}
            height={80}
            className="rounded-2xl"
          />
        </div>
        <h1 className="text-[var(--text-2xl)] font-semibold text-[var(--text)]">
          Forge
        </h1>
        <p className="text-[var(--text-sm)] text-[var(--text-secondary)] mt-2">
          Transform product intent into execution-ready tickets
        </p>
      </div>

      {/* OAuth Buttons */}
      <Card className="p-6">
        <div className="space-y-3">
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? 'Signing in...' : 'Continue with Google'}
          </Button>

          <Button
            onClick={handleGitHubSignIn}
            disabled={isLoading}
            variant="secondary"
            className="w-full"
            size="lg"
          >
            Continue with GitHub
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 rounded border border-[var(--red)]">
            <p className="text-[var(--text-sm)] text-[var(--red)] text-center">
              {error}
            </p>
          </div>
        )}
      </Card>

      {/* Footer */}
      <p className="text-center text-[var(--text-xs)] text-[var(--text-tertiary)]">
        By signing in, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
}
