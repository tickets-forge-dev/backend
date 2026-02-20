'use client';

import { useState } from 'react';
import { Info, X } from 'lucide-react';
import { useWizardStore } from '@/tickets/stores/generation-wizard.store';

/**
 * RepositoryToggle Component (Story 3.5-4: AC#1, #2)
 *
 * Checkbox to toggle repository inclusion during ticket creation.
 * When unchecked, repository selection is hidden and Stage 2 (Repository Context) is skipped.
 *
 * Features:
 * - Default: checked (maintains current behavior)
 * - Tooltip explaining impact of repository analysis (AC#1)
 * - Dismissible warning banner when unchecked (AC#2)
 * - Banner dismissal persisted in sessionStorage
 */
export function RepositoryToggle() {
  const includeRepository = useWizardStore((state) => state.includeRepository);
  const setIncludeRepository = useWizardStore((state) => state.setIncludeRepository);

  // AC#2: Read banner dismiss state from sessionStorage (with error handling)
  const [showWarning, setShowWarning] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      return sessionStorage.getItem('forge_repo_banner_dismissed') !== 'true';
    } catch {
      // Graceful fallback if sessionStorage is blocked (privacy mode, storage disabled)
      return true;
    }
  });

  // Handle banner dismiss with sessionStorage persistence (with error handling)
  const handleDismiss = () => {
    setShowWarning(false);
    try {
      sessionStorage.setItem('forge_repo_banner_dismissed', 'true');
    } catch {
      // Silently fail if sessionStorage is blocked - banner still dismisses for this session
    }
  };

  return (
    <div className="space-y-3">
      {/* Checkbox with helper text */}
      <div className="flex items-start gap-3">
        <div className="flex items-center h-5">
          <input
            id="include-repository"
            type="checkbox"
            checked={includeRepository}
            onChange={(e) => setIncludeRepository(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--border)] text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0 bg-[var(--bg)] cursor-pointer"
          />
        </div>
        <div className="flex-1">
          <label
            htmlFor="include-repository"
            className="text-sm font-medium text-[var(--text)] cursor-pointer flex items-center gap-2"
          >
            Connect repository for code analysis
            {/* Tooltip icon */}
            <div className="group relative">
              <Info className="h-4 w-4 text-[var(--text-secondary)] hover:text-[var(--text)]" />
              {/* Tooltip (AC#1: Final approved copy) */}
              <div className="absolute left-0 top-6 w-80 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg p-3 text-xs text-[var(--text-secondary)] leading-relaxed">
                  Repository analysis enables AI to suggest specific files and APIs to modify.
                  Without it, you&apos;ll get a high-level spec that developers can determine implementation details for.
                </div>
              </div>
            </div>
          </label>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Enable code-aware suggestions by analyzing your GitHub repository
          </p>
        </div>
      </div>

      {/* Warning banner when unchecked (AC#2: Dismissible with sessionStorage persistence) */}
      {!includeRepository && showWarning && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-lg p-3 flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Info className="h-4 w-4 text-amber-600 dark:text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              This ticket will not include code-aware suggestions. Developers will need to determine implementation details.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="flex-shrink-0 text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
            aria-label="Dismiss warning"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
