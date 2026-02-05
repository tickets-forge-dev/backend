'use client';

import React, { useState } from 'react';
import { useWizardStore } from '@/tickets/stores/generation-wizard.store';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';

/**
 * Edit Stack Modal Component
 *
 * Allows editing detected technology stack:
 * - Framework names and versions
 * - Languages
 * - Package manager
 * - Build tools
 *
 * Save button updates Zustand store
 * Cancel button closes without saving
 */
export function EditStackModal({ onClose }: { onClose: () => void }) {
  const { context, editStack } = useWizardStore();

  const [frameworks, setFrameworks] = useState(
    context?.stack.frameworks?.map((f: any) => ({ name: f.name, version: f.version })) || []
  );

  const handleSave = () => {
    editStack({
      frameworks: frameworks.map((f: any) => ({
        name: f.name,
        version: f.version,
      })),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-950 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-lg">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-800 p-6 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-950">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-50">
            Edit Technology Stack
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Frameworks
            </label>
            <div className="space-y-3">
              {frameworks.map((fw, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder="Framework name"
                    value={fw.name}
                    onChange={(e) => {
                      const updated = [...frameworks];
                      updated[i].name = e.target.value;
                      setFrameworks(updated);
                    }}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Version"
                    value={fw.version}
                    onChange={(e) => {
                      const updated = [...frameworks];
                      updated[i].version = e.target.value;
                      setFrameworks(updated);
                    }}
                    className="w-24"
                  />
                  <button
                    onClick={() => {
                      setFrameworks(frameworks.filter((_, idx) => idx !== i));
                    }}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    aria-label="Remove framework"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setFrameworks([...frameworks, { name: '', version: '' }])}
              className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              + Add Framework
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-6 flex gap-3 sticky bottom-0 bg-white dark:bg-gray-950">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="flex-1"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
