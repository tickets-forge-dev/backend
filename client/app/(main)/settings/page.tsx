'use client';

import { Card } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { GitHubIntegration } from '@/src/settings/components/GitHubIntegration';
import { LinearIntegration } from '@/src/settings/components/LinearIntegration';
import { JiraIntegration } from '@/src/settings/components/JiraIntegration';
import { FigmaIntegration } from '@/src/settings/components/FigmaIntegration';
import { TeamSettings } from '@/teams/components/TeamSettings';
import { useTheme, type Theme } from '@/src/hooks/useTheme';
import Link from 'next/link';
import { X, Monitor, Sun, Moon } from 'lucide-react';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="space-y-12">
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

      {/* Integrations Section */}
      <section className="rounded-lg bg-[var(--bg-subtle)] p-6 space-y-4">
        <div>
          <h2 className="text-[var(--text-md)] font-medium text-[var(--text)]">
            Integrations
          </h2>
          <p className="mt-1 text-[var(--text-sm)] text-[var(--text-secondary)]">
            Connect external services
          </p>
        </div>

        <GitHubIntegration />
        <div className="border-t border-[var(--border)] my-4" />
        <LinearIntegration />
        <div className="border-t border-[var(--border)] my-4" />
        <JiraIntegration />
        <div className="border-t border-[var(--border)] my-4" />
        <FigmaIntegration />
      </section>

      {/* Team Section */}
      <section className="rounded-lg bg-[var(--bg-subtle)] p-6 space-y-4">
        <div>
          <h2 className="text-[var(--text-md)] font-medium text-[var(--text)]">
            Team
          </h2>
          <p className="mt-1 text-[var(--text-sm)] text-[var(--text-secondary)]">
            Manage your team settings
          </p>
        </div>

        <TeamSettings />
      </section>

      {/* Appearance Section */}
      <section className="rounded-lg bg-[var(--bg-subtle)] p-6 space-y-4">
        <div>
          <h2 className="text-[var(--text-md)] font-medium text-[var(--text)]">
            Appearance
          </h2>
          <p className="mt-1 text-[var(--text-sm)] text-[var(--text-secondary)]">
            Customize the look and feel
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-[var(--text-sm)] font-medium text-[var(--text)]">
            Theme
          </h3>
          <div className="inline-flex rounded-lg bg-[var(--bg-hover)] p-1">
            {[
              { value: 'system', label: 'System', icon: Monitor },
              { value: 'light', label: 'Light', icon: Sun },
              { value: 'dark', label: 'Dark', icon: Moon },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value as Theme)}
                className={`
                  flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[var(--text-sm)] font-medium transition-all
                  ${theme === value
                    ? 'bg-[var(--bg)] text-[var(--text)] shadow-[var(--shadow-xs)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                  }
                `}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Account Section */}
      <section className="rounded-lg bg-[var(--bg-subtle)] p-6 space-y-4">
        <div>
          <h2 className="text-[var(--text-md)] font-medium text-[var(--text)]">
            Account
          </h2>
          <p className="mt-1 text-[var(--text-sm)] text-[var(--text-secondary)]">
            Manage your account settings
          </p>
        </div>

        <p className="text-[var(--text-sm)] text-[var(--text-tertiary)]">
          Account settings coming soon...
        </p>
      </section>
    </div>
  );
}
