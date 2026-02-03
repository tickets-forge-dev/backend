'use client';

import { AuthCheck } from '@/lib/auth-check';
import { Sidebar } from '@/core/components/sidebar/Sidebar';
import { useUIStore } from '@/stores/ui.store';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import { Button } from '@/core/components/ui/button';

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
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Sidebar />

      {/* Hamburger menu for mobile */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-[var(--z-sticky)] md:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>

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

