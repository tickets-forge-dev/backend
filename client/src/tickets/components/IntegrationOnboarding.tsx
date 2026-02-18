'use client';

import { useState } from 'react';
import { Button } from '@/core/components/ui/button';
import { Link as LinkIcon, SettingsIcon, CheckCircle2 } from 'lucide-react';

interface Props {
  onClose: () => void;
}

/**
 * Integration Onboarding Slide
 *
 * Shows during creation flow to inform users about:
 * - Jira and Linear integration capabilities
 * - Import workflow
 * - How to connect integrations
 */
export function IntegrationOnboarding({ onClose }: Props) {
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    // Store in localStorage so user doesn't see it again
    localStorage.setItem('integration-onboarding-dismissed', 'true');
    onClose();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-semibold">Supercharge Your Workflow</h1>
        <p className="text-lg text-[var(--text-secondary)]">
          Connect Jira or Linear to import and enrich your tickets
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Jira Card */}
        <div className="p-6 rounded-lg border border-blue-500/30 bg-blue-500/5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🔵</div>
            <h2 className="text-xl font-semibold text-blue-600">Jira Integration</h2>
          </div>

          <p className="text-sm text-[var(--text-secondary)]">
            Import existing Jira issues and automatically enrich them with code analysis, acceptance criteria, and implementation details.
          </p>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-[var(--text-secondary)]">Search and import by issue key (e.g., KAN&ndash;2)</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-[var(--text-secondary)]">Auto-map priority and issue type</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-[var(--text-secondary)]">Preserve original issue link</span>
            </div>
          </div>
        </div>

        {/* Linear Card */}
        <div className="p-6 rounded-lg border border-purple-500/30 bg-purple-500/5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🟣</div>
            <h2 className="text-xl font-semibold text-purple-600">Linear Integration</h2>
          </div>

          <p className="text-sm text-[var(--text-secondary)]">
            Import Linear issues to get instant technical specifications with full context from your code repository.
          </p>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-[var(--text-secondary)]">Import by issue identifier or UUID</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-[var(--text-secondary)]">Automatic priority conversion</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-[var(--text-secondary)]">Link back to original issue</span>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="p-6 rounded-lg bg-[var(--bg-hover)] space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          How to Get Started
        </h3>

        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-2">
            <div className="font-semibold text-[var(--primary)]">1. Connect</div>
            <p className="text-[var(--text-secondary)]">
              Go to Settings and connect your Jira or Linear account
            </p>
          </div>
          <div className="space-y-2">
            <div className="font-semibold text-[var(--primary)]">2. Import</div>
            <p className="text-[var(--text-secondary)]">
              Click &quot;Import &amp; Enrich&quot; and search for an issue
            </p>
          </div>
          <div className="space-y-2">
            <div className="font-semibold text-[var(--primary)]">3. Enrich</div>
            <p className="text-[var(--text-secondary)]">
              Answer clarification questions to finalize the spec
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="flex items-center gap-3 justify-center">
        <Button onClick={handleDismiss}>
          Create Ticket
        </Button>
        <span className="text-sm text-[var(--text-tertiary)]">or</span>
        <Button variant="outline" onClick={() => window.location.href = '/settings'}>
          <SettingsIcon className="h-4 w-4 mr-2" />
          Configure Integration
        </Button>
      </div>

      {/* Footer */}
      <p className="text-xs text-center text-[var(--text-tertiary)]">
        You can configure integrations anytime in Settings
      </p>
    </div>
  );
}
