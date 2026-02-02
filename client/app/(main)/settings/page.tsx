import { Card } from '@/core/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/core/components/ui/radio-group';
import { Label } from '@/core/components/ui/label';
import { Button } from '@/core/components/ui/button';
import { GitHubIntegration } from '@/src/settings/components/GitHubIntegration';
import Link from 'next/link';
import { X } from 'lucide-react';

export default function SettingsPage() {
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

      {/* Sectioned layout with clear hierarchy */}
      <section className="space-y-4">
        <div>
          <h2 className="text-[var(--text-md)] font-medium text-[var(--text)]">
            Appearance
          </h2>
          <p className="mt-1 text-[var(--text-sm)] text-[var(--text-secondary)]">
            Customize the look and feel
          </p>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-[var(--text-base)] font-medium text-[var(--text)] mb-3">
                Theme
              </h3>
              <RadioGroup defaultValue="system" className="space-y-3">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="system" id="system" />
                  <Label htmlFor="system" className="font-normal cursor-pointer">
                    <div>
                      <div className="text-[var(--text-base)] text-[var(--text)]">
                        System
                      </div>
                      <div className="text-[var(--text-sm)] text-[var(--text-tertiary)]">
                        Follow system theme preference
                      </div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light" className="font-normal cursor-pointer">
                    <div>
                      <div className="text-[var(--text-base)] text-[var(--text)]">
                        Light
                      </div>
                      <div className="text-[var(--text-sm)] text-[var(--text-tertiary)]">
                        Always use light mode
                      </div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark" className="font-normal cursor-pointer">
                    <div>
                      <div className="text-[var(--text-base)] text-[var(--text)]">
                        Dark
                      </div>
                      <div className="text-[var(--text-sm)] text-[var(--text-tertiary)]">
                        Always use dark mode
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </Card>
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

        <Card className="p-6">
          <p className="text-[var(--text-sm)] text-[var(--text-tertiary)]">
            Account settings coming soon...
          </p>
        </Card>
      </section>
    </div>
  );
}
