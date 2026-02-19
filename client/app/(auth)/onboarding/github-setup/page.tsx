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
    <div className="space-y-10 text-center">
      <div>
        <div className="mb-4 text-4xl">⚙️</div>
        <h2 className="text-[var(--text-xl)] font-semibold text-white">Setting up GitHub...</h2>
        <p className="mt-2 text-[var(--text-sm)] text-[#a1a1aa]">Completing onboarding</p>
      </div>
    </div>
  );
}
