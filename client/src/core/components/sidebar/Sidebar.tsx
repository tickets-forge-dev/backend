'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui.store';
import { SidebarHeader } from './SidebarHeader';
import { SidebarNav } from './SidebarNav';
import { SidebarFooter } from './SidebarFooter';
import { TeamSwitcher } from '@/teams/components/TeamSwitcher';

export function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();
  const announcerRef = useRef<HTMLDivElement>(null);

  // Announce state changes for screen readers
  useEffect(() => {
    if (announcerRef.current) {
      const announcement = sidebarCollapsed
        ? 'Sidebar collapsed'
        : 'Sidebar expanded';
      announcerRef.current.textContent = announcement;
    }
  }, [sidebarCollapsed]);

  return (
    <>
      {/* Backdrop for mobile */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-[var(--z-modal-backdrop)] md:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <aside
        aria-label="Main navigation"
        className={cn(
          'fixed left-0 top-0 h-screen bg-[var(--bg)] border-r border-[var(--border)]',
          'flex flex-col',
          'transition-all duration-200 ease-in-out',
          'z-[var(--z-sticky)]',
          // Mobile: slide in/out with full width
          sidebarCollapsed
            ? '-translate-x-full md:translate-x-0'
            : 'translate-x-0',
          // Desktop: icon-only or expanded
          sidebarCollapsed ? 'md:w-16' : 'w-[var(--nav-width)]'
        )}
      >
        <SidebarHeader />
        <TeamSwitcher />
        <SidebarNav />
        <SidebarFooter />

        {/* Screen reader announcer */}
        <div
          ref={announcerRef}
          id="sidebar-announcer"
          className="sr-only"
          role="status"
          aria-live="polite"
        />
      </aside>
    </>
  );
}
