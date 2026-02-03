'use client';

import { Card } from '@/core/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/core/components/ui/radio-group';
import { Label } from '@/core/components/ui/label';
import { Button } from '@/core/components/ui/button';
import { GitHubIntegration } from '@/src/settings/components/GitHubIntegration';
import { useTheme } from '@/src/hooks/useTheme';
import Link from 'next/link';
import { X } from 'lucide-react';

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
          <p className="mt-1 text-[var(--text-sm)] text-[var(--text-secondary)]">
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
      <section className="space-y-4">
        <div>
          <h2 className="text-[var(--text-md)] font-medium text-[var(--text)]">
            Integrations
          </h2>
          <p className="mt-1 text-[var(--text-sm)] text-[var(--text-secondary)]">
            Connect external services
          </p>
        </div>

        <GitHubIntegration />
      </section>

      {/* Appearance Section */}
      <section className="space-y-4">
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
          <RadioGroup value={theme} onValueChange={setTheme} className="space-y-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="system" id="system" />
              <Label htmlFor="system" className="font-normal cursor-pointer text-[var(--text-sm)] text-[var(--text)]">
                System
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light" className="font-normal cursor-pointer text-[var(--text-sm)] text-[var(--text)]">
                Light
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark" className="font-normal cursor-pointer text-[var(--text-sm)] text-[var(--text)]">
                Dark
              </Label>
            </div>
          </RadioGroup>
        </div>
      </section>

      <section className="space-y-4">
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
