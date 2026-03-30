'use client';

import { useEffect } from 'react';
import { AuthCheck } from '@/lib/auth-check';
import { Sidebar } from '@/core/components/sidebar/Sidebar';
import { OnboardingDialog } from '@/core/components/onboarding/OnboardingDialog';
import { FeedbackDialog } from '@/core/components/feedback/FeedbackDialog';
import { useUIStore } from '@/stores/ui.store';
import { useFeedbackStore } from '@/stores/feedback.store';
import { useCommandPalette } from '@/core/hooks/useCommandPalette';
import { QuickDraftPalette } from '@/core/components/command-palette/QuickDraftPalette';
import { cn } from '@/lib/utils';
import { Button } from '@/core/components/ui/button';
import { Menu } from 'lucide-react';
import { Toaster } from 'sonner';
import { useTeamStore } from '@/teams/stores/team.store';
import { useAuthStore } from '@/stores/auth.store';
import { useJobsStore } from '@/stores/jobs.store';

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
  const { feedbackOpen, closeFeedback } = useFeedbackStore();
  const { currentTeam } = useTeamStore();
  const { user } = useAuthStore();
  useCommandPalette();

  // Subscribe to jobs collection for real-time updates
  const teamId = currentTeam?.id;
  const userId = user?.uid;
  useEffect(() => {
    if (teamId && userId) {
      const unsubscribe = useJobsStore.getState().subscribe(teamId, userId);
      return unsubscribe;
    }
  }, [teamId, userId]);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Sidebar />
      <QuickDraftPalette />
      <OnboardingDialog />
      <FeedbackDialog open={feedbackOpen} onClose={closeFeedback} />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--bg-subtle)',
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
      <div
        className={cn(
          'min-h-screen transition-all duration-200',
          'md:mt-0 mt-14',
          sidebarCollapsed ? 'ml-0 md:ml-16' : 'ml-0 md:ml-[var(--nav-width)]',
          'p-0 md:p-2'
        )}
      >
        <main className="relative min-h-[calc(100vh-16px)] bg-[var(--bg-subtle)] md:rounded-xl md:border md:border-[var(--border-subtle)] md:shadow-[0_1px_3px_rgba(0,0,0,0.3)] overflow-hidden">
          {children}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[300px] bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,rgba(120,119,198,0.08),transparent)]" />
        </main>
      </div>
    </div>
  );
}
