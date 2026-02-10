'use client';

import { useRouter } from 'next/navigation';
import { useServices } from '@/hooks/useServices';
import { useState, useEffect } from 'react';

/**
 * CreationChoiceModal
 *
 * Entry point for ticket creation. Shows user:
 * 1. Integration onboarding slide (first time or dismissible)
 * 2. Choice between create new or import from Jira/Linear
 *
 * Checks availability of import platforms before showing import option.
 */
export function CreationChoiceModal() {
  const router = useRouter();
  const { jiraService, linearService } = useServices();

  const [availability, setAvailability] = useState<{
    jira: boolean;
    linear: boolean;
  }>({ jira: false, linear: false });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      const [jiraStatus, linearStatus] = await Promise.all([
        jiraService.getConnectionStatus(),
        linearService.getConnectionStatus(),
      ]);
      setAvailability({
        jira: jiraStatus.connected,
        linear: linearStatus.connected,
      });
    } catch (err) {
      console.error('Failed to load platform availability', err);
    } finally {
      setIsLoading(false);
    }
  };

  const hasImportOptions = availability.jira || availability.linear;

  const handleCreateNew = () => {
    router.push('/tickets/create?mode=new');
  };

  const handleImport = () => {
    router.push('/tickets/create?mode=import');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-2xl font-semibold mb-2">Create Executable Ticket</h1>
      <p className="text-sm text-[var(--text-tertiary)] mb-8">
        Choose how you&apos;d like to create a new ticket
      </p>

      <div className="space-y-4">
        {/* Create New Option */}
        <button
          onClick={handleCreateNew}
          className="w-full p-6 rounded-lg border-2 border-[var(--border)] hover:border-[var(--primary)] transition-colors text-left hover:bg-[var(--bg-hover)]"
        >
          <div className="flex items-start gap-4">
            <div className="text-3xl">📝</div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold mb-1">Create New from Scratch</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Start with a blank ticket and build your specification from the ground up
              </p>
            </div>
          </div>
        </button>

        {/* Import Option (conditional) */}
        {!isLoading &&
          (hasImportOptions ? (
            <button
              onClick={handleImport}
              className="w-full p-6 rounded-lg border-2 border-[var(--border)] hover:border-[var(--primary)] transition-colors text-left hover:bg-[var(--bg-hover)]"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">🔗</div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold mb-2">Import & Enrich from PM Tool</h2>
                  <p className="text-sm text-[var(--text-secondary)] mb-3">
                    Import an existing ticket from Jira or Linear and enrich it with code-aware analysis
                  </p>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                    <span>Connected:</span>
                    {availability.jira && (
                      <span className="px-2 py-1 bg-blue-500/10 text-blue-600 rounded text-xs font-medium">
                        Jira
                      </span>
                    )}
                    {availability.linear && (
                      <span className="px-2 py-1 bg-purple-500/10 text-purple-600 rounded text-xs font-medium">
                        Linear
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ) : (
            <div className="w-full p-6 rounded-lg border-2 border-[var(--border)]/50 bg-[var(--bg-subtle)] text-left">
              <div className="flex items-start gap-4">
                <div className="text-3xl opacity-50">🔗</div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold mb-1 text-[var(--text-tertiary)]">
                    Import from PM Tool
                  </h2>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    Connect Jira or Linear in Settings to enable import functionality
                  </p>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
