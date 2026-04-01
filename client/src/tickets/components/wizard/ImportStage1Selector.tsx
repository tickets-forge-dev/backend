'use client';

import { useState, useEffect, useRef } from 'react';
import { useServices } from '@/hooks/useServices';
import { useImportWizardStore } from '@/tickets/stores/import-wizard.store';
import { Loader2, Check, Link2 } from 'lucide-react';

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

  // Auto-select platform if only one is available
  useEffect(() => {
    if (!platform) {
      if (availability?.jira && !availability?.linear) setPlatform('jira');
      else if (availability?.linear && !availability?.jira) setPlatform('linear');
    }
  }, [availability, platform, setPlatform]);

  // Autocomplete search
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
      } catch {
        setAutocompleteOptions([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchIssues, 300);
    return () => clearTimeout(debounceTimer);
  }, [issueKey, platform, jiraService, linearService]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || autocompleteOptions.length === 0) {
      if (e.key === 'Enter' && issueKey.trim()) handleContinue();
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => prev < autocompleteOptions.length - 1 ? prev + 1 : prev);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) handleSelectOption(autocompleteOptions[highlightedIndex]);
        else if (issueKey.trim()) handleContinue();
        break;
      case 'Escape':
        setShowDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const validateAndNormalizeIssueKey = (): string | null => {
    setValidationError(null);
    if (!issueKey.trim()) { setValidationError('Issue key is required'); return null; }
    const trimmed = issueKey.trim();
    if (platform === 'jira') {
      const jiraKeyRegex = /^[A-Z][A-Z0-9]*-?\d+$/;
      if (!jiraKeyRegex.test(trimmed)) { setValidationError('Expected format: PROJ-123'); return null; }
      return trimmed.replace(/^([A-Z][A-Z0-9]*?)(\d+)$/, '$1-$2');
    } else if (platform === 'linear') {
      const linearKeyRegex = /^([A-Z]+-\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
      if (!linearKeyRegex.test(trimmed)) { setValidationError('Expected format: TEAM-123'); return null; }
      return trimmed;
    }
    return null;
  };

  const handleSelectOption = async (option: IssueOption) => {
    const selectedKey = platform === 'jira' ? (option.key || '') : (option.identifier || '');
    if (!selectedKey) { setValidationError('No valid issue key'); return; }

    let normalizedKey = selectedKey;
    if (platform === 'jira') normalizedKey = selectedKey.replace(/^([A-Z][A-Z0-9]*?)(\d+)$/, '$1-$2');

    setIssueKey(normalizedKey);
    setShowDropdown(false);
    setValidationError(null);
    setIsLoading(true);

    try {
      const issue = platform === 'jira'
        ? await jiraService.importIssue(normalizedKey)
        : await linearService.importIssue(option.identifier || option.id);

      setSelectedIssue({
        id: issue.importedFrom.issueId,
        key: platform === 'jira' ? option.key : undefined,
        identifier: platform === 'linear' ? option.identifier : undefined,
        title: issue.title,
        description: issue.description || '',
        url: issue.importedFrom.issueUrl,
        mappedType: issue.type || 'task',
        mappedPriority: issue.priority || 'medium',
      });
      goToStage(2);
    } catch (err: any) {
      onError(err.response?.data?.message || err.message || 'Failed to import issue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = async () => {
    const normalizedKey = validateAndNormalizeIssueKey();
    if (!normalizedKey) return;

    setIsLoading(true);
    try {
      const issue = platform === 'jira'
        ? await jiraService.importIssue(normalizedKey)
        : await linearService.importIssue(normalizedKey);

      setSelectedIssue({
        id: issue.importedFrom.issueId,
        key: platform === 'jira' ? normalizedKey : undefined,
        identifier: platform === 'linear' ? normalizedKey : undefined,
        title: issue.title,
        description: issue.description || '',
        url: issue.importedFrom.issueUrl,
        mappedType: issue.type || 'task',
        mappedPriority: issue.priority || 'medium',
      });
      goToStage(2);
    } catch (err: any) {
      onError(err.response?.data?.message || err.message || 'Failed to import issue');
    } finally {
      setIsLoading(false);
    }
  };

  const hasBothPlatforms = availability?.jira && availability?.linear;

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-[15px] font-semibold text-[var(--text)]">Import ticket</h2>
        <p className="text-[12px] text-[var(--text-tertiary)] mt-1">
          Search or paste an issue key to import
        </p>
      </div>

      {/* Platform selector — only show if both are available */}
      {hasBothPlatforms && (
        <div className="inline-flex rounded-lg bg-[var(--bg-hover)] p-0.5">
          {[
            { value: 'jira' as const, label: 'Jira', available: availability?.jira },
            { value: 'linear' as const, label: 'Linear', available: availability?.linear },
          ].map(({ value, label, available }) => (
            <button
              key={value}
              onClick={() => { setPlatform(value); setValidationError(null); setIssueKey(''); }}
              disabled={!available}
              className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                platform === value
                  ? 'bg-[var(--bg)] text-[var(--text)] shadow-sm'
                  : available
                    ? 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                    : 'text-[var(--text-tertiary)]/30 cursor-not-allowed'
              }`}
            >
              {label}
              {available && platform === value && (
                <span className="ml-1.5 text-[9px] text-emerald-500">connected</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Single platform indicator */}
      {!hasBothPlatforms && platform && (
        <div className="flex items-center gap-2 text-[12px] text-[var(--text-tertiary)]">
          <Check className="w-3 h-3 text-emerald-500" />
          <span>{platform === 'jira' ? 'Jira' : 'Linear'} connected</span>
        </div>
      )}

      {/* Search input */}
      {platform && (
        <div className="space-y-3">
          <div className="relative" ref={dropdownRef}>
            <input
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
                if (issueKey.trim().length >= 2 && autocompleteOptions.length > 0) setShowDropdown(true);
              }}
              placeholder={platform === 'jira' ? 'Search or enter key (e.g. KAN-2)' : 'Search or enter ID (e.g. FOR-123)'}
              disabled={isLoading}
              autoComplete="off"
              autoFocus
              className={`w-full rounded-lg border bg-[var(--bg)] px-3 py-2.5 text-[13px] text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:outline-none transition-colors ${
                validationError
                  ? 'border-red-500/50 focus:border-red-500'
                  : 'border-[var(--border-subtle)] focus:border-[var(--text-tertiary)]'
              }`}
            />

            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-3.5 h-3.5 text-[var(--text-tertiary)] animate-spin" />
              </div>
            )}

            {/* Autocomplete dropdown */}
            {showDropdown && !isSearching && autocompleteOptions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg)] rounded-lg border border-[var(--border-subtle)] shadow-lg z-50 max-h-64 overflow-y-auto scrollbar-thin">
                {autocompleteOptions.map((option, index) => (
                  <button
                    key={option.id}
                    onClick={() => handleSelectOption(option)}
                    disabled={isLoading}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full text-left px-3 py-2.5 transition-colors disabled:opacity-50 ${
                      index === highlightedIndex ? 'bg-[var(--bg-hover)]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-mono font-medium text-[var(--text-secondary)] shrink-0">
                        {option.key || option.identifier}
                      </span>
                      <span className="text-[12px] text-[var(--text-tertiary)] truncate">
                        {option.title}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {validationError && (
            <p className="text-[11px] text-red-400">{validationError}</p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => window.history.back()}
              disabled={isLoading}
              className="text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleContinue}
              disabled={!issueKey.trim() || isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--bg-hover)] border border-[var(--border-subtle)] hover:bg-[var(--bg-active)] text-[var(--text)] text-[12px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> Importing...</>
              ) : (
                <><Link2 className="w-3 h-3" /> Import</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Not connected state */}
      {!platform && !availability?.jira && !availability?.linear && (
        <div className="text-center py-8">
          <p className="text-[13px] text-[var(--text-secondary)]">No integrations connected</p>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
            Connect Jira or Linear in Settings to import tickets
          </p>
        </div>
      )}
    </div>
  );
}
