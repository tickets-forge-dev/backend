'use client';

import React, { useState } from 'react';
import { useWizardStore } from '@/tickets/stores/generation-wizard.store';
import { Button } from '@/core/components/ui/button';
import { EditStackModal } from './EditModals/EditStackModal';
import { EditAnalysisModal } from './EditModals/EditAnalysisModal';

/**
 * Stage 2: Context Review Component
 *
 * Displays analysis results:
 * - Detected technology stack (framework, versions, languages)
 * - Codebase patterns (architecture, naming, testing)
 * - Important discovered files
 *
 * Features:
 * - [Edit] buttons to modify each section
 * - Collapsible sections on mobile
 * - Navigation: Back to Stage 1, Continue to Stage 3
 */
export function Stage2Context() {
  const {
    input,
    context,
    loading,
    maxRounds,
    goBackToInput,
    confirmContextContinue,
  } = useWizardStore();

  // Modal state
  const [stackModalOpen, setStackModalOpen] = useState(false);
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);

  // Collapsible sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  if (!context) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Loading repository analysis...</p>
      </div>
    );
  }

  const { stack, analysis, files, taskAnalysis } = context;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center sm:text-left">
        <h2 className="text-xl font-medium text-gray-900 dark:text-gray-50 mb-2">
          Review Repository Context
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          We've analyzed your repository. Review the detected context below and edit if needed.
        </p>
      </div>

      {/* User Input Section */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('userInput')}
          className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between"
          aria-expanded={expandedSections.has('userInput')}
        >
          <div className="text-left">
            <h3 className="font-medium text-gray-900 dark:text-gray-50">User Input</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {input.title}
            </p>
          </div>
          <div className="text-2xl text-gray-600 dark:text-gray-400">
            {expandedSections.has('userInput') ? '−' : '+'}
          </div>
        </button>
        {expandedSections.has('userInput') && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {input.title}
              </p>
            </div>

            {input.description && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {input.description}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stack Section */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('stack')}
          className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between"
          aria-expanded={expandedSections.has('stack')}
        >
          <div className="text-left">
            <h3 className="font-medium text-gray-900 dark:text-gray-50">Detected Technology Stack</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {stack.language?.name || 'Unknown'}{stack.framework ? ` • ${stack.framework.name}` : ''}
            </p>
          </div>
          <div className="text-2xl text-gray-600 dark:text-gray-400">
            {expandedSections.has('stack') ? '−' : '+'}
          </div>
        </button>
        {expandedSections.has('stack') && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Language */}
              {stack.language && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Language
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stack.language.name}
                  </p>
                </div>
              )}

              {/* Framework */}
              {stack.framework && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Framework
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stack.framework.name}
                    {stack.framework.version && ` (${stack.framework.version})`}
                  </p>
                </div>
              )}
            </div>

            {/* Other Stack Info */}
            {stack.buildTools && stack.buildTools.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Build Tools
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stack.buildTools.join(', ')}
                </p>
              </div>
            )}

            {stack.packageManager && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Package Manager
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {typeof stack.packageManager === 'string'
                    ? stack.packageManager
                    : stack.packageManager.type}
                  {stack.packageManager.version && ` (${stack.packageManager.version})`}
                </p>
              </div>
            )}

            <button
              onClick={() => setStackModalOpen(true)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              [Edit Stack]
            </button>
          </div>
        )}
      </div>

      {/* Analysis Section */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('analysis')}
          className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between"
          aria-expanded={expandedSections.has('analysis')}
        >
          <div className="text-left">
            <h3 className="font-medium text-gray-900 dark:text-gray-50">Codebase Patterns</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Architecture, naming conventions, testing strategy
            </p>
          </div>
          <div className="text-2xl text-gray-600 dark:text-gray-400">
            {expandedSections.has('analysis') ? '−' : '+'}
          </div>
        </button>
        {expandedSections.has('analysis') && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {analysis.architecture && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Architecture
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {analysis.architecture.type}
                    {analysis.architecture.confidence && ` (${analysis.architecture.confidence}% confident)`}
                  </p>
                </div>
              )}

              {analysis.naming && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Naming Convention
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {analysis.naming.files}
                  </p>
                </div>
              )}
            </div>

            {analysis.testing && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Testing
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {analysis.testing.runner || 'Not detected'} •{' '}
                  {analysis.testing.location}
                </p>
              </div>
            )}

            {analysis.stateManagement && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  State Management
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {analysis.stateManagement.type}
                </p>
              </div>
            )}

            <button
              onClick={() => setAnalysisModalOpen(true)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              [Edit Patterns]
            </button>
          </div>
        )}
      </div>

      {/* Files Section */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('files')}
          className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between"
          aria-expanded={expandedSections.has('files')}
        >
          <div className="text-left">
            <h3 className="font-medium text-gray-900 dark:text-gray-50">Important Files</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {files.length} files identified
            </p>
          </div>
          <div className="text-2xl text-gray-600 dark:text-gray-400">
            {expandedSections.has('files') ? '−' : '+'}
          </div>
        </button>
        {expandedSections.has('files') && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {files.map((file) => (
                <div
                  key={file.path}
                  className="flex items-start gap-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <span className="text-gray-400 dark:text-gray-600 mt-0.5">
                    {file.isDirectory ? '📁' : '📄'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono text-gray-700 dark:text-gray-300 break-all">
                      {file.path}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>

      {/* Task Analysis Section */}
      {taskAnalysis ? (
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('taskAnalysis')}
            className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between"
            aria-expanded={expandedSections.has('taskAnalysis')}
          >
            <div className="text-left">
              <h3 className="font-medium text-gray-900 dark:text-gray-50">Task Analysis</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {taskAnalysis.filesToModify.length} files to modify
                {taskAnalysis.filesToCreate.length > 0 && ` • ${taskAnalysis.filesToCreate.length} to create`}
                {taskAnalysis.risks.length > 0 && ` • ${taskAnalysis.risks.length} risks`}
              </p>
            </div>
            <div className="text-2xl text-gray-600 dark:text-gray-400">
              {expandedSections.has('taskAnalysis') ? '−' : '+'}
            </div>
          </button>
          {expandedSections.has('taskAnalysis') && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 space-y-6">
              {/* Files to Modify */}
              {taskAnalysis.filesToModify.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Files to Modify
                  </h4>
                  <div className="space-y-2">
                    {taskAnalysis.filesToModify.map((file) => (
                      <div
                        key={file.path}
                        className="p-3 rounded-md bg-gray-50 dark:bg-gray-800/50"
                      >
                        <p className="text-sm font-mono text-gray-800 dark:text-gray-200">
                          {file.path}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {file.reason}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                          Suggested: {file.suggestedChanges}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Files to Create */}
              {taskAnalysis.filesToCreate.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Files to Create
                  </h4>
                  <div className="space-y-2">
                    {taskAnalysis.filesToCreate.map((file) => (
                      <div
                        key={file.path}
                        className="p-3 rounded-md bg-green-50 dark:bg-green-900/20"
                      >
                        <p className="text-sm font-mono text-gray-800 dark:text-gray-200">
                          {file.path}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {file.reason}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                          Pattern: {file.patternToFollow}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risks */}
              {taskAnalysis.risks.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Risks
                  </h4>
                  <div className="space-y-2">
                    {taskAnalysis.risks.map((risk, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-md bg-gray-50 dark:bg-gray-800/50"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              risk.severity === 'high'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                                : risk.severity === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                            }`}
                          >
                            {risk.severity}
                          </span>
                          <span className="text-sm text-gray-800 dark:text-gray-200">
                            {risk.area}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {risk.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Mitigation: {risk.mitigation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Integration Concerns */}
              {taskAnalysis.integrationConcerns.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Integration Concerns
                  </h4>
                  <div className="space-y-2">
                    {taskAnalysis.integrationConcerns.map((concern, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-md bg-gray-50 dark:bg-gray-800/50"
                      >
                        <p className="text-sm text-gray-800 dark:text-gray-200">
                          {concern.system}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {concern.concern}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                          Recommendation: {concern.recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Implementation Hints */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Implementation Hints
                </h4>
                <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-900/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        taskAnalysis.implementationHints.estimatedComplexity === 'high'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                          : taskAnalysis.implementationHints.estimatedComplexity === 'medium'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                      }`}
                    >
                      {taskAnalysis.implementationHints.estimatedComplexity} complexity
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {maxRounds === 0
                        ? '(no clarification needed)'
                        : maxRounds === 1
                          ? '(1 clarification round)'
                          : `(${maxRounds} clarification rounds)`}
                    </span>
                  </div>
                  {taskAnalysis.implementationHints.existingPatterns.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Patterns to follow:
                      </p>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside">
                        {taskAnalysis.implementationHints.existingPatterns.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {taskAnalysis.implementationHints.conventionsToFollow.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Conventions:
                      </p>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside">
                        {taskAnalysis.implementationHints.conventionsToFollow.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Testing approach:
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {taskAnalysis.implementationHints.testingApproach}
                    </p>
                  </div>
                </div>
              </div>

              {/* LLM files read badge */}
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Analyzed {taskAnalysis.llmFilesRead.length} source files via LLM
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg bg-gray-50 dark:bg-gray-800/30 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Task-specific analysis not available. The LLM analysis may have timed out or degraded gracefully.
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={goBackToInput}
          disabled={loading}
          className="flex-1"
        >
          Back to Input
        </Button>
        <Button
          type="button"
          onClick={confirmContextContinue}
          disabled={loading}
          className="flex-1"
        >
          {loading ? 'Generating Spec...' : 'Context Looks Good, Continue'}
        </Button>
      </div>

      {/* Edit Modals */}
      {stackModalOpen && <EditStackModal onClose={() => setStackModalOpen(false)} />}
      {analysisModalOpen && <EditAnalysisModal onClose={() => setAnalysisModalOpen(false)} />}
    </div>
  );
}
