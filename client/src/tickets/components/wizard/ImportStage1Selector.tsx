'use client';

import { useState, useEffect, useRef } from 'react';
import { useServices } from '@/hooks/useServices';
import { useImportWizardStore } from '@/tickets/stores/import-wizard.store';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Loader2, Check } from 'lucide-react';

interface Props {
  onError: (message: string) => void;
}

interface IssueOption {
  id: string;
  key?: string;
  identifier?: string;
  title: string;
}

/**
 * ImportStage1Selector
 *
 * Enhanced with autocomplete: Ask user to paste issue key/ID
 * - Platform selection: Jira or Linear
 * - Issue key/ID input with real-time autocomplete suggestions
 * - Shows matching issues as user types
 * - User can select from dropdown or continue with manual entry
 */
export function ImportStage1Selector({ onError }: Props) {
  const { jiraService, linearService } = useServices();
  const { platform, setPlatform, setSelectedIssue, goToStage } = useImportWizardStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [issueKey, setIssueKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [autocompleteOptions, setAutocompleteOptions] = useState<IssueOption[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Handle autocomplete search
  useEffect(() => {
    if (!platform || !issueKey.trim() || issueKey.length < 2) {
      setAutocompleteOptions([]);
      setShowDropdown(false);
      return;
    }

    const searchIssues = async () => {
      setIsSearching(true);
      try {
        const query = issueKey.trim();
        const results = platform === 'jira'
          ? await jiraService.searchIssues(query)
          : await linearService.searchIssues(query);

        setAutocompleteOptions(results);
        setShowDropdown(results.length > 0);
      } catch (err) {
        // Silently fail on autocomplete - don't show error banner
        setAutocompleteOptions([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchIssues, 300);
    return () => clearTimeout(debounceTimer);
  }, [issueKey, platform, jiraService, linearService]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validateIssueKey = (): boolean => {
    setValidationError(null);

    if (!issueKey.trim()) {
      setValidationError('Issue key/ID is required');
      return false;
    }

    if (platform === 'jira') {
      // Jira format: PROJECT-123
      const jiraKeyRegex = /^[A-Z][A-Z0-9]*-\d+$/;
      if (!jiraKeyRegex.test(issueKey.trim())) {
        setValidationError('Invalid Jira issue key. Expected format: PROJECT-123');
        return false;
      }
    } else if (platform === 'linear') {
      // Linear format: FOR-123 or UUID
      const linearKeyRegex = /^([A-Z]+-\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
      if (!linearKeyRegex.test(issueKey.trim())) {
        setValidationError('Invalid Linear issue ID. Expected format: TEAM-123 or UUID');
        return false;
      }
    }

    return true;
  };

  const handleSelectOption = async (option: IssueOption) => {
    const selectedKey = platform === 'jira' ? (option.key || '') : (option.identifier || '');
    setIssueKey(selectedKey);
    setShowDropdown(false);
    setValidationError(null);

    // Auto-import selected issue
    setIsLoading(true);
    try {
      const issue = platform === 'jira'
        ? await jiraService.importIssue(option.key || '')
        : await linearService.importIssue(option.identifier || option.id);

      setSelectedIssue({
        id: issue.importedFrom.issueId,
        key: platform === 'jira' ? option.key : undefined,
        identifier: platform === 'linear' ? option.identifier : undefined,
        title: option.title,
        description: '',
        url: issue.importedFrom.issueUrl,
        mappedType: 'task',
        mappedPriority: 'medium',
      });

      goToStage(2);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to import issue';
      onError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = async () => {
    if (!validateIssueKey()) return;

    setIsLoading(true);
    try {
      // Fetch full issue details
      const issue = platform === 'jira'
        ? await jiraService.importIssue(issueKey.trim())
        : await linearService.importIssue(issueKey.trim());

      // The API response has { ticketId, importedFrom }
      // We need to extract the issue data. For MVP, we'll store minimal data.
      // The backend creates the ticket, so we just transition to the next stage.
      // Actually, let me re-read the plan...

      // The plan says fetch via jiraService.getIssue() for preview.
      // But we don't have that endpoint yet. Let's use a simplified approach:
      // Store the imported data and go to preview stage.

      setSelectedIssue({
        id: issue.importedFrom.issueId,
        key: platform === 'jira' ? issueKey.trim() : undefined,
        identifier: platform === 'linear' ? issueKey.trim() : undefined,
        title: '', // Will be fetched in next stage
        description: '',
        url: issue.importedFrom.issueUrl,
        mappedType: 'task',
        mappedPriority: 'medium',
      });

      goToStage(2);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to import issue';
      onError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Import Ticket</h1>
        <p className="text-sm text-[var(--text-tertiary)]">
          Select which platform to import from, then enter the issue key or ID
        </p>
      </div>

      {/* Platform selector */}
      <div className="flex gap-3">
        <button
          onClick={() => {
            setPlatform('jira');
            setValidationError(null);
          }}
          className={`px-4 py-2 rounded-lg border-2 transition-colors font-medium ${
            platform === 'jira'
              ? 'border-blue-500 bg-blue-500/10 text-blue-700'
              : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-blue-500/50'
          }`}
        >
          Jira
        </button>
        <button
          onClick={() => {
            setPlatform('linear');
            setValidationError(null);
          }}
          className={`px-4 py-2 rounded-lg border-2 transition-colors font-medium ${
            platform === 'linear'
              ? 'border-purple-500 bg-purple-500/10 text-purple-700'
              : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-purple-500/50'
          }`}
        >
          Linear
        </button>
      </div>

      {platform && (
        <div className="space-y-4">
          {/* Instructions */}
          <div className="p-4 bg-[var(--bg-subtle)] rounded-lg border border-[var(--border)]">
            <p className="text-sm text-[var(--text-secondary)]">
              {platform === 'jira'
                ? 'Enter the Jira issue key (e.g., PROJ-123)'
                : 'Enter the Linear issue ID (e.g., FOR-123 or UUID)'}
            </p>
          </div>

          {/* Issue key input with autocomplete */}
          <div className="space-y-2 relative">
            <label className="block text-sm font-medium">
              {platform === 'jira' ? 'Jira Issue Key or Title' : 'Linear Issue ID or Title'}
            </label>
            <div className="relative" ref={dropdownRef}>
              <Input
                type="text"
                value={issueKey}
                onChange={(e) => {
                  setIssueKey(e.target.value);
                  setValidationError(null);
                  setShowDropdown(true);
                }}
                onFocus={() => {
                  if (issueKey.trim().length >= 2 && autocompleteOptions.length > 0) {
                    setShowDropdown(true);
                  }
                }}
                placeholder={platform === 'jira' ? 'Search PROJ-123 or issue title...' : 'Search FOR-123, UUID, or title...'}
                className={validationError ? 'border-red-500/50 focus:border-red-500' : ''}
                disabled={isLoading}
              />

              {/* Autocomplete dropdown */}
              {showDropdown && autocompleteOptions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                  {autocompleteOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleSelectOption(option)}
                      disabled={isLoading}
                      className="w-full text-left px-4 py-3 hover:bg-[var(--bg-hover)] border-b border-[var(--border)]/50 last:border-b-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{option.key || option.identifier}</div>
                          <div className="text-xs text-[var(--text-secondary)] truncate">
                            {option.title}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Search indicator */}
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-[var(--text-tertiary)]" />
                </div>
              )}
            </div>

            {validationError && (
              <p className="text-xs text-red-600">{validationError}</p>
            )}
            {showDropdown && autocompleteOptions.length === 0 && issueKey.trim().length >= 2 && !isSearching && (
              <p className="text-xs text-[var(--text-tertiary)]">No matching issues found</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              disabled={isLoading}
            >
              Back
            </Button>
            <Button
              onClick={handleContinue}
              disabled={!issueKey.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
