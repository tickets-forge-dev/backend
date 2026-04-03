'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { LayoutGrid, Settings, MessageCircle, Search, ClipboardList } from 'lucide-react';
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
    { label: 'Decision Logs', href: '/records', icon: ClipboardList },
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
                  'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                  isActive
                    ? 'bg-[var(--bg-hover)] text-[var(--text)]'
                    : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-secondary)]'
                )}
              >
                <span className="relative flex-shrink-0">
                  <Icon className="h-3.5 w-3.5" />
                  {showDot && (
                    <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-[var(--text-tertiary)]" />
                  )}
                </span>
                <span className={cn(
                  'truncate whitespace-nowrap transition-[opacity,transform] duration-200',
                  sidebarCollapsed ? 'opacity-0 -translate-x-1' : 'opacity-100 translate-x-0'
                )}>{item.label}</span>
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
              'w-full flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
              'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text)]'
            )}
          >
            <Search className="h-3.5 w-3.5 flex-shrink-0" />
            <span className={cn(
              'flex-1 text-left truncate whitespace-nowrap transition-[opacity,transform] duration-200',
              sidebarCollapsed ? 'opacity-0 -translate-x-1' : 'opacity-100 translate-x-0'
            )}>Command</span>
            <kbd className={cn(
              'ml-auto text-[10px] font-medium text-[var(--text-tertiary)] border border-[var(--border-subtle)] rounded px-1.5 py-0.5 whitespace-nowrap transition-opacity duration-200',
              sidebarCollapsed ? 'opacity-0' : 'opacity-100'
            )}>
              {isMac ? '⌘K' : 'Ctrl K'}
            </kbd>
          </button>
        </li>

        {/* Feedback button - separator */}
        <li className="my-3" />

        {/* Feedback button */}
        <li>
          <button
            onClick={() => { openFeedback(); closeMobileSidebar(); }}
            title="Send feedback"
            className={cn(
              'w-full flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
              'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text)]'
            )}
          >
            <MessageCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span className={cn(
              'truncate whitespace-nowrap transition-[opacity,transform] duration-200',
              sidebarCollapsed ? 'opacity-0 -translate-x-1' : 'opacity-100 translate-x-0'
            )}>Feedback</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
