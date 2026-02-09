'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useServices } from '@/hooks/useServices';
import { useSettingsStore } from '@/stores/settings.store';
import { useTicketsStore } from '@/stores/tickets.store';
import { useWizardStore } from '@/tickets/stores/generation-wizard.store';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Lightbulb, Bug, ClipboardList } from 'lucide-react';
import { RepositorySelector } from '../RepositorySelector';
import { BranchSelector } from '../BranchSelector';
import { MarkdownInput } from './MarkdownInput';
import { WizardFileUpload } from './WizardFileUpload';

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
    type,
    priority,
    loading,
    loadingMessage,
    progressPercent,
    setTitle,
    setDescription,
    setRepository,
    setType,
    setPriority,
    analyzeRepository,
    pendingFiles,
    addPendingFile,
    removePendingFile,
  } = useWizardStore();

  // Validation state
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Elapsed time counter
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (loading) {
      setElapsed(0);
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loading]);

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
  const wordCount = input.title.trim().split(/\s+/).filter(Boolean).length;
  const isTitleValid = wordCount >= 2 && input.title.length <= 100;
  const isRepoValid = (input.repoOwner.length > 0 && input.repoName.length > 0) || !!selectedRepository;
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

  const repoError = touchedFields.has('submit') && !isRepoValid ? 'Please select a repository' : '';

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
          setTouchedFields((prev) => new Set([...prev, 'submit']));
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

        {/* TICKET DETAILS CARD */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-4 bg-gray-50/50 dark:bg-gray-900/30">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Ticket Details</h3>

          {/* Type & Priority Selectors */}
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Type
              </label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feature">
                    <span className="inline-flex items-center gap-2">
                      <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                      Feature
                    </span>
                  </SelectItem>
                  <SelectItem value="bug">
                    <span className="inline-flex items-center gap-2">
                      <Bug className="h-3.5 w-3.5 text-red-500" />
                      Bug
                    </span>
                  </SelectItem>
                  <SelectItem value="task">
                    <span className="inline-flex items-center gap-2">
                      <ClipboardList className="h-3.5 w-3.5 text-blue-500" />
                      Task
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Priority
              </label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Low
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-yellow-500" />
                      Medium
                    </span>
                  </SelectItem>
                  <SelectItem value="high">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-orange-500" />
                      High
                    </span>
                  </SelectItem>
                  <SelectItem value="urgent">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      Urgent
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* CONTEXT & DETAILS CARD */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-6 bg-gray-50/50 dark:bg-gray-900/30">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Context & Details</h3>

          {/* Description Input (markdown) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
              <span className="text-gray-500 dark:text-gray-500 font-normal">
                {' '}
                (optional — helps AI understand context)
              </span>
            </label>
            <MarkdownInput
              value={input.description || ''}
              onChange={setDescription}
              placeholder="Describe what you want to build or change. Supports **markdown** formatting."
              maxLength={2000}
              rows={4}
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Attachments
              <span className="text-gray-500 dark:text-gray-500 font-normal">
                {' '}
                (optional — max 5 files, 5MB each)
              </span>
            </label>
            <WizardFileUpload
              files={pendingFiles}
              onAdd={addPendingFile}
              onRemove={removePendingFile}
            />
          </div>
        </div>

        {/* CODE SELECTION CARD */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-4 bg-gray-50/50 dark:bg-gray-900/30">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Code Selection</h3>

          {/* Repository Selection */}
          <RepositorySelector />
          {repoError && (
            <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800">
              <span>⚠️</span>
              <span>{repoError}</span>
            </div>
          )}

          {/* Branch Selection */}
          <BranchSelector />

          {/* Future multi-repo placeholder */}
          <button
            type="button"
            disabled
            className="w-full text-center py-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            + Add another repository (coming soon)
          </button>
        </div>

        {/* Submit Button */}
        <div className="pt-4 space-y-3 flex flex-col items-end">
          <Button
            type="submit"
            disabled={!isFormValid || loading}
            className="px-8"
          >
            {loading ? 'Analyzing...' : 'Next'}
          </Button>

          {/* Progress bar + phase message + elapsed timer */}
          {loading && (
            <div className="space-y-2">
              {/* Progress bar track */}
              <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 dark:bg-blue-400 transition-all duration-700 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Phase message + elapsed time */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{loadingMessage || 'Starting...'}</span>
                <span>{elapsed}s</span>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
