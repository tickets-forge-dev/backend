'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { LayoutGrid, Settings, MessageCircle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui.store';
import { useFeedbackStore } from '@/stores/feedback.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useProjectProfileStore } from '@/project-profiles/stores/project-profile.store';

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

export function SidebarNav() {
  const pathname = usePathname();
  const { sidebarCollapsed, setSidebarCollapsed, setCommandPaletteOpen } = useUIStore();

  const closeMobileSidebar = () => {
    if (window.innerWidth < 768) {
      setSidebarCollapsed(true);
    }
  };
  const { openFeedback } = useFeedbackStore();

  // Check for unprofiled/failed repos — memoized to avoid re-renders on every poll
  const selectedRepos = useSettingsStore((s) => s.selectedRepositories);
  const profilesList = useProjectProfileStore((s) => s.profiles);
  const hasProfileAttention = useMemo(() => {
    if (selectedRepos.length === 0) return false;
    return selectedRepos.some((repo) => {
      const profile = profilesList.find(
        (p) => p.repoOwner === repo.owner && p.repoName === repo.name,
      );
      return !profile || profile.status === 'failed';
    });
  }, [selectedRepos, profilesList]);

  const navigationItems = [
    { label: 'Workspace', href: '/tickets', icon: LayoutGrid },
    { label: 'Settings', href: '/settings', icon: Settings, attention: hasProfileAttention },
  ];

  return (
    <nav className="flex-1 px-2 py-4">
      <ul className="space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          const showDot = 'attention' in item && item.attention;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={closeMobileSidebar}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                  isActive
                    ? 'bg-[var(--bg-active)] text-[var(--text)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text)]'
                )}
              >
                <span className="relative flex-shrink-0">
                  <Icon className="h-4 w-4" />
                  {showDot && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-500" />
                  )}
                </span>
                {!sidebarCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </Link>
            </li>
          );
        })}

        {/* Command palette trigger */}
        <li>
          <button
            onClick={() => { setCommandPaletteOpen(true); closeMobileSidebar(); }}
            title={`Command palette (${isMac ? '⌘' : 'Ctrl+'}K)`}
            className={cn(
              'w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
              'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text)]'
            )}
          >
            <Search className="h-4 w-4 flex-shrink-0" />
            {!sidebarCollapsed && (
              <span className="flex-1 text-left truncate">Command</span>
            )}
            {!sidebarCollapsed && (
              <kbd className="ml-auto text-[10px] font-medium text-[var(--text-tertiary)] border border-[var(--border-subtle)] rounded px-1.5 py-0.5">
                {isMac ? '⌘K' : 'Ctrl K'}
              </kbd>
            )}
          </button>
        </li>

        {/* Feedback button - separator */}
        <li className="my-2 border-t border-[var(--border)]" />

        {/* Feedback button */}
        <li>
          <button
            onClick={() => { openFeedback(); closeMobileSidebar(); }}
            title="Send feedback"
            className={cn(
              'w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
              'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text)]'
            )}
          >
            <MessageCircle className="h-4 w-4 flex-shrink-0" />
            {!sidebarCollapsed && (
              <span className="truncate">Feedback</span>
            )}
          </button>
        </li>
      </ul>
    </nav>
  );
}
