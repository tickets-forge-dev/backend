'use client';

import { useEffect } from 'react';
import { Card } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { GitHubIntegration } from '@/src/settings/components/GitHubIntegration';
import { LinearIntegration } from '@/src/settings/components/LinearIntegration';
import { JiraIntegration } from '@/src/settings/components/JiraIntegration';
import { FigmaIntegration } from '@/src/settings/components/FigmaIntegration';
import { RoleSettings } from '@/src/settings/components/RoleSettings';
import { ProfileManagement } from '@/project-profiles/components/ProfileManagement';
import { useTheme, type Theme } from '@/src/hooks/useTheme';
import { useTicketsStore } from '@/stores/tickets.store';
import Link from 'next/link';
import { X, Monitor, Sun, Moon, User } from 'lucide-react';

function UsageSection() {
  const quota = useTicketsStore((s) => s.quota);
  const fetchQuota = useTicketsStore((s) => s.fetchQuota);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  if (!quota) return null;

  const percent = quota.usagePercent;
  const barColor = 'bg-[var(--text-tertiary)]';

  const formatTokens = (n: number) =>
    n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
        ? `${(n / 1_000).toFixed(0)}K`
        : String(n);

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-[var(--text)]">Usage</h2>
      <div className="rounded-lg border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
        {/* Token usage */}
        <div className="px-5 py-4 space-y-2">
          <div className="flex items-center justify-between text-[var(--text-sm)]">
            <div>
              <p className="font-medium text-[var(--text)]">Token usage</p>
              <p className="text-[var(--text-tertiary)] text-[11px] mt-0.5">{percent}% of monthly allowance</p>
            </div>
            <span className="text-[var(--text-secondary)] text-xs">
              {formatTokens(quota.tokensUsed)} / {formatTokens(quota.tokenLimit)}
            </span>
          </div>
          <div className="h-1 rounded-full bg-[var(--bg-hover)] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
        </div>

        {/* Daily tickets */}
        <div className="px-5 py-4 flex items-center justify-between text-[var(--text-sm)]">
          <div>
            <p className="font-medium text-[var(--text)]">Tickets created today</p>
            <p className="text-[var(--text-tertiary)] text-[11px] mt-0.5">Daily creation limit</p>
          </div>
          <span className="text-[var(--text-secondary)] text-xs">
            {quota.ticketsCreatedToday} / {quota.dailyTicketLimit}
          </span>
        </div>
      </div>
    </section>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="space-y-8 max-w-[var(--content-max)] mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[var(--text-xl)] font-medium text-[var(--text)]">
            Settings
          </h1>
          <p className="mt-2 text-[var(--text-md)] text-[var(--text-secondary)]">
            Manage your preferences
          </p>
        </div>
        <Link href="/tickets">
          <Button variant="ghost" size="icon">
            <X className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Appearance Section */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-[var(--text)]">Appearance</h2>
        <div className="rounded-lg border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-[var(--text)] text-[var(--text-sm)]">Theme</p>
              <p className="text-[var(--text-tertiary)] text-[11px] mt-0.5">Choose your preferred appearance</p>
            </div>
            <div className="inline-flex rounded-lg bg-[var(--bg-hover)] p-0.5">
              {[
                { value: 'system', label: 'System', icon: Monitor },
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'dark', label: 'Dark', icon: Moon },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value as Theme)}
                  className={`
                    flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all
                    ${theme === value
                      ? 'bg-[var(--bg)] text-[var(--text)] shadow-[var(--shadow-xs)]'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                    }
                  `}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Usage Section */}
      <UsageSection />

      {/* Account Section */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-[var(--text)]">Account</h2>
        <div className="rounded-lg border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
          <div className="px-5 py-4">
            <RoleSettings />
          </div>
          <Link
            href="/profile"
            className="flex items-center justify-between px-5 py-4 text-[var(--text-sm)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors first:rounded-t-lg last:rounded-b-lg"
          >
            <div className="flex items-center gap-3">
              <User className="h-3.5 w-3.5" />
              <span>Edit Profile</span>
            </div>
            <span className="text-[var(--text-tertiary)]">&rarr;</span>
          </Link>
        </div>
      </section>

      {/* Connected Repositories — Epic 15 */}
      <ProfileManagement />

      {/* Integrations Section */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-[var(--text)]">Integrations</h2>
        <div className="rounded-lg border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
          <div className="px-5 py-4"><GitHubIntegration /></div>
          <div className="px-5 py-4"><LinearIntegration /></div>
          <div className="px-5 py-4"><JiraIntegration /></div>
          <div className="px-5 py-4"><FigmaIntegration /></div>
        </div>
      </section>
    </div>
  );
}
