'use client';

import React, { useState } from 'react';
import { useServices } from '@/hooks/useServices';
import { useSettingsStore } from '@/stores/settings.store';
import { useTicketsStore } from '@/stores/tickets.store';
import { useWizardStore } from '@/tickets/stores/generation-wizard.store';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { RepositorySelector } from '../RepositorySelector';

/**
 * Stage 1: Input Component
 *
 * Captures initial user input:
 * - Ticket title (required, min 3 chars, max 100 chars)
 * - Repository selection (required, fetched from GitHub integration)
 * - Triggers analysis on valid input
 *
 * Validation feedback only on blur (UX principle: no validation on keystroke)
 * Next button disabled until form is valid
 */
export function Stage1Input() {
  const { gitHubService } = useServices();
  const { loadGitHubStatus } = useSettingsStore();
  const { selectedRepository } = useTicketsStore();
  const {
    input,
    loading,
    setTitle,
    setRepository,
    analyzeRepository,
  } = useWizardStore();

  // Validation state
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Load GitHub status on mount to get real repositories
  React.useEffect(() => {
    loadGitHubStatus(gitHubService);
  }, []);

  // Sync tickets store repository selection to wizard store
  React.useEffect(() => {
    if (selectedRepository) {
      const [owner, name] = selectedRepository.split('/');
      if (owner && name) {
        setRepository(owner, name);
      }
    }
  }, [selectedRepository, setRepository]);

  // Form validation
  const isTitleValid = input.title.length >= 3 && input.title.length <= 100;
  const isRepoValid = input.repoOwner.length > 0 && input.repoName.length > 0;
  const isFormValid = isTitleValid && isRepoValid;

  // Validation messages
  const titleError = touchedFields.has('title')
    ? input.title.length === 0
      ? 'Title is required'
      : input.title.length < 3
        ? 'Title must be at least 3 characters'
        : input.title.length > 100
          ? 'Title must be 100 characters or less'
          : ''
    : '';

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleTitleBlur = () => {
    setTouchedFields((prev) => new Set([...prev, 'title']));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center sm:text-left">
        <h2 className="text-xl font-medium text-gray-900 dark:text-gray-50 mb-2">
          Create Executable Ticket
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Describe your ticket idea and select a repository for code-aware analysis.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isFormValid) {
            analyzeRepository();
          }
        }}
        className="space-y-6"
      >
        {/* Title Input */}
        <div className="space-y-2">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Ticket Title
            <span className="text-gray-500 dark:text-gray-500 font-normal">
              {' '}
              (required)
            </span>
          </label>
          <Input
            id="title"
            type="text"
            placeholder="Add user authentication with Zustand"
            value={input.title}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            maxLength={100}
            autoFocus
            aria-invalid={titleError ? 'true' : 'false'}
            aria-describedby={titleError ? 'title-error' : undefined}
            className="w-full"
          />
          <div className="flex items-center justify-between">
            {titleError && (
              <span
                id="title-error"
                role="alert"
                className="text-xs text-red-600 dark:text-red-400"
              >
                {titleError}
              </span>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
              {input.title.length}/100
            </span>
          </div>
        </div>

        {/* Repository Selection - Uses Real GitHub Integration */}
        <RepositorySelector />

        {/* Submit Button */}
        <div className="pt-4 flex gap-3">
          <Button
            type="submit"
            disabled={!isFormValid || loading}
            className="flex-1"
          >
            {loading ? 'Loading...' : 'Next'}
          </Button>
        </div>
      </form>

      {/* Help Text */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          We'll analyze your repository's technology stack, codebase patterns, and files to generate
          a code-aware specification. This ensures your ticket references actual files and follows
          existing conventions.
        </p>
      </div>
    </div>
  );
}
