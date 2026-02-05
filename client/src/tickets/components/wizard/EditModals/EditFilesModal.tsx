'use client';

import React from 'react';
import { Button } from '@/core/components/ui/button';

export function EditFilesModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-950 rounded-lg max-w-md w-full shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-50">
            Edit Discovered Files
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">✕</button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Add, remove, or modify the list of important files discovered during analysis.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={onClose} className="flex-1">Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
