'use client';

import React from 'react';
import { useWizardStore } from '@/tickets/stores/generation-wizard.store';
import { Stage1Input } from './wizard/Stage1Input';
import { Stage2Context } from './wizard/Stage2Context';
// import { Stage3Draft } from './wizard/Stage3Draft'; // Legacy - using ticket detail page for questions
import { Stage4Review } from './wizard/Stage4Review';
import { StageIndicator } from './wizard/StageIndicator';
import { WizardOverlay } from './wizard/WizardOverlay';

/**
 * GenerationWizard Container Component
 *
 * Orchestrates the 4-stage ticket generation wizard:
 * 1. Input: User enters title and selects repository
 * 2. Context: Reviews detected stack, patterns, and files
 * 3. Draft: Reviews generated spec and answers clarification questions
 * 4. Review: Final review before ticket creation
 *
 * Manages:
 * - Conditional rendering of stages
 * - Loading overlay during API calls
 * - Error display and retry logic
 * - Stage navigation (forward and backward)
 * - Overall wizard flow
 */
export function GenerationWizard() {
  const {
    currentStage,
    loading,
    error,
    setError,
    reset,
  } = useWizardStore();

  return (
    <div className="relative w-full h-full bg-white dark:bg-gray-950">
      {/* Stage Indicator */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6">
          <StageIndicator currentStage={currentStage} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
        {/* Stage 1: Input */}
        {currentStage === 1 && <Stage1Input />}

        {/* Stage 2: Context Review */}
        {currentStage === 2 && <Stage2Context />}

        {/* Stage 3: Draft Review & Questions */}
        {/* DISABLED: Questions are now handled in ticket detail page */}
        {currentStage === 3 && <div className="text-center py-8"><p>Redirecting to ticket detail...</p></div>}

        {/* Stage 4: Final Review & Create */}
        {currentStage === 4 && <Stage4Review />}
      </div>

      {/* Loading Overlay */}
      {loading && <WizardOverlay />}

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-w-sm z-50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
