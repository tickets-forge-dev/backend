'use client';

import { AuthCheck } from '@/lib/auth-check';
import { Sidebar } from '@/core/components/sidebar/Sidebar';
import { OnboardingDialog } from '@/core/components/onboarding/OnboardingDialog';
import { useUIStore } from '@/stores/ui.store';
import { cn } from '@/lib/utils';
import { Button } from '@/core/components/ui/button';
import { Toaster } from 'sonner';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthCheck>
      <MainLayoutContent>{children}</MainLayoutContent>
    </AuthCheck>
  );
}

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Sidebar />
      <OnboardingDialog />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--bg-surface)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
          },
        }}
      />

      {/* Main content with margin for sidebar */}
      <main
        className={cn(
          'min-h-screen transition-all duration-200',
          sidebarCollapsed ? 'ml-0 md:ml-16' : 'ml-0 md:ml-[var(--nav-width)]'
        )}
      >
        <div className="mx-auto max-w-[var(--content-max)] px-6 py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
