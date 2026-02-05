'use client';

import React, { useState } from 'react';
import { useWizardStore } from '@tickets/stores/generation-wizard.store';
import { Button } from '@/core/components/ui/button';
import { EditStackModal } from './EditModals/EditStackModal';
import { EditAnalysisModal } from './EditModals/EditAnalysisModal';
import { EditFilesModal } from './EditModals/EditFilesModal';

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
    context,
    loading,
    goBackToInput,
    confirmContextContinue,
  } = useWizardStore();

  // Modal state
  const [stackModalOpen, setStackModalOpen] = useState(false);
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [filesModalOpen, setFilesModalOpen] = useState(false);

  // Collapsible sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['stack', 'analysis', 'files'])
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

  const { stack, analysis, files } = context;

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
              {stack.languages?.length || 0} languages • {stack.frameworks?.length || 0} frameworks
            </p>
          </div>
          <div className="text-2xl text-gray-600 dark:text-gray-400">
            {expandedSections.has('stack') ? '−' : '+'}
          </div>
        </button>
        {expandedSections.has('stack') && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Languages */}
              {stack.languages && stack.languages.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Languages
                  </p>
                  <div className="space-y-1">
                    {stack.languages.map((lang) => (
                      <p key={lang.name} className="text-sm text-gray-600 dark:text-gray-400">
                        {lang.name}
                        {lang.version && ` (${lang.version})`}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Frameworks */}
              {stack.frameworks && stack.frameworks.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Frameworks
                  </p>
                  <div className="space-y-1">
                    {stack.frameworks.map((fw) => (
                      <p key={fw.name} className="text-sm text-gray-600 dark:text-gray-400">
                        {fw.name}
                        {fw.version && ` (${fw.version})`}
                      </p>
                    ))}
                  </div>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">{stack.packageManager}</p>
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

            <button
              onClick={() => setFilesModalOpen(true)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              [Edit Files]
            </button>
          </div>
        )}
      </div>

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
      {filesModalOpen && <EditFilesModal onClose={() => setFilesModalOpen(false)} />}
    </div>
  );
}
