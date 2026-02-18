'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Ticket, Settings, CreditCard, MessageCircle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui.store';
import { useFeedbackStore } from '@/stores/feedback.store';
import { useTeamStore } from '@/teams/stores/team.store';

export function SidebarNav() {
  const pathname = usePathname();
  const { sidebarCollapsed } = useUIStore();
  const { openFeedback } = useFeedbackStore();
  const { currentTeam } = useTeamStore();

  // Compute currentTeamId from currentTeam for reactivity
  const currentTeamId = currentTeam?.id || null;

  const navigationItems = [
    { label: 'Tickets', href: '/tickets', icon: Ticket },
    { label: 'Teams', href: currentTeamId ? `/teams/${currentTeamId}` : '/teams', icon: Users },
    { label: 'Pricing', href: '/pricing', icon: CreditCard },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <nav className="flex-1 px-2 py-4">
      <ul className="space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          const isTeamsLink = item.label === 'Teams';
          const isDisabled = isTeamsLink && !currentTeamId;

          // If Teams link is disabled, render as disabled button instead of link
          if (isDisabled) {
            return (
              <li key={item.href}>
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    'text-[var(--text-tertiary)] opacity-50 cursor-not-allowed'
                  )}
                  title="Switch to a team to access team management"
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </div>
              </li>
            );
          }

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                  isActive
                    ? 'bg-[var(--bg-active)] text-[var(--text)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text)]'
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </Link>
            </li>
          );
        })}

        {/* Feedback button - separator */}
        <li className="my-2 border-t border-[var(--border)]" />

        {/* Feedback button */}
        <li>
          <button
            onClick={openFeedback}
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
