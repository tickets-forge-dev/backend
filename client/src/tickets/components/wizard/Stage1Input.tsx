'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useServices } from '@/hooks/useServices';
import { useSettingsStore } from '@/stores/settings.store';
import { useTicketsStore } from '@/stores/tickets.store';
import { useWizardStore } from '@/tickets/stores/generation-wizard.store';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Lightbulb, Bug, ClipboardList, Github, Paperclip } from 'lucide-react';
import { RepositorySelector } from '../RepositorySelector';
import { RepositoryToggle } from '../RepositoryToggle'; // AC#1: Import toggle component
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
    includeRepository, // AC#3: Get repository inclusion flag
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

  // Tab state
  const [activeTab, setActiveTab] = useState<'context' | 'materials'>('context');

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

  // Form validation (AC#1: Repository optional when includeRepository is false)
  const wordCount = input.title.trim().split(/\s+/).filter(Boolean).length;
  const isTitleValid = wordCount >= 2 && input.title.length <= 500;
  const isRepoValid = !includeRepository || (input.repoOwner.length > 0 && input.repoName.length > 0) || !!selectedRepository;
  const isFormValid = isTitleValid && isRepoValid;

  // Validation messages
  const titleError = touchedFields.has('title')
    ? input.title.length === 0
      ? 'Title is required'
      : input.title.length < 3
        ? 'Title must be at least 3 characters'
        : input.title.length > 500
          ? 'Title must be 500 characters or less'
          : ''
    : '';

  const handleTitleChange = (value: string) => {
    setTitle(value);
  };

  const handleTitleBlur = () => {
    setTouchedFields((prev) => new Set([...prev, 'title']));
  };

  const repoError = touchedFields.has('submit') && !isRepoValid ? 'Please select a repository' : '';

  return (
    <div className="space-y-5">
      {/* Type & Priority */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wide">
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

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wide">
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

      {/* Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setTouchedFields((prev) => new Set([...prev, 'submit']));
          if (isFormValid) {
            analyzeRepository();
          }
        }}
        className="space-y-4"
      >
        {/* Description Section - Primary focus area */}
        <div className="space-y-3 p-5 rounded-lg border-2 border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/10 shadow-sm">
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
            Ticket Description
          </label>
          <MarkdownInput
            value={input.title}
            onChange={handleTitleChange}
            placeholder="e.g. As a user, I want to reset my password so that I can regain access to my account if I forget it."
            maxLength={500}
            rows={3}
            autoFocus={true}
          />
          {titleError && (
            <span
              id="title-error"
              role="alert"
              className="text-xs text-red-600 dark:text-red-400"
            >
              {titleError}
            </span>
          )}
        </div>

        {/* AC#1, #5: Repository Toggle - Place above tabs */}
        <RepositoryToggle />

        {/* TABBED CONTEXT SECTION - Codebase + Attachments */}
        {/* AC#1: Hide "Codebase to Scan" tab when includeRepository is false */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50/50 dark:bg-gray-900/30 overflow-hidden">
          <Tabs value={includeRepository ? activeTab : 'materials'} onValueChange={(val) => setActiveTab(val as 'context' | 'materials')}>
            <TabsList className="w-full rounded-none border-b border-gray-200 dark:border-gray-800 bg-transparent px-0 py-0">
              {includeRepository && (
                <TabsTrigger
                  value="context"
                  className="flex-1 rounded-none border-b-2 border-transparent py-3 text-xs font-medium uppercase tracking-wide data-[state=active]:border-blue-500 data-[state=active]:text-gray-900 data-[state=active]:dark:text-gray-100"
                >
                  <Github className="w-3.5 h-3.5 mr-1.5" />
                  Codebase to Scan
                </TabsTrigger>
              )}
              <TabsTrigger
                value="materials"
                className="flex-1 rounded-none border-b-2 border-transparent py-3 text-xs font-medium uppercase tracking-wide data-[state=active]:border-blue-500 data-[state=active]:text-gray-900 data-[state=active]:dark:text-gray-100"
              >
                <Paperclip className="w-3.5 h-3.5 mr-1.5" />
                Reference Materials
              </TabsTrigger>
            </TabsList>

            {/* Context Tab - Repository & Branch (AC#1: Only shown when includeRepository is true) */}
            {includeRepository && (
              <TabsContent value="context" className="p-5 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Codebase to Scan
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Select the repository we&apos;ll analyze to understand your codebase structure, technology stack, and generate implementation-ready tickets based on the actual code.
                  </p>
                </div>

                {/* Repository Selection */}
                <RepositorySelector />
                {repoError && (
                  <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800">
                    <span>⚠️</span>
                    <span>{repoError}</span>
                  </div>
                )}

                {/* Branch Selection */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-400">
                    Branch to Analyze
                  </p>
                  <BranchSelector hideLabel={true} />
                </div>

                {/* Future multi-repo placeholder */}
                <button
                  type="button"
                  disabled
                  className="w-full text-center py-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  + Add another repository (coming soon)
                </button>
              </TabsContent>
            )}

            {/* Materials Tab - File Upload */}
            <TabsContent value="materials" className="p-5">
              <WizardFileUpload
                files={pendingFiles}
                onAdd={addPendingFile}
                onRemove={removePendingFile}
              />
            </TabsContent>
          </Tabs>
        </div>
      </form>
    </div>
  );
}
