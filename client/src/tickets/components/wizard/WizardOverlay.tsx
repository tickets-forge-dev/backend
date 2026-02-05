'use client';

import React from 'react';

/**
 * Wizard Overlay Component
 *
 * Displays during loading:
 * - Spinner animation
 * - Loading message (operation description)
 *
 * Covers entire wizard during API calls
 */
export function WizardOverlay() {
  return (
    <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-950 rounded-lg p-6 max-w-sm mx-4 shadow-lg">
        <div className="flex flex-col items-center gap-4">
          {/* Spinner */}
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-800 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-gray-900 dark:border-t-gray-50 rounded-full animate-spin" />
          </div>

          {/* Loading Text */}
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
              Processing...
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              This may take a moment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
