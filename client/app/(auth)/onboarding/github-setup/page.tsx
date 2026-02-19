'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingStore } from '@/stores/onboarding.store';

/**
 * GitHub Setup Placeholder
 * For now, this just marks GitHub as set up and completes onboarding
 * TODO: Implement actual GitHub OAuth flow in future story
 */
export default function GitHubSetupPage() {
  const router = useRouter();
  const { setupGitHub } = useOnboardingStore();

  useEffect(() => {
    // Auto-complete GitHub setup for now
    // In a real implementation, this would show GitHub OAuth flow
    console.log('ℹ️ [GitHubSetup] Auto-completing GitHub setup (placeholder)');
    setupGitHub();

    // Redirect to tickets after completing
    setTimeout(() => {
      router.push('/tickets');
    }, 1000);
  }, [setupGitHub, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-4 text-4xl">⚙️</div>
        <h1 className="text-xl font-semibold text-gray-900">Setting up GitHub...</h1>
        <p className="mt-2 text-sm text-gray-600">Completing onboarding</p>
      </div>
    </div>
  );
}
