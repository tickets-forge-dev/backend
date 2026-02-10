'use client';

import { useState, useEffect, useRef } from 'react';
import { useServices } from '@/hooks/useServices';
import { useImportWizardStore } from '@/tickets/stores/import-wizard.store';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Loader2, Check, ChevronDown, Link2 } from 'lucide-react';

interface Props {
  onError: (message: string) => void;
  availability?: {
    jira: boolean;
    linear: boolean;
  };
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
 * - Shows matching issues as user types with full details
 * - Keyboard navigation (↑/↓/Enter/Esc)
 * - User can select from dropdown or continue with manual entry
 */
export function ImportStage1Selector({ onError, availability }: Props) {
  const { jiraService, linearService } = useServices();
  const { platform, setPlatform, setSelectedIssue, goToStage } = useImportWizardStore();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [issueKey, setIssueKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [autocompleteOptions, setAutocompleteOptions] = useState<IssueOption[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

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

  // Keyboard navigation for dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || autocompleteOptions.length === 0) {
      if (e.key === 'Enter' && issueKey.trim()) {
        handleContinue();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < autocompleteOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < autocompleteOptions.length) {
          handleSelectOption(autocompleteOptions[highlightedIndex]);
        } else if (issueKey.trim()) {
          handleContinue();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const validateAndNormalizeIssueKey = (): string | null => {
    setValidationError(null);

    if (!issueKey.trim()) {
      setValidationError('Issue key/ID is required');
      return null;
    }

    const trimmed = issueKey.trim();

    if (platform === 'jira') {
      // Jira format: PROJECT-123 or PROJECT123 (auto-correct)
      const jiraKeyRegex = /^[A-Z][A-Z0-9]*-?\d+$/;
      if (!jiraKeyRegex.test(trimmed)) {
        setValidationError('Invalid Jira issue key. Expected format: PROJECT-123 or PROJECT123');
        return null;
      }

      // Auto-correct: Convert "PROJECT123" to "PROJECT-123"
      const normalized = trimmed.replace(/^([A-Z][A-Z0-9]*?)(\d+)$/, '$1-$2');
      return normalized;
    } else if (platform === 'linear') {
      // Linear format: FOR-123 or UUID
      const linearKeyRegex = /^([A-Z]+-\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
      if (!linearKeyRegex.test(trimmed)) {
        setValidationError('Invalid Linear issue ID. Expected format: TEAM-123 or UUID');
        return null;
      }
      return trimmed;
    }

    return null;
  };

  const handleSelectOption = async (option: IssueOption) => {
    const selectedKey = platform === 'jira' ? (option.key || '') : (option.identifier || '');

    // Validate that we have a key before proceeding
    if (!selectedKey) {
      setValidationError('No valid issue key/ID selected');
      return;
    }

    // Normalize the key (for Jira, convert PROJECT123 to PROJECT-123)
    let normalizedKey = selectedKey;
    if (platform === 'jira') {
      normalizedKey = selectedKey.replace(/^([A-Z][A-Z0-9]*?)(\d+)$/, '$1-$2');
    }

    setIssueKey(normalizedKey);
    setShowDropdown(false);
    setValidationError(null);

    // Auto-import selected issue
    setIsLoading(true);
    try {
      const issue = platform === 'jira'
        ? await jiraService.importIssue(normalizedKey)
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
      // Extract backend error message
      let message = 'Failed to import issue';

      if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.response?.data?.error) {
        message = err.response.data.error;
      } else if (err.message) {
        message = err.message;
      }

      console.error('Import error:', { status: err.response?.status, data: err.response?.data, error: err });
      onError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = async () => {
    const normalizedKey = validateAndNormalizeIssueKey();
    if (!normalizedKey) return;

    setIsLoading(true);
    try {
      // Fetch full issue details
      const issue = platform === 'jira'
        ? await jiraService.importIssue(normalizedKey)
        : await linearService.importIssue(normalizedKey);

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
      // Extract backend error message more reliably
      let message = 'Failed to import issue';

      if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.response?.data?.error) {
        message = err.response.data.error;
      } else if (err.message) {
        message = err.message;
      }

      console.error('Import error:', { status: err.response?.status, data: err.response?.data, error: err });
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
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => {
            setPlatform('jira');
            setValidationError(null);
          }}
          className={`px-4 py-4 rounded-lg border-2 transition-colors ${
            platform === 'jira'
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-blue-500/50'
          } ${!availability?.jira && platform !== 'jira' ? 'opacity-60' : ''}`}
        >
          <div className="flex flex-col items-center gap-2">
            {/* Jira Icon */}
            <svg className="h-10 w-10 text-[var(--text-secondary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="5" width="6" height="6"/>
              <rect x="13" y="5" width="6" height="6"/>
              <rect x="5" y="13" width="6" height="6"/>
              <rect x="13" y="13" width="6" height="6"/>
            </svg>
            <div className="text-sm font-semibold text-[var(--text)]">Jira</div>
            {availability?.jira ? (
              <div className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-700 font-medium">
                ✓ Connected
              </div>
            ) : (
              <div className="text-xs px-2 py-1 rounded bg-gray-500/20 text-gray-600">
                Connect in Settings
              </div>
            )}
          </div>
        </button>

        <button
          onClick={() => {
            setPlatform('linear');
            setValidationError(null);
          }}
          className={`px-4 py-4 rounded-lg border-2 transition-colors ${
            platform === 'linear'
              ? 'border-purple-500 bg-purple-500/10'
              : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-purple-500/50'
          } ${!availability?.linear && platform !== 'linear' ? 'opacity-60' : ''}`}
        >
          <div className="flex flex-col items-center gap-2">
            {/* Linear Icon - Monochrome */}
            <svg className="h-10 w-10 text-[var(--text-secondary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12h18M18 9l3 3-3 3"/>
            </svg>
            <div className="text-sm font-semibold text-[var(--text)]">Linear</div>
            {availability?.linear ? (
              <div className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-700 font-medium">
                ✓ Connected
              </div>
            ) : (
              <div className="text-xs px-2 py-1 rounded bg-gray-500/20 text-gray-600">
                Connect in Settings
              </div>
            )}
          </div>
        </button>
      </div>

      {platform && (
        <div className="space-y-4">
          {/* Instructions */}
          <div className="p-4 bg-[var(--bg-subtle)] rounded-lg border border-[var(--border)]">
            <p className="text-sm text-[var(--text-secondary)]">
              {platform === 'jira'
                ? 'Enter the Jira issue key (e.g., PROJ-123 or PROJ123 - both formats accepted)'
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
                ref={inputRef}
                type="text"
                value={issueKey}
                onChange={(e) => {
                  setIssueKey(e.target.value);
                  setValidationError(null);
                  setShowDropdown(true);
                  setHighlightedIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (issueKey.trim().length >= 2 && autocompleteOptions.length > 0) {
                    setShowDropdown(true);
                  }
                }}
                placeholder={platform === 'jira' ? 'e.g., KAN-2 or KAN2' : 'e.g., FOR-123 or UUID'}
                className={validationError ? 'border-red-500/50 focus:border-red-500' : ''}
                disabled={isLoading}
                autoComplete="off"
              />

              {/* Autocomplete dropdown with enhanced styling */}
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg)] border border-[var(--border)]/40 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                  {isSearching && (
                    <div className="px-4 py-8 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-[var(--text-tertiary)]" />
                    </div>
                  )}

                  {!isSearching && autocompleteOptions.length === 0 && issueKey.trim().length >= 2 && (
                    <div className="px-4 py-8 text-center">
                      <p className="text-sm text-[var(--text-tertiary)]">No matching issues found</p>
                      <p className="text-xs text-[var(--text-tertiary)]/70 mt-1">
                        Try a different search term
                      </p>
                    </div>
                  )}

                  {!isSearching && autocompleteOptions.length > 0 && (
                    <>
                      {autocompleteOptions.map((option, index) => (
                        <button
                          key={option.id}
                          onClick={() => handleSelectOption(option)}
                          disabled={isLoading}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          onMouseLeave={() => setHighlightedIndex(-1)}
                          className={`w-full text-left px-4 py-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            index === highlightedIndex
                              ? 'bg-[var(--primary)]/10 border-l-2 border-[var(--primary)]'
                              : 'hover:bg-[var(--bg-hover)] border-l-2 border-transparent'
                          } ${index < autocompleteOptions.length - 1 ? 'border-b border-[var(--border)]/20' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              {/* Issue Key/Identifier */}
                              <div className="font-semibold text-sm text-[var(--text)]">
                                {option.key || option.identifier}
                              </div>
                              {/* Issue Title */}
                              <div className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                                {option.title}
                              </div>
                            </div>
                            {/* Checkmark on selection */}
                            {index === highlightedIndex && (
                              <Check className="h-4 w-4 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                            )}
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}

            </div>

            {validationError && (
              <p className="text-xs text-red-600">{validationError}</p>
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
