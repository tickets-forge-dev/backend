'use client';

import { useEffect, useState } from 'react';
import { PanelLeftClose, PanelLeftOpen, Info } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { ThemeToggle } from '@/core/components/ThemeToggle';
import { useUIStore } from '@/stores/ui.store';
import { useTicketsStore } from '@/stores/tickets.store';

function UsageBar({ collapsed }: { collapsed: boolean }) {
  const quota = useTicketsStore((s) => s.quota);
  const fetchQuota = useTicketsStore((s) => s.fetchQuota);

  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  if (!quota) return null;

  const percent = quota.usagePercent;
  const color =
    percent >= 90
      ? 'bg-red-500'
      : percent >= 70
        ? 'bg-amber-500'
        : 'bg-emerald-500';

  const dotColor =
    percent >= 90
      ? 'bg-red-500'
      : percent >= 70
        ? 'bg-amber-500'
        : 'bg-emerald-500';

  if (collapsed) {
    return (
      <div className="flex justify-center py-1">
        <div className={`h-2 w-2 rounded-full ${dotColor}`} title={`${percent}% tokens used`} />
      </div>
    );
  }

  return (
    <div className="px-1 py-1 space-y-1 relative">
      <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
        <span className="flex items-center gap-1">
          Tokens
          <button
            onClick={() => setShowTooltip(!showTooltip)}
            onBlur={() => setShowTooltip(false)}
            className="hover:text-[var(--text-secondary)] transition-colors"
            aria-label="Token usage info"
          >
            <Info className="h-2.5 w-2.5" />
          </button>
        </span>
        <span>{percent}%</span>
      </div>
      {showTooltip && (
        <div className="absolute bottom-full left-0 mb-2 w-52 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-subtle)] px-3 py-2 text-[10px] text-[var(--text-secondary)] shadow-lg z-50 leading-relaxed">
          Each ticket uses AI tokens for analysis and spec generation. Your team has a monthly token allowance that resets automatically on the 1st of each month.
        </div>
      )}
      <div className="h-1 rounded-full bg-[var(--bg-hover)] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}

export function SidebarFooter() {
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();

  return (
    <div className="mt-auto border-t border-[var(--border)] p-2 space-y-2">
      <UsageBar collapsed={sidebarCollapsed} />

      <div className="flex items-center justify-between gap-1">
        {/* Theme toggle */}
        <ThemeToggle />

        {/* Collapse toggle - bottom right */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
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
