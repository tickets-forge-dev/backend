'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Ticket, Settings, CreditCard, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui.store';
import { useFeedbackStore } from '@/stores/feedback.store';

const navigationItems = [
  { label: 'Tickets', href: '/tickets', icon: Ticket },
  { label: 'Pricing', href: '/pricing', icon: CreditCard },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { sidebarCollapsed } = useUIStore();
  const { openFeedback } = useFeedbackStore();

  return (
    <nav className="flex-1 px-2 py-4">
      <ul className="space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

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
