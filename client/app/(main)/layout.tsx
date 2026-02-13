'use client';

import { AuthCheck } from '@/lib/auth-check';
import { Sidebar } from '@/core/components/sidebar/Sidebar';
import { OnboardingDialog } from '@/core/components/onboarding/OnboardingDialog';
import { useUIStore } from '@/stores/ui.store';
import { cn } from '@/lib/utils';
import { Button } from '@/core/components/ui/button';
import { Menu } from 'lucide-react';
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
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();

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

      {/* Mobile header with hamburger menu */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-[var(--bg)] border-b border-[var(--border)] flex items-center px-4 z-40 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="text-[var(--text-tertiary)] hover:text-[var(--text)]"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Main content with margin for sidebar */}
      <main
        className={cn(
          'min-h-screen transition-all duration-200 bg-gradient-to-r from-[var(--bg-subtle)] via-[var(--bg)] to-[var(--bg-subtle)]',
          'md:mt-0 mt-14',
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
