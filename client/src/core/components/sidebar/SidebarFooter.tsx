'use client';

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { ThemeToggle } from '@/core/components/ThemeToggle';
import { useUIStore } from '@/stores/ui.store';

export function SidebarFooter() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <div className="mt-auto border-t border-[var(--border)] p-2">
      <div className="flex items-center justify-between gap-1">
        {/* Theme toggle - bottom left */}
        <ThemeToggle />

        {/* Collapse toggle - bottom right */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!sidebarCollapsed}
          className="h-8 w-8 rounded-md hover:bg-[var(--bg-hover)] transition-colors"
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
