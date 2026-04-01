'use client';

import { useEffect } from 'react';
import { Card } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { GitHubIntegration } from '@/src/settings/components/GitHubIntegration';
import { LinearIntegration } from '@/src/settings/components/LinearIntegration';
import { JiraIntegration } from '@/src/settings/components/JiraIntegration';
import { FigmaIntegration } from '@/src/settings/components/FigmaIntegration';
import { RoleSettings } from '@/src/settings/components/RoleSettings';
import { useTheme, type Theme } from '@/src/hooks/useTheme';
import { useFont, FONT_OPTIONS, type FontFamily } from '@/src/hooks/useFont';
import { useTicketsStore } from '@/stores/tickets.store';
import { useSessionStore } from '@/src/sessions/stores/session.store';
import Link from 'next/link';
import { X, Monitor, Sun, Moon, User, FileText, Play, Info, Type } from 'lucide-react';

function UsageSection() {
  const ticketQuota = useTicketsStore((s) => s.quota);
  const fetchTicketQuota = useTicketsStore((s) => s.fetchQuota);
  const sessionQuota = useSessionStore((s) => s.quota);
  const fetchSessionQuota = useSessionStore((s) => s.fetchQuota);

  useEffect(() => {
    fetchTicketQuota();
    fetchSessionQuota();
  }, [fetchTicketQuota, fetchSessionQuota]);

  // Tokens reset on the 1st of next month
  const now = new Date();
  const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const resetLabel = resetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const formatTokens = (n: number) =>
    n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
        ? `${(n / 1_000).toFixed(0)}K`
        : String(n);

  const tokenPercent = ticketQuota?.usagePercent ?? 0;
  const sessionPercent = sessionQuota ? Math.round(((sessionQuota.limit - sessionQuota.remaining) / sessionQuota.limit) * 100) : 0;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-[var(--text)]">Usage</h2>
      <div className="rounded-lg border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">

        {/* Ticket Tokens — for spec generation */}
        <div className="px-5 py-4 space-y-2.5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-md bg-violet-500/10 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-violet-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-[var(--text)] flex items-center gap-1">
                Ticket Tokens
                <span className="group relative">
                  <Info className="w-3 h-3 text-[var(--text-tertiary)] cursor-help" />
                  <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-52 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-subtle)] px-3 py-2 text-[10px] text-[var(--text-secondary)] shadow-lg leading-relaxed">
                    Used when creating and refining tickets. Each ticket consumes AI tokens for spec generation, analysis, and Q&A. When your allowance is used up, token usage resets automatically on the 1st of each month.
                  </span>
                </span>
              </p>
              <p className="text-[11px] text-[var(--text-tertiary)]">AI tokens for spec generation and analysis</p>
            </div>
            {ticketQuota && (
              <span className="text-[var(--text-secondary)] text-[12px] shrink-0">
                {formatTokens(ticketQuota.tokensUsed)} / {formatTokens(ticketQuota.tokenLimit)}
              </span>
            )}
          </div>
          <div className="h-1.5 rounded-full bg-[var(--bg-hover)] overflow-hidden">
            <div
              className="h-full rounded-full bg-violet-500/60 transition-all"
              style={{ width: `${Math.min(tokenPercent, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
            <span>{tokenPercent}% used</span>
            <span>Resets {resetLabel}</span>
          </div>
        </div>

        {/* Development Sessions — for Cloud Develop */}
        <div className="px-5 py-4 space-y-2.5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
              <Play className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-[var(--text)] flex items-center gap-1">
                Development Sessions
                <span className="group relative">
                  <Info className="w-3 h-3 text-[var(--text-tertiary)] cursor-help" />
                  <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-52 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-subtle)] px-3 py-2 text-[10px] text-[var(--text-secondary)] shadow-lg leading-relaxed">
                    Used when you click &quot;Develop&quot; on a ticket. Claude implements the feature in the cloud. When your sessions are used up, you can still assign tickets to developers who use their own tools.
                  </span>
                </span>
              </p>
              <p className="text-[11px] text-[var(--text-tertiary)]">Cloud Develop runs per month</p>
            </div>
            {sessionQuota ? (
              <span className="text-[var(--text-secondary)] text-[12px] shrink-0">
                {sessionQuota.used} / {sessionQuota.limit}
              </span>
            ) : (
              <span className="text-[var(--text-tertiary)] text-[12px] shrink-0">—</span>
            )}
          </div>
          <div className="h-1.5 rounded-full bg-[var(--bg-hover)] overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500/60 transition-all"
              style={{ width: `${Math.min(sessionPercent, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
            <span>{sessionQuota ? `${sessionQuota.remaining} remaining` : 'Loading...'}</span>
            <span>Resets {resetLabel}</span>
          </div>
        </div>

        {/* Daily tickets */}
        <div className="px-5 py-3.5 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-[var(--text)]">Tickets created today</p>
            <p className="text-[11px] text-[var(--text-tertiary)]">Daily creation limit</p>
          </div>
          {ticketQuota && (
            <span className="text-[var(--text-secondary)] text-[12px]">
              {ticketQuota.ticketsCreatedToday} / {ticketQuota.dailyTicketLimit}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { font, setFont } = useFont();
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
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-[var(--text)] text-[var(--text-sm)]">Font</p>
              <p className="text-[var(--text-tertiary)] text-[11px] mt-0.5">Choose your preferred typeface</p>
            </div>
            <select
              value={font}
              onChange={(e) => setFont(e.target.value as FontFamily)}
              className="rounded-lg bg-[var(--bg-hover)] border border-[var(--border-subtle)] px-3 py-1.5 text-[12px] font-medium text-[var(--text)] focus:outline-none focus:border-[var(--border-hover)] cursor-pointer"
            >
              {FONT_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
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

      {/* Integrations Section */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-[var(--text)]">Integrations</h2>
        <div className="rounded-lg border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
          <div className="px-5 py-4">
            <GitHubIntegration />
          </div>
          <div className="px-5 py-4"><LinearIntegration /></div>
          <div className="px-5 py-4"><JiraIntegration /></div>
          <div className="px-5 py-4"><FigmaIntegration /></div>
        </div>
      </section>
    </div>
  );
}
