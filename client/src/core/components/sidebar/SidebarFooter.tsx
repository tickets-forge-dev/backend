'use client';

import { useEffect } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { ThemeToggle } from '@/core/components/ThemeToggle';
import { useUIStore } from '@/stores/ui.store';
import { useTicketsStore } from '@/stores/tickets.store';

export function SidebarFooter() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { quota, fetchQuota } = useTicketsStore();

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  return (
    <div className="mt-auto border-t border-[var(--border)] p-2 space-y-2">
      {/* Quota banner */}
      {!sidebarCollapsed && quota && (
        <div className="px-2 py-1.5 rounded-md bg-[var(--bg-subtle)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[var(--text-tertiary)]">
              {quota.used} of {quota.limit} tickets used
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-1 h-1 rounded-full bg-[var(--border)]/30 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${quota.canCreate ? 'bg-[var(--primary)]' : 'bg-red-500'}`}
              style={{ width: `${Math.min((quota.used / quota.limit) * 100, 100)}%` }}
            />
          </div>
          {!quota.canCreate && (
            <p className="mt-1 text-[10px] text-red-500">
              Limit reached — upgrade to create more
            </p>
          )}
        </div>
      )}

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
